"""
Sonetel Direct Purchase Script
Test voice number provisioning with your $11.50 balance
"""

import requests
import json

# Your credentials from .env
SONETEL_JWT_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleTEifQ.eyJhdWQiOiJhcGkuc29uZXRlbC5jb20iLCJ1c2VyX2ppZCI6IjgyNmMzNTk5LTQ2ZWYtNDZlYy1iNDRiLWZiMDRjNWZkNGE5YUBldTAxLnNvbmV0ZWwuY29tIiwidXNlcl9pZCI6IjIwMTgyMzM1MTIiLCJ1c2VyX25hbWUiOiJhc3RvcjUzOUBnbWFpbC5jb20iLCJzY29wZSI6WyJhY2NvdW50LnJlYWQiLCJhY2NvdW50LndyaXRlIiwiY29udmVyc2F0aW9uLnJlYWQiLCJjb252ZXJzYXRpb24ud3JpdGUiLCJ1c2VyLnJlYWQiLCJ1c2VyLndyaXRlIl0sImlzcyI6IlNvbmV0ZWxOb2RlMTIzIiwiZXhwIjoxNzc3MDk4OTgyLCJpYXQiOjE3NzQ1MDY5ODIsImp0aSI6ImRhYzVhNjZjLWQ5YTUtNDhiZC05NWI2LWFkZmUyNzA0ZmUzYSIsImFjY19pZCI6MjEwMjMyMzQ1LCJjbGllbnRfaWQiOiJzb25ldGVsLWFwaSJ9.JKvDq0uJUEBACyTohgsULuq8gcL5n26BAWhEAYpIMxa_NsvBAh0zCUQ1H_PVY-R2zxqSES9KVvDtImh4IE1qoDm9Qhs2ZwjVUFlXT_9KGv1aavzoYf7rajOObxl4mAq2FmxNWyhe91TYtYCSfFM0lOUX6H7WyotOLqz7mc_AnA2VmpGfrPU8BJ8hKtdFtVvHShqbGNi3ll7ZhaecgjyhETdZyQeZTLhotBGHSol6_fNefx8BUdpP1BWknWkagfmjKtz8G58DyU5gNpXKYHexCBCt1E48qEzcWjKp1mw9k3kaI44uy7KVkE2c3RpJleFTZuz2q3qZ6mv9V2TBNIFzgA"
ACCOUNT_ID = "210232345"
BASE_URL = "https://public-api.sonetel.com"

def purchase_phone_number(phone_number):
    """
    Purchase a specific phone number from Sonetel
    
    Args:
        phone_number (str): E.164 format WITHOUT '+' (e.g., '14155551234')
    
    Returns:
        dict: Purchase result
    """
    
    url = f"{BASE_URL}/account/{ACCOUNT_ID}/phonenumbersubscription"
    
    headers = {
        "Authorization": f"Bearer {SONETEL_JWT_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    # Payload as per Sonetel API spec
    payload = {
        "phnum": phone_number  # E.164 without '+'
    }
    
    print(f"🔍 Attempting to purchase: +{phone_number}")
    print(f"📡 URL: {url}")
    print(f"📦 Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📄 Response Body: {response.text[:500]}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"\n✅ SUCCESS! Number purchased:")
            print(f"   Phone Number: +{phone_number}")
            print(f"   Subscription ID: {data.get('subscription_id', 'N/A')}")
            print(f"   Monthly Cost: ${data.get('monthly_cost', 'N/A')}")
            return {"status": "SUCCESS", "data": data}
        
        elif response.status_code == 400:
            print(f"\n❌ BAD REQUEST - Possible issues:")
            print(f"   1. Number not available")
            print(f"   2. Insufficient balance")
            print(f"   3. Invalid E.164 format")
            return {"status": "FAILED", "error": response.text}
        
        elif response.status_code == 401:
            print(f"\n❌ UNAUTHORIZED - Token expired or invalid")
            return {"status": "FAILED", "error": "Authentication failed"}
        
        elif response.status_code == 404:
            print(f"\n❌ NOT FOUND - Endpoint doesn't exist")
            return {"status": "FAILED", "error": "Endpoint not found"}
        
        else:
            print(f"\n⚠️  UNEXPECTED RESPONSE")
            return {"status": "FAILED", "error": response.text}
            
    except requests.exceptions.Timeout:
        print(f"\n⏱️  REQUEST TIMEOUT")
        return {"status": "FAILED", "error": "Request timed out after 30 seconds"}
    
    except Exception as e:
        print(f"\n❌ EXCEPTION: {str(e)}")
        return {"status": "FAILED", "error": str(e)}


def list_my_numbers():
    """
    List all phone numbers you currently own
    """
    
    url = f"{BASE_URL}/account/{ACCOUNT_ID}/phonenumbersubscription"
    
    headers = {
        "Authorization": f"Bearer {SONETEL_JWT_TOKEN}",
        "Accept": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('response') == "No entries found":
                print("📋 You don't own any numbers yet")
                return []
            
            numbers = data.get('numbers', [])
            print(f"📋 You own {len(numbers)} numbers:")
            for num in numbers:
                print(f"   - {num.get('phnum')} (${num.get('monthly_cost')}/month)")
            
            return numbers
        else:
            print(f"❌ Failed to list numbers: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return []


if __name__ == "__main__":
    print("🏛️ SONETEL DIRECT PURCHASE TEST 🏛️\n")
    
    # Step 1: Check current numbers
    print("=" * 60)
    print("STEP 1: Checking your current inventory...")
    print("=" * 60)
    list_my_numbers()
    
    # Step 2: Attempt purchase
    print("\n" + "=" * 60)
    print("STEP 2: Attempting to purchase a number...")
    print("=" * 60)
    
    # IMPORTANT: You need to provide a SPECIFIC number you want
    # To find available numbers, you must:
    # 1. Visit Sonetel's web dashboard
    # 2. Browse available numbers manually
    # 3. Copy the E.164 number (without '+')
    # 4. Paste it here
    
    target_number = input("Enter phone number to purchase (E.164 without '+', e.g., 14155551234): ")
    
    if target_number:
        result = purchase_phone_number(target_number)
        
        if result['status'] == 'SUCCESS':
            print("\n🎉 PURCHASE SUCCESSFUL!")
            print("Your new number is now active in your Sonetel account")
            
            # Step 3: Verify purchase
            print("\n" + "=" * 60)
            print("STEP 3: Verifying purchase...")
            print("=" * 60)
            list_my_numbers()
        else:
            print("\n💔 Purchase failed. See error details above.")
    else:
        print("\n⚠️  No number provided. Exiting.")
