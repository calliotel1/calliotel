"""
Video Messages API - Revolutionary Video Messaging
Features:
- Video upload/recording
- Voice changer integration
- View-once mode
- Scheduled videos
- AI captions
- Fun filters
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import logging
from datetime import datetime, timezone, timedelta
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import shutil
from pathlib import Path
import ffmpeg
import subprocess
import json
import base64
from PIL import Image
import io
from services.video_processing import (
    get_filter_processor,
    get_voice_cloner,
    get_caption_generator
)
from data.video_filters import VIDEO_FILTERS, VOICE_EFFECTS, FILTER_CATEGORIES, TOTAL_FILTERS

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize processors
filter_processor = get_filter_processor()
voice_cloner = get_voice_cloner()
caption_generator = get_caption_generator()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Storage directories
VIDEO_UPLOAD_DIR = Path("/app/backend/uploads/videos")
THUMBNAIL_DIR = Path("/app/backend/uploads/video_thumbnails")
VIDEO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)

# Video constraints
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
MAX_DURATION = 300  # 5 minutes


class VideoMessageRequest(BaseModel):
    recipient_id: str
    duration: float
    view_once: bool = False
    voice_effect: Optional[str] = None
    filter_effect: Optional[str] = None
    caption: Optional[str] = None
    scheduled_time: Optional[str] = None


class VideoMessageResponse(BaseModel):
    message_id: str
    video_url: str
    thumbnail_url: str
    duration: float
    status: str


def get_video_info(video_path: str) -> dict:
    """Get video metadata using ffprobe"""
    try:
        probe = ffmpeg.probe(video_path)
        video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
        audio_info = next((s for s in probe['streams'] if s['codec_type'] == 'audio'), None)
        
        return {
            'duration': float(probe['format']['duration']),
            'width': int(video_info['width']),
            'height': int(video_info['height']),
            'has_audio': audio_info is not None,
            'size': int(probe['format']['size'])
        }
    except Exception as e:
        logger.error(f"Error getting video info: {str(e)}")
        return None


def generate_thumbnail(video_path: str, thumbnail_path: str, timestamp: float = 1.0):
    """Generate video thumbnail at specific timestamp"""
    try:
        (
            ffmpeg
            .input(video_path, ss=timestamp)
            .filter('scale', 320, -1)
            .output(thumbnail_path, vframes=1, format='image2', vcodec='mjpeg')
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True, quiet=True)
        )
        return True
    except ffmpeg.Error as e:
        logger.error(f"Error generating thumbnail: {e.stderr.decode()}")
        return False


def compress_video(input_path: str, output_path: str, target_size_mb: int = 10):
    """Compress video to reduce file size"""
    try:
        (
            ffmpeg
            .input(input_path)
            .output(
                output_path,
                **{
                    'c:v': 'libx264',
                    'crf': '28',
                    'preset': 'fast',
                    'c:a': 'aac',
                    'b:a': '128k',
                    'movflags': '+faststart'
                }
            )
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True, quiet=True)
        )
        return True
    except ffmpeg.Error as e:
        logger.error(f"Error compressing video: {e.stderr.decode()}")
        return False


def apply_voice_effect_to_video(video_path: str, output_path: str, voice_effect: str):
    """Apply voice effect to video audio"""
    try:
        # Voice effect parameters based on effect type
        effects = {
            'chipmunk': {'atempo': '1.3', 'asetrate': '48000*1.5'},
            'darth_vader': {'atempo': '0.9', 'asetrate': '48000*0.7'},
            'robot': {'atempo': '0.95', 'aphaser': 'in_gain=0.4'},
            'deep': {'atempo': '0.95', 'asetrate': '48000*0.8'},
            'female': {'atempo': '1.05', 'asetrate': '48000*1.3'},
        }
        
        effect_params = effects.get(voice_effect, {})
        
        if not effect_params:
            # No effect, just copy
            shutil.copy(video_path, output_path)
            return True
        
        # Apply audio filter
        audio_filter = ','.join([f"{k}={v}" for k, v in effect_params.items()])
        
        (
            ffmpeg
            .input(video_path)
            .output(
                output_path,
                **{
                    'c:v': 'copy',
                    'af': audio_filter,
                    'c:a': 'aac'
                }
            )
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True, quiet=True)
        )
        return True
    except Exception as e:
        logger.error(f"Error applying voice effect: {str(e)}")
        return False


@router.post("/upload", response_model=VideoMessageResponse)
async def upload_video_message(
    file: UploadFile = File(...),
    recipient_id: str = Form(...),
    view_once: bool = Form(False),
    voice_effect: Optional[str] = Form(None),
    filter_effect: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    scheduled_time: Optional[str] = Form(None),
    current_user = Depends(get_current_user)
):
    """
    Upload a video message with optional voice effects and filters
    """
    try:
        # Validate file size
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > MAX_VIDEO_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Video too large. Max size: {MAX_VIDEO_SIZE // (1024*1024)}MB"
            )
        
        # Generate unique ID
        video_id = str(uuid.uuid4())
        temp_path = VIDEO_UPLOAD_DIR / f"{video_id}_temp.mp4"
        final_path = VIDEO_UPLOAD_DIR / f"{video_id}.mp4"
        thumbnail_path = THUMBNAIL_DIR / f"{video_id}.jpg"
        
        # Save uploaded file
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get video info
        video_info = get_video_info(str(temp_path))
        
        if not video_info:
            temp_path.unlink()
            raise HTTPException(status_code=400, detail="Invalid video file")
        
        if video_info['duration'] > MAX_DURATION:
            temp_path.unlink()
            raise HTTPException(
                status_code=400,
                detail=f"Video too long. Max duration: {MAX_DURATION} seconds"
            )
        
        # Apply voice effect if requested
        processed_path = temp_path
        
        if voice_effect and voice_effect != 'none':
            logger.info(f"Applying voice effect: {voice_effect}")
            voice_output = VIDEO_UPLOAD_DIR / f"{video_id}_voice.mp4"
            
            # Try ElevenLabs voice cloning first if available
            if voice_effect == 'elevenlabs' and voice_cloner:
                logger.info("Using ElevenLabs for voice cloning")
                if voice_cloner.clone_video_voice(str(temp_path), str(voice_output)):
                    processed_path = voice_output
                else:
                    # Fallback to FFmpeg effects
                    if apply_voice_effect_to_video(str(temp_path), str(voice_output), voice_effect):
                        processed_path = voice_output
            else:
                # Use FFmpeg audio effects
                if apply_voice_effect_to_video(str(temp_path), str(voice_output), voice_effect):
                    processed_path = voice_output
        
        # Apply video filter if requested
        if filter_effect and filter_effect != 'none' and filter_processor:
            logger.info(f"Applying filter: {filter_effect}")
            filter_output = VIDEO_UPLOAD_DIR / f"{video_id}_filter.mp4"
            
            # CSS filters (vintage, noir, neon)
            if filter_effect in ['vintage', 'noir', 'neon']:
                if filter_processor.apply_css_filter(str(processed_path), str(filter_output), filter_effect):
                    if processed_path != temp_path:
                        processed_path.unlink()
                    processed_path = filter_output
            # Face-based filters (cat, dog, alien, etc.)
            elif filter_effect in ['cat', 'dog', 'donkey', 'alien', 'robot', 'clown', 'pirate']:
                if filter_processor.apply_face_filter(str(processed_path), str(filter_output), filter_effect):
                    if processed_path != temp_path:
                        processed_path.unlink()
                    processed_path = filter_output
        
        # Compress and move to final location
        logger.info("Compressing video")
        if not compress_video(str(processed_path), str(final_path)):
            # If compression fails, just use processed video
            if processed_path != temp_path:
                shutil.move(str(processed_path), str(final_path))
            else:
                shutil.move(str(temp_path), str(final_path))
        else:
            # Cleanup temp files
            if processed_path != temp_path and processed_path.exists():
                processed_path.unlink()
            if temp_path.exists():
                temp_path.unlink()
        
        # Generate thumbnail
        generate_thumbnail(str(final_path), str(thumbnail_path))
        
        # Prepare scheduled time if provided
        send_at = None
        status = "sent"
        
        if scheduled_time:
            try:
                send_at = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
                status = "scheduled"
            except:
                pass
        
        # Create message document
        message = {
            "message_id": video_id,
            "sender": current_user["_id"],
            "recipient": recipient_id,
            "type": "video",
            "video_path": str(final_path),
            "thumbnail_path": str(thumbnail_path),
            "duration": video_info['duration'],
            "width": video_info['width'],
            "height": video_info['height'],
            "file_size": os.path.getsize(final_path),
            "view_once": view_once,
            "viewed": False,
            "voice_effect": voice_effect,
            "filter_effect": filter_effect,
            "caption": caption,
            "status": status,
            "scheduled_at": send_at.isoformat() if send_at else None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "deleted": False
        }
        
        # Save to database
        if status == "scheduled":
            await db.scheduled_video_messages.insert_one(message)
            logger.info(f"Video message scheduled for {send_at}")
        else:
            await db.messages.insert_one(message)
            logger.info(f"Video message sent from {current_user['_id']} to {recipient_id}")
        
        return VideoMessageResponse(
            message_id=video_id,
            video_url=f"/api/video-messages/stream/{video_id}",
            thumbnail_url=f"/api/video-messages/thumbnail/{video_id}",
            duration=video_info['duration'],
            status=status
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading video message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload video message")


@router.get("/stream/{video_id}")
async def stream_video(video_id: str, current_user = Depends(get_current_user)):
    """
    Stream video message
    """
    try:
        # Find message
        message = await db.messages.find_one({"message_id": video_id})
        
        if not message:
            # Check scheduled messages
            message = await db.scheduled_video_messages.find_one({"message_id": video_id})
        
        if not message:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Check permissions
        if message['sender'] != current_user["_id"] and message['recipient'] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if view-once and already viewed
        if message.get('view_once') and message.get('viewed'):
            raise HTTPException(status_code=410, detail="Video has been viewed and deleted")
        
        video_path = Path(message['video_path'])
        
        if not video_path.exists():
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # Mark as viewed if view-once
        if message.get('view_once') and not message.get('viewed'):
            await db.messages.update_one(
                {"message_id": video_id},
                {"$set": {"viewed": True, "viewed_at": datetime.now(timezone.utc).isoformat()}}
            )
            # Schedule deletion after 10 seconds
            # In production, use background job
        
        return FileResponse(
            video_path,
            media_type="video/mp4",
            filename=f"video_{video_id}.mp4"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error streaming video: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to stream video")


@router.get("/thumbnail/{video_id}")
async def get_thumbnail(video_id: str, current_user = Depends(get_current_user)):
    """
    Get video thumbnail
    """
    try:
        thumbnail_path = THUMBNAIL_DIR / f"{video_id}.jpg"
        
        if not thumbnail_path.exists():
            # Generate default thumbnail
            raise HTTPException(status_code=404, detail="Thumbnail not found")
        
        return FileResponse(thumbnail_path, media_type="image/jpeg")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting thumbnail: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get thumbnail")


@router.get("/my-videos")
async def get_my_videos(current_user = Depends(get_current_user)):
    """Get all videos sent by current user"""
    try:
        user_id = current_user["_id"]
        
        # Get videos sent by this user
        videos = await db.video_messages.find(
            {"sender_id": user_id},
            {"_id": 0}
        ).sort("sent_at", -1).limit(100).to_list(100)
        
        return {
            "success": True,
            "videos": videos
        }
        
    except Exception as e:
        logger.error(f"Error getting my videos: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get videos")


@router.delete("/{video_id}")
async def delete_video_message(video_id: str, current_user = Depends(get_current_user)):
    """
    Delete video message
    """
    try:
        message = await db.messages.find_one({"message_id": video_id})
        
        if not message:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Check permissions
        if message['sender'] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Mark as deleted
        await db.messages.update_one(
            {"message_id": video_id},
            {"$set": {"deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Delete files
        try:
            video_path = Path(message['video_path'])
            thumbnail_path = Path(message['thumbnail_path'])
            
            if video_path.exists():
                video_path.unlink()
            if thumbnail_path.exists():
                thumbnail_path.unlink()
        except Exception as e:
            logger.warning(f"Error deleting files: {str(e)}")
        
        return {"success": True, "message": "Video deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting video: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete video")


@router.get("/filters")
async def get_video_filters():
    """
    Get available video filters - THE MOST IN THE WORLD! 🌍👑
    69 FILTERS + 7 VOICE EFFECTS = 76 TOTAL OPTIONS!
    """
    return {
        "success": True,
        "filters": VIDEO_FILTERS,
        "voice_effects": VOICE_EFFECTS,
        "categories": FILTER_CATEGORIES,
        "total_filters": TOTAL_FILTERS,
        "total_voice_effects": len(VOICE_EFFECTS),
        "total_options": TOTAL_FILTERS + len(VOICE_EFFECTS),
        "message": "🚀 NUMBER ONE IN THE WORLD! 👑"
    }


@router.get("/music-genres")
async def get_music_genres_endpoint():
    """Get available music genres for story videos"""
    from services.music_generator import get_music_genres
    
    return {
        "success": True,
        "genres": get_music_genres(),
        "auto_detect": True
    }


@router.post("/generate-caption/{video_id}")
async def generate_ai_caption(video_id: str, current_user = Depends(get_current_user)):
    """
    Generate AI caption for a video using GPT-4o-mini
    """
    try:
        if not caption_generator:
            raise HTTPException(status_code=503, detail="AI caption service not available")
        
        # Find video
        message = await db.messages.find_one({"message_id": video_id, "sender": current_user["_id"]})
        
        if not message:
            message = await db.scheduled_video_messages.find_one({"message_id": video_id, "sender": current_user["_id"]})
        
        if not message:
            raise HTTPException(status_code=404, detail="Video not found")
        
        video_path = message['video_path']
        
        if not Path(video_path).exists():
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # Generate caption
        caption = caption_generator.generate_caption(video_path)
        
        if not caption:
            raise HTTPException(status_code=500, detail="Failed to generate caption")
        
        return {
            "success": True,
            "caption": caption,
            "video_id": video_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating caption: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate caption")
