from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator
from typing import Optional
import logging
from telnyx_client import get_telnyx_client

logger = logging.getLogger(__name__)
router = APIRouter()

class SendSMSRequest(BaseModel):
    """SMS message request."""
    from_number: str
    to_number: str
    text: str
    
    @validator('to_number', 'from_number')
    def validate_phone_numbers(cls, v):
        if not v.startswith('+'):
            raise ValueError("Phone numbers must be in E.164 format (starting with +)")
        return v
    
    @validator('text')
    def text_not_empty(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("Message text cannot be empty")
        return v.strip()

class SendSMSResponse(BaseModel):
    """SMS send response."""
    message_id: str
    to: str
    from_number: str
    status: str

@router.post("/send-sms", response_model=SendSMSResponse)
async def send_sms(sms_request: SendSMSRequest):
    """
    Send an SMS message.
    """
    try:
        telnyx = get_telnyx_client()
        
        # Send SMS using Telnyx
        response = telnyx.Message.create(
            from_=sms_request.from_number,
            to=sms_request.to_number,
            text=sms_request.text,
        )
        
        message_data = response.get('data', {})
        
        logger.info(f"SMS sent from {sms_request.from_number} to {sms_request.to_number}")
        
        return SendSMSResponse(
            message_id=message_data.get('id', ''),
            to=sms_request.to_number,
            from_number=sms_request.from_number,
            status="sent",
        )
        
    except Exception as e:
        logger.error(f"Error sending SMS: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Failed to send SMS: {str(e)}")

@router.get("/messages")
async def list_messages():
    """
    List recent messages.
    """
    try:
        telnyx = get_telnyx_client()
        messages_response = telnyx.Message.list()
        
        messages = []
        for msg in messages_response.get('data', []):
            messages.append({
                "id": msg.get('id'),
                "from": msg.get('from', {}).get('phone_number'),
                "to": [t.get('phone_number') for t in msg.get('to', [])],
                "text": msg.get('text'),
                "direction": msg.get('direction'),
                "created_at": msg.get('created_at'),
            })
        
        return {"messages": messages, "total": len(messages)}
        
    except Exception as e:
        logger.error(f"Error listing messages: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve messages")