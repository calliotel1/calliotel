from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timezone
import os
import secrets
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Reseller Tiers with wholesale rates
RESELLER_TIERS = {
    "basic": {
        "name": "Basic Reseller",
        "wholesale_number_price": 0.80,
        "wholesale_sms_price": 0.03,
        "wholesale_call_price": 0.01,
        "min_monthly_volume": 0,
        "commission_rate": 0.40  # 40% commission on retail price
    },
    "pro": {
        "name": "Pro Reseller",
        "wholesale_number_price": 0.70,
        "wholesale_sms_price": 0.025,
        "wholesale_call_price": 0.008,
        "min_monthly_volume": 50,
        "commission_rate": 0.45  # 45% commission
    },
    "enterprise": {
        "name": "Enterprise Reseller",
        "wholesale_number_price": 0.60,
        "wholesale_sms_price": 0.02,
        "wholesale_call_price": 0.006,
        "min_monthly_volume": 200,
        "commission_rate": 0.50  # 50% commission
    }
}

class ResellerApplication(BaseModel):
    company_name: str
    contact_name: str
    email: EmailStr
    phone: str
    website: Optional[str] = None
    expected_monthly_volume: int
    business_description: str

class ResellerApproval(BaseModel):
    application_id: str
    tier: str  # basic, pro, enterprise

class ResellerStats(BaseModel):
    reseller_id: str
    total_customers: int
    total_revenue: float
    total_commission: float
    api_calls_today: int
    numbers_sold: int
    active_numbers: int

