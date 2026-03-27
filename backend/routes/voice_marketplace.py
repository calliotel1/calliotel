"""
Voice Clone Marketplace
Users can create, sell, and buy custom voice clones
Revenue split: 70% creator, 30% platform
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
import requests

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ElevenLabs
ELEVENLABS_API_KEY = os.environ.get('ELEVENLABS_API_KEY')

# Storage
VOICE_SAMPLES_DIR = Path("/app/backend/uploads/voice_samples")
VOICE_SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

# Pricing
VOICE_CLONE_CREATION_FEE = 9.99  # One-time fee to create a voice clone
VOICE_CLONE_USAGE_FEE = 0.99     # Per-use fee for using someone's voice
PLATFORM_COMMISSION = 0.30        # 30%
CREATOR_SHARE = 0.70              # 70%


class VoiceCloneRequest(BaseModel):
    name: str
    description: str
    category: str  # storyteller, narrator, character, celebrity_impression, etc.
    price: float = 0.99  # Price per use
    is_public: bool = True  # List in marketplace


class VoiceCloneResponse(BaseModel):
    voice_id: str
    status: str
    message: str


@router.post("/create", response_model=VoiceCloneResponse)
async def create_voice_clone(
    request: VoiceCloneRequest,
    audio_file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Create a custom voice clone from audio sample
    User uploads voice sample → Train with ElevenLabs → List in marketplace
    """
    try:
        user_id = current_user["_id"]
        
        # Check if user has enough balance (creation fee)
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        balance = user.get("wallet_balance", 0)
        
        if balance < VOICE_CLONE_CREATION_FEE:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient balance. Need ${VOICE_CLONE_CREATION_FEE} to create voice clone."
            )
        
        # Save audio file
        voice_id = str(uuid.uuid4())
        audio_path = VOICE_SAMPLES_DIR / f"{voice_id}.mp3"
        
        with open(audio_path, 'wb') as f:
            content = await audio_file.read()
            f.write(content)
        
        logger.info(f"Voice sample saved: {audio_path}")
        
        # Train voice clone with ElevenLabs (if API available)
        elevenlabs_voice_id = None
        if ELEVENLABS_API_KEY:
            try:
                elevenlabs_voice_id = await train_voice_clone_elevenlabs(
                    voice_id, 
                    str(audio_path), 
                    request.name
                )
                logger.info(f"Voice clone trained: {elevenlabs_voice_id}")
            except Exception as e:
                logger.error(f"ElevenLabs training failed: {str(e)}")
                # Continue without ElevenLabs voice ID
        
        # Deduct creation fee
        await db.users.update_one(
            {"user_id": user_id},
            {"$inc": {"wallet_balance": -VOICE_CLONE_CREATION_FEE}}
        )
        
        # Add transaction
        await db.wallet_transactions.insert_one({
            "transaction_id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": "voice_clone_creation",
            "amount": -VOICE_CLONE_CREATION_FEE,
            "description": f"Created voice clone: {request.name}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Create voice clone record
        voice_clone = {
            "voice_id": voice_id,
            "creator_id": user_id,
            "creator_name": user.get("name", "Anonymous"),
            "name": request.name,
            "description": request.description,
            "category": request.category,
            "price": request.price,
            "is_public": request.is_public,
            "audio_sample_path": str(audio_path),
            "elevenlabs_voice_id": elevenlabs_voice_id,
            "total_uses": 0,
            "total_earnings": 0.0,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.voice_clones.insert_one(voice_clone)
        
        logger.info(f"Voice clone created: {voice_id}")
        
        return VoiceCloneResponse(
            voice_id=voice_id,
            status="success",
            message=f"✅ Voice clone '{request.name}' created! Listed in marketplace."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating voice clone: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create voice clone")


async def train_voice_clone_elevenlabs(voice_id: str, audio_path: str, name: str) -> str:
    """
    Train voice clone with ElevenLabs
    Returns: ElevenLabs voice ID
    """
    try:
        url = "https://api.elevenlabs.io/v1/voices/add"
        headers = {"xi-api-key": ELEVENLABS_API_KEY}
        
        with open(audio_path, 'rb') as f:
            files = {"files": f}
            data = {"name": f"{name}_{voice_id}"}
            
            response = requests.post(url, headers=headers, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                return result["voice_id"]
            else:
                raise Exception(f"ElevenLabs error: {response.status_code}")
                
    except Exception as e:
        logger.error(f"ElevenLabs training error: {str(e)}")
        raise


@router.get("/marketplace")
async def browse_marketplace(
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = "popular"  # popular, newest, price_low, price_high
):
    """
    Browse voice clone marketplace
    """
    try:
        # Build query
        query = {"is_public": True, "status": "active"}
        
        if category:
            query["category"] = category
        
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        
        # Sort
        sort_options = {
            "popular": [("total_uses", -1)],
            "newest": [("created_at", -1)],
            "price_low": [("price", 1)],
            "price_high": [("price", -1)]
        }
        sort_by = sort_options.get(sort, [("total_uses", -1)])
        
        # Get voices
        voices = await db.voice_clones.find(
            query, 
            {"_id": 0, "audio_sample_path": 0, "elevenlabs_voice_id": 0}
        ).sort(sort_by).limit(50).to_list(50)
        
        return {
            "success": True,
            "voices": voices,
            "categories": ["storyteller", "narrator", "character", "celebrity_impression", "podcast", "audiobook"]
        }
        
    except Exception as e:
        logger.error(f"Error browsing marketplace: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to browse marketplace")


@router.post("/purchase/{voice_id}")
async def purchase_voice_usage(voice_id: str, current_user = Depends(get_current_user)):
    """
    Purchase one-time usage of a voice clone
    70% goes to creator, 30% to platform
    """
    try:
        user_id = current_user["_id"]
        
        # Get voice clone
        voice = await db.voice_clones.find_one({"voice_id": voice_id}, {"_id": 0})
        
        if not voice:
            raise HTTPException(status_code=404, detail="Voice clone not found")
        
        # Check balance
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        balance = user.get("wallet_balance", 0)
        price = voice["price"]
        
        if balance < price:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient balance. Need ${price}"
            )
        
        # Calculate split
        creator_earnings = price * CREATOR_SHARE
        platform_earnings = price * PLATFORM_COMMISSION
        
        # Deduct from buyer
        await db.users.update_one(
            {"user_id": user_id},
            {"$inc": {"wallet_balance": -price}}
        )
        
        # Add to creator
        await db.users.update_one(
            {"user_id": voice["creator_id"]},
            {"$inc": {"wallet_balance": creator_earnings}}
        )
        
        # Update voice stats
        await db.voice_clones.update_one(
            {"voice_id": voice_id},
            {
                "$inc": {
                    "total_uses": 1,
                    "total_earnings": creator_earnings
                }
            }
        )
        
        # Record transactions
        transaction_id = str(uuid.uuid4())
        
        # Buyer transaction
        await db.wallet_transactions.insert_one({
            "transaction_id": transaction_id,
            "user_id": user_id,
            "type": "voice_purchase",
            "amount": -price,
            "description": f"Purchased voice: {voice['name']}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Creator earnings
        await db.wallet_transactions.insert_one({
            "transaction_id": str(uuid.uuid4()),
            "user_id": voice["creator_id"],
            "type": "voice_earnings",
            "amount": creator_earnings,
            "description": f"Earnings from voice: {voice['name']}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Grant usage permission
        await db.voice_purchases.insert_one({
            "purchase_id": transaction_id,
            "buyer_id": user_id,
            "voice_id": voice_id,
            "price": price,
            "used": False,
            "purchased_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "success": True,
            "message": f"✅ Purchased voice: {voice['name']}!",
            "voice": voice,
            "creator_earned": creator_earnings
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error purchasing voice: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to purchase voice")


@router.get("/my-voices")
async def get_my_voices(current_user = Depends(get_current_user)):
    """Get voices created by current user"""
    try:
        voices = await db.voice_clones.find(
            {"creator_id": current_user["_id"]},
            {"_id": 0, "audio_sample_path": 0}
        ).sort("created_at", -1).to_list(100)
        
        total_earnings = sum(v.get("total_earnings", 0) for v in voices)
        total_uses = sum(v.get("total_uses", 0) for v in voices)
        
        return {
            "success": True,
            "voices": voices,
            "stats": {
                "total_voices": len(voices),
                "total_earnings": total_earnings,
                "total_uses": total_uses
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting my voices: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get voices")


@router.get("/my-purchases")
async def get_my_purchases(current_user = Depends(get_current_user)):
    """Get voices purchased by current user"""
    try:
        purchases = await db.voice_purchases.find(
            {"buyer_id": current_user["_id"]},
            {"_id": 0}
        ).sort("purchased_at", -1).to_list(100)
        
        # Get voice details
        for purchase in purchases:
            voice = await db.voice_clones.find_one(
                {"voice_id": purchase["voice_id"]},
                {"_id": 0, "name": 1, "description": 1, "creator_name": 1}
            )
            if voice:
                purchase["voice"] = voice
        
        return {
            "success": True,
            "purchases": purchases
        }
        
    except Exception as e:
        logger.error(f"Error getting purchases: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get purchases")
