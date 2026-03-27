"""
Admin Broadcast Notifications API Routes
Allows super admins to send notifications to all users
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
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


# Pydantic Models
class BroadcastCreate(BaseModel):
    title: str
    message: str


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    sent_by_name: str
    created_at: str
    is_read: bool


class BroadcastPermissionUpdate(BaseModel):
    can_broadcast: bool


# Helper Functions
async def is_super_admin(current_user) -> bool:
    """Check if user is super admin"""
    admin_emails = [
        "admin@calliotel.com",
        "bigboss@calliotel.com",
        "alinmy77@gmail.com",
        "worl212211@yahoo.com",
    ]
    user_email = current_user.get("_id") or current_user.get("email")
    return user_email in admin_emails


async def can_send_broadcast(current_user) -> bool:
    """Check if user can send broadcasts (super admin or has permission)"""
    if await is_super_admin(current_user):
        return True
    return current_user.get("can_broadcast", False)


# API Endpoints

@router.post("/admin/broadcast")
async def send_broadcast(
    broadcast: BroadcastCreate,
    current_user = Depends(get_current_user)
):
    """Send a broadcast notification to all users"""
    try:
        # Check permissions
        if not await can_send_broadcast(current_user):
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to send broadcast notifications"
            )
        
        # Create notification document
        notification_id = str(uuid4())
        sender_email = current_user.get("_id") or current_user.get("email")
        sender_name = current_user.get("full_name") or sender_email
        
        notification = {
            "id": notification_id,
            "title": broadcast.title,
            "message": broadcast.message,
            "sent_by": sender_email,
            "sent_by_name": sender_name,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Store notification
        await db.notifications.insert_one(notification)
        
        # Get all users
        users = await db.users.find({}, {"_id": 1}).to_list(10000)
        
        # Create user_notification entries for all users
        user_notifications = []
        for user in users:
            user_notifications.append({
                "notification_id": notification_id,
                "user_id": user["_id"],
                "is_read": False,
                "is_deleted": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Bulk insert user notifications
        if user_notifications:
            await db.user_notifications.insert_many(user_notifications)
        
        logger.info(f"Broadcast sent by {sender_name}: '{broadcast.title}' to {len(users)} users")
        
        return {
            "success": True,
            "message": f"Broadcast sent to {len(users)} users",
            "notification_id": notification_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending broadcast: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send broadcast")


@router.get("/user", response_model=List[NotificationResponse])
async def get_user_notifications(current_user = Depends(get_current_user)):
    """Get all notifications for the current user (excluding deleted)"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        # Get user's notification statuses
        user_notifs = await db.user_notifications.find({
            "user_id": user_id,
            "is_deleted": False
        }).to_list(1000)
        
        # Create a map of notification_id -> is_read
        notif_status = {
            un["notification_id"]: un["is_read"]
            for un in user_notifs
        }
        
        # Get the actual notifications
        notification_ids = list(notif_status.keys())
        notifications = await db.notifications.find(
            {"id": {"$in": notification_ids}},
            {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
        
        # Combine notification data with read status
        result = []
        for notif in notifications:
            result.append(NotificationResponse(
                id=notif["id"],
                title=notif["title"],
                message=notif["message"],
                sent_by_name=notif["sent_by_name"],
                created_at=notif["created_at"],
                is_read=notif_status.get(notif["id"], False)
            ))
        
        return result
        
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")


@router.get("/unread-count")
async def get_unread_count(current_user = Depends(get_current_user)):
    """Get count of unread notifications for the current user"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        count = await db.user_notifications.count_documents({
            "user_id": user_id,
            "is_read": False,
            "is_deleted": False
        })
        
        return {"unread_count": count}
        
    except Exception as e:
        logger.error(f"Error getting unread count: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get unread count")


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user = Depends(get_current_user)
):
    """Mark a notification as read"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        result = await db.user_notifications.update_one(
            {
                "notification_id": notification_id,
                "user_id": user_id
            },
            {"$set": {"is_read": True}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"success": True, "message": "Notification marked as read"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification read: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to mark notification as read")


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user = Depends(get_current_user)
):
    """Delete a notification (soft delete)"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        result = await db.user_notifications.update_one(
            {
                "notification_id": notification_id,
                "user_id": user_id
            },
            {"$set": {"is_deleted": True}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"success": True, "message": "Notification deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete notification")


@router.put("/admin/users/{user_id}/broadcast-permission")
async def toggle_broadcast_permission(
    user_id: str,
    permission: BroadcastPermissionUpdate,
    current_user = Depends(get_current_user)
):
    """Toggle broadcast permission for an admin (super admin only)"""
    try:
        # Only super admins can manage permissions
        if not await is_super_admin(current_user):
            raise HTTPException(
                status_code=403,
                detail="Only super admins can manage broadcast permissions"
            )
        
        # Update user's broadcast permission
        result = await db.users.update_one(
            {"$or": [{"_id": user_id}, {"email": user_id}]},
            {"$set": {"can_broadcast": permission.can_broadcast}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        action = "granted" if permission.can_broadcast else "revoked"
        logger.info(f"Broadcast permission {action} for user {user_id} by super admin")
        
        return {
            "success": True,
            "message": f"Broadcast permission {action} successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating broadcast permission: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update permission")


@router.get("/admin/users-list")
async def get_admin_users_list(current_user = Depends(get_current_user)):
    """Get list of all admin users with their broadcast permissions (super admin only)"""
    try:
        # Only super admins can view this
        if not await is_super_admin(current_user):
            raise HTTPException(
                status_code=403,
                detail="Only super admins can view admin list"
            )
        
        # Get all users (exclude MongoDB _id from response)
        users = await db.users.find(
            {},
            {
                "_id": 0,  # Exclude MongoDB ObjectId
                "email": 1,
                "full_name": 1,
                "can_broadcast": 1,
                "created_at": 1
            }
        ).to_list(1000)
        
        # Format response
        admin_users = []
        super_admin_emails = [
            "admin@calliotel.com",
            "bigboss@calliotel.com",
            "alinmy77@gmail.com",
            "worl212211@yahoo.com",
        ]
        
        for user in users:
            email = user.get("email", "")
            is_super = email in super_admin_emails
            
            admin_users.append({
                "user_id": email,  # Use email as user_id
                "email": email,
                "full_name": user.get("full_name", "Unknown"),
                "can_broadcast": user.get("can_broadcast", False) or is_super,
                "is_super_admin": is_super,
                "created_at": user.get("created_at", "")
            })
        
        return {
            "success": True,
            "users": admin_users
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching admin users: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch admin users")
