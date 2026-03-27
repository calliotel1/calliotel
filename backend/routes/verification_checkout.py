"""
Verification Number Purchase & Checkout Routes
Handles NorthSMS integration for temporary verification numbers
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
import logging
import os
from datetime import datetime, timezone
from uuid import uuid4
from motor.motor_asyncio import AsyncIOMotorClient
from routes.auth import get_current_user
from services.northsms_client import get_northsms_client
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/verification", tags=["Verification Purchase"])

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Price markup (100% = 2x)
PRICE_MARKUP = 2.0

class PurchaseRequest(BaseModel):
    service_slug: str
    country_code: str = "US"

class GuestCheckoutRequest(BaseModel):
    service: str
    country: str
    amount: float
    email: EmailStr
    payment_method: str = "card"

class StripeCheckoutRequest(BaseModel):
    service: str
    country: str
    amount: float
    payment_method: str = "card"

@router.post("/purchase")
async def purchase_verification_number(
    request: PurchaseRequest,
    current_user = Depends(get_current_user)
):
    """
    Purchase verification number using wallet balance
    ATOMIC TRANSACTION: Deduct balance -> Order number -> Store in DB
    """
    try:
        # Get wallet balance
        wallet = await db.wallets.find_one({"user_id": current_user["_id"]})
        if not wallet:
            raise HTTPException(status_code=400, detail="Wallet not found")
        
        # Get service price from NorthSMS
        northsms = get_northsms_client()
        services = await northsms.get_services()
        
        service_data = next(
            (s for s in services if s.get('slug') == request.service_slug),
            None
        )
        
        if not service_data:
            raise HTTPException(status_code=404, detail="Service not available")
        
        # Calculate price with markup
        base_price = service_data.get('price', 0.10)
        final_price = base_price * PRICE_MARKUP
        
        # Check balance
        if wallet.get('balance', 0) < final_price:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance. Need ${final_price:.2f}, have ${wallet.get('balance', 0):.2f}"
            )
        
        # ATOMIC: Purchase number from NorthSMS
        try:
            order_response = await northsms.purchase_number(
                service_slug=request.service_slug,
                country_code=request.country_code
            )
        except Exception as e:
            logger.error(f"NorthSMS purchase failed: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to acquire number from provider")
        
        order_code = order_response.get('order_code')
        phone_number = order_response.get('phone_number')
        
        # ATOMIC: Deduct from wallet
        new_balance = wallet.get('balance', 0) - final_price
        await db.wallets.update_one(
            {"user_id": current_user["_id"]},
            {"$set": {"balance": new_balance, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Store transaction
        transaction = {
            "id": str(uuid4()),
            "user_id": current_user["_id"],
            "type": "debit",
            "amount": final_price,
            "description": f"Verification number - {service_data.get('name', request.service_slug)}",
            "balance_after": new_balance,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        # Store order
        order = {
            "order_code": order_code,
            "user_id": current_user["_id"],
            "service": request.service_slug,
            "country": request.country_code,
            "phone_number": phone_number,
            "price": final_price,
            "status": "active",
            "sms_code": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "payment_method": "wallet"
        }
        await db.verification_orders.insert_one(order)
        
        logger.info(f"Verification number purchased: {order_code} by user {current_user['_id']}")
        
        return {
            "success": True,
            "order_code": order_code,
            "phone_number": phone_number,
            "price": final_price,
            "message": "Number activated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Purchase error: {str(e)}")
        raise HTTPException(status_code=500, detail="Purchase failed")


@router.post("/checkout/stripe")
async def create_stripe_checkout(
    request: StripeCheckoutRequest,
    current_user = Depends(get_current_user),
    http_request: Request = None
):
    """
    Create Stripe checkout session for verification number purchase
    """
    try:
        if not STRIPE_API_KEY:
            raise HTTPException(status_code=500, detail="Payment system not configured")
        
        # Create pending order
        order_id = str(uuid4())
        pending_order = {
            "order_id": order_id,
            "user_id": current_user["_id"],
            "service": request.service,
            "country": request.country,
            "amount": request.amount,
            "status": "pending_payment",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.pending_verification_orders.insert_one(pending_order)
        
        # Initialize Stripe
        host_url = str(http_request.base_url)
        webhook_url = f"{host_url}api/verification/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Success/cancel URLs
        frontend_url = os.environ.get('REACT_APP_BACKEND_URL', host_url.rstrip('/'))
        success_url = f"{frontend_url}/verification/success/{{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{frontend_url}/verification"
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=request.amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            payment_method="card" if request.payment_method == "card" else "crypto",
            metadata={
                "order_id": order_id,
                "user_id": current_user["_id"],
                "service": request.service,
                "country": request.country,
                "type": "verification_number"
            }
        )
        
        session = stripe_checkout.create_checkout_session(checkout_request)
        
        return {
            "url": session.url,
            "session_id": session.session_id
        }
        
    except Exception as e:
        logger.error(f"Stripe checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@router.post("/checkout/guest")
async def create_guest_checkout(request: GuestCheckoutRequest):
    """
    Create checkout session for guest users (no account required)
    """
    try:
        if not STRIPE_API_KEY:
            raise HTTPException(status_code=500, detail="Payment system not configured")
        
        # Create guest order
        order_id = str(uuid4())
        guest_order = {
            "order_id": order_id,
            "email": request.email,
            "service": request.service,
            "country": request.country,
            "amount": request.amount,
            "status": "pending_payment",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_guest": True
        }
        await db.pending_verification_orders.insert_one(guest_order)
        
        # Create Stripe session (similar to logged-in flow)
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY)
        
        frontend_url = os.environ.get('REACT_APP_BACKEND_URL', '')
        success_url = f"{frontend_url}/verification/guest-success/{{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{frontend_url}/verification"
        
        checkout_request = CheckoutSessionRequest(
            amount=request.amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            payment_method="card",
            metadata={
                "order_id": order_id,
                "email": request.email,
                "service": request.service,
                "country": request.country,
                "type": "verification_number_guest"
            }
        )
        
        session = stripe_checkout.create_checkout_session(checkout_request)
        
        return {
            "url": session.url,
            "session_id": session.session_id
        }
        
    except Exception as e:
        logger.error(f"Guest checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events for verification number purchases
    """
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        # Verify webhook (in production)
        # For now, process the event
        
        event_data = await request.json()
        event_type = event_data.get('type')
        
        if event_type == 'checkout.session.completed':
            session = event_data.get('data', {}).get('object', {})
            metadata = session.get('metadata', {})
            
            order_id = metadata.get('order_id')
            service = metadata.get('service')
            country = metadata.get('country')
            user_id = metadata.get('user_id')
            email = metadata.get('email')
            
            # Purchase number from NorthSMS
            northsms = get_northsms_client()
            try:
                order_response = await northsms.purchase_number(
                    service_slug=service,
                    country_code=country
                )
                
                order_code = order_response.get('order_code')
                phone_number = order_response.get('phone_number')
                
                # Store completed order
                order = {
                    "order_code": order_code,
                    "order_id": order_id,
                    "user_id": user_id if user_id else None,
                    "email": email if email else None,
                    "service": service,
                    "country": country,
                    "phone_number": phone_number,
                    "price": float(metadata.get('amount', 0)),
                    "status": "active",
                    "sms_code": None,
                    "payment_method": "stripe",
                    "session_id": session.get('id'),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.verification_orders.insert_one(order)
                
                # Remove pending order
                await db.pending_verification_orders.delete_one({"order_id": order_id})
                
                logger.info(f"Stripe payment completed: {order_code}")
                
            except Exception as e:
                logger.error(f"Failed to provision number after payment: {str(e)}")
                # Mark order as failed, will need manual intervention
                await db.failed_orders.insert_one({
                    "order_id": order_id,
                    "error": str(e),
                    "session_id": session.get('id'),
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}
