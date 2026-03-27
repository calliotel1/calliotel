from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from uuid import uuid4

from routes.auth import get_current_user
from models.telecom import (
    VirtualNumber, SMSMessage, VoiceCall, ProviderConfig,
    NumberStatus, MessageStatus, CallStatus, ProviderType
)

router = APIRouter(prefix="/api/telecom", tags=["Telecom"])

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ============================================
# NUMBER MANAGEMENT
# ============================================

class PurchaseNumberRequest(BaseModel):
    number: str
    provider: str

class BulkPurchaseRequest(BaseModel):
    numbers: List[str]  # List of phone numbers to purchase
    provider: str = "msg91"
    quantity: int  # 10, 25, or 50

@router.get("/numbers/search")
async def search_available_numbers(
    country_code: str = "US",
    contains: Optional[str] = None,
    limit: int = 10
):
    """
    Search for available virtual numbers (PUBLIC endpoint)
    
    This endpoint searches across all configured providers for available numbers.
    In production, this would query provider APIs. For now, returns sample data.
    """
    # TODO: Query actual provider APIs when integrated
    # For now, return sample data
    
    sample_numbers = [
        {
            "number": f"+1202555{str(i).zfill(4)}",
            "country_code": country_code,
            "country": "United States" if country_code == "US" else "Lebanon",
            "provider": "msg91",
            "capabilities": {"sms": True, "voice": True, "mms": False},
            "monthly_cost": 0.99,  # Backend acquisition cost
            "setup_fee": 0.00,
            "selling_price": 2.99,  # Customer-facing price (Empire Margin)
            "is_available": True
        }
        for i in range(limit)
    ]
    
    return {
        "success": True,
        "numbers": sample_numbers,
        "count": len(sample_numbers)
    }

