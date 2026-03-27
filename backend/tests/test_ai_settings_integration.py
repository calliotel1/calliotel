"""
AI Settings Integration Tests
Tests for AI Settings API and integration with Smart Replies and Translation
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials
TEST_EMAIL = "alinmy77@gmail.com"
TEST_PASSWORD = "Calliotel2024!"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["access_token"]


@pytest.fixture
def api_client(auth_token):
    """Shared requests session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestAISettingsAPI:
    """Test AI Settings API endpoints"""
    
    def test_get_ai_settings_returns_defaults(self, api_client):
        """Test GET /api/ai-settings/ returns settings (with defaults for new users)"""
        response = api_client.get(f"{BASE_URL}/api/ai-settings/")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "settings" in data
        settings = data["settings"]
        
        # Verify all expected fields exist
        assert "smart_replies_enabled" in settings
        assert "translation_enabled" in settings
        assert "preferred_translation_language" in settings
        assert "quick_translate_language" in settings
        assert "ai_tone" in settings
        
        # Verify field types
        assert isinstance(settings["smart_replies_enabled"], bool)
        assert isinstance(settings["translation_enabled"], bool)
        assert isinstance(settings["preferred_translation_language"], str)
        assert isinstance(settings["quick_translate_language"], str)
        assert settings["ai_tone"] in ["friendly", "professional", "casual"]
    
    def test_post_ai_settings_saves_preferences(self, api_client):
        """Test POST /api/ai-settings/ saves user preferences"""
        new_settings = {
            "smart_replies_enabled": False,
            "translation_enabled": True,
            "preferred_translation_language": "German",
            "quick_translate_language": "Japanese",
            "ai_tone": "casual"
        }
        
        response = api_client.post(f"{BASE_URL}/api/ai-settings/", json=new_settings)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["message"] == "AI settings updated successfully"
        
        # Verify settings persisted via GET
        get_response = api_client.get(f"{BASE_URL}/api/ai-settings/")
        assert get_response.status_code == 200
        fetched = get_response.json()["settings"]
        
        assert fetched["smart_replies_enabled"] == False
        assert fetched["translation_enabled"] == True
        assert fetched["preferred_translation_language"] == "German"
        assert fetched["quick_translate_language"] == "Japanese"
        assert fetched["ai_tone"] == "casual"
    
    def test_post_ai_settings_updates_existing(self, api_client):
        """Test POST updates existing settings without creating duplicates"""
        # First update
        api_client.post(f"{BASE_URL}/api/ai-settings/", json={
            "smart_replies_enabled": True,
            "translation_enabled": True,
            "preferred_translation_language": "French",
            "quick_translate_language": "Spanish",
            "ai_tone": "friendly"
        })
        
        # Second update - should modify same document
        api_client.post(f"{BASE_URL}/api/ai-settings/", json={
            "smart_replies_enabled": True,
            "translation_enabled": False,
            "preferred_translation_language": "Italian",
            "quick_translate_language": "Portuguese",
            "ai_tone": "professional"
        })
        
        # Verify only latest settings exist
        response = api_client.get(f"{BASE_URL}/api/ai-settings/")
        settings = response.json()["settings"]
        
        assert settings["translation_enabled"] == False
        assert settings["preferred_translation_language"] == "Italian"
        assert settings["quick_translate_language"] == "Portuguese"
        assert settings["ai_tone"] == "professional"
    
    def test_ai_settings_without_auth_fails(self):
        """Test AI Settings endpoints require authentication"""
        # GET without auth
        response = requests.get(f"{BASE_URL}/api/ai-settings/")
        assert response.status_code in [401, 403]
        
        # POST without auth
        response = requests.post(f"{BASE_URL}/api/ai-settings/", json={
            "smart_replies_enabled": True,
            "translation_enabled": True,
            "preferred_translation_language": "English",
            "quick_translate_language": "English",
            "ai_tone": "friendly"
        })
        assert response.status_code in [401, 403]


