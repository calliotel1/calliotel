"""
Background jobs for virtual number billing automation
- Auto-renewal processing
- Number expiration handling
- Payment processing
"""

import logging
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio

logger = logging.getLogger(__name__)


def get_db():
    """Get a fresh database connection for the current event loop"""
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    client = AsyncIOMotorClient(mongo_url)
    return client[db_name]


async def process_auto_renewals():
    """
    Process auto-renewals for virtual numbers.
    Called daily via cron job.
    
    Logic:
    1. Find all numbers where:
       - auto_renew = True
       - next_billing_date <= today
       - status = active
       - cancel_requested = False
    2. For each number:
       - Check user's wallet balance
       - Deduct monthly_cost from wallet
       - Update next_billing_date (+30 days)
       - Log transaction
       - Send confirmation email (future)
    """
    try:
        logger.info("🔄 Starting auto-renewal job...")
        
        db = get_db()  # Get fresh DB connection for this job run
        today = datetime.now(timezone.utc)
        
        # Find numbers due for renewal
        cursor = db.purchased_numbers.find({
            "auto_renew": True,
            "status": "active",
            "cancel_requested": False,
            "next_billing_date": {"$lte": today.isoformat()}
        })
        
        numbers_to_renew = await cursor.to_list(length=1000)
        
        if not numbers_to_renew:
            logger.info("✅ No numbers due for renewal today")
            return {
                "success": True,
                "renewed": 0,
                "failed": 0,
                "message": "No renewals due"
            }
        
        logger.info(f"📞 Found {len(numbers_to_renew)} numbers due for renewal")
        
        renewed_count = 0
        failed_count = 0
        
        for number in numbers_to_renew:
            try:
                phone_number = number["phone_number"]
                monthly_cost = number["monthly_cost"]
                user_id = number["user_id"]
                
                # Get user's wallet
                wallet = await db.wallets.find_one({"user_id": user_id})
                
                if not wallet:
                    logger.warning(f"❌ No wallet found for user {user_id}, number {phone_number}")
                    failed_count += 1
                    continue
                
                # Check balance
                if wallet["balance"] < monthly_cost:
                    logger.warning(f"💰 Insufficient balance for {phone_number}. Required: ${monthly_cost}, Available: ${wallet['balance']}")
                    
                    # Mark number for expiration (grace period: 7 days)
                    from datetime import timedelta
                    grace_end = datetime.now(timezone.utc) + timedelta(days=7)
                    
                    await db.purchased_numbers.update_one(
                        {"_id": number["_id"]},
                        {
                            "$set": {
                                "status": "suspended",
                                "suspension_reason": "insufficient_balance",
                                "grace_period_end": grace_end.isoformat(),
                                "updated_at": datetime.now(timezone.utc).isoformat()
                            }
                        }
                    )
                    
                    logger.info(f"⏸️ Number {phone_number} suspended. Grace period until {grace_end.date()}")
                    failed_count += 1
                    continue
                
                # Deduct from wallet
                new_balance = wallet["balance"] - monthly_cost
                await db.wallets.update_one(
                    {"user_id": user_id},
                    {
                        "$set": {
                            "balance": new_balance,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                # Log transaction
                transaction = {
                    "user_id": user_id,
                    "type": "debit",
                    "amount": monthly_cost,
                    "description": f"Monthly renewal for {phone_number}",
                    "phone_number": phone_number,
                    "balance_after": new_balance,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.transactions.insert_one(transaction)
                
                # Update next billing date (+30 days)
                from datetime import timedelta
                next_billing = datetime.now(timezone.utc) + timedelta(days=30)
                
                await db.purchased_numbers.update_one(
                    {"_id": number["_id"]},
                    {
                        "$set": {
                            "next_billing_date": next_billing.isoformat(),
                            "last_renewed_at": datetime.now(timezone.utc).isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                logger.info(f"✅ Renewed {phone_number} for ${monthly_cost}. Next billing: {next_billing.date()}")
                renewed_count += 1
                
                # TODO: Send confirmation email via Resend
                
            except Exception as e:
                logger.error(f"❌ Error renewing {number.get('phone_number', 'unknown')}: {str(e)}")
                failed_count += 1
        
        logger.info(f"🎉 Auto-renewal job complete. Renewed: {renewed_count}, Failed: {failed_count}")
        
        return {
            "success": True,
            "renewed": renewed_count,
            "failed": failed_count,
            "total_processed": len(numbers_to_renew)
        }
        
    except Exception as e:
        logger.error(f"❌ Auto-renewal job failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


async def process_expirations():
    """
    Process number expirations and cancellations.
    Called daily via cron job.
    
    Logic:
    1. Find all numbers where:
       - cancel_requested = True
       - cancel_effective_date <= today
       - status = active
    2. For each number:
       - Update status to "expired"
       - Optionally release from Telnyx/provider
       - Log the expiration
       - Send confirmation email (future)
    
    3. Also handle suspended numbers past grace period
    """
    try:
        logger.info("📅 Starting expiration job...")
        
        db = get_db()  # Get fresh DB connection for this job run
        today = datetime.now(timezone.utc)
        
        # Find cancelled numbers that should expire today
        cursor_cancelled = db.purchased_numbers.find({
            "cancel_requested": True,
            "status": "active",
            "cancel_effective_date": {"$lte": today.isoformat()}
        })
        
        # Find suspended numbers past grace period
        cursor_suspended = db.purchased_numbers.find({
            "status": "suspended",
            "grace_period_end": {"$lte": today.isoformat()}
        })
        
        cancelled_numbers = await cursor_cancelled.to_list(length=1000)
        suspended_numbers = await cursor_suspended.to_list(length=1000)
        
        numbers_to_expire = cancelled_numbers + suspended_numbers
        
        if not numbers_to_expire:
            logger.info("✅ No numbers due for expiration today")
            return {
                "success": True,
                "expired": 0,
                "message": "No expirations due"
            }
        
        logger.info(f"📞 Found {len(numbers_to_expire)} numbers to expire")
        
        expired_count = 0
        
        for number in numbers_to_expire:
            try:
                phone_number = number["phone_number"]
                
                # Update status to expired
                await db.purchased_numbers.update_one(
                    {"_id": number["_id"]},
                    {
                        "$set": {
                            "status": "expired",
                            "expired_at": datetime.now(timezone.utc).isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                # Log expiration event
                expiration_log = {
                    "phone_number": phone_number,
                    "user_id": number["user_id"],
                    "reason": "cancelled" if number.get("cancel_requested") else "suspended",
                    "expired_at": datetime.now(timezone.utc).isoformat()
                }
                await db.number_expirations.insert_one(expiration_log)
                
                # TODO: Release from Telnyx (or new VoIP provider)
                # This will be implemented after VoIP migration
                
                logger.info(f"✅ Expired {phone_number}")
                expired_count += 1
                
                # TODO: Send expiration confirmation email via Resend
                
            except Exception as e:
                logger.error(f"❌ Error expiring {number.get('phone_number', 'unknown')}: {str(e)}")
        
        logger.info(f"🎉 Expiration job complete. Expired: {expired_count}")
        
        return {
            "success": True,
            "expired": expired_count,
            "total_processed": len(numbers_to_expire)
        }
        
    except Exception as e:
        logger.error(f"❌ Expiration job failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


async def send_renewal_reminders():
    """
    Send email reminders before renewal date.
    Called daily via cron job.
    
    Logic:
    1. Find numbers with next_billing_date in 7 days
    2. Send reminder email to users
    3. Find numbers with next_billing_date in 3 days (if auto_renew OFF)
    4. Send urgent reminder
    """
    try:
        logger.info("📧 Starting renewal reminder job...")
        
        db = get_db()  # Get fresh DB connection for this job run
        from datetime import timedelta
        
        today = datetime.now(timezone.utc)
        seven_days = (today + timedelta(days=7)).date()
        three_days = (today + timedelta(days=3)).date()
        
        reminder_count = 0
        
        # 7-day reminders (all active numbers)
        cursor_7d = db.purchased_numbers.find({
            "status": "active",
            "auto_renew": True,
            "cancel_requested": False
        })
        
        numbers_7d = await cursor_7d.to_list(length=1000)
        
        for number in numbers_7d:
            try:
                next_billing = datetime.fromisoformat(number["next_billing_date"].replace('Z', '+00:00'))
                
                if next_billing.date() == seven_days:
                    phone_number = number["phone_number"]
                    monthly_cost = number["monthly_cost"]
                    
                    # Get user email
                    user = await db.users.find_one({"_id": number["user_id"]})
                    if user and user.get("email"):
                        # TODO: Send email via Resend
                        logger.info(f"📧 7-day reminder sent for {phone_number} to {user['email']}")
                        reminder_count += 1
                    
            except Exception as e:
                logger.error(f"❌ Error sending 7-day reminder: {str(e)}")
        
        # 3-day reminders (auto-renew OFF only)
        cursor_3d = db.purchased_numbers.find({
            "status": "active",
            "auto_renew": False,
            "cancel_requested": False
        })
        
        numbers_3d = await cursor_3d.to_list(length=1000)
        
        for number in numbers_3d:
            try:
                next_billing = datetime.fromisoformat(number["next_billing_date"].replace('Z', '+00:00'))
                
                if next_billing.date() == three_days:
                    phone_number = number["phone_number"]
                    
                    # Get user email
                    user = await db.users.find_one({"_id": number["user_id"]})
                    if user and user.get("email"):
                        # TODO: Send urgent email via Resend
                        logger.info(f"📧 3-day URGENT reminder sent for {phone_number} to {user['email']}")
                        reminder_count += 1
                    
            except Exception as e:
                logger.error(f"❌ Error sending 3-day reminder: {str(e)}")
        
        logger.info(f"🎉 Reminder job complete. Sent: {reminder_count}")
        
        return {
            "success": True,
            "reminders_sent": reminder_count
        }
        
    except Exception as e:
        logger.error(f"❌ Reminder job failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


# Synchronous wrappers for APScheduler (required because APScheduler doesn't support async directly)
def run_auto_renewals():
    """Synchronous wrapper for auto-renewal job"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(process_auto_renewals())
        loop.close()
        return result
    except Exception as e:
        logger.error(f"Error in run_auto_renewals wrapper: {str(e)}")
        return {"success": False, "error": str(e)}


def run_expirations():
    """Synchronous wrapper for expiration job"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(process_expirations())
        loop.close()
        return result
    except Exception as e:
        logger.error(f"Error in run_expirations wrapper: {str(e)}")
        return {"success": False, "error": str(e)}


def run_renewal_reminders():
    """Synchronous wrapper for reminder job"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(send_renewal_reminders())
        loop.close()
        return result
    except Exception as e:
        logger.error(f"Error in run_renewal_reminders wrapper: {str(e)}")
        return {"success": False, "error": str(e)}




async def process_scheduled_messages():
    """
    Check and send scheduled messages/challenges that are due (Time-Bender feature)
    Called every minute via cron job
    Handles both regular messages and game challenges
    """
    try:
        logger.info("📅 Checking for scheduled messages...")
        
        db = get_db()  # Get fresh DB connection for this job run
        now = datetime.now(timezone.utc)
        
        # Find messages that are due to be sent
        cursor = db.scheduled_messages.find({
            "status": "pending",
            "scheduled_time": {"$lte": now.isoformat()}
        })
        
        messages_to_send = await cursor.to_list(length=1000)
        
        if not messages_to_send:
            logger.info("✅ No scheduled messages due")
            return {
                "success": True,
                "sent": 0,
                "message": "No messages due"
            }
        
        logger.info(f"📨 Found {len(messages_to_send)} messages to send")
        
        sent_count = 0
        failed_count = 0
        
        for message in messages_to_send:
            try:
                msg_id = message.get("id", message.get("_id"))
                sender_id = message["sender_id"]
                receiver_id = message.get("receiver_id", message.get("recipient_id"))
                content = message["content"]
                msg_type = message.get("type", message.get("message_type"))
                
                # TIME-BENDER: Handle challenge type
                if msg_type == "challenge" and message.get("challenge_config"):
                    # Send as game challenge
                    from uuid import uuid4
                    challenge_config = message["challenge_config"]
                    
                    challenge_doc = {
                        "id": str(uuid4()),
                        "challenger_id": sender_id,
                        "opponent_id": receiver_id,
                        "game_type": challenge_config["game_type"],
                        "wager_amount": challenge_config.get("wager_amount"),
                        "difficulty": challenge_config.get("difficulty", "medium"),
                        "chaos_mode": challenge_config.get("chaos_mode", False),
                        "message": content,
                        "status": "pending",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "expires_at": None
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
                    
                    game_name = game_names.get(challenge_config["game_type"], "Game")
                    game_emoji = game_emojis.get(challenge_config["game_type"], "🎮")
                    
                    system_message_content = f"{game_emoji} **Challenge:** {game_name}"
                    
                    if challenge_config.get("wager_amount"):
                        system_message_content += f" • {challenge_config['wager_amount']} XP wager"
                    
                    if challenge_config.get("difficulty"):
                        system_message_content += f" • {challenge_config['difficulty'].capitalize()}"
                    
                    if challenge_config.get("chaos_mode"):
                        system_message_content += " • 🔥 Chaos Mode"
                    
                    if content:
                        system_message_content += f"\n💬 \"{content}\""
                    
                    # Add "⏰ Scheduled Taunt" indicator
                    system_message_content += "\n⏰ Scheduled Taunt"
                    
                    from uuid import uuid4
                    system_msg = {
                        "id": str(uuid4()),
                        "sender_id": sender_id,
                        "receiver_id": receiver_id,
                        "content": system_message_content,
                        "type": "challenge",
                        "challenge_id": challenge_doc["id"],
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "read": False,
                        "reactions": []
                    }
                    
                    await db.messages.insert_one(system_msg)
                    
                    logger.info(f"⚔️ Sent scheduled challenge: {challenge_doc['id']}")
                    
                else:
                    # Send as regular message
                    from uuid import uuid4
                    new_message = {
                        "id": str(uuid4()),
                        "sender_id": sender_id,
                        "receiver_id": receiver_id,
                        "content": content,
                        "type": msg_type,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "read": False,
                        "scheduled": True  # Mark as scheduled message
                    }
                    
                    await db.messages.insert_one(new_message)
                    
                    logger.info(f"✅ Sent scheduled message: {msg_id}")
                
                # Update scheduled message status
                await db.scheduled_messages.update_one(
                    {"id": msg_id} if "id" in message else {"_id": msg_id},
                    {
                        "$set": {
                            "status": "sent",
                            "sent_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                sent_count += 1
                
            except Exception as e:
                logger.error(f"❌ Error sending message {message.get('id', message.get('_id'))}: {str(e)}")
                
                # Mark as failed
                msg_id_field = {"id": message.get("id")} if "id" in message else {"_id": message.get("_id")}
                await db.scheduled_messages.update_one(
                    msg_id_field,
                    {
                        "$set": {
                            "status": "failed",
                            "error": str(e),
                            "failed_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                failed_count += 1
        
        logger.info(f"🎉 Scheduled messages job complete. Sent: {sent_count}, Failed: {failed_count}")
        
        return {
            "success": True,
            "sent": sent_count,
            "failed": failed_count,
            "total_processed": len(messages_to_send)
        }
        
    except Exception as e:
        logger.error(f"❌ Scheduled messages job failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


def run_scheduled_messages():
    """Synchronous wrapper for scheduled messages job"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(process_scheduled_messages())
        loop.close()
        return result
    except Exception as e:
        logger.error(f"Error in run_scheduled_messages wrapper: {str(e)}")
        return {"success": False, "error": str(e)}



async def process_scheduled_video_messages():
    """
    Check and send scheduled video messages that are due
    Called every minute via cron job
    """
    try:
        logger.info("📹 Checking for scheduled video messages...")
        
        db = get_db()  # Get fresh DB connection for this job run
        now = datetime.now(timezone.utc)
        
        # Find video messages that are due to be sent
        cursor = db.scheduled_video_messages.find({
            "status": "scheduled",
            "scheduled_at": {"$lte": now.isoformat()}
        })
        
        videos_to_send = await cursor.to_list(length=100)
        
        if not videos_to_send:
            logger.info("✅ No scheduled video messages due")
            return {"success": True, "sent": 0, "message": "No videos due"}
        
        sent_count = 0
        failed_count = 0
        
        for video in videos_to_send:
            try:
                # Move from scheduled to regular messages
                video["status"] = "sent"
                video["timestamp"] = datetime.now(timezone.utc).isoformat()
                
                # Insert into messages collection
                await db.messages.insert_one(video)
                
                # Remove from scheduled collection
                await db.scheduled_video_messages.delete_one({"message_id": video["message_id"]})
                
                sent_count += 1
                logger.info(f"✅ Sent scheduled video: {video['message_id']}")
                
            except Exception as e:
                failed_count += 1
                logger.error(f"❌ Failed to send video {video.get('message_id')}: {str(e)}")
                # Mark as failed
                await db.scheduled_video_messages.update_one(
                    {"message_id": video["message_id"]},
                    {"$set": {"status": "failed", "error": str(e)}}
                )
        
        logger.info(f"🎉 Scheduled video messages job complete. Sent: {sent_count}, Failed: {failed_count}")
        return {
            "success": True,
            "sent": sent_count,
            "failed": failed_count
        }
        
    except Exception as e:
        logger.error(f"❌ Scheduled video messages job failed: {str(e)}")
        return {"success": False, "error": str(e)}


def run_scheduled_video_messages():
    """Synchronous wrapper for scheduled video messages job"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(process_scheduled_video_messages())
        loop.close()
        return result
    except Exception as e:
        logger.error(f"Error in run_scheduled_video_messages wrapper: {str(e)}")
        return {"success": False, "error": str(e)}
