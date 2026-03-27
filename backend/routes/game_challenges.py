"""
Game Challenge System - Bridge between P2P Chat and Gaming Empire
Allows users to challenge friends to games directly from chat
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
from uuid import uuid4

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Challenge Models
class ChallengeCreate(BaseModel):
    opponent_id: str
    game_type: str  # speed_dialer, duel, phish_finder
    wager_amount: Optional[int] = None  # Only for duel
    difficulty: Optional[str] = None  # Only for speed_dialer/duel
    chaos_mode: Optional[bool] = False
    message: Optional[str] = None  # Optional trash talk

class ChallengeAction(BaseModel):
    action: str  # accept or decline

# Challenge Endpoints
@router.post("/send")
async def send_challenge(
    challenge: ChallengeCreate,
    current_user = Depends(get_current_user)
):
    """
    Send a game challenge to a friend via chat.
    Creates both a challenge record and a system message in chat.
    """
    try:
        challenger_id = current_user["_id"]
        
        # Validate game type
        valid_games = ["speed_dialer", "duel", "phish_finder"]
        if challenge.game_type not in valid_games:
            raise HTTPException(status_code=400, detail="Invalid game type")
        
        # Get opponent info
        opponent = await db.users.find_one({"_id": challenge.opponent_id})
        if not opponent:
            raise HTTPException(status_code=404, detail="Opponent not found")
        
        # Check if they are friends
        friendship = await db.friendships.find_one({
            "$or": [
                {"user1_id": challenger_id, "user2_id": challenge.opponent_id},
                {"user1_id": challenge.opponent_id, "user2_id": challenger_id}
            ]
        })
        
        if not friendship:
            raise HTTPException(status_code=400, detail="You can only challenge friends")
        
        # For duels, validate wager
        if challenge.game_type == "duel":
            if not challenge.wager_amount:
                raise HTTPException(status_code=400, detail="Duel requires wager amount")
            
            if challenge.wager_amount < 10 or challenge.wager_amount > 1000:
                raise HTTPException(status_code=400, detail="Wager must be between 10-1000 XP")
            
            # Check if challenger has enough XP
            profile = await db.gamification_profiles.find_one({"user_id": challenger_id})
            if not profile or profile.get("total_points", 0) < challenge.wager_amount:
                raise HTTPException(status_code=400, detail="Insufficient XP for wager")
        
        # Create challenge
        challenge_doc = {
            "id": str(uuid4()),
            "challenger_id": challenger_id,
            "opponent_id": challenge.opponent_id,
            "game_type": challenge.game_type,
            "wager_amount": challenge.wager_amount,
            "difficulty": challenge.difficulty or "medium",
            "chaos_mode": challenge.chaos_mode,
            "message": challenge.message,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": None  # TODO: Add expiration
        }
        
        await db.game_challenges.insert_one(challenge_doc)
        
        # Create system message in chat
        game_names = {
            "speed_dialer": "Speed Dialer",
            "duel": "The Duel",
            "phish_finder": "Phish-Finder"
        }
        
        game_emojis = {
            "speed_dialer": "⚡",
            "duel": "⚔️",
            "phish_finder": "🧠"
        }
        
        game_name = game_names.get(challenge.game_type, "Game")
        game_emoji = game_emojis.get(challenge.game_type, "🎮")
        
        system_message_content = f"{game_emoji} **Challenge:** {game_name}"
        
        if challenge.game_type == "duel":
            system_message_content += f" • {challenge.wager_amount} XP wager"
        
        if challenge.difficulty:
            system_message_content += f" • {challenge.difficulty.capitalize()}"
        
        if challenge.chaos_mode:
            system_message_content += " • 🔥 Chaos Mode"
        
        if challenge.message:
            system_message_content += f"\n💬 \"{challenge.message}\""
        
        # Save system message
        system_msg = {
            "id": str(uuid4()),
            "sender_id": challenger_id,
            "receiver_id": challenge.opponent_id,
            "content": system_message_content,
            "type": "challenge",
            "challenge_id": challenge_doc["id"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "read": False,
            "reactions": []
        }
        
        await db.messages.insert_one(system_msg)
        
        # Send via WebSocket if opponent is online
        try:
            from websocket_manager import manager
            await manager.send_personal_message({
                "type": "new_challenge",
                "challenge": {
                    "id": challenge_doc["id"],
                    "game_type": challenge.game_type,
                    "game_name": game_name,
                    "game_emoji": game_emoji,
                    "wager_amount": challenge.wager_amount,
                    "difficulty": challenge.difficulty,
                    "chaos_mode": challenge.chaos_mode,
                    "message": challenge.message,
                    "challenger_id": challenger_id,
                    "challenger_email": current_user.get("email", "")
                },
                "message": system_msg
            }, challenge.opponent_id)
        except Exception as e:
            logger.error(f"Error sending WebSocket notification: {e}")
        
        logger.info(f"Challenge sent: {challenge_doc['id']} from {challenger_id} to {challenge.opponent_id}")
        
        return {
            "success": True,
            "challenge_id": challenge_doc["id"],
            "message": "Challenge sent!"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending challenge: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send challenge")

@router.post("/{challenge_id}/respond")
async def respond_to_challenge(
    challenge_id: str,
    action: ChallengeAction,
    current_user = Depends(get_current_user)
):
    """
    Accept or decline a game challenge.
    If accepted, creates the actual game session (duel, etc.)
    """
    try:
        user_id = current_user["_id"]
        
        # Get challenge
        challenge = await db.game_challenges.find_one({
            "id": challenge_id,
            "opponent_id": user_id,
            "status": "pending"
        })
        
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found or already responded")
        
        if action.action == "accept":
            # ACCEPT: Create the actual game session
            game_type = challenge["game_type"]
            
            if game_type == "duel":
                # Create duel via duel API
                from routes.duel import db as duel_db
                from routes.gamification import lock_xp
                
                # Lock both players' XP
                challenger_lock = await lock_xp(challenge["challenger_id"], challenge["wager_amount"])
                opponent_lock = await lock_xp(user_id, challenge["wager_amount"])
                
                if not challenger_lock or not opponent_lock:
                    # Refund if one failed
                    if challenger_lock:
                        from routes.gamification import unlock_xp
                        await unlock_xp(challenge["challenger_id"], challenge["wager_amount"])
                    
                    raise HTTPException(status_code=400, detail="Insufficient XP to accept challenge")
                
                # Create duel
                duel_doc = {
                    "id": str(uuid4()),
                    "challenger_id": challenge["challenger_id"],
                    "opponent_id": user_id,
                    "wager_amount": challenge["wager_amount"],
                    "game_type": "speed_dialer",
                    "difficulty": challenge["difficulty"],
                    "chaos_mode": challenge.get("chaos_mode", False),
                    "status": "active",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "started_at": datetime.now(timezone.utc).isoformat(),
                    "completed_at": None,
                    "challenger_phone": None,
                    "challenger_time": None,
                    "opponent_phone": None,
                    "opponent_time": None,
                    "winner_id": None
                }
                
                await db.duels.insert_one(duel_doc)
                
                game_session_id = duel_doc["id"]
                redirect_url = f"/games/duel/race/{game_session_id}"
            
            elif game_type == "speed_dialer":
                # For Speed Dialer, just redirect both to the game
                # No session needed since it's solo scoring
                game_session_id = None
                redirect_url = f"/games/speed-dialer"
            
            elif game_type == "phish_finder":
                # For Phish-Finder, redirect to game
                game_session_id = None
                redirect_url = f"/games/phish-finder"
            
            # Update challenge status
            await db.game_challenges.update_one(
                {"id": challenge_id},
                {
                    "$set": {
                        "status": "accepted",
                        "accepted_at": datetime.now(timezone.utc).isoformat(),
                        "game_session_id": game_session_id
                    }
                }
            )
            
            # Send acceptance message in chat
            acceptance_msg = {
                "id": str(uuid4()),
                "sender_id": user_id,
                "receiver_id": challenge["challenger_id"],
                "content": f"✅ Challenge accepted! Let's go! 🔥",
                "type": "challenge_accepted",
                "challenge_id": challenge_id,
                "redirect_url": redirect_url,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "read": False,
                "reactions": []
            }
            
            await db.messages.insert_one(acceptance_msg)
            
            # Notify challenger via WebSocket
            try:
                from websocket_manager import manager
                await manager.send_personal_message({
                    "type": "challenge_accepted",
                    "challenge_id": challenge_id,
                    "redirect_url": redirect_url,
                    "message": acceptance_msg
                }, challenge["challenger_id"])
            except Exception as e:
                logger.error(f"Error sending WebSocket notification: {e}")
            
            logger.info(f"Challenge accepted: {challenge_id}")
            
            return {
                "success": True,
                "action": "accepted",
                "redirect_url": redirect_url,
                "game_session_id": game_session_id
            }
        
        elif action.action == "decline":
            # DECLINE: Update status and notify
            await db.game_challenges.update_one(
                {"id": challenge_id},
                {
                    "$set": {
                        "status": "declined",
                        "declined_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            # Send decline message
            decline_msg = {
                "id": str(uuid4()),
                "sender_id": user_id,
                "receiver_id": challenge["challenger_id"],
                "content": "❌ Challenge declined.",
                "type": "challenge_declined",
                "challenge_id": challenge_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "read": False,
                "reactions": []
            }
            
            await db.messages.insert_one(decline_msg)
            
            # Notify challenger
            try:
                from websocket_manager import manager
                await manager.send_personal_message({
                    "type": "challenge_declined",
                    "challenge_id": challenge_id,
                    "message": decline_msg
                }, challenge["challenger_id"])
            except Exception as e:
                logger.error(f"Error sending WebSocket notification: {e}")
            
            logger.info(f"Challenge declined: {challenge_id}")
            
            return {
                "success": True,
                "action": "declined"
            }
        
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error responding to challenge: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to respond to challenge")

@router.get("/active")
async def get_active_challenges(current_user = Depends(get_current_user)):
    """
    Get all pending challenges (sent and received) for current user.
    """
    try:
        user_id = current_user["_id"]
        
        # Get sent challenges
        sent = await db.game_challenges.find({
            "challenger_id": user_id,
            "status": "pending"
        }, {"_id": 0}).to_list(100)
        
        # Get received challenges
        received = await db.game_challenges.find({
            "opponent_id": user_id,
            "status": "pending"
        }, {"_id": 0}).to_list(100)
        
        # Enrich with user info
        for challenge in sent:
            opponent = await db.users.find_one(
                {"_id": challenge["opponent_id"]},
                {"_id": 0, "email": 1, "client_id": 1}
            )
            challenge["opponent_email"] = opponent.get("email") if opponent else "Unknown"
            challenge["opponent_client_id"] = opponent.get("client_id") if opponent else ""
        
        for challenge in received:
            challenger = await db.users.find_one(
                {"_id": challenge["challenger_id"]},
                {"_id": 0, "email": 1, "client_id": 1}
            )
            challenge["challenger_email"] = challenger.get("email") if challenger else "Unknown"
            challenge["challenger_client_id"] = challenger.get("client_id") if challenger else ""
        
        return {
            "sent": sent,
            "received": received
        }
        
    except Exception as e:
        logger.error(f"Error getting active challenges: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get challenges")
