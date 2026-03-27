"""
Telnyx Number Management
Search, purchase, and manage real virtual phone numbers
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import os
import telnyx
from motor.motor_asyncio import AsyncIOMotorClient
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class NumberSearchRequest(BaseModel):
    country_code: str = "US"
    area_code: Optional[str] = None
    contains: Optional[str] = None
    limit: int = 20

class AvailableNumber(BaseModel):
    phone_number: str
    country_code: str
    features: List[str]
    monthly_cost: float
    setup_cost: float
    region: str

class NumberPurchaseRequest(BaseModel):
    phone_number: str
    user_id: str

@router.post("/telnyx/numbers/search")
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def search_available_numbers(request: NumberSearchRequest):
    """Search for available phone numbers via Telnyx API"""
    try:
        # Check if Telnyx is configured
        if not os.environ.get('TELNYX_API_KEY'):
            logger.warning("Telnyx not configured, returning mock data")
            return {
                "numbers": [],
                "message": "Telnyx integration pending - API key required",
                "mock_mode": True
            }
        
        # Build search filters
        filters = {
            "filter[country_code]": request.country_code,
            "filter[limit]": request.limit,
            "filter[features][]": ["sms", "voice"],
            "filter[exclude_held_numbers]": True,
        }
        
        if request.area_code:
            filters["filter[national_destination_code]"] = request.area_code
        
        if request.contains:
            filters["filter[contains]"] = request.contains
        
        # Search via Telnyx API
        logger.info(f"Searching Telnyx numbers: {request.country_code}")
        response = telnyx.AvailablePhoneNumber.list(**filters)
        
        numbers = []
        for num in response.data:
            numbers.append(AvailableNumber(
                phone_number=num.phone_number,
                country_code=request.country_code,
                features=num.features if hasattr(num, 'features') else ["sms", "voice"],
                monthly_cost=float(num.cost_information.get("monthly_cost", "1.00")) if hasattr(num, 'cost_information') else 1.00,
                setup_cost=float(num.cost_information.get("upfront_cost", "0")) if hasattr(num, 'cost_information') else 0.0,
                region=num.region_information[0].get("region_name", "") if hasattr(num, 'region_information') and num.region_information else ""
            ))
        
        logger.info(f"Found {len(numbers)} available numbers")
        
        return {
            "numbers": [n.dict() for n in numbers],
            "total": len(numbers),
            "country": request.country_code,
            "mock_mode": False
        }
        
    except Exception as e:
        logger.error(f"Telnyx search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Number search failed: {str(e)}")

@router.post("/telnyx/numbers/purchase")
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def purchase_phone_number(request: NumberPurchaseRequest):
    """Purchase a phone number from Telnyx"""
    try:
        # Check if Telnyx is configured
        if not os.environ.get('TELNYX_API_KEY'):
            logger.warning("Telnyx not configured, cannot purchase")
            raise HTTPException(
                status_code=503,
                detail="Telnyx integration not configured. Please add TELNYX_API_KEY to environment."
            )
        
        # Check if user has sufficient balance
        user = await db.users.find_one({"id": request.user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        wallet = await db.wallets.find_one({"user_id": request.user_id}, {"_id": 0})
        if not wallet or wallet.get("balance", 0) < 2.99:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        # Purchase number from Telnyx
        logger.info(f"Purchasing number {request.phone_number} for user {request.user_id}")
        
        order = telnyx.NumberOrder.create(
            phone_numbers=[{"phone_number": request.phone_number}]
        )
        
        # Save to database
        phone_number_doc = {
            "phone_number": request.phone_number,
            "user_id": request.user_id,
            "status": "active",
            "telnyx_id": order.id,
            "country": "US",  # Extract from number format
            "monthly_cost": 2.99,
            "purchased_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.phone_numbers.insert_one(phone_number_doc)
        
        # Deduct from wallet
        new_balance = wallet["balance"] - 2.99
        await db.wallets.update_one(
            {"user_id": request.user_id},
            {"$set": {"balance": new_balance}}
        )
        
        # Create transaction
        transaction = {
            "user_id": request.user_id,
            "type": "number_purchase",
            "amount": -2.99,
            "balance_after": new_balance,
            "phone_number": request.phone_number,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        logger.info(f"Number purchased successfully: {request.phone_number}")
        
        return {
            "success": True,
            "phone_number": request.phone_number,
            "order_id": order.id,
            "new_balance": new_balance,
            "message": "Phone number purchased successfully!"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Purchase error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Purchase failed: {str(e)}")

@router.get("/telnyx/numbers/my-numbers/{user_id}")
async def get_user_numbers(user_id: str):
    """Get all phone numbers owned by user"""
    try:
        numbers = await db.phone_numbers.find(
            {"user_id": user_id, "status": "active"},
            {"_id": 0}
        ).to_list(100)
        
        return {
            "numbers": numbers,
            "total": len(numbers)
        }
        
    except Exception as e:
        logger.error(f"Error fetching user numbers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/telnyx/numbers/{phone_number}")
async def release_phone_number(phone_number: str, user_id: str):
    """Release a phone number back to Telnyx"""
    try:
        # Check ownership
        number_doc = await db.phone_numbers.find_one(
            {"phone_number": phone_number, "user_id": user_id},
            {"_id": 0}
        )
        
        if not number_doc:
            raise HTTPException(status_code=404, detail="Number not found or not owned by user")
        
        # Release from Telnyx (if configured)
        if os.environ.get('TELNYX_API_KEY') and number_doc.get("telnyx_id"):
            try:
                telnyx.PhoneNumber.retrieve(number_doc["telnyx_id"]).delete()
                logger.info(f"Number released from Telnyx: {phone_number}")
            except Exception as e:
                logger.warning(f"Telnyx release failed: {str(e)}")
        
        # Update in database
        await db.phone_numbers.update_one(
            {"phone_number": phone_number, "user_id": user_id},
            {"$set": {"status": "deleted", "deleted_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {
            "success": True,
            "message": "Phone number released successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Release error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
