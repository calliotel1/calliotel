"""
Co-Op Stack Game - Multiplayer Room Management
PICO PARK-inspired cooperative stacking game
"""

from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
from uuid import uuid4
import json

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Active game rooms (in-memory for real-time performance)
active_rooms: Dict[str, dict] = {}

# WebSocket connections per room
room_connections: Dict[str, List[WebSocket]] = {}

# Models
class CreateRoomRequest(BaseModel):
    max_players: int = 4
    level_id: int = 1
    xp_pot: int = 100

class JoinRoomRequest(BaseModel):
    room_id: str

class PlayerPosition(BaseModel):
    x: float
    y: float
    velocity_x: float = 0
    velocity_y: float = 0
    is_grounded: bool = False

class GameState(BaseModel):
    room_id: str
    level_id: int
    players: Dict[str, dict]  # player_id -> {x, y, velocity_x, velocity_y}
    key_collected: bool = False
    goal_reached: bool = False
    start_time: Optional[str] = None
    end_time: Optional[str] = None

# Create Co-Op Room
@router.post("/room/create")
async def create_coop_room(
    request: CreateRoomRequest,
    current_user = Depends(get_current_user)
):
    """
    Create a new co-op game room.
    Returns room_id for other players to join.
    """
    try:
        room_id = str(uuid4())[:8].upper()  # Short room code (uppercase)
        user_id = current_user["_id"]
        
        # Get user info
        user = await db.users.find_one({"_id": user_id}, {"_id": 0, "email": 1, "full_name": 1})
        
        # Create room document
        room_doc = {
            "room_id": room_id,
            "host_id": user_id,
            "host_email": user.get("email"),
            "max_players": request.max_players,
            "level_id": request.level_id,
            "xp_pot": request.xp_pot,
            "status": "waiting",  # waiting, playing, completed
            "players": [
                {
                    "user_id": user_id,
                    "email": user.get("email"),
                    "full_name": user.get("full_name"),
                    "joined_at": datetime.now(timezone.utc).isoformat()
                }
            ],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "started_at": None,
            "completed_at": None,
            "completion_time": None
        }
        
        # Save to MongoDB
        await db.coop_rooms.insert_one(room_doc)
        
        # Initialize in-memory game state
        active_rooms[room_id] = {
            "level_id": request.level_id,
            "players": {
                user_id: {
                    "x": 100,
                    "y": 400,
                    "velocity_x": 0,
                    "velocity_y": 0,
                    "is_grounded": False,
                    "email": user.get("email")
                }
            },
            "key_collected": False,
            "key_position": {"x": 700, "y": 100},  # High ledge
            "goal_reached": False,
            "start_time": None
        }
        
        room_connections[room_id] = []
        
        logger.info(f"Co-op room created: {room_id} by {user_id}")
        
        return {
            "success": True,
            "room_id": room_id,
            "host_id": user_id,
            "max_players": request.max_players,
            "level_id": request.level_id,
            "message": f"Room {room_id} created! Share this code with friends."
        }
        
    except Exception as e:
        logger.error(f"Error creating co-op room: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create room")

# Join Co-Op Room
@router.post("/room/join")
async def join_coop_room(
    request: JoinRoomRequest,
    current_user = Depends(get_current_user)
):
    """
    Join an existing co-op room.
    """
    try:
        room_id = request.room_id.upper()
        user_id = current_user["_id"]
        
        # Get room from DB
        room = await db.coop_rooms.find_one({"room_id": room_id})
        
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        if room["status"] != "waiting":
            raise HTTPException(status_code=400, detail="Game already started")
        
        if len(room["players"]) >= room["max_players"]:
            raise HTTPException(status_code=400, detail="Room is full")
        
        # Check if already in room
        if any(p["user_id"] == user_id for p in room["players"]):
            return {
                "success": True,
                "room_id": room_id,
                "message": "Already in room"
            }
        
        # Get user info
        user = await db.users.find_one({"_id": user_id}, {"_id": 0, "email": 1, "full_name": 1})
        
        # Add player to room
        player_doc = {
            "user_id": user_id,
            "email": user.get("email"),
            "full_name": user.get("full_name"),
            "joined_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.coop_rooms.update_one(
            {"room_id": room_id},
            {"$push": {"players": player_doc}}
        )
        
        # Add to in-memory game state
        if room_id in active_rooms:
            player_count = len(active_rooms[room_id]["players"])
            spawn_x = 100 + (player_count * 80)  # Spread players out
            
            active_rooms[room_id]["players"][user_id] = {
                "x": spawn_x,
                "y": 400,
                "velocity_x": 0,
                "velocity_y": 0,
                "is_grounded": False,
                "email": user.get("email")
            }
        
        logger.info(f"Player {user_id} joined room {room_id}")
        
        return {
            "success": True,
            "room_id": room_id,
            "player_count": len(room["players"]) + 1,
            "max_players": room["max_players"],
            "message": "Joined room successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error joining room: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to join room")

