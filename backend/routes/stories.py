"""
Stories Feature Router
Instagram/WhatsApp-style stories that expire after 24 hours
"""

from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import logging
import os
import secrets
import aiofiles
from uuid import uuid4
from routes.auth import get_current_user
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Import gamification functions
async def award_xp_to_user(user_id: str, xp: int, reason: str):
    try:
        from routes.gamification import award_xp
        result = await award_xp(user_id, xp, reason)
        return result
    except Exception as e:
        logger.error(f"Error awarding XP: {e}")
        return {"xp_gained": 0, "new_total": 0, "level_up": False}

async def update_user_stat(user_id: str, stat_name: str, increment: int = 1):
    try:
        from routes.gamification import update_stat
        await update_stat(user_id, stat_name, increment)
    except Exception as e:
        logger.error(f"Error updating stat: {e}")

# Stories storage directory
STORIES_DIR = "/app/media/stories"
os.makedirs(STORIES_DIR, exist_ok=True)

# File limits
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB
MAX_ACTIVE_STORIES = 10  # Max stories per user

class StoryCreate(BaseModel):
    caption: Optional[str] = None
    privacy: str = "all"  # all, selected, private
    selected_friends: Optional[List[str]] = None

class StoryReaction(BaseModel):
    reaction: str  # emoji

