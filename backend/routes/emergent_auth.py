from fastapi import APIRouter, HTTPException, Depends, Response, Request
from pydantic import BaseModel
from typing import Optional
import logging
import requests
import secrets
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent Auth Configuration
EMERGENT_SESSION_DATA_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

class SessionExchangeRequest(BaseModel):
    session_id: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    auth_provider: str
    email_verified: bool

@router.post("/google/exchange-session")
async def exchange_google_session(request: SessionExchangeRequest, response: Response):
    """
    Exchange Emergent session_id for user data and create session.
    REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    """
    return await exchange_oauth_session(request, response, "google")

@router.post("/microsoft/exchange-session")
async def exchange_microsoft_session(request: SessionExchangeRequest, response: Response):
    """
    Exchange Emergent session_id for Microsoft user data and create session.
    """
    return await exchange_oauth_session(request, response, "microsoft")

async def exchange_oauth_session(request: SessionExchangeRequest, response: Response, provider: str):
    """
    Generic OAuth session exchange for both Google and Microsoft
    """
async def exchange_oauth_session(request: SessionExchangeRequest, response: Response, provider: str):
    """
    Generic OAuth session exchange for both Google and Microsoft
    """
    try:
        # Call Emergent Auth API to get session data
        headers = {
            "X-Session-ID": request.session_id
        }
        
        auth_response = requests.get(
            EMERGENT_SESSION_DATA_URL,
            headers=headers,
            timeout=10
        )
        
        if auth_response.status_code != 200:
            logger.error(f"Emergent Auth error: {auth_response.status_code} - {auth_response.text}")
            raise HTTPException(
                status_code=400,
                detail="Failed to exchange session_id"
            )
        
        session_data = auth_response.json()
        
        # Extract user data
        oauth_id = session_data.get("id")
        email = session_data.get("email")
        name = session_data.get("name")
        picture = session_data.get("picture")
        session_token = session_data.get("session_token")
        
        if not oauth_id or not email:
            raise HTTPException(status_code=400, detail="Invalid session data")
        
        # Check if user exists
        user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if not user:
            # Create new user with custom user_id
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            
            # Generate client_id for transfers
            client_id = f"CL{secrets.token_hex(4).upper()}"
            while await db.users.find_one({"client_id": client_id}):
                client_id = f"CL{secrets.token_hex(4).upper()}"
            
            user = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "auth_provider": provider,
                "client_id": client_id,
                "email_verified": True,  # OAuth emails are pre-verified
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(user)
            
            # Create wallet with zero balance (users must add credits)
            wallet = {
                "user_id": user_id,
                "balance": 0.00,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.wallets.insert_one(wallet)
            
            logger.info(f"New {provider.capitalize()} user created: {email}")
        else:
            user_id = user["user_id"]
            
            # Update user info if changed
            await db.users.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "name": name,
                        "picture": picture,
                        "auth_provider": provider,
                        "email_verified": True
                    }
                }
            )
        
        # Create user session
        session_expires = datetime.now(timezone.utc) + timedelta(days=7)
        
        user_session = {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": session_expires,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.user_sessions.insert_one(user_session)
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            max_age=7 * 24 * 60 * 60,  # 7 days
            httponly=True,
            secure=True,
            samesite="none",
            path="/"
        )
        
        logger.info(f"{provider.capitalize()} session created for {email}")
        
        # Return user data
        user_data = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        return {
            "success": True,
            "user": UserResponse(
                user_id=user_data["user_id"],
                email=user_data["email"],
                name=user_data["name"],
                picture=user_data.get("picture"),
                auth_provider=user_data.get("auth_provider", provider),
                email_verified=user_data.get("email_verified", True)
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exchanging {provider} session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to exchange session: {str(e)}")

@router.get("/me")
async def get_current_user_oauth(request: Request):
    """
    Get current user from session token (cookie or header).
    """
    try:
        # Try cookie first
        session_token = request.cookies.get("session_token")
        
        # Fallback to Authorization header
        if not session_token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                session_token = auth_header[7:]
        
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Find session
        session = await db.user_sessions.find_one({"session_token": session_token})
        
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # Check expiry
        expires_at = session["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at < datetime.now(timezone.utc):
            # Delete expired session
            await db.user_sessions.delete_one({"session_token": session_token})
            raise HTTPException(status_code=401, detail="Session expired")
        
        # Get user
        user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            name=user.get("name", ""),
            picture=user.get("picture"),
            auth_provider=user.get("auth_provider", "email"),
            email_verified=user.get("email_verified", False)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current user: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user")

@router.post("/logout")
async def logout_oauth(request: Request, response: Response):
    """
    Logout user and clear session.
    """
    try:
        session_token = request.cookies.get("session_token")
        
        if session_token:
            # Delete session from database
            await db.user_sessions.delete_one({"session_token": session_token})
        
        # Clear cookie
        response.delete_cookie("session_token", path="/")
        
        return {"success": True, "message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        raise HTTPException(status_code=500, detail="Logout failed")
