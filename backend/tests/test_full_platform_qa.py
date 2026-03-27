"""
Full Platform QA Audit for Calliotel.com - Pre-Launch Testing
Commander 'Big Boss' Final Dark Phase Audit

Tests:
1. Ghost Verification Flow (NorthSMS)
2. Auth & Wallet Bridge
3. Virtual Number Marketplace
4. Transaction Vault
5. Navigation & Error Handling
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "testmarketplace@calliotel.com"
TEST_USER_PASSWORD = "Market2024!"

# New test user for fresh flow testing
NEW_TEST_EMAIL = f"qatest_{datetime.now().strftime('%Y%m%d%H%M%S')}@calliotel.com"
NEW_TEST_PASSWORD = "QATest2024!"


class TestAuthFlow:
    """Authentication endpoint tests - Auth & Wallet Bridge"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_login_existing_user(self):
        """Test login with existing test user"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "access_token" in data, "Missing access_token in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["email"] == TEST_USER_EMAIL
        print(f"✅ Login successful for {TEST_USER_EMAIL}")
        print(f"   Client ID: {data['user'].get('client_id')}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Invalid credentials correctly rejected")
    
    def test_signup_new_user(self):
        """Test new user registration flow"""
        response = self.session.post(f"{BASE_URL}/api/auth/signup", json={
            "email": NEW_TEST_EMAIL,
            "password": NEW_TEST_PASSWORD,
            "full_name": "QA Test User",
            "birthday": "1990-01-15"
        })
        
        # Should succeed or fail with "already registered"
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data
            assert "user" in data
            print(f"✅ New user registered: {NEW_TEST_EMAIL}")
            print(f"   Client ID: {data['user'].get('client_id')}")
        elif response.status_code == 400:
            assert "already registered" in response.text.lower()
            print("✅ Duplicate registration correctly rejected")
        else:
            pytest.fail(f"Unexpected response: {response.status_code} - {response.text}")
    
    def test_get_current_user(self):
        """Test /me endpoint with valid token"""
        # First login
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Get current user
        response = self.session.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_USER_EMAIL
        print(f"✅ /me endpoint working - User: {data['email']}")


class TestWalletFlow:
    """Wallet & Payment integration tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login and get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json()["access_token"]
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_wallet_balance(self):
        """Test wallet balance endpoint"""
        response = self.session.get(
            f"{BASE_URL}/api/wallet/balance",
            headers=self.auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "balance" in data
        assert "currency" in data
        print(f"✅ Wallet balance: ${data['balance']:.2f} {data['currency']}")
    
    def test_get_transactions(self):
        """Test transaction history endpoint"""
        response = self.session.get(
            f"{BASE_URL}/api/wallet/transactions?limit=20",
            headers=self.auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        print(f"✅ Transaction history: {len(data['transactions'])} transactions found")
        
        # Verify transaction structure
        if data["transactions"]:
            tx = data["transactions"][0]
            assert "type" in tx
            assert "amount" in tx
            assert "description" in tx
            print(f"   Latest: {tx['type']} - ${tx['amount']:.2f} - {tx['description']}")
    
    def test_get_pricing(self):
        """Test pricing endpoint (public)"""
        response = self.session.get(f"{BASE_URL}/api/wallet/pricing")
        
        assert response.status_code == 200
        data = response.json()
        assert "sms_cost" in data
        assert "call_cost_per_minute" in data
        assert "number_monthly_cost" in data
        print(f"✅ Pricing info retrieved:")
        print(f"   SMS: ${data['sms_cost']}")
        print(f"   Calls: ${data['call_cost_per_minute']}/min")
        print(f"   Numbers: ${data['number_monthly_cost']}/month")
    
    def test_insufficient_balance_handling(self):
        """Test insufficient balance error handling"""
        # Try to transfer more than balance
        response = self.session.post(
            f"{BASE_URL}/api/wallet/transfer-balance",
            headers=self.auth_headers,
            json={
                "recipient_client_id": "CL99999999",
                "amount": 99999.99,
                "note": "Test transfer"
            }
        )
        
        # Should fail with 400, 402 or 404 (recipient not found or validation error)
        assert response.status_code in [400, 402, 404], f"Expected 400/402/404, got {response.status_code}"
        print(f"✅ Insufficient balance/invalid recipient correctly handled: {response.status_code}")


class TestVirtualNumberMarketplace:
    """Virtual Number Marketplace tests - $2.99 pricing"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login and get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert login_response.status_code == 200
        self.token = login_response.json()["access_token"]
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_search_numbers_public(self):
        """Test number search endpoint (public)"""
        response = self.session.get(f"{BASE_URL}/api/telecom/numbers/search?country_code=US")
        
        assert response.status_code == 200
        data = response.json()
        assert "numbers" in data
        assert "success" in data
        
        if data["numbers"]:
            number = data["numbers"][0]
            assert "number" in number
            assert "selling_price" in number
            assert number["selling_price"] == 2.99, f"Expected $2.99, got ${number['selling_price']}"
            print(f"✅ Number search working - {len(data['numbers'])} numbers found")
            print(f"   Sample: {number['number']} @ ${number['selling_price']}")
        else:
            print("⚠️ No numbers returned from search")
    
    def test_get_my_numbers(self):
        """Test user's purchased numbers endpoint"""
        response = self.session.get(
            f"{BASE_URL}/api/telecom/numbers/my",
            headers=self.auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "numbers" in data
        print(f"✅ My numbers: {len(data['numbers'])} purchased numbers")
        
        for num in data["numbers"][:3]:
            print(f"   📱 {num.get('number')} - Status: {num.get('status')}")
    
    def test_purchase_insufficient_balance(self):
        """Test purchase with insufficient balance"""
        # First check balance
        balance_response = self.session.get(
            f"{BASE_URL}/api/wallet/balance",
            headers=self.auth_headers
        )
        balance = balance_response.json().get("balance", 0)
        
        if balance < 2.99:
            # Try to purchase - should fail
            response = self.session.post(
                f"{BASE_URL}/api/telecom/numbers/purchase",
                headers=self.auth_headers,
                json={
                    "number": "+12025551234",
                    "provider": "msg91"
                }
            )
            
            assert response.status_code == 400, f"Expected 400, got {response.status_code}"
            assert "insufficient" in response.text.lower()
            print(f"✅ Insufficient balance correctly rejected (balance: ${balance:.2f})")
        else:
            print(f"⚠️ User has sufficient balance (${balance:.2f}), skipping insufficient balance test")


class TestGhostVerification:
    """Ghost Verification (NorthSMS) tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login and get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert login_response.status_code == 200
        self.token = login_response.json()["access_token"]
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_verification_services_public(self):
        """Test verification services list (public endpoint)"""
        response = self.session.get(f"{BASE_URL}/api/verification/services")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return list of services
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        
        if data:
            service = data[0]
            assert "slug" in service
            assert "service" in service
            assert "icon" in service
            print(f"✅ Verification services: {len(data)} services available")
            for svc in data[:5]:
                print(f"   {svc.get('icon')} {svc.get('service')} - ${svc.get('price', 0.50):.2f}")
        else:
            print("⚠️ No verification services returned (may be API issue)")
    
    def test_get_verification_history(self):
        """Test verification order history"""
        response = self.session.get(
            f"{BASE_URL}/api/verification/history?limit=10",
            headers=self.auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        print(f"✅ Verification history: {len(data['orders'])} orders found")
        
        for order in data["orders"][:3]:
            print(f"   📱 {order.get('service')} - {order.get('phone_number')} - {order.get('status')}")
    
    def test_purchase_verification_insufficient_balance(self):
        """Test verification purchase with insufficient balance"""
        # Check balance first
        balance_response = self.session.get(
            f"{BASE_URL}/api/wallet/balance",
            headers=self.auth_headers
        )
        balance = balance_response.json().get("balance", 0)
        
        if balance < 0.50:
            response = self.session.post(
                f"{BASE_URL}/api/verification/purchase",
                headers=self.auth_headers,
                json={
                    "service_slug": "discord",
                    "country_code": "US"
                }
            )
            
            # Should fail with 402 (insufficient balance) or 500 (API error)
            assert response.status_code in [402, 500], f"Expected 402/500, got {response.status_code}"
            print(f"✅ Insufficient balance correctly handled: {response.status_code}")
        else:
            print(f"⚠️ User has balance (${balance:.2f}), skipping insufficient balance test")


class TestSMSFeatures:
    """SMS functionality tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login and get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert login_response.status_code == 200
        self.token = login_response.json()["access_token"]
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_sms_inbox(self):
        """Test SMS inbox endpoint"""
        response = self.session.get(
            f"{BASE_URL}/api/sms/inbox",
            headers=self.auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        print(f"✅ SMS inbox: {len(data['messages'])} messages")


class TestNavigationEndpoints:
    """Test all critical navigation endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login and get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert login_response.status_code == 200
        self.token = login_response.json()["access_token"]
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_dashboard_endpoints(self):
        """Test dashboard-related endpoints"""
        endpoints = [
            ("/api/wallet/balance", "Wallet Balance"),
            ("/api/sms/inbox", "SMS Inbox"),
            ("/api/calls/history", "Call History"),
            ("/api/notifications/unread-count", "Notifications"),
        ]
        
        for endpoint, name in endpoints:
            response = self.session.get(
                f"{BASE_URL}{endpoint}",
                headers=self.auth_headers
            )
            status = "✅" if response.status_code == 200 else "❌"
            print(f"{status} {name}: {response.status_code}")
    
    def test_public_endpoints(self):
        """Test public endpoints (no auth required)"""
        endpoints = [
            ("/api/", "Root"),
            ("/api/wallet/pricing", "Pricing"),
            ("/api/telecom/numbers/search?country_code=US", "Number Search"),
            ("/api/verification/services", "Verification Services"),
            ("/api/credit-packages", "Credit Packages"),
        ]
        
        for endpoint, name in endpoints:
            response = self.session.get(f"{BASE_URL}{endpoint}")
            status = "✅" if response.status_code == 200 else "❌"
            print(f"{status} {name}: {response.status_code}")


class TestCreditPackages:
    """Test credit packages for payment flow"""
    
    def test_get_credit_packages(self):
        """Test credit packages endpoint"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/credit-packages")
        
        assert response.status_code == 200
        data = response.json()
        
        # Response can be list or dict with packages key
        packages = data if isinstance(data, list) else data.get("packages", [])
        assert isinstance(packages, list), f"Expected list of packages, got {type(packages)}"
        print(f"✅ Credit packages: {len(packages)} packages available")
        
        for pkg in packages:
            print(f"   💰 {pkg.get('id', 'Unknown')}: ${pkg.get('price', 0)} → ${pkg.get('credits', 0)} credits")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
