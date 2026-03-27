from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
import httpx
import logging
from datetime import datetime
from typing import Optional

router = APIRouter()
logger = logging.getLogger(__name__)

class WebhookTestRequest(BaseModel):
    webhook_url: HttpUrl
    payload: dict

class WebhookTestResponse(BaseModel):
    success: bool
    status_code: Optional[int] = None
    response_body: Optional[str] = None
    error: Optional[str] = None
    details: Optional[str] = None
    duration_ms: int

@router.post("/test", response_model=WebhookTestResponse)
async def test_webhook(request: WebhookTestRequest):
    """
    Send a test webhook payload to the user's endpoint.
    This allows developers to verify their webhook integration without spending money on real SMS.
    """
    start_time = datetime.now()
    
    try:
        # Send POST request to user's webhook URL
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                str(request.webhook_url),
                json=request.payload,
                headers={
                    'Content-Type': 'application/json',
                    'User-Agent': 'Calliotel-Webhook-Tester/1.0',
                    'X-Calliotel-Test': 'true',
                    'X-Calliotel-Signature': 'test_signature_would_go_here'
                }
            )
            
            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            
            # Check if response is successful (2xx status codes)
            if 200 <= response.status_code < 300:
                return WebhookTestResponse(
                    success=True,
                    status_code=response.status_code,
                    response_body=response.text[:500] if response.text else "Empty response",
                    duration_ms=duration_ms
                )
            else:
                return WebhookTestResponse(
                    success=False,
                    status_code=response.status_code,
                    error=f"Server returned {response.status_code}",
                    details=f"Expected 200-299 status code, got {response.status_code}. Response: {response.text[:200]}",
                    duration_ms=duration_ms
                )
                
    except httpx.TimeoutException:
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        return WebhookTestResponse(
            success=False,
            error="Connection timeout",
            details="Your webhook took more than 10 seconds to respond. Make sure it's accessible and responds quickly.",
            duration_ms=duration_ms
        )
        
    except httpx.ConnectError:
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        return WebhookTestResponse(
            success=False,
            error="Connection refused",
            details="Could not connect to your webhook URL. Make sure it's publicly accessible and not behind a firewall.",
            duration_ms=duration_ms
        )
        
    except Exception as e:
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        logger.error(f"Webhook test failed: {str(e)}")
        return WebhookTestResponse(
            success=False,
            error=str(e),
            details="An unexpected error occurred. Check your webhook URL and try again.",
            duration_ms=duration_ms
        )
