# Telnyx Client Manager
import logging
import os
import telnyx
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

class TelnyxClientManager:
    """Manages Telnyx SDK client initialization."""
    
    _client = None
    
    @classmethod
    def get_client(cls):
        """Get or create Telnyx client."""
        if cls._client is None:
            try:
                telnyx_api_key = os.environ.get('TELNYX_API_KEY')
                if not telnyx_api_key:
                    raise ValueError("TELNYX_API_KEY not found in environment variables")
                
                telnyx.api_key = telnyx_api_key
                cls._client = telnyx
                logger.info("Telnyx client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Telnyx client: {e}")
                raise
        return cls._client

def get_telnyx_client():
    """Get the Telnyx client."""
    return TelnyxClientManager.get_client()