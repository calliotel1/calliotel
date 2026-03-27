"""
Chat Wrapped / Recap Router
Generates Spotify Wrapped-style recaps of user conversations
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from collections import Counter
import logging
import os
import re
from typing import List, Optional
from routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class TopWord(BaseModel):
    word: str
    count: int

class TopEmoji(BaseModel):
    emoji: str
    count: int
    name: str

class PeakHour(BaseModel):
    hour: int
    count: int
    label: str

class RecapResponse(BaseModel):
    period: str  # "monthly" or "yearly"
    start_date: str
    end_date: str
    total_messages: int
    messages_sent: int
    messages_received: int
    total_friends_chatted: int
    top_friend: Optional[dict]
    top_words: List[TopWord]
    top_emojis: List[TopEmoji]
    peak_hours: List[PeakHour]
    longest_streak: int
    total_photos: int
    total_videos: int
    total_stickers: int
    busiest_day: Optional[dict]
    personality_insight: str
    fun_fact: str

def extract_emojis(text: str) -> List[str]:
    """Extract emojis from text using regex"""
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "]+",
        flags=re.UNICODE
    )
    return emoji_pattern.findall(text)

def get_emoji_name(emoji: str) -> str:
    """Get friendly name for emoji"""
    emoji_names = {
        "😂": "Laughing", "❤️": "Heart", "🔥": "Fire", "👍": "Thumbs Up",
        "😍": "Heart Eyes", "😊": "Smile", "🎉": "Party", "💯": "100",
        "😭": "Crying", "🙏": "Pray", "💪": "Strong", "✨": "Sparkles",
        "🌟": "Star", "💕": "Hearts", "😘": "Kiss", "🥰": "Love",
        "🤣": "ROFL", "😁": "Grin", "🙌": "Raised Hands", "👏": "Clap"
    }
    return emoji_names.get(emoji, "Unknown")

def get_personality_insight(messages_sent: int, messages_received: int, top_emojis: List[str]) -> str:
    """Generate personality insight based on chat behavior"""
    ratio = messages_sent / messages_received if messages_received > 0 else 1
    
    if ratio > 1.5:
        base = "You're the conversation starter! Always keeping the chat alive. 🚀"
    elif ratio < 0.7:
        base = "You're a great listener! You let others shine. 👂"
    else:
        base = "You're the perfect conversation partner! Balanced and engaged. ⚖️"
    
    # Add emoji personality
    if top_emojis:
        top_emoji = top_emojis[0]
        if top_emoji in ["😂", "🤣"]:
            base += " Your humor lights up every chat!"
        elif top_emoji in ["❤️", "😍", "🥰", "💕"]:
            base += " You spread love everywhere!"
        elif top_emoji in ["🔥", "💯", "🙌"]:
            base += " You bring the energy!"
    
    return base

def get_fun_fact(total_messages: int, total_photos: int, peak_hours: List[dict]) -> str:
    """Generate a fun fact"""
    if total_messages < 10:
        return "Just getting started! More memories to come. 🌱"
    elif total_messages < 100:
        return f"You've sent {total_messages} messages this period. That's a great start! 💬"
    elif total_messages < 500:
        return f"Wow! {total_messages} messages. You're building real connections! 🤝"
    elif total_messages < 1000:
        return f"Amazing! {total_messages} messages. You're a social butterfly! 🦋"
    else:
        return f"Incredible! {total_messages} messages. You're a conversation champion! 🏆"

# Note: available-periods must come BEFORE the dynamic {period} route
@router.get("/recap/available-periods")
async def get_available_periods(current_user = Depends(get_current_user)):
    """
    Get list of available periods for recap
    Returns months/years where user has messages
    """
    try:
        user_id = current_user["_id"]
        
        # Get first and last message dates
        first_message = await db.messages.find_one(
            {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]},
            {"_id": 0, "timestamp": 1},
            sort=[("timestamp", 1)]
        )
        
        last_message = await db.messages.find_one(
            {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]},
            {"_id": 0, "timestamp": 1},
            sort=[("timestamp", -1)]
        )
        
        if not first_message or not last_message:
            return {
                "available_years": [],
                "available_months": [],
                "has_data": False
            }
        
        first_date = datetime.fromisoformat(first_message["timestamp"])
        last_date = datetime.fromisoformat(last_message["timestamp"])
        
        # Generate available years
        available_years = list(range(first_date.year, last_date.year + 1))
        
        # Generate available months (for current year)
        current_year = datetime.now(timezone.utc).year
        available_months = []
        for month in range(1, 13):
            month_start = datetime(current_year, month, 1, tzinfo=timezone.utc)
            if month == 12:
                month_end = datetime(current_year + 1, 1, 1, tzinfo=timezone.utc)
            else:
                month_end = datetime(current_year, month + 1, 1, tzinfo=timezone.utc)
            
            if first_date <= month_end and last_date >= month_start:
                month_name = month_start.strftime("%B")
                available_months.append({
                    "month": month,
                    "name": month_name,
                    "year": current_year
                })
        
        return {
            "available_years": available_years,
            "available_months": available_months,
            "has_data": True,
            "first_message_date": first_date.isoformat(),
            "last_message_date": last_date.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting available periods: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get available periods")

@router.get("/recap/{period}", response_model=RecapResponse)
async def get_chat_recap(
    period: str,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    current_user = Depends(get_current_user)
):
    """
    Generate chat recap for monthly or yearly period
    - period: "monthly" or "yearly"
    - year: specific year (defaults to current year)
    - month: specific month (1-12, required for monthly)
    """
    # Validate period
    if period not in ["monthly", "yearly"]:
        raise HTTPException(status_code=400, detail="Period must be 'monthly' or 'yearly'")
    
    try:
        user_id = current_user["_id"]
        now = datetime.now(timezone.utc)
        
        # Determine date range
        if period == "monthly":
            if not month:
                month = now.month
            if not year:
                year = now.year
            
            start_date = datetime(year, month, 1, tzinfo=timezone.utc)
            if month == 12:
                end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
            else:
                end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)
        else:  # yearly
            if not year:
                year = now.year
            start_date = datetime(year, 1, 1, tzinfo=timezone.utc)
            end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        
        # Fetch all messages in period
        messages = await db.messages.find({
            "$or": [
                {"sender_id": user_id},
                {"receiver_id": user_id}
            ],
            "timestamp": {
                "$gte": start_date.isoformat(),
                "$lt": end_date.isoformat()
            }
        }, {"_id": 0}).to_list(100000)
        
        if not messages:
            # Return empty recap
            return RecapResponse(
                period=period,
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat(),
                total_messages=0,
                messages_sent=0,
                messages_received=0,
                total_friends_chatted=0,
                top_friend=None,
                top_words=[],
                top_emojis=[],
                peak_hours=[],
                longest_streak=0,
                total_photos=0,
                total_videos=0,
                total_stickers=0,
                busiest_day=None,
                personality_insight="Start chatting to see your recap! 💬",
                fun_fact="Your journey begins here! 🚀"
            )
        
        # Calculate stats
        total_messages = len(messages)
        messages_sent = len([m for m in messages if m["sender_id"] == user_id])
        messages_received = total_messages - messages_sent
        
        # Count friends chatted with
        friends_set = set()
        for msg in messages:
            if msg["sender_id"] == user_id:
                friends_set.add(msg["receiver_id"])
            else:
                friends_set.add(msg["sender_id"])
        total_friends_chatted = len(friends_set)
        
        # Find top friend (most messages exchanged)
        friend_counts = Counter()
        for msg in messages:
            friend_id = msg["receiver_id"] if msg["sender_id"] == user_id else msg["sender_id"]
            friend_counts[friend_id] += 1
        
        top_friend = None
        if friend_counts:
            top_friend_id, top_friend_count = friend_counts.most_common(1)[0]
            friend_info = await db.users.find_one(
                {"user_id": top_friend_id},
                {"_id": 0, "email": 1, "full_name": 1, "client_id": 1}
            )
            if friend_info:
                top_friend = {
                    "user_id": top_friend_id,
                    "name": friend_info.get("full_name") or friend_info["email"],
                    "message_count": top_friend_count
                }
        
        # Extract and count words (from sent messages)
        word_counter = Counter()
        emoji_counter = Counter()
        for msg in messages:
            if msg["sender_id"] == user_id and msg.get("type") == "text":
                # Extract words (filter out common words)
                words = re.findall(r'\b\w+\b', msg["content"].lower())
                common_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "i", "you", "he", "she", "it", "we", "they", "my", "your", "his", "her", "its", "our", "their", "this", "that", "these", "those", "what", "which", "who", "when", "where", "why", "how"}
                meaningful_words = [w for w in words if len(w) > 3 and w not in common_words]
                word_counter.update(meaningful_words)
                
                # Extract emojis
                emojis = extract_emojis(msg["content"])
                emoji_counter.update(emojis)
        
        # Top words
        top_words = [
            TopWord(word=word, count=count)
            for word, count in word_counter.most_common(10)
        ]
        
        # Top emojis
        top_emojis = [
            TopEmoji(emoji=emoji, count=count, name=get_emoji_name(emoji))
            for emoji, count in emoji_counter.most_common(10)
        ]
        
        # Peak hours analysis
        hour_counter = Counter()
        day_counter = Counter()
        for msg in messages:
            if msg["sender_id"] == user_id:
                timestamp = datetime.fromisoformat(msg["timestamp"])
                hour_counter[timestamp.hour] += 1
                day_date = timestamp.date().isoformat()
                day_counter[day_date] += 1
        
        # Format peak hours
        peak_hours = []
        for hour, count in hour_counter.most_common(5):
            label = f"{hour:02d}:00"
            if 6 <= hour < 12:
                label += " (Morning)"
            elif 12 <= hour < 17:
                label += " (Afternoon)"
            elif 17 <= hour < 21:
                label += " (Evening)"
            else:
                label += " (Night)"
            peak_hours.append(PeakHour(hour=hour, count=count, label=label))
        
        # Busiest day
        busiest_day = None
        if day_counter:
            busiest_date, busiest_count = day_counter.most_common(1)[0]
            busiest_day = {
                "date": busiest_date,
                "message_count": busiest_count
            }
        
        # Media counts
        total_photos = len([m for m in messages if m.get("type") == "image" and m["sender_id"] == user_id])
        total_videos = len([m for m in messages if m.get("type") == "video" and m["sender_id"] == user_id])
        total_stickers = len([m for m in messages if m.get("type") == "sticker" and m["sender_id"] == user_id])
        
        # Get longest streak in period
        streaks = await db.streaks.find({
            "$or": [
                {"user1_id": user_id},
                {"user2_id": user_id}
            ]
        }, {"_id": 0, "highest_streak": 1}).to_list(1000)
        
        longest_streak = max([s.get("highest_streak", 0) for s in streaks]) if streaks else 0
        
        # Generate insights
        top_emoji_list = [e.emoji for e in top_emojis[:3]]
        personality_insight = get_personality_insight(messages_sent, messages_received, top_emoji_list)
        fun_fact = get_fun_fact(total_messages, total_photos, [{"hour": h.hour, "count": h.count} for h in peak_hours])
        
        logger.info(f"Generated {period} recap for {user_id}: {total_messages} messages")
        
        return RecapResponse(
            period=period,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            total_messages=total_messages,
            messages_sent=messages_sent,
            messages_received=messages_received,
            total_friends_chatted=total_friends_chatted,
            top_friend=top_friend,
            top_words=top_words,
            top_emojis=top_emojis,
            peak_hours=peak_hours,
            longest_streak=longest_streak,
            total_photos=total_photos,
            total_videos=total_videos,
            total_stickers=total_stickers,
            busiest_day=busiest_day,
            personality_insight=personality_insight,
            fun_fact=fun_fact
        )
        
    except Exception as e:
        logger.error(f"Error generating recap: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate recap")
