"""
Coverage Map API
Country coverage, pricing, and availability data
"""

from fastapi import APIRouter
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# Coverage data by country
COUNTRY_COVERAGE = [
    {
        "country": "United States",
        "code": "US",
        "flag": "🇺🇸",
        "price_from": 0.99,
        "currency": "USD",
        "features": ["4G SMS", "Voice", "MMS"],
        "availability": "available",
        "popular": True,
        "area_codes": ["+1"]
    },
    {
        "country": "United Kingdom",
        "code": "GB",
        "flag": "🇬🇧",
        "price_from": 1.49,
        "currency": "USD",
        "features": ["4G SMS", "Voice"],
        "availability": "available",
        "popular": True,
        "area_codes": ["+44"]
    },
    {
        "country": "Canada",
        "code": "CA",
        "flag": "🇨🇦",
        "price_from": 1.29,
        "currency": "USD",
        "features": ["4G SMS", "Voice", "MMS"],
        "availability": "available",
        "popular": True,
        "area_codes": ["+1"]
    },
    {
        "country": "Australia",
        "code": "AU",
        "flag": "🇦🇺",
        "price_from": 1.99,
        "currency": "USD",
        "features": ["4G SMS", "Voice"],
        "availability": "available",
        "popular": False,
        "area_codes": ["+61"]
    },
    {
        "country": "Germany",
        "code": "DE",
        "flag": "🇩🇪",
        "price_from": 1.79,
        "currency": "USD",
        "features": ["4G SMS", "Voice"],
        "availability": "available",
        "popular": False,
        "area_codes": ["+49"]
    },
    {
        "country": "France",
        "code": "FR",
        "flag": "🇫🇷",
        "price_from": 1.79,
        "currency": "USD",
        "features": ["4G SMS", "Voice"],
        "availability": "available",
        "popular": False,
        "area_codes": ["+33"]
    },
    {
        "country": "Netherlands",
        "code": "NL",
        "flag": "🇳🇱",
        "price_from": 1.69,
        "currency": "USD",
        "features": ["4G SMS", "Voice"],
        "availability": "available",
        "popular": False,
        "area_codes": ["+31"]
    },
    {
        "country": "Spain",
        "code": "ES",
        "flag": "🇪🇸",
        "price_from": 1.59,
        "currency": "USD",
        "features": ["4G SMS"],
        "availability": "available",
        "popular": False,
        "area_codes": ["+34"]
    },
    {
        "country": "Italy",
        "code": "IT",
        "flag": "🇮🇹",
        "price_from": 1.69,
        "currency": "USD",
        "features": ["4G SMS"],
        "availability": "available",
        "popular": False,
        "area_codes": ["+39"]
    },
    {
        "country": "Sweden",
        "code": "SE",
        "flag": "🇸🇪",
        "price_from": 1.89,
        "currency": "USD",
        "features": ["4G SMS", "Voice"],
        "availability": "available",
        "popular": False,
        "area_codes": ["+46"]
    },
    {
        "country": "Switzerland",
        "code": "CH",
        "flag": "🇨🇭",
        "price_from": 2.49,
        "currency": "USD",
        "features": ["4G SMS", "Voice"],
        "availability": "available",
        "popular": False,
        "area_codes": ["+41"]
    },
    {
        "country": "Belgium",
        "code": "BE",
        "flag": "🇧🇪",
        "price_from": 1.69,
        "currency": "USD",
        "features": ["4G SMS"],
        "availability": "available",
        "popular": False,
        "area_codes": ["+32"]
    },
    {
        "country": "Poland",
        "code": "PL",
        "flag": "🇵🇱",
        "price_from": 1.49,
        "currency": "USD",
        "features": ["4G SMS"],
        "availability": "available",
        "popular": False,
        "area_codes": ["+48"]
    },
    {
        "country": "Brazil",
        "code": "BR",
        "flag": "🇧🇷",
        "price_from": 1.99,
        "currency": "USD",
        "features": ["4G SMS"],
        "availability": "coming_soon",
        "popular": False,
        "area_codes": ["+55"]
    },
    {
        "country": "Mexico",
        "code": "MX",
        "flag": "🇲🇽",
        "price_from": 1.29,
        "currency": "USD",
        "features": ["4G SMS"],
        "availability": "coming_soon",
        "popular": False,
        "area_codes": ["+52"]
    },
    {
        "country": "Japan",
        "code": "JP",
        "flag": "🇯🇵",
        "price_from": 2.99,
        "currency": "USD",
        "features": ["4G SMS"],
        "availability": "coming_soon",
        "popular": False,
        "area_codes": ["+81"]
    },
    {
        "country": "Singapore",
        "code": "SG",
        "flag": "🇸🇬",
        "price_from": 2.49,
        "currency": "USD",
        "features": ["4G SMS", "Voice"],
        "availability": "available",
        "popular": False,
        "area_codes": ["+65"]
    },
    {
        "country": "New Zealand",
        "code": "NZ",
        "flag": "🇳🇿",
        "price_from": 2.29,
        "currency": "USD",
        "features": ["4G SMS"],
        "availability": "available",
        "popular": False,
        "area_codes": ["+64"]
    },
    {
        "country": "Ireland",
        "code": "IE",
        "flag": "🇮🇪",
        "price_from": 1.79,
        "currency": "USD",
        "features": ["4G SMS", "Voice"],
        "availability": "available",
        "popular": False,
        "area_codes": ["+353"]
    },
    {
        "country": "India",
        "code": "IN",
        "flag": "🇮🇳",
        "price_from": 0.79,
        "currency": "USD",
        "features": ["4G SMS"],
        "availability": "coming_soon",
        "popular": True,
        "area_codes": ["+91"]
    }
]


@router.get("/coverage")
async def get_coverage():
    """Get all country coverage data"""
    try:
        # Sort: popular first, then by country name
        sorted_coverage = sorted(
            COUNTRY_COVERAGE,
            key=lambda x: (not x["popular"], x["country"])
        )
        
        available_count = len([c for c in COUNTRY_COVERAGE if c["availability"] == "available"])
        coming_soon_count = len([c for c in COUNTRY_COVERAGE if c["availability"] == "coming_soon"])
        
        return {
            "success": True,
            "total_countries": len(COUNTRY_COVERAGE),
            "available": available_count,
            "coming_soon": coming_soon_count,
            "countries": sorted_coverage
        }
        
    except Exception as e:
        logger.error(f"Error getting coverage: {str(e)}")
        return {
            "success": False,
            "error": "Failed to get coverage data"
        }


@router.get("/coverage/{country_code}")
async def get_country_coverage(country_code: str):
    """Get coverage details for a specific country"""
    try:
        country_code = country_code.upper()
        country = next((c for c in COUNTRY_COVERAGE if c["code"] == country_code), None)
        
        if not country:
            return {
                "success": False,
                "error": "Country not found"
            }
        
        return {
            "success": True,
            "country": country
        }
        
    except Exception as e:
        logger.error(f"Error getting country coverage: {str(e)}")
        return {
            "success": False,
            "error": "Failed to get country coverage"
        }