@router.post("/create")
async def create_story(
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    privacy: str = Form("all"),
    selected_friends: Optional[str] = Form(None),
    current_user = Depends(get_current_user)
):
    """
    Create a new story
    """
    try:
        # Validate file type
        is_image = file.content_type in ALLOWED_IMAGE_TYPES
        is_video = file.content_type in ALLOWED_VIDEO_TYPES
        
        if not (is_image or is_video):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only images and videos allowed"
            )
        
        # Read file
        content = await file.read()
        file_size = len(content)
        
        # Validate file size
        max_size = MAX_IMAGE_SIZE if is_image else MAX_VIDEO_SIZE
        if file_size > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Max: {max_size / 1024 / 1024}MB"
            )
        
        # Check max active stories
        active_count = await db.stories.count_documents({
            "user_id": current_user["_id"],
            "is_expired": False
        })
        
        if active_count >= MAX_ACTIVE_STORIES:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum {MAX_ACTIVE_STORIES} active stories reached"
            )
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ('jpg' if is_image else 'mp4')
        unique_filename = f"{secrets.token_hex(16)}.{file_extension}"
        file_path = f"{STORIES_DIR}/{unique_filename}"
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Create story document
        story_id = str(uuid4())
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=24)
        
        # Parse selected_friends if provided
        selected_friends_list = []
        if selected_friends and privacy == "selected":
            selected_friends_list = [f.strip() for f in selected_friends.split(',')]
        
        story_doc = {
            "id": story_id,
            "user_id": current_user["_id"],
            "media_url": f"/media/stories/{unique_filename}",
            "media_type": "image" if is_image else "video",
            "caption": caption or "",
            "privacy": privacy,
            "selected_friends": selected_friends_list,
            "created_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "is_expired": False,
            "views_count": 0,
            "reactions_count": 0,
            "file_path": file_path
        }
        
        await db.stories.insert_one(story_doc)
        
        # Award XP for posting story (10 XP)
        xp_result = await award_xp_to_user(current_user["_id"], 10, "Story posted")
        await update_user_stat(current_user["_id"], "stories_posted", 1)
        
        logger.info(f"Story created: {story_id} by {current_user['_id']}")
        
        return {
            "success": True,
            "story": {
                "id": story_id,
                "media_url": story_doc["media_url"],
                "media_type": story_doc["media_type"],
                "caption": caption,
                "expires_at": expires_at.isoformat()
            },
            "gamification": xp_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating story: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create story")

@router.get("/active")
async def get_active_stories(current_user = Depends(get_current_user)):
    """
    Get all active stories from friends (and own stories)
    """
    try:
        # Get user's friends
        friends_data = await db.friendships.find({
            "$or": [
                {"user_id": current_user["_id"], "status": "accepted"},
                {"friend_id": current_user["_id"], "status": "accepted"}
            ]
        }, {"_id": 0}).to_list(1000)
        
        friend_ids = set()
        for friendship in friends_data:
            if friendship["user_id"] == current_user["_id"]:
                friend_ids.add(friendship["friend_id"])
            else:
                friend_ids.add(friendship["user_id"])
        
        # Add self to see own stories
        friend_ids.add(current_user["_id"])
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Get all active stories
        stories_cursor = db.stories.find({
            "user_id": {"$in": list(friend_ids)},
            "is_expired": False,
            "expires_at": {"$gt": now}
        }, {"_id": 0, "file_path": 0}).sort("created_at", -1)
        
        stories = await stories_cursor.to_list(1000)
        
        # Group stories by user
        stories_by_user = {}
        for story in stories:
            user_id = story["user_id"]
            if user_id not in stories_by_user:
                stories_by_user[user_id] = []
            
            # Check if current user has viewed this story
            has_viewed = await db.story_views.find_one({
                "story_id": story["id"],
                "viewer_id": current_user["_id"]
            })
            
            story["has_viewed"] = has_viewed is not None
            stories_by_user[user_id].append(story)
        
        # Get user info for each user with stories
        result = []
        for user_id, user_stories in stories_by_user.items():
            user = await db.users.find_one({"_id": user_id}, {"_id": 0, "password": 0})
            if user:
                result.append({
                    "user": {
                        "id": user.get("id", user_id),
                        "email": user.get("email"),
                        "full_name": user.get("full_name")
                    },
                    "stories": user_stories,
                    "has_unviewed": any(not s["has_viewed"] for s in user_stories)
                })
        
        return {
            "success": True,
            "stories": result,
            "total": len(stories)
        }
        
    except Exception as e:
        logger.error(f"Error fetching active stories: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch stories")

@router.get("/my-active")
async def get_my_active_stories(current_user = Depends(get_current_user)):
    """
    Get current user's active stories
    """
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        stories = await db.stories.find({
            "user_id": current_user["_id"],
            "is_expired": False,
            "expires_at": {"$gt": now}
        }, {"_id": 0, "file_path": 0}).sort("created_at", -1).to_list(100)
        
        return {
            "success": True,
            "stories": stories,
            "total": len(stories)
        }
        
    except Exception as e:
        logger.error(f"Error fetching my stories: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch stories")

@router.get("/{story_id}")
async def get_story(story_id: str, current_user = Depends(get_current_user)):
    """
    Get specific story details
    """
    try:
        story = await db.stories.find_one({"id": story_id}, {"_id": 0, "file_path": 0})
        
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")
        
        # Check if expired
        if story["is_expired"] or datetime.fromisoformat(story["expires_at"]) < datetime.now(timezone.utc):
            raise HTTPException(status_code=410, detail="Story has expired")
        
        # Check privacy
        if story["privacy"] == "private" and story["user_id"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Private story")
        
        if story["privacy"] == "selected":
            if current_user["_id"] not in story["selected_friends"] and story["user_id"] != current_user["_id"]:
                raise HTTPException(status_code=403, detail="Story not shared with you")
        
        return {
            "success": True,
            "story": story
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching story: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch story")

@router.post("/{story_id}/view")
async def view_story(story_id: str, current_user = Depends(get_current_user)):
    """
    Mark story as viewed
    """
    try:
        # Check if story exists and is active
        story = await db.stories.find_one({"id": story_id})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")
        
        # Check if already viewed
        existing_view = await db.story_views.find_one({
            "story_id": story_id,
            "viewer_id": current_user["_id"]
        })
        
        if existing_view:
            return {"success": True, "message": "Already viewed"}
        
        # Create view record
        view_doc = {
            "id": str(uuid4()),
            "story_id": story_id,
            "viewer_id": current_user["_id"],
            "viewed_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.story_views.insert_one(view_doc)
        
        # Update view count
        await db.stories.update_one(
            {"id": story_id},
            {"$inc": {"views_count": 1}}
        )
        
        logger.info(f"Story {story_id} viewed by {current_user['_id']}")
        
        return {"success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error viewing story: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to view story")

@router.get("/{story_id}/views")
async def get_story_views(story_id: str, current_user = Depends(get_current_user)):
    """
    Get list of users who viewed the story (only for story owner)
    """
    try:
        # Check if user owns the story
        story = await db.stories.find_one({"id": story_id})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")
        
        if story["user_id"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Get all views
        views = await db.story_views.find(
            {"story_id": story_id},
            {"_id": 0}
        ).sort("viewed_at", -1).to_list(1000)
        
        # Get user details for each viewer
        result = []
        for view in views:
            user = await db.users.find_one(
                {"_id": view["viewer_id"]},
                {"_id": 0, "password": 0, "id": 1, "email": 1, "full_name": 1}
            )
            if user:
                result.append({
                    "viewer": user,
                    "viewed_at": view["viewed_at"]
                })
        
        return {
            "success": True,
            "views": result,
            "total": len(result)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching story views: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch views")

@router.post("/{story_id}/react")
async def react_to_story(
    story_id: str,
    reaction: StoryReaction,
    current_user = Depends(get_current_user)
):
    """
    React to a story with emoji
    """
    try:
        # Check if story exists
        story = await db.stories.find_one({"id": story_id})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")
        
        # Check if already reacted
        existing_reaction = await db.story_reactions.find_one({
            "story_id": story_id,
            "user_id": current_user["_id"]
        })
        
        if existing_reaction:
            # Update reaction
            await db.story_reactions.update_one(
                {"id": existing_reaction["id"]},
                {"$set": {"reaction": reaction.reaction}}
            )
        else:
            # Create new reaction
            reaction_doc = {
                "id": str(uuid4()),
                "story_id": story_id,
                "user_id": current_user["_id"],
                "reaction": reaction.reaction,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.story_reactions.insert_one(reaction_doc)
            
            # Update reaction count
            await db.stories.update_one(
                {"id": story_id},
                {"$inc": {"reactions_count": 1}}
            )
        
        logger.info(f"Reaction {reaction.reaction} added to story {story_id} by {current_user['_id']}")
        
        return {"success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reacting to story: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to react")

@router.delete("/{story_id}")
async def delete_story(story_id: str, current_user = Depends(get_current_user)):
    """
    Delete own story
    """
    try:
        # Check if user owns the story
        story = await db.stories.find_one({"id": story_id})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")
        
        if story["user_id"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Delete file
        if os.path.exists(story["file_path"]):
            os.remove(story["file_path"])
        
        # Delete story document
        await db.stories.delete_one({"id": story_id})
        
        # Delete associated views and reactions
        await db.story_views.delete_many({"story_id": story_id})
        await db.story_reactions.delete_many({"story_id": story_id})
        
        logger.info(f"Story {story_id} deleted by {current_user['_id']}")
        
        return {"success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting story: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete story")

@router.post("/cleanup-expired")
async def cleanup_expired_stories():
    """
    Cleanup expired stories (to be called by cron job)
    """
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Find expired stories
        expired_stories = await db.stories.find({
            "is_expired": False,
            "expires_at": {"$lt": now}
        }).to_list(1000)
        
        deleted_count = 0
        for story in expired_stories:
            # Delete file
            if os.path.exists(story.get("file_path", "")):
                os.remove(story["file_path"])
            
            # Mark as expired
            await db.stories.update_one(
                {"id": story["id"]},
                {"$set": {"is_expired": True}}
            )
            
            deleted_count += 1
        
        logger.info(f"Cleaned up {deleted_count} expired stories")
        
        return {
            "success": True,
            "cleaned_up": deleted_count
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up stories: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cleanup stories")
