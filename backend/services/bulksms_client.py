"""
BulkSMS API Client for Digital Colosseum
Handles SMS sending via BulkSMS API
"""
import requests
import logging
import os
import base64
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

class BulkSMSClient:
    """Client for interacting with BulkSMS API"""
    
    def __init__(self):
        self.token_id = os.environ.get('BULKSMS_TOKEN_ID')
        self.token_secret = os.environ.get('BULKSMS_TOKEN_SECRET')
        self.api_base = "https://api.bulksms.com/v1"
        
        if not self.token_id or not self.token_secret:
            logger.warning("BulkSMS credentials not configured")
        
        # Create Basic Auth header
        credentials = f"{self.token_id}:{self.token_secret}"
        self.auth_header = base64.b64encode(credentials.encode()).decode()
    
    def send_sms(
        self,
        to: str,
        message: str,
        from_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send a single SMS message
        
        Args:
            to: Recipient phone number (E.164 format, e.g., +27123456789)
            message: Text message content (max 160 chars for single SMS)
            from_name: Optional sender name (alphanumeric, max 11 chars)
        
        Returns:
            Dict with status and message ID
        """
        if not self.token_id or not self.token_secret:
            raise Exception("BulkSMS credentials not configured")
        
        # Ensure phone number is in E.164 format
        if not to.startswith('+'):
            logger.warning(f"Phone number {to} missing country code, adding +")
            to = f"+{to}"
        
        headers = {
            "Authorization": f"Basic {self.auth_header}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "to": to,
            "body": message
        }
        
        # Add optional sender name
        if from_name:
            payload["from"] = from_name
        
        try:
            logger.info(f"Sending SMS to {to} via BulkSMS")
            
            response = requests.post(
                f"{self.api_base}/messages",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 201:
                result = response.json()
                
                # BulkSMS returns an array even for single message
                if isinstance(result, list):
                    result = result[0] if result else {}
                
                logger.info(f"SMS sent successfully: {result.get('id')}")
                return {
                    "success": True,
                    "message_id": result.get('id'),
                    "status": result.get('status', {}).get('type'),
                    "cost": self._calculate_cost(message),
                    "raw_response": result
                }
            else:
                error_msg = response.text
                logger.error(f"BulkSMS API error: {response.status_code} - {error_msg}")
                raise Exception(f"Failed to send SMS: {error_msg}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error sending SMS: {str(e)}")
            raise Exception(f"Network error: {str(e)}")
    
    def send_bulk_sms(
        self,
        recipients: List[str],
        message: str,
        from_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send SMS to multiple recipients
        
        Args:
            recipients: List of phone numbers (E.164 format)
            message: Text message content
            from_name: Optional sender name
        
        Returns:
            Dict with status and results for each recipient
        """
        if not self.token_id or not self.token_secret:
            raise Exception("BulkSMS credentials not configured")
        
        headers = {
            "Authorization": f"Basic {self.auth_header}",
            "Content-Type": "application/json"
        }
        
        # Format recipients
        formatted_recipients = []
        for phone in recipients:
            if not phone.startswith('+'):
                phone = f"+{phone}"
            formatted_recipients.append(phone)
        
        # BulkSMS accepts array of messages
        messages = []
        for phone in formatted_recipients:
            msg = {
                "to": phone,
                "body": message
            }
            if from_name:
                msg["from"] = from_name
            messages.append(msg)
        
        try:
            logger.info(f"Sending bulk SMS to {len(messages)} recipients")
            
            response = requests.post(
                f"{self.api_base}/messages",
                json=messages,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 201:
                results = response.json()
                successful = sum(1 for r in results if r.get('status', {}).get('type') == 'ACCEPTED')
                
                logger.info(f"Bulk SMS sent: {successful}/{len(messages)} successful")
                
                return {
                    "success": True,
                    "total": len(messages),
                    "successful": successful,
                    "failed": len(messages) - successful,
                    "results": results
                }
            else:
                error_msg = response.text
                logger.error(f"BulkSMS bulk API error: {response.status_code} - {error_msg}")
                raise Exception(f"Failed to send bulk SMS: {error_msg}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error sending bulk SMS: {str(e)}")
            raise Exception(f"Network error: {str(e)}")
    
    def get_balance(self) -> Dict[str, Any]:
        """
        Get account balance and credits
        
        Returns:
            Dict with credit balance information
        """
        if not self.token_id or not self.token_secret:
            raise Exception("BulkSMS credentials not configured")
        
        headers = {
            "Authorization": f"Basic {self.auth_header}"
        }
        
        try:
            response = requests.get(
                f"{self.api_base}/profile",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                profile = response.json()
                credits = profile.get('credit', {}).get('balance', 0)
                
                return {
                    "success": True,
                    "credits": credits,
                    "username": profile.get('username'),
                    "company": profile.get('company', {}).get('name')
                }
            else:
                logger.error(f"Failed to get balance: {response.status_code}")
                raise Exception("Failed to get balance")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error getting balance: {str(e)}")
            raise Exception(f"Network error: {str(e)}")
    
    def _calculate_cost(self, message: str) -> float:
        """
        Calculate approximate cost based on message length
        1 SMS = 160 characters = ~0.01 credits (varies by country)
        """
        # Calculate number of SMS segments
        segments = 1
        if len(message) > 160:
            # Concatenated SMS: 153 chars per segment (7 chars for header)
            segments = (len(message) - 1) // 153 + 1
        
        # Approximate cost (actual cost varies by destination)
        cost_per_segment = 0.01
        return segments * cost_per_segment
    
    def validate_phone_number(self, phone: str) -> bool:
        """
        Validate phone number format
        
        Args:
            phone: Phone number to validate
        
        Returns:
            True if valid E.164 format
        """
        # Basic E.164 validation
        if not phone:
            return False
        
        # Remove whitespace
        phone = phone.strip()
        
        # Should start with +
        if not phone.startswith('+'):
            return False
        
        # Should be 8-15 digits after the +
        digits = phone[1:]
        if not digits.isdigit():
            return False
        
        if len(digits) < 8 or len(digits) > 15:
            return False
        
        return True


# Global client instance
bulksms_client = BulkSMSClient()
