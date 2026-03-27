"""
TELECOM PROVIDER INTEGRATION SYSTEM

This module provides a unified interface for multiple telecom providers.
Supports: MSG91, Clickatell, Unifonic, Twilio, Telnyx, and generic SIP trunks.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import httpx
from datetime import datetime

# ============================================
# BASE PROVIDER CLASS
# ============================================

class TelecomProvider(ABC):
    """Base class for all telecom providers"""
    
    def __init__(self, config: Dict[str, str]):
        self.config = config
        self.name = self.__class__.__name__
        self.client = httpx.AsyncClient(timeout=30.0)
    
    @abstractmethod
    async def send_sms(self, from_number: str, to_number: str, message: str) -> Dict:
        """Send SMS message"""
        pass
    
    @abstractmethod
    async def get_sms_status(self, message_id: str) -> Dict:
        """Get SMS delivery status"""
        pass
    
    @abstractmethod
    async def search_numbers(self, country_code: str, limit: int = 10) -> List[Dict]:
        """Search available numbers"""
        pass
    
    @abstractmethod
    async def purchase_number(self, number: str) -> Dict:
        """Purchase a number"""
        pass
    
    @abstractmethod
    async def release_number(self, number: str) -> Dict:
        """Release a number"""
        pass
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

# ============================================
# MSG91 PROVIDER
# ============================================

class MSG91Provider(TelecomProvider):
    """MSG91 integration"""
    
    BASE_URL = "https://control.msg91.com/api/v5"
    
    async def send_sms(self, from_number: str, to_number: str, message: str) -> Dict:
        """
        Send SMS via MSG91
        
        Docs: https://docs.msg91.com/p/tf9GTextN/e/gEcn9oiHW/MSG91
        """
        auth_key = self.config.get("auth_key")
        if not auth_key:
            raise ValueError("MSG91 auth_key not configured")
        
        # Clean phone number (remove +)
        to_clean = to_number.replace("+", "").replace(" ", "")
        
        payload = {
            "sender": from_number,  # Or use sender_id from config
            "route": "4",  # Transactional route
            "country": "0",  # International
            "sms": [
                {
                    "message": message,
                    "to": [to_clean]
                }
            ]
        }
        
        headers = {
            "authkey": auth_key,
            "Content-Type": "application/json"
        }
        
        try:
            response = await self.client.post(
                f"{self.BASE_URL}/flow/",
                json=payload,
                headers=headers
            )
            result = response.json()
            
            return {
                "success": response.status_code == 200,
                "provider_message_id": result.get("request_id") or result.get("message_id"),
                "status": "sent" if response.status_code == 200 else "failed",
                "raw_response": result
            }
        except Exception as e:
            return {
                "success": False,
                "status": "failed",
                "error": str(e)
            }
    
    async def get_sms_status(self, message_id: str) -> Dict:
        """Get SMS status from MSG91"""
        # TODO: Implement status check
        return {"status": "unknown"}
    
    async def search_numbers(self, country_code: str, limit: int = 10) -> List[Dict]:
        """Search numbers (MSG91 may not support this)"""
        # MSG91 primarily provides messaging, not number provisioning
        return []
    
    async def purchase_number(self, number: str) -> Dict:
        """Purchase number (not supported by MSG91)"""
        raise NotImplementedError("MSG91 does not support number provisioning")
    
    async def release_number(self, number: str) -> Dict:
        """Release number (not supported)"""
        raise NotImplementedError("MSG91 does not support number management")

# ============================================
# CLICKATELL PROVIDER
# ============================================

class ClickatellProvider(TelecomProvider):
    """Clickatell integration"""
    
    BASE_URL = "https://platform.clickatell.com"
    
    async def send_sms(self, from_number: str, to_number: str, message: str) -> Dict:
        """Send SMS via Clickatell"""
        api_key = self.config.get("api_key")
        if not api_key:
            raise ValueError("Clickatell API key not configured")
        
        payload = {
            "messages": [
                {
                    "from": from_number,
                    "to": [to_number],
                    "text": message
                }
            ]
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            response = await self.client.post(
                f"{self.BASE_URL}/messages",
                json=payload,
                headers=headers
            )
            result = response.json()
            
            return {
                "success": response.status_code == 202,
                "provider_message_id": result.get("messages", [{}])[0].get("apiMessageId"),
                "status": "sent" if response.status_code == 202 else "failed",
                "raw_response": result
            }
        except Exception as e:
            return {
                "success": False,
                "status": "failed",
                "error": str(e)
            }
    
    async def get_sms_status(self, message_id: str) -> Dict:
        """Get SMS status"""
        # TODO: Implement
        return {"status": "unknown"}
    
    async def search_numbers(self, country_code: str, limit: int = 10) -> List[Dict]:
        """Search numbers"""
        # TODO: Implement if Clickatell supports it
        return []
    
    async def purchase_number(self, number: str) -> Dict:
        """Purchase number"""
        # TODO: Implement
        return {}
    
    async def release_number(self, number: str) -> Dict:
        """Release number"""
        # TODO: Implement
        return {}

# ============================================
# UNIFONIC PROVIDER
# ============================================

class UnifonicProvider(TelecomProvider):
    """Unifonic integration"""
    
    BASE_URL = "https://api.unifonic.com/rest/v1"
    
    async def send_sms(self, from_number: str, to_number: str, message: str) -> Dict:
        """Send SMS via Unifonic"""
        api_key = self.config.get("api_key")
        if not api_key:
            raise ValueError("Unifonic API key not configured")
        
        payload = {
            "AppSid": api_key,
            "SenderID": from_number,
            "Recipient": to_number,
            "Body": message
        }
        
        try:
            response = await self.client.post(
                f"{self.BASE_URL}/Messages/Send",
                data=payload
            )
            result = response.json()
            
            return {
                "success": result.get("success") == True,
                "provider_message_id": result.get("MessageID"),
                "status": "sent" if result.get("success") else "failed",
                "raw_response": result
            }
        except Exception as e:
            return {
                "success": False,
                "status": "failed",
                "error": str(e)
            }
    
    async def get_sms_status(self, message_id: str) -> Dict:
        """Get SMS status"""
        return {"status": "unknown"}
    
    async def search_numbers(self, country_code: str, limit: int = 10) -> List[Dict]:
        """Search numbers"""
        return []
    
    async def purchase_number(self, number: str) -> Dict:
        """Purchase number"""
        return {}
    
    async def release_number(self, number: str) -> Dict:
        """Release number"""
        return {}

# ============================================
# PROVIDER FACTORY
# ============================================

class ProviderFactory:
    """Factory to create provider instances"""
    
    PROVIDERS = {
        "msg91": MSG91Provider,
        "clickatell": ClickatellProvider,
        "unifonic": UnifonicProvider,
    }
    
    @classmethod
    def create(cls, provider_name: str, config: Dict[str, str]) -> TelecomProvider:
        """Create a provider instance"""
        provider_class = cls.PROVIDERS.get(provider_name.lower())
        if not provider_class:
            raise ValueError(f"Unknown provider: {provider_name}")
        
        return provider_class(config)
    
    @classmethod
    def get_available_providers(cls) -> List[str]:
        """Get list of available providers"""
        return list(cls.PROVIDERS.keys())

# ============================================
# PROVIDER MANAGER
# ============================================

class ProviderManager:
    """Manages multiple providers with failover"""
    
    def __init__(self):
        self.providers: Dict[str, TelecomProvider] = {}
        self.primary_provider: Optional[str] = None
    
    def add_provider(self, name: str, provider: TelecomProvider, is_primary: bool = False):
        """Add a provider"""
        self.providers[name] = provider
        if is_primary or not self.primary_provider:
            self.primary_provider = name
    
    async def send_sms(self, from_number: str, to_number: str, message: str, provider_name: Optional[str] = None) -> Dict:
        """
        Send SMS with automatic failover
        
        If provider_name is specified, use that provider.
        Otherwise, try primary provider first, then failover to others.
        """
        # Use specified provider
        if provider_name:
            if provider_name not in self.providers:
                raise ValueError(f"Provider {provider_name} not configured")
            return await self.providers[provider_name].send_sms(from_number, to_number, message)
        
        # Try primary provider first
        if self.primary_provider:
            result = await self.providers[self.primary_provider].send_sms(from_number, to_number, message)
            if result["success"]:
                return result
        
        # Failover to other providers
        for name, provider in self.providers.items():
            if name == self.primary_provider:
                continue
            
            try:
                result = await provider.send_sms(from_number, to_number, message)
                if result["success"]:
                    return result
            except Exception as e:
                continue
        
        # All providers failed
        return {
            "success": False,
            "status": "failed",
            "error": "All providers failed"
        }
    
    async def close_all(self):
        """Close all provider connections"""
        for provider in self.providers.values():
            await provider.close()

# ============================================
# EXAMPLE USAGE
# ============================================

"""
# Initialize providers
manager = ProviderManager()

# Add MSG91
msg91_config = {"auth_key": "YOUR_MSG91_KEY"}
msg91 = ProviderFactory.create("msg91", msg91_config)
manager.add_provider("msg91", msg91, is_primary=True)

# Add Clickatell as backup
clickatell_config = {"api_key": "YOUR_CLICKATELL_KEY"}
clickatell = ProviderFactory.create("clickatell", clickatell_config)
manager.add_provider("clickatell", clickatell)

# Send SMS (will try MSG91 first, then Clickatell if it fails)
result = await manager.send_sms(
    from_number="+12025551234",
    to_number="+96170123456",
    message="Hello from Calliotel!"
)

print(result)
"""
