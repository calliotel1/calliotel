"""NorthSMS API Client - Dynamic Service Integration

Handles all communication with NorthSMS.com API for temporary verification numbers.
Uses dynamic service slugs and code-based order tracking for bulletproof reliability.
"""

import httpx
import os
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)


class NorthSMSClient:
    """Client for interacting with NorthSMS API with dynamic service mapping"""
    
    BASE_URL = "https://northsms.com/api"
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize NorthSMS client
        
        Args:
            api_key: NorthSMS API key. If not provided, reads from NORTHSMS_API_KEY env var
        """
        self.api_key = api_key or os.environ.get('NORTHSMS_API_KEY')
        if not self.api_key:
            raise ValueError("NorthSMS API key is required. Set NORTHSMS_API_KEY environment variable.")
        
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    async def get_available_services(self) -> List[Dict[str, Any]]:
        """Get list of available services from NorthSMS API dynamically
        
        Returns:
            List of popular services with slug, name, and icon
        """
        url = f"{self.BASE_URL}/activation/services"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                
                all_services = data.get("data", [])
                
                # Map ALL services with icons
                icon_map = {
                    "whatsapp": "💬",
                    "telegram": "✈️",
                    "discord": "🎮",
                    "googleyoutubegmail": "🔍",
                    "instagramthreads": "📸",
                    "tiktokdouyin": "🎵",
                    "facebook": "👥",
                    "twitter": "🐦",
                    "snapchat": "👻",
                    "linkedin": "💼",
                    "amazon": "📦",
                    "microsoft": "🪟",
                    "netflix": "🎬",
                    "spotify": "🎵",
                    "uber": "🚗",
                    "airbnb": "🏠",
                    "paypal": "💳",
                    "venmo": "💸",
                    "cashapp": "💰",
                    "zelle": "💵"
                }
                
                formatted_services = []
                for service in all_services:
                    slug = service.get("slug", "")
                    name = service.get("name", slug.title())
                    
                    formatted_services.append({
                        "rate_id": service.get("id", slug),
                        "slug": slug,
                        "service": name,
                        "icon": icon_map.get(slug, "📱"),
                        "country": service.get("country", "Global"),
                        "price": service.get("price", 0.50),
                        "price_range": f"~${service.get('price', 0.50):.2f}"
                    })
                
                logger.info(f"✅ Fetched {len(formatted_services)} services from NorthSMS")
                return formatted_services
                
        except Exception as e:
            logger.error(f"❌ Failed to fetch services from NorthSMS: {str(e)}")
            # Fallback to basic list if API fails
            return self._get_fallback_services()
    
    def _get_fallback_services(self) -> List[Dict[str, Any]]:
        """Fallback service list if API fails"""
        return [
            {"slug": "whatsapp", "service": "WhatsApp", "icon": "💬", "priority": 1, "price_range": "~$0.30-0.50"},
            {"slug": "telegram", "service": "Telegram", "icon": "✈️", "priority": 2, "price_range": "~$0.30-0.50"},
            {"slug": "discord", "service": "Discord", "icon": "🎮", "priority": 3, "price_range": "~$0.30-0.50"},
            {"slug": "googleyoutubegmail", "service": "Google", "icon": "🔍", "priority": 4, "price_range": "~$0.30-0.50"},
            {"slug": "instagramthreads", "service": "Instagram", "icon": "📸", "priority": 5, "price_range": "~$0.30-0.50"},
            {"slug": "tiktokdouyin", "service": "TikTok", "icon": "🎵", "priority": 6, "price_range": "~$0.30-0.50"},
        ]
    
    async def create_activation_order(self, service_slug: str, country_code: str = "US") -> Dict[str, Any]:
        """Purchase a temporary number for verification
        
        Args:
            service_slug: The service slug from NorthSMS (e.g., "discord", "whatsapp")
            country_code: ISO2 country code (default: "US")
        
        Returns:
            Order details including code, phone_number, status, service, country, price
        """
        url = f"{self.BASE_URL}/activation/orders"
        payload = {
            "service": service_slug,
            "country": country_code
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                
                # Extract data from NorthSMS response structure
                order_code = data.get("code")
                phone_number = data.get("phoneNumber")
                status_obj = data.get("status", {})
                service_obj = data.get("service", {})
                country_obj = data.get("country", {})
                price = data.get("sellingPrice")
                expires_at = data.get("expiresAt")
                
                logger.info(f"✅ NorthSMS order created: {order_code} for {service_obj.get('name')}")
                
                return {
                    "success": True,
                    "order_code": order_code,
                    "phone_number": phone_number,
                    "status": status_obj.get("value"),  # "active"
                    "service": service_obj.get("name"),
                    "service_slug": service_obj.get("slug"),
                    "country": country_obj.get("name"),
                    "country_code": country_obj.get("iso2"),
                    "price": price,
                    "expires_at": expires_at,
                }
                    
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ NorthSMS API error: {e.response.status_code} - {e.response.text}")
            return {
                "success": False,
                "error": f"API request failed with status {e.response.status_code}",
                "details": e.response.text
            }
        except Exception as e:
            logger.error(f"❌ Unexpected error creating NorthSMS order: {str(e)}")
            return {
                "success": False,
                "error": "Failed to create order",
                "details": str(e)
            }
    
    async def get_order_status(self, order_code: str) -> Dict[str, Any]:
        """Get the status of an activation order and retrieve SMS code if received
        
        Args:
            order_code: The order code returned from create_activation_order
        
        Returns:
            Order details including status and messages (SMS codes)
        """
        url = f"{self.BASE_URL}/activation/orders/{order_code}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                
                status_obj = data.get("status", {})
                service_obj = data.get("service", {})
                country_obj = data.get("country", {})
                messages = data.get("messages", [])
                
                # Extract SMS code from messages array
                sms_code = None
                if messages and len(messages) > 0:
                    # Messages format: [{"id": 123, "message": "Your code is: 123456", ...}]
                    first_message = messages[0]
                    message_text = first_message.get("message", "")
                    # Try to extract numeric code from message
                    import re
                    code_match = re.search(r'\b\d{4,8}\b', message_text)
                    if code_match:
                        sms_code = code_match.group(0)
                    else:
                        sms_code = message_text  # Return full message if no code found
                
                logger.info(f"📊 Order {order_code} status: {status_obj.get('value')}")
                if sms_code:
                    logger.info(f"✅ SMS code received for {order_code}: {sms_code}")
                
                return {
                    "success": True,
                    "order_code": data.get("code"),
                    "phone_number": data.get("phoneNumber"),
                    "status": status_obj.get("value"),  # "active", "completed", "expired", "cancelled"
                    "service": service_obj.get("name"),
                    "country": country_obj.get("name"),
                    "sms_code": sms_code,
                    "messages": messages,
                    "expires_at": data.get("expiresAt"),
                    "completed_at": data.get("completedAt"),
                    "created_at": data.get("createdAt"),
                }
                
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ NorthSMS API error: {e.response.status_code} - {e.response.text}")
            return {
                "success": False,
                "error": f"API request failed with status {e.response.status_code}",
                "details": e.response.text
            }
        except Exception as e:
            logger.error(f"❌ Unexpected error fetching order status: {str(e)}")
            return {
                "success": False,
                "error": "Failed to fetch order status",
                "details": str(e)
            }
    
    async def cancel_order(self, order_code: str) -> Dict[str, Any]:
        """Cancel an active order and receive automatic refund
        
        Args:
            order_code: The order code to cancel
        
        Returns:
            Cancellation result
        """
        url = f"{self.BASE_URL}/activation/orders/{order_code}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.delete(url, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                
                logger.info(f"🚫 Cancelled order {order_code}")
                return {
                    "success": True,
                    "message": data.get("message", "Order cancelled successfully"),
                    "data": data
                }
                
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ Failed to cancel order: {e.response.status_code} - {e.response.text}")
            return {
                "success": False,
                "error": f"Failed to cancel order: {e.response.status_code}",
                "details": e.response.text
            }
        except Exception as e:
            logger.error(f"❌ Unexpected error cancelling order: {str(e)}")
            return {
                "success": False,
                "error": "Failed to cancel order",
                "details": str(e)
            }


# Singleton instance
_client_instance = None

def get_northsms_client() -> NorthSMSClient:
    """Get or create the NorthSMS client singleton"""
    global _client_instance
    if _client_instance is None:
        _client_instance = NorthSMSClient()
    return _client_instance
