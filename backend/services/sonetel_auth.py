"""
Sonetel OAuth2 Authentication Service
Handles token generation, caching, and auto-refresh
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict
import httpx
import base64

logger = logging.getLogger(__name__)


class SonetelAuth:
    """Manages Sonetel API authentication with OAuth2 token caching"""
    
    def __init__(self):
        self.email = os.environ.get('SONETEL_EMAIL')
        self.password = os.environ.get('SONETEL_PASSWORD')
        self.base_url = os.environ.get('SONETEL_API_BASE_URL', 'https://api.sonetel.com')
        self.pre_generated_token = os.environ.get('SONETEL_ACCESS_TOKEN')  # Pre-generated JWT
        
        # Token cache
        self._access_token: Optional[str] = None
        self._refresh_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None
        
        if not self.email or not self.password:
            if not self.pre_generated_token:
                logger.error("Sonetel credentials not found in environment variables")
    
    async def get_access_token(self) -> str:
        """
        Get a valid access token, refreshing if necessary
        Returns pre-generated token if available, otherwise generates new one
        """
        # PRIORITY: Use pre-generated JWT token if available
        if self.pre_generated_token:
            logger.info("Using pre-generated Sonetel JWT token (expires May 2027)")
            return self.pre_generated_token
        
        # Check if cached token is still valid (with 5-minute buffer)
        if self._access_token and self._token_expires_at:
            time_until_expiry = self._token_expires_at - datetime.now(timezone.utc)
            if time_until_expiry > timedelta(minutes=5):
                logger.info(f"Using cached Sonetel token (expires in {time_until_expiry})")
                return self._access_token
        
        # Generate new token
        logger.info("Generating new Sonetel OAuth2 token...")
        token_data = await self._generate_token()
        
        # Cache the new token
        self._access_token = token_data['access_token']
        self._refresh_token = token_data.get('refresh_token')
        
        # Sonetel tokens are valid for 30 days (2592000 seconds)
        expires_in = token_data.get('expires_in', 2592000)
        self._token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        
        logger.info(f"✅ New Sonetel token generated (expires at {self._token_expires_at})")
        return self._access_token
    
    async def _generate_token(self) -> Dict:
        """
        Generate OAuth2 token using Sonetel API
        Uses HTTP BASIC auth with 'sonetel-api' as username/password
        """
        auth_url = f"{self.base_url}/SonetelAuth/beta/oauth/access_token"
        
        # HTTP BASIC authentication (required by Sonetel)
        basic_auth = base64.b64encode(b"sonetel-api:sonetel-api").decode('utf-8')
        
        headers = {
            "Authorization": f"Basic {basic_auth}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "grant_type": "password",
            "username": self.email,
            "password": self.password
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(auth_url, json=payload, headers=headers)
                response.raise_for_status()
                
                token_data = response.json()
                logger.info("✅ Successfully generated Sonetel OAuth2 token")
                return token_data
                
            except httpx.HTTPStatusError as e:
                logger.error(f"❌ Sonetel auth failed: {e.response.status_code} - {e.response.text}")
                raise Exception(f"Sonetel authentication failed: {e.response.text}")
            except Exception as e:
                logger.error(f"❌ Sonetel auth error: {str(e)}")
                raise
    
    async def refresh_access_token(self) -> str:
        """Refresh the access token using refresh_token (if available)"""
        if not self._refresh_token:
            logger.warning("No refresh token available, generating new token instead")
            return await self.get_access_token()
        
        auth_url = f"{self.base_url}/SonetelAuth/beta/oauth/access_token"
        
        basic_auth = base64.b64encode(b"sonetel-api:sonetel-api").decode('utf-8')
        
        headers = {
            "Authorization": f"Basic {basic_auth}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "grant_type": "refresh_token",
            "refresh_token": self._refresh_token
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(auth_url, json=payload, headers=headers)
                response.raise_for_status()
                
                token_data = response.json()
                
                # Update cached tokens
                self._access_token = token_data['access_token']
                self._refresh_token = token_data.get('refresh_token', self._refresh_token)
                
                expires_in = token_data.get('expires_in', 2592000)
                self._token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
                
                logger.info(f"✅ Sonetel token refreshed (expires at {self._token_expires_at})")
                return self._access_token
                
            except Exception as e:
                logger.error(f"❌ Token refresh failed: {str(e)}, generating new token")
                return await self.get_access_token()


# Global instance
sonetel_auth = SonetelAuth()
