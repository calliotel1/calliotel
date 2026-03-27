"""
Birthday Feature System
- Birthday notifications
- Birthday wishes
- Birthday gifts
- Auto discount on birthday
- Email notifications
- Birthday cards
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from uuid import uuid4
from services.birthday_email_service import send_birthday_email, send_friend_birthday_notification_email

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


class BirthdayWish(BaseModel):
    message: str
    recipient_id: str
    card_template: Optional[str] = None  # Add card template field


class BirthdayGift(BaseModel):
    recipient_id: str
    gift_type: str  # credits, sticker, badge
    amount: Optional[float] = 0


class BirthdayNotification(BaseModel):
    user_id: str
    friend_id: str
    message: str


def is_birthday_today(birthday_str: str) -> bool:
    """Check if today is the user's birthday"""
    try:
        birthday = datetime.fromisoformat(birthday_str)
        today = datetime.now(timezone.utc)
        return birthday.month == today.month and birthday.day == today.day
    except:
        return False


def calculate_age(birthday_str: str) -> int:
    """Calculate age from birthday"""
    try:
        birthday = datetime.fromisoformat(birthday_str)
        today = datetime.now(timezone.utc)
        age = today.year - birthday.year
        if today.month < birthday.month or (today.month == birthday.month and today.day < birthday.day):
            age -= 1
        return age
    except:
        return 0


async def send_birthday_notification(user_id: str, friend_id: str, friend_name: str):
    """Send in-app birthday notification"""
    notification = {
        "id": str(uuid4()),
        "user_id": user_id,
        "type": "birthday",
        "title": f"🎂 {friend_name}'s Birthday!",
        "message": f"Today is {friend_name}'s birthday! Send them wishes!",
        "link": f"/profile/{friend_id}",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)


