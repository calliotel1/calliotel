"""
Media Upload Router
Handles image/video uploads for chat messages and stickers
"""

from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import logging
import os
import secrets
import base64
from typing import Optional
from routes.auth import get_current_user
import aiofiles

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Media storage directory
MEDIA_DIR = "/app/media"
os.makedirs(MEDIA_DIR, exist_ok=True)
os.makedirs(f"{MEDIA_DIR}/images", exist_ok=True)
os.makedirs(f"{MEDIA_DIR}/videos", exist_ok=True)
os.makedirs(f"{MEDIA_DIR}/stickers", exist_ok=True)

# Allowed file types
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB

class MediaUploadResponse(BaseModel):
    success: bool
    media_url: str
    media_type: str
    file_name: str

@router.post("/upload/image", response_model=MediaUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Upload image for chat or sticker
    """
    try:
        # Validate file type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
            )
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Validate file size
        if file_size > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_IMAGE_SIZE / 1024 / 1024}MB"
            )
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"{secrets.token_hex(16)}.{file_extension}"
        file_path = f"{MEDIA_DIR}/images/{unique_filename}"
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Store metadata in database
        media_doc = {
            "user_id": current_user["_id"],
            "file_name": unique_filename,
            "original_name": file.filename,
            "file_type": file.content_type,
            "file_size": file_size,
            "media_type": "image",
            "file_path": file_path,
            "url": f"/media/images/{unique_filename}",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.media.insert_one(media_doc)
        
        logger.info(f"Image uploaded: {unique_filename} by {current_user['_id']}")
        
        return MediaUploadResponse(
            success=True,
            media_url=f"/media/images/{unique_filename}",
            media_type="image",
            file_name=unique_filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

@router.post("/upload/video", response_model=MediaUploadResponse)
async def upload_video(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Upload video for chat
    """
    try:
        # Validate file type
        if file.content_type not in ALLOWED_VIDEO_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_VIDEO_TYPES)}"
            )
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Validate file size
        if file_size > MAX_VIDEO_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_VIDEO_SIZE / 1024 / 1024}MB"
            )
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'mp4'
        unique_filename = f"{secrets.token_hex(16)}.{file_extension}"
        file_path = f"{MEDIA_DIR}/videos/{unique_filename}"
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Store metadata
        media_doc = {
            "user_id": current_user["_id"],
            "file_name": unique_filename,
            "original_name": file.filename,
            "file_type": file.content_type,
            "file_size": file_size,
            "media_type": "video",
            "file_path": file_path,
            "url": f"/media/videos/{unique_filename}",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.media.insert_one(media_doc)
        
        logger.info(f"Video uploaded: {unique_filename} by {current_user['_id']}")
        
        return MediaUploadResponse(
            success=True,
            media_url=f"/media/videos/{unique_filename}",
            media_type="video",
            file_name=unique_filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading video: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload video")

@router.post("/sticker/create")
async def create_sticker(
    file: UploadFile = File(...),
    name: str = Form(...),
    tags: Optional[str] = Form(None),
    current_user = Depends(get_current_user)
):
    """
    Create custom sticker from uploaded image
    """
    try:
        # Validate file type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Only images allowed for stickers")
        
        # Read file
        content = await file.read()
        file_size = len(content)
        
        if file_size > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail="Image too large for sticker")
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'png'
        unique_filename = f"{secrets.token_hex(16)}.{file_extension}"
        file_path = f"{MEDIA_DIR}/stickers/{unique_filename}"
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Generate custom ID
        from uuid import uuid4
        sticker_id = str(uuid4())
        
        # Create sticker record
        sticker_doc = {
            "id": sticker_id,
            "user_id": current_user["_id"],
            "name": name,
            "file_name": unique_filename,
            "file_path": file_path,
            "url": f"/media/stickers/{unique_filename}",
            "tags": [tag.strip() for tag in tags.split(',')] if tags else [],
            "file_size": file_size,
            "is_custom": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.stickers.insert_one(sticker_doc)
        
        logger.info(f"Custom sticker created: {name} by {current_user['_id']}")
        
        return {
            "success": True,
            "sticker": {
                "id": sticker_id,
                "name": name,
                "url": f"/media/stickers/{unique_filename}",
                "is_custom": True
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating sticker: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create sticker")

@router.get("/stickers/my")
async def get_my_stickers(current_user = Depends(get_current_user)):
    """
    Get user's custom stickers
    """
    try:
        stickers = await db.stickers.find(
            {"user_id": current_user["_id"], "is_custom": True},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return {
            "success": True,
            "stickers": stickers,
            "total": len(stickers)
        }
        
    except Exception as e:
        logger.error(f"Error fetching stickers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch stickers")

@router.get("/stickers/popular")
async def get_popular_stickers():
    """
    Get popular/default sticker packs
    """
    try:
        # Default sticker packs
        default_stickers = [
            {
                "pack_name": "Reactions",
                "stickers": [
                    {"emoji": "😂", "name": "Laughing"},
                    {"emoji": "❤️", "name": "Love"},
                    {"emoji": "🔥", "name": "Fire"},
                    {"emoji": "👍", "name": "Thumbs Up"},
                    {"emoji": "🎉", "name": "Party"},
                    {"emoji": "😍", "name": "Heart Eyes"},
                    {"emoji": "🙏", "name": "Pray"},
                    {"emoji": "💯", "name": "100"},
                    {"emoji": "⭐", "name": "Star"},
                    {"emoji": "✨", "name": "Sparkles"}
                ]
            },
            {
                "pack_name": "Animals",
                "stickers": [
                    {"emoji": "🐶", "name": "Dog"},
                    {"emoji": "🐱", "name": "Cat"},
                    {"emoji": "🐼", "name": "Panda"},
                    {"emoji": "🦁", "name": "Lion"},
                    {"emoji": "🐯", "name": "Tiger"},
                    {"emoji": "🐻", "name": "Bear"},
                    {"emoji": "🐨", "name": "Koala"},
                    {"emoji": "🐷", "name": "Pig"}
                ]
            },
            {
                "pack_name": "Food",
                "stickers": [
                    {"emoji": "🍕", "name": "Pizza"},
                    {"emoji": "🍔", "name": "Burger"},
                    {"emoji": "🍟", "name": "Fries"},
                    {"emoji": "🍿", "name": "Popcorn"},
                    {"emoji": "🍦", "name": "Ice Cream"},
                    {"emoji": "🍰", "name": "Cake"},
                    {"emoji": "🍩", "name": "Donut"},
                    {"emoji": "🍪", "name": "Cookie"}
                ]
            }
        ]
        
        return {
            "success": True,
            "packs": default_stickers
        }
        
    except Exception as e:
        logger.error(f"Error fetching popular stickers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch stickers")

@router.delete("/sticker/{sticker_id}")
async def delete_sticker(
    sticker_id: str,
    current_user = Depends(get_current_user)
):
    """
    Delete custom sticker
    """
    try:
        sticker = await db.stickers.find_one({"id": sticker_id, "user_id": current_user["_id"]})
        
        if not sticker:
            raise HTTPException(status_code=404, detail="Sticker not found")
        
        # Delete file
        if os.path.exists(sticker["file_path"]):
            os.remove(sticker["file_path"])
        
        # Delete from database
        await db.stickers.delete_one({"id": sticker_id})
        
        logger.info(f"Sticker deleted: {sticker_id} by {current_user['_id']}")
        
        return {"success": True, "message": "Sticker deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting sticker: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete sticker")
