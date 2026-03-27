"""
SMMWiz Social Media Marketing Models
Defines Pydantic models for SMM services, orders, and pricing
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ServiceCategory(str, Enum):
    """Available SMM service categories"""
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    TELEGRAM = "telegram"
    OTHER = "other"


class OrderStatus(str, Enum):
    """Order status values"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"
    CANCELLED = "cancelled"


class SMMService(BaseModel):
    """SMM service from provider catalog"""
    service_id: str
    name: str
    category: ServiceCategory
    description: str
    provider_price: float = Field(..., description="Cost from SMMWiz")
    reseller_price: float = Field(..., description="Price with 100% markup")
    profit_margin: float = Field(..., description="Profit per order")
    min_quantity: int
    max_quantity: int
    rate_per_1000: Optional[float] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "service_id": "1",
                "name": "Instagram Followers",
                "category": "instagram",
                "description": "Real Instagram Followers - High Quality",
                "provider_price": 2.50,
                "reseller_price": 5.00,
                "profit_margin": 2.50,
                "min_quantity": 10,
                "max_quantity": 50000
            }
        }


class CreateSMMOrderRequest(BaseModel):
    """Request to create a new SMM order"""
    service_id: str
    quantity: int = Field(..., ge=1)
    target_url: Optional[str] = None
    target_username: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "service_id": "1",
                "quantity": 1000,
                "target_username": "@mycalliotelempire"
            }
        }


class SMMOrder(BaseModel):
    """SMM order document"""
    id: str
    user_id: str
    service_id: str
    service_name: str
    quantity: int
    total_cost: float
    profit_earned: float
    status: OrderStatus
    target_url: Optional[str] = None
    target_username: Optional[str] = None
    provider_order_id: Optional[str] = None
    progress: int = Field(default=0, ge=0, le=100)
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "smm_abc123",
                "user_id": "user_123",
                "service_id": "1",
                "service_name": "Instagram Followers",
                "quantity": 1000,
                "total_cost": 5.00,
                "profit_earned": 2.50,
                "status": "processing",
                "target_username": "@mycalliotelempire",
                "provider_order_id": "5678",
                "progress": 50,
                "created_at": "2025-12-30T10:00:00Z",
                "updated_at": "2025-12-30T10:30:00Z"
            }
        }


class SMMOrderResponse(BaseModel):
    """Response for order queries"""
    success: bool
    order: Optional[SMMOrder] = None
    message: Optional[str] = None
