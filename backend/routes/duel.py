"""
Duel System API
1v1 XP Wagering for Speed Dialer Game
Players challenge each other, lock XP in escrow, race, winner takes all
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from routes.gamification import award_xp, lock_xp, unlock_xp, clear_locked_xp, award_achievement
from motor.motor_asyncio import AsyncIOMotorClient
import os
from uuid import uuid4

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Duel Status
STATUS_PENDING = "pending"
STATUS_ACTIVE = "active"
STATUS_COMPLETED = "completed"
STATUS_CANCELLED = "cancelled"

# Game Types
GAME_TYPE_SPEED_DIALER = "speed_dialer"

# Pydantic Models
class DuelCreate(BaseModel):
    wager_amount: int
    difficulty: str  # easy, medium, hard
    chaos_mode: bool = False

class DuelSubmit(BaseModel):
    phone_number: str
    time_taken: float

class DuelResponse(BaseModel):
    id: str
    challenger_id: str
    challenger_email: str
    opponent_id: Optional[str]
    opponent_email: Optional[str]
    wager_amount: int
    game_type: str
    difficulty: str
    chaos_mode: bool
    status: str
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]
    winner_id: Optional[str]
    winner_email: Optional[str]

class DuelResult(BaseModel):
    duel_id: str
    winner_id: str
    winner_email: str
    loser_id: str
    loser_email: str
    pot_amount: int
    winner_time: float
    loser_time: float
    winner_xp_gained: int
    winner_new_total: int

# Helper Functions
async def get_user_email(user_id: str) -> str:
    """Get user email from user_id"""
    user = await db.users.find_one({"_id": user_id}, {"_id": 0, "email": 1})
    return user.get("email", "Unknown") if user else "Unknown"

async def check_duel_achievements(user_id: str):
    """Check and award Duel-specific achievements"""
    try:
        # Count duel wins
        wins = await db.duels.count_documents({
            "winner_id": user_id,
            "status": STATUS_COMPLETED
        })
        
        if wins == 1:
            await award_achievement(user_id, "duel_first_win")
        elif wins == 10:
            await award_achievement(user_id, "duel_warrior")
        elif wins == 50:
            await award_achievement(user_id, "duel_champion")
        elif wins == 100:
            await award_achievement(user_id, "duel_legend")
        
        # Check for big pot wins (500+ XP)
        big_win = await db.duels.find_one({
            "winner_id": user_id,
            "wager_amount": {"$gte": 250},
            "status": STATUS_COMPLETED
        })
        
        if big_win:
            await award_achievement(user_id, "high_roller")
        
    except Exception as e:
        logger.error(f"Error checking duel achievements: {str(e)}")

# API Endpoints
@router.post("/create", response_model=DuelResponse)
async def create_duel(
    duel_create: DuelCreate,
    current_user = Depends(get_current_user)
):
    """
    Create a new public duel challenge.
    Locks challenger's XP in escrow.
    """
    try:
        user_id = current_user["_id"]
        
        # Validate wager amount
        if duel_create.wager_amount < 10:
            raise HTTPException(status_code=400, detail="Minimum wager is 10 XP")
        
        if duel_create.wager_amount > 1000:
            raise HTTPException(status_code=400, detail="Maximum wager is 1000 XP")
        
        # Validate difficulty
        if duel_create.difficulty not in ["easy", "medium", "hard"]:
            raise HTTPException(status_code=400, detail="Invalid difficulty")
        
        # Check if user has enough XP
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        if not profile or profile.get("total_points", 0) < duel_create.wager_amount:
            raise HTTPException(status_code=400, detail="Insufficient XP")
        
        # Lock the XP
        lock_success = await lock_xp(user_id, duel_create.wager_amount)
        if not lock_success:
            raise HTTPException(status_code=400, detail="Failed to lock XP")
        
        # Create duel
        duel = {
            "id": str(uuid4()),
            "challenger_id": user_id,
            "opponent_id": None,
            "wager_amount": duel_create.wager_amount,
            "game_type": GAME_TYPE_SPEED_DIALER,
            "difficulty": duel_create.difficulty,
            "chaos_mode": duel_create.chaos_mode,
            "status": STATUS_PENDING,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "started_at": None,
            "completed_at": None,
            "challenger_phone": None,
            "challenger_time": None,
            "opponent_phone": None,
            "opponent_time": None,
            "winner_id": None
        }
        
        await db.duels.insert_one(duel)
        
        logger.info(f"Duel created: {duel['id']} by {user_id} for {duel_create.wager_amount} XP")
        
        challenger_email = await get_user_email(user_id)
        
        return DuelResponse(
            id=duel["id"],
            challenger_id=user_id,
            challenger_email=challenger_email,
            opponent_id=None,
            opponent_email=None,
            wager_amount=duel_create.wager_amount,
            game_type=GAME_TYPE_SPEED_DIALER,
            difficulty=duel_create.difficulty,
            chaos_mode=duel_create.chaos_mode,
            status=STATUS_PENDING,
            created_at=duel["created_at"],
            started_at=None,
            completed_at=None,
            winner_id=None,
            winner_email=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating duel: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create duel")

@router.post("/accept/{duel_id}")
async def accept_duel(
    duel_id: str,
    current_user = Depends(get_current_user)
):
    """
    Accept a pending duel challenge.
    Locks opponent's XP and activates the duel.
    """
    try:
        user_id = current_user["_id"]
        
        # Get duel
        duel = await db.duels.find_one({"id": duel_id})
        
        if not duel:
            raise HTTPException(status_code=404, detail="Duel not found")
        
        if duel["status"] != STATUS_PENDING:
            raise HTTPException(status_code=400, detail="Duel is not pending")
        
        if duel["challenger_id"] == user_id:
            raise HTTPException(status_code=400, detail="Cannot accept your own duel")
        
        # Check if user has enough XP
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        if not profile or profile.get("total_points", 0) < duel["wager_amount"]:
            raise HTTPException(status_code=400, detail="Insufficient XP")
        
        # Lock the opponent's XP
        lock_success = await lock_xp(user_id, duel["wager_amount"])
        if not lock_success:
            raise HTTPException(status_code=400, detail="Failed to lock XP")
        
        # Update duel to active
        await db.duels.update_one(
            {"id": duel_id},
            {
                "$set": {
                    "opponent_id": user_id,
                    "status": STATUS_ACTIVE,
                    "started_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"Duel accepted: {duel_id} by {user_id}")
        
        # Send SMS notification to challenger that duel was accepted
        try:
            await send_duel_challenge_sms(
                challenger_id=user_id,
                opponent_id=duel["challenger_id"],
                duel_type="Speed Dialer"
            )
        except Exception as e:
            logger.warning(f"Failed to send SMS notification: {str(e)}")
        
        return {
            "success": True,
            "message": "Duel accepted! Race starts now!",
            "duel_id": duel_id,
            "difficulty": duel["difficulty"],
            "chaos_mode": duel["chaos_mode"],
            "pot": duel["wager_amount"] * 2
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting duel: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to accept duel")

@router.post("/submit/{duel_id}", response_model=DuelResult)
async def submit_duel_result(
    duel_id: str,
    result: DuelSubmit,
    current_user = Depends(get_current_user)
):
    """
    Submit your Speed Dialer result for an active duel.
    When both players submit, determine winner and distribute XP.
    """
    try:
        user_id = current_user["_id"]
        
        # Get duel
        duel = await db.duels.find_one({"id": duel_id})
        
        if not duel:
            raise HTTPException(status_code=404, detail="Duel not found")
        
        if duel["status"] != STATUS_ACTIVE:
            raise HTTPException(status_code=400, detail="Duel is not active")
        
        # Determine if user is challenger or opponent
        is_challenger = duel["challenger_id"] == user_id
        is_opponent = duel["opponent_id"] == user_id
        
        if not is_challenger and not is_opponent:
            raise HTTPException(status_code=403, detail="You are not part of this duel")
        
        # Update with user's result
        if is_challenger:
            if duel.get("challenger_time") is not None:
                raise HTTPException(status_code=400, detail="You already submitted your result")
            
            await db.duels.update_one(
                {"id": duel_id},
                {
                    "$set": {
                        "challenger_phone": result.phone_number,
                        "challenger_time": result.time_taken
                    }
                }
            )
        else:  # is_opponent
            if duel.get("opponent_time") is not None:
                raise HTTPException(status_code=400, detail="You already submitted your result")
            
            await db.duels.update_one(
                {"id": duel_id},
                {
                    "$set": {
                        "opponent_phone": result.phone_number,
                        "opponent_time": result.time_taken
                    }
                }
            )
        
        # Refresh duel data
        duel = await db.duels.find_one({"id": duel_id})
        
        # Check if both players have submitted
        if duel.get("challenger_time") is not None and duel.get("opponent_time") is not None:
            # Determine winner (lower time wins)
            challenger_time = duel["challenger_time"]
            opponent_time = duel["opponent_time"]
            
            if challenger_time < opponent_time:
                winner_id = duel["challenger_id"]
                loser_id = duel["opponent_id"]
                winner_time = challenger_time
                loser_time = opponent_time
            else:
                winner_id = duel["opponent_id"]
                loser_id = duel["challenger_id"]
                winner_time = opponent_time
                loser_time = challenger_time
            
            # Calculate pot
            pot = duel["wager_amount"] * 2
            
            # Clear loser's locked XP (they lose it)
            await clear_locked_xp(loser_id, duel["wager_amount"])
            
            # Unlock winner's locked XP
            await unlock_xp(winner_id, duel["wager_amount"])
            
            # Award winner the pot
            xp_result = await award_xp(winner_id, pot, f"Duel victory vs {await get_user_email(loser_id)}")
            
            # Send SMS notifications to both players about the result
            try:
                winner_user = await db.users.find_one({"_id": winner_id}, {"_id": 0})
                loser_user = await db.users.find_one({"_id": loser_id}, {"_id": 0})
                
                if winner_user and loser_user:
                    # Notify winner
                    await send_duel_result_sms(
                        user_id=winner_user["id"],
                        result="victory",
                        opponent_name=loser_user.get("username", "opponent")
                    )
                    
                    # Notify loser
                    await send_duel_result_sms(
                        user_id=loser_user["id"],
                        result="defeat",
                        opponent_name=winner_user.get("username", "opponent")
                    )
            except Exception as e:
                logger.warning(f"Failed to send duel result SMS: {str(e)}")
            
            # Check if winner is Architect tier and broadcast to Global Square
            winner_user = await db.users.find_one({"_id": winner_id})
            winner_profile = await db.gamification_profiles.find_one({"user_id": winner_id}, {"_id": 0})
            
            if winner_user and winner_profile:
                winner_total_xp = winner_profile.get("total_points", 0)
                winner_is_admin = winner_user.get("is_admin", False)
                
                # Check if Architect tier (admin or 2500+ XP)
                if winner_is_admin or winner_total_xp >= 2500:
                    # Trigger Void Broadcast
                    try:
                        from utils.global_square_manager import broadcast_void_pulse
                        winner_name = winner_user.get("full_name") or winner_user["email"].split('@')[0]
                        await broadcast_void_pulse(
                            f"👑 {winner_name} (The Architect) has crushed their opponent in the Arena! (+{pot} XP)",
                            event_type="architect_victory"
                        )
                    except Exception as e:
                        logger.error(f"Failed to broadcast Architect victory: {str(e)}")
            
            # Update duel status
            await db.duels.update_one(
                {"id": duel_id},
                {
                    "$set": {
                        "status": STATUS_COMPLETED,
                        "winner_id": winner_id,
                        "completed_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            # Check for achievements
            await check_duel_achievements(winner_id)
            
            # Get emails
            winner_email = await get_user_email(winner_id)
            loser_email = await get_user_email(loser_id)
            
            # **AUTO-TAUNT SYSTEM** - Trigger psychological warfare
            await send_auto_taunt(winner_id, loser_id, duel_id, "duel")
            
            logger.info(f"Duel completed: {duel_id}, Winner: {winner_id}, Pot: {pot} XP")
            
            # POST RESULT TO CHAT if this was a challenge-based duel
            try:
                challenge = await db.game_challenges.find_one({"game_session_id": duel_id})
                if challenge:
                    # Create result message for chat
                    result_message = {
                        "id": str(uuid4()),
                        "sender_id": winner_id,
                        "receiver_id": loser_id,
                        "content": f"🔥 {winner_email} defeated {loser_email} in The Duel!\n⚔️ Winner: {winner_time:.2f}s | Loser: {loser_time:.2f}s\n💰 +{pot} XP to the victor!",
                        "type": "game_result",
                        "game_type": "duel",
                        "game_session_id": duel_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "read": False,
                        "reactions": []
                    }
                    await db.messages.insert_one(result_message)
                    
                    # Send via WebSocket
                    try:
                        from websocket_manager import manager
                        await manager.send_personal_message({
                            "type": "game_result",
                            "message": result_message
                        }, loser_id)
                        await manager.send_personal_message({
                            "type": "game_result",
                            "message": result_message
                        }, winner_id)
                    except Exception as ws_error:
                        logger.error(f"Error sending game result via WebSocket: {ws_error}")
            except Exception as chat_error:
                logger.error(f"Error posting duel result to chat: {chat_error}")
            
            return DuelResult(
                duel_id=duel_id,
                winner_id=winner_id,
                winner_email=winner_email,
                loser_id=loser_id,
                loser_email=loser_email,
                pot_amount=pot,
                winner_time=winner_time,
                loser_time=loser_time,
                winner_xp_gained=pot,
                winner_new_total=xp_result["new_total"]
            )
        else:
            # Still waiting for other player
            return {
                "success": True,
                "message": "Result submitted. Waiting for opponent...",
                "duel_id": duel_id
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting duel result: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit result")

@router.get("/feed")
async def get_duel_feed(
    status: str = "all",
    limit: int = 50
):
    """
    Get public duel feed.
    Shows pending (open) and recent completed duels.
    """
    try:
        # Build filter
        match_filter = {}
        if status == "pending":
            match_filter["status"] = STATUS_PENDING
        elif status == "completed":
            match_filter["status"] = STATUS_COMPLETED
        elif status == "active":
            match_filter["status"] = STATUS_ACTIVE
        elif status != "all":
            raise HTTPException(status_code=400, detail="Invalid status filter")
        
        # Get duels
        duels = await db.duels.find(
            match_filter,
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Enrich with user emails
        for duel in duels:
            duel["challenger_email"] = await get_user_email(duel["challenger_id"])
            if duel.get("opponent_id"):
                duel["opponent_email"] = await get_user_email(duel["opponent_id"])
            if duel.get("winner_id"):
                duel["winner_email"] = await get_user_email(duel["winner_id"])
        
        return {
            "duels": duels,
            "count": len(duels)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting duel feed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get duel feed")

@router.get("/active")
async def get_active_duels(current_user = Depends(get_current_user)):
    """
    Get current user's active duels (pending challenges or active races).
    """
    try:
        user_id = current_user["_id"]
        
        # Find duels where user is challenger or opponent
        duels = await db.duels.find(
            {
                "$or": [
                    {"challenger_id": user_id},
                    {"opponent_id": user_id}
                ],
                "status": {"$in": [STATUS_PENDING, STATUS_ACTIVE]}
            },
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        # Enrich with emails
        for duel in duels:
            duel["challenger_email"] = await get_user_email(duel["challenger_id"])
            if duel.get("opponent_id"):
                duel["opponent_email"] = await get_user_email(duel["opponent_id"])
        
        return {
            "duels": duels,
            "count": len(duels)
        }
        
    except Exception as e:
        logger.error(f"Error getting active duels: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get active duels")

@router.post("/cancel/{duel_id}")
async def cancel_duel(
    duel_id: str,
    current_user = Depends(get_current_user)
):
    """
    Cancel a pending duel and refund locked XP.
    Only challenger can cancel, and only if still pending.
    """
    try:
        user_id = current_user["_id"]
        
        # Get duel
        duel = await db.duels.find_one({"id": duel_id})
        
        if not duel:
            raise HTTPException(status_code=404, detail="Duel not found")
        
        if duel["challenger_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only challenger can cancel")
        
        if duel["status"] != STATUS_PENDING:
            raise HTTPException(status_code=400, detail="Can only cancel pending duels")
        
        # Refund locked XP
        await unlock_xp(user_id, duel["wager_amount"])
        
        # Update duel status
        await db.duels.update_one(
            {"id": duel_id},
            {
                "$set": {
                    "status": STATUS_CANCELLED,
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"Duel cancelled: {duel_id} by {user_id}")
        
        return {
            "success": True,
            "message": "Duel cancelled and XP refunded"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling duel: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel duel")

@router.get("/stats")
async def get_duel_stats(current_user = Depends(get_current_user)):
    """
    Get user's duel statistics.
    """
    try:
        user_id = current_user["_id"]
        
        # Count wins
        wins = await db.duels.count_documents({
            "winner_id": user_id,
            "status": STATUS_COMPLETED
        })
        
        # Count losses
        losses = await db.duels.count_documents({
            "$or": [
                {"challenger_id": user_id},
                {"opponent_id": user_id}
            ],
            "winner_id": {"$ne": user_id},
            "status": STATUS_COMPLETED
        })
        
        # Calculate total XP won
        won_duels = await db.duels.find({
            "winner_id": user_id,
            "status": STATUS_COMPLETED
        }, {"_id": 0, "wager_amount": 1}).to_list(1000)
        
        total_xp_won = sum(d["wager_amount"] * 2 for d in won_duels)
        
        # Calculate total XP lost
        lost_duels = await db.duels.find({
            "$or": [
                {"challenger_id": user_id},
                {"opponent_id": user_id}
            ],
            "winner_id": {"$ne": user_id},
            "status": STATUS_COMPLETED
        }, {"_id": 0, "wager_amount": 1}).to_list(1000)
        
        total_xp_lost = sum(d["wager_amount"] for d in lost_duels)
        
        # Win rate
        total_duels = wins + losses
        win_rate = (wins / total_duels * 100) if total_duels > 0 else 0
        
        return {
            "wins": wins,
            "losses": losses,
            "total_duels": total_duels,
            "win_rate": round(win_rate, 1),
            "total_xp_won": total_xp_won,
            "total_xp_lost": total_xp_lost,
            "net_xp": total_xp_won - total_xp_lost
        }
        
    except Exception as e:
        logger.error(f"Error getting duel stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get duel stats")


async def send_auto_taunt(winner_id: str, loser_id: str, game_session_id: str, game_type: str):
    """
    AUTO-TAUNT SYSTEM - Psychological Warfare Engine
    Sends automated victory taunt from winner to loser if enabled.
    Dual-Strike: Chat message + Full-screen Combat Card modal trigger
    """
    try:
        # Get winner's settings and profile
        winner = await db.users.find_one({"_id": winner_id})
        if not winner:
            return
        
        # Check if auto-taunt is enabled
        if not winner.get("auto_taunt_enabled", False):
            return
        
        # Get winner's gamification profile for tier
        winner_profile = await db.gamification_profiles.find_one({"user_id": winner_id}, {"_id": 0})
        winner_xp = winner_profile.get("total_points", 0) if winner_profile else 0
        is_admin = winner.get("is_admin", False)
        
        # Import taunt generator
        import sys
        sys.path.append('/app/backend')
        from utils.taunt_generator import get_tier_name, generate_taunt
        
        winner_tier = get_tier_name(winner_xp, is_admin)
        taunt_style = winner.get("taunt_style", "honorable")
        custom_message = winner.get("custom_taunt_message", "")
        
        # Generate taunt message
        taunt_text = generate_taunt(winner_tier, taunt_style, custom_message)
        
        # **STRIKE 2: Full-Screen Combat Card Trigger** (FIRST - Maximum Impact)
        # Send special notification for Combat Card modal
        taunt_trigger = {
            "id": str(uuid4()),
            "type": "taunt_modal_trigger",
            "winner_id": winner_id,
            "loser_id": loser_id,
            "winner_tier": winner_tier,
            "taunt_style": taunt_style,
            "taunt_text": taunt_text,  # None for silence mode
            "game_type": game_type,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Store trigger in notifications collection for loser
        await db.notifications.insert_one({
            **taunt_trigger,
            "user_id": loser_id,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Send via WebSocket (PRIORITY EXECUTION)
        try:
            from websocket_manager import manager
            await manager.send_personal_message(taunt_trigger, loser_id)
        except Exception as ws_error:
            logger.warning(f"WebSocket taunt trigger failed: {ws_error}")
        
        # **STRIKE 1: Chat Message Injection** (SECOND - Permanent Record)
        # They see this AFTER the Void releases them
        if taunt_text:
            taunt_message = {
                "id": str(uuid4()),
                "sender_id": winner_id,
                "receiver_id": loser_id,
                "content": taunt_text,
                "type": "auto_taunt",
                "game_type": game_type,
                "game_session_id": game_session_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "read": False,
                "reactions": []
            }
            await db.messages.insert_one(taunt_message)
            
            # Send via WebSocket for real-time delivery
            try:
                from websocket_manager import manager
                await manager.send_personal_message(taunt_message, loser_id)
            except Exception as ws_error:
                logger.warning(f"WebSocket taunt delivery failed: {ws_error}")
        
        logger.info(f"Auto-taunt sent: {winner_id} → {loser_id}, Style: {taunt_style} (SHATTER PROTOCOL)")

        
    except Exception as e:
        logger.error(f"Error sending auto-taunt: {str(e)}")
        # Don't raise - taunt is non-critical, game result already processed