@router.post("/numbers/purchase")
async def purchase_number(
    request: PurchaseNumberRequest,
    current_user = Depends(get_current_user)
):
    """
    Purchase a virtual number
    
    This provisions a number from the provider and assigns it to the user.
    Deducts $2.99 from user wallet and logs transaction.
    """
    user_id = current_user["_id"]
    number = request.number
    provider = request.provider
    
    # Check if number already exists
    existing = await db.virtual_numbers.find_one({"number": number}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Number already taken")
    
    # Check user balance
    wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
    if not wallet or wallet.get("balance", 0) < 2.99:
        raise HTTPException(status_code=400, detail="Insufficient balance. Please add $2.99 to your wallet.")
    
    # Deduct from wallet
    new_balance = wallet["balance"] - 2.99
    await db.wallets.update_one(
        {"user_id": user_id},
        {"$set": {"balance": new_balance, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Log transaction
    transaction_doc = {
        "id": f"txn_{uuid4().hex[:12]}",
        "user_id": user_id,
        "type": "debit",
        "amount": 2.99,
        "description": f"Virtual number purchase: {number}",
        "order_code": None,
        "timestamp": datetime.now(timezone.utc),
        "balance_after": new_balance
    }
    await db.transactions.insert_one(transaction_doc)
    
    # TODO: Actually purchase from provider API
    # For now, create the record
    
    number_doc = {
        "id": f"num_{uuid4().hex[:12]}",
        "number": number,
        "country_code": "US",  # TODO: Parse from number
        "country": "United States",
        "provider": provider,
        "provider_number_id": None,  # TODO: Get from provider
        "user_id": user_id,
        "purchased_at": datetime.now(timezone.utc),
        "expires_at": None,  # Monthly recurring
        "status": "active",
        "capabilities": {"sms": True, "voice": True, "mms": False},
        "monthly_cost": 0.99,  # Backend cost
        "setup_fee": 0.00,
        "selling_price": 2.99,  # Customer price
        "sms_webhook_url": None,
        "voice_webhook_url": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.virtual_numbers.insert_one(number_doc)
    
    return {
        "success": True,
        "message": "Premium number purchased successfully",
        "number": number_doc,
        "new_balance": new_balance
    }

@router.post("/numbers/bulk-purchase")
async def bulk_purchase_numbers(
    request: BulkPurchaseRequest,
    current_user = Depends(get_current_user)
):
    """
    Bulk purchase virtual numbers with tiered discounts
    
    Pricing Tiers (Empire Margin Strategy):
    - 10 numbers: $25.00 ($2.50/ea) → Profit: $15.10 ($1.51 × 10)
    - 25 numbers: $60.00 ($2.40/ea) → Profit: $35.25 ($1.41 × 25)
    - 50 numbers: $110.00 ($2.20/ea) → Profit: $60.50 ($1.21 × 50)
    """
    user_id = current_user["_id"]
    quantity = request.quantity
    
    # Validate quantity and calculate bulk pricing
    bulk_pricing = {
        10: {"total": 25.00, "per_number": 2.50, "savings": 4.90},
        25: {"total": 60.00, "per_number": 2.40, "savings": 14.75},
        50: {"total": 110.00, "per_number": 2.20, "savings": 39.50}
    }
    
    if quantity not in bulk_pricing:
        raise HTTPException(
            status_code=400, 
            detail="Invalid quantity. Choose 10, 25, or 50 numbers."
        )
    
    pricing = bulk_pricing[quantity]
    total_cost = pricing["total"]
    
    # Check user balance
    wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
    if not wallet or wallet.get("balance", 0) < total_cost:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient balance. Please add ${total_cost:.2f} to your wallet."
        )
    
    # Validate that we have enough numbers
    if len(request.numbers) != quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Expected {quantity} numbers but received {len(request.numbers)}"
        )
    
    # Check if any numbers already exist
    for number in request.numbers:
        existing = await db.virtual_numbers.find_one({"number": number}, {"_id": 0})
        if existing:
            raise HTTPException(
                status_code=400, 
                detail=f"Number {number} is already taken"
            )
    
    # Deduct from wallet
    new_balance = wallet["balance"] - total_cost
    await db.wallets.update_one(
        {"user_id": user_id},
        {"$set": {"balance": new_balance, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Log bulk transaction
    transaction_doc = {
        "id": f"txn_{uuid4().hex[:12]}",
        "user_id": user_id,
        "type": "debit",
        "amount": total_cost,
        "description": f"Bulk purchase: {quantity} virtual numbers (${pricing['per_number']}/ea)",
        "order_code": None,
        "timestamp": datetime.now(timezone.utc),
        "balance_after": new_balance,
        "bulk_purchase": True,
        "quantity": quantity,
        "savings": pricing["savings"]
    }
    await db.transactions.insert_one(transaction_doc)
    
    # Create all number records
    purchased_numbers = []
    for number in request.numbers:
        number_doc = {
            "id": f"num_{uuid4().hex[:12]}",
            "number": number,
            "country_code": "US",  # TODO: Parse from number
            "country": "United States",
            "provider": request.provider,
            "provider_number_id": None,  # TODO: Get from provider
            "user_id": user_id,
            "purchased_at": datetime.now(timezone.utc),
            "expires_at": None,  # Monthly recurring
            "status": "active",
            "capabilities": {"sms": True, "voice": True, "mms": False},
            "monthly_cost": 0.99,  # Backend cost
            "setup_fee": 0.00,
            "selling_price": pricing["per_number"],  # Bulk discount price
            "sms_webhook_url": None,
            "voice_webhook_url": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "bulk_purchase": True,
            "bulk_order_id": transaction_doc["id"]
        }
        
        await db.virtual_numbers.insert_one(number_doc)
        # Remove _id for response
        number_doc.pop("_id", None)
        purchased_numbers.append(number_doc)
    
    return {
        "success": True,
        "message": f"Successfully purchased {quantity} premium numbers!",
        "numbers": purchased_numbers,
        "total_cost": total_cost,
        "per_number_cost": pricing["per_number"],
        "savings": pricing["savings"],
        "new_balance": new_balance,
        "transaction_id": transaction_doc["id"]
    }

@router.get("/numbers/my")
async def get_my_numbers(
    current_user = Depends(get_current_user)
):
    """Get user's purchased numbers"""
    user_id = current_user["_id"]
    
    numbers = await db.virtual_numbers.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    return {
        "success": True,
        "numbers": numbers,
        "count": len(numbers)
    }

@router.delete("/numbers/{number_id}")
async def release_number(
    number_id: str,
    current_user = Depends(get_current_user)
):
    """Release/cancel a virtual number"""
    user_id = current_user["_id"]
    
    # Find number
    number = await db.virtual_numbers.find_one(
        {"id": number_id, "user_id": user_id},
        {"_id": 0}
    )
    
    if not number:
        raise HTTPException(status_code=404, detail="Number not found")
    
    # TODO: Release from provider API
    
    # Update status
    await db.virtual_numbers.update_one(
        {"id": number_id},
        {"$set": {
            "status": "cancelled",
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return {
        "success": True,
        "message": "Number released successfully"
    }

# ============================================
# SMS OPERATIONS
# ============================================

class SendSMSRequest(BaseModel):
    from_number: str
    to_number: str
    message: str

@router.post("/sms/send")
async def send_sms(
    request: SendSMSRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """
    Send an SMS message
    
    This routes the message through the appropriate provider.
    """
    user_id = current_user["_id"]
    
    # Verify user owns the from_number
    number = await db.virtual_numbers.find_one(
        {"number": request.from_number, "user_id": user_id},
        {"_id": 0}
    )
    
    if not number:
        raise HTTPException(status_code=403, detail="You don't own this number")
    
    # Create message record
    message_doc = {
        "id": f"msg_{uuid4().hex[:12]}",
        "direction": "outbound",
        "from_number": request.from_number,
        "to_number": request.to_number,
        "message": request.message,
        "status": "pending",
        "provider": number["provider"],
        "provider_message_id": None,
        "user_id": user_id,
        "virtual_number_id": number["id"],
        "cost": 0.01,  # TODO: Calculate actual cost
        "sent_at": None,
        "delivered_at": None,
        "failed_at": None,
        "error_message": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.sms_messages.insert_one(message_doc)
    
    # TODO: Actually send via provider API in background
    # background_tasks.add_task(send_via_provider, message_doc)
    
    # For now, mark as sent immediately
    await db.sms_messages.update_one(
        {"id": message_doc["id"]},
        {"$set": {
            "status": "sent",
            "sent_at": datetime.now(timezone.utc)
        }}
    )
    
    return {
        "success": True,
        "message": "SMS sent successfully",
        "message_id": message_doc["id"]
    }

@router.get("/sms/messages")
async def get_sms_messages(
    number: Optional[str] = None,
    limit: int = 50,
    current_user = Depends(get_current_user)
):
    """Get SMS message history"""
    user_id = current_user["_id"]
    
    query = {"user_id": user_id}
    if number:
        query["$or"] = [
            {"from_number": number},
            {"to_number": number}
        ]
    
    messages = await db.sms_messages.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "success": True,
        "messages": messages,
        "count": len(messages)
    }

@router.post("/sms/webhook/{provider}")
async def sms_webhook(
    provider: str,
    payload: dict
):
    """
    Webhook endpoint for receiving SMS from providers
    
    Different providers will POST here with incoming SMS.
    """
    # TODO: Implement provider-specific webhook handling
    # Each provider has different payload format
    
    return {"success": True, "message": "Webhook received"}

# ============================================
# VOICE OPERATIONS
# ============================================

@router.get("/calls/history")
async def get_call_history(
    number: Optional[str] = None,
    limit: int = 50,
    current_user = Depends(get_current_user)
):
    """Get voice call history"""
    user_id = current_user["_id"]
    
    query = {"user_id": user_id}
    if number:
        query["$or"] = [
            {"from_number": number},
            {"to_number": number}
        ]
    
    calls = await db.voice_calls.find(
        query,
        {"_id": 0}
    ).sort("initiated_at", -1).limit(limit).to_list(limit)
    
    return {
        "success": True,
        "calls": calls,
        "count": len(calls)
    }

# ============================================
# ADMIN & MONITORING
# ============================================

@router.get("/admin/stats")
async def get_telecom_stats(
    current_user = Depends(get_current_user)
):
    """Get telecom statistics"""
    user_id = current_user["_id"]
    
    # Count active numbers
    numbers_count = await db.virtual_numbers.count_documents({
        "user_id": user_id,
        "status": "active"
    })
    
    # Count messages
    messages_count = await db.sms_messages.count_documents({
        "user_id": user_id
    })
    
    # Count calls
    calls_count = await db.voice_calls.count_documents({
        "user_id": user_id
    })
    
    # Calculate costs (last 30 days)
    # TODO: Implement date range query
    
    return {
        "success": True,
        "stats": {
            "active_numbers": numbers_count,
            "total_messages": messages_count,
            "total_calls": calls_count,
            "monthly_cost": numbers_count * 1.00  # Simplified
        }
    }



# ============================================
# SOCIAL PROOF - RECENT PURCHASES
# ============================================

@router.get("/recent-purchases")
async def get_recent_purchases(limit: int = 20, min_quantity: int = 1):
    """
    Get recent virtual number purchases for social proof (PUBLIC endpoint)
    
    Returns anonymized purchase data to display in LiveActivityFeed.
    Filters out test accounts and applies minimum quantity threshold.
    """
    # Query recent transactions for virtual number purchases
    # Exclude transactions with test emails or specific test user_ids
    test_patterns = ["test@", "demo@", "example@"]
    
    # Get recent virtual number purchases
    pipeline = [
        # Match only virtual number purchases (debit transactions)
        {
            "$match": {
                "type": "debit",
                "description": {"$regex": "virtual number|bulk purchase", "$options": "i"}
            }
        },
        # Sort by timestamp descending
        {"$sort": {"timestamp": -1}},
        # Limit results
        {"$limit": limit * 3}  # Get more than needed for filtering
    ]
    
    transactions = await db.transactions.aggregate(pipeline).to_list(limit * 3)
    
    # Get user info for anonymization
    user_ids = list(set([t["user_id"] for t in transactions]))
    users = await db.users.find({"user_id": {"$in": user_ids}}, {"_id": 0, "user_id": 1, "email": 1}).to_list(1000)
    user_map = {u["user_id"]: u for u in users}
    
    # Filter and format purchases
    recent_purchases = []
    for txn in transactions:
        # Skip test accounts
        user = user_map.get(txn["user_id"])
        if user and any(pattern in user.get("email", "").lower() for pattern in test_patterns):
            continue
        
        # Extract quantity from transaction
        quantity = 1
        if txn.get("bulk_purchase"):
            quantity = txn.get("quantity", 1)
        
        # Apply min_quantity filter
        if quantity < min_quantity:
            continue
        
        # Get country info from virtual_numbers if available
        country_code = "US"  # Default
        country_name = "United States"
        
        # Try to get actual country from first purchased number
        if txn.get("bulk_purchase"):
            # For bulk purchases, query virtual_numbers
            sample_number = await db.virtual_numbers.find_one(
                {"user_id": txn["user_id"], "purchased_at": {"$gte": txn["timestamp"]}},
                {"_id": 0, "country_code": 1, "country": 1}
            )
            if sample_number:
                country_code = sample_number.get("country_code", "US")
                country_name = sample_number.get("country", "United States")
        
        # Anonymize user (use first initial + random suffix)
        user_display = "VIP Commander" if quantity >= 50 else "User"
        
        # Format purchase event
        purchase_event = {
            "id": txn["id"],
            "type": "bulk" if txn.get("bulk_purchase") else "single",
            "quantity": quantity,
            "country_code": country_code,
            "country_name": country_name,
            "user_display": user_display,
            "amount": txn["amount"],
            "timestamp": txn["timestamp"].isoformat(),
            "time_ago": format_time_ago(txn["timestamp"])
        }
        
        recent_purchases.append(purchase_event)
        
        if len(recent_purchases) >= limit:
            break
    
    return {
        "success": True,
        "purchases": recent_purchases,
        "count": len(recent_purchases)
    }

def format_time_ago(timestamp: datetime) -> str:
    """Convert datetime to human-readable time ago"""
    now = datetime.now(timezone.utc)
    # Ensure timestamp is timezone-aware
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    diff = now - timestamp
    
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} min ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    else:
        days = int(seconds / 86400)
        return f"{days} day{'s' if days > 1 else ''} ago"
