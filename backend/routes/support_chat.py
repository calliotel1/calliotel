from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
import uuid

load_dotenv()

router = APIRouter()

# In-memory storage for chat sessions (in production, use database)
chat_sessions = {}
support_tickets = []

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class EscalateRequest(BaseModel):
    session_id: str
    reason: str
    user_email: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    is_ai: bool

class SupportTicket(BaseModel):
    ticket_id: str
    session_id: str
    reason: str
    user_email: Optional[str]
    created_at: str
    status: str

@router.post("/chat/send", response_model=ChatResponse)
async def send_chat_message(chat_msg: ChatMessage):
    """Send a message to the AI support chatbot"""
    try:
        # Get or create session
        session_id = chat_msg.session_id or str(uuid.uuid4())
        
        # Get API key from environment
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        # Create or get chat instance
        if session_id not in chat_sessions:
            system_message = """You are a helpful customer support agent for Calliotel, a premium virtual phone number and SMS service provider.

Key information about Calliotel:
- Offers virtual phone numbers in 50+ countries
- Pricing: Numbers from $2.99/mo, SMS $0.05/msg, Calls $0.02/min
- Features: SMS, Voice calls, WhatsApp integration, Multi-carrier redundancy
- Uptime: 99.98% carrier-grade infrastructure
- Support: 24/7 technical support available

You can help with:
- Account questions
- Number availability and pricing
- Technical issues with SMS/calls
- Billing questions
- API/integration support

Be friendly, professional, and concise. If a question requires human expertise (billing issues, complex technical problems, account access), suggest the user escalate to a human agent.

Always respond in a helpful, solution-oriented way."""

            chat_sessions[session_id] = LlmChat(
                api_key=api_key,
                session_id=session_id,
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
        
        chat = chat_sessions[session_id]
        
        # Send message and get response
        user_message = UserMessage(text=chat_msg.message)
        response = await chat.send_message(user_message)
        
        return ChatResponse(
            response=response,
            session_id=session_id,
            is_ai=True
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@router.post("/chat/escalate", response_model=SupportTicket)
async def escalate_to_human(escalate: EscalateRequest):
    """Escalate the conversation to a human agent"""
    try:
        ticket_id = f"TICKET-{str(uuid.uuid4())[:8].upper()}"
        
        ticket = {
            "ticket_id": ticket_id,
            "session_id": escalate.session_id,
            "reason": escalate.reason,
            "user_email": escalate.user_email,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "pending"
        }
        
        support_tickets.append(ticket)
        
        # In production: Send email notification to support team
        # send_email_to_support_team(ticket)
        
        return SupportTicket(**ticket)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Escalation error: {str(e)}")

@router.get("/chat/tickets")
async def get_support_tickets():
    """Get all support tickets (admin only in production)"""
    return {"tickets": support_tickets}

@router.delete("/chat/session/{session_id}")
async def clear_chat_session(session_id: str):
    """Clear a chat session"""
    if session_id in chat_sessions:
        del chat_sessions[session_id]
    return {"message": "Session cleared"}
