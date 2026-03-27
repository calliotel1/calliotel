"""
Telnyx SMS Integration
Send and receive real SMS messages
"""
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import os
import telnyx
from motor.motor_asyncio import AsyncIOMotorClient
from tenacity import retry, stop_after_attempt, wait_exponential
import logging
import hmac
import hashlib

router = APIRouter()
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class SendSMSRequest(BaseModel):
    from_number: str
    to_number: str
    message: str
    user_id: str

@router.post("/telnyx/sms/send")
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def send_sms(request: SendSMSRequest):
    """Send SMS via Telnyx"""
    try:
        # Check if Telnyx is configured
        if not os.environ.get('TELNYX_API_KEY'):
            logger.warning("Telnyx not configured, simulating SMS send")
            return {
                "success": True,
                "message_id": "mock-msg-id",
                "status": "simulated",
                "message": "SMS would be sent (Telnyx not configured)",
                "mock_mode": True
            }
        
        # Verify user owns the from_number
        number_doc = await db.phone_numbers.find_one(
            {"phone_number": request.from_number, "user_id": request.user_id},
            {"_id": 0}
        )
        
        if not number_doc:
            raise HTTPException(status_code=403, detail="You don't own this phone number")
        
        # Check wallet balance (SMS costs $0.05)
        wallet = await db.wallets.find_one({"user_id": request.user_id}, {"_id": 0})
        if not wallet or wallet.get("balance", 0) < 0.05:
            raise HTTPException(status_code=400, detail="Insufficient balance for SMS")
        
        # Send via Telnyx
        logger.info(f"Sending SMS from {request.from_number} to {request.to_number}")
        
        response = telnyx.Message.create(
            from_=request.from_number,
            to=request.to_number,
            text=request.message
        )
        
        # Deduct cost from wallet
        new_balance = wallet["balance"] - 0.05
        await db.wallets.update_one(
            {"user_id": request.user_id},
            {"$set": {"balance": new_balance}}
        )
        
        # Log transaction
        transaction = {
            "user_id": request.user_id,
            "type": "sms_sent",
            "amount": -0.05,
            "balance_after": new_balance,
            "from_number": request.from_number,
            "to_number": request.to_number,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        # Save message to history
        message_doc = {
            "message_id": response.id,
            "user_id": request.user_id,
            "from_number": request.from_number,
            "to_number": request.to_number,
            "message": request.message,
            "direction": "outbound",
            "status": "sent",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.sms_messages.insert_one(message_doc)
        
        logger.info(f"SMS sent successfully: {response.id}")
        
        return {
            "success": True,
            "message_id": response.id,
            "status": "sent",
            "new_balance": new_balance,
            "mock_mode": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SMS send error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"SMS send failed: {str(e)}")

@router.post("/telnyx/webhooks/sms")
async def receive_sms_webhook(request: Request, background_tasks: BackgroundTasks):
    """Receive inbound SMS webhook from Telnyx"""
    try:
        body = await request.body()
        
        # TODO: Verify webhook signature for security
        # signature = request.headers.get("Telnyx-Signature-ed25519", "")
        # timestamp = request.headers.get("Telnyx-Timestamp", "")
        
        import json
        payload = json.loads(body)
        
        # Process webhook in background
        background_tasks.add_task(process_inbound_sms, payload)
        
        # Respond immediately
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

async def process_inbound_sms(payload: dict):
    """Process inbound SMS in background"""
    try:
        event_type = payload.get("data", {}).get("event_type")
        
        if event_type != "message.received":
            return
        
        msg_payload = payload.get("data", {}).get("payload", {})
        
        from_number = msg_payload.get("from", {}).get("phone_number")
        to_number = msg_payload.get("to", [{}])[0].get("phone_number")
        text = msg_payload.get("text")
        message_id = msg_payload.get("id")
        
        # Find user who owns the to_number
        number_doc = await db.phone_numbers.find_one(
            {"phone_number": to_number},
            {"_id": 0}
        )
        
        if not number_doc:
            logger.warning(f"Received SMS for unknown number: {to_number}")
            return
        
        # Save inbound message
        message_doc = {
            "message_id": message_id,
            "user_id": number_doc["user_id"],
            "from_number": from_number,
            "to_number": to_number,
            "message": text,
            "direction": "inbound",
            "status": "received",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.sms_messages.insert_one(message_doc)
        
        logger.info(f"Inbound SMS saved: {message_id}")
        
    except Exception as e:
        logger.error(f"Error processing inbound SMS: {str(e)}")

@router.get("/telnyx/sms/history/{user_id}")
async def get_sms_history(user_id: str, limit: int = 50):
    """Get SMS message history for user"""
    try:
        messages = await db.sms_messages.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return {
            "messages": messages,
            "total": len(messages)
        }
        
    except Exception as e:
        logger.error(f"Error fetching SMS history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
