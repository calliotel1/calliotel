"""
Scheduled Messages API - "Time-Bender" Feature
Allows users to schedule messages and challenges to be sent at a future time
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import logging
from datetime import datetime, timezone, timedelta
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
from uuid import uuid4

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Models
class ScheduleMessageRequest(BaseModel):
    receiver_id: str
    content: str
    type: str  # text, challenge, voice, sticker
    scheduled_time: str  # ISO format datetime
    challenge_config: Optional[dict] = None  # For challenge type

class ScheduleResponse(BaseModel):
    success: bool
    scheduled_id: str
    scheduled_time: str
    message: str

# Schedule Message/Challenge
@router.post("/schedule")
async def schedule_message(
    request: ScheduleMessageRequest,
    current_user = Depends(get_current_user)
):
    """
    Schedule a message or challenge to be sent at a future time.
    
    Validation:
    - scheduled_time must be at least 5 minutes in the future
    - scheduled_time must not be more than 30 days in the future
    - For challenge type, challenge_config is required
    - Users must be friends (if challenge)
    """
    try:
        sender_id = current_user["_id"]
        
        # Parse scheduled time
        try:
            scheduled_dt = datetime.fromisoformat(request.scheduled_time.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Invalid scheduled_time format. Use ISO format")
        
        # Validate scheduled time is in future
        now = datetime.now(timezone.utc)
        time_diff = scheduled_dt - now
        
        # Must be at least 5 minutes in future
        if time_diff.total_seconds() < 300:  # 5 minutes
            raise HTTPException(status_code=400, detail="Scheduled time must be at least 5 minutes in the future")
        
        # Must not be more than 30 days in future
        if time_diff.days > 30:
            raise HTTPException(status_code=400, detail="Cannot schedule more than 30 days in advance")
        
        # Get receiver info
        receiver = await db.users.find_one({"_id": request.receiver_id})
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")
        
        # Check friendship
        friendship = await db.friendships.find_one({
            "$or": [
                {"user1_id": sender_id, "user2_id": request.receiver_id},
                {"user1_id": request.receiver_id, "user2_id": sender_id}
            ]
        })
        
        if not friendship:
            raise HTTPException(status_code=400, detail="You can only schedule messages to friends")
        
        # Validate challenge config if type is challenge
        if request.type == "challenge":
            if not request.challenge_config:
                raise HTTPException(status_code=400, detail="challenge_config required for challenge type")
            
            # Validate game type
            valid_games = ["speed_dialer", "duel", "phish_finder"]
            if request.challenge_config.get("game_type") not in valid_games:
                raise HTTPException(status_code=400, detail="Invalid game type")
            
            # Validate duel wager
            if request.challenge_config.get("game_type") == "duel":
                wager = request.challenge_config.get("wager_amount")
                if not wager or wager < 10 or wager > 1000:
                    raise HTTPException(status_code=400, detail="Duel wager must be between 10-1000 XP")
                
                # Check if sender has enough XP
                profile = await db.gamification_profiles.find_one({"user_id": sender_id})
                if not profile or profile.get("total_points", 0) < wager:
                    raise HTTPException(status_code=400, detail="Insufficient XP for wager")
        
        # Create scheduled message
        scheduled_doc = {
            "id": str(uuid4()),
            "sender_id": sender_id,
            "receiver_id": request.receiver_id,
            "content": request.content,
            "type": request.type,
            "scheduled_time": scheduled_dt.isoformat(),
            "status": "pending",
            "challenge_config": request.challenge_config,
            "created_at": now.isoformat()
        }
        
        await db.scheduled_messages.insert_one(scheduled_doc)
        
        logger.info(f"Message scheduled: {scheduled_doc['id']} from {sender_id} to {request.receiver_id} at {scheduled_dt}")
        
        return ScheduleResponse(
            success=True,
            scheduled_id=scheduled_doc["id"],
            scheduled_time=scheduled_dt.isoformat(),
            message=f"Message scheduled for {scheduled_dt.strftime('%B %d, %Y at %I:%M %p UTC')}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scheduling message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to schedule message")

# Get Scheduled Messages
@router.get("/scheduled")
async def get_scheduled_messages(current_user = Depends(get_current_user)):
    """
    Get all pending scheduled messages for current user.
    Includes countdown timer calculation.
    """
    try:
        user_id = current_user["_id"]
        
        # Get pending scheduled messages
        scheduled = await db.scheduled_messages.find({
            "sender_id": user_id,
            "status": "pending"
        }, {"_id": 0}).sort("scheduled_time", 1).to_list(100)
        
        now = datetime.now(timezone.utc)
        
        # Add countdown timer
        for msg in scheduled:
            scheduled_dt = datetime.fromisoformat(msg["scheduled_time"])
            time_remaining = scheduled_dt - now
            
            # Calculate hours and minutes remaining
            total_seconds = int(time_remaining.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            
            msg["countdown"] = {
                "hours": hours,
                "minutes": minutes,
                "total_seconds": total_seconds
            }
            
            # Get receiver info
            receiver = await db.users.find_one(
                {"_id": msg["receiver_id"]},
                {"_id": 0, "email": 1, "full_name": 1, "client_id": 1}
            )
            msg["receiver_email"] = receiver.get("email") if receiver else "Unknown"
            msg["receiver_name"] = receiver.get("full_name") or receiver.get("email") if receiver else "Unknown"
        
        return {
            "scheduled_messages": scheduled,
            "count": len(scheduled)
        }
        
    except Exception as e:
        logger.error(f"Error getting scheduled messages: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get scheduled messages")

# Cancel Scheduled Message
@router.delete("/scheduled/{scheduled_id}")
async def cancel_scheduled_message(
    scheduled_id: str,
    current_user = Depends(get_current_user)
):
    """
    Cancel a pending scheduled message.
    Only the sender can cancel their own scheduled messages.
    """
    try:
        user_id = current_user["_id"]
        
        # Get scheduled message
        scheduled = await db.scheduled_messages.find_one({
            "id": scheduled_id,
            "sender_id": user_id,
            "status": "pending"
        })
        
        if not scheduled:
            raise HTTPException(status_code=404, detail="Scheduled message not found or already sent")
        
        # Update status to cancelled
        await db.scheduled_messages.update_one(
            {"id": scheduled_id},
            {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        logger.info(f"Scheduled message cancelled: {scheduled_id}")
        
        return {
            "success": True,
            "message": "Scheduled message cancelled"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling scheduled message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel scheduled message")
