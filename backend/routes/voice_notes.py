"""
Voice Notes Router
Advanced voice messaging with AI transcription
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from typing import Optional
import logging
import os
import secrets
import aiofiles
from uuid import uuid4
from dotenv import load_dotenv
from emergentintegrations.llm.openai import OpenAISpeechToText
from routes.auth import get_current_user
import asyncio

load_dotenv()

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

# Voice notes storage
VOICE_NOTES_DIR = "/app/media/voice_notes"
os.makedirs(VOICE_NOTES_DIR, exist_ok=True)

# File limits
ALLOWED_AUDIO_TYPES = [
    "audio/mpeg",  # mp3
    "audio/mp4",   # m4a
    "audio/wav",
    "audio/webm",
    "audio/ogg",
    "audio/x-m4a"
]
MAX_AUDIO_SIZE = 25 * 1024 * 1024  # 25MB (Whisper limit)

# Initialize OpenAI Speech-to-Text
stt = OpenAISpeechToText(api_key=os.getenv("EMERGENT_LLM_KEY"))

@router.post("/upload")
async def upload_voice_note(
    file: UploadFile = File(...),
    duration: Optional[float] = Form(None),
    current_user = Depends(get_current_user)
):
    """
    Upload voice note and transcribe with AI
    """
    try:
        # Validate file type
        if file.content_type not in ALLOWED_AUDIO_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid audio format. Supported: mp3, wav, webm, m4a"
            )
        
        # Read file
        content = await file.read()
        file_size = len(content)
        
        if file_size > MAX_AUDIO_SIZE:
            raise HTTPException(
                status_code=400,
                detail="Audio file too large. Max: 25MB"
            )
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'webm'
        unique_filename = f"{secrets.token_hex(16)}.{file_extension}"
        file_path = f"{VOICE_NOTES_DIR}/{unique_filename}"
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Transcribe with OpenAI Whisper
        transcript_text = ""
        transcription_error = None
        
        try:
            with open(file_path, 'rb') as audio_file:
                response = await stt.transcribe(
                    file=audio_file,
                    model="whisper-1",
                    response_format="json",
                    temperature=0.0
                )
                transcript_text = response.text
                logger.info(f"Voice note transcribed successfully: {len(transcript_text)} chars")
                
        except Exception as e:
            logger.error(f"Transcription failed: {str(e)}")
            transcription_error = str(e)
            transcript_text = "[Transcription unavailable]"
        
        # Generate voice note ID
        voice_note_id = str(uuid4())
        
        # Create voice note record
        voice_note_doc = {
            "id": voice_note_id,
            "user_id": current_user["_id"],
            "file_name": unique_filename,
            "file_path": file_path,
            "url": f"/media/voice_notes/{unique_filename}",
            "duration": duration or 0,
            "transcript": transcript_text,
            "transcription_error": transcription_error,
            "file_size": file_size,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.voice_notes.insert_one(voice_note_doc)
        
        # Award XP for voice note (5 XP)
        xp_result = await award_xp_to_user(current_user["_id"], 5, "Voice note sent")
        await update_user_stat(current_user["_id"], "voice_notes_sent", 1)
        
        logger.info(f"Voice note uploaded: {voice_note_id} by {current_user['_id']}")
        
        return {
            "success": True,
            "voice_note": {
                "id": voice_note_id,
                "url": f"/media/voice_notes/{unique_filename}",
                "duration": duration or 0,
                "transcript": transcript_text,
                "has_transcript": transcription_error is None
            },
            "gamification": xp_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading voice note: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload voice note")

@router.get("/{voice_note_id}")
async def get_voice_note(
    voice_note_id: str,
    current_user = Depends(get_current_user)
):
    """
    Get voice note details including transcript
    """
    try:
        voice_note = await db.voice_notes.find_one(
            {"id": voice_note_id},
            {"_id": 0, "file_path": 0}
        )
        
        if not voice_note:
            raise HTTPException(status_code=404, detail="Voice note not found")
        
        return {
            "success": True,
            "voice_note": voice_note
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching voice note: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch voice note")

@router.delete("/{voice_note_id}")
async def delete_voice_note(
    voice_note_id: str,
    current_user = Depends(get_current_user)
):
    """
    Delete voice note
    """
    try:
        voice_note = await db.voice_notes.find_one({"id": voice_note_id})
        
        if not voice_note:
            raise HTTPException(status_code=404, detail="Voice note not found")
        
        # Check ownership
        if voice_note["user_id"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Delete file
        if os.path.exists(voice_note["file_path"]):
            os.remove(voice_note["file_path"])
        
        # Delete record
        await db.voice_notes.delete_one({"id": voice_note_id})
        
        logger.info(f"Voice note deleted: {voice_note_id}")
        
        return {"success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting voice note: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete voice note")
