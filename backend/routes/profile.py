"""
Profile Management API
Handles Combat Card, Avatar Upload, Mood Status, Featured Achievements
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
from uuid import uuid4
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Tier Badge Calculation
def calculate_tier_badge(total_xp: int) -> dict:
    """Calculate tier badge based on total XP"""
    if total_xp < 100:
        return {"name": "Bronze Rookie", "color": "#CD7F32", "emoji": "🟤"}
    elif total_xp < 500:
        return {"name": "Silver Challenger", "color": "#C0C0C0", "emoji": "⚪"}
    elif total_xp < 1000:
        return {"name": "Gold Warrior", "color": "#FFD700", "emoji": "🟡"}
    elif total_xp < 2500:
        return {"name": "Platinum Elite", "color": "#E5E4E2", "emoji": "🔵"}
    else:
        return {"name": "Divine Legend", "color": "#A855F7", "emoji": "🟣"}

# Models
class MoodUpdate(BaseModel):
    mood_status: str

class FeaturedAchievementsUpdate(BaseModel):
    achievement_ids: List[str]  # Max 3

class AutoTauntSettings(BaseModel):
    auto_taunt_enabled: bool
    taunt_style: str  # "honorable", "ruthless", "silence"
    custom_taunt_message: Optional[str] = None

# Combat Card Endpoint
@router.get("/combat-card/{user_id}")
async def get_combat_card(user_id: str):
    """
    Get full Combat Card data for a user.
    Aggregates: Profile pic, Tier badge, Total XP, Duel stats, Phish stats, Featured achievements
    """
    try:
        # Get user basic info
        user = await db.users.find_one({"_id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get gamification profile
        profile = await db.gamification_profiles.find_one({"user_id": user_id}, {"_id": 0})
        
        if not profile:
            # Create default profile if doesn't exist
            profile = {
                "user_id": user_id,
                "total_points": 0,
                "xp_locked": 0,
                "level": 1,
                "achievements": []
            }
        
        total_xp = profile.get("total_points", 0)
        tier = calculate_tier_badge(total_xp)
        
        # Check if user is admin (The Architect tier)
        is_admin = user.get("is_admin", False)
        if is_admin:
            tier = {"name": "The Architect", "color": "linear-gradient(45deg, #667eea 0%, #764ba2 50%, #f093fb 100%)", "emoji": "👑"}
        
        # Get Duel stats
        total_duels = await db.duels.count_documents({
            "$or": [
                {"challenger_id": user_id, "status": "completed"},
                {"opponent_id": user_id, "status": "completed"}
            ]
        })
        
        duel_wins = await db.duels.count_documents({
            "winner_id": user_id,
            "status": "completed"
        })
        
        duel_losses = total_duels - duel_wins
        duel_win_rate = round((duel_wins / total_duels * 100), 1) if total_duels > 0 else 0
        
        # Get Phish-Finder stats
        phish_games = await db.phish_finder_games.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
        
        if phish_games:
            correct_answers = sum(1 for game in phish_games if game.get("is_correct", False))
            phish_accuracy = round((correct_answers / len(phish_games) * 100), 1)
        else:
            phish_accuracy = 0
        
        # Get featured achievements (user-selected top 3)
        featured_achievement_ids = user.get("featured_achievements", [])
        featured_achievements = []
        
        for ach_id in featured_achievement_ids[:3]:  # Max 3
            # Find achievement details from gamification_profiles
            if ach_id in profile.get("achievements", []):
                # Get achievement metadata (you might have this stored elsewhere)
                featured_achievements.append({
                    "id": ach_id,
                    "name": ach_id.replace("_", " ").title(),
                    "earned": True
                })
        
        # Build Combat Card response
        combat_card = {
            "user_id": user_id,
            "email": user.get("email", ""),
            "full_name": user.get("full_name", ""),
            "client_id": user.get("client_id", ""),
            "profile_picture": user.get("profile_picture", None),
            "mood_status": user.get("mood_status", ""),
            "tier": tier,
            "total_xp": total_xp,
            "level": profile.get("level", 1),
            "duel_stats": {
                "total_duels": total_duels,
                "wins": duel_wins,
                "losses": duel_losses,
                "win_rate": duel_win_rate
            },
            "phish_finder_stats": {
                "total_games": len(phish_games),
                "accuracy": phish_accuracy
            },
            "featured_achievements": featured_achievements,
            "total_achievements": len(profile.get("achievements", []))
        }
        
        return combat_card
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting combat card: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get combat card")

# Avatar Upload
@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Upload profile picture.
    Accepts: JPG, PNG, WEBP
    Max size: 5MB
    """
    try:
        user_id = current_user["_id"]
        
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Use JPG, PNG, or WEBP")
        
        # Validate file size (5MB max)
        temp_file = await file.read()
        file_size = len(temp_file)
        
        if file_size > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(status_code=400, detail="File too large. Max 5MB")
        
        # Save file
        upload_dir = Path("/app/backend/uploads/avatars")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_extension = file.filename.split(".")[-1]
        new_filename = f"{user_id}_{uuid4()}.{file_extension}"
        file_path = upload_dir / new_filename
        
        with open(file_path, "wb") as f:
            f.write(temp_file)
        
        # Update user profile
        avatar_url = f"/uploads/avatars/{new_filename}"
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"profile_picture": avatar_url}}
        )
        
        logger.info(f"Avatar uploaded for user {user_id}: {avatar_url}")
        
        return {
            "success": True,
            "avatar_url": avatar_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading avatar: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload avatar")

# Update Mood Status
@router.put("/mood")
async def update_mood(
    mood_update: MoodUpdate,
    current_user = Depends(get_current_user)
):
    """
    Update mood/status text (max 100 characters).
    Supports emoji.
    """
    try:
        user_id = current_user["_id"]
        mood = mood_update.mood_status.strip()
        
        # Validate length
        if len(mood) > 100:
            raise HTTPException(status_code=400, detail="Mood status must be 100 characters or less")
        
        # Update user
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"mood_status": mood}}
        )
        
        logger.info(f"Mood updated for user {user_id}: {mood}")
        
        return {
            "success": True,
            "mood_status": mood
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating mood: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update mood")

# Update Featured Achievements
@router.put("/featured-achievements")
async def update_featured_achievements(
    achievements_update: FeaturedAchievementsUpdate,
    current_user = Depends(get_current_user)
):
    """
    Select top 3 achievements to showcase on Combat Card.
    User can manually choose which badges to flex.
    """
    try:
        user_id = current_user["_id"]
        achievement_ids = achievements_update.achievement_ids[:3]  # Max 3
        
        # Validate that user has earned these achievements
        profile = await db.gamification_profiles.find_one({"user_id": user_id}, {"_id": 0})
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        earned_achievements = profile.get("achievements", [])
        
        for ach_id in achievement_ids:
            if ach_id not in earned_achievements:
                raise HTTPException(status_code=400, detail=f"Achievement {ach_id} not earned")
        
        # Update user
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"featured_achievements": achievement_ids}}
        )
        
        logger.info(f"Featured achievements updated for user {user_id}: {achievement_ids}")
        
        return {
            "success": True,
            "featured_achievements": achievement_ids
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating featured achievements: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update featured achievements")

# Get My Profile (for settings page)
@router.get("/me")
async def get_my_profile(current_user = Depends(get_current_user)):
    """
    Get current user's profile data for editing.
    """
    try:
        user_id = current_user["_id"]
        
        # Get user data
        user = await db.users.find_one({"_id": user_id}, {"_id": 0, "password": 0})
        profile = await db.gamification_profiles.find_one({"user_id": user_id}, {"_id": 0})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get tier
        total_xp = profile.get("total_points", 0) if profile else 0
        tier = calculate_tier_badge(total_xp)
        
        if user.get("is_admin", False):
            tier = {"name": "The Architect", "color": "linear-gradient(45deg, #667eea 0%, #764ba2 50%, #f093fb 100%)", "emoji": "👑"}
        
        return {
            "user_id": user_id,
            "email": user.get("email", ""),
            "full_name": user.get("full_name", ""),
            "client_id": user.get("client_id", ""),
            "profile_picture": user.get("profile_picture", None),
            "mood_status": user.get("mood_status", ""),
            "featured_achievements": user.get("featured_achievements", []),
            "tier": tier,
            "total_xp": total_xp,
            "all_achievements": profile.get("achievements", []) if profile else []
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting my profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get profile")

# Auto-Taunt Settings Endpoints
@router.get("/auto-taunt-settings")
async def get_auto_taunt_settings(current_user = Depends(get_current_user)):
    """
    Get user's auto-taunt settings
    """
    try:
        user_id = current_user["_id"]
        user = await db.users.find_one({"_id": user_id}, {"_id": 0})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get gamification profile for tier check
        profile = await db.gamification_profiles.find_one({"user_id": user_id}, {"_id": 0})
        total_xp = profile.get("total_points", 0) if profile else 0
        is_admin = user.get("is_admin", False)
        
        # Import taunt utils
        import sys
        sys.path.append('/app/backend')
        from utils.taunt_generator import get_tier_name, get_default_taunt_style, can_use_custom_taunt, can_use_silence
        
        tier_name = get_tier_name(total_xp, is_admin)
        
        return {
            "auto_taunt_enabled": user.get("auto_taunt_enabled", False),
            "taunt_style": user.get("taunt_style", get_default_taunt_style(tier_name)),
            "custom_taunt_message": user.get("custom_taunt_message", ""),
            "can_use_custom": can_use_custom_taunt(total_xp),
            "can_use_silence": can_use_silence(total_xp, is_admin),
            "current_tier": tier_name,
            "total_xp": total_xp
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting auto-taunt settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get settings")

@router.put("/auto-taunt-settings")
async def update_auto_taunt_settings(
    settings: AutoTauntSettings,
    current_user = Depends(get_current_user)
):
    """
    Update user's auto-taunt settings
    Validates tier restrictions for custom messages and silence mode
    """
    try:
        user_id = current_user["_id"]
        
        # Get user and profile for validation
        user = await db.users.find_one({"_id": user_id})
        profile = await db.gamification_profiles.find_one({"user_id": user_id}, {"_id": 0})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        total_xp = profile.get("total_points", 0) if profile else 0
        is_admin = user.get("is_admin", False)
        
        # Import taunt utils
        import sys
        sys.path.append('/app/backend')
        from utils.taunt_generator import can_use_custom_taunt, can_use_silence
        
        # Validate custom message (Gold+ only)
        if settings.custom_taunt_message and not can_use_custom_taunt(total_xp):
            raise HTTPException(
                status_code=403,
                detail="Custom taunts unlock at Gold tier (1000+ XP)"
            )
        
        # Validate silence mode (Divine+ only)
        if settings.taunt_style == "silence" and not can_use_silence(total_xp, is_admin):
            raise HTTPException(
                status_code=403,
                detail="Architect's Silence unlocks at Divine tier (2500+ XP)"
            )
        
        # Validate message length
        if settings.custom_taunt_message and len(settings.custom_taunt_message) > 200:
            raise HTTPException(
                status_code=400,
                detail="Custom taunt message must be 200 characters or less"
            )
        
        # Update user settings
        await db.users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "auto_taunt_enabled": settings.auto_taunt_enabled,
                    "taunt_style": settings.taunt_style,
                    "custom_taunt_message": settings.custom_taunt_message or ""
                }
            }
        )
        
        logger.info(f"User {user_id} updated auto-taunt settings: {settings.dict()}")
        
        return {
            "success": True,
            "message": "Auto-taunt settings updated"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating auto-taunt settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update settings")


# SMS Settings Models
class SMSPreferencesUpdate(BaseModel):
    duel_challenges: Optional[bool] = None
    duel_results: Optional[bool] = None
    achievements: Optional[bool] = None
    tier_upgrades: Optional[bool] = None
    global_square_mentions: Optional[bool] = None
    direct_messages: Optional[bool] = None
    admin_broadcasts: Optional[bool] = None

class PhoneNumberUpdate(BaseModel):
    phone_number: str  # E.164 format

@router.get("/sms-settings")
async def get_sms_settings(current_user = Depends(get_current_user)):
    """Get user's SMS notification settings and quota"""
    try:
        user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Calculate SMS quota info
        sms_quota = user.get('sms_quota', {})
        monthly_limit = sms_quota.get('monthly_limit', 0)
        used_this_month = sms_quota.get('used_this_month', 0)
        
        # Determine if unlimited based on tier
        is_unlimited = monthly_limit == -1
        remaining = "unlimited" if is_unlimited else max(0, monthly_limit - used_this_month)
        
        return {
            "success": True,
            "phone_number": user.get('phone_number'),
            "phone_verified": user.get('phone_verified', False),
            "sms_preferences": user.get('sms_preferences', {}),
            "sms_quota": {
                "monthly_limit": "unlimited" if is_unlimited else monthly_limit,
                "used_this_month": used_this_month,
                "remaining": remaining,
                "tier": user.get('tier', 'Bronze')
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting SMS settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get SMS settings")

@router.post("/sms-settings/phone")
async def update_phone_number(
    request: PhoneNumberUpdate,
    current_user = Depends(get_current_user)
):
    """Update user's phone number"""
    try:
        from services.bulksms_client import bulksms_client
        
        # Validate phone number format
        if not bulksms_client.validate_phone_number(request.phone_number):
            raise HTTPException(
                status_code=400,
                detail="Invalid phone number format. Use E.164 format (e.g., +27123456789)"
            )
        
        # Update phone number
        await db.users.update_one(
            {"id": current_user["id"]},
            {
                "$set": {
                    "phone_number": request.phone_number,
                    "phone_verified": False,  # Reset verification
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"Phone number updated for user {current_user['id']}")
        
        # Optional: Send verification SMS
        try:
            from services.bulksms_client import bulksms_client
            bulksms_client.send_sms(
                to=request.phone_number,
                message=f"Welcome to Calliotel! Your phone number has been added to your account.",
                from_name="Calliotel"
            )
        except Exception as e:
            logger.warning(f"Failed to send welcome SMS: {str(e)}")
        
        return {
            "success": True,
            "message": "Phone number updated successfully",
            "phone_number": request.phone_number
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating phone number: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update phone number")

@router.put("/sms-settings/preferences")
async def update_sms_preferences(
    request: SMSPreferencesUpdate,
    current_user = Depends(get_current_user)
):
    """Update SMS notification preferences"""
    try:
        # Get current preferences
        user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
        current_prefs = user.get('sms_preferences', {})
        
        # Update only provided fields
        update_data = {}
        for field, value in request.dict(exclude_unset=True).items():
            if value is not None:
                update_data[f"sms_preferences.{field}"] = value
        
        if not update_data:
            return {"success": True, "message": "No changes made"}
        
        # Update preferences
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": update_data}
        )
        
        logger.info(f"SMS preferences updated for user {current_user['id']}")
        
        return {
            "success": True,
            "message": "SMS preferences updated successfully",
            "updated_preferences": request.dict(exclude_unset=True)
        }
        
    except Exception as e:
        logger.error(f"Error updating SMS preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update SMS preferences")

@router.delete("/sms-settings/phone")
async def remove_phone_number(current_user = Depends(get_current_user)):
    """Remove phone number from account"""
    try:
        await db.users.update_one(
            {"id": current_user["id"]},
            {
                "$set": {
                    "phone_number": None,
                    "phone_verified": False,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"Phone number removed for user {current_user['id']}")
        
        return {
            "success": True,
            "message": "Phone number removed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error removing phone number: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to remove phone number")

