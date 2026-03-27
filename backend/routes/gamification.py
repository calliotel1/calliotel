from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
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

# Achievement Definitions
ACHIEVEMENTS = {
    "first_message": {
        "id": "first_message",
        "name": "First Message",
        "description": "Send your first SMS",
        "icon": "📱",
        "points": 10,
        "category": "messaging"
    },
    "message_master_10": {
        "id": "message_master_10",
        "name": "Message Master",
        "description": "Send 10 messages",
        "icon": "💬",
        "points": 25,
        "category": "messaging"
    },
    "message_pro_50": {
        "id": "message_pro_50",
        "name": "Message Pro",
        "description": "Send 50 messages",
        "icon": "🚀",
        "points": 50,
        "category": "messaging"
    },
    "message_legend_100": {
        "id": "message_legend_100",
        "name": "Message Legend",
        "description": "Send 100 messages",
        "icon": "🏆",
        "points": 100,
        "category": "messaging"
    },
    "first_friend": {
        "id": "first_friend",
        "name": "Social Butterfly",
        "description": "Make your first friend",
        "icon": "👥",
        "points": 15,
        "category": "social"
    },
    "friend_collector_5": {
        "id": "friend_collector_5",
        "name": "Friend Collector",
        "description": "Have 5 friends",
        "icon": "🤝",
        "points": 30,
        "category": "social"
    },
    "popular_10": {
        "id": "popular_10",
        "name": "Popular",
        "description": "Have 10 friends",
        "icon": "🌟",
        "points": 60,
        "category": "social"
    },
    "first_number": {
        "id": "first_number",
        "name": "Number Owner",
        "description": "Purchase your first phone number",
        "icon": "📞",
        "points": 20,
        "category": "numbers"
    },
    "number_collector_3": {
        "id": "number_collector_3",
        "name": "Number Collector",
        "description": "Own 3 phone numbers",
        "icon": "☎️",
        "points": 40,
        "category": "numbers"
    },
    "first_referral": {
        "id": "first_referral",
        "name": "Referral Starter",
        "description": "Refer your first friend",
        "icon": "🎁",
        "points": 25,
        "category": "referral"
    },
    "referral_master_5": {
        "id": "referral_master_5",
        "name": "Referral Master",
        "description": "Refer 5 friends",
        "icon": "💎",
        "points": 75,
        "category": "referral"
    },
    "early_bird": {
        "id": "early_bird",
        "name": "Early Bird",
        "description": "Join Calliotel in early days",
        "icon": "🌅",
        "points": 50,
        "category": "special"
    },
    "chat_starter": {
        "id": "chat_starter",
        "name": "Chat Starter",
        "description": "Send your first chat message",
        "icon": "💌",
        "points": 15,
        "category": "social"
    },
    "sticker_fan": {
        "id": "sticker_fan",
        "name": "Sticker Fan",
        "description": "Send 20 stickers",
        "icon": "😎",
        "points": 30,
        "category": "social"
    },
    "daily_streak_7": {
        "id": "daily_streak_7",
        "name": "Week Warrior",
        "description": "Login for 7 days in a row",
        "icon": "🔥",
        "points": 50,
        "category": "engagement"
    },
    "daily_streak_30": {
        "id": "daily_streak_30",
        "name": "Monthly Master",
        "description": "Login for 30 days in a row",
        "icon": "⚡",
        "points": 150,
        "category": "engagement"
    },
    "speed_dialer_first": {
        "id": "speed_dialer_first",
        "name": "Speed Rookie",
        "description": "Complete your first Speed Dialer game",
        "icon": "🎯",
        "points": 15,
        "category": "gaming"
    },
    "speed_dialer_10": {
        "id": "speed_dialer_10",
        "name": "Speed Addict",
        "description": "Complete 10 Speed Dialer games",
        "icon": "🔥",
        "points": 40,
        "category": "gaming"
    },
    "speed_dialer_50": {
        "id": "speed_dialer_50",
        "name": "Speed Master",
        "description": "Complete 50 Speed Dialer games",
        "icon": "⚡",
        "points": 100,
        "category": "gaming"
    },
    "speed_dialer_100": {
        "id": "speed_dialer_100",
        "name": "Speed Legend",
        "description": "Complete 100 Speed Dialer games",
        "icon": "👑",
        "points": 250,
        "category": "gaming"
    },
    "speed_demon": {
        "id": "speed_demon",
        "name": "Speed Demon",
        "description": "Complete Hard mode in under 3 seconds",
        "icon": "😈",
        "points": 500,
        "category": "gaming"
    },
    "duel_first_win": {
        "id": "duel_first_win",
        "name": "Duel Initiate",
        "description": "Win your first duel",
        "icon": "⚔️",
        "points": 25,
        "category": "gaming"
    },
    "duel_warrior": {
        "id": "duel_warrior",
        "name": "Duel Warrior",
        "description": "Win 10 duels",
        "icon": "🛡️",
        "points": 100,
        "category": "gaming"
    },
    "duel_champion": {
        "id": "duel_champion",
        "name": "Duel Champion",
        "description": "Win 50 duels",
        "icon": "🏆",
        "points": 300,
        "category": "gaming"
    },
    "duel_legend": {
        "id": "duel_legend",
        "name": "Duel Legend",
        "description": "Win 100 duels",
        "icon": "👑",
        "points": 1000,
        "category": "gaming"
    },
    "high_roller": {
        "id": "high_roller",
        "name": "High Roller",
        "description": "Win a duel with 250+ XP wager",
        "icon": "💎",
        "points": 200,
        "category": "gaming"
    },
    "phish_first_blood": {
        "id": "phish_first_blood",
        "name": "Security Initiate",
        "description": "Complete your first Phish-Finder scenario",
        "icon": "🎯",
        "points": 15,
        "category": "gaming"
    },
    "security_rookie": {
        "id": "security_rookie",
        "name": "Security Rookie",
        "description": "Achieve 50% accuracy (min 10 scenarios)",
        "icon": "🛡️",
        "points": 50,
        "category": "gaming"
    },
    "cybersecurity_expert": {
        "id": "cybersecurity_expert",
        "name": "Cybersecurity Expert",
        "description": "Achieve 80% accuracy (min 20 scenarios)",
        "icon": "👁️",
        "points": 150,
        "category": "gaming"
    },
    "phish_hunter": {
        "id": "phish_hunter",
        "name": "Phish Hunter",
        "description": "Achieve 95% accuracy (min 50 scenarios)",
        "icon": "🦅",
        "points": 500,
        "category": "gaming"
    },
    "perfect_vision": {
        "id": "perfect_vision",
        "name": "Perfect Vision",
        "description": "Get 10 correct answers in a row",
        "icon": "💯",
        "points": 300,
        "category": "gaming"
    },
    "genesis_champion": {
        "id": "genesis_champion",
        "name": "Genesis Champion",
        "description": "One of the first 10 users to reach Level 10",
        "icon": "👑",
        "points": 1000,
        "category": "special"
    }
}

