"""
Password Reset Router
Handles password reset requests and token validation
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
from datetime import datetime, timedelta, timezone
import bcrypt
from email_service import send_password_reset_email

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

@router.post("/request-reset")
async def request_password_reset(request: PasswordResetRequest):
    """
    Send password reset email with token
    """
    try:
        # Check if user exists
        user = await db.users.find_one({"email": request.email}, {"_id": 0})
        
        if not user:
            # Don't reveal if email exists or not (security best practice)
            return {
                "success": True,
                "message": "If an account exists with this email, a password reset link has been sent."
            }
        
        # Check if user signed up with OAuth
        if user.get("auth_provider") in ["google", "microsoft"]:
            raise HTTPException(
                status_code=400,
                detail=f"This account uses {user['auth_provider'].capitalize()} login. Please use 'Sign in with {user['auth_provider'].capitalize()}' button."
            )
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)  # Token valid for 1 hour
        
        # Store reset token
        await db.password_resets.insert_one({
            "email": request.email,
            "token": reset_token,
            "expires_at": expires_at.isoformat(),
            "used": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Send email
        await send_password_reset_email(request.email, user.get("name", ""), reset_token)
        
        logger.info(f"Password reset email sent to {request.email}")
        
        return {
            "success": True,
            "message": "If an account exists with this email, a password reset link has been sent."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error requesting password reset: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process password reset request")

@router.post("/reset-password")
async def reset_password(request: PasswordResetConfirm):
    """
    Reset password using token
    """
    try:
        # Find reset token
        reset_record = await db.password_resets.find_one(
            {"token": request.token, "used": False},
            {"_id": 0}
        )
        
        if not reset_record:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
        # Check if token expired
        expires_at = datetime.fromisoformat(reset_record["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="Reset token has expired")
        
        # Validate password
        if len(request.new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
        # Hash new password
        hashed_password = bcrypt.hashpw(request.new_password.encode('utf-8'), bcrypt.gensalt())
        
        # Update user password
        result = await db.users.update_one(
            {"email": reset_record["email"]},
            {"$set": {"password": hashed_password.decode('utf-8')}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Mark token as used
        await db.password_resets.update_one(
            {"token": request.token},
            {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        logger.info(f"Password reset successful for {reset_record['email']}")
        
        return {
            "success": True,
            "message": "Password has been reset successfully. You can now login with your new password."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting password: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reset password")

@router.get("/validate-token/{token}")
async def validate_reset_token(token: str):
    """
    Validate if reset token is still valid
    """
    try:
        reset_record = await db.password_resets.find_one(
            {"token": token, "used": False},
            {"_id": 0}
        )
        
        if not reset_record:
            return {"valid": False, "message": "Invalid token"}
        
        expires_at = datetime.fromisoformat(reset_record["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            return {"valid": False, "message": "Token has expired"}
        
        return {
            "valid": True,
            "email": reset_record["email"]
        }
        
    except Exception as e:
        logger.error(f"Error validating token: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to validate token")
