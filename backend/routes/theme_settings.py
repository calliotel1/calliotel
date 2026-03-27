"""
Theme Settings Router
User preferences for dark mode and theme customization
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import logging
import os
from routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class ThemeSettings(BaseModel):
    dark_mode: bool = False
    theme_color: str = "purple"  # purple, blue, green, orange

@router.get("/")
async def get_theme_settings(current_user = Depends(get_current_user)):
    """
    Get user's theme settings
    """
    try:
        settings = await db.theme_settings.find_one(
            {"user_id": current_user["_id"]},
            {"_id": 0}
        )
        
        if not settings:
            # Return default settings
            return {
                "success": True,
                "settings": {
                    "dark_mode": False,
                    "theme_color": "purple"
                }
            }
        
        return {
            "success": True,
            "settings": {
                "dark_mode": settings.get("dark_mode", False),
                "theme_color": settings.get("theme_color", "purple")
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching theme settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch theme settings")

@router.post("/update")
async def update_theme_settings(
    settings: ThemeSettings,
    current_user = Depends(get_current_user)
):
    """
    Update user's theme settings
    """
    try:
        settings_dict = {
            "user_id": current_user["_id"],
            "dark_mode": settings.dark_mode,
            "theme_color": settings.theme_color,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Upsert settings
        await db.theme_settings.update_one(
            {"user_id": current_user["_id"]},
            {"$set": settings_dict},
            upsert=True
        )
        
        logger.info(f"Theme settings updated for user {current_user['_id']}: dark_mode={settings.dark_mode}")
        
        return {
            "success": True,
            "message": "Theme settings updated successfully",
            "settings": {
                "dark_mode": settings.dark_mode,
                "theme_color": settings.theme_color
            }
        }
        
    except Exception as e:
        logger.error(f"Error updating theme settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update theme settings")

@router.post("/toggle-dark-mode")
async def toggle_dark_mode(current_user = Depends(get_current_user)):
    """
    Quick toggle dark mode on/off
    """
    try:
        # Get current settings
        settings = await db.theme_settings.find_one(
            {"user_id": current_user["_id"]}
        )
        
        if not settings:
            # Create with dark mode enabled
            new_dark_mode = True
        else:
            # Toggle current value
            new_dark_mode = not settings.get("dark_mode", False)
        
        # Update
        await db.theme_settings.update_one(
            {"user_id": current_user["_id"]},
            {
                "$set": {
                    "dark_mode": new_dark_mode,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        
        logger.info(f"Dark mode toggled for user {current_user['_id']}: {new_dark_mode}")
        
        return {
            "success": True,
            "dark_mode": new_dark_mode
        }
        
    except Exception as e:
        logger.error(f"Error toggling dark mode: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to toggle dark mode")