# Level System
LEVELS = [
    {"level": 1, "name": "Beginner", "min_points": 0, "max_points": 49, "badge": "🥉"},
    {"level": 2, "name": "Novice", "min_points": 50, "max_points": 99, "badge": "🥈"},
    {"level": 3, "name": "Intermediate", "min_points": 100, "max_points": 199, "badge": "🥇"},
    {"level": 4, "name": "Advanced", "min_points": 200, "max_points": 399, "badge": "💫"},
    {"level": 5, "name": "Expert", "min_points": 400, "max_points": 699, "badge": "⭐"},
    {"level": 6, "name": "Master", "min_points": 700, "max_points": 999, "badge": "🌟"},
    {"level": 7, "name": "Grand Master", "min_points": 1000, "max_points": 1499, "badge": "✨"},
    {"level": 8, "name": "Legend", "min_points": 1500, "max_points": 2499, "badge": "🏆"},
    {"level": 9, "name": "Mythic", "min_points": 2500, "max_points": 4999, "badge": "👑"},
    {"level": 10, "name": "Divine", "min_points": 5000, "max_points": 999999, "badge": "💎"}
]

def get_level_info(points):
    """Get level information based on points."""
    for level in LEVELS:
        if level["min_points"] <= points <= level["max_points"]:
            return level
    return LEVELS[-1]

