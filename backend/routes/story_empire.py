"""
🎬 STORY EMPIRE - AI Story to Movie Generator
Revolutionary feature: Convert text stories into cinematic videos!

Features:
- AI Content Moderation (safety first!)
- Scene breakdown with GPT-4
- Image generation for each scene
- Voice narration with ElevenLabs
- Background music & effects
- Video assembly with FFmpeg
- Premium tier: $2.99/month = 20 videos
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from pathlib import Path
import json
import asyncio
from openai import OpenAI
import requests

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI for content moderation & scene generation
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Storage
STORY_MOVIES_DIR = Path("/app/backend/uploads/story_movies")
STORY_MOVIES_DIR.mkdir(parents=True, exist_ok=True)

# Pricing
FREE_VIDEOS_PER_MONTH = 2
PREMIUM_VIDEOS_PER_MONTH = 20
PREMIUM_PRICE = 2.99


class StoryRequest(BaseModel):
    story_text: str
    title: Optional[str] = "My Story"
    generate_mode: Optional[str] = "manual"  # manual or ai_generate
    prompt: Optional[str] = None  # for AI generation
    voice_style: Optional[str] = "neutral"
    music_genre: Optional[str] = "auto"  # auto, epic, calm, happy, etc.
    kids_mode: Optional[bool] = False  # Kid-friendly mode


class StoryResponse(BaseModel):
    story_id: str
    status: str
    message: str
    moderation_passed: bool
    video_url: Optional[str] = None


async def check_content_safety(text: str) -> dict:
    """
    AI Content Moderation - Check for inappropriate content
    Returns: {safe: bool, categories: [], reason: str}
    """
    try:
        if not openai_client:
            logger.warning("OpenAI client not available for moderation")
            return {"safe": True, "categories": [], "reason": "Moderation unavailable"}
        
        # OpenAI Moderation API
        response = openai_client.moderations.create(input=text)
        result = response.results[0]
        
        flagged_categories = []
        if result.flagged:
            categories = result.categories
            if categories.violence: flagged_categories.append("violence")
            if categories.sexual: flagged_categories.append("sexual content")
            if categories.hate: flagged_categories.append("hate speech")
            if categories.self_harm: flagged_categories.append("self-harm")
            if categories.harassment: flagged_categories.append("harassment")
        
        # Additional GPT-4 safety check
        if not result.flagged:
            safety_check = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a content moderator. Check if the story contains: copyrighted characters (Harry Potter, Marvel, Disney, etc.), illegal activities, or inappropriate content. Respond with 'SAFE' or 'UNSAFE: reason'"
                    },
                    {
                        "role": "user",
                        "content": f"Story to check:\n{text[:1000]}"
                    }
                ],
                max_tokens=50,
                temperature=0
            )
            
            safety_result = safety_check.choices[0].message.content.strip()
            if safety_result.startswith("UNSAFE"):
                return {
                    "safe": False,
                    "categories": ["copyright/inappropriate"],
                    "reason": safety_result.replace("UNSAFE:", "").strip()
                }
        
        if result.flagged:
            return {
                "safe": False,
                "categories": flagged_categories,
                "reason": f"Content contains: {', '.join(flagged_categories)}"
            }
        
        return {"safe": True, "categories": [], "reason": "Content is safe"}
        
    except Exception as e:
        logger.error(f"Content moderation error: {str(e)}")
        # Fail-safe: if moderation fails, be cautious
        return {
            "safe": False,
            "categories": ["moderation_error"],
            "reason": "Unable to verify content safety"
        }


async def generate_story_from_prompt(prompt: str) -> str:
    """Generate a story from user prompt using GPT-4"""
    try:
        if not openai_client:
            raise HTTPException(status_code=503, detail="AI story generation unavailable")
        
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a creative storyteller. Write engaging, family-friendly stories based on user prompts. Keep stories between 200-800 words. Make them vivid, emotional, and suitable for all ages."
                },
                {
                    "role": "user",
                    "content": f"Write a story about: {prompt}"
                }
            ],
            max_tokens=1000,
            temperature=0.8
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        logger.error(f"Story generation error: {str(e)}")
        raise


async def break_into_scenes(story_text: str) -> List[dict]:
    """Break story into scenes using GPT-4"""
    try:
        if not openai_client:
            # Fallback: create simple scene from story
            return [{
                "scene_number": 1,
                "description": "Story scene",
                "narration": story_text[:500]
            }]
        
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """Break the story into 4-8 visual scenes. For each scene provide:
                    1. scene_number
                    2. description (visual details for image generation)
                    3. narration (text to be spoken)
                    
                    Respond in JSON format:
                    [
                      {"scene_number": 1, "description": "...", "narration": "..."},
                      ...
                    ]"""
                },
                {
                    "role": "user",
                    "content": f"Story:\n{story_text}"
                }
            ],
            max_tokens=1500,
            temperature=0.7
        )
        
        scenes_json = response.choices[0].message.content.strip()
        # Extract JSON if wrapped in markdown
        if scenes_json.startswith("```"):
            scenes_json = scenes_json.split("```")[1]
            if scenes_json.startswith("json"):
                scenes_json = scenes_json[4:]
        
        scenes = json.loads(scenes_json)
        return scenes
        
    except Exception as e:
        logger.error(f"Scene breakdown error: {str(e)}")
        raise


async def get_user_video_count(user_id: str) -> dict:
    """Get user's video count for current month"""
    now = datetime.now(timezone.utc)
    start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    
    # Count videos created this month
    count = await db.story_movies.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": start_of_month.isoformat()}
    })
    
    # Check if user has premium
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    is_premium = user.get("premium_story_empire", False) if user else False
    
    limit = PREMIUM_VIDEOS_PER_MONTH if is_premium else FREE_VIDEOS_PER_MONTH
    
    return {
        "count": count,
        "limit": limit,
        "remaining": max(0, limit - count),
        "is_premium": is_premium
    }


