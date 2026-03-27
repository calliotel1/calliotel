from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import jwt
from websocket_manager import manager
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Import gamification functions
async def award_xp_to_user(user_id: str, xp: int, reason: str):
    """Helper to award XP - imports dynamically to avoid circular imports"""
    try:
        from routes.gamification import award_xp
        result = await award_xp(user_id, xp, reason)
        return result
    except Exception as e:
        logger.error(f"Error awarding XP: {e}")
        return {"xp_gained": 0, "new_total": 0, "level_up": False}

async def update_user_stat(user_id: str, stat_name: str, increment: int = 1):
    """Helper to update stats - imports dynamically to avoid circular imports"""
    try:
        from routes.gamification import update_stat
        await update_stat(user_id, stat_name, increment)
    except Exception as e:
        logger.error(f"Error updating stat: {e}")

# Models
class FriendRequestCreate(BaseModel):
    receiver_client_id: str

class FriendRequestAction(BaseModel):
    action: str  # accept or reject

class MessageCreate(BaseModel):
    receiver_id: str
    content: str
    type: str = "text"  # text, sticker

class SearchUserRequest(BaseModel):
    query: str  # client_id or email

# Friend Request Endpoints
@router.post("/friend-request")
async def send_friend_request(request: FriendRequestCreate, current_user = Depends(get_current_user)):
    """
    Send a friend request to another user by their Client ID.
    """
    try:
        sender_id = current_user["_id"]
        
        # Find receiver by client_id
        receiver = await db.users.find_one({"client_id": request.receiver_client_id})
        
        if not receiver:
            raise HTTPException(status_code=404, detail="User not found with this Client ID")
        
        receiver_id = receiver["_id"]
        
        if sender_id == receiver_id:
            raise HTTPException(status_code=400, detail="You cannot send a friend request to yourself")
        
        # Check if already friends
        existing_friendship = await db.friendships.find_one({
            "$or": [
                {"user1_id": sender_id, "user2_id": receiver_id},
                {"user1_id": receiver_id, "user2_id": sender_id}
            ]
        })
        
        if existing_friendship:
            raise HTTPException(status_code=400, detail="You are already friends with this user")
        
        # Check if friend request already exists
        existing_request = await db.friend_requests.find_one({
            "$or": [
                {"sender_id": sender_id, "receiver_id": receiver_id, "status": "pending"},
                {"sender_id": receiver_id, "receiver_id": sender_id, "status": "pending"}
            ]
        })
        
        if existing_request:
            raise HTTPException(status_code=400, detail="Friend request already exists")
        
        # Create friend request
        request_doc = {
            "id": str(uuid.uuid4()),
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.friend_requests.insert_one(request_doc)
        
        return {
            "success": True,
            "message": f"Friend request sent to {receiver.get('email', 'user')}",
            "request_id": request_doc["id"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending friend request: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send friend request")

@router.get("/friend-requests")
async def get_friend_requests(current_user = Depends(get_current_user)):
    """
    Get all pending friend requests for current user (both sent and received).
    """
    try:
        user_id = current_user["_id"]
        
        # Get received requests
        received_requests = await db.friend_requests.find({
            "receiver_id": user_id,
            "status": "pending"
        }).to_list(100)
        
        # Get sent requests
        sent_requests = await db.friend_requests.find({
            "sender_id": user_id,
            "status": "pending"
        }).limit(100).to_list(100)
        
        # OPTIMIZATION: Batch fetch all users to avoid N+1 queries
        # Extract unique sender and receiver IDs
        sender_ids = list(set(req["sender_id"] for req in received_requests))
        receiver_ids = list(set(req["receiver_id"] for req in sent_requests))
        all_user_ids = list(set(sender_ids + receiver_ids))
        
        # Fetch all users in one query
        if all_user_ids:
            users = await db.users.find(
                {"_id": {"$in": all_user_ids}},
                {"_id": 1, "email": 1, "client_id": 1, "full_name": 1}
            ).limit(len(all_user_ids)).to_list(len(all_user_ids))
            
            # Create user lookup dictionary
            user_lookup = {user["_id"]: user for user in users}
        else:
            user_lookup = {}
        
        # Populate received requests with user info (using lookup, no DB queries)
        received_with_info = []
        for req in received_requests:
            sender = user_lookup.get(req["sender_id"])
            if sender:
                received_with_info.append({
                    "id": req["id"],
                    "sender": {k: v for k, v in sender.items() if k != "_id"},  # Remove _id
                    "created_at": req["created_at"]
                })
        
        # Populate sent requests with user info (using lookup, no DB queries)
        sent_with_info = []
        for req in sent_requests:
            receiver = user_lookup.get(req["receiver_id"])
            if receiver:
                sent_with_info.append({
                    "id": req["id"],
                    "receiver": {k: v for k, v in receiver.items() if k != "_id"},  # Remove _id
                    "created_at": req["created_at"]
                })
        
        return {
            "received": received_with_info,
            "sent": sent_with_info
        }
    except Exception as e:
        logger.error(f"Error getting friend requests: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get friend requests")

@router.put("/friend-request/{request_id}")
async def handle_friend_request(request_id: str, action: FriendRequestAction, current_user = Depends(get_current_user)):
    """
    Accept or reject a friend request.
    """
    try:
        user_id = current_user["_id"]
        
        # Get friend request
        friend_request = await db.friend_requests.find_one({
            "id": request_id,
            "receiver_id": user_id,
            "status": "pending"
        })
        
        if not friend_request:
            raise HTTPException(status_code=404, detail="Friend request not found")
        
        if action.action == "accept":
            # Create friendship
            friendship = {
                "id": str(uuid.uuid4()),
                "user1_id": friend_request["sender_id"],
                "user2_id": user_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.friendships.insert_one(friendship)
            
            # Award XP for both users (5 XP each for making a friend)
            asyncio.create_task(award_xp_to_user(friend_request["sender_id"], 5, "friend_added"))
            asyncio.create_task(award_xp_to_user(user_id, 5, "friend_added"))
            
            # Update friends count stat
            asyncio.create_task(update_user_stat(friend_request["sender_id"], "friends_count", 1))
            asyncio.create_task(update_user_stat(user_id, "friends_count", 1))
            
            # Update request status
            await db.friend_requests.update_one(
                {"id": request_id},
                {"$set": {"status": "accepted"}}
            )
            
            return {"success": True, "message": "Friend request accepted"}
        
        elif action.action == "reject":
            # Update request status
            await db.friend_requests.update_one(
                {"id": request_id},
                {"$set": {"status": "rejected"}}
            )
            
            return {"success": True, "message": "Friend request rejected"}
        
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Use 'accept' or 'reject'")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling friend request: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to handle friend request")

@router.get("/friends")
async def get_friends(current_user = Depends(get_current_user)):
    """
    Get list of all friends.
    """
    try:
        user_id = current_user["_id"]
        
        # Get friendships
        friendships = await db.friendships.find({
            "$or": [
                {"user1_id": user_id},
                {"user2_id": user_id}
            ]
        }).to_list(1000)
        
        # BATCH FETCH: Get all friend IDs first, then fetch all friend data in one query
        friend_ids = []
        for friendship in friendships:
            friend_id = friendship["user1_id"] if friendship["user2_id"] == user_id else friendship["user2_id"]
            friend_ids.append(friend_id)
        
        # Fetch all friends data in ONE query (no N+1!)
        if not friend_ids:
            return {"success": True, "friends": []}
        
        friends_data_cursor = db.users.find(
            {"_id": {"$in": friend_ids}},
            {"_id": 1, "name": 1, "email": 1, "client_id": 1, "full_name": 1}
        )
        friends_data_list = await friends_data_cursor.to_list(1000)
        
        # Create lookup dict for fast access
        friends_lookup = {f["_id"]: f for f in friends_data_list}
        
        # Build friends list using lookup dict
        friends = []
        for friendship in friendships:
            friend_id = friendship["user1_id"] if friendship["user2_id"] == user_id else friendship["user2_id"]
            friend = friends_lookup.get(friend_id)
            if friend:
                friends.append({
                    "user_id": friend_id,
                    "name": friend.get("name", "Unknown"),
                    "email": friend.get("email", ""),
                    "client_id": friend.get("client_id", ""),
                    "friendship_id": friendship["id"],
                    "full_name": friend.get("full_name", "")
                })
        
        return {
            "success": True,
            "friends": friends
        }
    except Exception as e:
        logger.error(f"Error getting friends: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get friends")

# Email Invitation Feature
@router.post("/invite-by-email")
async def invite_by_email(request: dict, current_user = Depends(get_current_user)):
    """
    Send an email invitation to join Calliotel and connect on chat.
    For users who don't have an account yet.
    """
    try:
        email = request.get("email", "").strip().lower()
        message = request.get("message", "")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": email})
        
        if existing_user:
            return {
                "success": False,
                "message": "This user already has an account. Search for them by email to send a friend request!",
                "user_exists": True
            }
        
        # Send invitation email using Resend
        from email_service import send_email
        
        sender_name = current_user.get("name", "A Calliotel user")
        invite_link = f"{os.environ.get('FRONTEND_URL', 'https://calliotel.com')}/signup?ref={current_user.get('client_id', '')}"
        
        email_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7C3AED;">You're Invited to Calliotel!</h2>
            <p>Hi there!</p>
            <p><strong>{sender_name}</strong> has invited you to join Calliotel - the global virtual phone platform.</p>
            {f'<p style="background: #F3F4F6; padding: 15px; border-radius: 8px; font-style: italic;">"{message}"</p>' if message else ''}
            <p>With Calliotel, you can:</p>
            <ul>
                <li>Get virtual phone numbers from 150+ countries</li>
                <li>Send and receive SMS messages globally</li>
                <li>Make international calls at low rates</li>
                <li>Chat with friends in real-time</li>
            </ul>
            <a href="{invite_link}" style="display: inline-block; background: linear-gradient(to right, #EA580C, #F97316); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">
                Join Calliotel Now
            </a>
            <p style="color: #6B7280; font-size: 14px;">Once you sign up, you and {sender_name} will automatically be connected on chat!</p>
        </div>
        """
        
        send_email(
            to_email=email,
            subject=f"{sender_name} invited you to Calliotel!",
            html_content=email_html
        )
        
        # Store invitation for tracking
        invitation_doc = {
            "id": str(uuid.uuid4()),
            "sender_id": current_user["_id"],
            "sender_name": sender_name,
            "recipient_email": email,
            "message": message,
            "invited_at": datetime.now(timezone.utc).isoformat(),
            "status": "sent"
        }
        
        await db.chat_invitations.insert_one(invitation_doc)
        
        return {
            "success": True,
            "message": f"Invitation sent to {email}!"
        }
    except Exception as e:
        logger.error(f"Error sending email invitation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send invitation")

@router.delete("/friend/{friendship_id}")
async def remove_friend(friendship_id: str, current_user = Depends(get_current_user)):
    """
    Remove a friend (delete friendship).
    """
    try:
        user_id = current_user["_id"]
        
        # Delete friendship
        result = await db.friendships.delete_one({
            "id": friendship_id,
            "$or": [
                {"user1_id": user_id},
                {"user2_id": user_id}
            ]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Friendship not found")
        
        return {"success": True, "message": "Friend removed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing friend: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to remove friend")

# Messaging Endpoints
@router.post("/message")
async def send_message(message: MessageCreate, current_user = Depends(get_current_user)):
    """
    Send a message to a friend.
    """
    try:
        sender_id = current_user["_id"]
        receiver_id = message.receiver_id
        
        # Check if they are friends
        friendship = await db.friendships.find_one({
            "$or": [
                {"user1_id": sender_id, "user2_id": receiver_id},
                {"user1_id": receiver_id, "user2_id": sender_id}
            ]
        })
        
        if not friendship:
            raise HTTPException(status_code=403, detail="You can only message your friends")
        
        # Create message
        message_doc = {
            "id": str(uuid.uuid4()),
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "content": message.content,
            "type": message.type,
            "read": False,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await db.messages.insert_one(message_doc)
        
        # Award XP and update stats for gamification (synchronously to return data)
        xp_result = await award_xp_to_user(sender_id, 1, "Message sent")
        await update_user_stat(sender_id, "messages_sent", 1)
        
        return {
            "success": True,
            "message_id": message_doc["id"],
            "timestamp": message_doc["timestamp"],
            "gamification": xp_result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.get("/messages/{friend_id}")
async def get_messages(friend_id: str, limit: int = 100, current_user = Depends(get_current_user)):
    """
    Get conversation with a friend.
    """
    try:
        user_id = current_user["_id"]
        
        # Check if they are friends
        friendship = await db.friendships.find_one({
            "$or": [
                {"user1_id": user_id, "user2_id": friend_id},
                {"user1_id": friend_id, "user2_id": user_id}
            ]
        })
        
        if not friendship:
            raise HTTPException(status_code=403, detail="You can only view messages with your friends")
        
        # Get messages
        messages = await db.messages.find(
            {
                "$or": [
                    {"sender_id": user_id, "receiver_id": friend_id},
                    {"sender_id": friend_id, "receiver_id": user_id}
                ]
            },
            {"_id": 0}
        ).sort("timestamp", 1).limit(limit).to_list(limit)
        
        # Mark messages as read
        await db.messages.update_many(
            {
                "sender_id": friend_id,
                "receiver_id": user_id,
                "read": False
            },
            {"$set": {"read": True}}
        )
        
        return {"messages": messages}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting messages: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get messages")

@router.post("/search-user")
async def search_user(search: SearchUserRequest, current_user = Depends(get_current_user)):
    """
    Search for a user by Client ID or email.
    """
    try:
        query = search.query.strip()
        
        # Search by client_id or email
        user = await db.users.find_one(
            {
                "$or": [
                    {"client_id": query},
                    {"email": query}
                ]
            },
            {"_id": 1, "email": 1, "client_id": 1, "full_name": 1}
        )
        
        if not user:
            return {"found": False, "message": "User not found"}
        
        # Check if already friends
        friendship = await db.friendships.find_one({
            "$or": [
                {"user1_id": current_user["_id"], "user2_id": user["_id"]},
                {"user1_id": user["_id"], "user2_id": current_user["_id"]}
            ]
        })
        
        is_friend = bool(friendship)
        
        # Check if request exists
        pending_request = await db.friend_requests.find_one({
            "$or": [
                {"sender_id": current_user["_id"], "receiver_id": user["_id"], "status": "pending"},
                {"sender_id": user["_id"], "receiver_id": current_user["_id"], "status": "pending"}
            ]
        })
        
        has_pending_request = bool(pending_request)
        
        return {
            "found": True,
            "user": {
                "user_id": user["_id"],
                "email": user["email"],
                "client_id": user["client_id"],
                "full_name": user.get("full_name")
            },
            "is_friend": is_friend,
            "has_pending_request": has_pending_request
        }
    except Exception as e:
        logger.error(f"Error searching user: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search user")

@router.get("/unread-count")
async def get_unread_count(current_user = Depends(get_current_user)):
    """
    Get total unread message count.
    """
    try:
        user_id = current_user["_id"]
        
        unread_count = await db.messages.count_documents({
            "receiver_id": user_id,
            "read": False
        })
        
        return {"unread_count": unread_count}
    except Exception as e:
        logger.error(f"Error getting unread count: {str(e)}")

# WebSocket Endpoint for Real-time Chat
@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """
    WebSocket endpoint for real-time chat.
    Client connects with JWT token in the path.
    """
    user_id = None
    try:
        # Verify token
        SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        
        if not user_id:
            await websocket.close(code=1008)
            return
        
        # Connect user
        await manager.connect(websocket, user_id)
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "user_id": user_id
        })
        
        # Handle incoming messages
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "chat_message":
                # Save message to database
                receiver_id = data.get("receiver_id")
                content = data.get("content")
                msg_type = data.get("message_type", "text")
                
                message_doc = {
                    "id": str(uuid.uuid4()),
                    "sender_id": user_id,
                    "receiver_id": receiver_id,
                    "content": content,
                    "type": msg_type,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "read": False,
                    "reactions": []
                }
                
                await db.messages.insert_one(message_doc)
                
                # Send to receiver (if online)
                await manager.send_personal_message({
                    "type": "new_message",
                    "message": {
                        "id": message_doc["id"],
                        "sender_id": user_id,
                        "receiver_id": receiver_id,
                        "content": content,
                        "type": msg_type,
                        "timestamp": message_doc["timestamp"],
                        "read": False
                    }
                }, receiver_id)
                
                # Confirm to sender
                await websocket.send_json({
                    "type": "message_sent",
                    "message_id": message_doc["id"],
                    "status": "delivered"
                })
            
            elif message_type == "typing":
                # Notify receiver that user is typing
                receiver_id = data.get("receiver_id")
                await manager.send_personal_message({
                    "type": "typing",
                    "sender_id": user_id,
                    "is_typing": data.get("is_typing", True)
                }, receiver_id)
            
            elif message_type == "mark_read":
                # Mark message as read
                message_id = data.get("message_id")
                await db.messages.update_one(
                    {"id": message_id},
                    {"$set": {"read": True}}
                )
                
                # Notify sender
                message = await db.messages.find_one({"id": message_id}, {"_id": 0})
                if message:
                    await manager.send_personal_message({
                        "type": "message_read",
                        "message_id": message_id
                    }, message["sender_id"])
            
            elif message_type == "reaction":
                # Add reaction to message
                message_id = data.get("message_id")
                reaction = data.get("reaction")
                
                await db.messages.update_one(
                    {"id": message_id},
                    {"$push": {"reactions": {"user_id": user_id, "reaction": reaction}}}
                )
                
                # Notify other user
                message = await db.messages.find_one({"id": message_id}, {"_id": 0})
                if message:
                    other_user_id = message["sender_id"] if message["receiver_id"] == user_id else message["receiver_id"]
                    await manager.send_personal_message({
                        "type": "reaction_added",
                        "message_id": message_id,
                        "user_id": user_id,
                        "reaction": reaction
                    }, other_user_id)
    
    except WebSocketDisconnect:
        if user_id:
            manager.disconnect(websocket, user_id)
            logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        if user_id:
            manager.disconnect(websocket, user_id)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass

        raise HTTPException(status_code=500, detail="Failed to get unread count")
