from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
import logging
import os
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    CheckoutSessionRequest
)

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Payment Packages (SECURITY: Never accept amounts from frontend!)
CREDIT_PACKAGES = {
    "starter": {"amount": 10.00, "credits": 10.00, "name": "Starter Pack"},
    "basic": {"amount": 25.00, "credits": 27.00, "name": "Basic Pack (+$2 bonus)"},
    "pro": {"amount": 50.00, "credits": 55.00, "name": "Pro Pack (+$5 bonus)"},
    "premium": {"amount": 100.00, "credits": 115.00, "name": "Premium Pack (+$15 bonus)"}
}

class CreateCheckoutRequest(BaseModel):
    package_id: Optional[str] = Field(None, description="Package ID (starter, basic, pro, premium) - Optional if custom_amount provided")
    custom_amount: Optional[float] = Field(None, description="Custom amount in USD (minimum $5)")
    payment_method: str = Field("card", description="Payment method: card or crypto")
    origin_url: str = Field(..., description="Frontend origin URL")

class CheckoutResponse(BaseModel):
    url: str
    session_id: str

@router.post("/create-checkout", response_model=CheckoutResponse)
async def create_checkout(
    request: CreateCheckoutRequest,
    current_user = Depends(get_current_user),
    http_request: Request = None
):
    """
    Create Stripe checkout session for adding credits.
    Supports both card and crypto payments.
    Supports pre-set packages OR custom amounts.
    """
    try:
        if not STRIPE_API_KEY:
            raise HTTPException(status_code=500, detail="Payment system not configured")
        
        # Determine amount and credits
        if request.custom_amount:
            # Custom amount payment
            if request.custom_amount < 5:
                raise HTTPException(status_code=400, detail="Minimum amount is $5")
            if request.custom_amount > 1000:
                raise HTTPException(status_code=400, detail="Maximum amount is $1000")
            
            amount = request.custom_amount
            credits = request.custom_amount  # 1:1 for custom amounts (no bonus)
            package_name = f"Custom ${amount:.2f}"
            package_id = "custom"
        elif request.package_id:
            # Pre-set package
            if request.package_id not in CREDIT_PACKAGES:
                raise HTTPException(status_code=400, detail="Invalid package selected")
            
            package = CREDIT_PACKAGES[request.package_id]
            amount = package["amount"]
            credits = package["credits"]
            package_name = package["name"]
            package_id = request.package_id
        else:
            raise HTTPException(status_code=400, detail="Either package_id or custom_amount is required")
        
        # Initialize Stripe Checkout
        host_url = str(http_request.base_url)
        webhook_url = f"{host_url}api/payments/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Build success/cancel URLs from frontend origin
        success_url = f"{request.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{request.origin_url}/wallet"
        
        # Prepare metadata
        metadata = {
            "user_id": current_user["_id"],
            "package_id": package_id,
            "credits_to_add": str(credits),
            "amount": str(amount),
            "client_id": current_user.get("client_id", ""),
            "email": current_user["email"]
        }
        
        # Determine payment methods
        payment_methods = ["card"]
        if request.payment_method == "crypto":
            payment_methods = ["card", "crypto"]  # Allow both for flexibility
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
            payment_methods=payment_methods
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store payment transaction as PENDING
        payment_doc = {
            "session_id": session.session_id,
            "user_id": current_user["_id"],
            "package_id": package_id,
            "package_name": package_name,
            "amount": amount,
            "credits_to_add": credits,
            "currency": "usd",
            "payment_method": request.payment_method,
            "payment_status": "pending",
            "status": "initiated",
            "metadata": metadata,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "processed": False
        }
        
        await db.payment_transactions.insert_one(payment_doc)
        
        logger.info(f"Checkout session created for {current_user['email']}: {session.session_id}")
        
        return CheckoutResponse(
            url=session.url,
            session_id=session.session_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")

@router.get("/checkout-status/{session_id}")
async def get_checkout_status(
    session_id: str,
    current_user = Depends(get_current_user),
    http_request: Request = None
):
    """
    Get payment status and process successful payments.
    """
    try:
        # Find payment transaction
        payment = await db.payment_transactions.find_one({"session_id": session_id})
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Verify ownership
        if payment["user_id"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # If already processed, return status
        if payment.get("processed"):
            return {
                "status": payment["status"],
                "payment_status": payment["payment_status"],
                "amount": payment["amount"],
                "credits_added": payment.get("credits_added", 0),
                "processed": True
            }
        
        # Check status from Stripe
        host_url = str(http_request.base_url)
        webhook_url = f"{host_url}api/payments/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update payment transaction status
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "status": checkout_status.status,
                    "payment_status": checkout_status.payment_status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # If paid and not yet processed, add credits
        if checkout_status.payment_status == "paid" and not payment.get("processed"):
            credits_to_add = payment["credits_to_add"]
            
            # Get user's wallet
            wallet = await db.wallets.find_one({"user_id": payment["user_id"]})
            
            if wallet:
                new_balance = wallet["balance"] + credits_to_add
                
                # Update wallet
                await db.wallets.update_one(
                    {"user_id": payment["user_id"]},
                    {
                        "$set": {
                            "balance": new_balance,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                # Log transaction
                transaction = {
                    "user_id": payment["user_id"],
                    "type": "credit",
                    "amount": credits_to_add,
                    "description": f"Payment: {payment['package_id']} package",
                    "balance_after": new_balance,
                    "payment_session_id": session_id,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.transactions.insert_one(transaction)
                
                # Mark as processed
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {
                        "$set": {
                            "processed": True,
                            "credits_added": credits_to_add,
                            "new_balance": new_balance,
                            "completed_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                logger.info(f"Credits added: ${credits_to_add} to {payment['user_id']}")
        
        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount": checkout_status.amount_total / 100,  # Convert from cents
            "currency": checkout_status.currency,
            "credits_added": payment.get("credits_added", 0),
            "processed": payment.get("processed", False)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check status: {str(e)}")

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhooks for payment events.
    """
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        if not signature:
            raise HTTPException(status_code=400, detail="No signature")
        
        host_url = str(request.base_url)
        webhook_url = f"{host_url}api/payments/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        logger.info(f"Webhook received: {webhook_response.event_type} - Session: {webhook_response.session_id}")
        
        # Process based on event type
        if webhook_response.payment_status == "paid":
            # Find payment transaction
            payment = await db.payment_transactions.find_one({
                "session_id": webhook_response.session_id
            })
            
            if payment and not payment.get("processed"):
                # Add credits (same logic as status check)
                credits_to_add = payment["credits_to_add"]
                wallet = await db.wallets.find_one({"user_id": payment["user_id"]})
                
                if wallet:
                    new_balance = wallet["balance"] + credits_to_add
                    
                    await db.wallets.update_one(
                        {"user_id": payment["user_id"]},
                        {"$set": {"balance": new_balance, "updated_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    
                    transaction = {
                        "user_id": payment["user_id"],
                        "type": "credit",
                        "amount": credits_to_add,
                        "description": f"Payment: {payment['package_id']} package (webhook)",
                        "balance_after": new_balance,
                        "payment_session_id": webhook_response.session_id,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.transactions.insert_one(transaction)
                    
                    await db.payment_transactions.update_one(
                        {"session_id": webhook_response.session_id},
                        {
                            "$set": {
                                "processed": True,
                                "credits_added": credits_to_add,
                                "completed_at": datetime.now(timezone.utc).isoformat()
                            }
                        }
                    )
                    
                    logger.info(f"Webhook: Credits added ${credits_to_add} to {payment['user_id']}")
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        # Return 200 to prevent Stripe retries
        return {"status": "error", "message": str(e)}

@router.get("/packages")
async def get_packages():
    """
    Get available credit packages.
    """
    return {
        "packages": CREDIT_PACKAGES,
        "currency": "USD"
    }
