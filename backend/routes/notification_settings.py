"""
Notification Settings Router
User preferences for notification sounds and alerts
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from typing import Optional
import logging
import os
from routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class NotificationSettings(BaseModel):
    # Sound toggles
    new_message_sound: bool = True
    friend_request_sound: bool = True
    friend_accept_sound: bool = True
    story_reaction_sound: bool = True
    mention_sound: bool = True
    
    # General settings
    sound_enabled: bool = True
    volume: int = 80  # 0-100
    sound_theme: str = "default"  # default, chime, bell, pop
    
    # Do Not Disturb
    dnd_enabled: bool = False
    dnd_start_time: Optional[str] = None  # "22:00"
    dnd_end_time: Optional[str] = None    # "08:00"

@router.get("/")
async def get_notification_settings(current_user = Depends(get_current_user)):
    """
    Get user's notification settings
    """
    try:
        settings = await db.notification_settings.find_one(
            {"user_id": current_user["_id"]},
            {"_id": 0}
        )
        
        if not settings:
            # Return default settings
            default_settings = NotificationSettings().model_dump()
            default_settings["user_id"] = current_user["_id"]
            return {
                "success": True,
                "settings": default_settings
            }
        
        return {
            "success": True,
            "settings": settings
        }
        
    except Exception as e:
        logger.error(f"Error fetching notification settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch settings")

@router.post("/update")
async def update_notification_settings(
    settings: NotificationSettings,
    current_user = Depends(get_current_user)
):
    """
    Update user's notification settings
    """
    try:
        settings_dict = settings.model_dump()
        settings_dict["user_id"] = current_user["_id"]
        settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Upsert settings
        await db.notification_settings.update_one(
            {"user_id": current_user["_id"]},
            {"$set": settings_dict},
            upsert=True
        )
        
        logger.info(f"Notification settings updated for user {current_user['_id']}")
        
        return {
            "success": True,
            "message": "Settings updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error updating notification settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update settings")

@router.post("/toggle/{notification_type}")
async def toggle_notification(
    notification_type: str,
    current_user = Depends(get_current_user)
):
    """
    Quick toggle for a specific notification type
    """
    try:
        valid_types = [
            "new_message_sound",
            "friend_request_sound",
            "friend_accept_sound",
            "story_reaction_sound",
            "mention_sound",
            "sound_enabled"
        ]
        
        if notification_type not in valid_types:
            raise HTTPException(status_code=400, detail="Invalid notification type")
        
        # Get current settings
        settings = await db.notification_settings.find_one(
            {"user_id": current_user["_id"]}
        )
        
        if not settings:
            # Create default settings
            settings = NotificationSettings().model_dump()
            settings["user_id"] = current_user["_id"]
            await db.notification_settings.insert_one(settings)
        
        # Toggle the setting
        current_value = settings.get(notification_type, True)
        new_value = not current_value
        
        await db.notification_settings.update_one(
            {"user_id": current_user["_id"]},
            {
                "$set": {
                    notification_type: new_value,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {
            "success": True,
            "notification_type": notification_type,
            "enabled": new_value
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling notification: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to toggle notification")

@router.post("/test-sound")
async def test_notification_sound(current_user = Depends(get_current_user)):
    """
    Test notification sound (frontend will handle playing)
    """
    try:
        settings = await db.notification_settings.find_one(
            {"user_id": current_user["_id"]},
            {"_id": 0}
        )
        
        if not settings:
            settings = NotificationSettings().model_dump()
        
        return {
            "success": True,
            "play_sound": settings.get("sound_enabled", True),
            "volume": settings.get("volume", 80),
            "sound_theme": settings.get("sound_theme", "default")
        }
        
    except Exception as e:
        logger.error(f"Error testing sound: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to test sound")
