"""
Backend API Tests for Calliotel Phase 1 Features
- Teams Management API
- Voicemail API  
- AI Assistant API
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = f"test_phase1_{int(time.time())}@calliotel.com"
TEST_PASSWORD = "TestPass123!"
TEST_NAME = "Phase1 Test User"

# Second test user for team invite testing
TEST_EMAIL_2 = f"test_member_{int(time.time())}@calliotel.com"

class TestSetup:
    """Setup: Create test users and get auth tokens"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Create test user and get auth token"""
        # Signup new user
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": TEST_NAME
        })
        
        if signup_response.status_code == 200:
            data = signup_response.json()
            return data.get("access_token")
        
        # If already exists, try login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code == 200:
            return login_response.json().get("access_token")
        
        pytest.skip("Could not authenticate test user")
    
    @pytest.fixture(scope="class")
    def second_user_token(self):
        """Create second test user for invite testing"""
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": TEST_EMAIL_2,
            "password": TEST_PASSWORD,
            "full_name": "Second Test User"
        })
        
        if signup_response.status_code == 200:
            return signup_response.json().get("access_token")
        
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL_2,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code == 200:
            return login_response.json().get("access_token")
        
        return None
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Get authenticated headers"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }


# ============== TEAMS API TESTS ==============

class TestTeamsAPI(TestSetup):
    """Teams Management API Tests"""
    
    created_team_id = None
    
    def test_create_team(self, headers):
        """Test creating a new team"""
        response = requests.post(
            f"{BASE_URL}/api/teams/create",
            json={
                "name": "TEST_Phase1 Team",
                "description": "Test team for Phase 1 testing"
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "team_id" in data
        assert data.get("message") == "Team created successfully"
        
        # Save team ID for later tests
        TestTeamsAPI.created_team_id = data.get("team_id")
        print(f"Created team ID: {TestTeamsAPI.created_team_id}")
    
    def test_get_my_teams(self, headers):
        """Test getting user's teams list"""
        response = requests.get(
            f"{BASE_URL}/api/teams/my-teams",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "teams" in data
        assert isinstance(data["teams"], list)
        
        # Verify our created team exists
        if TestTeamsAPI.created_team_id:
            team_ids = [t.get("id") for t in data["teams"]]
            assert TestTeamsAPI.created_team_id in team_ids, "Created team not found in my-teams"
    
    def test_get_team_details(self, headers):
        """Test getting team details by ID"""
        if not TestTeamsAPI.created_team_id:
            pytest.skip("No team created to test")
        
        response = requests.get(
            f"{BASE_URL}/api/teams/{TestTeamsAPI.created_team_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "team" in data
        
        team = data["team"]
        assert team.get("id") == TestTeamsAPI.created_team_id
        assert team.get("name") == "TEST_Phase1 Team"
        assert "members" in team
        assert "stats" in team
    
    def test_update_team(self, headers):
        """Test updating team details"""
        if not TestTeamsAPI.created_team_id:
            pytest.skip("No team created to test")
        
        response = requests.put(
            f"{BASE_URL}/api/teams/{TestTeamsAPI.created_team_id}",
            json={
                "name": "TEST_Updated Team Name",
                "description": "Updated description"
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
    
    def test_invite_member_user_not_found(self, headers):
        """Test inviting non-existent user returns error"""
        if not TestTeamsAPI.created_team_id:
            pytest.skip("No team created to test")
        
        response = requests.post(
            f"{BASE_URL}/api/teams/{TestTeamsAPI.created_team_id}/invite",
            json={
                "email": "nonexistent@example.com",
                "role": "member"
            },
            headers=headers
        )
        
        # Should return 404 for user not found
        assert response.status_code == 404, f"Expected 404 for non-existent user, got {response.status_code}"
    
    def test_invite_existing_member(self, headers, second_user_token):
        """Test inviting an existing user to team"""
        if not TestTeamsAPI.created_team_id:
            pytest.skip("No team created to test")
        
        if not second_user_token:
            pytest.skip("Could not create second test user")
        
        response = requests.post(
            f"{BASE_URL}/api/teams/{TestTeamsAPI.created_team_id}/invite",
            json={
                "email": TEST_EMAIL_2,
                "role": "member"
            },
            headers=headers
        )
        
        # Should succeed
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
    
    def test_get_team_numbers_empty(self, headers):
        """Test getting team numbers (should be empty initially)"""
        if not TestTeamsAPI.created_team_id:
            pytest.skip("No team created to test")
        
        response = requests.get(
            f"{BASE_URL}/api/teams/{TestTeamsAPI.created_team_id}/numbers",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "numbers" in data
    
    def test_get_team_activity(self, headers):
        """Test getting team activity"""
        if not TestTeamsAPI.created_team_id:
            pytest.skip("No team created to test")
        
        response = requests.get(
            f"{BASE_URL}/api/teams/{TestTeamsAPI.created_team_id}/activity",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
    
    def test_get_nonexistent_team(self, headers):
        """Test getting non-existent team returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/teams/nonexistent-team-id-12345",
            headers=headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


# ============== VOICEMAIL API TESTS ==============

class TestVoicemailAPI(TestSetup):
    """Voicemail API Tests"""
    
    def test_get_voicemail_list(self, headers):
        """Test getting voicemail list"""
        response = requests.get(
            f"{BASE_URL}/api/voicemail/list",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "voicemails" in data
        assert isinstance(data["voicemails"], list)
        assert "total" in data
        assert "unread_count" in data
    
    def test_get_voicemail_list_unread_only(self, headers):
        """Test getting unread voicemails only"""
        response = requests.get(
            f"{BASE_URL}/api/voicemail/list?unread_only=true",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
    
    def test_get_voicemail_stats(self, headers):
        """Test getting voicemail statistics"""
        response = requests.get(
            f"{BASE_URL}/api/voicemail/stats",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "stats" in data
        
        stats = data["stats"]
        assert "total" in stats
        assert "unread" in stats
        assert "archived" in stats
        assert "avg_duration_seconds" in stats
    
    def test_get_voicemail_settings(self, headers):
        """Test getting voicemail settings"""
        response = requests.get(
            f"{BASE_URL}/api/voicemail/settings",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "settings" in data
        
        settings = data["settings"]
        assert "greeting_message" in settings
        assert "transcription_enabled" in settings
        assert "email_notifications" in settings
        assert "max_duration_seconds" in settings
    
    def test_update_voicemail_settings(self, headers):
        """Test updating voicemail settings"""
        new_settings = {
            "greeting_message": "Hello, this is a test greeting!",
            "transcription_enabled": True,
            "email_notifications": False,
            "max_duration_seconds": 120
        }
        
        response = requests.put(
            f"{BASE_URL}/api/voicemail/settings",
            json=new_settings,
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        
        # Verify settings were saved
        get_response = requests.get(
            f"{BASE_URL}/api/voicemail/settings",
            headers=headers
        )
        
        get_data = get_response.json()
        saved_settings = get_data.get("settings", {})
        assert saved_settings.get("greeting_message") == new_settings["greeting_message"]
        assert saved_settings.get("max_duration_seconds") == new_settings["max_duration_seconds"]
    
    def test_get_nonexistent_voicemail(self, headers):
        """Test getting non-existent voicemail returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/voicemail/nonexistent-voicemail-id",
            headers=headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_get_call_recordings(self, headers):
        """Test getting call recordings list"""
        response = requests.get(
            f"{BASE_URL}/api/voicemail/recordings/list",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "recordings" in data


# ============== AI ASSISTANT API TESTS ==============

class TestAIAssistantAPI(TestSetup):
    """AI Assistant API Tests"""
    
    def test_smart_reply(self, headers):
        """Test AI smart reply generation"""
        response = requests.post(
            f"{BASE_URL}/api/ai/smart-reply",
            json={
                "conversation_context": [
                    "Hi, when can we meet?",
                    "I'm available tomorrow afternoon."
                ],
                "max_suggestions": 3
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "suggestions" in data
        assert isinstance(data["suggestions"], list)
        assert len(data["suggestions"]) > 0
        print(f"AI Smart Reply suggestions: {data['suggestions']}")
    
    def test_sentiment_analysis(self, headers):
        """Test AI sentiment analysis"""
        response = requests.post(
            f"{BASE_URL}/api/ai/sentiment",
            json={
                "message": "I'm so happy with your service! Thank you!"
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "sentiment" in data
        assert data["sentiment"] in ["positive", "negative", "neutral"]
        assert "emoji" in data
        print(f"Sentiment: {data['sentiment']} {data['emoji']}")
    
    def test_message_categorization(self, headers):
        """Test AI message categorization"""
        response = requests.post(
            f"{BASE_URL}/api/ai/categorize",
            json={
                "message": "Your order #12345 has been shipped and will arrive tomorrow."
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "category" in data
        assert data["category"] in ["personal", "work", "promotional", "transactional", "spam"]
        assert "info" in data
        print(f"Category: {data['category']}")
    
    def test_spam_check(self, headers):
        """Test AI spam detection"""
        response = requests.post(
            f"{BASE_URL}/api/ai/spam-check",
            json={
                "message": "CONGRATULATIONS! You've won $1,000,000! Click here NOW!"
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "is_spam" in data
        assert isinstance(data["is_spam"], bool)
        print(f"Is spam: {data['is_spam']}, Reason: {data.get('reason', 'N/A')}")
    
    def test_message_enhancement(self, headers):
        """Test AI message enhancement"""
        response = requests.post(
            f"{BASE_URL}/api/ai/enhance",
            json={
                "message": "hey im gonna be late 2 the mtg"
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "original" in data
        assert "enhanced" in data
        print(f"Enhanced: {data['enhanced']}")
    
    def test_ai_stats(self, headers):
        """Test getting AI usage statistics"""
        response = requests.get(
            f"{BASE_URL}/api/ai/stats",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "stats" in data


# ============== CLEANUP ==============

class TestCleanup(TestSetup):
    """Cleanup: Delete test data"""
    
    def test_delete_team(self, headers):
        """Delete the test team"""
        if not TestTeamsAPI.created_team_id:
            pytest.skip("No team to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/teams/{TestTeamsAPI.created_team_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/teams/{TestTeamsAPI.created_team_id}",
            headers=headers
        )
        assert get_response.status_code == 404, "Team should be deleted"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
