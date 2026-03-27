"""
Telnyx API Client Wrapper
Handles all Telnyx API interactions with proper error handling
"""
import os
import logging
import telnyx
from typing import Optional, List, Dict
from tenacity import retry, stop_after_attempt, wait_exponential
from datetime import datetime

logger = logging.getLogger(__name__)

class TelnyxClient:
    """Manages Telnyx API client with proper error handling."""
    
    _instance = None
    _api_key = None
    
    @classmethod
    def initialize(cls, api_key: str = None):
        """Initialize Telnyx client with API key."""
        if api_key:
            cls._api_key = api_key
        else:
            cls._api_key = os.environ.get('TELNYX_API_KEY')
        
        if not cls._api_key:
            raise ValueError("TELNYX_API_KEY not found in environment")
        
        telnyx.api_key = cls._api_key
        logger.info("Telnyx API client initialized")
    
    @classmethod
    def is_configured(cls) -> bool:
        """Check if Telnyx is configured."""
        return cls._api_key is not None or os.environ.get('TELNYX_API_KEY') is not None

# Initialize on module import
try:
    TelnyxClient.initialize()
except Exception as e:
    logger.warning(f"Telnyx not configured: {str(e)}")
