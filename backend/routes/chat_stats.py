"""
Chat Statistics Router
Provides detailed statistics about friendships and conversations
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

class ChatStatsResponse(BaseModel):
    total_messages: int
    messages_sent: int
    messages_received: int
    photos_shared: int
    videos_shared: int
    stickers_sent: int
    days_as_friends: int
    current_streak: int
    best_streak: int
    first_message_date: str
    last_message_date: str
    favorite_time: str  # Morning, Afternoon, Evening, Night

@router.get("/stats/{friend_user_id}", response_model=ChatStatsResponse)
async def get_chat_stats(
    friend_user_id: str,
    current_user = Depends(get_current_user)
):
    """
    Get comprehensive statistics about chat with a specific friend
    """
    try:
        user_id = current_user["_id"]
        
        # Get all messages between users
        messages = await db.messages.find({
            "$or": [
                {"sender_id": user_id, "receiver_id": friend_user_id},
                {"sender_id": friend_user_id, "receiver_id": user_id}
            ]
        }, {"_id": 0}).to_list(10000)
        
        if not messages:
            # No messages yet
            return ChatStatsResponse(
                total_messages=0,
                messages_sent=0,
                messages_received=0,
                photos_shared=0,
                videos_shared=0,
                stickers_sent=0,
                days_as_friends=0,
                current_streak=0,
                best_streak=0,
                first_message_date="",
                last_message_date="",
                favorite_time="Not enough data"
            )
        
        # Calculate stats
        total_messages = len(messages)
        messages_sent = len([m for m in messages if m["sender_id"] == user_id])
        messages_received = total_messages - messages_sent
        
        # Count media types
        photos_shared = len([m for m in messages if m.get("type") == "image"])
        videos_shared = len([m for m in messages if m.get("type") == "video"])
        stickers_sent = len([m for m in messages if m.get("type") == "sticker" and m["sender_id"] == user_id])
        
        # Get friendship duration
        friendship = await db.friendships.find_one({
            "$or": [
                {"user_id": user_id, "friend_id": friend_user_id},
                {"user_id": friend_user_id, "friend_id": user_id}
            ]
        }, {"_id": 0})
        
        days_as_friends = 0
        if friendship:
            created = datetime.fromisoformat(friendship["created_at"])
            days_as_friends = (datetime.now(timezone.utc) - created).days
        
        # Get streak info
        users_sorted = sorted([user_id, friend_user_id])
        streak_id = f"{users_sorted[0]}_{users_sorted[1]}"
        streak = await db.streaks.find_one({"streak_id": streak_id}, {"_id": 0})
        
        current_streak = 0
        best_streak = 0
        if streak:
            # Check if streak is still active
            last_date = datetime.fromisoformat(streak["last_message_date"])
            hours_since = (datetime.now(timezone.utc) - last_date).total_seconds() / 3600
            current_streak = streak["streak_count"] if hours_since < 24 else 0
            best_streak = streak.get("highest_streak", current_streak)
        
        # Get first and last message dates
        sorted_messages = sorted(messages, key=lambda x: x["timestamp"])
        first_message_date = sorted_messages[0]["timestamp"]
        last_message_date = sorted_messages[-1]["timestamp"]
        
        # Calculate favorite time (when most messages are sent)
        hours = []
        for msg in messages:
            if msg["sender_id"] == user_id:
                timestamp = datetime.fromisoformat(msg["timestamp"])
                hours.append(timestamp.hour)
        
        favorite_time = "Not enough data"
        if hours:
            avg_hour = sum(hours) / len(hours)
            if 6 <= avg_hour < 12:
                favorite_time = "Morning (6 AM - 12 PM)"
            elif 12 <= avg_hour < 17:
                favorite_time = "Afternoon (12 PM - 5 PM)"
            elif 17 <= avg_hour < 21:
                favorite_time = "Evening (5 PM - 9 PM)"
            else:
                favorite_time = "Night (9 PM - 6 AM)"
        
        logger.info(f"Chat stats fetched for {user_id} with {friend_user_id}")
        
        return ChatStatsResponse(
            total_messages=total_messages,
            messages_sent=messages_sent,
            messages_received=messages_received,
            photos_shared=photos_shared,
            videos_shared=videos_shared,
            stickers_sent=stickers_sent,
            days_as_friends=days_as_friends,
            current_streak=current_streak,
            best_streak=best_streak,
            first_message_date=first_message_date,
            last_message_date=last_message_date,
            favorite_time=favorite_time
        )
        
    except Exception as e:
        logger.error(f"Error fetching chat stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch chat statistics")

@router.get("/stats/all/summary")
async def get_all_stats_summary(current_user = Depends(get_current_user)):
    """
    Get summary statistics across all friendships
    """
    try:
        user_id = current_user["_id"]
        
        # Get all messages
        all_messages = await db.messages.find({
            "$or": [
                {"sender_id": user_id},
                {"receiver_id": user_id}
            ]
        }, {"_id": 0}).to_list(50000)
        
        # Get all friendships
        friendships = await db.friendships.find({
            "$or": [
                {"user_id": user_id},
                {"friend_id": user_id}
            ]
        }, {"_id": 0}).to_list(1000)
        
        # Get all streaks
        streaks = await db.streaks.find({
            "$or": [
                {"user1_id": user_id},
                {"user2_id": user_id}
            ]
        }, {"_id": 0}).to_list(1000)
        
        # Calculate summary stats
        total_messages = len(all_messages)
        messages_sent = len([m for m in all_messages if m["sender_id"] == user_id])
        photos_sent = len([m for m in all_messages if m.get("type") == "image" and m["sender_id"] == user_id])
        videos_sent = len([m for m in all_messages if m.get("type") == "video" and m["sender_id"] == user_id])
        stickers_sent = len([m for m in all_messages if m.get("type") == "sticker" and m["sender_id"] == user_id])
        
        # Active streaks
        now = datetime.now(timezone.utc)
        active_streaks = 0
        longest_streak = 0
        
        for streak in streaks:
            last_date = datetime.fromisoformat(streak["last_message_date"])
            hours_since = (now - last_date).total_seconds() / 3600
            if hours_since < 24:
                active_streaks += 1
            longest_streak = max(longest_streak, streak.get("highest_streak", 0))
        
        return {
            "total_friends": len(friendships),
            "total_messages": total_messages,
            "messages_sent": messages_sent,
            "messages_received": total_messages - messages_sent,
            "photos_sent": photos_sent,
            "videos_sent": videos_sent,
            "stickers_sent": stickers_sent,
            "active_streaks": active_streaks,
            "longest_streak": longest_streak
        }
        
    except Exception as e:
        logger.error(f"Error fetching summary stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch summary statistics")