@router.get("/profile")
async def get_gamification_profile(current_user = Depends(get_current_user)):
    """
    Get user's gamification profile (level, points, achievements).
    """
    try:
        user_id = current_user["_id"]
        
        # Get or create gamification profile
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        
        if not profile:
            # Create new profile
            profile = {
                "user_id": user_id,
                "total_points": 0,
                "achievements": [],
                "daily_login_streak": 0,
                "last_login_date": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.gamification_profiles.insert_one(profile)
        
        # Calculate level
        level_info = get_level_info(profile["total_points"])
        
        # Get achievement details
        earned_achievements = []
        for ach_id in profile.get("achievements", []):
            if ach_id in ACHIEVEMENTS:
                earned_achievements.append(ACHIEVEMENTS[ach_id])
        
        # Calculate progress to next level
        next_level = None
        progress_percentage = 0
        for level in LEVELS:
            if level["level"] == level_info["level"] + 1:
                next_level = level
                points_in_current_level = profile["total_points"] - level_info["min_points"]
                points_needed_for_level = level_info["max_points"] - level_info["min_points"] + 1
                progress_percentage = (points_in_current_level / points_needed_for_level) * 100
                break
        
        return {
            "total_points": profile["total_points"],
            "level": level_info["level"],
            "level_name": level_info["name"],
            "level_badge": level_info["badge"],
            "next_level": next_level,
            "progress_to_next_level": round(progress_percentage, 1),
            "achievements": earned_achievements,
            "achievements_count": len(earned_achievements),
            "total_achievements": len(ACHIEVEMENTS),
            "daily_streak": profile.get("daily_login_streak", 0)
        }
    except Exception as e:
        logger.error(f"Error getting gamification profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get gamification profile")

@router.get("/achievements")
async def get_all_achievements(current_user = Depends(get_current_user)):
    """
    Get all available achievements and user's progress.
    """
    try:
        user_id = current_user["_id"]
        
        # Get user's earned achievements
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        earned_ids = profile.get("achievements", []) if profile else []
        
        # Group achievements by category
        categories = {}
        for ach_id, ach in ACHIEVEMENTS.items():
            category = ach["category"]
            if category not in categories:
                categories[category] = []
            
            categories[category].append({
                **ach,
                "earned": ach_id in earned_ids
            })
        
        return {"categories": categories}
    except Exception as e:
        logger.error(f"Error getting achievements: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get achievements")

@router.get("/leaderboard")
async def get_leaderboard(limit: int = 50):
    """
    Get leaderboard of top users by points.
    """
    try:
        # Get top users
        profiles = await db.gamification_profiles.aggregate([
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "_id",
                    "as": "user"
                }
            },
            {
                "$unwind": "$user"
            },
            {
                "$project": {
                    "_id": 0,
                    "user_id": 1,
                    "email": "$user.email",
                    "client_id": "$user.client_id",
                    "total_points": 1,
                    "achievements_count": {"$size": {"$ifNull": ["$achievements", []]}}
                }
            },
            {
                "$sort": {"total_points": -1}
            },
            {
                "$limit": limit
            }
        ]).to_list(limit)
        
        # Add level info and rank
        leaderboard = []
        for rank, profile in enumerate(profiles, 1):
            level_info = get_level_info(profile["total_points"])
            leaderboard.append({
                "rank": rank,
                "email": profile["email"],
                "client_id": profile.get("client_id"),
                "points": profile["total_points"],
                "level": level_info["level"],
                "level_name": level_info["name"],
                "level_badge": level_info["badge"],
                "achievements_count": profile["achievements_count"]
            })
        
        return {"leaderboard": leaderboard}
    except Exception as e:
        logger.error(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get leaderboard")

@router.post("/daily-login")
async def record_daily_login(current_user = Depends(get_current_user)):
    """
    Record daily login and update streak.
    """
    try:
        user_id = current_user["_id"]
        today = datetime.now(timezone.utc).date().isoformat()
        
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        
        if not profile:
            return {"message": "Profile not found"}
        
        last_login = profile.get("last_login_date")
        
        # Check if already logged in today
        if last_login == today:
            return {"message": "Already logged in today", "streak": profile.get("daily_login_streak", 0)}
        
        # Calculate new streak
        if last_login:
            last_date = datetime.fromisoformat(last_login).date()
            today_date = datetime.now(timezone.utc).date()
            day_diff = (today_date - last_date).days
            
            if day_diff == 1:
                # Consecutive day
                new_streak = profile.get("daily_login_streak", 0) + 1
            else:
                # Streak broken
                new_streak = 1
        else:
            new_streak = 1
        
        # Update profile
        await db.gamification_profiles.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "last_login_date": today,
                    "daily_login_streak": new_streak
                }
            }
        )
        
        # Check for streak achievements
        points_earned = 0
        if new_streak == 7 and "daily_streak_7" not in profile.get("achievements", []):
            await award_achievement(user_id, "daily_streak_7")
            points_earned += ACHIEVEMENTS["daily_streak_7"]["points"]
        elif new_streak == 30 and "daily_streak_30" not in profile.get("achievements", []):
            await award_achievement(user_id, "daily_streak_30")
            points_earned += ACHIEVEMENTS["daily_streak_30"]["points"]
        
        return {
            "success": True,
            "streak": new_streak,
            "points_earned": points_earned
        }
    except Exception as e:
        logger.error(f"Error recording daily login: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to record daily login")

