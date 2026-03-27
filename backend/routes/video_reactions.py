"""
Video Reactions & Views System
Supports: Classic reactions, Combos, Super reactions (paid), Mystery unlocks
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Classic 7 Reactions
CLASSIC_REACTIONS = [
    {"id": "like", "emoji": "👍", "name": "Like", "color": "#3B82F6"},
    {"id": "love", "emoji": "❤️", "name": "Love", "color": "#EF4444"},
    {"id": "laugh", "emoji": "😂", "name": "Laugh", "color": "#FBBF24"},
    {"id": "fire", "emoji": "🔥", "name": "Fire", "color": "#F97316"},
    {"id": "wow", "emoji": "😮", "name": "Wow", "color": "#8B5CF6"},
    {"id": "sad", "emoji": "😢", "name": "Sad", "color": "#6B7280"},
    {"id": "applause", "emoji": "👏", "name": "Applause", "color": "#10B981"}
]

# Super Reactions (Paid & Animated)
SUPER_REACTIONS = [
    {"id": "golden_fire", "emoji": "💸🔥", "name": "Golden Fire", "price": 0.50, "color": "#FFD700", "animation": "pulse-gold"},
    {"id": "diamond_heart", "emoji": "💎❤️", "name": "Diamond Heart", "price": 1.00, "color": "#60A5FA", "animation": "sparkle"},
    {"id": "confetti_blast", "emoji": "🎉", "name": "Confetti Blast", "price": 2.00, "color": "#EC4899", "animation": "explode"}
]

# Mystery/Unlock Reactions
MYSTERY_REACTIONS = [
    {"id": "diamond", "emoji": "💎", "name": "Diamond", "unlock_requirement": "1000_views", "description": "Get 1,000 views on any video"},
    {"id": "crown", "emoji": "👑", "name": "Crown", "unlock_requirement": "10000_views", "description": "Get 10,000 views on any video"},
    {"id": "lightning", "emoji": "⚡", "name": "Lightning", "unlock_requirement": "viral", "description": "Go viral (100K views in 24h)"},
    {"id": "unicorn", "emoji": "🦄", "name": "Unicorn", "unlock_requirement": "premium", "description": "Premium users only"}
]

# Reaction Combos
REACTION_COMBOS = [
    {"combo": ["fire", "love"], "name": "Fire Love", "emoji": "🔥❤️", "xp_bonus": 2},
    {"combo": ["laugh", "applause"], "name": "Funny AF", "emoji": "😂👏", "xp_bonus": 2},
    {"combo": ["wow", "fire"], "name": "Insane!", "emoji": "😮🔥", "xp_bonus": 2},
    {"combo": ["love", "applause"], "name": "Love It!", "emoji": "❤️👏", "xp_bonus": 2},
    {"combo": ["fire", "applause"], "name": "Fire Performance", "emoji": "🔥👏", "xp_bonus": 3}
]

# Creator earnings split
CREATOR_SHARE = 0.70  # 70%
PLATFORM_SHARE = 0.30  # 30%


class AddReactionRequest(BaseModel):
    video_id: str
    reaction_ids: List[str]  # Can be multiple for combos
    is_super: bool = False


class RecordViewRequest(BaseModel):
    video_id: str
    watch_duration: Optional[int] = 0  # Seconds watched
    source: Optional[str] = "direct"  # homepage, search, profile, direct


@router.get("/reactions/available")
async def get_available_reactions(current_user = Depends(get_current_user)):
    """
    Get all available reactions for current user
    Includes: Classic, Super, and Unlocked Mystery reactions
    """
    try:
        user_id = current_user["_id"]
        
        # Get user's unlocked reactions
        user_data = await db.users.find_one({"email": user_id}, {"_id": 0})
        unlocked_reactions = user_data.get("unlocked_reactions", [])
        is_premium = user_data.get("premium_story_empire", False)
        
        # Filter mystery reactions based on unlocks
        available_mystery = []
        for mystery in MYSTERY_REACTIONS:
            if mystery["id"] in unlocked_reactions:
                available_mystery.append(mystery)
            elif mystery["unlock_requirement"] == "premium" and is_premium:
                available_mystery.append(mystery)
        
        return {
            "success": True,
            "classic": CLASSIC_REACTIONS,
            "super": SUPER_REACTIONS,
            "mystery": available_mystery,
            "combos": REACTION_COMBOS
        }
        
    except Exception as e:
        logger.error(f"Error getting reactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get reactions")


@router.post("/reactions/add")
async def add_reaction(
    request: AddReactionRequest,
    current_user = Depends(get_current_user)
):
    """
    Add reaction(s) to a video
    Supports: Single, Combo, Super reactions
    """
    try:
        user_id = current_user["_id"]
        video_id = request.video_id
        reaction_ids = request.reaction_ids
        
        # Check if video exists
        video = await db.video_messages.find_one({"message_id": video_id}, {"_id": 0})
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        creator_id = video.get("sender_id")
        
        # Check for combo
        combo_detected = None
        xp_earned = 1
        
        if len(reaction_ids) > 1:
            for combo in REACTION_COMBOS:
                if sorted(reaction_ids) == sorted(combo["combo"]):
                    combo_detected = combo
                    xp_earned = combo["xp_bonus"]
                    break
        
        # Handle super reactions (paid)
        if request.is_super:
            super_reaction = next((r for r in SUPER_REACTIONS if r["id"] in reaction_ids), None)
            if not super_reaction:
                raise HTTPException(status_code=400, detail="Invalid super reaction")
            
            # Check wallet balance
            user_data = await db.users.find_one({"email": user_id}, {"_id": 0})
            balance = user_data.get("wallet_balance", 0)
            price = super_reaction["price"]
            
            if balance < price:
                raise HTTPException(
                    status_code=402,
                    detail=f"Insufficient balance. Need ${price}"
                )
            
            # Deduct from buyer
            await db.users.update_one(
                {"email": user_id},
                {"$inc": {"wallet_balance": -price}}
            )
            
            # Pay creator 70%
            creator_earnings = price * CREATOR_SHARE
            await db.users.update_one(
                {"email": creator_id},
                {"$inc": {"wallet_balance": creator_earnings}}
            )
            
            # Record transactions
            await db.wallet_transactions.insert_one({
                "transaction_id": str(uuid.uuid4()),
                "user_id": user_id,
                "type": "super_reaction",
                "amount": -price,
                "description": f"Super reaction: {super_reaction['name']}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
            await db.wallet_transactions.insert_one({
                "transaction_id": str(uuid.uuid4()),
                "user_id": creator_id,
                "type": "super_reaction_earnings",
                "amount": creator_earnings,
                "description": "Earnings from super reaction",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        
        # Remove existing reactions from this user on this video
        await db.video_reactions.delete_many({
            "video_id": video_id,
            "user_id": user_id
        })
        
        # Add new reaction(s)
        reaction_doc = {
            "reaction_id": str(uuid.uuid4()),
            "video_id": video_id,
            "user_id": user_id,
            "user_name": current_user.get("name", "Anonymous"),
            "reaction_ids": reaction_ids,
            "is_super": request.is_super,
            "combo": combo_detected["name"] if combo_detected else None,
            "xp_earned": xp_earned,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.video_reactions.insert_one(reaction_doc)
        
        # Update video reaction counts
        reaction_counts = await get_reaction_counts(video_id)
        await db.video_messages.update_one(
            {"message_id": video_id},
            {"$set": {"reaction_counts": reaction_counts}}
        )
        
        # Award XP to user
        await db.users.update_one(
            {"email": user_id},
            {"$inc": {"xp": xp_earned}}
        )
        
        # Check for unlock achievements
        await check_unlock_achievements(creator_id, video_id)
        
        response = {
            "success": True,
            "message": "Reaction added!",
            "xp_earned": xp_earned
        }
        
        if combo_detected:
            response["combo"] = combo_detected["name"]
            response["message"] = f"✨ COMBO! {combo_detected['name']} +{xp_earned} XP!"
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding reaction: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add reaction")


async def get_reaction_counts(video_id: str) -> Dict:
    """Get reaction counts for a video"""
    reactions = await db.video_reactions.find({"video_id": video_id}, {"_id": 0}).to_list(1000)
    
    counts = {}
    for reaction in reactions:
        for reaction_id in reaction["reaction_ids"]:
            counts[reaction_id] = counts.get(reaction_id, 0) + 1
    
    return counts


@router.get("/reactions/{video_id}")
async def get_video_reactions(video_id: str):
    """Get all reactions for a video"""
    try:
        reactions = await db.video_reactions.find(
            {"video_id": video_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
        
        counts = await get_reaction_counts(video_id)
        
        return {
            "success": True,
            "reactions": reactions,
            "counts": counts,
            "total": len(reactions)
        }
        
    except Exception as e:
        logger.error(f"Error getting reactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get reactions")


@router.post("/views/record")
async def record_view(
    request: RecordViewRequest,
    current_user = Depends(get_current_user)
):
    """Record a video view"""
    try:
        user_id = current_user["_id"]
        video_id = request.video_id
        
        # Check if already viewed (unique view tracking)
        existing_view = await db.video_views.find_one({
            "video_id": video_id,
            "viewer_id": user_id
        })
        
        is_unique = existing_view is None
        
        # Record view
        view_doc = {
            "view_id": str(uuid.uuid4()),
            "video_id": video_id,
            "viewer_id": user_id,
            "viewer_name": current_user.get("name", "Anonymous"),
            "watch_duration": request.watch_duration,
            "source": request.source,
            "is_unique": is_unique,
            "viewed_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.video_views.insert_one(view_doc)
        
        # Update video view counts
        update_fields = {"$inc": {"total_views": 1}}
        if is_unique:
            update_fields["$inc"]["unique_views"] = 1
        
        await db.video_messages.update_one(
            {"message_id": video_id},
            update_fields
        )
        
        # Check for milestone achievements
        video = await db.video_messages.find_one({"message_id": video_id}, {"_id": 0})
        if video:
            await check_view_milestones(video.get("sender_id"), video_id, video.get("total_views", 1))
        
        return {
            "success": True,
            "is_unique": is_unique
        }
        
    except Exception as e:
        logger.error(f"Error recording view: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to record view")


@router.get("/analytics/{video_id}")
async def get_video_analytics(
    video_id: str,
    current_user = Depends(get_current_user)
):
    """Get detailed analytics for a video"""
    try:
        user_id = current_user["_id"]
        
        # Check if user owns the video
        video = await db.video_messages.find_one({"message_id": video_id}, {"_id": 0})
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        if video.get("sender_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Get views
        views = await db.video_views.find({"video_id": video_id}, {"_id": 0}).to_list(10000)
        total_views = len(views)
        unique_views = len([v for v in views if v.get("is_unique")])
        
        # Get reactions
        reactions = await db.video_reactions.find({"video_id": video_id}, {"_id": 0}).to_list(1000)
        reaction_counts = await get_reaction_counts(video_id)
        
        # Calculate engagement rate
        engagement_rate = (len(reactions) / total_views * 100) if total_views > 0 else 0
        
        # View sources
        sources = {}
        for view in views:
            source = view.get("source", "direct")
            sources[source] = sources.get(source, 0) + 1
        
        # Watch time stats
        total_watch_time = sum(v.get("watch_duration", 0) for v in views)
        avg_watch_time = total_watch_time / total_views if total_views > 0 else 0
        
        return {
            "success": True,
            "analytics": {
                "views": {
                    "total": total_views,
                    "unique": unique_views,
                    "sources": sources
                },
                "reactions": {
                    "total": len(reactions),
                    "counts": reaction_counts,
                    "top_reaction": max(reaction_counts, key=reaction_counts.get) if reaction_counts else None
                },
                "engagement": {
                    "rate": round(engagement_rate, 2),
                    "total_watch_time": total_watch_time,
                    "avg_watch_time": round(avg_watch_time, 2)
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get analytics")


async def check_unlock_achievements(user_id: str, video_id: str):
    """Check and unlock mystery reactions based on achievements"""
    try:
        # Get video stats
        video = await db.video_messages.find_one({"message_id": video_id}, {"_id": 0})
        if not video:
            return
        
        total_views = video.get("total_views", 0)
        
        unlocks = []
        
        # 1,000 views = Diamond
        if total_views >= 1000:
            unlocks.append("diamond")
        
        # 10,000 views = Crown
        if total_views >= 10000:
            unlocks.append("crown")
        
        # 100,000 views in 24h = Lightning (viral)
        created_at = datetime.fromisoformat(video.get("created_at"))
        now = datetime.now(timezone.utc)
        hours_since_creation = (now - created_at).total_seconds() / 3600
        
        if total_views >= 100000 and hours_since_creation <= 24:
            unlocks.append("lightning")
        
        if unlocks:
            # Add to user's unlocked reactions
            await db.users.update_one(
                {"email": user_id},
                {"$addToSet": {"unlocked_reactions": {"$each": unlocks}}}
            )
            
            logger.info(f"User {user_id} unlocked reactions: {unlocks}")
        
    except Exception as e:
        logger.error(f"Error checking unlocks: {str(e)}")


async def check_view_milestones(user_id: str, video_id: str, views: int):
    """Check and notify for view milestones"""
    milestones = [100, 1000, 10000, 100000, 1000000]
    
    for milestone in milestones:
        if views == milestone:
            # Award achievement
            badge_name = f"{milestone}_views"
            await db.users.update_one(
                {"email": user_id},
                {"$addToSet": {"achievements": badge_name}}
            )
            
            logger.info(f"User {user_id} reached {milestone} views milestone!")
            break


@router.get("/leaderboard")
async def get_reaction_leaderboard():
    """Get top reacted videos"""
    try:
        # Get videos sorted by reaction count
        videos = await db.video_messages.find(
            {},
            {"_id": 0, "message_id": 1, "caption": 1, "sender_id": 1, "total_views": 1, "reaction_counts": 1}
        ).sort("total_views", -1).limit(10).to_list(10)
        
        # Calculate total reactions for each video
        for video in videos:
            reaction_counts = video.get("reaction_counts", {})
            video["total_reactions"] = sum(reaction_counts.values())
        
        # Sort by total reactions
        videos.sort(key=lambda x: x.get("total_reactions", 0), reverse=True)
        
        return {
            "success": True,
            "leaderboard": videos[:10]
        }
        
    except Exception as e:
        logger.error(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get leaderboard")