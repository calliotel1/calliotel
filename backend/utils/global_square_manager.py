"""
Global Square WebSocket Handler
Real-time group chat with tier-based permissions
"""

from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from typing import Dict, Set
from datetime import datetime, timezone, timedelta
import json
import logging
from uuid import uuid4
import os
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Active connections: user_id -> WebSocket
active_connections: Dict[str, WebSocket] = {}

# Cooldown tracking: user_id -> last_message_time
message_cooldowns: Dict[str, datetime] = {}

# Violation tracking: user_id -> violation_count
violation_tracker: Dict[str, int] = {}

# Shadow banned users: user_id -> ban_expiry
shadow_banned: Dict[str, datetime] = {}

# Timeout tracking: user_id -> timeout_expiry
timed_out_users: Dict[str, datetime] = {}

# Tier-based cooldown durations (seconds)
TIER_COOLDOWNS = {
    "Bronze Rookie": 5,
    "Silver Challenger": 3,
    "Gold Warrior": 2,
    "Platinum Elite": 1,
    "Divine Legend": 0.5,
    "The Architect": 0
}

def get_tier_name(total_xp: int, is_admin: bool = False) -> str:
    """Get tier name based on XP"""
    if is_admin:
        return "The Architect"
    elif total_xp < 100:
        return "Bronze Rookie"
    elif total_xp < 500:
        return "Silver Challenger"
    elif total_xp < 1000:
        return "Gold Warrior"
    elif total_xp < 2500:
        return "Platinum Elite"
    else:
        return "Divine Legend"

def get_tier_color(tier_name: str) -> str:
    """Get tier color for message styling"""
    tier_colors = {
        "Bronze Rookie": "#CD7F32",
        "Silver Challenger": "#C0C0C0",
        "Gold Warrior": "#FFD700",
        "Platinum Elite": "#E5E4E2",
        "Divine Legend": "#A855F7",
        "The Architect": "linear-gradient(45deg, #667eea, #764ba2, #f093fb)"
    }
    return tier_colors.get(tier_name, "#808080")

async def connect_to_global_square(websocket: WebSocket, user_id: str):
    """Connect user to Global Square"""
    await websocket.accept()
    active_connections[user_id] = websocket
    logger.info(f"User {user_id} connected to Global Square. Total: {len(active_connections)}")
    
    # Send recent messages (last 100)
    await send_recent_messages(websocket)
    
    # Get user tier for entry announcement
    try:
        user = await db.users.find_one({"_id": user_id})
        profile = await db.gamification_profiles.find_one({"user_id": user_id}, {"_id": 0})
        
        if user and profile:
            total_xp = profile.get("total_points", 0)
            is_admin = user.get("is_admin", False)
            tier_name = get_tier_name(total_xp, is_admin)
            
            # Tier-based entry announcements
            if tier_name == "The Architect":
                await broadcast_system_message("👑 THE ARCHITECT HAS ENTERED THE SQUARE")
            elif tier_name == "Divine Legend":
                await broadcast_system_message("🟣 A Divine Legend has entered the Square")
            elif tier_name in ["Gold Warrior", "Platinum Elite"]:
                await broadcast_system_message("⚔️ A warrior has entered the Square")
            # Bronze/Silver: Silent entry
    except Exception as e:
        logger.error(f"Error announcing entry: {str(e)}")
        # Don't fail connection if announcement fails
        await broadcast_system_message("🟢 A warrior has entered the Square")

async def disconnect_from_global_square(user_id: str):
    """Disconnect user from Global Square"""
    if user_id in active_connections:
        del active_connections[user_id]
        logger.info(f"User {user_id} disconnected from Global Square. Total: {len(active_connections)}")
        
        # Broadcast leave announcement
        await broadcast_system_message("🔴 A warrior has left the Square")

async def send_recent_messages(websocket: WebSocket):
    """Send last 100 messages to newly connected user"""
    try:
        messages = await db.global_messages.find(
            {},
            {"_id": 0}
        ).sort("timestamp", -1).limit(100).to_list(100)
        
        # Reverse to chronological order
        messages.reverse()
        
        await websocket.send_json({
            "type": "message_history",
            "messages": messages
        })
    except Exception as e:
        logger.error(f"Error sending recent messages: {str(e)}")

