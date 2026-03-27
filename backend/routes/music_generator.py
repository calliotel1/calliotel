from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
from services.music_generator import get_background_music, detect_story_mood, get_music_genres

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


class MusicGenerateRequest(BaseModel):
    genre: str = "auto"
    story_text: str = ""


@router.get("/genres")
async def get_genres():
    """Get available music genres"""
    try:
        genres = get_music_genres()
        return {
            "success": True,
            "genres": genres
        }
    except Exception as e:
        logger.error(f"Error getting genres: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get genres")


@router.post("/generate")
async def generate_music(
    request: MusicGenerateRequest,
    current_user = Depends(get_current_user)
):
    """Generate or select background music"""
    try:
        # Auto-detect genre if needed
        genre = request.genre
        if genre == "auto" and request.story_text:
            genre = detect_story_mood(request.story_text)
            logger.info(f"Auto-detected genre: {genre}")
        
        # Get music file
        music_path = await get_background_music(genre, request.story_text)
        
        if not music_path or not music_path.exists():
            # Return success with genre info but no file
            from services.music_generator import MUSIC_GENRES
            genre_info = MUSIC_GENRES.get(genre, {})
            
            return {
                "success": True,
                "genre": genre,
                "genre_name": genre_info.get("name", genre),
                "message": f"Selected {genre_info.get('name', genre)} music",
                "music_url": None  # In MVP, music files are placeholders
            }
        
        # Return music URL
        music_url = f"/api/music-generator/stream/{genre}"
        
        from services.music_generator import MUSIC_GENRES
        genre_info = MUSIC_GENRES.get(genre, {})
        
        return {
            "success": True,
            "genre": genre,
            "genre_name": genre_info.get("name", genre),
            "music_url": music_url,
            "message": "Music generated successfully!"
        }
        
    except Exception as e:
        logger.error(f"Error generating music: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate music")


@router.get("/stream/{genre}")
async def stream_music(genre: str):
    """Stream music file"""
    try:
        from fastapi.responses import FileResponse
        from pathlib import Path
        
        music_file = Path("/app/backend/music_library") / f"{genre}.mp3"
        
        if not music_file.exists():
            raise HTTPException(status_code=404, detail="Music file not found")
        
        return FileResponse(
            music_file,
            media_type="audio/mpeg",
            filename=f"{genre}.mp3"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error streaming music: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to stream music")