"""
Test AI Features (Smart Replies & Translation)
Tests the new AI chat features powered by OpenAI GPT-4o-mini via emergentintegrations
"""

import pytest
import requests
import os

# Use environment variable for BASE_URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "alinmy77@gmail.com"
TEST_PASSWORD = "Calliotel2024!"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Authentication failed: {response.status_code}")


@pytest.fixture
def authenticated_client(auth_token):
    """Create session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestSmartReplies:
    """Smart Replies API tests - POST /api/ai-chat/smart-replies"""
    
    def test_smart_replies_basic(self, authenticated_client):
        """Test basic smart reply generation"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-chat/smart-replies",
            json={
                "message": "Hey! How are you doing?",
                "conversation_history": [],
                "language": "en"
            }
        )
        
        # Status code assertion
        assert response.status_code == 200
        
        # Data assertions
        data = response.json()
        assert data["success"] is True
        assert "suggestions" in data
        assert isinstance(data["suggestions"], list)
        assert len(data["suggestions"]) == 3  # Should return 3 suggestions
        
        # Each suggestion should be a non-empty string
        for suggestion in data["suggestions"]:
            assert isinstance(suggestion, str)
            assert len(suggestion) > 0
        
        print(f"Smart replies generated: {data['suggestions']}")
    
    def test_smart_replies_with_conversation_history(self, authenticated_client):
        """Test smart replies with conversation context"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-chat/smart-replies",
            json={
                "message": "Want to grab dinner tonight?",
                "conversation_history": [
                    {"content": "Hey!", "is_me": False},
                    {"content": "Hi! How are you?", "is_me": True},
                    {"content": "Good! Are you free later?", "is_me": False}
                ],
                "language": "en"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["suggestions"]) == 3
        print(f"Context-aware replies: {data['suggestions']}")
    
    def test_smart_replies_question_response(self, authenticated_client):
        """Test replies to a question"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-chat/smart-replies",
            json={
                "message": "Can you help me with something?",
                "conversation_history": []
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["suggestions"]) >= 1  # At least 1 suggestion
    
    def test_smart_replies_unauthorized(self):
        """Test that endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/smart-replies",
            json={"message": "Hello"}
        )
        
        # Should fail without auth token
        assert response.status_code in [401, 403]


class TestTranslation:
    """Translation API tests - POST /api/ai-chat/translate"""
    
    def test_translate_to_spanish(self, authenticated_client):
        """Test translation to Spanish"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-chat/translate",
            json={
                "text": "Hello, how are you today?",
                "target_language": "Spanish"
            }
        )
        
        # Status code assertion
        assert response.status_code == 200
        
        # Data assertions
        data = response.json()
        assert data["success"] is True
        assert "translated" in data
        assert "original" in data
        assert data["original"] == "Hello, how are you today?"
        assert data["target_language"] == "Spanish"
        assert len(data["translated"]) > 0
        
        # Verify Spanish translation contains expected words
        translated = data["translated"].lower()
        assert any(word in translated for word in ["hola", "cómo", "estás", "está", "qué tal"])
        
        print(f"Translation: '{data['original']}' -> '{data['translated']}'")
    
    def test_translate_to_french(self, authenticated_client):
        """Test translation to French"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-chat/translate",
            json={
                "text": "I am doing great, thanks for asking!",
                "target_language": "French"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["target_language"] == "French"
        assert len(data["translated"]) > 0
        print(f"French translation: {data['translated']}")
    
    def test_translate_to_german(self, authenticated_client):
        """Test translation to German"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-chat/translate",
            json={
                "text": "Good morning! Have a nice day.",
                "target_language": "German"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"German translation: {data['translated']}")
    
    def test_translate_to_japanese(self, authenticated_client):
        """Test translation to Japanese"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-chat/translate",
            json={
                "text": "Thank you very much!",
                "target_language": "Japanese"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["translated"]) > 0
        print(f"Japanese translation: {data['translated']}")
    
    def test_translate_to_chinese(self, authenticated_client):
        """Test translation to Chinese"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-chat/translate",
            json={
                "text": "Nice to meet you!",
                "target_language": "Chinese"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"Chinese translation: {data['translated']}")
    
    def test_translate_unauthorized(self):
        """Test that endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/translate",
            json={
                "text": "Hello",
                "target_language": "Spanish"
            }
        )
        
        # Should fail without auth token
        assert response.status_code in [401, 403]
    
    def test_translate_missing_text(self, authenticated_client):
        """Test validation - missing text field"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-chat/translate",
            json={"target_language": "Spanish"}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_translate_missing_target_language(self, authenticated_client):
        """Test validation - missing target_language field"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-chat/translate",
            json={"text": "Hello"}
        )
        
        assert response.status_code == 422  # Validation error


class TestAPIIntegration:
    """Test API endpoint availability and response format"""
    
    def test_smart_replies_response_format(self, authenticated_client):
        """Verify smart replies response structure"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-chat/smart-replies",
            json={"message": "Test message"}
        )
        
        data = response.json()
        
        # Verify response has required fields
        assert "success" in data
        assert "suggestions" in data
        
        # fallback field is optional (only present when using fallback)
        if "fallback" in data:
            assert isinstance(data["fallback"], bool)
    
    def test_translate_response_format(self, authenticated_client):
        """Verify translation response structure"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-chat/translate",
            json={"text": "Test", "target_language": "Spanish"}
        )
        
        data = response.json()
        
        # Verify response has required fields
        assert "success" in data
        assert "original" in data
        assert "translated" in data
        assert "target_language" in data


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