async def handle_message(websocket: WebSocket, user_id: str, data: dict):
    """Handle incoming message from user"""
    try:
        # Check if user is timed out
        if user_id in timed_out_users:
            if datetime.now(timezone.utc) < timed_out_users[user_id]:
                # Still timed out - send notification
                time_remaining = (timed_out_users[user_id] - datetime.now(timezone.utc)).total_seconds()
                await websocket.send_json({
                    "type": "timed_out",
                    "time_remaining": int(time_remaining),
                    "message": f"You have been silenced by the Alpha. {int(time_remaining)}s remaining."
                })
                logger.info(f"Timed out user {user_id} tried to send message")
                return
            else:
                # Timeout expired, remove
                del timed_out_users[user_id]
        
        # Check if user is shadow banned
        if user_id in shadow_banned:
            if datetime.now(timezone.utc) < shadow_banned[user_id]:
                # Still banned - fake success but don't broadcast
                await websocket.send_json({
                    "type": "message_sent",
                    "success": True
                })
                logger.info(f"Shadow banned user {user_id} tried to send message")
                return
            else:
                # Ban expired, remove
                del shadow_banned[user_id]
        
        # Get user data
        user = await db.users.find_one({"_id": user_id})
        if not user:
            await websocket.send_json({
                "type": "error",
                "message": "User not found"
            })
            return
        
        # Get user's gamification profile for tier
        profile = await db.gamification_profiles.find_one({"user_id": user_id}, {"_id": 0})
        total_xp = profile.get("total_points", 0) if profile else 0
        is_admin = user.get("is_admin", False)
        
        tier_name = get_tier_name(total_xp, is_admin)
        tier_cooldown = TIER_COOLDOWNS.get(tier_name, 5)
        
        # Check cooldown
        if user_id in message_cooldowns:
            last_msg_time = message_cooldowns[user_id]
            time_since_last = (datetime.now(timezone.utc) - last_msg_time).total_seconds()
            
            if time_since_last < tier_cooldown:
                # Cooldown violation
                await handle_cooldown_violation(websocket, user_id, tier_cooldown - time_since_last)
                return
        
        # Create message
        message = {
            "id": str(uuid4()),
            "user_id": user_id,
            "email": user["email"],
            "full_name": user.get("full_name"),
            "profile_picture": user.get("profile_picture"),
            "content": data.get("content", ""),
            "tier": {
                "name": tier_name,
                "color": get_tier_color(tier_name),
                "emoji": get_tier_emoji(tier_name)
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": "user_message"
        }
        
        # Save to database
        await db.global_messages.insert_one(message.copy())
        
        # Update cooldown
        message_cooldowns[user_id] = datetime.now(timezone.utc)
        
        # Broadcast to all users
        await broadcast_message(message)
        
        # Confirm to sender
        await websocket.send_json({
            "type": "message_sent",
            "success": True,
            "message_id": message["id"]
        })
        
    except Exception as e:
        logger.error(f"Error handling message: {str(e)}")
        await websocket.send_json({
            "type": "error",
            "message": "Failed to send message"
        })

async def handle_cooldown_violation(websocket: WebSocket, user_id: str, time_remaining: float):
    """Handle cooldown bypass attempt"""
    # Increment violation count
    violation_tracker[user_id] = violation_tracker.get(user_id, 0) + 1
    
    violations = violation_tracker[user_id]
    
    # Escalating penalties
    if violations >= 5:
        # Shadow ban for 24 hours
        shadow_banned[user_id] = datetime.now(timezone.utc) + timedelta(hours=24)
        await websocket.send_json({
            "type": "shadow_banned",
            "message": "Too many violations. You have been shadow banned for 24 hours."
        })
        logger.warning(f"User {user_id} shadow banned (24h) after {violations} violations")
    elif violations >= 3:
        # Auto-mute for 10 minutes
        shadow_banned[user_id] = datetime.now(timezone.utc) + timedelta(minutes=10)
        await websocket.send_json({
            "type": "auto_muted",
            "message": "Too many violations. You have been muted for 10 minutes.",
            "duration": 600
        })
        logger.warning(f"User {user_id} auto-muted (10m) after {violations} violations")
    else:
        # Just send cooldown warning
        await websocket.send_json({
            "type": "cooldown_active",
            "time_remaining": round(time_remaining, 1),
            "violation_count": violations
        })

async def broadcast_message(message: dict):
    """Broadcast message to all connected users"""
    disconnected = []
    
    for user_id, websocket in active_connections.items():
        try:
            await websocket.send_json({
                "type": "new_message",
                "message": message
            })
        except Exception as e:
            logger.error(f"Error broadcasting to {user_id}: {str(e)}")
            disconnected.append(user_id)
    
    # Clean up disconnected users
    for user_id in disconnected:
        await disconnect_from_global_square(user_id)

async def broadcast_system_message(content: str):
    """Broadcast system announcement"""
    message = {
        "id": str(uuid4()),
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "type": "system_message"
    }
    
    await broadcast_message(message)

async def broadcast_void_pulse(content: str, event_type: str = "rank_change"):
    """
    Broadcast Void Pulse - purple pulse animation for major events
    event_type: 'rank_change', 'architect_victory', 'legendary_achievement'
    """
    message = {
        "id": str(uuid4()),
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "type": "void_broadcast",
        "event_type": event_type
    }
    
    await broadcast_message(message)
    logger.info(f"⚡ Void Broadcast: {content}")


def get_tier_emoji(tier_name: str) -> str:
    """Get tier emoji"""
    emojis = {
        "Bronze Rookie": "🟤",
        "Silver Challenger": "⚪",
        "Gold Warrior": "🟡",
        "Platinum Elite": "🔵",
        "Divine Legend": "🟣",
        "The Architect": "👑"
    }
    return emojis.get(tier_name, "⚫")

async def handle_timeout_command(websocket: WebSocket, issuer_user_id: str, data: dict):
    """
    Handle timeout command from #1 ranked player (The Alpha's Gavel)
    """
    try:
        # Get issuer's data
        issuer = await db.users.find_one({"_id": issuer_user_id})
        if not issuer:
            await websocket.send_json({
                "type": "error",
                "message": "User not found"
            })
            return
        
        # Get issuer's rank and tier
        from utils.leaderboard_service import get_overall_leaderboard
        leaderboard = await get_overall_leaderboard(limit=1)
        
        if not leaderboard or leaderboard[0]["user_id"] != issuer_user_id:
            # Not #1 ranked player
            is_admin = issuer.get("is_admin", False)
            if not is_admin:
                await websocket.send_json({
                    "type": "error",
                    "message": "Only the #1 ranked player can use the Alpha's Gavel"
                })
                return
            # Admin (Architect) has override - can timeout anyone
            issuer_tier = "The Architect"
        else:
            issuer_tier = leaderboard[0]["tier"]["name"]
        
        # Get target user
        target_user_id = data.get("target_user_id")
        if not target_user_id:
            await websocket.send_json({
                "type": "error",
                "message": "Target user ID required"
            })
            return
        
        # Cannot timeout yourself
        if target_user_id == issuer_user_id:
            await websocket.send_json({
                "type": "error",
                "message": "Cannot timeout yourself"
            })
            return
        
        # Get target's tier
        target = await db.users.find_one({"_id": target_user_id})
        if not target:
            await websocket.send_json({
                "type": "error",
                "message": "Target user not found"
            })
            return
        
        target_profile = await db.gamification_profiles.find_one({"user_id": target_user_id}, {"_id": 0})
        target_xp = target_profile.get("total_points", 0) if target_profile else 0
        target_is_admin = target.get("is_admin", False)
        target_tier = get_tier_name(target_xp, target_is_admin)
        
        # The Architect can silence anyone, #1 can silence Bronze only
        if issuer_tier != "The Architect" and target_tier != "Bronze Rookie":
            await websocket.send_json({
                "type": "error",
                "message": "You can only timeout Bronze Rookie tier users. The Architect can silence any tier."
            })
            return
        
        # Timeout duration: 60s for Bronze
        timeout_duration = 60
        timeout_expiry = datetime.now(timezone.utc) + timedelta(seconds=timeout_duration)
        
        # Apply timeout
        timed_out_users[target_user_id] = timeout_expiry
        
        logger.warning(f"User {target_user_id} ({target_tier}) timed out for {timeout_duration}s by {issuer_user_id} ({issuer_tier})")
        
        # Notify issuer
        await websocket.send_json({
            "type": "timeout_issued",
            "success": True,
            "target_user_id": target_user_id,
            "duration": timeout_duration,
            "message": f"User has been silenced for {timeout_duration} seconds"
        })
        
        # Notify target if connected
        if target_user_id in active_connections:
            target_ws = active_connections[target_user_id]
            await target_ws.send_json({
                "type": "you_are_silenced",
                "duration": timeout_duration,
                "issuer_tier": issuer_tier,
                "message": f"You have been silenced by {issuer_tier} for {timeout_duration} seconds"
            })
        
        # Broadcast system message
        await broadcast_system_message(
            f"⚖️ {issuer_tier} has silenced a {target_tier} warrior ({timeout_duration}s)"
        )
        
    except Exception as e:
        logger.error(f"Error handling timeout command: {str(e)}")
        await websocket.send_json({
            "type": "error",
            "message": "Failed to execute timeout"
        })

# Reset violation tracker every hour
async def reset_violation_tracker():
    """Reset violation counts (should be called hourly)"""
    violation_tracker.clear()
    logger.info("Violation tracker reset")