async def award_achievement(user_id: str, achievement_id: str):
    """
    Award an achievement to a user.
    """
    try:
        if achievement_id not in ACHIEVEMENTS:
            return False
        
        achievement = ACHIEVEMENTS[achievement_id]
        
        # Check if already earned
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        
        if profile and achievement_id in profile.get("achievements", []):
            return False
        
        # Award achievement
        await db.gamification_profiles.update_one(
            {"user_id": user_id},
            {
                "$addToSet": {"achievements": achievement_id},
                "$inc": {"total_points": achievement["points"]}
            },
            upsert=True
        )
        
        logger.info(f"Achievement awarded: {achievement_id} to user {user_id}")
        
        # Send SMS notification
        try:
            from services.sms_notifications import send_achievement_unlock_sms
            await send_achievement_unlock_sms(user_id, achievement["name"])
        except Exception as e:
            logger.warning(f"Failed to send achievement SMS: {str(e)}")
        
        return True
    except Exception as e:
        logger.error(f"Error awarding achievement: {str(e)}")
        return False

# Helper function to check and award achievements
async def check_achievements(user_id: str, action: str, count: int = None):
    """
    Check if user qualifies for any achievements based on action.
    """
    try:
        achievements_to_check = []
        
        if action == "send_message":
            if count == 1:
                achievements_to_check.append("first_message")
            elif count == 10:
                achievements_to_check.append("message_master_10")
            elif count == 50:
                achievements_to_check.append("message_pro_50")
            elif count == 100:
                achievements_to_check.append("message_legend_100")
        
        elif action == "make_friend":
            if count == 1:
                achievements_to_check.append("first_friend")
            elif count == 5:
                achievements_to_check.append("friend_collector_5")
            elif count == 10:
                achievements_to_check.append("popular_10")
        
        elif action == "purchase_number":
            if count == 1:
                achievements_to_check.append("first_number")
            elif count == 3:
                achievements_to_check.append("number_collector_3")
        
        elif action == "refer_friend":
            if count == 1:
                achievements_to_check.append("first_referral")
            elif count == 5:
                achievements_to_check.append("referral_master_5")
        
        elif action == "send_chat":
            if count == 1:
                achievements_to_check.append("chat_starter")
        
        elif action == "send_sticker":
            if count == 20:
                achievements_to_check.append("sticker_fan")
        
        # Award achievements
        for ach_id in achievements_to_check:
            await award_achievement(user_id, ach_id)
    
    except Exception as e:
        logger.error(f"Error checking achievements: {str(e)}")


