from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import os
from motor.motor_asyncio import AsyncIOMotorClient
from utils.premium_numbers import is_premium_number, get_premium_badge_color

router = APIRouter()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class PremiumNumber(BaseModel):
    phone_number: str
    country: str
    country_code: str
    tier: str
    price: float
    patterns: List[str]
    last_four: str
    monthly_cost: float
    status: str

class PremiumNumbersResponse(BaseModel):
    numbers: List[PremiumNumber]
    total: int
    platinum_count: int
    gold_count: int
    silver_count: int

@router.get("/premium-numbers", response_model=PremiumNumbersResponse)
async def get_premium_numbers(
    tier: Optional[str] = None,
    country: Optional[str] = None,
    limit: int = 50
):
    """Get all premium/gold numbers available for purchase"""
    try:
        # Get all available numbers from database
        query = {"status": "available"}
        if country:
            query["country"] = country
        
        all_numbers = await db.phone_numbers.find(query, {"_id": 0}).to_list(1000)
        
        # Filter for premium numbers
        premium_numbers = []
        tier_counts = {"platinum": 0, "gold": 0, "silver": 0}
        
        for number_doc in all_numbers:
            phone_number = number_doc.get("phone_number", "")
            premium_info = is_premium_number(phone_number)
            
            if premium_info["is_premium"]:
                number_tier = premium_info["tier"]
                
                # Filter by tier if specified
                if tier and number_tier != tier:
                    continue
                
                tier_counts[number_tier] += 1
                
                premium_numbers.append(PremiumNumber(
                    phone_number=phone_number,
                    country=number_doc.get("country", "USA"),
                    country_code=number_doc.get("country_code", "+1"),
                    tier=number_tier,
                    price=premium_info["price"],
                    patterns=premium_info["patterns"],
                    last_four=premium_info["last_four"],
                    monthly_cost=number_doc.get("monthly_cost", 2.99),
                    status="available"
                ))
        
        # Sort by price (highest first)
        premium_numbers.sort(key=lambda x: x.price, reverse=True)
        
        # Limit results
        premium_numbers = premium_numbers[:limit]
        
        return PremiumNumbersResponse(
            numbers=premium_numbers,
            total=len(premium_numbers),
            platinum_count=tier_counts["platinum"],
            gold_count=tier_counts["gold"],
            silver_count=tier_counts["silver"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching premium numbers: {str(e)}")

@router.post("/premium-numbers/{phone_number}/reserve")
async def reserve_premium_number(phone_number: str, user_id: str):
    """Reserve a premium number for purchase"""
    try:
        # Check if number exists and is available
        number_doc = await db.phone_numbers.find_one(
            {"phone_number": phone_number, "status": "available"},
            {"_id": 0}
        )
        
        if not number_doc:
            raise HTTPException(status_code=404, detail="Number not available")
        
        # Check if it's actually premium
        premium_info = is_premium_number(phone_number)
        if not premium_info["is_premium"]:
            raise HTTPException(status_code=400, detail="Number is not premium")
        
        # Check user balance
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
        if not wallet or wallet.get("balance", 0) < premium_info["price"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient balance. Premium number costs ${premium_info['price']}"
            )
        
        # Reserve the number (mark as pending)
        await db.phone_numbers.update_one(
            {"phone_number": phone_number},
            {"$set": {
                "status": "reserved",
                "reserved_by": user_id,
                "reserved_at": datetime.now(timezone.utc).isoformat(),
                "premium_tier": premium_info["tier"],
                "premium_price": premium_info["price"]
            }}
        )
        
        # Deduct premium price from wallet
        new_balance = wallet["balance"] - premium_info["price"]
        await db.wallets.update_one(
            {"user_id": user_id},
            {"$set": {"balance": new_balance}}
        )
        
        # Create transaction record
        transaction = {
            "user_id": user_id,
            "type": "premium_number_purchase",
            "amount": -premium_info["price"],
            "balance_after": new_balance,
            "phone_number": phone_number,
            "tier": premium_info["tier"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        return {
            "message": "Premium number reserved successfully",
            "phone_number": phone_number,
            "tier": premium_info["tier"],
            "price": premium_info["price"],
            "new_balance": new_balance
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reserving number: {str(e)}")
