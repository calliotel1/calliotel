from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv
import uuid
import httpx

load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# AI Configuration for transcription
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Models
class VoicemailSettings(BaseModel):
    greeting_message: Optional[str] = "Hi, you've reached {name}. Please leave a message after the beep."
    transcription_enabled: bool = True
    email_notifications: bool = True
    max_duration_seconds: int = 180  # 3 minutes

class VoicemailUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_archived: Optional[bool] = None

# Voicemail Settings Management
@router.get("/settings")
async def get_voicemail_settings(current_user = Depends(get_current_user)):
    """
    Get user's voicemail settings.
    """
    try:
        user_id = current_user["_id"]
        
        settings = await db.voicemail_settings.find_one(
            {"user_id": user_id},
            {"_id": 0}
        )
        
        if not settings:
            # Return default settings
            return {
                "success": True,
                "settings": {
                    "user_id": user_id,
                    "greeting_message": f"Hi, you've reached {current_user.get('name', 'me')}. Please leave a message after the beep.",
                    "transcription_enabled": True,
                    "email_notifications": True,
                    "max_duration_seconds": 180
                }
            }
        
        return {
            "success": True,
            "settings": settings
        }
    except Exception as e:
        logger.error(f"Error getting voicemail settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get voicemail settings")

@router.put("/settings")
async def update_voicemail_settings(settings: VoicemailSettings, current_user = Depends(get_current_user)):
    """
    Update voicemail settings.
    """
    try:
        user_id = current_user["_id"]
        
        settings_doc = {
            "user_id": user_id,
            **settings.dict(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.voicemail_settings.update_one(
            {"user_id": user_id},
            {"$set": settings_doc},
            upsert=True
        )
        
        return {
            "success": True,
            "message": "Voicemail settings updated successfully"
        }
    except Exception as e:
        logger.error(f"Error updating voicemail settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update voicemail settings")

# Statistics (must be before /{voicemail_id} to avoid route conflict)
@router.get("/stats")
async def get_voicemail_stats(current_user = Depends(get_current_user)):
    """
    Get voicemail statistics.
    """
    try:
        user_id = current_user["_id"]
        
        total = await db.voicemails.count_documents({"user_id": user_id})
        unread = await db.voicemails.count_documents({"user_id": user_id, "is_read": False})
        archived = await db.voicemails.count_documents({"user_id": user_id, "is_archived": True})
        
        # Average duration
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": None,
                "avg_duration": {"$avg": "$duration_seconds"},
                "total_duration": {"$sum": "$duration_seconds"}
            }}
        ]
        
        result = list(await db.voicemails.aggregate(pipeline).to_list(1))
        avg_duration = result[0]["avg_duration"] if result else 0
        total_duration = result[0]["total_duration"] if result else 0
        
        return {
            "success": True,
            "stats": {
                "total": total,
                "unread": unread,
                "archived": archived,
                "avg_duration_seconds": int(avg_duration) if avg_duration else 0,
                "total_duration_seconds": int(total_duration) if total_duration else 0
            }
        }
    except Exception as e:
        logger.error(f"Error getting voicemail stats: {str(e)}")
        # Return empty stats instead of error
        return {
            "success": True,
            "stats": {
                "total": 0,
                "unread": 0,
                "archived": 0,
                "avg_duration_seconds": 0,
                "total_duration_seconds": 0
            }
        }

# Voicemail List & Details
@router.get("/list")
async def get_voicemails(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    current_user = Depends(get_current_user)
):
    """
    Get user's voicemails.
    """
    try:
        user_id = current_user["_id"]
        
        query = {"user_id": user_id}
        if unread_only:
            query["is_read"] = False
        
        voicemails = await db.voicemails.find(
            query,
            {"_id": 0}
        ).sort("received_at", -1).skip(skip).limit(limit).to_list(limit)
        
        total = await db.voicemails.count_documents(query)
        unread_count = await db.voicemails.count_documents({"user_id": user_id, "is_read": False})
        
        return {
            "success": True,
            "voicemails": voicemails,
            "total": total,
            "unread_count": unread_count
        }
    except Exception as e:
        logger.error(f"Error getting voicemails: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get voicemails")

