"""
Hologram Messages
AR hologram video messages that appear in real world
Star Wars style!
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Storage
HOLOGRAM_DIR = Path("/app/backend/uploads/holograms")
HOLOGRAM_DIR.mkdir(parents=True, exist_ok=True)

# Pricing
HOLOGRAM_PRICE = 4.99


class HologramRequest(BaseModel):
    recipient_user_id: str
    message_text: Optional[str] = None
    hologram_style: str = "starwars"  # starwars, futuristic, glitch, matrix


@router.post("/create")
async def create_hologram_message(
    request: HologramRequest,
    video: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Create AR hologram message
    User records video → Process with hologram effect → Send as AR message
    """
    try:
        sender_id = current_user["_id"]
        
        # Check balance
        user = await db.users.find_one({"user_id": sender_id}, {"_id": 0})
        balance = user.get("wallet_balance", 0)
        
        if balance < HOLOGRAM_PRICE:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient balance. Need ${HOLOGRAM_PRICE} for hologram message."
            )
        
        # Check recipient exists
        recipient = await db.users.find_one({"user_id": request.recipient_user_id}, {"_id": 0})
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Save video
        hologram_id = str(uuid.uuid4())
        video_path = HOLOGRAM_DIR / f"{hologram_id}_original.mp4"
        
        with open(video_path, 'wb') as f:
            content = await video.read()
            f.write(content)
        
        logger.info(f"Video saved: {video_path}")
        
        # Deduct payment
        await db.users.update_one(
            {"user_id": sender_id},
            {"$inc": {"wallet_balance": -HOLOGRAM_PRICE}}
        )
        
        await db.wallet_transactions.insert_one({
            "transaction_id": str(uuid.uuid4()),
            "user_id": sender_id,
            "type": "hologram_message",
            "amount": -HOLOGRAM_PRICE,
            "description": f"Hologram message to {recipient.get('name')}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Create hologram record
        hologram_doc = {
            "hologram_id": hologram_id,
            "sender_id": sender_id,
            "sender_name": user.get("name", "Anonymous"),
            "recipient_id": request.recipient_user_id,
            "message_text": request.message_text,
            "hologram_style": request.hologram_style,
            "video_path": str(video_path),
            "status": "processing",
            "progress": "Applying hologram effect...",
            "viewed": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.holograms.insert_one(hologram_doc)
        
        # TODO: Process video with hologram effects
        # - Add blue/green tint
        # - Add glitch/scan lines
        # - Add holographic distortion
        # - Export as AR-compatible format
        
        logger.info(f"👻 Hologram message created: {hologram_id}")
        
        return {
            "success": True,
            "hologram_id": hologram_id,
            "message": "✅ Creating hologram message! Processing...",
            "status": "processing"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating hologram: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create hologram")


@router.get("/my-holograms")
async def get_my_holograms(current_user = Depends(get_current_user)):
    """Get sent/received holograms"""
    try:
        user_id = current_user["_id"]
        
        # Get sent and received
        holograms = await db.holograms.find(
            {
                "$or": [
                    {"sender_id": user_id},
                    {"recipient_id": user_id}
                ]
            },
            {"_id": 0}
        ).sort("created_at", -1).limit(50).to_list(50)
        
        return {
            "success": True,
            "holograms": holograms
        }
        
    except Exception as e:
        logger.error(f"Error getting holograms: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get holograms")


@router.get("/view/{hologram_id}")
async def view_hologram(hologram_id: str, current_user = Depends(get_current_user)):
    """View hologram message (AR experience)"""
    try:
        from fastapi.responses import FileResponse
        
        hologram = await db.holograms.find_one(
            {"hologram_id": hologram_id},
            {"_id": 0}
        )
        
        if not hologram:
            raise HTTPException(status_code=404, detail="Hologram not found")
        
        # Check authorization
        user_id = current_user["_id"]
        if hologram["recipient_id"] != user_id and hologram["sender_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        if hologram['status'] != 'completed':
            raise HTTPException(status_code=400, detail="Hologram not ready")
        
        # Mark as viewed
        if hologram["recipient_id"] == user_id and not hologram.get("viewed"):
            await db.holograms.update_one(
                {"hologram_id": hologram_id},
                {
                    "$set": {
                        "viewed": True,
                        "viewed_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        
        video_file = hologram.get('processed_video_path', hologram.get('video_path'))
        if not video_file or not Path(video_file).exists():
            raise HTTPException(status_code=404, detail="Hologram file not found")
        
        return FileResponse(
            video_file,
            media_type="video/mp4",
            filename=f"hologram_{hologram_id}.mp4"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error viewing hologram: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to view hologram")
