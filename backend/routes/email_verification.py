from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import logging
import os
import secrets
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import requests

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'support@calliotel.com')
FRONTEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://calliotel.com').replace('/api', '')

class VerifyEmailRequest(BaseModel):
    token: str

def send_verification_email(email: str, token: str, name: str = "User"):
    """
    Send verification email via Resend
    """
    try:
        if not RESEND_API_KEY:
            logger.error("RESEND_API_KEY not configured")
            return False
        
        verification_url = f"{FRONTEND_URL}/verify-email?token={token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f97316 0%, #9333ea 100%); 
                           padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .header h1 {{ color: white; margin: 0; font-size: 28px; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 15px 30px; background: #f97316; 
                          color: white; text-decoration: none; border-radius: 5px; 
                          font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Verify Your Email</h1>
                </div>
                <div class="content">
                    <h2>Hello {name}!</h2>
                    <p>Welcome to <strong>Calliotel</strong>! 🎉</p>
                    <p>To complete your registration and start using our virtual phone services, 
                       please verify your email address by clicking the button below:</p>
                    <p style="text-align: center;">
                        <a href="{verification_url}" class="button">
                            Verify Email Address
                        </a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="background: #e5e7eb; padding: 10px; border-radius: 5px; 
                             word-break: break-all; font-size: 12px;">
                        {verification_url}
                    </p>
                    <p><strong>This link expires in 24 hours.</strong></p>
                    <p>If you didn't create an account with Calliotel, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>© 2026 Calliotel. All rights reserved.</p>
                    <p>Need help? Contact us at support@calliotel.com</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Send email via Resend
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "from": f"Calliotel <{FROM_EMAIL}>",
                "to": [email],
                "subject": "Verify Your Calliotel Account",
                "html": html_content
            },
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            logger.info(f"Verification email sent to {email}")
            return True
        else:
            logger.error(f"Failed to send email: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending verification email: {str(e)}")
        return False

@router.post("/send-verification")
async def send_verification(email: str, background_tasks: BackgroundTasks):
    """
    Send verification email to user
    """
    try:
        # Find user
        user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.get("email_verified"):
            return {"success": True, "message": "Email already verified"}
        
        # Generate verification token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        
        # Store token
        await db.verification_tokens.update_one(
            {"email": email},
            {
                "$set": {
                    "token": token,
                    "expires_at": expires_at,
                    "created_at": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
        
        # Send email in background
        background_tasks.add_task(
            send_verification_email,
            email,
            token,
            user.get("name", "User")
        )
        
        return {
            "success": True,
            "message": "Verification email sent"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send_verification: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send verification email")

@router.post("/verify")
async def verify_email(request: VerifyEmailRequest):
    """
    Verify email using token
    """
    try:
        # Find token
        token_doc = await db.verification_tokens.find_one({"token": request.token})
        
        if not token_doc:
            raise HTTPException(status_code=400, detail="Invalid verification token")
        
        # Check expiry
        expires_at = token_doc["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Verification token expired")
        
        # Update user
        email = token_doc["email"]
        result = await db.users.update_one(
            {"email": email},
            {"$set": {"email_verified": True}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Delete token
        await db.verification_tokens.delete_one({"token": request.token})
        
        logger.info(f"Email verified for {email}")
        
        return {
            "success": True,
            "message": "Email verified successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying email: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify email")

@router.post("/resend")
async def resend_verification(email: str, background_tasks: BackgroundTasks):
    """
    Resend verification email with rate limiting
    """
    try:
        # Check if user exists
        user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.get("email_verified"):
            return {"success": True, "message": "Email already verified"}
        
        # Check for recent resend attempts (rate limiting - 1 email per minute)
        existing_token = await db.verification_tokens.find_one({"email": email})
        if existing_token:
            created_at = existing_token.get("created_at")
            if created_at:
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at)
                if created_at.tzinfo is None:
                    created_at = created_at.replace(tzinfo=timezone.utc)
                
                time_since_last = datetime.now(timezone.utc) - created_at
                if time_since_last < timedelta(minutes=1):
                    remaining_seconds = int(60 - time_since_last.total_seconds())
                    raise HTTPException(
                        status_code=429,
                        detail=f"Please wait {remaining_seconds} seconds before requesting another email"
                    )
        
        # Call send_verification
        return await send_verification(email, background_tasks)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resending verification: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to resend verification email")

@router.get("/status/{email}")
async def check_verification_status(email: str):
    """
    Check if email is verified
    """
    try:
        user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "email": email,
            "verified": user.get("email_verified", False)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking verification status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check status")
