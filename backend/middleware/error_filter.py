"""
Global Error Filter Middleware
Masks all provider names in error messages to maintain white-label branding
"""

import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import json

logger = logging.getLogger(__name__)

# Provider names to mask (case-insensitive)
PROVIDER_NAMES = [
    "northsms",
    "sonetel",
    "telnyx",
    "twilio",
    # Add any other provider names here
]

def mask_provider_names(text: str) -> str:
    """
    Replace any provider names with 'CALLIOTEL System'
    """
    if not isinstance(text, str):
        return text
    
    masked_text = text
    for provider in PROVIDER_NAMES:
        # Case-insensitive replacement
        masked_text = masked_text.replace(provider, "CALLIOTEL System")
        masked_text = masked_text.replace(provider.upper(), "CALLIOTEL SYSTEM")
        masked_text = masked_text.replace(provider.capitalize(), "Calliotel System")
    
    return masked_text

class ErrorFilterMiddleware(BaseHTTPMiddleware):
    """
    Middleware to filter out provider names from all error responses
    """
    
    async def dispatch(self, request, call_next):
        try:
            response = await call_next(request)
            
            # Only process JSON error responses
            if response.status_code >= 400 and response.headers.get("content-type", "").startswith("application/json"):
                # Read response body
                body = b""
                async for chunk in response.body_iterator:
                    body += chunk
                
                try:
                    # Parse JSON
                    data = json.loads(body.decode())
                    
                    # Mask provider names in error messages
                    if isinstance(data, dict):
                        if "detail" in data:
                            data["detail"] = mask_provider_names(data["detail"])
                        if "message" in data:
                            data["message"] = mask_provider_names(data["message"])
                        if "error" in data:
                            data["error"] = mask_provider_names(data["error"])
                    
                    # Create new response with masked data
                    return JSONResponse(
                        content=data,
                        status_code=response.status_code,
                        headers=dict(response.headers)
                    )
                except:
                    # If JSON parsing fails, return original response
                    pass
            
            return response
            
        except Exception as e:
            logger.error(f"Error filter middleware error: {str(e)}")
            # Return generic error if something goes wrong
            return JSONResponse(
                content={"detail": "CALLIOTEL System: Service temporarily unavailable. Please try again."},
                status_code=500
            )
