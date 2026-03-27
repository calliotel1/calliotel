from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import secrets
import string

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Referral rewards
NEW_USER_BONUS = 10.00  # $10 for new user with referral code
REFERRER_BONUS = 5.00   # $5 for referrer when referred user makes first purchase

def generate_referral_code(client_id: str) -> str:
    """Generate a unique referral code based on client ID"""
    # Use last 6 digits of client_id + random string
    random_part = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
    return f"{client_id[-6:]}{random_part}"

class ReferralStats(BaseModel):
    referral_code: str
    total_referrals: int
    total_earnings: float
    pending_referrals: int
    successful_referrals: int

class ReferredUser(BaseModel):
    email: str
    client_id: str
    joined_date: str
    status: str  # pending, completed
    reward_earned: float

class LeaderboardEntry(BaseModel):
    email: str
    client_id: str
    total_referrals: int
    total_earnings: float
    rank: int

@router.get("/my-code")
async def get_my_referral_code(current_user = Depends(get_current_user)):
    """
    Get user's referral code. Generate if doesn't exist.
    """
    try:
        referral_code = current_user.get("referral_code")
        
        if not referral_code:
            # Generate new referral code
            referral_code = generate_referral_code(current_user.get("client_id", ""))
            
            # Ensure uniqueness
            while await db.users.find_one({"referral_code": referral_code}):
                referral_code = generate_referral_code(current_user.get("client_id", ""))
            
            # Update user with referral code
            await db.users.update_one(
                {"_id": current_user["_id"]},
                {"$set": {"referral_code": referral_code}}
            )
        
        return {
            "referral_code": referral_code,
            "referral_link": f"https://calliotel.com/signup?ref={referral_code}"
        }
    except Exception as e:
        logger.error(f"Error getting referral code: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get referral code")

@router.get("/stats", response_model=ReferralStats)
async def get_referral_stats(current_user = Depends(get_current_user)):
    """
    Get user's referral statistics.
    """
    try:
        user_id = current_user["_id"]
        
        # Get all users referred by this user
        referred_users = await db.users.find(
            {"referred_by": user_id},
            {"_id": 0, "email": 1, "referral_status": 1}
        ).to_list(1000)
        
        total_referrals = len(referred_users)
        successful_referrals = sum(1 for u in referred_users if u.get("referral_status") == "completed")
        pending_referrals = total_referrals - successful_referrals
        
        # Calculate total earnings (referrer gets bonus when referred user makes first purchase)
        total_earnings = successful_referrals * REFERRER_BONUS
        
        referral_code = current_user.get("referral_code", "")
        if not referral_code:
            referral_code = generate_referral_code(current_user.get("client_id", ""))
            await db.users.update_one(
                {"_id": user_id},
                {"$set": {"referral_code": referral_code}}
            )
        
        return ReferralStats(
            referral_code=referral_code,
            total_referrals=total_referrals,
            total_earnings=total_earnings,
            pending_referrals=pending_referrals,
            successful_referrals=successful_referrals
        )
    except Exception as e:
        logger.error(f"Error getting referral stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get referral stats")

@router.get("/referred-users")
async def get_referred_users(current_user = Depends(get_current_user)):
    """
    Get list of users referred by current user.
    """
    try:
        user_id = current_user["_id"]
        
        referred_users = await db.users.find(
            {"referred_by": user_id},
            {"_id": 0, "email": 1, "client_id": 1, "created_at": 1, "referral_status": 1}
        ).to_list(1000)
        
        result = []
        for user in referred_users:
            status = user.get("referral_status", "pending")
            reward = REFERRER_BONUS if status == "completed" else 0.0
            
            result.append({
                "email": user["email"],
                "client_id": user.get("client_id", ""),
                "joined_date": user.get("created_at", ""),
                "status": status,
                "reward_earned": reward
            })
        
        return {"referred_users": result, "total": len(result)}
    except Exception as e:
        logger.error(f"Error getting referred users: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get referred users")

