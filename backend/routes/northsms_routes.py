"""NorthSMS Platform Verification Routes

API endpoints for purchasing temporary verification numbers and receiving SMS codes.
Integrated with NorthSMS.com for one-time platform verifications (WhatsApp, Telegram, etc.)
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import os
from motor.motor_asyncio import AsyncIOMotorClient
import logging

from routes.auth import get_current_user
from services.northsms_client import get_northsms_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/verification", tags=["Platform Verification"])

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class PurchaseVerificationRequest(BaseModel):
    """Request to purchase a temporary verification number"""
    service_slug: str = Field(..., description="Service slug from NorthSMS (e.g., 'discord', 'whatsapp')")
    country_code: str = Field(default="US", description="ISO2 country code (e.g., 'US', 'CA', 'GB')")

class VerificationOrder(BaseModel):
    """Verification order details"""
    order_code: str
    phone_number: str
    status: str  # active, completed, expired, cancelled
    service: str
    country: str
    sms_code: Optional[str] = None
    user_id: str
    price: float
    created_at: str
    updated_at: Optional[str] = None

class ServiceInfo(BaseModel):
    """Available service information"""
    rate_id: str
    slug: str
    service: str
    icon: str
    country: str
    price: float
    price_range: str


# ============================================
# ENDPOINTS
# ============================================

@router.get("/services", response_model=List[ServiceInfo])
async def get_available_services():
    """Get list of available verification services and their pricing
    
    PUBLIC ENDPOINT - No authentication required
    Returns a curated list of popular services like WhatsApp, Telegram, Instagram, etc.
    """
    try:
        northsms = get_northsms_client()
        services = await northsms.get_available_services()
        return services
    except Exception as e:
        logger.error(f"❌ Failed to fetch services: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch services: {str(e)}")


@router.post("/purchase")
async def purchase_verification(
    request: PurchaseVerificationRequest,
    current_user = Depends(get_current_user)
):
    """Purchase a temporary verification number
    
    Steps:
    1. Call NorthSMS API to create order (gets actual price)
    2. Check user wallet balance
    3. Deduct credits from wallet
    4. Store order in database
    5. Return phone number and order details
    """
    user_id = current_user["_id"]
    
    try:
        # Create order with NorthSMS FIRST (to get actual price)
        northsms = get_northsms_client()
        logger.info(f"🔥 User {user_id} purchasing verification for {request.service_slug} ({request.country_code})")
        order_result = await northsms.create_activation_order(request.service_slug, request.country_code)
        
        if not order_result.get("success"):
            error_msg = order_result.get("error", "Unknown error")
            logger.error(f"❌ NorthSMS order failed: {error_msg}")
            raise HTTPException(status_code=500, detail=f"NorthSMS API error: {error_msg}")
        
        # Get actual price from NorthSMS response
        cost = order_result.get("price", 0.50)  # Fallback to $0.50 if not provided
        order_code = order_result.get("order_code")
        
        if not order_code:
            logger.error("❌ No order code returned from NorthSMS")
            raise HTTPException(status_code=500, detail="Failed to create order: No order code returned")
        
        # Check user wallet balance
        wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
        if not wallet:
            # Cancel the order since we can't charge the user
            await northsms.cancel_order(order_code)
            raise HTTPException(status_code=404, detail="Wallet not found")
        
        balance = wallet.get("balance", 0.0)
        if balance < cost:
            # Cancel the order since user doesn't have enough balance
            await northsms.cancel_order(order_code)
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient balance. Required: ${cost:.2f}, Available: ${balance:.2f}"
            )
        
        # Deduct from wallet
        new_balance = balance - cost
        await db.wallets.update_one(
            {"user_id": user_id},
            {"$set": {"balance": new_balance}}
        )
        
        # Store order in database
        order_doc = {
            "order_code": order_code,
            "user_id": user_id,
            "phone_number": order_result["phone_number"],
            "status": order_result["status"],
            "service": order_result["service"],
            "service_slug": request.service_slug,
            "country": order_result["country"],
            "country_code": request.country_code,
            "price": cost,
            "sms_code": None,
            "expires_at": order_result.get("expires_at"),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.verification_orders.insert_one(order_doc)
        
        # Log transaction
        await db.transactions.insert_one({
            "user_id": user_id,
            "type": "verification_purchase",
            "amount": -cost,
            "description": f"Verification number for {order_result['service']}",
            "order_code": order_code,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"✅ Order {order_code} created. Cost: ${cost:.2f}, New balance: ${new_balance:.2f}")
        
        return {
            "success": True,
            "order_code": order_code,
            "phone_number": order_result["phone_number"],
            "service": order_result["service"],
            "country": order_result["country"],
            "status": order_result["status"],
            "price": cost,
            "new_balance": new_balance,
            "expires_at": order_result.get("expires_at"),
            "message": f"Number purchased! Use {order_result['phone_number']} for verification."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error purchasing verification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to purchase verification: {str(e)}")
        
        return {
            "success": True,
            "order_id": order_result["order_id"],
            "phone_number": order_result["phone_number"],
            "service": order_result["service"],
            "country": order_result["country"],
            "status": order_result["status"],
            "cost": cost,
            "new_balance": new_balance,
            "message": f"Number purchased! Use {order_result['phone_number']} for verification."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error purchasing verification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to purchase verification: {str(e)}")


@router.get("/status/{order_code}")
async def get_verification_status(
    order_code: str,
    current_user = Depends(get_current_user)
):
    """Check the status of a verification order and retrieve SMS code
    
    Poll this endpoint to check if the SMS verification code has been received.
    """
    user_id = current_user["_id"]
    
    try:
        # Check if order belongs to user
        db_order = await db.verification_orders.find_one(
            {"order_code": order_code, "user_id": user_id},
            {"_id": 0}
        )
        
        if not db_order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Fetch latest status from NorthSMS
        northsms = get_northsms_client()
        status_result = await northsms.get_order_status(order_code)
        
        if not status_result.get("success"):
            logger.warning(f"⚠️ Failed to fetch order status from NorthSMS: {status_result.get('error')}")
            # Return cached data from DB
            return db_order
        
        # Update database with latest status
        update_data = {
            "status": status_result["status"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if status_result.get("sms_code"):
            update_data["sms_code"] = status_result["sms_code"]
            logger.info(f"✅ SMS code received for order {order_code}: {status_result['sms_code']}")
        
        await db.verification_orders.update_one(
            {"order_code": order_code},
            {"$set": update_data}
        )
        
        # Return updated data
        updated_order = await db.verification_orders.find_one(
            {"order_code": order_code},
            {"_id": 0}
        )
        
        return updated_order
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching verification status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch status: {str(e)}")


@router.get("/history")
async def get_verification_history(
    limit: int = 20,
    current_user = Depends(get_current_user)
):
    """Get user's verification order history"""
    user_id = current_user["_id"]
    
    try:
        orders = await db.verification_orders.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return {
            "orders": orders,
            "total": len(orders)
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching verification history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")


@router.delete("/cancel/{order_code}")
async def cancel_verification_order(
    order_code: str,
    current_user = Depends(get_current_user)
):
    """Cancel an active verification order and receive automatic refund"""
    user_id = current_user["_id"]
    
    try:
        # Check if order belongs to user and is active
        db_order = await db.verification_orders.find_one(
            {"order_code": order_code, "user_id": user_id},
            {"_id": 0}
        )
        
        if not db_order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if db_order["status"] != "active":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel order with status: {db_order['status']}"
            )
        
        # Cancel with NorthSMS
        northsms = get_northsms_client()
        cancel_result = await northsms.cancel_order(order_code)
        
        if not cancel_result.get("success"):
            raise HTTPException(status_code=500, detail=cancel_result.get("error", "Failed to cancel"))
        
        # Refund to wallet
        cost = db_order.get("price", db_order.get("cost", 0))  # Support both field names
        await db.wallets.update_one(
            {"user_id": user_id},
            {"$inc": {"balance": cost}}
        )
        
        # Update order status
        await db.verification_orders.update_one(
            {"order_code": order_code},
            {"$set": {
                "status": "cancelled",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Log refund transaction
        await db.transactions.insert_one({
            "user_id": user_id,
            "type": "verification_refund",
            "amount": cost,
            "description": f"Refund for cancelled verification order {order_code}",
            "order_code": order_code,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"✅ Order {order_code} cancelled and refunded ${cost:.2f}")
        
        return {
            "success": True,
            "message": "Order cancelled and refunded",
            "refund_amount": cost
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error cancelling order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel order: {str(e)}")
        
        # Log refund transaction
        await db.transactions.insert_one({
            "user_id": user_id,
            "type": "verification_refund",
            "amount": cost,
            "description": f"Refund for cancelled verification order {order_code}",
            "order_code": order_code,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"✅ Order {order_code} cancelled and refunded ${cost:.2f}")
        
        return {
            "success": True,
            "message": "Order cancelled and refunded",
            "refund_amount": cost
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error cancelling order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel order: {str(e)}")
