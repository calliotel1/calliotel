"""
Live Numbers API
Recent and available virtual numbers for preview
"""

from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
import random
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# Sample virtual numbers for live preview (in production, query from DB)
SAMPLE_NUMBERS = [
    {
        "number": "+1 (555) 123-4567",
        "location": "New York, USA",
        "status": "available",
        "area_code": "+1",
        "city": "NYC"
    },
    {
        "number": "+44 20 7946 0958",
        "location": "London, UK",
        "status": "available",
        "area_code": "+44",
        "city": "London"
    },
    {
        "number": "+1 (415) 555-0199",
        "location": "San Francisco, USA",
        "status": "available",
        "area_code": "+1",
        "city": "San Francisco"
    },
    {
        "number": "+1 (213) 555-0142",
        "location": "Los Angeles, USA",
        "status": "just_claimed",
        "area_code": "+1",
        "city": "Los Angeles"
    },
    {
        "number": "+1 (647) 555-0198",
        "location": "Toronto, Canada",
        "status": "available",
        "area_code": "+1",
        "city": "Toronto"
    },
    {
        "number": "+61 2 9876 5432",
        "location": "Sydney, Australia",
        "status": "available",
        "area_code": "+61",
        "city": "Sydney"
    },
    {
        "number": "+49 30 5555 1234",
        "location": "Berlin, Germany",
        "status": "just_claimed",
        "area_code": "+49",
        "city": "Berlin"
    },
    {
        "number": "+33 1 4567 8901",
        "location": "Paris, France",
        "status": "available",
        "area_code": "+33",
        "city": "Paris"
    },
    {
        "number": "+31 20 123 4567",
        "location": "Amsterdam, Netherlands",
        "status": "available",
        "area_code": "+31",
        "city": "Amsterdam"
    },
    {
        "number": "+1 (305) 555-0167",
        "location": "Miami, USA",
        "status": "just_claimed",
        "area_code": "+1",
        "city": "Miami"
    },
    {
        "number": "+1 (312) 555-0189",
        "location": "Chicago, USA",
        "status": "available",
        "area_code": "+1",
        "city": "Chicago"
    },
    {
        "number": "+44 161 123 4567",
        "location": "Manchester, UK",
        "status": "available",
        "area_code": "+44",
        "city": "Manchester"
    },
    {
        "number": "+1 (206) 555-0154",
        "location": "Seattle, USA",
        "status": "available",
        "area_code": "+1",
        "city": "Seattle"
    },
    {
        "number": "+65 6789 1234",
        "location": "Singapore",
        "status": "just_claimed",
        "area_code": "+65",
        "city": "Singapore"
    },
    {
        "number": "+1 (617) 555-0143",
        "location": "Boston, USA",
        "status": "available",
        "area_code": "+1",
        "city": "Boston"
    }
]


@router.get("/numbers/live-preview")
async def get_live_preview(limit: int = 10):
    """Get live preview of recent/available numbers"""
    try:
        # Shuffle to create "live" effect
        shuffled = SAMPLE_NUMBERS.copy()
        random.shuffle(shuffled)
        
        # Return limited set
        preview_numbers = shuffled[:limit]
        
        # Add timestamp to each
        for number in preview_numbers:
            if number["status"] == "just_claimed":
                # Random time in last 10 minutes
                minutes_ago = random.randint(1, 10)
                number["claimed_at"] = f"{minutes_ago}m ago"
            else:
                number["listed_at"] = "Just listed"
        
        return {
            "success": True,
            "numbers": preview_numbers,
            "total": len(SAMPLE_NUMBERS),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting live preview: {str(e)}")
        return {
            "success": False,
            "error": "Failed to get live preview"
        }