@router.get("/leaderboard")
async def get_referral_leaderboard(limit: int = 10):
    """
    Get top referrers leaderboard.
    """
    try:
        # Aggregate to count referrals per user
        pipeline = [
            {
                "$lookup": {
                    "from": "users",
                    "localField": "_id",
                    "foreignField": "referred_by",
                    "as": "referrals"
                }
            },
            {
                "$addFields": {
                    "total_referrals": {"$size": "$referrals"},
                    "successful_referrals": {
                        "$size": {
                            "$filter": {
                                "input": "$referrals",
                                "as": "ref",
                                "cond": {"$eq": ["$$ref.referral_status", "completed"]}
                            }
                        }
                    }
                }
            },
            {
                "$match": {
                    "total_referrals": {"$gt": 0}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "email": 1,
                    "client_id": 1,
                    "total_referrals": 1,
                    "total_earnings": {"$multiply": ["$successful_referrals", REFERRER_BONUS]}
                }
            },
            {
                "$sort": {"total_referrals": -1}
            },
            {
                "$limit": limit
            }
        ]
        
        leaderboard = await db.users.aggregate(pipeline).to_list(limit)
        
        # Add rank
        for i, entry in enumerate(leaderboard, 1):
            entry["rank"] = i
        
        return {"leaderboard": leaderboard}
    except Exception as e:
        logger.error(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get leaderboard")

@router.post("/apply-code")
async def apply_referral_code(referral_code: str, current_user = Depends(get_current_user)):
    """
    Apply a referral code to current user (if they haven't already).
    """
    try:
        user_id = current_user["_id"]
        
        # Check if user already has a referrer
        if current_user.get("referred_by"):
            raise HTTPException(status_code=400, detail="You have already used a referral code")
        
        # Find user with this referral code
        referrer = await db.users.find_one({"referral_code": referral_code})
        
        if not referrer:
            raise HTTPException(status_code=404, detail="Invalid referral code")
        
        if referrer["_id"] == user_id:
            raise HTTPException(status_code=400, detail="You cannot use your own referral code")
        
        # Update current user
        await db.users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "referred_by": referrer["_id"],
                    "referral_status": "pending"
                }
            }
        )
        
        # Give bonus to new user
        wallet = await db.wallets.find_one({"user_id": user_id})
        if wallet:
            new_balance = wallet["balance"] + NEW_USER_BONUS
            await db.wallets.update_one(
                {"user_id": user_id},
                {"$set": {"balance": new_balance}}
            )
            
            # Log transaction
            await db.transactions.insert_one({
                "user_id": user_id,
                "type": "credit",
                "amount": NEW_USER_BONUS,
                "description": f"Referral bonus from {referrer.get('client_id', 'user')}",
                "balance_after": new_balance,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        logger.info(f"Referral code {referral_code} applied for user {user_id}")
        
        return {
            "success": True,
            "message": f"Referral code applied! ${NEW_USER_BONUS} bonus added to your wallet",
            "bonus_amount": NEW_USER_BONUS
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying referral code: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to apply referral code")

async def mark_referral_completed(user_id: str):
    """
    Mark referral as completed and reward referrer.
    Call this when referred user makes their first purchase.
    """
    try:
        user = await db.users.find_one({"_id": user_id})
        
        if not user or not user.get("referred_by"):
            return
        
        if user.get("referral_status") == "completed":
            return  # Already rewarded
        
        # Mark as completed
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"referral_status": "completed"}}
        )
        
        # Reward referrer
        referrer_id = user["referred_by"]
        referrer_wallet = await db.wallets.find_one({"user_id": referrer_id})
        
        if referrer_wallet:
            new_balance = referrer_wallet["balance"] + REFERRER_BONUS
            await db.wallets.update_one(
                {"user_id": referrer_id},
                {"$set": {"balance": new_balance}}
            )
            
            # Log transaction
            await db.transactions.insert_one({
                "user_id": referrer_id,
                "type": "credit",
                "amount": REFERRER_BONUS,
                "description": f"Referral reward - {user.get('email', 'user')} made first purchase",
                "balance_after": new_balance,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            logger.info(f"Referral completed: {user_id} → Rewarded {referrer_id} with ${REFERRER_BONUS}")
        
        return True
    except Exception as e:
        logger.error(f"Error marking referral completed: {str(e)}")
        return False
