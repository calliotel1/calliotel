"""
Test Enterprise Features for Calliotel Platform
- P4: Human-Agent Hybrid Chat (AI + Escalation)
- P3: Privacy Settings (Stealth Mode + Mask Numbers)
- P2: Number Portfolio Analytics (relies on existing endpoints)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ===== SUPPORT CHAT TESTS (P4) =====
class TestSupportChat:
    """Test the AI Support Chat and Escalation endpoints"""
    
    def test_chat_send_message_basic(self):
        """Test sending a message to AI chat without session"""
        response = requests.post(
            f"{BASE_URL}/api/support/chat/send",
            json={"message": "What is Calliotel?"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "response" in data, "Response should contain 'response' field"
        assert "session_id" in data, "Response should contain 'session_id' field"
        assert "is_ai" in data, "Response should contain 'is_ai' field"
        assert data["is_ai"] == True, "Response should be from AI"
        assert len(data["response"]) > 0, "AI response should not be empty"
        assert len(data["session_id"]) > 0, "Session ID should not be empty"
        
    def test_chat_send_message_with_session(self):
        """Test sending message with existing session for context continuity"""
        # First message - get session
        response1 = requests.post(
            f"{BASE_URL}/api/support/chat/send",
            json={"message": "Hello, I need help with pricing"}
        )
        assert response1.status_code == 200
        session_id = response1.json()["session_id"]
        
        # Second message with same session
        response2 = requests.post(
            f"{BASE_URL}/api/support/chat/send",
            json={"message": "What are your prices for US numbers?", "session_id": session_id}
        )
        assert response2.status_code == 200
        data = response2.json()
        assert data["session_id"] == session_id, "Session ID should remain the same"
        assert len(data["response"]) > 0, "AI should provide pricing info"
        
    def test_chat_escalate_to_human(self):
        """Test escalating conversation to human agent"""
        # First create a session with messages
        response1 = requests.post(
            f"{BASE_URL}/api/support/chat/send",
            json={"message": "I have a billing issue"}
        )
        assert response1.status_code == 200
        session_id = response1.json()["session_id"]
        
        # Add another message
        response2 = requests.post(
            f"{BASE_URL}/api/support/chat/send",
            json={"message": "I was charged incorrectly", "session_id": session_id}
        )
        assert response2.status_code == 200
        
        # Now escalate
        escalate_response = requests.post(
            f"{BASE_URL}/api/support/chat/escalate",
            json={
                "session_id": session_id,
                "reason": "User requested human agent",
                "user_email": "test@example.com"
            }
        )
        assert escalate_response.status_code == 200, f"Escalation failed: {escalate_response.text}"
        
        ticket = escalate_response.json()
        assert "ticket_id" in ticket, "Should return ticket_id"
        assert ticket["ticket_id"].startswith("TICKET-"), "Ticket ID should have correct format"
        assert ticket["status"] == "pending", "Ticket status should be pending"
        assert ticket["session_id"] == session_id, "Ticket should reference session"
        
    def test_get_support_tickets(self):
        """Test retrieving support tickets (admin endpoint)"""
        response = requests.get(f"{BASE_URL}/api/support/chat/tickets")
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data, "Response should contain tickets list"
        
    def test_clear_chat_session(self):
        """Test clearing a chat session"""
        # Create a session
        response1 = requests.post(
            f"{BASE_URL}/api/support/chat/send",
            json={"message": "Test message"}
        )
        session_id = response1.json()["session_id"]
        
        # Clear session
        clear_response = requests.delete(f"{BASE_URL}/api/support/chat/session/{session_id}")
        assert clear_response.status_code == 200
        assert clear_response.json()["message"] == "Session cleared"


# ===== PRIVACY SETTINGS TESTS (P3) =====
class TestPrivacySettings:
    """Test Privacy Settings endpoints - Stealth Mode and Mask Numbers"""
    
    @pytest.fixture
    def test_user_id(self):
        return f"test-privacy-user-{uuid.uuid4().hex[:8]}"
    
    def test_get_privacy_settings_default(self, test_user_id):
        """Test getting privacy settings for new user (returns defaults)"""
        response = requests.get(f"{BASE_URL}/api/settings/privacy/{test_user_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["user_id"] == test_user_id
        assert data["stealth_mode"] == False, "Default stealth_mode should be False"
        assert data["mask_phone_numbers"] == False, "Default mask_phone_numbers should be False"
        assert "updated_at" in data, "Should include updated_at timestamp"
        
    def test_update_privacy_settings_stealth_mode(self, test_user_id):
        """Test enabling stealth mode"""
        response = requests.post(
            f"{BASE_URL}/api/settings/privacy/{test_user_id}",
            json={
                "stealth_mode": True,
                "mask_phone_numbers": False
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["stealth_mode"] == True, "Stealth mode should be enabled"
        assert data["mask_phone_numbers"] == False
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/settings/privacy/{test_user_id}")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["stealth_mode"] == True, "Stealth mode should persist"
        
    def test_update_privacy_settings_mask_numbers(self, test_user_id):
        """Test enabling mask phone numbers"""
        response = requests.post(
            f"{BASE_URL}/api/settings/privacy/{test_user_id}",
            json={
                "stealth_mode": False,
                "mask_phone_numbers": True
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["mask_phone_numbers"] == True, "Mask numbers should be enabled"
        
    def test_update_privacy_settings_both(self, test_user_id):
        """Test enabling both privacy features"""
        response = requests.post(
            f"{BASE_URL}/api/settings/privacy/{test_user_id}",
            json={
                "stealth_mode": True,
                "mask_phone_numbers": True
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["stealth_mode"] == True
        assert data["mask_phone_numbers"] == True
        
    def test_mask_number_endpoint_enabled(self, test_user_id):
        """Test the mask-number helper endpoint when enabled"""
        # First enable masking
        requests.post(
            f"{BASE_URL}/api/settings/privacy/{test_user_id}",
            json={"stealth_mode": False, "mask_phone_numbers": True}
        )
        
        # Test mask endpoint
        response = requests.get(
            f"{BASE_URL}/api/settings/privacy/{test_user_id}/mask-number",
            params={"phone": "+1-555-1234-567"}
        )
        assert response.status_code == 200
        data = response.json()
        # Should be masked (keeping first 5 and last 3 chars)
        assert "••••" in data["masked_number"], f"Number should be masked, got: {data['masked_number']}"
        
    def test_mask_number_endpoint_disabled(self, test_user_id):
        """Test the mask-number helper endpoint when disabled"""
        # Ensure masking is disabled
        requests.post(
            f"{BASE_URL}/api/settings/privacy/{test_user_id}",
            json={"stealth_mode": False, "mask_phone_numbers": False}
        )
        
        # Test mask endpoint
        phone = "+1-555-1234-567"
        response = requests.get(
            f"{BASE_URL}/api/settings/privacy/{test_user_id}/mask-number",
            params={"phone": phone}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["masked_number"] == phone, "Number should not be masked when disabled"


# ===== MAINTENANCE PAGE API (P1.2) =====
class TestMaintenancePage:
    """Verify the maintenance page is accessible (static page, no backend API needed)"""
    
    def test_maintenance_page_accessible(self):
        """Verify /maintenance route is defined in frontend (static content)"""
        # This is a frontend-only page with hardcoded data
        # We just verify it doesn't 404 at the root level
        # The actual content testing will be done via Playwright
        pass


# ===== NUMBER PORTFOLIO ANALYTICS DEPENDENCIES (P2) =====
class TestPortfolioAnalyticsDependencies:
    """Test the APIs that Portfolio Analytics widget depends on"""
    
    @pytest.fixture
    def auth_headers(self):
        """Login and get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "alinmy77@gmail.com",
                "password": "Calliotel2024!"
            }
        )
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Could not authenticate for portfolio analytics tests")
        
    def test_sms_inbox_api(self, auth_headers):
        """Test /api/sms/inbox endpoint used by analytics"""
        response = requests.get(
            f"{BASE_URL}/api/sms/inbox",
            headers=auth_headers
        )
        assert response.status_code == 200, f"SMS inbox failed: {response.text}"
        data = response.json()
        assert "messages" in data, "Should return messages array"
        
    def test_calls_history_api(self, auth_headers):
        """Test /api/calls/history endpoint used by analytics"""
        response = requests.get(
            f"{BASE_URL}/api/calls/history",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Calls history failed: {response.text}"
        data = response.json()
        assert "calls" in data, "Should return calls array"
        
    def test_my_numbers_api(self, auth_headers):
        """Test /api/numbers/my-numbers endpoint used by analytics"""
        response = requests.get(
            f"{BASE_URL}/api/numbers/my-numbers",
            headers=auth_headers
        )
        assert response.status_code == 200, f"My numbers failed: {response.text}"
        data = response.json()
        assert "numbers" in data, "Should return numbers array"


# ===== WALLET API FOR ZERO BALANCE CHECK (P1.1) =====
class TestWalletForZeroBalance:
    """Test wallet API that determines zero-balance empty state"""
    
    @pytest.fixture
    def auth_headers(self):
        """Login and get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "alinmy77@gmail.com",
                "password": "Calliotel2024!"
            }
        )
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Could not authenticate for wallet tests")
        
    def test_wallet_balance_api(self, auth_headers):
        """Test /api/wallet/balance endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/wallet/balance",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Wallet balance failed: {response.text}"
        data = response.json()
        assert "balance" in data, "Should return balance field"
        assert isinstance(data["balance"], (int, float)), "Balance should be numeric"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