async def check_genesis_champion(user_id: str, new_level: int):
    """
    Check if user qualifies for Genesis Champion achievement (first 10 to reach Level 10).
    """
    try:
        if new_level >= 10:
            # Count how many users have Genesis Champion already
            genesis_count = await db.gamification_profiles.count_documents({
                "achievements": {"$in": ["genesis_champion"]}
            })
            
            # Only award to first 10
            if genesis_count < 10:
                await award_achievement(user_id, "genesis_champion")
                logger.info(f"🎊 Genesis Champion #{genesis_count + 1} awarded to user {user_id}!")
                return True
        
        return False
    except Exception as e:
        logger.error(f"Error checking Genesis Champion: {str(e)}")
        return False

async def award_xp(user_id: str, xp: int, reason: str):
    """
    Award XP to a user and check for level up.
    Returns dict with xp_gained, new_total, level_up info, and achievement info.
    """
    try:
        # Ensure profile exists
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        
        if not profile:
            # Create new profile
            await db.gamification_profiles.insert_one({
                "user_id": user_id,
                "total_points": xp,
                "achievements": [],
                "daily_login_streak": 0
            })
            
            new_level = get_level_info(xp)
            
            logger.info(f"XP awarded: {xp} to new user {user_id} for {reason}")
            
            return {
                "xp_gained": xp,
                "new_total": xp,
                "level_up": True,
                "new_level": new_level["level"],
                "level_name": new_level["name"],
                "level_badge": new_level["badge"]
            }
        
        old_total = profile.get("total_points", 0)
        new_total = old_total + xp
        
        # Update points
        await db.gamification_profiles.update_one(
            {"user_id": user_id},
            {"$inc": {"total_points": xp}}
        )
        
        # Check for level up
        old_level_info = get_level_info(old_total)
        new_level_info = get_level_info(new_total)
        
        level_up = new_level_info["level"] > old_level_info["level"]
        
        # Check for tier upgrade
        from utils.leaderboard_service import calculate_tier
        old_tier = calculate_tier(old_total, False)
        new_tier = calculate_tier(new_total, False)
        tier_upgraded = old_tier["name"] != new_tier["name"]
        
        result = {
            "xp_gained": xp,
            "new_total": new_total,
            "level_up": level_up
        }
        
        if level_up:
            result.update({
                "new_level": new_level_info["level"],
                "level_name": new_level_info["name"],
                "level_badge": new_level_info["badge"]
            })
            logger.info(f"Level up! User {user_id} reached level {new_level_info['level']}")
            
            # Check for Genesis Champion achievement
            await check_genesis_champion(user_id, new_level_info["level"])
        
        # Send SMS if tier upgraded
        if tier_upgraded:
            logger.info(f"Tier upgrade! User {user_id}: {old_tier['name']} -> {new_tier['name']}")
            try:
                from services.sms_notifications import send_tier_upgrade_sms
                await send_tier_upgrade_sms(user_id, new_tier["name"], old_tier["name"])
            except Exception as e:
                logger.warning(f"Failed to send tier upgrade SMS: {str(e)}")
        
        logger.info(f"XP awarded: {xp} to user {user_id} for {reason} (total: {new_total})")
        
        return result
    
    except Exception as e:
        logger.error(f"Error awarding XP: {str(e)}")
        return {"xp_gained": 0, "new_total": 0, "level_up": False}