async def send_admin_birthday_wish(user_id: str, user_name: str, user_email: str, age: int):
    """Auto send birthday wish from admin + email"""
    admin_wish = {
        "id": str(uuid4()),
        "sender_id": "admin",
        "sender_name": "Team Calliotel",
        "recipient_id": user_id,
        "message": f"🎉 Happy Birthday {user_name}! Enjoy 10% off today! 🎂 - Team Calliotel",
        "type": "admin_wish",
        "card_template": "default",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.birthday_wishes.insert_one(admin_wish)
    
    # Also send as notification
    notification = {
        "id": str(uuid4()),
        "user_id": user_id,
        "type": "birthday_wish",
        "title": "🎂 Happy Birthday from Team Calliotel!",
        "message": f"🎉 Happy Birthday {user_name}! Enjoy 10% off today! 🎂",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    
    # Send birthday email
    try:
        await send_birthday_email(user_email, user_name, age)
        logger.info(f"Birthday email sent to {user_email}")
    except Exception as e:
        logger.error(f"Failed to send birthday email: {str(e)}")


async def apply_birthday_discount(user_id: str):
    """Apply 10% discount for birthday"""
    # Create a discount record
    discount = {
        "id": str(uuid4()),
        "user_id": user_id,
        "type": "birthday_discount",
        "percentage": 10,
        "valid_until": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.discounts.insert_one(discount)


@router.get("/check-birthdays")
async def check_todays_birthdays():
    """
    Check for today's birthdays and send notifications + emails
    This should be called daily (can be triggered by cron job)
    """
    try:
        # Get all users
        users = await db.users.find({}, {"_id": 0}).to_list(1000)
        
        birthday_users = []
        
        for user in users:
            if user.get("birthday") and is_birthday_today(user.get("birthday")):
                birthday_users.append(user)
                user_id = user.get("id") or user.get("email")
                user_name = user.get("full_name") or "Friend"
                user_email = user.get("email")
                age = calculate_age(user.get("birthday"))
                
                # Send admin birthday wish + email
                await send_admin_birthday_wish(
                    user_id,
                    user_name,
                    user_email,
                    age
                )
                
                # Apply birthday discount
                await apply_birthday_discount(user_id)
                
                # Get user's friends
                friends = await db.friendships.find({
                    "$or": [
                        {"user_id": user_id},
                        {"friend_id": user_id}
                    ],
                    "status": "accepted"
                }, {"_id": 0}).to_list(1000)
                
                # Notify all friends (in-app + email)
                for friendship in friends:
                    friend_id = friendship.get("friend_id") if friendship.get("user_id") == user_id else friendship.get("user_id")
                    
                    # Send in-app notification
                    await send_birthday_notification(
                        friend_id,
                        user_id,
                        user_name
                    )
                    
                    # Send email notification to friend
                    try:
                        friend = await db.users.find_one({
                            "$or": [{"_id": friend_id}, {"email": friend_id}]
                        })
                        if friend and friend.get("email"):
                            await send_friend_birthday_notification_email(
                                friend.get("email"),
                                friend.get("full_name") or "Friend",
                                user_name
                            )
                            logger.info(f"Birthday notification email sent to {friend.get('email')}")
                    except Exception as e:
                        logger.error(f"Failed to send friend notification email: {str(e)}")
        
        return {
            "success": True,
            "message": f"Found {len(birthday_users)} birthdays today",
            "birthdays": [{"name": u.get("full_name"), "age": calculate_age(u.get("birthday"))} for u in birthday_users]
        }
        
    except Exception as e:
        logger.error(f"Error checking birthdays: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check birthdays")


@router.get("/my-birthday-status")
async def get_my_birthday_status(current_user = Depends(get_current_user)):
    """Check if today is user's birthday and get discount info"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        birthday = current_user.get("birthday")
        
        if not birthday:
            return {
                "is_birthday": False,
                "has_discount": False
            }
        
        is_birthday = is_birthday_today(birthday)
        age = calculate_age(birthday) if is_birthday else 0
        
        # Check for active discount
        discount = await db.discounts.find_one({
            "user_id": user_id,
            "type": "birthday_discount",
            "used": False,
            "valid_until": {"$gte": datetime.now(timezone.utc).isoformat()}
        }, {"_id": 0})
        
        return {
            "is_birthday": is_birthday,
            "age": age,
            "has_discount": discount is not None,
            "discount_percentage": discount.get("percentage") if discount else 0,
            "discount_id": discount.get("id") if discount else None
        }
        
    except Exception as e:
        logger.error(f"Error getting birthday status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get birthday status")


@router.post("/send-wish")
async def send_birthday_wish(wish_data: BirthdayWish, current_user = Depends(get_current_user)):
    """Send birthday wish to a friend (with optional card template)"""
    try:
        sender_id = current_user.get("_id") or current_user.get("email")
        sender_name = current_user.get("full_name") or "Friend"
        
        # Check if recipient exists
        recipient = await db.users.find_one({
            "$or": [
                {"_id": wish_data.recipient_id},
                {"email": wish_data.recipient_id}
            ]
        })
        
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Save wish with card template
        wish = {
            "id": str(uuid4()),
            "sender_id": sender_id,
            "sender_name": sender_name,
            "recipient_id": wish_data.recipient_id,
            "message": wish_data.message,
            "type": "friend_wish",
            "card_template": wish_data.card_template or "default",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.birthday_wishes.insert_one(wish)
        
        # Send notification to recipient
        notification = {
            "id": str(uuid4()),
            "user_id": wish_data.recipient_id,
            "type": "birthday_wish",
            "title": f"🎂 Birthday Wish from {sender_name}",
            "message": wish_data.message,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
        
        logger.info(f"Birthday wish sent from {sender_id} to {wish_data.recipient_id}")
        
        return {
            "success": True,
            "message": "Birthday wish sent!",
            "wish_id": wish["id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending birthday wish: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send birthday wish")


@router.post("/send-gift")
async def send_birthday_gift(gift_data: BirthdayGift, current_user = Depends(get_current_user)):
    """Send birthday gift to a friend"""
    try:
        sender_id = current_user.get("_id") or current_user.get("email")
        sender_name = current_user.get("full_name") or "Friend"
        
        # Check if recipient exists
        recipient = await db.users.find_one({
            "$or": [
                {"_id": gift_data.recipient_id},
                {"email": gift_data.recipient_id}
            ]
        })
        
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Handle different gift types
        if gift_data.gift_type == "credits":
            # Deduct from sender
            sender_wallet = await db.wallets.find_one({"user_id": sender_id})
            if not sender_wallet or sender_wallet.get("balance", 0) < gift_data.amount:
                raise HTTPException(status_code=400, detail="Insufficient balance")
            
            await db.wallets.update_one(
                {"user_id": sender_id},
                {"$inc": {"balance": -gift_data.amount}}
            )
            
            # Add to recipient
            await db.wallets.update_one(
                {"user_id": gift_data.recipient_id},
                {"$inc": {"balance": gift_data.amount}},
                upsert=True
            )
            
            # Log transactions
            await db.transactions.insert_one({
                "user_id": sender_id,
                "type": "debit",
                "amount": gift_data.amount,
                "description": f"Birthday gift to {recipient.get('full_name')}",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            await db.transactions.insert_one({
                "user_id": gift_data.recipient_id,
                "type": "credit",
                "amount": gift_data.amount,
                "description": f"Birthday gift from {sender_name}",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Save gift record
        gift = {
            "id": str(uuid4()),
            "sender_id": sender_id,
            "sender_name": sender_name,
            "recipient_id": gift_data.recipient_id,
            "gift_type": gift_data.gift_type,
            "amount": gift_data.amount,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.birthday_gifts.insert_one(gift)
        
        # Send notification
        notification = {
            "id": str(uuid4()),
            "user_id": gift_data.recipient_id,
            "type": "birthday_gift",
            "title": f"🎁 Birthday Gift from {sender_name}",
            "message": f"{sender_name} sent you ${gift_data.amount} as a birthday gift!",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
        
        logger.info(f"Birthday gift sent from {sender_id} to {gift_data.recipient_id}")
        
        return {
            "success": True,
            "message": "Birthday gift sent!",
            "gift_id": gift["id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending birthday gift: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send birthday gift")


@router.get("/my-wishes")
async def get_my_birthday_wishes(current_user = Depends(get_current_user)):
    """Get all birthday wishes for current user"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        wishes = await db.birthday_wishes.find(
            {"recipient_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return {
            "success": True,
            "wishes": wishes,
            "total": len(wishes)
        }
        
    except Exception as e:
        logger.error(f"Error getting birthday wishes: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get birthday wishes")


@router.get("/my-gifts")
async def get_my_birthday_gifts(current_user = Depends(get_current_user)):
    """Get all birthday gifts for current user"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        gifts = await db.birthday_gifts.find(
            {"recipient_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return {
            "success": True,
            "gifts": gifts,
            "total": len(gifts)
        }
        
    except Exception as e:
        logger.error(f"Error getting birthday gifts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get birthday gifts")


@router.get("/upcoming-birthdays")
async def get_upcoming_birthdays(current_user = Depends(get_current_user)):
    """Get upcoming birthdays of friends (next 7 days)"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        # Get user's friends
        friends = await db.friendships.find({
            "$or": [
                {"user_id": user_id},
                {"friend_id": user_id}
            ],
            "status": "accepted"
        }, {"_id": 0}).to_list(1000)
        
        upcoming = []
        today = datetime.now(timezone.utc)
        
        for friendship in friends:
            friend_id = friendship.get("friend_id") if friendship.get("user_id") == user_id else friendship.get("user_id")
            friend = await db.users.find_one({"$or": [{"_id": friend_id}, {"email": friend_id}]})
            
            if friend and friend.get("birthday"):
                birthday = datetime.fromisoformat(friend.get("birthday"))
                # Calculate next birthday
                next_birthday = birthday.replace(year=today.year)
                if next_birthday < today:
                    next_birthday = next_birthday.replace(year=today.year + 1)
                
                days_until = (next_birthday - today).days
                
                if 0 <= days_until <= 7:
                    upcoming.append({
                        "friend_id": friend_id,
                        "friend_name": friend.get("full_name") or "Friend",
                        "birthday": friend.get("birthday"),
                        "days_until": days_until,
                        "is_today": days_until == 0
                    })
        
        # Sort by days until birthday
        upcoming.sort(key=lambda x: x["days_until"])
        
        return {
            "success": True,
            "upcoming_birthdays": upcoming,
            "total": len(upcoming)
        }
        
    except Exception as e:
        logger.error(f"Error getting upcoming birthdays: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get upcoming birthdays")


@router.get("/card-templates")
async def get_card_templates():
    """Get available birthday card templates"""
    templates = [
        # Original 6
        {
            "id": "balloons",
            "name": "Colorful Balloons",
            "preview": "🎈🎈🎈",
            "gradient": "from-pink-400 via-purple-400 to-blue-400"
        },
        {
            "id": "cake",
            "name": "Birthday Cake",
            "preview": "🎂🍰🎂",
            "gradient": "from-orange-400 via-red-400 to-pink-400"
        },
        {
            "id": "party",
            "name": "Party Time",
            "preview": "🎉🎊🎉",
            "gradient": "from-yellow-400 via-orange-400 to-red-400"
        },
        {
            "id": "sparkles",
            "name": "Sparkles & Stars",
            "preview": "✨⭐✨",
            "gradient": "from-purple-400 via-pink-400 to-indigo-400"
        },
        {
            "id": "gifts",
            "name": "Birthday Gifts",
            "preview": "🎁🎀🎁",
            "gradient": "from-green-400 via-teal-400 to-blue-400"
        },
        {
            "id": "fireworks",
            "name": "Fireworks",
            "preview": "🎆🎇🎆",
            "gradient": "from-indigo-500 via-purple-500 to-pink-500"
        },
        # Second 6
        {
            "id": "rainbow",
            "name": "Rainbow Joy",
            "preview": "🌈🌟🌈",
            "gradient": "from-red-400 via-yellow-400 to-green-400"
        },
        {
            "id": "hearts",
            "name": "Love & Hearts",
            "preview": "💖💕💖",
            "gradient": "from-pink-500 via-rose-500 to-red-500"
        },
        {
            "id": "confetti",
            "name": "Confetti Blast",
            "preview": "🎊🎉🎊",
            "gradient": "from-amber-400 via-pink-400 to-purple-400"
        },
        {
            "id": "music",
            "name": "Music & Dance",
            "preview": "🎵🎶🎵",
            "gradient": "from-blue-400 via-cyan-400 to-teal-400"
        },
        {
            "id": "crown",
            "name": "Royal Birthday",
            "preview": "👑💎👑",
            "gradient": "from-yellow-500 via-amber-500 to-orange-500"
        },
        {
            "id": "magic",
            "name": "Magic Wishes",
            "preview": "🪄✨🪄",
            "gradient": "from-violet-500 via-purple-500 to-fuchsia-500"
        },
        # NEW Third 6
        {
            "id": "tropical",
            "name": "Tropical Paradise",
            "preview": "🌺🌴🌺",
            "gradient": "from-lime-400 via-emerald-400 to-teal-500"
        },
        {
            "id": "winter",
            "name": "Winter Wonderland",
            "preview": "❄️⛄❄️",
            "gradient": "from-blue-300 via-cyan-300 to-sky-400"
        },
        {
            "id": "stars",
            "name": "Starry Night",
            "preview": "⭐🌟⭐",
            "gradient": "from-indigo-600 via-blue-600 to-purple-600"
        },
        {
            "id": "flowers",
            "name": "Blooming Garden",
            "preview": "🌸🌼🌸",
            "gradient": "from-pink-300 via-rose-300 to-fuchsia-400"
        },
        {
            "id": "sunset",
            "name": "Golden Sunset",
            "preview": "🌅🌇🌅",
            "gradient": "from-orange-500 via-rose-500 to-purple-600"
        },
        {
            "id": "champagne",
            "name": "Celebration Toast",
            "preview": "🥂🍾🥂",
            "gradient": "from-yellow-300 via-amber-400 to-yellow-500"
        }
    ]
    
    return {
        "success": True,
        "templates": templates,
        "total": len(templates)
    }