@router.post("/create", response_model=StoryResponse)
async def create_story_movie(
    request: StoryRequest,
    current_user = Depends(get_current_user)
):
    """
    Create a movie from story text
    
    Steps:
    1. Check usage limits
    2. Generate story from prompt (if AI mode)
    3. AI content moderation
    4. Break into scenes
    5. Generate images for scenes
    6. Generate voice narration
    7. Assemble video
    """
    try:
        user_id = current_user["_id"]
        
        # Check usage limits
        usage = await get_user_video_count(user_id)
        if usage["remaining"] <= 0:
            raise HTTPException(
                status_code=403,
                detail=f"Monthly limit reached. {'Upgrade to premium' if not usage['is_premium'] else 'Wait for next month'} for more videos."
            )
        
        # Generate story from prompt if AI mode
        story_text = request.story_text
        if request.generate_mode == "ai_generate" and request.prompt:
            logger.info(f"Generating story from prompt: {request.prompt}")
            story_text = await generate_story_from_prompt(request.prompt)
        
        # Validate story length
        word_count = len(story_text.split())
        if word_count < 50:
            raise HTTPException(status_code=400, detail="Story too short (minimum 50 words)")
        if word_count > 2000:
            raise HTTPException(status_code=400, detail="Story too long (maximum 2000 words)")
        
        # AI Content Moderation
        logger.info("Running content moderation...")
        moderation = await check_content_safety(story_text)
        
        # Extra kid-safe check if kids_mode
        if request.kids_mode:
            from services.kids_mode import is_kid_safe, suggest_kid_friendly_version
            is_safe, unsafe_keywords = is_kid_safe(story_text)
            
            if not is_safe:
                suggestion = suggest_kid_friendly_version(story_text)
                
                await db.story_movies.insert_one({
                    "story_id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "title": request.title,
                    "story_text": story_text,
                    "status": "rejected",
                    "kids_mode": True,
                    "moderation_result": {
                        "safe": False,
                        "reason": f"Not kid-friendly. Found: {', '.join(unsafe_keywords)}",
                        "suggestion": suggestion
                    },
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
                
                return StoryResponse(
                    story_id="rejected",
                    status="rejected",
                    message=f"❌ Not kid-friendly. {suggestion}",
                    moderation_passed=False
                )
        
        if not moderation["safe"]:
            # Save rejected story for audit
            await db.story_movies.insert_one({
                "story_id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": request.title,
                "story_text": story_text,
                "status": "rejected",
                "moderation_result": moderation,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            return StoryResponse(
                story_id="rejected",
                status="rejected",
                message=f"❌ Content rejected: {moderation['reason']}",
                moderation_passed=False
            )
        
        # Content is safe - create story movie record
        story_id = str(uuid.uuid4())
        story_doc = {
            "story_id": story_id,
            "user_id": user_id,
            "title": request.title,
            "story_text": story_text,
            "status": "processing",
            "kids_mode": request.kids_mode,
            "moderation_result": moderation,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "video_path": None
        }
        
        await db.story_movies.insert_one(story_doc)
        
        # Start async video generation (don't wait)
        asyncio.create_task(process_story_video(
            story_id, 
            story_text, 
            request.voice_style,
            request.music_genre,
            request.kids_mode
        ))
        
        return StoryResponse(
            story_id=story_id,
            status="processing",
            message="✅ Story approved! Video is being generated... Check back in 2-3 minutes!",
            moderation_passed=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating story movie: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create story movie")


async def process_story_video(story_id: str, story_text: str, voice_style: str, music_genre: str = "auto", kids_mode: bool = False):
    """
    Background task to generate complete video with MUSIC and KIDS MODE!
    """
    try:
        from services.music_generator import get_background_music
        from services.kids_mode import get_kid_friendly_prompt_suffix
        
        logger.info(f"🎬 Processing story video: {story_id} (Kids Mode: {kids_mode})")
        
        # Update status
        await db.story_movies.update_one(
            {"story_id": story_id},
            {"$set": {"status": "processing", "progress": "Breaking into scenes..."}}
        )
        
        # Step 1: Break into scenes
        scenes = await break_into_scenes(story_text)
        scene_count = len(scenes)
        logger.info(f"📖 Story broken into {scene_count} scenes")
        
        await db.story_movies.update_one(
            {"story_id": story_id},
            {"$set": {"scenes": scenes, "progress": f"Generating {scene_count} scene images..."}}
        )
        
        # Step 2: Generate images for each scene
        scene_images = []
        for i, scene in enumerate(scenes):
            try:
                logger.info(f"🎨 Generating image for scene {i+1}/{scene_count}")
                
                # Create prompt for image generation
                image_prompt = f"Cinematic scene: {scene['description']}."
                
                # Add kid-friendly styling if kids_mode
                if kids_mode:
                    image_prompt = get_kid_friendly_prompt_suffix(image_prompt, "cartoon")
                else:
                    image_prompt += " Style: beautiful, colorful, storybook illustration"
                
                # Generate image (using OpenAI DALL-E)
                if openai_client:
                    response = openai_client.images.generate(
                        model="dall-e-3",
                        prompt=image_prompt[:1000],  # DALL-E has 1000 char limit
                        size="1024x1024",
                        quality="standard",
                        n=1
                    )
                    
                    image_url = response.data[0].url
                    
                    # Download and save image
                    import requests
                    img_response = requests.get(image_url)
                    
                    image_path = STORY_MOVIES_DIR / f"{story_id}_scene_{i+1}.png"
                    with open(image_path, 'wb') as f:
                        f.write(img_response.content)
                    
                    scene_images.append(str(image_path))
                    logger.info(f"✅ Scene {i+1} image saved")
                else:
                    # Fallback: create placeholder
                    logger.warning("No image generation available, using placeholder")
                    scene_images.append(None)
                
                # Update progress
                progress = int((i + 1) / scene_count * 30) + 20  # 20-50%
                await db.story_movies.update_one(
                    {"story_id": story_id},
                    {"$set": {"progress": f"Generated {i+1}/{scene_count} images ({progress}%)"}}
                )
                
            except Exception as e:
                logger.error(f"Error generating image for scene {i+1}: {str(e)}")
                scene_images.append(None)
        
        # Step 3: Generate voice narration
        logger.info(f"🎤 Generating voice narration...")
        await db.story_movies.update_one(
            {"story_id": story_id},
            {"$set": {"progress": "Generating voice narration (50%)..."}}
        )
        
        # Combine all narration text
        full_narration = " ".join([scene['narration'] for scene in scenes])
        
        # Generate audio with ElevenLabs
        audio_path = await generate_narration(story_id, full_narration, voice_style)
        
        # Step 4: Get background music 🎵
        logger.info(f"🎵 Selecting background music (genre: {music_genre})...")
        await db.story_movies.update_one(
            {"story_id": story_id},
            {"$set": {"progress": "Adding epic music (70%)..."}}
        )
        
        music_path = await get_background_music(music_genre, story_text)
        if music_path:
            logger.info(f"✅ Music selected: {music_path}")
        else:
            logger.info("⚠️ No music available, continuing without background music")
        
        # Step 5: Assemble video with music
        logger.info(f"🎬 Assembling final video with music...")
        await db.story_movies.update_one(
            {"story_id": story_id},
            {"$set": {"progress": "Assembling video (90%)..."}}
        )
        
        video_path = await assemble_video(story_id, scene_images, audio_path, scenes, music_path)
        
        # Step 6: Mark as completed
        await db.story_movies.update_one(
            {"story_id": story_id},
            {
                "$set": {
                    "status": "completed",
                    "video_path": f"/api/story-empire/video/{story_id}",
                    "video_file": str(video_path),
                    "scene_images": scene_images,
                    "audio_path": str(audio_path) if audio_path else None,
                    "progress": "Complete (100%)",
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"✅ Story video completed: {story_id}")
        
    except Exception as e:
        logger.error(f"❌ Error processing story video: {str(e)}")
        await db.story_movies.update_one(
            {"story_id": story_id},
            {"$set": {"status": "failed", "error": str(e), "progress": "Failed"}}
        )


async def generate_narration(story_id: str, text: str, voice_style: str) -> Optional[Path]:
    """Generate voice narration using ElevenLabs"""
    try:
        # Get ElevenLabs API key
        elevenlabs_key = os.environ.get('ELEVENLABS_API_KEY')
        if not elevenlabs_key:
            logger.warning("ElevenLabs not available")
            return None
        
        # Select voice
        voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel - default
        if voice_style == "male":
            voice_id = "pNInz6obpgDQGcFmaJgB"  # Adam
        
        # Generate speech
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": elevenlabs_key,
            "Content-Type": "application/json"
        }
        data = {
            "text": text[:5000],  # Limit text length
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            audio_path = STORY_MOVIES_DIR / f"{story_id}_narration.mp3"
            with open(audio_path, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"✅ Voice narration generated")
            return audio_path
        else:
            logger.error(f"ElevenLabs error: {response.status_code}")
            return None
            
    except Exception as e:
        logger.error(f"Error generating narration: {str(e)}")
        return None


async def assemble_video(
    story_id: str, 
    scene_images: List[str], 
    audio_path: Optional[Path],
    scenes: List[dict],
    music_path: Optional[Path] = None
) -> Path:
    """
    Assemble final video from images, narration audio, and background music using FFmpeg
    """
    try:
        import subprocess
        
        output_path = STORY_MOVIES_DIR / f"{story_id}_final.mp4"
        
        # Filter out None images
        valid_images = [img for img in scene_images if img and Path(img).exists()]
        
        if not valid_images:
            raise Exception("No valid scene images")
        
        # Calculate duration per image based on narration length
        if audio_path and audio_path.exists():
            # Get audio duration
            result = subprocess.run(
                ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', 
                 '-of', 'default=noprint_wrappers=1:nokey=1', str(audio_path)],
                capture_output=True,
                text=True
            )
            audio_duration = float(result.stdout.strip())
            duration_per_image = audio_duration / len(valid_images)
        else:
            # No audio, use 5 seconds per image
            duration_per_image = 5.0
            audio_duration = duration_per_image * len(valid_images)
        
        # Create image list file for FFmpeg
        list_file = STORY_MOVIES_DIR / f"{story_id}_images.txt"
        with open(list_file, 'w') as f:
            for img in valid_images:
                f.write(f"file '{img}'\n")
                f.write(f"duration {duration_per_image}\n")
            # Add last image again (FFmpeg requirement)
            f.write(f"file '{valid_images[-1]}'\n")
        
        # Build FFmpeg command with music mixing
        if audio_path and audio_path.exists():
            if music_path and music_path.exists():
                # WITH narration AND music - Mix them!
                logger.info("🎵 Mixing narration with background music...")
                
                # Create mixed audio first
                mixed_audio = STORY_MOVIES_DIR / f"{story_id}_mixed_audio.mp3"
                
                # Mix: narration (louder) + music (quieter, looped)
                mix_cmd = [
                    'ffmpeg', '-y',
                    '-i', str(audio_path),           # Input 0: narration
                    '-stream_loop', '-1',             # Loop music
                    '-i', str(music_path),           # Input 1: music (looped)
                    '-filter_complex',
                    f'[1:a]volume=0.3,aloop=loop=-1:size=2e+09[bg];'  # Music at 30% volume, looped
                    f'[0:a]volume=1.0[fg];'          # Narration at 100% volume
                    f'[bg][fg]amix=inputs=2:duration=first[out]',  # Mix both
                    '-map', '[out]',
                    '-t', str(audio_duration),        # Match narration duration
                    '-c:a', 'libmp3lame',
                    str(mixed_audio)
                ]
                
                mix_result = subprocess.run(mix_cmd, capture_output=True, text=True)
                if mix_result.returncode != 0:
                    logger.error(f"Audio mixing failed: {mix_result.stderr}")
                    # Fallback to just narration
                    final_audio = audio_path
                else:
                    final_audio = mixed_audio
                    logger.info("✅ Audio mixed successfully!")
                
                # Now create video with mixed audio
                cmd = [
                    'ffmpeg', '-y',
                    '-f', 'concat',
                    '-safe', '0',
                    '-i', str(list_file),
                    '-i', str(final_audio),
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    '-pix_fmt', 'yuv420p',
                    '-shortest',
                    str(output_path)
                ]
            else:
                # WITH narration, NO music
                cmd = [
                    'ffmpeg', '-y',
                    '-f', 'concat',
                    '-safe', '0',
                    '-i', str(list_file),
                    '-i', str(audio_path),
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    '-pix_fmt', 'yuv420p',
                    '-shortest',
                    str(output_path)
                ]
        else:
            # NO narration, just images (maybe with music)
            if music_path and music_path.exists():
                cmd = [
                    'ffmpeg', '-y',
                    '-f', 'concat',
                    '-safe', '0',
                    '-i', str(list_file),
                    '-i', str(music_path),
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    '-pix_fmt', 'yuv420p',
                    '-shortest',
                    str(output_path)
                ]
            else:
                cmd = [
                    'ffmpeg', '-y',
                    '-f', 'concat',
                    '-safe', '0',
                    '-i', str(list_file),
                    '-c:v', 'libx264',
                    '-pix_fmt', 'yuv420p',
                    str(output_path)
                ]
        
        # Run FFmpeg
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"FFmpeg error: {result.stderr}")
            raise Exception(f"Video assembly failed: {result.stderr[:200]}")
        
        # Cleanup
        list_file.unlink()
        if 'mixed_audio' in locals() and Path(mixed_audio).exists():
            Path(mixed_audio).unlink()
        
        logger.info(f"✅ Video assembled with music: {output_path}")
        return output_path
        
    except Exception as e:
        logger.error(f"Error assembling video: {str(e)}")
        raise


@router.get("/my-movies")
async def get_my_movies(current_user = Depends(get_current_user)):
    """Get user's story movies"""
    try:
        movies = await db.story_movies.find(
            {"user_id": current_user["_id"]},
            {"_id": 0}
        ).sort("created_at", -1).limit(50).to_list(50)
        
        usage = await get_user_video_count(current_user["_id"])
        
        return {
            "success": True,
            "movies": movies,
            "usage": usage
        }
        
    except Exception as e:
        logger.error(f"Error getting movies: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get movies")


@router.get("/status/{story_id}")
async def get_story_status(story_id: str, current_user = Depends(get_current_user)):
    """Get story processing status"""
    try:
        movie = await db.story_movies.find_one(
            {"story_id": story_id, "user_id": current_user["_id"]},
            {"_id": 0}
        )
        
        if not movie:
            raise HTTPException(status_code=404, detail="Story not found")
        
        return {"success": True, "movie": movie}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get status")


@router.get("/usage")
async def get_usage(current_user = Depends(get_current_user)):
    """Get user's usage stats"""
    try:
        usage = await get_user_video_count(current_user["_id"])
        return {"success": True, "usage": usage}
        
    except Exception as e:
        logger.error(f"Error getting usage: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get usage")


@router.get("/music-genres")
async def get_music_genres_list():
    """Get available music genres"""
    from services.music_generator import get_music_genres
    
    return {
        "success": True,
        "genres": [
            {"id": "auto", "name": "Auto-Detect", "icon": "🤖", "description": "Let AI choose the perfect music!"},
            *get_music_genres()
        ]
    }


@router.get("/kids/templates")
async def get_fairy_tale_templates():
    """Get fairy tale templates for kids"""
    from services.kids_mode import FAIRY_TALE_TEMPLATES, KID_IMAGE_STYLES
    
    return {
        "success": True,
        "templates": FAIRY_TALE_TEMPLATES,
        "image_styles": KID_IMAGE_STYLES
    }


@router.get("/video/{story_id}")
async def stream_video(story_id: str, current_user = Depends(get_current_user)):
    """Stream the generated video"""
    try:
        from fastapi.responses import FileResponse
        
        # Get story
        movie = await db.story_movies.find_one(
            {"story_id": story_id, "user_id": current_user["_id"]},
            {"_id": 0}
        )
        
        if not movie:
            raise HTTPException(status_code=404, detail="Video not found")
        
        if movie['status'] != 'completed':
            raise HTTPException(status_code=400, detail="Video not ready yet")
        
        video_file = movie.get('video_file')
        if not video_file or not Path(video_file).exists():
            raise HTTPException(status_code=404, detail="Video file not found")
        
        return FileResponse(
            video_file,
            media_type="video/mp4",
            filename=f"{movie['title']}.mp4"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error streaming video: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to stream video")


@router.delete("/{story_id}")
async def delete_story(story_id: str, current_user = Depends(get_current_user)):
    """Delete a story movie"""
    try:
        # Get story
        movie = await db.story_movies.find_one(
            {"story_id": story_id, "user_id": current_user["_id"]},
            {"_id": 0}
        )
        
        if not movie:
            raise HTTPException(status_code=404, detail="Story not found")
        
        # Delete files
        if movie.get('video_file'):
            video_path = Path(movie['video_file'])
            if video_path.exists():
                video_path.unlink()
        
        if movie.get('audio_path'):
            audio_path = Path(movie['audio_path'])
            if audio_path.exists():
                audio_path.unlink()
        
        if movie.get('scene_images'):
            for img in movie['scene_images']:
                if img:
                    img_path = Path(img)
                    if img_path.exists():
                        img_path.unlink()
        
        # Delete from database
        await db.story_movies.delete_one({"story_id": story_id})
        
        return {"success": True, "message": "Story deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting story: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete story")
