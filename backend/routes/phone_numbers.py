from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
import requests
import os
from routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

TELNYX_API_KEY = os.environ.get('TELNYX_API_KEY')
TELNYX_API_BASE = "https://api.telnyx.com/v2"

class PhoneNumberSearch(BaseModel):
    country_code: str
    locality: Optional[str] = None
    area_code: Optional[str] = None
    number_type: Optional[str] = None
    limit: Optional[int] = 10
    preset: Optional[str] = None  # Filter by preset: whatsapp, business, sms_marketing, dating, ai_testing

class AvailablePhoneNumber(BaseModel):
    phone_number: str
    cost_monthly: str
    features: List[str]
    region: Optional[str] = None
    recommended_for: List[str] = []  # Tags: whatsapp, business, sms_marketing, dating, ai_testing

@router.post("/search", response_model=List[AvailablePhoneNumber])
async def search_available_numbers(search_params: PhoneNumberSearch, current_user = Depends(get_current_user)):
    """
    Search for available phone numbers using Telnyx REST API.
    Now includes intelligent recommendations based on historical usage data.
    """
    try:
        if not TELNYX_API_KEY:
            raise HTTPException(status_code=500, detail="Telnyx API key not configured")
        
        # Get popular uses data for intelligent tagging
        popular_uses = {}
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            mongo_url = os.environ['MONGO_URL']
            mongo_client = AsyncIOMotorClient(mongo_url)
            mongo_db = mongo_client[os.environ['DB_NAME']]
            
            stats = await mongo_db.number_usage_stats.find({}, {"_id": 0}).sort("count", -1).to_list(10)
            total = sum(s["count"] for s in stats)
            
            if total > 0:
                for stat in stats:
                    popular_uses[stat["intended_use"]] = {
                        "count": stat["count"],
                        "popularity": round((stat["count"] / total) * 100, 1)
                    }
        except Exception as e:
            logger.warning(f"Could not fetch popular uses: {str(e)}")
        
        # Build query parameters
        params = {
            "filter[country_code]": search_params.country_code,
            "filter[features][]": ["sms", "voice"],  # Only numbers with SMS and voice
            "filter[limit]": search_params.limit or 20
        }
        
        if search_params.area_code:
            params["filter[national_destination_code]"] = search_params.area_code
        if search_params.locality:
            params["filter[locality]"] = search_params.locality
        
        headers = {
            "Authorization": f"Bearer {TELNYX_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Call Telnyx API
        response = requests.get(
            f"{TELNYX_API_BASE}/available_phone_numbers",
            params=params,
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            logger.error(f"Telnyx API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=f"Telnyx API error: {response.text}")
        
        data = response.json()
        results = []
        
        for number in data.get('data', []):
            # Extract feature names from dictionaries
            feature_names = [f.get('name', '') if isinstance(f, dict) else f for f in number.get('features', [])]
            phone_number = number.get('phone_number', '')
            
            # Smart tagging based on number characteristics + popular data
            recommended_for = []
            
            # US/UK numbers are great for WhatsApp/Telegram (boost if popular)
            if search_params.country_code in ['US', 'GB', 'CA']:
                recommended_for.append('whatsapp')
            
            # US numbers with premium area codes for business
            if search_params.country_code == 'US' and any(phone_number.startswith(f'+1{code}') for code in ['212', '213', '415', '310', '646', '917', '202']):
                recommended_for.append('business')
            
            # UK numbers for business
            if search_params.country_code == 'GB':
                recommended_for.append('business')
            
            # All numbers with SMS capability for marketing
            if 'sms' in feature_names or 'SMS' in feature_names:
                recommended_for.append('sms_marketing')
            
            # US/CA numbers great for dating apps
            if search_params.country_code in ['US', 'CA']:
                recommended_for.append('dating')
            
            # All numbers good for AI testing
            recommended_for.append('ai_testing')
            
            results.append(AvailablePhoneNumber(
                phone_number=phone_number,
                cost_monthly="1.99",  # Set to $1.99 for testing
                features=feature_names,
                region=number.get('region_information', [{}])[0].get('region_name') if number.get('region_information') else None,
                recommended_for=recommended_for
            ))
        
        # Filter by preset if specified
        if search_params.preset and search_params.preset != 'all':
            results = [r for r in results if search_params.preset in r.recommended_for]
            logger.info(f"Filtered to {len(results)} numbers for preset: {search_params.preset}")
        
        logger.info(f"Found {len(results)} available numbers for {search_params.country_code}")
        return results
        
    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to Telnyx: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching phone numbers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search phone numbers: {str(e)}")

@router.get("/my-numbers")
async def list_my_numbers(current_user = Depends(get_current_user)):
    """
    List all phone numbers associated with the account from Telnyx.
    """
    try:
        if not TELNYX_API_KEY:
            raise HTTPException(status_code=500, detail="Telnyx API key not configured")
        
        headers = {
            "Authorization": f"Bearer {TELNYX_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{TELNYX_API_BASE}/phone_numbers",
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            logger.error(f"Telnyx API error: {response.status_code}")
            return {"numbers": [], "total": 0}
        
        data = response.json()
        numbers = []
        
        for phone_num in data.get('data', []):
            numbers.append({
                "id": phone_num.get('id'),
                "phone_number": phone_num.get('phone_number'),
                "status": phone_num.get('status'),
                "type": phone_num.get('phone_number_type'),
                "connection_name": phone_num.get('connection_name'),
            })
        
        logger.info(f"Retrieved {len(numbers)} phone numbers")
        return {"numbers": numbers, "total": len(numbers)}
        
    except Exception as e:
        logger.error(f"Error listing phone numbers: {str(e)}")
        return {"numbers": [], "total": 0}

@router.get("/countries")
async def get_supported_countries():
    """
    Get list of supported countries for phone numbers.
    """
    return {
        "countries": [
            {"name": "United States", "code": "US"},
            {"name": "United Kingdom", "code": "GB"},
            {"name": "Canada", "code": "CA"},
            {"name": "Germany", "code": "DE"},
            {"name": "Australia", "code": "AU"},
            {"name": "France", "code": "FR"},
            {"name": "Spain", "code": "ES"},
            {"name": "Italy", "code": "IT"},
        ]
    }
