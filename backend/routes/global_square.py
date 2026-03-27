"""
Global Square API Routes
WebSocket endpoint for real-time group chat
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from routes.auth import get_current_user
import logging
import json
import sys
sys.path.append('/app/backend')
from utils.global_square_manager import (
    connect_to_global_square,
    disconnect_from_global_square,
    handle_message
)

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws/global-square")
async def global_square_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for Global Square real-time chat
    """
    # Accept connection first
    await websocket.accept()
    
    user_id = None
    
    try:
        # Get user credentials from first message
        auth_data = await websocket.receive_json()
        
        # Simple token validation (you can enhance this)
        token = auth_data.get("token")
        if not token:
            await websocket.send_json({
                "type": "error",
                "message": "Authentication required"
            })
            await websocket.close()
            return
        
        # Extract user_id from token (simplified - use proper JWT decode in production)
        # For now, expect auth_data to include user_id
        user_id = auth_data.get("user_id")
        
        if not user_id:
            await websocket.send_json({
                "type": "error",
                "message": "Invalid authentication"
            })
            await websocket.close()
            return
        
        # Connect to Global Square
        await connect_to_global_square(websocket, user_id)
        
        # Listen for messages
        while True:
            data = await websocket.receive_json()
            
            # Handle different message types
            if data.get("type") == "send_message":
                await handle_message(websocket, user_id, data)
            elif data.get("type") == "timeout_user":
                # Import timeout handler
                from utils.global_square_manager import handle_timeout_command
                await handle_timeout_command(websocket, user_id, data)
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            else:
                logger.warning(f"Unknown message type: {data.get('type')}")
        
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        if user_id:
            await disconnect_from_global_square(user_id)

@router.get("/pinned")
async def get_pinned_message(current_user = Depends(get_current_user)):
    """
    Get currently pinned message in Global Square
    """
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        # Get pinned message
        pinned = await db.global_square_pins.find_one(
            {"active": True},
            {"_id": 0}
        )
        
        return {
            "success": True,
            "pinned_message": pinned
        }
        
    except Exception as e:
        logger.error(f"Error getting pinned message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get pinned message")

@router.post("/pin")
async def pin_message(
    message_id: str,
    current_user = Depends(get_current_user)
):
    """
    Pin a message to Global Square (Top 3 only)
    """
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        from datetime import datetime, timezone, timedelta
        import os
        import sys
        sys.path.append('/app/backend')
        from utils.leaderboard_service import get_overall_leaderboard
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        user_id = current_user["_id"]
        
        # Get leaderboard to check if user is in Top 3
        leaderboard = await get_overall_leaderboard(limit=3)
        
        top_3_ids = [player["user_id"] for player in leaderboard]
        
        if user_id not in top_3_ids:
            raise HTTPException(
                status_code=403,
                detail="Only Top 3 players can pin messages"
            )
        
        # Get user's rank
        user_rank = next((i + 1 for i, p in enumerate(leaderboard) if p["user_id"] == user_id), None)
        
        # Check if user is #1 Architect for permanent pin
        is_architect = current_user.get("is_admin", False) or leaderboard[0]["tier"]["name"] == "The Architect"
        is_number_one = user_rank == 1
        
        permanent_pin = is_number_one and is_architect
        
        # Get message to pin
        message = await db.global_messages.find_one({"id": message_id}, {"_id": 0})
        
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Deactivate old pins
        await db.global_square_pins.update_many(
            {"active": True},
            {"$set": {"active": False}}
        )
        
        # Create new pin
        pin = {
            "message_id": message_id,
            "message": message,
            "pinned_by": user_id,
            "pinned_by_rank": user_rank,
            "permanent": permanent_pin,
            "pinned_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": None if permanent_pin else (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            "active": True
        }
        
        await db.global_square_pins.insert_one(pin)
        
        logger.info(f"Message {message_id} pinned by #{user_rank} (permanent: {permanent_pin})")
        
        return {
            "success": True,
            "message": "Message pinned",
            "permanent": permanent_pin
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error pinning message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to pin message")
