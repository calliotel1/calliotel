from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
import logging
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
import os
import secrets
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import string

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

# Frontend URL
FRONTEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000')

security = HTTPBearer()

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    birthday: str  # Required: YYYY-MM-DD format
    referral_code: Optional[str] = None
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v
    
    @validator('birthday')
    def validate_birthday(cls, v):
        from datetime import datetime
        try:
            birthday = datetime.fromisoformat(v)
            today = datetime.now()
            age = today.year - birthday.year
            if birthday > today:
                raise ValueError('Birthday cannot be in the future')
            if age < 13:
                raise ValueError('You must be at least 13 years old to sign up')
            if age > 120:
                raise ValueError('Invalid birth date')
            return v
        except ValueError as e:
            if 'Invalid' in str(e) or 'format' in str(e):
                raise ValueError('Birthday must be in YYYY-MM-DD format')
            raise

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    created_at: str
    email_verified: bool
    client_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ResendVerificationRequest(BaseModel):
    email: EmailStr

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

import secrets
import string

def generate_client_id() -> str:
    """Generate a unique client ID like CL12345678"""
    random_part = ''.join(secrets.choice(string.digits) for _ in range(8))
    return f"CL{random_part}"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        
        user = await db.users.find_one({"_id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.exceptions.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup, background_tasks: BackgroundTasks):
    try:
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_id = user_data.email
        hashed_password = hash_password(user_data.password)
        
        # Generate unique client ID
        client_id = generate_client_id()
        
        # Ensure client_id is unique
        while await db.users.find_one({"client_id": client_id}):
            client_id = generate_client_id()
        
        # Check if referral code provided
        referred_by = None
        if user_data.referral_code:
            referrer = await db.users.find_one({"referral_code": user_data.referral_code})
            if referrer:
                referred_by = referrer["_id"]
        
        user_doc = {
            "_id": user_id,
            "email": user_data.email,
            "password": hashed_password,
            "full_name": user_data.full_name,
            "birthday": user_data.birthday,  # Add birthday field
            "client_id": client_id,
            "auth_provider": "email",
            "email_verified": False,  # Will be verified via email
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        # Add referral info if valid
        if referred_by:
            user_doc["referred_by"] = referred_by
            user_doc["referral_status"] = "pending"
        
        await db.users.insert_one(user_doc)
        access_token = create_access_token(data={"sub": user_id})
        
        # Create wallet with zero balance (no welcome bonus)
        # Users can add credits via payment methods
        initial_balance = 0.00
        referral_bonus = 10.00 if referred_by else 0.00
        total_balance = initial_balance + referral_bonus
        
        await db.wallets.insert_one({
            "user_id": user_id,
            "balance": total_balance,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Log referral bonus transaction if applicable
        if referred_by:
            await db.transactions.insert_one({
                "user_id": user_id,
                "type": "credit",
                "amount": referral_bonus,
                "description": "Referral bonus",
                "balance_after": referral_bonus,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Send verification email in background
        from routes.email_verification import send_verification_email
        verification_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        
        # Store verification token
        await db.verification_tokens.insert_one({
            "email": user_data.email,
            "token": verification_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Send email in background
        background_tasks.add_task(
            send_verification_email,
            user_data.email,
            verification_token,
            user_data.full_name or "User"
        )
        
        logger.info(f"New user registered: {user_data.email} (Client ID: {client_id})")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user_id,
                email=user_data.email,
                full_name=user_data.full_name,
                created_at=user_doc["created_at"],
                email_verified=False,
                client_id=client_id
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create account")
        
        logger.info(f"New user registered: {user_data.email} (Client ID: {client_id})")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user_id,
                email=user_data.email,
                full_name=user_data.full_name,
                created_at=user_doc["created_at"],
                email_verified=True,
                client_id=client_id
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create account")

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    try:
        user = await db.users.find_one({"email": user_data.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if not verify_password(user_data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Generate client_id for existing users who don't have one
        if "client_id" not in user:
            client_id = generate_client_id()
            while await db.users.find_one({"client_id": client_id}):
                client_id = generate_client_id()
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"client_id": client_id}}
            )
            user["client_id"] = client_id
        
        access_token = create_access_token(data={"sub": user["_id"]})
        
        logger.info(f"User logged in: {user_data.email}")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user["_id"],
                email=user["email"],
                full_name=user.get("full_name"),
                created_at=user["created_at"],
                email_verified=user.get("email_verified", False),
                client_id=user.get("client_id")
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to login")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.get("/verify-email/{token}")
async def verify_email(token: str):
    try:
        user = await db.users.find_one({"verification_token": token})
        
        if not user:
            raise HTTPException(status_code=400, detail="Invalid verification token")
        
        # Check if token expired
        if datetime.fromisoformat(user["verification_token_expires"]) < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Verification token has expired")
        
        # Update user as verified
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "email_verified": True,
                    "updated_at": datetime.utcnow().isoformat()
                },
                "$unset": {"verification_token": "", "verification_token_expires": ""}
            }
        )
        
        # Send welcome email
        email_service.send_welcome_email(user["email"], user.get("full_name"))
        
        logger.info(f"Email verified: {user['email']}")
        
        return {"message": "Email verified successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        raise HTTPException(status_code=500, detail="Verification failed")

@router.post("/resend-verification")
async def resend_verification(request: ResendVerificationRequest):
    try:
        user = await db.users.find_one({"email": request.email})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.get("email_verified"):
            raise HTTPException(status_code=400, detail="Email already verified")
        
        # Generate new token
        verification_token = generate_verification_token()
        
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "verification_token": verification_token,
                    "verification_token_expires": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        # Send verification email
        email_sent = email_service.send_verification_email(
            to_email=request.email,
            verification_token=verification_token,
            frontend_url=FRONTEND_URL
        )
        
        if not email_sent:
            raise HTTPException(status_code=500, detail="Failed to send verification email")
        
        logger.info(f"Verification email resent to {request.email}")
        
        return {"message": "Verification email sent"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resend verification error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to resend verification")

@router.get("/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_user)):
    return UserResponse(
        id=current_user["_id"],
        email=current_user["email"],
        full_name=current_user.get("full_name"),
        created_at=current_user["created_at"],
        email_verified=current_user.get("email_verified", False),
        client_id=current_user.get("client_id")
    )

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}