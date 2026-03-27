"""
Sonetel Virtual Number Models
MongoDB schemas for Sonetel number management
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SonetelNumber(BaseModel):
    """Virtual number from Sonetel"""
    number_id: str  # Sonetel's internal ID
    phone_number: str  # E.164 format (e.g., +14155551234)
    country: str  # US, UK, CA, etc.
    country_name: str  # United States, United Kingdom, etc.
    city: Optional[str] = None  # New York, London, etc.
    number_type: str  # local, toll_free, mobile
    monthly_cost: float  # Cost in USD (from Sonetel API)
    setup_fee: float = 0.0
    features: List[str] = []  # ["voice", "sms", "fax"]
    is_available: bool = True


class SonetelSubscription(BaseModel):
    """User's active Sonetel number subscription"""
    subscription_id: str
    user_id: str  # Calliotel user ID
    sonetel_number_id: str  # Links to SonetelNumber
    phone_number: str
    country: str
    
    # Pricing
    monthly_cost: float  # What user pays (with markup)
    provider_cost: float  # What we pay Sonetel
    profit_margin: float  # monthly_cost - provider_cost
    
    # Status
    status: str  # active, cancelled, suspended
    auto_renew: bool = True
    
    # Dates
    purchase_date: str  # ISO datetime
    next_renewal_date: str  # ISO datetime
    cancellation_date: Optional[str] = None
    
    # Forwarding settings
    forward_to: Optional[str] = None  # User's destination number
    voicemail_enabled: bool = False


class SonetelPurchaseRequest(BaseModel):
    """Request to purchase a Sonetel number"""
    phone_number: str
    country: str
    forward_to: Optional[str] = None  # Where to forward calls
    auto_renew: bool = True


class SonetelAvailableNumbersRequest(BaseModel):
    """Request to search available numbers"""
    country: str = "US"  # ISO country code
    city: Optional[str] = None
    contains: Optional[str] = None  # Search for numbers containing digits
    limit: int = 20
