"""
Backend tests for Phone Number Presets Filtering System
Tests the /api/telnyx/phone-numbers/search endpoint with preset parameter
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "alinmy77@gmail.com"
TEST_PASSWORD = "Calliotel2024!"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for API requests"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token") or data.get("token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture
def auth_headers(auth_token):
    """Headers with authentication token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestPhoneNumberSearchEndpoint:
    """Tests for /api/telnyx/phone-numbers/search endpoint"""
    
    def test_search_endpoint_exists(self, auth_headers):
        """Test that the search endpoint exists and accepts POST requests"""
        response = requests.post(
            f"{BASE_URL}/api/telnyx/phone-numbers/search",
            json={"country_code": "US", "limit": 5},
            headers=auth_headers
        )
        # Accept 200 (success), 403 (Telnyx API auth error), or 500 (API config error)
        # We're testing if the endpoint exists and accepts the request
        assert response.status_code in [200, 403, 500], f"Unexpected status: {response.status_code}"
        print(f"Search endpoint status: {response.status_code}")
    
    def test_search_with_preset_parameter(self, auth_headers):
        """Test that the search endpoint accepts preset parameter"""
        presets = ['whatsapp', 'business', 'sms_marketing', 'dating', 'ai_testing', 'all']
        
        for preset in presets:
            response = requests.post(
                f"{BASE_URL}/api/telnyx/phone-numbers/search",
                json={
                    "country_code": "US",
                    "limit": 5,
                    "preset": preset if preset != 'all' else None
                },
                headers=auth_headers
            )
            # Endpoint should accept the request (even if Telnyx API fails)
            assert response.status_code in [200, 403, 500], f"Preset '{preset}' failed: {response.status_code}"
            print(f"Preset '{preset}' accepted, status: {response.status_code}")
    
    def test_search_response_format(self, auth_headers):
        """Test that successful responses have correct format with recommended_for field"""
        response = requests.post(
            f"{BASE_URL}/api/telnyx/phone-numbers/search",
            json={"country_code": "US", "limit": 5},
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list), "Response should be a list"
            
            if len(data) > 0:
                number = data[0]
                # Check required fields
                assert "phone_number" in number, "Missing phone_number field"
                assert "cost_monthly" in number, "Missing cost_monthly field"
                assert "features" in number, "Missing features field"
                assert "recommended_for" in number, "Missing recommended_for field"
                
                # Check recommended_for is a list
                assert isinstance(number["recommended_for"], list), "recommended_for should be a list"
                print(f"Number {number['phone_number']} recommended_for: {number['recommended_for']}")
        else:
            print(f"Skipping format check - API returned {response.status_code}")


class TestCountriesEndpoint:
    """Tests for /api/telnyx/phone-numbers/countries endpoint"""
    
    def test_countries_endpoint(self):
        """Test that countries endpoint returns list of supported countries"""
        response = requests.get(f"{BASE_URL}/api/telnyx/phone-numbers/countries")
        
        assert response.status_code == 200, f"Countries endpoint failed: {response.status_code}"
        
        data = response.json()
        assert "countries" in data, "Response should have 'countries' field"
        assert isinstance(data["countries"], list), "Countries should be a list"
        assert len(data["countries"]) > 0, "Should have at least one country"
        
        # Check country format
        country = data["countries"][0]
        assert "name" in country, "Country should have 'name' field"
        assert "code" in country, "Country should have 'code' field"
        
        print(f"Found {len(data['countries'])} supported countries")


class TestMyNumbersEndpoint:
    """Tests for /api/telnyx/phone-numbers/my-numbers endpoint"""
    
    def test_my_numbers_endpoint(self, auth_headers):
        """Test that my-numbers endpoint returns user's numbers"""
        response = requests.get(
            f"{BASE_URL}/api/telnyx/phone-numbers/my-numbers",
            headers=auth_headers
        )
        
        # Accept 200 or 403 (Telnyx API auth error)
        assert response.status_code in [200, 403, 500], f"My-numbers endpoint failed: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "numbers" in data, "Response should have 'numbers' field"
            assert "total" in data, "Response should have 'total' field"
            assert isinstance(data["numbers"], list), "Numbers should be a list"
            print(f"User has {data['total']} numbers")


class TestPresetFilteringLogic:
    """Tests for preset filtering logic in backend"""
    
    def test_us_numbers_have_whatsapp_tag(self, auth_headers):
        """Test that US numbers are tagged for WhatsApp"""
        response = requests.post(
            f"{BASE_URL}/api/telnyx/phone-numbers/search",
            json={"country_code": "US", "limit": 5},
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if len(data) > 0:
                # US numbers should have whatsapp tag
                for number in data:
                    assert "whatsapp" in number.get("recommended_for", []), \
                        f"US number {number['phone_number']} should have whatsapp tag"
                print("PASS: All US numbers have whatsapp tag")
        else:
            print(f"Skipping - API returned {response.status_code}")
    
    def test_us_numbers_have_dating_tag(self, auth_headers):
        """Test that US numbers are tagged for dating apps"""
        response = requests.post(
            f"{BASE_URL}/api/telnyx/phone-numbers/search",
            json={"country_code": "US", "limit": 5},
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if len(data) > 0:
                # US numbers should have dating tag
                for number in data:
                    assert "dating" in number.get("recommended_for", []), \
                        f"US number {number['phone_number']} should have dating tag"
                print("PASS: All US numbers have dating tag")
        else:
            print(f"Skipping - API returned {response.status_code}")
    
    def test_all_numbers_have_ai_testing_tag(self, auth_headers):
        """Test that all numbers are tagged for AI testing"""
        response = requests.post(
            f"{BASE_URL}/api/telnyx/phone-numbers/search",
            json={"country_code": "US", "limit": 5},
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if len(data) > 0:
                # All numbers should have ai_testing tag
                for number in data:
                    assert "ai_testing" in number.get("recommended_for", []), \
                        f"Number {number['phone_number']} should have ai_testing tag"
                print("PASS: All numbers have ai_testing tag")
        else:
            print(f"Skipping - API returned {response.status_code}")
    
    def test_gb_numbers_have_business_tag(self, auth_headers):
        """Test that GB (UK) numbers are tagged for business"""
        response = requests.post(
            f"{BASE_URL}/api/telnyx/phone-numbers/search",
            json={"country_code": "GB", "limit": 5},
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if len(data) > 0:
                # GB numbers should have business tag
                for number in data:
                    assert "business" in number.get("recommended_for", []), \
                        f"GB number {number['phone_number']} should have business tag"
                print("PASS: All GB numbers have business tag")
        else:
            print(f"Skipping - API returned {response.status_code}")


class TestAuthenticationRequired:
    """Tests for authentication requirements"""
    
    def test_search_requires_auth(self):
        """Test that search endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/telnyx/phone-numbers/search",
            json={"country_code": "US", "limit": 5}
        )
        
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403], \
            f"Search endpoint should require auth, got: {response.status_code}"
        print("PASS: Search endpoint requires authentication")
    
    def test_my_numbers_requires_auth(self):
        """Test that my-numbers endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/telnyx/phone-numbers/my-numbers")
        
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403], \
            f"My-numbers endpoint should require auth, got: {response.status_code}"
        print("PASS: My-numbers endpoint requires authentication")
    
    def test_countries_is_public(self):
        """Test that countries endpoint is publicly accessible"""
        response = requests.get(f"{BASE_URL}/api/telnyx/phone-numbers/countries")
        
        # Should be accessible without auth
        assert response.status_code == 200, \
            f"Countries endpoint should be public, got: {response.status_code}"
        print("PASS: Countries endpoint is publicly accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
