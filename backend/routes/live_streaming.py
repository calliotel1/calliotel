"""
Live Filter Streaming
Stream video to multiple viewers with real-time filters
Like Twitch but with 69 fun filters!
"""

from fastapi import APIRouter, HTTPException, Depends, WebSocket
from pydantic import BaseModel
from typing import Optional, Dict, Set
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Active streams
active_streams: Dict[str, dict] = {}
stream_viewers: Dict[str, Set[str]] = {}  # stream_id -> set of viewer_ids


class StreamRequest(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "general"  # gaming, music, talk, creative, etc.
    is_public: bool = True
    enable_filters: bool = True


@router.post("/start-stream")
async def start_live_stream(
    request: StreamRequest,
    current_user = Depends(get_current_user)
):
    """
    Start a live stream
    """
    try:
        streamer_id = current_user["_id"]
        
        # Check if user already has active stream
        existing = await db.live_streams.find_one({
            "streamer_id": streamer_id,
            "status": "live"
        }, {"_id": 0})
        
        if existing:
            return {
                "success": True,
                "stream_id": existing["stream_id"],
                "message": "Stream already active",
                "stream_url": f"wss://calliotel.com/api/live-streaming/stream/{existing['stream_id']}"
            }
        
        # Create stream
        stream_id = str(uuid.uuid4())
        
        stream_doc = {
            "stream_id": stream_id,
            "streamer_id": streamer_id,
            "streamer_name": current_user.get("name", "Anonymous"),
            "title": request.title,
            "description": request.description,
            "category": request.category,
            "is_public": request.is_public,
            "enable_filters": request.enable_filters,
            "status": "live",
            "viewer_count": 0,
            "peak_viewers": 0,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "ended_at": None
        }
        
        await db.live_streams.insert_one(stream_doc)
        active_streams[stream_id] = stream_doc
        stream_viewers[stream_id] = set()
        
        logger.info(f"📡 Stream started: {stream_id} by {streamer_id}")
        
        return {
            "success": True,
            "stream_id": stream_id,
            "message": "Stream started successfully!",
            "stream_url": f"wss://calliotel.com/api/live-streaming/stream/{stream_id}",
            "viewer_url": f"/live-streaming/watch/{stream_id}"
        }
        
    except Exception as e:
        logger.error(f"Error starting stream: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start stream")


@router.post("/end-stream/{stream_id}")
async def end_live_stream(stream_id: str, current_user = Depends(get_current_user)):
    """
    End a live stream
    """
    try:
        user_id = current_user["_id"]
        
        # Get stream
        stream = await db.live_streams.find_one({"stream_id": stream_id}, {"_id": 0})
        
        if not stream:
            raise HTTPException(status_code=404, detail="Stream not found")
        
        if stream["streamer_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Calculate duration
        started_at = datetime.fromisoformat(stream["started_at"])
        ended_at = datetime.now(timezone.utc)
        duration = (ended_at - started_at).total_seconds()
        
        # Update stream
        await db.live_streams.update_one(
            {"stream_id": stream_id},
            {
                "$set": {
                    "status": "ended",
                    "ended_at": ended_at.isoformat(),
                    "duration_seconds": duration
                }
            }
        )
        
        # Remove from active
        if stream_id in active_streams:
            del active_streams[stream_id]
        if stream_id in stream_viewers:
            del stream_viewers[stream_id]
        
        logger.info(f"📴 Stream ended: {stream_id} (duration: {duration}s)")
        
        return {
            "success": True,
            "stream_id": stream_id,
            "duration_seconds": duration,
            "peak_viewers": stream.get("peak_viewers", 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ending stream: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to end stream")


@router.get("/discover")
async def discover_live_streams(
    category: Optional[str] = None,
    search: Optional[str] = None
):
    """
    Discover live streams
    """
    try:
        query = {"status": "live", "is_public": True}
        
        if category:
            query["category"] = category
        
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"streamer_name": {"$regex": search, "$options": "i"}}
            ]
        
        streams = await db.live_streams.find(
            query,
            {"_id": 0}
        ).sort("viewer_count", -1).limit(50).to_list(50)
        
        return {
            "success": True,
            "streams": streams,
            "total": len(streams)
        }
        
    except Exception as e:
        logger.error(f"Error discovering streams: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to discover streams")


@router.post("/join-stream/{stream_id}")
async def join_stream(stream_id: str, current_user = Depends(get_current_user)):
    """
    Join a live stream as viewer
    """
    try:
        viewer_id = current_user["_id"]
        
        # Get stream
        stream = await db.live_streams.find_one({"stream_id": stream_id}, {"_id": 0})
        
        if not stream:
            raise HTTPException(status_code=404, detail="Stream not found")
        
        if stream["status"] != "live":
            raise HTTPException(status_code=400, detail="Stream is not live")
        
        # Add viewer
        if stream_id in stream_viewers:
            stream_viewers[stream_id].add(viewer_id)
            viewer_count = len(stream_viewers[stream_id])
            
            # Update viewer count
            await db.live_streams.update_one(
                {"stream_id": stream_id},
                {
                    "$set": {"viewer_count": viewer_count},
                    "$max": {"peak_viewers": viewer_count}
                }
            )
        
        logger.info(f"👀 Viewer joined stream: {stream_id}")
        
        return {
            "success": True,
            "stream_id": stream_id,
            "stream": stream,
            "viewer_url": f"wss://calliotel.com/api/live-streaming/watch/{stream_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error joining stream: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to join stream")


@router.get("/my-streams")
async def get_my_streams(current_user = Depends(get_current_user)):
    """
    Get user's stream history
    """
    try:
        streams = await db.live_streams.find(
            {"streamer_id": current_user["_id"]},
            {"_id": 0}
        ).sort("started_at", -1).limit(50).to_list(50)
        
        return {
            "success": True,
            "streams": streams
        }
        
    except Exception as e:
        logger.error(f"Error getting streams: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get streams")
