"""
Voice Notes API Tests - Phase 3 Advanced Voice Notes with AI Transcription
Tests: Upload, Get, Delete voice notes, integration with chat
"""

import pytest
import requests
import os
import io

# Use the public URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "alinmy77@gmail.com"
TEST_USER_PASSWORD = "Calliotel2024!"

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for testing"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
    )
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code}")
    return response.json()["access_token"]

@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Return authorization headers"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestVoiceNotesAPI:
    """Voice Notes endpoint tests"""
    
    def test_upload_voice_note_no_file(self, auth_headers):
        """Test upload without file returns error"""
        response = requests.post(
            f"{BASE_URL}/api/voice/upload",
            headers=auth_headers
        )
        # Should fail without file
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
    
    def test_upload_voice_note_invalid_type(self, auth_headers):
        """Test upload with invalid file type"""
        # Create a fake text file
        files = {
            'file': ('test.txt', io.BytesIO(b'not audio content'), 'text/plain')
        }
        data = {'duration': '5.0'}
        
        response = requests.post(
            f"{BASE_URL}/api/voice/upload",
            headers=auth_headers,
            files=files,
            data=data
        )
        assert response.status_code == 400, f"Expected 400 for invalid file type, got {response.status_code}"
        assert "Invalid audio format" in response.json().get("detail", "")
    
    def test_get_nonexistent_voice_note(self, auth_headers):
        """Test getting a voice note that doesn't exist"""
        response = requests.get(
            f"{BASE_URL}/api/voice/nonexistent-id-12345",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        assert "not found" in response.json().get("detail", "").lower()
    
    def test_delete_nonexistent_voice_note(self, auth_headers):
        """Test deleting a voice note that doesn't exist"""
        response = requests.delete(
            f"{BASE_URL}/api/voice/nonexistent-id-12345",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestChatIntegration:
    """Test chat API - critical for message receiving verification"""
    
    def test_get_friends_list(self, auth_headers):
        """Test getting friends list"""
        response = requests.get(
            f"{BASE_URL}/api/chat/friends",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "friends" in data
        print(f"Friends count: {len(data['friends'])}")
        return data["friends"]
    
    def test_get_friend_requests(self, auth_headers):
        """Test getting friend requests"""
        response = requests.get(
            f"{BASE_URL}/api/chat/friend-requests",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "received" in data
        assert "sent" in data
    
    def test_get_messages_with_friend(self, auth_headers):
        """Test getting messages with a friend - tests receiving capability"""
        # First get friends
        friends_resp = requests.get(
            f"{BASE_URL}/api/chat/friends",
            headers=auth_headers
        )
        assert friends_resp.status_code == 200
        friends = friends_resp.json().get("friends", [])
        
        if not friends:
            pytest.skip("No friends available to test messaging")
        
        # Get messages with first friend
        friend = friends[0]
        friend_id = friend.get("user_id")
        
        response = requests.get(
            f"{BASE_URL}/api/chat/messages/{friend_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "messages" in data
        print(f"Messages with {friend_id}: {len(data['messages'])}")
        
        # Verify message structure if messages exist
        if data["messages"]:
            msg = data["messages"][0]
            assert "id" in msg
            assert "sender_id" in msg
            assert "content" in msg
            assert "timestamp" in msg
    
    def test_search_user(self, auth_headers):
        """Test user search functionality"""
        response = requests.post(
            f"{BASE_URL}/api/chat/search-user",
            headers=auth_headers,
            json={"query": TEST_USER_EMAIL}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "found" in data


class TestAuthAndUser:
    """Test authentication and user endpoints"""
    
    def test_auth_me(self, auth_headers):
        """Test get current user info"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Check user has id field (critical for message sending/receiving)
        assert "id" in data or "email" in data
        print(f"User data keys: {list(data.keys())}")
        
        # Verify the id matches expected format
        user_id = data.get("id")
        assert user_id is not None, "User must have an 'id' field"
        print(f"User ID: {user_id}")


class TestStreaksIntegration:
    """Test streaks feature integration with chat"""
    
    def test_get_streak_with_friend(self, auth_headers):
        """Test getting streak info with a friend"""
        # First get friends
        friends_resp = requests.get(
            f"{BASE_URL}/api/chat/friends",
            headers=auth_headers
        )
        if friends_resp.status_code != 200:
            pytest.skip("Could not get friends list")
        
        friends = friends_resp.json().get("friends", [])
        if not friends:
            pytest.skip("No friends available")
        
        friend_id = friends[0].get("user_id")
        
        response = requests.get(
            f"{BASE_URL}/api/streaks/streak/{friend_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Streak should have count info
        print(f"Streak data: {data}")


class TestMediaEndpoints:
    """Test media serving for voice notes playback"""
    
    def test_media_directory_accessible(self, auth_headers):
        """Test that media directory exists for voice notes"""
        # This is a basic check - actual files would need to be uploaded first
        # Just verify the endpoint pattern exists
        response = requests.get(
            f"{BASE_URL}/media/voice_notes/",
            headers=auth_headers
        )
        # Could be 404 (no files), 403 (directory listing disabled), or 200
        # Just verify we don't get 500
        assert response.status_code != 500, f"Server error: {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
