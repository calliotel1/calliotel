from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class PrivacySettings(BaseModel):
    stealth_mode: bool
    mask_phone_numbers: bool

class PrivacySettingsResponse(BaseModel):
    user_id: str
    stealth_mode: bool
    mask_phone_numbers: bool
    updated_at: str

@router.get("/privacy/{user_id}", response_model=PrivacySettingsResponse)
async def get_privacy_settings(user_id: str):
    """Get user's privacy settings"""
    try:
        settings = await db.privacy_settings.find_one({"user_id": user_id}, {"_id": 0})
        
        if not settings:
            # Return defaults if no settings exist
            return PrivacySettingsResponse(
                user_id=user_id,
                stealth_mode=False,
                mask_phone_numbers=False,
                updated_at=datetime.now(timezone.utc).isoformat()
            )
        
        return PrivacySettingsResponse(**settings)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching privacy settings: {str(e)}")

@router.post("/privacy/{user_id}", response_model=PrivacySettingsResponse)
async def update_privacy_settings(user_id: str, settings: PrivacySettings):
    """Update user's privacy settings"""
    try:
        updated_settings = {
            "user_id": user_id,
            "stealth_mode": settings.stealth_mode,
            "mask_phone_numbers": settings.mask_phone_numbers,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Upsert settings
        await db.privacy_settings.update_one(
            {"user_id": user_id},
            {"$set": updated_settings},
            upsert=True
        )
        
        # If stealth mode is enabled, delete old SMS logs
        if settings.stealth_mode:
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
            await db.sms_messages.delete_many({
                "user_id": user_id,
                "timestamp": {"$lt": cutoff_time.isoformat()}
            })
        
        return PrivacySettingsResponse(**updated_settings)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating privacy settings: {str(e)}")

def mask_phone_number(phone: str) -> str:
    """Mask middle digits of phone number"""
    if not phone or len(phone) < 8:
        return phone
    
    # Keep first 5 chars and last 3 chars, mask the middle
    # Example: +1-555-1234-890 → +1-555-••••-890
    return phone[:5] + '••••' + phone[-3:]

@router.get("/privacy/{user_id}/mask-number")
async def get_masked_number(user_id: str, phone: str):
    """Get masked version of phone number if privacy settings are enabled"""
    try:
        settings = await db.privacy_settings.find_one({"user_id": user_id}, {"_id": 0})
        
        if settings and settings.get('mask_phone_numbers'):
            return {"masked_number": mask_phone_number(phone)}
        else:
            return {"masked_number": phone}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error masking number: {str(e)}")
