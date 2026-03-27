"""
AI Settings Router
User preferences for AI features (Smart Replies, Translation)
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import logging
import os
from dotenv import load_dotenv
from routes.auth import get_current_user

load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class AISettings(BaseModel):
    smart_replies_enabled: bool = True
    translation_enabled: bool = True
    preferred_translation_language: str = "English"
    quick_translate_language: str = "English"
    ai_tone: str = "friendly"  # friendly, professional, casual

@router.get("/")
async def get_ai_settings(current_user = Depends(get_current_user)):
    """
    Get user's AI settings
    """
    try:
        settings = await db.ai_settings.find_one(
            {"user_id": current_user["_id"]},
            {"_id": 0}
        )
        
        if not settings:
            # Return default settings
            return {
                "success": True,
                "settings": {
                    "smart_replies_enabled": True,
                    "translation_enabled": True,
                    "preferred_translation_language": "English",
                    "quick_translate_language": "English",
                    "ai_tone": "friendly"
                }
            }
        
        return {
            "success": True,
            "settings": {
                "smart_replies_enabled": settings.get("smart_replies_enabled", True),
                "translation_enabled": settings.get("translation_enabled", True),
                "preferred_translation_language": settings.get("preferred_translation_language", "English"),
                "quick_translate_language": settings.get("quick_translate_language", "English"),
                "ai_tone": settings.get("ai_tone", "friendly")
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching AI settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch AI settings")

@router.post("/")
async def update_ai_settings(
    settings: AISettings,
    current_user = Depends(get_current_user)
):
    """
    Update user's AI settings
    """
    try:
        settings_doc = {
            "user_id": current_user["_id"],
            "smart_replies_enabled": settings.smart_replies_enabled,
            "translation_enabled": settings.translation_enabled,
            "preferred_translation_language": settings.preferred_translation_language,
            "quick_translate_language": settings.quick_translate_language,
            "ai_tone": settings.ai_tone,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Upsert settings
        await db.ai_settings.update_one(
            {"user_id": current_user["_id"]},
            {"$set": settings_doc, "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        
        logger.info(f"AI settings updated for user {current_user['_id']}")
        
        return {
            "success": True,
            "message": "AI settings updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error updating AI settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update AI settings")
