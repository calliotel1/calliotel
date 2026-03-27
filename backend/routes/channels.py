"""
Channels Router - Enhanced with Discovery & Analytics
Create, manage, and discover channels
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import logging
import os
from uuid import uuid4
from routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Models
class CreateChannel(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = "general"
    is_public: bool = True

class UpdateChannel(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_public: Optional[bool] = None

# ============= CHANNEL DISCOVERY =============

@router.get("/discover")
async def discover_channels(
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "popular",  # popular, recent, members
    limit: int = 20,
    current_user = Depends(get_current_user)
):
    """
    Discover channels with filters and sorting
    """
    try:
        user_id = current_user["_id"]
        
        # Build query
        query = {"is_public": True}
        
        if category:
            query["category"] = category
        
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        
        # Get channels
        channels_cursor = db.channels.find(query, {"_id": 0})
        
        # Apply sorting
        if sort_by == "popular":
            channels_cursor = channels_cursor.sort("member_count", -1)
        elif sort_by == "recent":
            channels_cursor = channels_cursor.sort("created_at", -1)
        elif sort_by == "members":
            channels_cursor = channels_cursor.sort("member_count", -1)
        
        channels = await channels_cursor.limit(limit).to_list(limit)
        
        # Check if user is member of each channel
        for channel in channels:
            membership = await db.channel_members.find_one({
                "channel_id": channel["id"],
                "user_id": user_id
            })
            channel["is_member"] = membership is not None
        
        return {"channels": channels}
    except Exception as e:
        logger.error(f"Error discovering channels: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to discover channels")

@router.get("/categories")
async def get_categories():
    """
    Get all available channel categories
    """
    try:
        categories = await db.channels.distinct("category")
        
        # Get count for each category
        category_counts = []
        for category in categories:
            count = await db.channels.count_documents({
                "category": category,
                "is_public": True
            })
            category_counts.append({
                "name": category,
                "count": count
            })
        
        return {"categories": category_counts}
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch categories")

@router.get("/trending")
async def get_trending_channels(limit: int = 10):
    """
    Get trending channels based on recent activity
    """
    try:
        # Get channels with most posts in last 7 days
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        
        pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": seven_days_ago},
                    "channel_id": {"$exists": True}
                }
            },
            {
                "$group": {
                    "_id": "$channel_id",
                    "post_count": {"$sum": 1}
                }
            },
            {"$sort": {"post_count": -1}},
            {"$limit": limit}
        ]
        
        trending_data = await db.posts.aggregate(pipeline).to_list(limit)
        
        # Get channel details
        channels = []
        for item in trending_data:
            channel = await db.channels.find_one(
                {"id": item["_id"]},
                {"_id": 0}
            )
            if channel:
                channel["recent_posts"] = item["post_count"]
                channels.append(channel)
        
        return {"trending": channels}
    except Exception as e:
        logger.error(f"Error fetching trending: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch trending channels")

# ============= CHANNEL MANAGEMENT =============

@router.post("/create")
async def create_channel(channel: CreateChannel, current_user = Depends(get_current_user)):
    """
    Create a new channel
    """
    try:
        user_id = current_user["_id"]
        
        channel_doc = {
            "id": str(uuid4()),
            "name": channel.name,
            "description": channel.description,
            "category": channel.category,
            "is_public": channel.is_public,
            "owner_id": user_id,
            "created_at": datetime.now(timezone.utc),
            "member_count": 1,
            "post_count": 0
        }
        
        await db.channels.insert_one(channel_doc)
        
        # Add creator as member
        member_doc = {
            "id": str(uuid4()),
            "channel_id": channel_doc["id"],
            "user_id": user_id,
            "role": "admin",
            "joined_at": datetime.now(timezone.utc)
        }
        
        await db.channel_members.insert_one(member_doc)
        
        return {
            "success": True,
            "channel": {
                "id": channel_doc["id"],
                "name": channel_doc["name"]
            }
        }
    except Exception as e:
        logger.error(f"Error creating channel: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create channel")

@router.get("/list")
async def list_channels(current_user = Depends(get_current_user)):
    """
    Get user's channels
    """
    try:
        user_id = current_user["_id"]
        
        # Get memberships
        memberships = await db.channel_members.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(100)
        
        channels = []
        for membership in memberships:
            channel = await db.channels.find_one(
                {"id": membership["channel_id"]},
                {"_id": 0}
            )
            if channel:
                channel["user_role"] = membership["role"]
                channels.append(channel)
        
        return {"channels": channels}
    except Exception as e:
        logger.error(f"Error listing channels: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list channels")

@router.get("/my-channels")
async def get_my_channels(current_user = Depends(get_current_user)):
    """
    Get user's channels (alias for /list)
    """
    return await list_channels(current_user)

@router.get("/{channel_id}")
async def get_channel(channel_id: str, current_user = Depends(get_current_user)):
    """
    Get channel details
    """
    try:
        channel = await db.channels.find_one({"id": channel_id}, {"_id": 0})
        
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        # Check membership
        user_id = current_user["_id"]
        membership = await db.channel_members.find_one({
            "channel_id": channel_id,
            "user_id": user_id
        })
        
        if membership:
            channel["user_role"] = membership["role"]
            channel["is_member"] = True
        else:
            channel["is_member"] = False
        
        return channel
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching channel: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch channel")

@router.post("/{channel_id}/join")
async def join_channel(channel_id: str, current_user = Depends(get_current_user)):
    """
    Join a channel
    """
    try:
        user_id = current_user["_id"]
        
        # Check if channel exists and is public
        channel = await db.channels.find_one({"id": channel_id})
        
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        if not channel.get("is_public"):
            raise HTTPException(status_code=403, detail="Channel is private")
        
        # Check if already member
        existing = await db.channel_members.find_one({
            "channel_id": channel_id,
            "user_id": user_id
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Already a member")
        
        # Add membership
        member_doc = {
            "id": str(uuid4()),
            "channel_id": channel_id,
            "user_id": user_id,
            "role": "member",
            "joined_at": datetime.now(timezone.utc)
        }
        
        await db.channel_members.insert_one(member_doc)
        
        # Update member count
        await db.channels.update_one(
            {"id": channel_id},
            {"$inc": {"member_count": 1}}
        )
        
        return {"success": True, "message": "Joined channel"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error joining channel: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to join channel")

@router.post("/{channel_id}/leave")
async def leave_channel(channel_id: str, current_user = Depends(get_current_user)):
    """
    Leave a channel
    """
    try:
        user_id = current_user["_id"]
        
        result = await db.channel_members.delete_one({
            "channel_id": channel_id,
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Not a member")
        
        # Update member count
        await db.channels.update_one(
            {"id": channel_id},
            {"$inc": {"member_count": -1}}
        )
        
        return {"success": True, "message": "Left channel"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error leaving channel: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to leave channel")

# ============= CHANNEL ANALYTICS =============

@router.get("/{channel_id}/analytics")
async def get_channel_analytics(
    channel_id: str,
    days: int = 30,
    current_user = Depends(get_current_user)
):
    """
    Get channel analytics
    """
    try:
        user_id = current_user["_id"]
        
        # Verify membership
        membership = await db.channel_members.find_one({
            "channel_id": channel_id,
            "user_id": user_id
        })
        
        if not membership:
            raise HTTPException(status_code=403, detail="Not a member")
        
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Get post count
        post_count = await db.posts.count_documents({
            "channel_id": channel_id,
            "created_at": {"$gte": start_date}
        })
        
        # Get member growth
        new_members = await db.channel_members.count_documents({
            "channel_id": channel_id,
            "joined_at": {"$gte": start_date}
        })
        
        # Get engagement (likes, comments)
        posts = await db.posts.find(
            {"channel_id": channel_id},
            {"likes_count": 1, "comments_count": 1}
        ).to_list(1000)
        
        total_likes = sum(p.get("likes_count", 0) for p in posts)
        total_comments = sum(p.get("comments_count", 0) for p in posts)
        
        # Get channel details
        channel = await db.channels.find_one(
            {"id": channel_id},
            {"member_count": 1, "post_count": 1}
        )
        
        return {
            "total_members": channel.get("member_count", 0),
            "new_members": new_members,
            "total_posts": channel.get("post_count", 0),
            "recent_posts": post_count,
            "total_likes": total_likes,
            "total_comments": total_comments,
            "engagement_rate": round((total_likes + total_comments) / max(post_count, 1), 2),
            "period_days": days
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")
