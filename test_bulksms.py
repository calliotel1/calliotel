#!/usr/bin/env python3
"""
Quick test script to send SMS via BulkSMS
Tests the integration directly without authentication
"""
import sys
import os
sys.path.insert(0, '/app/backend')

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

from services.bulksms_client import bulksms_client

def test_sms():
    phone = "+9613212211"
    message = "🏛️ Welcome to the Digital Colosseum! This is a test message from Calliotel. BulkSMS integration is LIVE! 🔥"
    
    print(f"📱 Sending test SMS to {phone}...")
    print(f"📝 Message: {message}")
    print()
    
    try:
        result = bulksms_client.send_sms(
            to=phone,
            message=message,
            from_name="Calliotel"
        )
        
        print("✅ SMS SENT SUCCESSFULLY!")
        print(f"🆔 Message ID: {result.get('message_id')}")
        print(f"📊 Status: {result.get('status')}")
        print(f"💰 Cost: ${result.get('cost')}")
        print()
        print("🎯 CHECK YOUR PHONE NOW!")
        
        return result
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return None

if __name__ == "__main__":
    test_sms()