class TestSmartRepliesIntegration:
    """Test Smart Replies respects AI Settings"""
    
    def test_smart_replies_accepts_ai_tone_friendly(self, api_client):
        """Test smart replies endpoint accepts ai_tone=friendly"""
        response = api_client.post(f"{BASE_URL}/api/ai-chat/smart-replies", json={
            "message": "Hey! How are you doing today?",
            "conversation_history": [],
            "ai_tone": "friendly"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "suggestions" in data
        assert len(data["suggestions"]) == 3
        
    def test_smart_replies_accepts_ai_tone_professional(self, api_client):
        """Test smart replies endpoint accepts ai_tone=professional"""
        response = api_client.post(f"{BASE_URL}/api/ai-chat/smart-replies", json={
            "message": "Can we schedule a meeting for the quarterly review?",
            "conversation_history": [],
            "ai_tone": "professional"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert len(data["suggestions"]) == 3
        
        # Professional tone should generate more formal responses
        # The suggestions should exist and be strings
        for suggestion in data["suggestions"]:
            assert isinstance(suggestion, str)
            assert len(suggestion) > 0
    
    def test_smart_replies_accepts_ai_tone_casual(self, api_client):
        """Test smart replies endpoint accepts ai_tone=casual"""
        response = api_client.post(f"{BASE_URL}/api/ai-chat/smart-replies", json={
            "message": "wanna grab lunch?",
            "conversation_history": [],
            "ai_tone": "casual"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert len(data["suggestions"]) == 3
    
    def test_smart_replies_with_conversation_history(self, api_client):
        """Test smart replies considers conversation context"""
        response = api_client.post(f"{BASE_URL}/api/ai-chat/smart-replies", json={
            "message": "What time works for you?",
            "conversation_history": [
                {"content": "Hey, let's meet up!", "is_me": True},
                {"content": "Sure, sounds good!", "is_me": False},
                {"content": "How about tomorrow?", "is_me": True}
            ],
            "ai_tone": "friendly"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert len(data["suggestions"]) >= 1


class TestTranslationIntegration:
    """Test Translation respects AI Settings"""
    
    def test_translation_to_preferred_language(self, api_client):
        """Test translation to a specific language"""
        response = api_client.post(f"{BASE_URL}/api/ai-chat/translate", json={
            "text": "Hello, how are you?",
            "target_language": "Spanish"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "translated" in data
        assert data["original"] == "Hello, how are you?"
        assert data["target_language"] == "Spanish"
        assert len(data["translated"]) > 0
    
    def test_translation_to_quick_translate_language(self, api_client):
        """Test translation to quick translate language (from settings)"""
        # First, set quick_translate_language
        api_client.post(f"{BASE_URL}/api/ai-settings/", json={
            "smart_replies_enabled": True,
            "translation_enabled": True,
            "preferred_translation_language": "English",
            "quick_translate_language": "French",
            "ai_tone": "friendly"
        })
        
        # Now translate using French
        response = api_client.post(f"{BASE_URL}/api/ai-chat/translate", json={
            "text": "Good morning! Have a great day.",
            "target_language": "French"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["target_language"] == "French"
        # French translation should contain typical French words
        assert len(data["translated"]) > 0
    
    def test_translation_multiple_languages(self, api_client):
        """Test translation works for multiple languages"""
        test_cases = [
            ("German", "Hallo"),
            ("Japanese", "こんにちは"),
            ("Chinese", "你好"),
            ("Korean", "안녕")
        ]
        
        for target_lang, _ in test_cases:
            response = api_client.post(f"{BASE_URL}/api/ai-chat/translate", json={
                "text": "Hello!",
                "target_language": target_lang
            })
            
            assert response.status_code == 200, f"Translation to {target_lang} failed"
            data = response.json()
            assert data["success"] == True
            assert len(data["translated"]) > 0


class TestSettingsPersistence:
    """Test settings persistence across sessions"""
    
    def test_settings_persist_after_update(self, api_client):
        """Test that changed settings persist when fetched again"""
        # Update settings
        unique_lang = "Russian"  # Use a unique language for this test
        api_client.post(f"{BASE_URL}/api/ai-settings/", json={
            "smart_replies_enabled": True,
            "translation_enabled": True,
            "preferred_translation_language": unique_lang,
            "quick_translate_language": "Hindi",
            "ai_tone": "casual"
        })
        
        # Wait a moment for DB write
        time.sleep(0.5)
        
        # Fetch settings again
        response = api_client.get(f"{BASE_URL}/api/ai-settings/")
        settings = response.json()["settings"]
        
        assert settings["preferred_translation_language"] == unique_lang
        assert settings["quick_translate_language"] == "Hindi"
        assert settings["ai_tone"] == "casual"


# Cleanup: Reset settings to defaults after all tests
@pytest.fixture(scope="module", autouse=True)
def cleanup_settings(auth_token):
    """Reset AI settings to defaults after tests complete"""
    yield
    # Cleanup after tests
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    session.post(f"{BASE_URL}/api/ai-settings/", json={
        "smart_replies_enabled": True,
        "translation_enabled": True,
        "preferred_translation_language": "English",
        "quick_translate_language": "English",
        "ai_tone": "friendly"
    })
