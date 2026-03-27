from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# ============================================
# TELECOM DATABASE MODELS
# ============================================

class NumberStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"

class MessageStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    RECEIVED = "received"

class CallStatus(str, Enum):
    INITIATED = "initiated"
    RINGING = "ringing"
    ANSWERED = "answered"
    COMPLETED = "completed"
    FAILED = "failed"
    BUSY = "busy"
    NO_ANSWER = "no_answer"

class ProviderType(str, Enum):
    MSG91 = "msg91"
    CLICKATELL = "clickatell"
    UNIFONIC = "unifonic"
    INFOBIP = "infobip"
    TWILIO = "twilio"
    TELNYX = "telnyx"
    GENERIC_SIP = "generic_sip"

# ============================================
# VIRTUAL NUMBERS
# ============================================

class VirtualNumber(BaseModel):
    """Virtual phone number model"""
    id: str = Field(..., description="Unique number ID")
    number: str = Field(..., description="E.164 format phone number")
    country_code: str = Field(..., description="ISO country code (e.g., US, LB, AE)")
    country: str = Field(..., description="Country name")
    provider: ProviderType
    provider_number_id: Optional[str] = Field(None, description="Provider's internal number ID")
    
    # Ownership
    user_id: Optional[str] = Field(None, description="Owner user ID")
    purchased_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
    # Status & Config
    status: NumberStatus = NumberStatus.AVAILABLE
    capabilities: Dict[str, bool] = Field(default_factory=lambda: {
        "sms": True,
        "voice": True,
        "mms": False
    })
    
    # Pricing
    monthly_cost: float = Field(..., description="Monthly cost in USD")
    setup_fee: float = Field(default=0.0)
    selling_price: float = Field(..., description="Price to customer")
    
    # SMS Config
    sms_webhook_url: Optional[str] = None
    voice_webhook_url: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "num_abc123",
                "number": "+12025551234",
                "country_code": "US",
                "country": "United States",
                "provider": "msg91",
                "status": "available",
                "monthly_cost": 1.00,
                "selling_price": 2.50
            }
        }

# ============================================
# SMS MESSAGES
# ============================================

class SMSMessage(BaseModel):
    """SMS message model"""
    id: str = Field(..., description="Unique message ID")
    
    # Direction
    direction: str = Field(..., description="inbound or outbound")
    
    # Phone numbers
    from_number: str = Field(..., description="Sender phone number")
    to_number: str = Field(..., description="Recipient phone number")
    
    # Content
    message: str = Field(..., description="Message text")
    
    # Status & Tracking
    status: MessageStatus = MessageStatus.PENDING
    provider: ProviderType
    provider_message_id: Optional[str] = None
    
    # User & Number association
    user_id: str
    virtual_number_id: Optional[str] = None
    
    # Pricing
    cost: float = Field(default=0.0, description="Cost in USD")
    
    # Delivery info
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "msg_xyz789",
                "direction": "outbound",
                "from_number": "+12025551234",
                "to_number": "+96170123456",
                "message": "Hello from Calliotel!",
                "status": "sent",
                "provider": "msg91",
                "user_id": "user_123"
            }
        }

# ============================================
# VOICE CALLS
# ============================================

class VoiceCall(BaseModel):
    """Voice call model"""
    id: str = Field(..., description="Unique call ID")
    
    # Direction
    direction: str = Field(..., description="inbound or outbound")
    
    # Phone numbers
    from_number: str = Field(..., description="Caller phone number")
    to_number: str = Field(..., description="Callee phone number")
    
    # Call details
    status: CallStatus = CallStatus.INITIATED
    duration_seconds: int = Field(default=0)
    
    # Provider
    provider: ProviderType
    provider_call_id: Optional[str] = None
    
    # User & Number association
    user_id: str
    virtual_number_id: Optional[str] = None
    
    # Recording
    recording_url: Optional[str] = None
    
    # Pricing
    cost: float = Field(default=0.0, description="Cost in USD")
    rate_per_minute: float = Field(default=0.0)
    
    # Timestamps
    initiated_at: datetime = Field(default_factory=datetime.utcnow)
    answered_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "call_def456",
                "direction": "outbound",
                "from_number": "+12025551234",
                "to_number": "+96170123456",
                "status": "completed",
                "duration_seconds": 120,
                "provider": "msg91",
                "user_id": "user_123"
            }
        }

# ============================================
# PROVIDER CONFIGURATIONS
# ============================================

class ProviderConfig(BaseModel):
    """Provider configuration model"""
    id: str
    provider: ProviderType
    name: str = Field(..., description="Display name")
    
    # Status
    enabled: bool = Field(default=True)
    priority: int = Field(default=1, description="Lower = higher priority")
    
    # Credentials (encrypted in production!)
    credentials: Dict[str, str] = Field(default_factory=dict, description="API keys, tokens, etc.")
    
    # Configuration
    config: Dict[str, Any] = Field(default_factory=dict, description="Provider-specific settings")
    
    # Capabilities
    supports_sms: bool = True
    supports_voice: bool = True
    supports_mms: bool = False
    
    # Pricing (default rates)
    default_sms_rate: float = 0.01
    default_voice_rate: float = 0.01
    
    # Health
    last_check: Optional[datetime] = None
    is_healthy: bool = True
    error_count: int = 0
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ============================================
# NUMBER INVENTORY
# ============================================

class NumberInventoryItem(BaseModel):
    """Number in provider's inventory (not yet purchased)"""
    number: str
    country_code: str
    country: str
    provider: ProviderType
    capabilities: Dict[str, bool]
    monthly_cost: float
    setup_fee: float
    is_available: bool = True
