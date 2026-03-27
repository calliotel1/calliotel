"""
Time Machine - Turn Old Photos into Animated Videos
Upload old family photos → AI animates them → Add narration → Memory movie!
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from pathlib import Path
import subprocess
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Storage
TIME_MACHINE_DIR = Path("/app/backend/uploads/time_machine")
TIME_MACHINE_DIR.mkdir(parents=True, exist_ok=True)

# Pricing
FREE_VIDEOS_PER_MONTH = 2
PREMIUM_VIDEOS = 20
PER_VIDEO_PRICE = 1.99  # Non-subscribers pay per video


class TimeMachineRequest(BaseModel):
    title: str
    narration_text: Optional[str] = None
    music_genre: str = "nostalgic"
    voice_style: str = "warm"


@router.post("/create")
async def create_time_machine_video(
    request: TimeMachineRequest,
    photos: List[UploadFile] = File(...),
    current_user = Depends(get_current_user)
):
    """
    Create a memory video from old photos
    """
    try:
        user_id = current_user["_id"]
        
        # Check usage limits
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        is_premium = user.get("premium_story_empire", False)
        
        # Count this month's videos
        now = datetime.now(timezone.utc)
        start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        
        count = await db.time_machine_videos.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": start_of_month.isoformat()}
        })
        
        limit = PREMIUM_VIDEOS if is_premium else FREE_VIDEOS_PER_MONTH
        
        if count >= limit and not is_premium:
            # Check if user wants to pay per video
            balance = user.get("wallet_balance", 0)
            if balance < PER_VIDEO_PRICE:
                raise HTTPException(
                    status_code=402,
                    detail=f"Monthly limit reached. Pay ${PER_VIDEO_PRICE} or upgrade to premium."
                )
            
            # Deduct payment
            await db.users.update_one(
                {"user_id": user_id},
                {"$inc": {"wallet_balance": -PER_VIDEO_PRICE}}
            )
            
            await db.wallet_transactions.insert_one({
                "transaction_id": str(uuid.uuid4()),
                "user_id": user_id,
                "type": "time_machine_video",
                "amount": -PER_VIDEO_PRICE,
                "description": f"Time Machine video: {request.title}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        
        # Save photos
        video_id = str(uuid.uuid4())
        photo_dir = TIME_MACHINE_DIR / video_id
        photo_dir.mkdir(parents=True, exist_ok=True)
        
        photo_paths = []
        for i, photo in enumerate(photos):
            photo_path = photo_dir / f"photo_{i+1}.jpg"
            
            with open(photo_path, 'wb') as f:
                content = await photo.read()
                f.write(content)
            
            photo_paths.append(str(photo_path))
        
        logger.info(f"Saved {len(photo_paths)} photos for video {video_id}")
        
        # Create video record
        video_doc = {
            "video_id": video_id,
            "user_id": user_id,
            "title": request.title,
            "narration_text": request.narration_text,
            "music_genre": request.music_genre,
            "voice_style": request.voice_style,
            "photo_paths": photo_paths,
            "photo_count": len(photo_paths),
            "status": "processing",
            "progress": "Animating photos...",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.time_machine_videos.insert_one(video_doc)
        
        # Start processing
        asyncio.create_task(process_time_machine_video(
            video_id,
            photo_paths,
            request.narration_text,
            request.music_genre,
            request.voice_style
        ))
        
        return {
            "success": True,
            "video_id": video_id,
            "message": f"✅ Processing {len(photos)} photos into a memory movie!",
            "status": "processing"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating time machine video: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create video")


async def process_time_machine_video(
    video_id: str,
    photo_paths: List[str],
    narration_text: Optional[str],
    music_genre: str,
    voice_style: str
):
    """
    Process photos into animated video
    """
    try:
        logger.info(f"⏰ Processing Time Machine video: {video_id}")
        
        # Update progress
        await db.time_machine_videos.update_one(
            {"video_id": video_id},
            {"$set": {"progress": "Enhancing photos (30%)..."}}
        )
        
        # Step 1: Enhance/restore old photos (AI colorization, upscaling)
        # For MVP: Use photos as-is
        # TODO: Integrate photo restoration API
        
        # Step 2: Add Ken Burns effect (zoom/pan)
        animated_photos = []
        for i, photo_path in enumerate(photo_paths):
            logger.info(f"Animating photo {i+1}/{len(photo_paths)}")
            
            animated_path = str(Path(photo_path).parent / f"animated_{i+1}.mp4")
            
            # Create Ken Burns zoom effect with FFmpeg
            cmd = [
                'ffmpeg', '-y',
                '-loop', '1',
                '-i', photo_path,
                '-vf', 'zoompan=z=\'min(zoom+0.0015,1.5)\':d=125:x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':s=1280x720',
                '-t', '5',  # 5 seconds per photo
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                animated_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                animated_photos.append(animated_path)
            else:
                logger.error(f"Animation failed for photo {i+1}")
                animated_photos.append(None)
            
            # Update progress
            progress = 30 + int((i + 1) / len(photo_paths) * 30)
            await db.time_machine_videos.update_one(
                {"video_id": video_id},
                {"$set": {"progress": f"Animating photos ({progress}%)..."}}
            )
        
        # Step 3: Generate narration if text provided
        audio_path = None
        if narration_text:
            logger.info("Generating narration...")
            await db.time_machine_videos.update_one(
                {"video_id": video_id},
                {"$set": {"progress": "Adding narration (70%)..."}}
            )
            
            # Use ElevenLabs for narration
            from services.music_generator import get_background_music
            # TODO: Generate narration audio
        
        # Step 4: Add background music
        logger.info("Adding music...")
        await db.time_machine_videos.update_one(
            {"video_id": video_id},
            {"$set": {"progress": "Adding music (80%)..."}}
        )
        
        from services.music_generator import get_background_music
        music_path = await get_background_music(music_genre if music_genre else "nostalgic", "")
        
        # Step 5: Combine all into final video
        logger.info("Creating final video...")
        await db.time_machine_videos.update_one(
            {"video_id": video_id},
            {"$set": {"progress": "Finalizing (90%)..."}}
        )
        
        output_path = TIME_MACHINE_DIR / f"{video_id}_final.mp4"
        
        # Create concat file
        concat_file = TIME_MACHINE_DIR / f"{video_id}_concat.txt"
        with open(concat_file, 'w') as f:
            for animated in animated_photos:
                if animated and Path(animated).exists():
                    f.write(f"file '{animated}'\n")
        
        # Concatenate videos
        if music_path and music_path.exists():
            cmd = [
                'ffmpeg', '-y',
                '-f', 'concat',
                '-safe', '0',
                '-i', str(concat_file),
                '-stream_loop', '-1',
                '-i', str(music_path),
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-shortest',
                str(output_path)
            ]
        else:
            cmd = [
                'ffmpeg', '-y',
                '-f', 'concat',
                '-safe', '0',
                '-i', str(concat_file),
                '-c:v', 'copy',
                str(output_path)
            ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"Video assembly failed: {result.stderr[:200]}")
        
        # Cleanup
        concat_file.unlink()
        
        # Update database
        await db.time_machine_videos.update_one(
            {"video_id": video_id},
            {
                "$set": {
                    "status": "completed",
                    "video_path": f"/api/time-machine/video/{video_id}",
                    "video_file": str(output_path),
                    "progress": "Complete (100%)",
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"✅ Time Machine video completed: {video_id}")
        
    except Exception as e:
        logger.error(f"Error processing Time Machine video: {str(e)}")
        await db.time_machine_videos.update_one(
            {"video_id": video_id},
            {"$set": {"status": "failed", "error": str(e)}}
        )


@router.get("/my-videos")
async def get_my_time_machine_videos(current_user = Depends(get_current_user)):
    """Get user's time machine videos"""
    try:
        videos = await db.time_machine_videos.find(
            {"user_id": current_user["_id"]},
            {"_id": 0}
        ).sort("created_at", -1).limit(50).to_list(50)
        
        return {
            "success": True,
            "videos": videos
        }
        
    except Exception as e:
        logger.error(f"Error getting videos: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get videos")


@router.get("/video/{video_id}")
async def stream_time_machine_video(video_id: str, current_user = Depends(get_current_user)):
    """Stream time machine video"""
    try:
        from fastapi.responses import FileResponse
        
        video = await db.time_machine_videos.find_one(
            {"video_id": video_id, "user_id": current_user["_id"]},
            {"_id": 0}
        )
        
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        if video['status'] != 'completed':
            raise HTTPException(status_code=400, detail="Video not ready")
        
        video_file = video.get('video_file')
        if not video_file or not Path(video_file).exists():
            raise HTTPException(status_code=404, detail="Video file not found")
        
        return FileResponse(
            video_file,
            media_type="video/mp4",
            filename=f"{video['title']}.mp4"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error streaming video: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to stream video")
