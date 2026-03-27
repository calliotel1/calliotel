"""
Admin API Routes
Admin-only endpoints for platform management
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging
from datetime import datetime, timezone, timedelta
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


async def is_admin(current_user) -> bool:
    """Check if user is admin"""
    # SUPER ADMIN EMAILS - Add your email here!
    admin_emails = [
        "admin@calliotel.com",      # Default admin
        "bigboss@calliotel.com",    # Bigboss account
        "alinmy77@gmail.com",       # Bigboss - Main account
        "worl212211@yahoo.com",     # Bigboss - Yahoo account
    ]
    
    # Check both _id (email-based auth) and email field
    user_email = current_user.get("_id") or current_user.get("email")
    
    return user_email in admin_emails


@router.get("/users")
async def get_user_stats(current_user = Depends(get_current_user)):
    """Get user statistics"""
    try:
        if not await is_admin(current_user):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Total users
        total = await db.users.count_documents({})
        
        # New users today
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        new_today = await db.users.count_documents({
            "created_at": {"$gte": today_start.isoformat()}
        })
        
        # Active users (logged in last 7 days)
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        active = await db.users.count_documents({
            "last_login": {"$gte": week_ago}
        })
        
        return {
            "success": True,
            "total": total,
            "new_today": new_today,
            "active": active
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user stats")


@router.get("/users/list")
async def get_users_list(
    limit: int = 50,
    current_user = Depends(get_current_user)
):
    """Get list of users"""
    try:
        if not await is_admin(current_user):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        users = await db.users.find(
            {},
            {"_id": 0, "password": 0}  # Exclude sensitive fields
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "users": users
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting users list: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get users")


@router.get("/videos")
async def get_video_stats(current_user = Depends(get_current_user)):
    """Get video statistics"""
    try:
        if not await is_admin(current_user):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Total videos
        total = await db.video_messages.count_documents({})
        
        # Total views
        pipeline = [
            {"$group": {"_id": None, "total_views": {"$sum": "$total_views"}}}
        ]
        result = await db.video_messages.aggregate(pipeline).to_list(1)
        total_views = result[0]["total_views"] if result else 0
        
        # Total reactions
        total_reactions = await db.video_reactions.count_documents({})
        
        return {
            "success": True,
            "total": total,
            "total_views": total_views,
            "total_reactions": total_reactions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting video stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get video stats")


@router.get("/revenue")
async def get_revenue_stats(current_user = Depends(get_current_user)):
    """Get revenue statistics"""
    try:
        if not await is_admin(current_user):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Total revenue from wallet transactions
        pipeline = [
            {"$match": {"type": {"$in": ["deposit", "super_reaction_earnings", "voice_sale"]}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        result = await db.wallet_transactions.aggregate(pipeline).to_list(1)
        total_revenue = result[0]["total"] if result else 0
        
        # Monthly revenue
        month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_pipeline = [
            {"$match": {
                "type": {"$in": ["deposit", "super_reaction_earnings", "voice_sale"]},
                "timestamp": {"$gte": month_start.isoformat()}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        monthly_result = await db.wallet_transactions.aggregate(monthly_pipeline).to_list(1)
        monthly_revenue = monthly_result[0]["total"] if monthly_result else 0
        
        # Premium users
        premium_users = await db.users.count_documents({"premium_story_empire": True})
        
        return {
            "success": True,
            "total": round(total_revenue, 2),
            "monthly": round(monthly_revenue, 2),
            "premium_users": premium_users
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting revenue stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get revenue stats")


@router.get("/content/recent")
async def get_recent_content(
    limit: int = 20,
    current_user = Depends(get_current_user)
):
    """Get recent content"""
    try:
        if not await is_admin(current_user):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        videos = await db.video_messages.find(
            {},
            {"_id": 0}
        ).sort("sent_at", -1).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "videos": videos
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting content: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get content")


@router.get("/transactions")
async def get_transactions(
    limit: int = 50,
    current_user = Depends(get_current_user)
):
    """Get recent transactions"""
    try:
        if not await is_admin(current_user):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        transactions = await db.wallet_transactions.find(
            {},
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "transactions": transactions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get transactions")


@router.post("/users/{user_id}/ban")
async def ban_user(user_id: str, current_user = Depends(get_current_user)):
    """Ban a user"""
    try:
        if not await is_admin(current_user):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = await db.users.update_one(
            {"$or": [{"user_id": user_id}, {"email": user_id}]},
            {"$set": {"banned": True, "banned_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"success": True, "message": "User banned successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error banning user: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to ban user")


@router.delete("/content/{content_id}/delete")
async def delete_content(content_id: str, current_user = Depends(get_current_user)):
    """Delete content"""
    try:
        if not await is_admin(current_user):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Delete from video_messages
        result = await db.video_messages.delete_one({"message_id": content_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Delete associated reactions and views
        await db.video_reactions.delete_many({"video_id": content_id})
        await db.video_views.delete_many({"video_id": content_id})
        
        return {"success": True, "message": "Content deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting content: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete content")
