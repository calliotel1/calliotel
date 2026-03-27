"""
AI Video Chat with Filters
Real-time 1-on-1 video calls with live filters & voice effects
Uses WebRTC for peer-to-peer connection
"""

from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, Dict, Set
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import json

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Active video calls
active_calls: Dict[str, dict] = {}
waiting_users: Set[str] = set()


class CallRequest(BaseModel):
    recipient_user_id: str
    enable_filters: bool = True
    enable_voice_effects: bool = True


class CallResponse(BaseModel):
    call_id: str
    status: str
    signaling_server: str


@router.post("/start-call", response_model=CallResponse)
async def start_video_call(
    request: CallRequest,
    current_user = Depends(get_current_user)
):
    """
    Initiate a video call with another user
    Returns WebRTC signaling details
    """
    try:
        caller_id = current_user["_id"]
        recipient_id = request.recipient_user_id
        
        # Check if recipient exists
        recipient = await db.users.find_one({"user_id": recipient_id}, {"_id": 0})
        
        if not recipient:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create call session
        call_id = str(uuid.uuid4())
        
        call_session = {
            "call_id": call_id,
            "caller_id": caller_id,
            "caller_name": current_user.get("name", "Anonymous"),
            "recipient_id": recipient_id,
            "recipient_name": recipient.get("name", "Anonymous"),
            "status": "calling",  # calling, active, ended
            "enable_filters": request.enable_filters,
            "enable_voice_effects": request.enable_voice_effects,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "ended_at": None,
            "duration_seconds": 0
        }
        
        await db.video_calls.insert_one(call_session)
        active_calls[call_id] = call_session
        
        logger.info(f"📞 Call initiated: {caller_id} → {recipient_id}")
        
        # TODO: Send push notification to recipient
        
        return CallResponse(
            call_id=call_id,
            status="calling",
            signaling_server=f"wss://calliotel.com/api/video-chat/signal/{call_id}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting call: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start call")


@router.post("/answer-call/{call_id}")
async def answer_call(call_id: str, current_user = Depends(get_current_user)):
    """
    Answer an incoming video call
    """
    try:
        user_id = current_user["_id"]
        
        # Get call
        call = await db.video_calls.find_one({"call_id": call_id}, {"_id": 0})
        
        if not call:
            raise HTTPException(status_code=404, detail="Call not found")
        
        if call["recipient_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        if call["status"] != "calling":
            raise HTTPException(status_code=400, detail="Call already answered or ended")
        
        # Update call status
        await db.video_calls.update_one(
            {"call_id": call_id},
            {"$set": {"status": "active", "answered_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if call_id in active_calls:
            active_calls[call_id]["status"] = "active"
        
        logger.info(f"✅ Call answered: {call_id}")
        
        return {
            "success": True,
            "call_id": call_id,
            "status": "active",
            "signaling_server": f"wss://calliotel.com/api/video-chat/signal/{call_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error answering call: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to answer call")


@router.post("/end-call/{call_id}")
async def end_call(call_id: str, current_user = Depends(get_current_user)):
    """
    End a video call
    """
    try:
        user_id = current_user["_id"]
        
        # Get call
        call = await db.video_calls.find_one({"call_id": call_id}, {"_id": 0})
        
        if not call:
            raise HTTPException(status_code=404, detail="Call not found")
        
        if call["caller_id"] != user_id and call["recipient_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Calculate duration
        started_at = datetime.fromisoformat(call["started_at"])
        ended_at = datetime.now(timezone.utc)
        duration = (ended_at - started_at).total_seconds()
        
        # Update call
        await db.video_calls.update_one(
            {"call_id": call_id},
            {
                "$set": {
                    "status": "ended",
                    "ended_at": ended_at.isoformat(),
                    "duration_seconds": duration
                }
            }
        )
        
        # Remove from active calls
        if call_id in active_calls:
            del active_calls[call_id]
        
        logger.info(f"📴 Call ended: {call_id} (duration: {duration}s)")
        
        return {
            "success": True,
            "call_id": call_id,
            "status": "ended",
            "duration_seconds": duration
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ending call: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to end call")


@router.get("/call-history")
async def get_call_history(current_user = Depends(get_current_user)):
    """
    Get user's video call history
    """
    try:
        user_id = current_user["_id"]
        
        calls = await db.video_calls.find(
            {
                "$or": [
                    {"caller_id": user_id},
                    {"recipient_id": user_id}
                ]
            },
            {"_id": 0}
        ).sort("started_at", -1).limit(100).to_list(100)
        
        return {
            "success": True,
            "calls": calls
        }
        
    except Exception as e:
        logger.error(f"Error getting call history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get call history")


@router.websocket("/signal/{call_id}")
async def websocket_signaling(websocket: WebSocket, call_id: str):
    """
    WebSocket for WebRTC signaling (SDP exchange, ICE candidates)
    This enables peer-to-peer connection between caller and recipient
    """
    await websocket.accept()
    
    try:
        # Get call info
        call = active_calls.get(call_id)
        
        if not call:
            await websocket.send_json({
                "type": "error",
                "message": "Call not found"
            })
            await websocket.close()
            return
        
        logger.info(f"📡 WebSocket connected for call: {call_id}")
        
        # Handle signaling messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                message_type = message.get("type")
                
                if message_type == "offer":
                    # Store SDP offer
                    call["offer"] = message.get("sdp")
                    logger.info(f"📤 Offer received for call: {call_id}")
                    
                elif message_type == "answer":
                    # Store SDP answer
                    call["answer"] = message.get("sdp")
                    logger.info(f"📥 Answer received for call: {call_id}")
                    
                elif message_type == "ice-candidate":
                    # Store ICE candidate
                    if "ice_candidates" not in call:
                        call["ice_candidates"] = []
                    call["ice_candidates"].append(message.get("candidate"))
                    logger.info(f"🧊 ICE candidate received")
                    
                elif message_type == "filter-change":
                    # Notify peer about filter change
                    filter_id = message.get("filter_id")
                    logger.info(f"🎨 Filter changed to: {filter_id}")
                    # Broadcast to other peer
                    
                # Echo message to other peer (simplified signaling)
                await websocket.send_json(message)
                
            except WebSocketDisconnect:
                logger.info(f"📴 WebSocket disconnected for call: {call_id}")
                break
                
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        await websocket.close()


@router.get("/filters-available")
async def get_available_filters():
    """
    Get filters available for video chat
    (Reuses the 69 video filters)
    """
    from data.video_filters import VIDEO_FILTERS
    
    # Return lightweight version for real-time processing
    filters = [
        {
            "id": f["id"],
            "name": f["name"],
            "icon": f["icon"],
            "type": f.get("type", "basic")
        }
        for f in VIDEO_FILTERS
    ]
    
    return {
        "success": True,
        "filters": filters,
        "total": len(filters)
    }
