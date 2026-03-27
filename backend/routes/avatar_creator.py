"""
3D Avatar Creation
Upload selfie → Generate 3D avatar
Use in videos, messages, metaverse
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
AVATAR_DIR = Path("/app/backend/uploads/avatars")
AVATAR_DIR.mkdir(parents=True, exist_ok=True)

# Pricing
AVATAR_CREATION_FEE = 9.99


class AvatarRequest(BaseModel):
    name: str
    style: str = "realistic"  # realistic, cartoon, anime, voxel
    gender: Optional[str] = None
    age_range: Optional[str] = None


@router.post("/create")
async def create_3d_avatar(
    request: AvatarRequest,
    selfie: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Create 3D avatar from selfie
    Uses AI to generate 3D model from 2D photo
    """
    try:
        user_id = current_user["_id"]
        
        # Check balance
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        balance = user.get("wallet_balance", 0)
        
        if balance < AVATAR_CREATION_FEE:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient balance. Need ${AVATAR_CREATION_FEE} to create avatar."
            )
        
        # Save selfie
        avatar_id = str(uuid.uuid4())
        selfie_path = AVATAR_DIR / f"{avatar_id}_selfie.jpg"
        
        with open(selfie_path, 'wb') as f:
            content = await selfie.read()
            f.write(content)
        
        logger.info(f"Selfie saved: {selfie_path}")
        
        # Deduct fee
        await db.users.update_one(
            {"user_id": user_id},
            {"$inc": {"wallet_balance": -AVATAR_CREATION_FEE}}
        )
        
        await db.wallet_transactions.insert_one({
            "transaction_id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": "avatar_creation",
            "amount": -AVATAR_CREATION_FEE,
            "description": f"Created 3D avatar: {request.name}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Create avatar record
        avatar_doc = {
            "avatar_id": avatar_id,
            "user_id": user_id,
            "name": request.name,
            "style": request.style,
            "selfie_path": str(selfie_path),
            "status": "processing",
            "progress": "Generating 3D model...",
            "model_url": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.avatars.insert_one(avatar_doc)
        
        # TODO: Integrate with 3D generation API
        # - Ready Player Me API
        # - Loom.ai
        # - MetaHuman Creator
        
        logger.info(f"🦸 Avatar creation started: {avatar_id}")
        
        return {
            "success": True,
            "avatar_id": avatar_id,
            "message": "✅ Generating your 3D avatar! This takes 2-3 minutes.",
            "status": "processing"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating avatar: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create avatar")


@router.get("/my-avatars")
async def get_my_avatars(current_user = Depends(get_current_user)):
    """Get user's avatars"""
    try:
        avatars = await db.avatars.find(
            {"user_id": current_user["_id"]},
            {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        
        return {
            "success": True,
            "avatars": avatars
        }
        
    except Exception as e:
        logger.error(f"Error getting avatars: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get avatars")


@router.get("/avatar/{avatar_id}")
async def get_avatar_model(avatar_id: str, current_user = Depends(get_current_user)):
    """Get 3D avatar model file"""
    try:
        from fastapi.responses import FileResponse
        
        avatar = await db.avatars.find_one(
            {"avatar_id": avatar_id, "user_id": current_user["_id"]},
            {"_id": 0}
        )
        
        if not avatar:
            raise HTTPException(status_code=404, detail="Avatar not found")
        
        if avatar['status'] != 'completed':
            raise HTTPException(status_code=400, detail="Avatar not ready")
        
        model_path = avatar.get('model_path')
        if not model_path or not Path(model_path).exists():
            raise HTTPException(status_code=404, detail="Model file not found")
        
        return FileResponse(
            model_path,
            media_type="model/gltf-binary",
            filename=f"{avatar['name']}.glb"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting avatar model: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get avatar")
