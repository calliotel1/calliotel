from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import asyncio
from services.kids_mode import (
    FAIRY_TALE_TEMPLATES,
    KID_IMAGE_STYLES,
    is_kid_safe,
    suggest_kid_friendly_version,
    get_kid_friendly_prompt_suffix
)

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Limits
FREE_VIDEOS_PER_MONTH = 2
PREMIUM_VIDEOS = 20


class KidsModeRequest(BaseModel):
    story_text: str
    image_style: str = "cartoon"
    use_template: Optional[str] = None


@router.get("/templates")
async def get_templates():
    """Get fairy tale templates"""
    return {
        "success": True,
        "templates": FAIRY_TALE_TEMPLATES
    }


@router.get("/usage")
async def get_usage(current_user = Depends(get_current_user)):
    """Get usage stats for current user"""
    try:
        user_id = current_user["_id"]
        
        # Check premium status - query by email (the identifier used in this system)
        user = await db.users.find_one({"email": user_id}, {"_id": 0})
        is_premium = user.get("premium_story_empire", False) if user else False
        
        # Count this month's videos
        now = datetime.now(timezone.utc)
        start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        
        count = await db.story_movies.count_documents({
            "user_id": user_id,
            "kids_mode": True,
            "created_at": {"$gte": start_of_month.isoformat()}
        })
        
        return {
            "success": True,
            "is_premium": is_premium,
            "used_this_month": count,
            "monthly_limit": PREMIUM_VIDEOS if is_premium else FREE_VIDEOS_PER_MONTH
        }
        
    except Exception as e:
        logger.error(f"Error getting usage: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get usage")


@router.post("/create")
async def create_kids_movie(
    request: KidsModeRequest,
    current_user = Depends(get_current_user)
):
    """Create a kid-safe story movie"""
    try:
        user_id = current_user["_id"]
        
        # Check if story is kid-safe
        is_safe, unsafe_keywords = is_kid_safe(request.story_text)
        
        if not is_safe:
            suggestion = suggest_kid_friendly_version(request.story_text)
            raise HTTPException(
                status_code=400,
                detail=f"Story contains inappropriate content. {suggestion}"
            )
        
        # Check usage limits - query by email (the identifier used in this system)
        user = await db.users.find_one({"email": user_id}, {"_id": 0})
        is_premium = user.get("premium_story_empire", False) if user else False
        
        now = datetime.now(timezone.utc)
        start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        
        count = await db.story_movies.count_documents({
            "user_id": user_id,
            "kids_mode": True,
            "created_at": {"$gte": start_of_month.isoformat()}
        })
        
        limit = PREMIUM_VIDEOS if is_premium else FREE_VIDEOS_PER_MONTH
        
        if count >= limit:
            raise HTTPException(
                status_code=402,
                detail=f"Monthly limit reached. Upgrade to premium for {PREMIUM_VIDEOS} videos/month!"
            )
        
        # Create movie record
        movie_id = str(uuid.uuid4())
        
        movie_doc = {
            "movie_id": movie_id,
            "user_id": user_id,
            "story_text": request.story_text,
            "image_style": request.image_style,
            "kids_mode": True,
            "status": "processing",
            "progress": "Starting kid-safe movie creation...",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.story_movies.insert_one(movie_doc)
        
        # Process asynchronously (simplified for MVP)
        asyncio.create_task(process_kids_movie(
            movie_id,
            request.story_text,
            request.image_style
        ))
        
        return {
            "success": True,
            "movie_id": movie_id,
            "message": "Creating kid-safe movie!",
            "status": "processing"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating kids movie: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create movie")


async def process_kids_movie(movie_id: str, story_text: str, image_style: str):
    """Process kid-safe movie (simplified)"""
    try:
        logger.info(f"Processing kids movie: {movie_id}")
        
        # Update progress
        await db.story_movies.update_one(
            {"movie_id": movie_id},
            {"$set": {"progress": "Generating kid-friendly images..."}}
        )
        
        # Simulate processing
        await asyncio.sleep(2)
        
        # Mark as completed (in production, actually process the video)
        await db.story_movies.update_one(
            {"movie_id": movie_id},
            {
                "$set": {
                    "status": "completed",
                    "video_url": f"/api/story-empire/video/{movie_id}",
                    "progress": "Complete!",
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"Kids movie completed: {movie_id}")
        
    except Exception as e:
        logger.error(f"Error processing kids movie: {str(e)}")
        await db.story_movies.update_one(
            {"movie_id": movie_id},
            {"$set": {"status": "failed", "error": str(e)}}
        )


@router.get("/my-movies")
async def get_my_kids_movies(current_user = Depends(get_current_user)):
    """Get user's kids movies"""
    try:
        movies = await db.story_movies.find(
            {"user_id": current_user["_id"], "kids_mode": True},
            {"_id": 0}
        ).sort("created_at", -1).limit(50).to_list(50)
        
        return {
            "success": True,
            "movies": movies
        }
        
    except Exception as e:
        logger.error(f"Error getting movies: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get movies")