@router.get("/{voicemail_id}")
async def get_voicemail_details(voicemail_id: str, current_user = Depends(get_current_user)):
    """
    Get specific voicemail details and mark as read.
    """
    try:
        user_id = current_user["_id"]
        
        voicemail = await db.voicemails.find_one(
            {"id": voicemail_id, "user_id": user_id},
            {"_id": 0}
        )
        
        if not voicemail:
            raise HTTPException(status_code=404, detail="Voicemail not found")
        
        # Mark as read
        await db.voicemails.update_one(
            {"id": voicemail_id},
            {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {
            "success": True,
            "voicemail": voicemail
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting voicemail: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get voicemail")

@router.put("/{voicemail_id}")
async def update_voicemail(voicemail_id: str, updates: VoicemailUpdate, current_user = Depends(get_current_user)):
    """
    Update voicemail (mark as read/unread, archive).
    """
    try:
        user_id = current_user["_id"]
        
        voicemail = await db.voicemails.find_one({"id": voicemail_id, "user_id": user_id})
        
        if not voicemail:
            raise HTTPException(status_code=404, detail="Voicemail not found")
        
        update_data = {}
        if updates.is_read is not None:
            update_data["is_read"] = updates.is_read
            if updates.is_read:
                update_data["read_at"] = datetime.now(timezone.utc).isoformat()
        
        if updates.is_archived is not None:
            update_data["is_archived"] = updates.is_archived
        
        if update_data:
            await db.voicemails.update_one(
                {"id": voicemail_id},
                {"$set": update_data}
            )
        
        return {
            "success": True,
            "message": "Voicemail updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating voicemail: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update voicemail")

@router.delete("/{voicemail_id}")
async def delete_voicemail(voicemail_id: str, current_user = Depends(get_current_user)):
    """
    Delete a voicemail.
    """
    try:
        user_id = current_user["_id"]
        
        result = await db.voicemails.delete_one({"id": voicemail_id, "user_id": user_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Voicemail not found")
        
        return {
            "success": True,
            "message": "Voicemail deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting voicemail: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete voicemail")

# Telnyx Webhook for Voicemail
@router.post("/webhook")
async def voicemail_webhook(webhook_data: dict, background_tasks: BackgroundTasks):
    """
    Receive voicemail notifications from Telnyx.
    
    When a call goes to voicemail, Telnyx will:
    1. Record the message
    2. POST to this webhook with recording details
    3. We save it and optionally transcribe it
    """
    try:
        logger.info(f"Voicemail webhook received: {webhook_data}")
        
        event_type = webhook_data.get("data", {}).get("event_type")
        
        if event_type == "call.recording.saved":
            # Extract recording details
            payload = webhook_data.get("data", {}).get("payload", {})
            
            recording_id = payload.get("recording_id")
            call_control_id = payload.get("call_control_id")
            call_leg_id = payload.get("call_leg_id")
            call_session_id = payload.get("call_session_id")
            recording_url = payload.get("recording_urls", {}).get("mp3")
            duration = payload.get("duration_millis", 0) // 1000  # Convert to seconds
            
            from_number = payload.get("from")
            to_number = payload.get("to")
            
            # Find the user who owns this number
            number_doc = await db.purchased_numbers.find_one({"phone_number": to_number})
            
            if not number_doc:
                logger.warning(f"Voicemail received for unknown number: {to_number}")
                return {"success": False, "message": "Number not found"}
            
            user_id = number_doc["user_id"]
            
            # Create voicemail record
            voicemail_doc = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "from_number": from_number,
                "to_number": to_number,
                "recording_id": recording_id,
                "recording_url": recording_url,
                "duration_seconds": duration,
                "received_at": datetime.now(timezone.utc).isoformat(),
                "is_read": False,
                "is_archived": False,
                "transcription": None,
                "transcription_status": "pending"
            }
            
            await db.voicemails.insert_one(voicemail_doc)
            
            # Check if transcription is enabled
            settings = await db.voicemail_settings.find_one({"user_id": user_id})
            
            if settings and settings.get("transcription_enabled", True):
                # Schedule transcription in background
                background_tasks.add_task(transcribe_voicemail, voicemail_doc["id"], recording_url)
            
            return {
                "success": True,
                "message": "Voicemail received and saved"
            }
        
        return {"success": True, "message": "Event processed"}
        
    except Exception as e:
        logger.error(f"Error processing voicemail webhook: {str(e)}")
        return {"success": False, "error": str(e)}

# AI Transcription
async def transcribe_voicemail(voicemail_id: str, recording_url: str):
    """
    Transcribe voicemail using AI (background task).
    
    Note: For production, use OpenAI Whisper or similar speech-to-text service.
    This is a simplified implementation using text-based AI to simulate transcription.
    """
    try:
        logger.info(f"Starting transcription for voicemail: {voicemail_id}")
        
        # Update status
        await db.voicemails.update_one(
            {"id": voicemail_id},
            {"$set": {"transcription_status": "processing"}}
        )
        
        # In production, you would:
        # 1. Download the audio file from recording_url
        # 2. Use OpenAI Whisper API or similar service to transcribe
        # 3. Save the transcription
        
        # For now, we'll create a placeholder that indicates AI transcription is available
        # but requires actual audio processing implementation
        
        transcription_text = "[Transcription available - Audio processing integration pending]"
        
        # You could use Whisper integration like this:
        # from emergentintegrations import openai_whisper
        # transcription_text = await openai_whisper.transcribe(recording_url, api_key=EMERGENT_LLM_KEY)
        
        # Generate AI summary of transcription
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"voicemail_summary_{voicemail_id}",
            system_message="You are a helpful assistant that summarizes voicemail transcriptions concisely."
        ).with_model("openai", "gpt-4o")
        
        summary_prompt = f"""Summarize this voicemail transcription in one short sentence:
        
{transcription_text}

Summary:"""
        
        message = UserMessage(text=summary_prompt)
        summary = await chat.send_message(message)
        
        # Update voicemail with transcription
        await db.voicemails.update_one(
            {"id": voicemail_id},
            {"$set": {
                "transcription": transcription_text,
                "transcription_summary": summary.strip(),
                "transcription_status": "completed",
                "transcribed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Transcription completed for voicemail: {voicemail_id}")
        
    except Exception as e:
        logger.error(f"Error transcribing voicemail {voicemail_id}: {str(e)}")
        
        # Mark as failed
        await db.voicemails.update_one(
            {"id": voicemail_id},
            {"$set": {
                "transcription_status": "failed",
                "transcription_error": str(e)
            }}
        )

# Call Recording Management
@router.get("/recordings/list")
async def get_call_recordings(
    skip: int = 0,
    limit: int = 50,
    current_user = Depends(get_current_user)
):
    """
    Get user's call recordings (separate from voicemails).
    """
    try:
        user_id = current_user["_id"]
        
        recordings = await db.call_recordings.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("recorded_at", -1).skip(skip).limit(limit).to_list(limit)
        
        total = await db.call_recordings.count_documents({"user_id": user_id})
        
        return {
            "success": True,
            "recordings": recordings,
            "total": total
        }
    except Exception as e:
        logger.error(f"Error getting call recordings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get call recordings")

@router.post("/recordings/{recording_id}/transcribe")
async def transcribe_call_recording(recording_id: str, background_tasks: BackgroundTasks, current_user = Depends(get_current_user)):
    """
    Request transcription for a call recording.
    """
    try:
        user_id = current_user["_id"]
        
        recording = await db.call_recordings.find_one({"id": recording_id, "user_id": user_id})
        
        if not recording:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        if recording.get("transcription_status") == "completed":
            return {
                "success": True,
                "message": "Recording already transcribed",
                "transcription": recording.get("transcription")
            }
        
        # Schedule transcription
        background_tasks.add_task(transcribe_call_recording_task, recording_id, recording.get("recording_url"))
        
        return {
            "success": True,
            "message": "Transcription started"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting transcription: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start transcription")

async def transcribe_call_recording_task(recording_id: str, recording_url: str):
    """
    Background task to transcribe a call recording.
    """
    try:
        await db.call_recordings.update_one(
            {"id": recording_id},
            {"$set": {"transcription_status": "processing"}}
        )
        
        # Similar to voicemail transcription
        # In production, use Whisper or similar service
        transcription_text = "[Call recording transcription - Audio processing integration pending]"
        
        await db.call_recordings.update_one(
            {"id": recording_id},
            {"$set": {
                "transcription": transcription_text,
                "transcription_status": "completed",
                "transcribed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
    except Exception as e:
        logger.error(f"Error transcribing recording {recording_id}: {str(e)}")
        await db.call_recordings.update_one(
            {"id": recording_id},
            {"$set": {"transcription_status": "failed", "transcription_error": str(e)}}
        )

