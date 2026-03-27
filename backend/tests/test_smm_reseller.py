"""
SMM Reseller Engine API Tests
Tests for SMMWiz integration, service catalog, order creation, and order tracking
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "testmarketplace@calliotel.com"
TEST_PASSWORD = "Market2024!"


class TestSMMPublicEndpoints:
    """Test public SMM endpoints (no auth required)"""
    
    def test_get_categories(self):
        """Test fetching SMM service categories"""
        response = requests.get(f"{BASE_URL}/api/smm/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "categories" in data
        assert len(data["categories"]) > 0
        
        # Verify expected categories exist
        expected_categories = ["instagram", "tiktok", "youtube", "facebook", "twitter", "telegram", "other"]
        for cat in expected_categories:
            assert cat in data["categories"], f"Missing category: {cat}"
        
        print(f"✅ Categories endpoint working - {len(data['categories'])} categories found")
    
    def test_get_services_catalog(self):
        """Test fetching SMM services catalog with 100% markup"""
        response = requests.get(f"{BASE_URL}/api/smm/services")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "services" in data
        assert "count" in data
        assert data["count"] > 0
        
        # Verify service structure and 100% markup
        service = data["services"][0]
        assert "service_id" in service
        assert "name" in service
        assert "category" in service
        assert "provider_price" in service
        assert "reseller_price" in service
        assert "profit_margin" in service
        assert "min_quantity" in service
        assert "max_quantity" in service
        
        # Verify 100% markup (reseller_price = 2 * provider_price)
        assert service["reseller_price"] == service["provider_price"] * 2, \
            f"Markup incorrect: {service['reseller_price']} != {service['provider_price'] * 2}"
        
        # Verify profit margin
        assert service["profit_margin"] == service["provider_price"], \
            f"Profit margin incorrect: {service['profit_margin']} != {service['provider_price']}"
        
        print(f"✅ Services endpoint working - {data['count']} services with 100% markup")
    
    def test_filter_services_by_category(self):
        """Test filtering services by category"""
        response = requests.get(f"{BASE_URL}/api/smm/services?category=instagram")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        # All services should be Instagram
        for service in data["services"]:
            assert service["category"] == "instagram", f"Wrong category: {service['category']}"
        
        print(f"✅ Category filter working - {data['count']} Instagram services")


class TestSMMAuthentication:
    """Test authentication for SMM endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response.status_code != 200:
            pytest.skip(f"Authentication failed: {response.text}")
        
        return response.json()["access_token"]
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_login_success(self):
        """Test login with test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == TEST_EMAIL
        
        print(f"✅ Login successful for {TEST_EMAIL}")
    
    def test_get_wallet_balance(self, auth_headers):
        """Test getting wallet balance"""
        response = requests.get(f"{BASE_URL}/api/wallet/balance", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "balance" in data
        assert data["balance"] >= 0
        
        print(f"✅ Wallet balance: ${data['balance']}")


class TestSMMOrderFlow:
    """Test SMM order creation and tracking"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response.status_code != 200:
            pytest.skip(f"Authentication failed: {response.text}")
        
        token = response.json()["access_token"]
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture
    def sample_service(self):
        """Get a sample service for testing"""
        response = requests.get(f"{BASE_URL}/api/smm/services")
        if response.status_code != 200:
            pytest.skip("Could not fetch services")
        
        services = response.json()["services"]
        # Find a cheap service for testing
        for service in services:
            if service["reseller_price"] < 1.0 and service["min_quantity"] <= 100:
                return service
        
        return services[0] if services else None
    
    def test_get_my_orders_empty(self, auth_headers):
        """Test getting order history (may be empty)"""
        response = requests.get(f"{BASE_URL}/api/smm/orders/my", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "orders" in data
        assert "count" in data
        
        print(f"✅ Order history endpoint working - {data['count']} orders found")
    
    def test_get_smm_stats(self, auth_headers):
        """Test getting SMM statistics"""
        response = requests.get(f"{BASE_URL}/api/smm/stats", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "stats" in data
        assert "total_orders" in data["stats"]
        
        print(f"✅ SMM stats endpoint working - {data['stats']['total_orders']} total orders")
    
    def test_create_order_insufficient_balance(self, auth_headers, sample_service):
        """Test order creation with insufficient balance"""
        if not sample_service:
            pytest.skip("No sample service available")
        
        # Try to order a huge quantity that would exceed balance
        response = requests.post(
            f"{BASE_URL}/api/smm/order",
            headers=auth_headers,
            json={
                "service_id": sample_service["service_id"],
                "quantity": 10000000,  # Very large quantity
                "target_username": "@testaccount"
            }
        )
        
        # Should fail with 400 (insufficient balance) or 400 (quantity out of range)
        assert response.status_code == 400
        print(f"✅ Insufficient balance check working")
    
    def test_create_order_invalid_service(self, auth_headers):
        """Test order creation with invalid service ID"""
        response = requests.post(
            f"{BASE_URL}/api/smm/order",
            headers=auth_headers,
            json={
                "service_id": "invalid_service_999999",
                "quantity": 100,
                "target_username": "@testaccount"
            }
        )
        
        assert response.status_code == 404
        print(f"✅ Invalid service check working")
    
    def test_create_order_quantity_validation(self, auth_headers, sample_service):
        """Test order creation with invalid quantity"""
        if not sample_service:
            pytest.skip("No sample service available")
        
        # Try to order less than minimum
        response = requests.post(
            f"{BASE_URL}/api/smm/order",
            headers=auth_headers,
            json={
                "service_id": sample_service["service_id"],
                "quantity": 1,  # Less than min_quantity
                "target_username": "@testaccount"
            }
        )
        
        # Should fail with 400 (quantity out of range)
        assert response.status_code == 400
        print(f"✅ Quantity validation working")
    
    def test_create_order_success(self, auth_headers, sample_service):
        """Test successful order creation (LIVE API CALL)"""
        if not sample_service:
            pytest.skip("No sample service available")
        
        # Get current wallet balance
        wallet_response = requests.get(f"{BASE_URL}/api/wallet/balance", headers=auth_headers)
        initial_balance = wallet_response.json()["balance"]
        
        # Calculate expected cost
        quantity = sample_service["min_quantity"]
        expected_cost = (sample_service["reseller_price"] * quantity) / 1000
        
        if initial_balance < expected_cost:
            pytest.skip(f"Insufficient balance: ${initial_balance} < ${expected_cost}")
        
        # Create order
        response = requests.post(
            f"{BASE_URL}/api/smm/order",
            headers=auth_headers,
            json={
                "service_id": sample_service["service_id"],
                "quantity": quantity,
                "target_username": "@calliotel_test"
            }
        )
        
        assert response.status_code == 200, f"Order failed: {response.text}"
        
        data = response.json()
        assert data["success"] is True
        assert "order" in data
        assert "new_balance" in data
        
        order = data["order"]
        assert "order_id" in order
        assert order["service_name"] == sample_service["name"]
        assert order["quantity"] == quantity
        assert order["status"] == "processing"
        
        # Verify wallet deduction
        assert data["new_balance"] < initial_balance
        expected_new_balance = initial_balance - expected_cost
        assert abs(data["new_balance"] - expected_new_balance) < 0.01
        
        print(f"✅ Order created successfully: {order['order_id']}")
        print(f"   Service: {order['service_name']}")
        print(f"   Quantity: {order['quantity']}")
        print(f"   Cost: ${order['total_cost']:.4f}")
        print(f"   New balance: ${data['new_balance']:.2f}")
        
        return order["order_id"]
    
    def test_get_order_status(self, auth_headers):
        """Test getting order status"""
        # First get orders
        orders_response = requests.get(f"{BASE_URL}/api/smm/orders/my", headers=auth_headers)
        orders = orders_response.json().get("orders", [])
        
        if not orders:
            pytest.skip("No orders to check status")
        
        order_id = orders[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/smm/order/{order_id}/status", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "order" in data
        assert data["order"]["id"] == order_id
        
        print(f"✅ Order status: {data['order']['status']}")


class TestSMMAdminEndpoints:
    """Test admin SMM endpoints"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response.status_code != 200:
            pytest.skip(f"Authentication failed: {response.text}")
        
        token = response.json()["access_token"]
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def test_get_provider_balance(self, auth_headers):
        """Test getting SMMWiz provider balance"""
        response = requests.get(f"{BASE_URL}/api/smm/admin/balance", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "balance" in data
        
        print(f"✅ SMMWiz provider balance: ${data['balance']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
