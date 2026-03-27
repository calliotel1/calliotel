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

class MakeCallRequest(BaseModel):
    from_number: str
    to_number: str
    connection_id: Optional[str] = None

class CallLog(BaseModel):
    id: str
    from_number: str
    to_number: str
    direction: str
    duration: int
    status: str
    created_at: str
    cost: Optional[str] = None

@router.post("/make-call")
async def make_call(request: MakeCallRequest, current_user = Depends(get_current_user)):
    """
    Initiate an outbound call using Telnyx Voice API.
    Requires: Connection ID (Voice Application) configured in Telnyx.
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
        
        # Check wallet balance (estimate $0.02/min, reserve for 1 minute)
        CALL_RESERVE = 0.02
        wallet = await db.wallets.find_one({"user_id": current_user["_id"]})
        if not wallet or wallet["balance"] < CALL_RESERVE:
            raise HTTPException(status_code=402, detail=f"Insufficient balance. Calls cost ~${CALL_RESERVE}/min. Please add credits.")
        
        # Note: connection_id is required - user needs to create a Voice Application in Telnyx
        if not request.connection_id:
            raise HTTPException(
                status_code=400, 
                detail="connection_id required. Create a Voice Application in Telnyx Portal and provide its ID."
            )
        
        headers = {
            "Authorization": f"Bearer {TELNYX_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "to": request.to_number,
            "from": request.from_number,
            "connection_id": request.connection_id
        }
        
        response = requests.post(
            f"{TELNYX_API_BASE}/calls",
            json=payload,
            headers=headers,
            timeout=10
        )
        
        if response.status_code not in [200, 201]:
            logger.error(f"Telnyx call error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=f"Failed to initiate call: {response.text}")
        
        result = response.json()
        call_data = result.get('data', {})
        
        # Store initial call record
        call_doc = {
            "_id": call_data.get('call_control_id', str(datetime.now(timezone.utc).timestamp())),
            "user_id": current_user["_id"],
            "call_control_id": call_data.get('call_control_id'),
            "from_number": request.from_number,
            "to_number": request.to_number,
            "direction": "outbound",
            "status": "initiated",
            "duration": 0,
            "cost": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "telnyx_id": call_data.get('call_control_id')
        }
        
        await db.calls.insert_one(call_doc)
        
        logger.info(f"Call initiated from {request.from_number} to {request.to_number}")
        
        return {
            "success": True,
            "call_control_id": call_data.get('call_control_id'),
            "status": "initiated",
            "message": "Call initiated. Will be tracked via webhook."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error making call: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to initiate call: {str(e)}")

@router.post("/webhook")
async def telnyx_call_webhook(request: Request):
    """
    Webhook endpoint to receive call events from Telnyx.
    Configure this URL in your Telnyx Voice Application:
    https://your-domain.com/api/calls/webhook
    """
    try:
        payload = await request.json()
        logger.info(f"Received Telnyx call webhook: {payload.get('data', {}).get('event_type')}")
        
        data = payload.get('data', {})
        event_type = data.get('event_type', '')
        call_payload = data.get('payload', {})
        
        call_control_id = call_payload.get('call_control_id', '')
        
        # Find call record
        call_record = await db.calls.find_one({"call_control_id": call_control_id})
        
        if event_type == 'call.answered':
            # Update call status
            if call_record:
                await db.calls.update_one(
                    {"call_control_id": call_control_id},
                    {"$set": {"status": "answered", "answered_at": datetime.now(timezone.utc).isoformat()}}
                )
            logger.info(f"Call {call_control_id} answered")
            
        elif event_type == 'call.hangup':
            # Final call event - calculate cost and duration
            if call_record:
                # Get duration from payload or calculate
                duration_secs = call_payload.get('duration_seconds', 0)
                
                # Calculate cost ($0.02 per minute)
                COST_PER_MINUTE = 0.02
                duration_minutes = duration_secs / 60
                call_cost = round(duration_minutes * COST_PER_MINUTE, 4)
                
                # Update call record
                await db.calls.update_one(
                    {"call_control_id": call_control_id},
                    {
                        "$set": {
                            "status": "completed",
                            "duration": duration_secs,
                            "cost": call_cost,
                            "ended_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                # Deduct from wallet
                if call_record.get("user_id"):
                    wallet = await db.wallets.find_one({"user_id": call_record["user_id"]})
                    if wallet:
                        new_balance = max(0, wallet["balance"] - call_cost)
                        await db.wallets.update_one(
                            {"user_id": call_record["user_id"]},
                            {
                                "$set": {
                                    "balance": new_balance,
                                    "updated_at": datetime.now(timezone.utc).isoformat()
                                }
                            }
                        )
                        
                        # Log transaction
                        transaction = {
                            "user_id": call_record["user_id"],
                            "type": "debit",
                            "amount": call_cost,
                            "description": f"Call to {call_record['to_number']} ({duration_secs}s)",
                            "balance_after": new_balance,
                            "created_at": datetime.now(timezone.utc).isoformat()
                        }
                        await db.transactions.insert_one(transaction)
                
                logger.info(f"Call {call_control_id} ended. Duration: {duration_secs}s, Cost: ${call_cost}")
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Error processing call webhook: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.get("/history")
async def get_call_history(current_user = Depends(get_current_user)):
    """
    Get call history for the current user from database.
    """
    try:
        # Get calls from database
        cursor = db.calls.find({"user_id": current_user["_id"]})
        calls = await cursor.sort("created_at", -1).to_list(length=100)
        
        result = []
        for call in calls:
            result.append({
                "id": call.get("_id", ""),
                "from_number": call["from_number"],
                "to_number": call["to_number"],
                "direction": call["direction"],
                "duration": call.get("duration", 0),
                "status": call["status"],
                "created_at": call["created_at"],
                "cost": str(call.get("cost", "0.00"))
            })
        
        logger.info(f"Retrieved {len(result)} call records for user")
        return {"calls": result, "total": len(result)}
        
    except Exception as e:
        logger.error(f"Error fetching call history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch call history")

@router.get("/stats")
async def get_call_stats(current_user = Depends(get_current_user)):
    """
    Get call statistics for the current user.
    """
    try:
        # This would aggregate call data
        # For now, return basic stats
        return {
            "total_calls": 0,
            "total_duration": 0,
            "total_cost": "0.00",
            "incoming_calls": 0,
            "outgoing_calls": 0
        }
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        return {
            "total_calls": 0,
            "total_duration": 0,
            "total_cost": "0.00"
        }