# Get Room Info
@router.get("/room/{room_id}")
async def get_room_info(
    room_id: str,
    current_user = Depends(get_current_user)
):
    """
    Get current room information.
    """
    try:
        room = await db.coop_rooms.find_one({"room_id": room_id.upper()}, {"_id": 0})
        
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        return room
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting room info: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get room info")

# WebSocket for Real-Time Game State
@router.websocket("/ws/coop/{room_id}")
async def coop_game_websocket(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for real-time multiplayer game state synchronization.
    """
    await websocket.accept()
    user_id = None
    
    try:
        # Get user_id from initial message
        initial_data = await websocket.receive_text()
        initial_msg = json.loads(initial_data)
        user_id = initial_msg.get("user_id")
        
        if not user_id:
            await websocket.close(code=1008, reason="No user_id provided")
            return
        
        # Add to room connections
        if room_id not in room_connections:
            room_connections[room_id] = []
        
        room_connections[room_id].append(websocket)
        
        logger.info(f"Player {user_id} connected to room {room_id} via WebSocket")
        
        # Send current game state to new player
        if room_id in active_rooms:
            await websocket.send_json({
                "type": "game_state",
                "state": active_rooms[room_id]
            })
        
        # Broadcast player joined
        await broadcast_to_room(room_id, {
            "type": "player_joined",
            "user_id": user_id,
            "player_count": len(room_connections[room_id])
        }, exclude=websocket)
        
        # Listen for messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            await handle_game_message(room_id, user_id, message, websocket)
            
    except WebSocketDisconnect:
        logger.info(f"Player {user_id} disconnected from room {room_id}")
        
        # Remove from connections
        if room_id in room_connections:
            room_connections[room_id].remove(websocket)
        
        # Broadcast player left
        await broadcast_to_room(room_id, {
            "type": "player_left",
            "user_id": user_id
        })
        
    except Exception as e:
        logger.error(f"WebSocket error in room {room_id}: {str(e)}")
        await websocket.close()

async def handle_game_message(room_id: str, user_id: str, message: dict, sender_ws: WebSocket):
    """
    Handle incoming game messages and broadcast to other players.
    """
    msg_type = message.get("type")
    
    if msg_type == "player_move":
        # Update player position in game state
        if room_id in active_rooms and user_id in active_rooms[room_id]["players"]:
            position = message.get("position", {})
            active_rooms[room_id]["players"][user_id].update(position)
            
            # Broadcast to other players
            await broadcast_to_room(room_id, {
                "type": "player_position",
                "user_id": user_id,
                "position": position
            }, exclude=sender_ws)
    
    elif msg_type == "key_collected":
        # Mark key as collected
        if room_id in active_rooms:
            active_rooms[room_id]["key_collected"] = True
            
            await broadcast_to_room(room_id, {
                "type": "key_collected",
                "user_id": user_id
            })
    
    elif msg_type == "goal_reached":
        # Game completed!
        if room_id in active_rooms:
            active_rooms[room_id]["goal_reached"] = True
            
            # Calculate completion time
            start_time = active_rooms[room_id].get("start_time")
            if start_time:
                completion_time = (datetime.now(timezone.utc) - datetime.fromisoformat(start_time)).total_seconds()
            else:
                completion_time = 0
            
            # Update room in DB
            await db.coop_rooms.update_one(
                {"room_id": room_id},
                {
                    "$set": {
                        "status": "completed",
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                        "completion_time": completion_time
                    }
                }
            )
            
            # Distribute XP
            room = await db.coop_rooms.find_one({"room_id": room_id})
            xp_per_player = room["xp_pot"] // len(room["players"])
            
            for player in room["players"]:
                await db.gamification_profiles.update_one(
                    {"user_id": player["user_id"]},
                    {"$inc": {"total_points": xp_per_player}}
                )
            
            await broadcast_to_room(room_id, {
                "type": "game_completed",
                "completion_time": completion_time,
                "xp_earned": xp_per_player
            })
    
    elif msg_type == "start_game":
        # Host starts the game
        if room_id in active_rooms:
            active_rooms[room_id]["start_time"] = datetime.now(timezone.utc).isoformat()
            
            await db.coop_rooms.update_one(
                {"room_id": room_id},
                {"$set": {"status": "playing", "started_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            await broadcast_to_room(room_id, {
                "type": "game_started"
            })

async def broadcast_to_room(room_id: str, message: dict, exclude: WebSocket = None):
    """
    Broadcast message to all players in a room.
    """
    if room_id not in room_connections:
        return
    
    for ws in room_connections[room_id]:
        if ws != exclude:
            try:
                await ws.send_json(message)
            except:
                pass  # Connection closed

# Get Active Rooms (for lobby browser)
@router.get("/rooms/active")
async def get_active_rooms(current_user = Depends(get_current_user)):
    """
    Get list of active rooms that can be joined.
    """
    try:
        rooms = await db.coop_rooms.find(
            {"status": "waiting"},
            {"_id": 0}
        ).sort("created_at", -1).limit(20).to_list(20)
        
        return {
            "rooms": rooms,
            "count": len(rooms)
        }
        
    except Exception as e:
        logger.error(f"Error getting active rooms: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get rooms")
