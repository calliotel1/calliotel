from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class NumberUsageIntent(BaseModel):
    phone_number: str
    intended_use: str  # whatsapp, business, sms_marketing, dating, ai_testing, other
    custom_use: Optional[str] = None

@router.post("/track-intent")
async def track_number_usage_intent(intent: NumberUsageIntent, current_user = Depends(get_current_user)):
    """
    Track what users plan to use their numbers for.
    This helps improve recommendations over time.
    """
    try:
        user_id = current_user["_id"]
        
        # Save intent
        intent_doc = {
            "user_id": user_id,
            "phone_number": intent.phone_number,
            "intended_use": intent.intended_use,
            "custom_use": intent.custom_use,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.number_usage_intents.insert_one(intent_doc)
        
        # Update aggregated stats
        await db.number_usage_stats.update_one(
            {"intended_use": intent.intended_use},
            {
                "$inc": {"count": 1},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )
        
        logger.info(f"Tracked usage intent: {intent.phone_number} -> {intent.intended_use}")
        return {"success": True, "message": "Usage intent tracked"}
        
    except Exception as e:
        logger.error(f"Error tracking usage intent: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to track usage intent")

@router.get("/popular-uses")
async def get_popular_uses():
    """
    Get the most popular use cases for numbers.
    Used to display "Most Popular" badges and trending info.
    """
    try:
        # Get aggregated stats
        stats = await db.number_usage_stats.find({}, {"_id": 0}).sort("count", -1).limit(10).to_list(10)
        
        # Calculate percentages
        total = sum(s["count"] for s in stats)
        
        if total == 0:
            # Return default popular uses if no data yet
            return {
                "popular_uses": [
                    {"use": "whatsapp", "count": 0, "percentage": 0, "trending": True},
                    {"use": "business", "count": 0, "percentage": 0, "trending": True},
                    {"use": "sms_marketing", "count": 0, "percentage": 0, "trending": False},
                ]
            }
        
        popular = []
        for stat in stats:
            popular.append({
                "use": stat["intended_use"],
                "count": stat["count"],
                "percentage": round((stat["count"] / total) * 100, 1),
                "trending": stat["count"] > (total / len(stats)) * 1.5  # 50% above average
            })
        
        return {"popular_uses": popular}
        
    except Exception as e:
        logger.error(f"Error fetching popular uses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch popular uses")

@router.get("/recommendations/{country_code}")
async def get_smart_recommendations(country_code: str):
    """
    Get smart recommendations for a country based on historical data.
    Returns the most popular use cases for numbers from this country.
    """
    try:
        # Get usage intents for numbers from this country
        intents = await db.number_usage_intents.aggregate([
            {
                "$lookup": {
                    "from": "purchased_numbers",
                    "localField": "phone_number",
                    "foreignField": "phone_number",
                    "as": "number_info"
                }
            },
            {"$unwind": "$number_info"},
            {"$match": {"number_info.country_code": country_code}},
            {
                "$group": {
                    "_id": "$intended_use",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]).to_list(5)
        
        recommendations = [
            {
                "use": intent["_id"],
                "count": intent["count"],
                "confidence": "high" if intent["count"] > 10 else "medium" if intent["count"] > 5 else "low"
            }
            for intent in intents
        ]
        
        return {
            "country_code": country_code,
            "recommendations": recommendations
        }
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get recommendations")
