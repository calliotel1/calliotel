from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Optional
import logging
import requests
import os
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)
router = APIRouter()

TELNYX_API_KEY = os.environ.get('TELNYX_API_KEY')
TELNYX_API_BASE = "https://api.telnyx.com/v2"

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class SendSMSRequest(BaseModel):
    from_number: str
    to_number: str
    text: str

class SMSMessage(BaseModel):
    id: str
    from_number: str
    to_number: str
    text: str
    direction: str  # inbound or outbound
    status: str
    created_at: str

@router.post("/send")
async def send_sms(request: SendSMSRequest, current_user = Depends(get_current_user)):
    """
    Send an SMS message using Telnyx.
    """
    try:
        if not TELNYX_API_KEY:
            raise HTTPException(status_code=500, detail="Telnyx not configured")
        
        # Verify user owns the from_number
        number = await db.purchased_numbers.find_one({
            "phone_number": request.from_number,
            "user_id": current_user["_id"],
            "status": "active"
        })
        
        if not number:
            raise HTTPException(status_code=403, detail="You don't own this number or it's not active")
        
        # Check wallet balance
        SMS_COST = 0.01
        wallet = await db.wallets.find_one({"user_id": current_user["_id"]})
        if not wallet or wallet["balance"] < SMS_COST:
            raise HTTPException(status_code=402, detail=f"Insufficient balance. SMS costs ${SMS_COST}. Please add credits.")
        
        headers = {
            "Authorization": f"Bearer {TELNYX_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "from": request.from_number,
            "to": request.to_number,
            "text": request.text
        }
        
        response = requests.post(
            f"{TELNYX_API_BASE}/messages",
            json=payload,
            headers=headers,
            timeout=10
        )
        
        if response.status_code not in [200, 201]:
            logger.error(f"Telnyx SMS error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=f"Failed to send SMS: {response.text}")
        
        result = response.json()
        message_data = result.get('data', {})
        
        # Deduct credits
        new_balance = wallet["balance"] - SMS_COST
        await db.wallets.update_one(
            {"user_id": current_user["_id"]},
            {
                "$set": {
                    "balance": new_balance,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Log transaction
        transaction = {
            "user_id": current_user["_id"],
            "type": "debit",
            "amount": SMS_COST,
            "description": f"SMS to {request.to_number}",
            "balance_after": new_balance,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        # Save to database
        sms_doc = {
            "_id": message_data.get('id', str(datetime.now(timezone.utc).timestamp())),
            "user_id": current_user["_id"],
            "from_number": request.from_number,
            "to_number": request.to_number,
            "text": request.text,
            "direction": "outbound",
            "status": message_data.get('status', 'sent'),
            "cost": SMS_COST,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "telnyx_id": message_data.get('id')
        }
        
        await db.sms_messages.insert_one(sms_doc)
        
        logger.info(f"SMS sent from {request.from_number} to {request.to_number}, cost: ${SMS_COST}")
        
        return {
            "success": True,
            "message_id": message_data.get('id'),
            "status": "sent",
            "cost": SMS_COST,
            "new_balance": new_balance
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send SMS: {str(e)}")

@router.get("/inbox")
async def get_sms_inbox(current_user = Depends(get_current_user)):
    """
    Get all SMS messages for the current user.
    """
    try:
        # Get from database
        cursor = db.sms_messages.find({"user_id": current_user["_id"]})
        messages = await cursor.sort("created_at", -1).to_list(length=100)
        
        result = []
        for msg in messages:
            result.append({
                "id": msg["_id"],
                "from_number": msg["from_number"],
                "to_number": msg["to_number"],
                "text": msg["text"],
                "direction": msg["direction"],
                "status": msg["status"],
                "created_at": msg["created_at"]
            })
        
        return {"messages": result, "total": len(result)}
        
    except Exception as e:
        logger.error(f"Error fetching SMS inbox: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch messages")

@router.get("/number/{phone_number}")
async def get_sms_for_number(phone_number: str, current_user = Depends(get_current_user)):
    """
    Get all SMS messages for a specific number.
    """
    try:
        # Verify user owns the number
        number = await db.purchased_numbers.find_one({
            "phone_number": phone_number,
            "user_id": current_user["_id"]
        })
        
        if not number:
            raise HTTPException(status_code=403, detail="You don't own this number")
        
        # Get messages
        cursor = db.sms_messages.find({
            "user_id": current_user["_id"],
            "$or": [
                {"from_number": phone_number},
                {"to_number": phone_number}
            ]
        })
        messages = await cursor.sort("created_at", -1).to_list(length=100)
        
        result = []
        for msg in messages:
            result.append({
                "id": msg["_id"],
                "from_number": msg["from_number"],
                "to_number": msg["to_number"],
                "text": msg["text"],
                "direction": msg["direction"],
                "status": msg["status"],
                "created_at": msg["created_at"]
            })
        
        return {"messages": result, "total": len(result)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching messages: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch messages")

@router.post("/webhook")
async def telnyx_webhook(request: Request):
    """
    Webhook endpoint to receive incoming SMS from Telnyx.
    Configure this URL in your Telnyx Messaging Profile:
    https://your-domain.com/api/sms/webhook
    """
    try:
        payload = await request.json()
        logger.info(f"Received Telnyx webhook: {payload.get('data', {}).get('event_type')}")
        
        # Extract event data
        data = payload.get('data', {})
        event_type = data.get('event_type', '')
        
        # Handle incoming message
        if event_type == 'message.received':
            payload_data = data.get('payload', {})
            
            from_number = payload_data.get('from', {}).get('phone_number', '')
            to_number = payload_data.get('to', [{}])[0].get('phone_number', '')
            text = payload_data.get('text', '')
            message_id = payload_data.get('id', '')
            
            # Find which user owns this number
            number = await db.purchased_numbers.find_one({
                "phone_number": to_number,
                "status": "active"
            })
            
            if number:
                # Save incoming message
                sms_doc = {
                    "_id": message_id,
                    "user_id": number["user_id"],
                    "from_number": from_number,
                    "to_number": to_number,
                    "text": text,
                    "direction": "inbound",
                    "status": "received",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "telnyx_id": message_id
                }
                
                await db.sms_messages.insert_one(sms_doc)
                logger.info(f"Saved incoming SMS from {from_number} to {to_number}")
            else:
                logger.warning(f"Received SMS for unknown number: {to_number}")
        
        # Respond to Telnyx
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        # Return 200 even on error to prevent Telnyx retries
        return {"status": "error", "message": str(e)}