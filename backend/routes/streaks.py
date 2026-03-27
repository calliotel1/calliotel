"""
Streak System Router
Tracks daily message streaks between users with plant growth visualization
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta, timezone
import logging
import os
from routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class StreakResponse(BaseModel):
    streak_count: int
    last_message_date: str
    plant_stage: str
    plant_emoji: str
    streak_active: bool
    next_milestone: int

def get_plant_stage(streak_count: int) -> dict:
    """
    Return plant stage based on streak count
    """
    if streak_count == 0:
        return {"stage": "seed", "emoji": "🌰", "name": "Seed"}
    elif 1 <= streak_count <= 3:
        return {"stage": "sprout", "emoji": "🌱", "name": "Sprout"}
    elif 4 <= streak_count <= 7:
        return {"stage": "seedling", "emoji": "🪴", "name": "Young Plant"}
    elif 8 <= streak_count <= 14:
        return {"stage": "plant", "emoji": "🌿", "name": "Growing Plant"}
    elif 15 <= streak_count <= 30:
        return {"stage": "bush", "emoji": "🌳", "name": "Small Tree"}
    elif 31 <= streak_count <= 99:
        return {"stage": "tree", "emoji": "🌲", "name": "Big Tree"}
    elif 100 <= streak_count <= 364:
        return {"stage": "mighty_tree", "emoji": "🎄", "name": "Mighty Tree"}
    else:  # 365+
        return {"stage": "legendary", "emoji": "🌴", "name": "Legendary Tree"}

def get_next_milestone(streak_count: int) -> int:
    """Get next milestone for motivation"""
    milestones = [3, 7, 14, 30, 50, 100, 365]
    for milestone in milestones:
        if streak_count < milestone:
            return milestone
    return 500  # Next big milestone after 365

@router.get("/streak/{friend_user_id}")
async def get_streak(
    friend_user_id: str,
    current_user = Depends(get_current_user)
):
    """
    Get streak information between current user and friend
    """
    try:
        user_id = current_user["_id"]
        
        # Create consistent streak_id (alphabetically sorted)
        users_sorted = sorted([user_id, friend_user_id])
        streak_id = f"{users_sorted[0]}_{users_sorted[1]}"
        
        # Get streak record
        streak = await db.streaks.find_one({"streak_id": streak_id}, {"_id": 0})
        
        if not streak:
            # No streak yet
            plant = get_plant_stage(0)
            return {
                "streak_count": 0,
                "last_message_date": None,
                "plant_stage": plant["stage"],
                "plant_emoji": plant["emoji"],
                "plant_name": plant["name"],
                "streak_active": False,
                "next_milestone": 3,
                "days_until_reset": 0
            }
        
        # Check if streak is still active (message within last 24 hours)
        last_date = datetime.fromisoformat(streak["last_message_date"])
        now = datetime.now(timezone.utc)
        hours_since = (now - last_date).total_seconds() / 3600
        
        streak_active = hours_since < 24
        days_until_reset = max(0, 24 - int(hours_since))
        
        # If streak expired, it should be reset (will happen on next message)
        current_count = streak["streak_count"] if streak_active else 0
        
        plant = get_plant_stage(current_count)
        
        return {
            "streak_count": current_count,
            "last_message_date": streak["last_message_date"],
            "plant_stage": plant["stage"],
            "plant_emoji": plant["emoji"],
            "plant_name": plant["name"],
            "streak_active": streak_active,
            "next_milestone": get_next_milestone(current_count),
            "days_until_reset": days_until_reset,
            "highest_streak": streak.get("highest_streak", current_count)
        }
        
    except Exception as e:
        logger.error(f"Error getting streak: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get streak")

@router.post("/streak/update/{friend_user_id}")
async def update_streak(
    friend_user_id: str,
    current_user = Depends(get_current_user)
):
    """
    Update streak when message is sent
    Called automatically when user sends a message
    """
    try:
        user_id = current_user["_id"]
        
        # Create consistent streak_id
        users_sorted = sorted([user_id, friend_user_id])
        streak_id = f"{users_sorted[0]}_{users_sorted[1]}"
        
        now = datetime.now(timezone.utc)
        today = now.date()
        
        # Get existing streak
        streak = await db.streaks.find_one({"streak_id": streak_id})
        
        if not streak:
            # Create new streak
            new_streak = {
                "streak_id": streak_id,
                "user1_id": users_sorted[0],
                "user2_id": users_sorted[1],
                "streak_count": 1,
                "last_message_date": now.isoformat(),
                "last_message_day": today.isoformat(),
                "created_at": now.isoformat(),
                "highest_streak": 1,
                "total_messages": 1
            }
            await db.streaks.insert_one(new_streak)
            
            plant = get_plant_stage(1)
            return {
                "streak_count": 1,
                "plant_stage": plant["stage"],
                "plant_emoji": plant["emoji"],
                "milestone_reached": False,
                "message": "Streak started! 🌱"
            }
        
        # Check last message date
        last_date = datetime.fromisoformat(streak["last_message_date"])
        last_day = datetime.fromisoformat(streak["last_message_day"]).date()
        hours_since = (now - last_date).total_seconds() / 3600
        
        # Determine new streak count
        if last_day == today:
            # Same day - no change to streak, just update timestamp
            new_count = streak["streak_count"]
            milestone_reached = False
            message = "Keep it going!"
        elif hours_since < 24:
            # Within 24 hours - increment streak
            new_count = streak["streak_count"] + 1
            
            # Check if milestone reached
            milestones = [3, 7, 14, 30, 50, 100, 365]
            milestone_reached = new_count in milestones
            
            if milestone_reached:
                message = f"🎉 {new_count} day milestone reached!"
            else:
                message = f"Streak continues! {new_count} days"
        else:
            # Streak broken - reset
            new_count = 1
            milestone_reached = False
            message = f"Streak reset. Previous best: {streak['streak_count']} days. Let's start fresh! 🌱"
        
        # Update streak
        highest = max(streak.get("highest_streak", 0), new_count)
        
        await db.streaks.update_one(
            {"streak_id": streak_id},
            {
                "$set": {
                    "streak_count": new_count,
                    "last_message_date": now.isoformat(),
                    "last_message_day": today.isoformat(),
                    "highest_streak": highest
                },
                "$inc": {"total_messages": 1}
            }
        )
        
        plant = get_plant_stage(new_count)
        
        return {
            "streak_count": new_count,
            "plant_stage": plant["stage"],
            "plant_emoji": plant["emoji"],
            "plant_name": plant["name"],
            "milestone_reached": milestone_reached,
            "message": message,
            "highest_streak": highest
        }
        
    except Exception as e:
        logger.error(f"Error updating streak: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update streak")

@router.get("/streaks/all")
async def get_all_streaks(current_user = Depends(get_current_user)):
    """
    Get all active streaks for current user
    """
    try:
        user_id = current_user["_id"]
        
        # Find all streaks involving this user
        streaks = await db.streaks.find({
            "$or": [
                {"user1_id": user_id},
                {"user2_id": user_id}
            ]
        }, {"_id": 0}).sort("streak_count", -1).to_list(100)
        
        # Process each streak
        result = []
        now = datetime.now(timezone.utc)
        
        for streak in streaks:
            # Get friend user_id
            friend_id = streak["user2_id"] if streak["user1_id"] == user_id else streak["user1_id"]
            
            # Get friend info
            friend = await db.users.find_one(
                {"user_id": friend_id},
                {"_id": 0, "email": 1, "name": 1, "picture": 1}
            )
            
            if not friend:
                continue
            
            # Check if active
            last_date = datetime.fromisoformat(streak["last_message_date"])
            hours_since = (now - last_date).total_seconds() / 3600
            streak_active = hours_since < 24
            
            current_count = streak["streak_count"] if streak_active else 0
            plant = get_plant_stage(current_count)
            
            result.append({
                "friend_user_id": friend_id,
                "friend_name": friend.get("name", friend["email"]),
                "friend_picture": friend.get("picture"),
                "streak_count": current_count,
                "plant_emoji": plant["emoji"],
                "plant_stage": plant["stage"],
                "streak_active": streak_active,
                "highest_streak": streak.get("highest_streak", current_count)
            })
        
        return {
            "streaks": result,
            "total_active": len([s for s in result if s["streak_active"]]),
            "total_all": len(result)
        }
        
    except Exception as e:
        logger.error(f"Error getting all streaks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get streaks")

@router.get("/leaderboard")
async def get_streak_leaderboard():
    """
    Get top streaks leaderboard
    """
    try:
        # Get top active streaks
        now = datetime.now(timezone.utc)
        
        all_streaks = await db.streaks.find({}, {"_id": 0}).sort("streak_count", -1).limit(50).to_list(50)
        
        leaderboard = []
        
        for streak in all_streaks:
            # Check if still active
            last_date = datetime.fromisoformat(streak["last_message_date"])
            hours_since = (now - last_date).total_seconds() / 3600
            
            if hours_since >= 24:
                continue  # Skip inactive streaks
            
            # Get both users
            user1 = await db.users.find_one(
                {"user_id": streak["user1_id"]},
                {"_id": 0, "name": 1, "email": 1}
            )
            user2 = await db.users.find_one(
                {"user_id": streak["user2_id"]},
                {"_id": 0, "name": 1, "email": 1}
            )
            
            if user1 and user2:
                plant = get_plant_stage(streak["streak_count"])
                
                leaderboard.append({
                    "user1_name": user1.get("name", user1["email"].split("@")[0]),
                    "user2_name": user2.get("name", user2["email"].split("@")[0]),
                    "streak_count": streak["streak_count"],
                    "plant_emoji": plant["emoji"],
                    "plant_stage": plant["stage"]
                })
        
        return {
            "leaderboard": leaderboard[:20],  # Top 20
            "total": len(leaderboard)
        }
        
    except Exception as e:
        logger.error(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get leaderboard")