@router.post("/resellers/apply")
async def apply_for_reseller_program(application: ResellerApplication):
    """Apply to become a reseller"""
    try:
        # Check if email already exists
        existing = await db.reseller_applications.find_one({"email": application.email}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Application already exists for this email")
        
        # Determine suggested tier based on expected volume
        suggested_tier = "basic"
        if application.expected_monthly_volume >= 200:
            suggested_tier = "enterprise"
        elif application.expected_monthly_volume >= 50:
            suggested_tier = "pro"
        
        # Create application
        app_data = {
            "application_id": f"APP-{secrets.token_hex(4).upper()}",
            "company_name": application.company_name,
            "contact_name": application.contact_name,
            "email": application.email,
            "phone": application.phone,
            "website": application.website,
            "expected_monthly_volume": application.expected_monthly_volume,
            "business_description": application.business_description,
            "suggested_tier": suggested_tier,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "reviewed_at": None
        }
        
        await db.reseller_applications.insert_one(app_data)
        
        return {
            "message": "Application submitted successfully",
            "application_id": app_data["application_id"],
            "suggested_tier": suggested_tier,
            "status": "pending",
            "next_steps": "Our team will review your application within 24-48 hours"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Application error: {str(e)}")

@router.post("/resellers/approve")
async def approve_reseller_application(approval: ResellerApproval):
    """Admin: Approve a reseller application"""
    try:
        # Get application
        application = await db.reseller_applications.find_one(
            {"application_id": approval.application_id},
            {"_id": 0}
        )
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        if application["status"] != "pending":
            raise HTTPException(status_code=400, detail="Application already processed")
        
        # Generate API key
        api_key = f"rs_{secrets.token_urlsafe(32)}"
        api_secret = secrets.token_urlsafe(48)
        
        tier_info = RESELLER_TIERS.get(approval.tier, RESELLER_TIERS["basic"])
        
        # Create reseller account
        reseller = {
            "reseller_id": f"RS-{secrets.token_hex(4).upper()}",
            "company_name": application["company_name"],
            "contact_name": application["contact_name"],
            "email": application["email"],
            "phone": application["phone"],
            "website": application.get("website"),
            "tier": approval.tier,
            "tier_name": tier_info["name"],
            "wholesale_rates": {
                "number_price": tier_info["wholesale_number_price"],
                "sms_price": tier_info["wholesale_sms_price"],
                "call_price": tier_info["wholesale_call_price"]
            },
            "commission_rate": tier_info["commission_rate"],
            "api_key": api_key,
            "api_secret": api_secret,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "stats": {
                "total_customers": 0,
                "total_revenue": 0,
                "total_commission": 0,
                "numbers_sold": 0
            }
        }
        
        await db.resellers.insert_one(reseller)
        
        # Update application status
        await db.reseller_applications.update_one(
            {"application_id": approval.application_id},
            {"$set": {
                "status": "approved",
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
                "reseller_id": reseller["reseller_id"]
            }}
        )
        
        return {
            "message": "Reseller approved successfully",
            "reseller_id": reseller["reseller_id"],
            "api_key": api_key,
            "api_secret": api_secret,
            "tier": approval.tier,
            "wholesale_rates": reseller["wholesale_rates"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Approval error: {str(e)}")

@router.get("/resellers/dashboard/{reseller_id}")
async def get_reseller_dashboard(reseller_id: str, api_key: str = Header(None, alias="X-API-Key")):
    """Get reseller dashboard stats"""
    try:
        # Verify API key
        reseller = await db.resellers.find_one(
            {"reseller_id": reseller_id, "api_key": api_key},
            {"_id": 0}
        )
        
        if not reseller:
            raise HTTPException(status_code=401, detail="Invalid API key or reseller ID")
        
        # Get customer count
        customers = await db.reseller_customers.count_documents({"reseller_id": reseller_id})
        
        # Get sales data
        sales = await db.reseller_sales.find({"reseller_id": reseller_id}, {"_id": 0}).to_list(1000)
        
        total_revenue = sum(sale.get("amount", 0) for sale in sales)
        total_commission = sum(sale.get("commission", 0) for sale in sales)
        numbers_sold = len([s for s in sales if s.get("type") == "number"])
        
        return ResellerStats(
            reseller_id=reseller_id,
            total_customers=customers,
            total_revenue=total_revenue,
            total_commission=total_commission,
            api_calls_today=0,  # TODO: Implement API call tracking
            numbers_sold=numbers_sold,
            active_numbers=numbers_sold  # Simplified
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")

@router.post("/resellers/api/purchase-number")
async def reseller_purchase_number(
    phone_number: str,
    customer_email: str,
    api_key: str = Header(None, alias="X-API-Key")
):
    """Reseller API: Purchase a number for a customer"""
    try:
        # Verify reseller API key
        reseller = await db.resellers.find_one({"api_key": api_key}, {"_id": 0})
        
        if not reseller:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Check if number is available
        number_doc = await db.phone_numbers.find_one(
            {"phone_number": phone_number, "status": "available"},
            {"_id": 0}
        )
        
        if not number_doc:
            raise HTTPException(status_code=404, detail="Number not available")
        
        # Calculate pricing
        wholesale_price = reseller["wholesale_rates"]["number_price"]
        retail_price = 2.00  # Standard retail
        commission = retail_price - wholesale_price
        
        # Reserve number
        await db.phone_numbers.update_one(
            {"phone_number": phone_number},
            {"$set": {
                "status": "reserved",
                "reseller_id": reseller["reseller_id"],
                "customer_email": customer_email,
                "reserved_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Record sale
        sale = {
            "sale_id": f"SALE-{secrets.token_hex(4).upper()}",
            "reseller_id": reseller["reseller_id"],
            "type": "number",
            "phone_number": phone_number,
            "customer_email": customer_email,
            "wholesale_price": wholesale_price,
            "retail_price": retail_price,
            "commission": commission,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await db.reseller_sales.insert_one(sale)
        
        # Update reseller stats
        await db.resellers.update_one(
            {"reseller_id": reseller["reseller_id"]},
            {
                "$inc": {
                    "stats.numbers_sold": 1,
                    "stats.total_revenue": wholesale_price,
                    "stats.total_commission": commission
                }
            }
        )
        
        return {
            "success": True,
            "sale_id": sale["sale_id"],
            "phone_number": phone_number,
            "wholesale_price": wholesale_price,
            "your_profit": commission,
            "customer_email": customer_email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Purchase error: {str(e)}")

@router.get("/resellers/wholesale-rates")
async def get_wholesale_rates():
    """Public: View wholesale rates for each tier"""
    return {
        "tiers": RESELLER_TIERS,
        "how_it_works": "Apply to become a reseller, get approved, receive API keys, and start selling at wholesale prices",
        "support": "Email: resellers@calliotel.com"
    }