async def update_stat(user_id: str, stat_name: str, increment: int = 1):
    """
    Update a user stat and check for achievements.
    stat_name examples: messages_sent, friends_added, stories_posted, voice_notes_sent, ai_features_used
    """
    try:
        # Update the stat
        await db.gamification_profiles.update_one(
            {"user_id": user_id},
            {"$inc": {f"stats.{stat_name}": increment}},
            upsert=True
        )
        
        # Get updated count
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        
        if profile and "stats" in profile:
            count = profile["stats"].get(stat_name, 0)
            
            # Check for achievements based on stat
            if stat_name == "messages_sent":
                await check_achievements(user_id, "send_message", count)
            elif stat_name == "friends_added":
                await check_achievements(user_id, "make_friend", count)
            elif stat_name == "stories_posted":
                await check_achievements(user_id, "send_chat", count)
        
        logger.info(f"Stat updated: {stat_name} += {increment} for user {user_id}")
        return True
    
    except Exception as e:
        logger.error(f"Error updating stat: {str(e)}")
        return False

async def lock_xp(user_id: str, amount: int) -> bool:
    """
    Lock XP for duels/wagering. Moves XP from total_points to xp_locked.
    Returns True if successful, False if insufficient XP.
    """
    try:
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        
        if not profile:
            logger.error(f"Profile not found for user {user_id}")
            return False
        
        available_xp = profile.get("total_points", 0)
        locked_xp = profile.get("xp_locked", 0)
        
        if available_xp < amount:
            logger.warning(f"Insufficient XP to lock: User {user_id} has {available_xp}, needs {amount}")
            return False
        
        # Lock the XP
        await db.gamification_profiles.update_one(
            {"user_id": user_id},
            {
                "$inc": {
                    "total_points": -amount,
                    "xp_locked": amount
                }
            }
        )
        
        logger.info(f"Locked {amount} XP for user {user_id}")
        return True
    
    except Exception as e:
        logger.error(f"Error locking XP: {str(e)}")
        return False

async def unlock_xp(user_id: str, amount: int) -> bool:
    """
    Unlock XP (refund). Moves XP from xp_locked back to total_points.
    Used when duel is cancelled.
    """
    try:
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        
        if not profile:
            logger.error(f"Profile not found for user {user_id}")
            return False
        
        locked_xp = profile.get("xp_locked", 0)
        
        if locked_xp < amount:
            logger.warning(f"Cannot unlock more XP than locked: User {user_id} has {locked_xp} locked, trying to unlock {amount}")
            # Unlock whatever they have
            amount = locked_xp
        
        if amount > 0:
            # Unlock the XP
            await db.gamification_profiles.update_one(
                {"user_id": user_id},
                {
                    "$inc": {
                        "total_points": amount,
                        "xp_locked": -amount
                    }
                }
            )
            
            logger.info(f"Unlocked {amount} XP for user {user_id}")
        
        return True
    
    except Exception as e:
        logger.error(f"Error unlocking XP: {str(e)}")
        return False

async def clear_locked_xp(user_id: str, amount: int) -> bool:
    """
    Clear locked XP (loss). Removes XP from xp_locked without returning it.
    Used when duel is lost.
    """
    try:
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        
        if not profile:
            logger.error(f"Profile not found for user {user_id}")
            return False
        
        locked_xp = profile.get("xp_locked", 0)
        
        if locked_xp < amount:
            logger.warning(f"Cannot clear more XP than locked: User {user_id} has {locked_xp} locked, trying to clear {amount}")
            amount = locked_xp
        
        if amount > 0:
            # Clear the locked XP
            await db.gamification_profiles.update_one(
                {"user_id": user_id},
                {
                    "$inc": {
                        "xp_locked": -amount
                    }
                }
            )
            
            logger.info(f"Cleared {amount} locked XP for user {user_id}")
        
        return True
    
    except Exception as e:
        logger.error(f"Error clearing locked XP: {str(e)}")
        return False
