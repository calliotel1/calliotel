"""
Voice Changer API - Premium Feature
Allows users to modify their voice during calls with various effects
Includes 3-tier pricing: Basic ($2.99), Pro ($4.99), Unlimited ($9.99)
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
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
from elevenlabs.client import ElevenLabs

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Upload directory for custom voices
UPLOAD_DIR = Path("/app/backend/uploads/voices")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ElevenLabs client
def get_elevenlabs_client():
    """Get ElevenLabs client with API key from environment"""
    api_key = os.environ.get('ELEVENLABS_API_KEY')
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not set in environment")
    return ElevenLabs(api_key=api_key)

# Pricing tiers
PRICING_TIERS = {
    "basic": {
        "name": "Basic",
        "price": 2.99,
        "custom_voices_limit": 0
    },
    "pro": {
        "name": "Pro",
        "price": 4.99,
        "custom_voices_limit": 1
    },
    "unlimited": {
        "name": "Unlimited",
        "price": 9.99,
        "custom_voices_limit": 999
    }
}

# Available voice effects
VOICE_EFFECTS = {
    "none": {
        "name": "Normal Voice",
        "description": "Your natural voice - no effects",
        "icon": "🎤",
        "premium": False,
        "settings": {
            "pitch": 1.0,
            "speed": 1.0,
            "formant": 1.0,
            "reverb": 0.0
        }
    },
    "male_deep": {
        "name": "Male (Deep)",
        "description": "Professional masculine deep voice",
        "icon": "🎭",
        "premium": True,
        "settings": {
            "pitch": 0.75,
            "speed": 0.95,
            "formant": 0.8,
            "reverb": 0.1
        }
    },
    "female_high": {
        "name": "Female (High)",
        "description": "Feminine high-pitched voice",
        "icon": "👩",
        "premium": True,
        "settings": {
            "pitch": 1.4,
            "speed": 1.05,
            "formant": 1.3,
            "reverb": 0.05
        }
    },
    "robot": {
        "name": "Robot/Vocoder",
        "description": "Mechanical robotic voice",
        "icon": "🤖",
        "premium": True,
        "settings": {
            "pitch": 1.0,
            "speed": 0.9,
            "formant": 0.7,
            "reverb": 0.3,
            "distortion": 0.4,
            "vocoder": True
        }
    },
    "child": {
        "name": "Child Voice",
        "description": "Young, playful voice",
        "icon": "👶",
        "premium": True,
        "settings": {
            "pitch": 1.6,
            "speed": 1.1,
            "formant": 1.5,
            "reverb": 0.0
        }
    },
    "elderly": {
        "name": "Elderly Voice",
        "description": "Older, gravelly voice",
        "icon": "👴",
        "premium": True,
        "settings": {
            "pitch": 0.85,
            "speed": 0.85,
            "formant": 0.75,
            "reverb": 0.05,
            "tremolo": 0.3
        }
    },
    "darth_vader": {
        "name": "Darth Vader",
        "description": "Deep, dark, distorted voice",
        "icon": "😈",
        "premium": True,
        "settings": {
            "pitch": 0.6,
            "speed": 0.9,
            "formant": 0.6,
            "reverb": 0.4,
            "distortion": 0.5,
            "lowpass": 800
        }
    },
    "chipmunk": {
        "name": "Chipmunk",
        "description": "High-pitched, fast voice",
        "icon": "🐿️",
        "premium": True,
        "settings": {
            "pitch": 1.8,
            "speed": 1.3,
            "formant": 1.7,
            "reverb": 0.0
        }
    },
    "monster": {
        "name": "Monster",
        "description": "Very deep voice with reverb",
        "icon": "👹",
        "premium": True,
        "settings": {
            "pitch": 0.5,
            "speed": 0.8,
            "formant": 0.5,
            "reverb": 0.6,
            "distortion": 0.3
        }
    }
}

class VoiceSettings(BaseModel):
    effect: str
    enabled: bool = True

class VoiceSettingsResponse(BaseModel):
    effect: str
    enabled: bool
    premium_required: bool
    has_premium: bool

class UpgradeTierRequest(BaseModel):
    tier: str  # "basic", "pro", "unlimited"

class CustomVoiceCreate(BaseModel):
    name: str
    description: Optional[str] = None


@router.get("/pricing")
async def get_pricing_tiers():
    """
    Get all pricing tiers
    """
    return {
        "success": True,
        "tiers": [
            {
                "id": "basic",
                "name": "Basic",
                "price": 2.99,
                "custom_voices": 0,
                "features": ["8 preset voices", "Unlimited usage", "Male & Female voices", "Robot effects"]
            },
            {
                "id": "pro",
                "name": "Pro",
                "price": 4.99,
                "custom_voices": 1,
                "popular": True,
                "features": ["All Basic features", "1 custom voice upload", "Voice cloning", "Clone your own voice"]
            },
            {
                "id": "unlimited",
                "name": "Unlimited",
                "price": 9.99,
                "custom_voices": 999,
                "features": ["All Pro features", "Unlimited custom voices", "Priority support", "Advanced voice effects"]
            }
        ]
    }


@router.get("/effects")
async def get_available_effects(current_user = Depends(get_current_user)):
    """
    Get list of all available voice effects including custom voices
    """
    try:
        # Check user's tier
        user = await db.users.find_one({"_id": current_user["_id"]})
        tier = user.get("voice_changer_tier", "none")
        has_premium = tier in ["basic", "pro", "unlimited"]
        
        # Get preset effects
        effects = []
        for effect_id, effect_data in VOICE_EFFECTS.items():
            effects.append({
                "id": effect_id,
                "name": effect_data["name"],
                "description": effect_data["description"],
                "icon": effect_data["icon"],
                "premium": effect_data["premium"],
                "locked": effect_data["premium"] and not has_premium,
                "custom": False
            })
        
        # Get custom voices
        if tier in ["pro", "unlimited"]:
            custom_voices = await db.custom_voices.find({
                "user_id": current_user["_id"],
                "status": "ready"
            }).to_list(length=100)
            
            for voice in custom_voices:
                effects.append({
                    "id": f"custom_{voice['voice_id']}",
                    "name": voice["name"],
                    "description": voice.get("description", "Your custom voice"),
                    "icon": "🎙️",
                    "premium": True,
                    "locked": False,
                    "custom": True,
                    "created_at": voice["created_at"]
                })
        
        return {
            "success": True,
            "effects": effects,
            "has_premium": has_premium,
            "tier": tier
        }
        
    except Exception as e:
        logger.error(f"Error fetching voice effects: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch voice effects")


@router.get("/settings")
async def get_voice_settings(current_user = Depends(get_current_user)):
    """
    Get current user's voice changer settings
    """
    try:
        settings = await db.voice_settings.find_one({"user_id": current_user["_id"]})
        
        if not settings:
            # Default settings
            return {
                "success": True,
                "settings": {
                    "effect": "none",
                    "enabled": False,
                    "premium_required": False,
                    "has_premium": False
                }
            }
        
        # Check premium status
        user = await db.users.find_one({"_id": current_user["_id"]})
        has_premium = user.get("premium_voice_changer", False)
        
        effect = settings.get("effect", "none")
        premium_required = VOICE_EFFECTS.get(effect, {}).get("premium", False)
        
        return {
            "success": True,
            "settings": {
                "effect": effect,
                "enabled": settings.get("enabled", False),
                "premium_required": premium_required,
                "has_premium": has_premium
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching voice settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch voice settings")


@router.put("/settings")
async def update_voice_settings(settings: VoiceSettings, current_user = Depends(get_current_user)):
    """
    Update user's voice changer settings
    """
    try:
        # Validate effect exists
        if settings.effect not in VOICE_EFFECTS:
            raise HTTPException(status_code=400, detail="Invalid voice effect")
        
        effect_data = VOICE_EFFECTS[settings.effect]
        
        # Check if effect requires premium
        if effect_data["premium"]:
            user = await db.users.find_one({"_id": current_user["_id"]})
            has_premium = user.get("premium_voice_changer", False)
            
            if not has_premium:
                raise HTTPException(
                    status_code=403, 
                    detail="This voice effect requires premium subscription ($2.99/month)"
                )
        
        # Update or create settings
        await db.voice_settings.update_one(
            {"user_id": current_user["_id"]},
            {
                "$set": {
                    "effect": settings.effect,
                    "enabled": settings.enabled,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        
        logger.info(f"Voice settings updated for {current_user['email']}: {settings.effect}")
        
        return {
            "success": True,
            "message": f"Voice changed to {effect_data['name']}",
            "settings": {
                "effect": settings.effect,
                "enabled": settings.enabled
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating voice settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update voice settings")


@router.post("/upgrade-premium")
async def upgrade_to_premium(current_user = Depends(get_current_user)):
    """
    DEPRECATED: Use /upgrade-tier instead
    Old endpoint for backward compatibility
    """
    return {
        "success": False,
        "message": "This endpoint is deprecated. Use /upgrade-tier instead",
        "redirect": "/api/voice-changer/upgrade-tier"
    }


@router.post("/upgrade-tier")
async def upgrade_tier(request: UpgradeTierRequest, current_user = Depends(get_current_user)):
    """
    Upgrade to a different pricing tier
    Tiers: basic ($2.99), pro ($4.99), unlimited ($9.99)
    """
    try:
        tier = request.tier.lower()
        
        if tier not in PRICING_TIERS:
            raise HTTPException(status_code=400, detail="Invalid tier")
        
        # Get user and current tier
        user = await db.users.find_one({"_id": current_user["_id"]})
        current_tier = user.get("voice_changer_tier", "none")
        
        # Check if already have this tier
        if current_tier == tier:
            raise HTTPException(status_code=400, detail=f"Already subscribed to {PRICING_TIERS[tier]['name']}")
        
        price = PRICING_TIERS[tier]["price"]
        
        # Check wallet balance
        wallet = await db.wallets.find_one({"user_id": current_user["_id"]})
        if not wallet or wallet["balance"] < price:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient balance. Need ${price}, have ${wallet.get('balance', 0):.2f}"
            )
        
        # Deduct from wallet
        new_balance = wallet["balance"] - price
        await db.wallets.update_one(
            {"user_id": current_user["_id"]},
            {"$set": {"balance": new_balance, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Log transaction
        transaction = {
            "user_id": current_user["_id"],
            "type": "debit",
            "amount": price,
            "description": f"Voice Changer {PRICING_TIERS[tier]['name']} - Monthly Subscription",
            "balance_after": new_balance,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        # Upgrade user tier
        next_billing = datetime.now(timezone.utc) + timedelta(days=30)
        
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {
                "$set": {
                    "voice_changer_tier": tier,
                    "voice_changer_expires": next_billing.isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"User {current_user['email']} upgraded to {tier}")
        
        return {
            "success": True,
            "message": f"🎉 Upgraded to {PRICING_TIERS[tier]['name']}!",
            "tier": tier,
            "expires": next_billing.isoformat(),
            "new_balance": new_balance,
            "custom_voices_limit": PRICING_TIERS[tier]["custom_voices_limit"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error upgrading tier: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upgrade tier")


@router.post("/custom-voices/upload")
async def upload_custom_voice(
    file: UploadFile = File(...),
    name: str = "My Custom Voice",
    description: str = "",
    current_user = Depends(get_current_user)
):
    """
    Upload a custom voice for REAL voice cloning using ElevenLabs
    Requires Pro ($4.99) or Unlimited ($9.99) tier
    """
    try:
        # Check user's tier
        user = await db.users.find_one({"_id": current_user["_id"]})
        tier = user.get("voice_changer_tier", "none")
        
        if tier not in ["pro", "unlimited"]:
            raise HTTPException(
                status_code=403,
                detail="Custom voices require Pro ($4.99/mo) or Unlimited ($9.99/mo) tier"
            )
        
        # Check custom voice limit
        custom_voice_count = await db.custom_voices.count_documents({
            "user_id": current_user["_id"],
            "status": {"$ne": "deleted"}
        })
        
        limit = PRICING_TIERS[tier]["custom_voices_limit"]
        
        if custom_voice_count >= limit:
            raise HTTPException(
                status_code=403,
                detail=f"Voice limit reached ({limit}). Upgrade to Unlimited for unlimited voices!"
            )
        
        # Validate file type
        if not file.content_type.startswith("audio/"):
            raise HTTPException(status_code=400, detail="File must be an audio file (MP3, WAV, etc.)")
        
        # Generate unique voice ID
        voice_id = str(uuid.uuid4())
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "wav"
        file_path = UPLOAD_DIR / f"{voice_id}.{file_extension}"
        
        # Save file temporarily
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create database entry with "processing" status
        custom_voice = {
            "voice_id": voice_id,
            "user_id": current_user["_id"],
            "name": name,
            "description": description,
            "file_path": str(file_path),
            "file_size": file_path.stat().st_size,
            "file_type": file.content_type,
            "status": "processing",  # Will be updated to "ready" after ElevenLabs cloning
            "elevenlabs_voice_id": None,  # Will be set after cloning
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.custom_voices.insert_one(custom_voice)
        
        # Clone voice using ElevenLabs in background
        try:
            client = get_elevenlabs_client()
            
            # Clone the voice using ElevenLabs IVC
            with open(file_path, "rb") as audio_file:
                voice_response = client.voices.add(
                    name=f"{name} (Calliotel User)",
                    description=description or f"Custom voice for {current_user['email']}",
                    files=[audio_file]
                )
            
            elevenlabs_voice_id = voice_response.voice_id
            
            # Update database with ElevenLabs voice ID and ready status
            await db.custom_voices.update_one(
                {"voice_id": voice_id},
                {
                    "$set": {
                        "elevenlabs_voice_id": elevenlabs_voice_id,
                        "status": "ready",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            logger.info(f"✅ Voice cloned successfully! ElevenLabs ID: {elevenlabs_voice_id}")
            
        except Exception as e:
            logger.error(f"❌ ElevenLabs cloning failed: {str(e)}")
            # Update status to failed
            await db.custom_voices.update_one(
                {"voice_id": voice_id},
                {
                    "$set": {
                        "status": "failed",
                        "error": str(e),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            raise HTTPException(status_code=500, detail=f"Voice cloning failed: {str(e)}")
        
        logger.info(f"Custom voice uploaded and cloned by {current_user['email']}: {name}")
        
        return {
            "success": True,
            "message": "🎉 Voice cloned successfully with ElevenLabs!",
            "voice": {
                "id": voice_id,
                "name": name,
                "description": description,
                "status": "ready",
                "elevenlabs_voice_id": elevenlabs_voice_id,
                "created_at": custom_voice["created_at"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading custom voice: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload voice")


@router.get("/custom-voices")
async def get_custom_voices(current_user = Depends(get_current_user)):
    """
    Get all custom voices for the current user
    """
    try:
        user = await db.users.find_one({"_id": current_user["_id"]})
        tier = user.get("voice_changer_tier", "none")
        
        custom_voices = await db.custom_voices.find({
            "user_id": current_user["_id"],
            "status": {"$ne": "deleted"}
        }, {"_id": 0, "file_path": 0}).to_list(length=100)
        
        limit = PRICING_TIERS.get(tier, {}).get("custom_voices_limit", 0)
        
        return {
            "success": True,
            "voices": custom_voices,
            "count": len(custom_voices),
            "limit": limit,
            "tier": tier
        }
        
    except Exception as e:
        logger.error(f"Error fetching custom voices: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch custom voices")


@router.delete("/custom-voices/{voice_id}")
async def delete_custom_voice(voice_id: str, current_user = Depends(get_current_user)):
    """
    Delete a custom voice
    """
    try:
        voice = await db.custom_voices.find_one({
            "voice_id": voice_id,
            "user_id": current_user["_id"]
        })
        
        if not voice:
            raise HTTPException(status_code=404, detail="Voice not found")
        
        # Delete from ElevenLabs if it has an ElevenLabs voice ID
        if voice.get("elevenlabs_voice_id"):
            try:
                client = get_elevenlabs_client()
                client.voices.delete(voice["elevenlabs_voice_id"])
                logger.info(f"Deleted voice from ElevenLabs: {voice['elevenlabs_voice_id']}")
            except Exception as e:
                logger.warning(f"Could not delete voice from ElevenLabs: {str(e)}")
        
        # Mark as deleted (soft delete)
        await db.custom_voices.update_one(
            {"voice_id": voice_id},
            {
                "$set": {
                    "status": "deleted",
                    "deleted_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Delete physical file
        try:
            file_path = Path(voice["file_path"])
            if file_path.exists():
                file_path.unlink()
        except Exception as e:
            logger.warning(f"Could not delete file: {str(e)}")
        
        logger.info(f"Custom voice deleted: {voice_id}")
        
        return {
            "success": True,
            "message": "Voice deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting custom voice: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete voice")


class TextToSpeechRequest(BaseModel):
    text: str
    voice_id: str  # Can be custom voice_id or ElevenLabs voice_id
    
@router.post("/tts/generate")
async def generate_tts(request: TextToSpeechRequest, current_user = Depends(get_current_user)):
    """
    Generate speech from text using a custom cloned voice
    Requires Pro or Unlimited tier
    """
    try:
        # Check user's tier
        user = await db.users.find_one({"_id": current_user["_id"]})
        tier = user.get("voice_changer_tier", "none")
        
        if tier not in ["pro", "unlimited"]:
            raise HTTPException(
                status_code=403,
                detail="Text-to-speech with custom voices requires Pro ($4.99/mo) or Unlimited ($9.99/mo) tier"
            )
        
        # Get voice details
        custom_voice = await db.custom_voices.find_one({
            "voice_id": request.voice_id,
            "user_id": current_user["_id"],
            "status": "ready"
        })
        
        if not custom_voice:
            raise HTTPException(status_code=404, detail="Voice not found or not ready")
        
        elevenlabs_voice_id = custom_voice.get("elevenlabs_voice_id")
        
        if not elevenlabs_voice_id:
            raise HTTPException(status_code=400, detail="Voice has not been cloned yet")
        
        # Generate speech using ElevenLabs
        client = get_elevenlabs_client()
        
        audio_generator = client.text_to_speech.convert(
            text=request.text,
            voice_id=elevenlabs_voice_id,
            model_id="eleven_multilingual_v2"
        )
        
        # Collect audio data
        audio_data = b""
        for chunk in audio_generator:
            audio_data += chunk
        
        # Save generated audio
        import base64
        audio_b64 = base64.b64encode(audio_data).decode()
        
        logger.info(f"Generated TTS for user {current_user['email']} using voice {custom_voice['name']}")
        
        return {
            "success": True,
            "audio_url": f"data:audio/mpeg;base64,{audio_b64}",
            "text": request.text,
            "voice_name": custom_voice["name"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating TTS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate speech: {str(e)}")
