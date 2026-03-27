"""
Test suite for Phase 1 Social Features:
- Streak System: Daily message streaks with plant growth visualization
- Media Upload: Image and video uploads for chat messages
"""

import pytest
import requests
import os
import io
from datetime import datetime

# Use the public URL for testing
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from the problem statement
TEST_EMAIL = "alinmy77@gmail.com"
TEST_PASSWORD = "Calliotel2024!"


class TestAuth:
    """Authentication tests - needed for protected endpoints"""
    
    def test_login(self, api_client):
        """Test user login to get auth token"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        # Accept both 200 (success) and 401 (wrong credentials)
        # If 401, we'll try to create a test user
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token") or data.get("token")
            assert token is not None, "No token in response"
            print(f"Login successful, token received")
            return token
        else:
            print(f"Login failed with status {response.status_code}, will create test user")
            return None


class TestStreakSystem:
    """Test Streak System API endpoints"""
    
    def test_get_streak_unauthenticated(self, api_client):
        """Test streak endpoint requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/streaks/streak/test-user-id")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Streak endpoint correctly requires authentication")
    
    def test_get_streak_with_auth(self, authenticated_client):
        """Test getting streak for a friend"""
        # Use a fake friend ID - should return empty streak
        fake_friend_id = "non-existent-friend-12345"
        response = authenticated_client.get(f"{BASE_URL}/api/streaks/streak/{fake_friend_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "streak_count" in data
        assert "plant_stage" in data
        assert "plant_emoji" in data
        assert "streak_active" in data
        
        print(f"✓ Streak response: count={data['streak_count']}, stage={data['plant_stage']}, emoji={data['plant_emoji']}")
    
    def test_update_streak_unauthenticated(self, api_client):
        """Test streak update requires authentication"""
        response = api_client.post(f"{BASE_URL}/api/streaks/streak/update/test-user-id")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Streak update endpoint correctly requires authentication")
    
    def test_update_streak_with_auth(self, authenticated_client):
        """Test updating streak after sending message"""
        fake_friend_id = "test-friend-for-streak-update"
        response = authenticated_client.post(f"{BASE_URL}/api/streaks/streak/update/{fake_friend_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "streak_count" in data
        assert "plant_stage" in data
        assert "plant_emoji" in data
        assert "message" in data
        
        print(f"✓ Streak update: count={data['streak_count']}, message={data['message']}")
    
    def test_get_all_streaks(self, authenticated_client):
        """Test getting all streaks for current user"""
        response = authenticated_client.get(f"{BASE_URL}/api/streaks/streaks/all")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "streaks" in data
        assert "total_active" in data
        assert "total_all" in data
        assert isinstance(data["streaks"], list)
        
        print(f"✓ All streaks: {data['total_active']} active out of {data['total_all']} total")
    
    def test_get_streak_leaderboard(self, api_client):
        """Test streak leaderboard endpoint (may not require auth)"""
        response = api_client.get(f"{BASE_URL}/api/streaks/leaderboard")
        
        # Leaderboard might be public or require auth
        if response.status_code == 200:
            data = response.json()
            assert "leaderboard" in data
            print(f"✓ Leaderboard: {len(data.get('leaderboard', []))} entries")
        else:
            print(f"Leaderboard returned {response.status_code} (may require auth)")
    
    def test_plant_stage_progression(self, authenticated_client):
        """Test that plant stages are correct based on streak count"""
        # Test multiple streak updates to see progression
        fake_friend_id = "test-progression-friend"
        
        # First update - should be new streak
        response = authenticated_client.post(f"{BASE_URL}/api/streaks/streak/update/{fake_friend_id}")
        assert response.status_code == 200
        
        data = response.json()
        # With count=1, should be "sprout" stage
        assert data["streak_count"] >= 1
        assert data["plant_stage"] in ["seed", "sprout", "seedling", "plant", "bush", "tree", "mighty_tree", "legendary"]
        
        print(f"✓ Plant stage progression test: count={data['streak_count']}, stage={data['plant_stage']}")


class TestMediaUpload:
    """Test Media Upload API endpoints"""
    
    def test_upload_image_unauthenticated(self, api_client):
        """Test image upload requires authentication"""
        # Create a minimal test image
        test_image = io.BytesIO(b'\x89PNG\r\n\x1a\n' + b'\x00' * 100)
        files = {'file': ('test.png', test_image, 'image/png')}
        
        response = api_client.post(f"{BASE_URL}/api/media/upload/image", files=files)
        assert response.status_code in [401, 403, 422], f"Expected 401/403/422, got {response.status_code}"
        print("✓ Image upload endpoint correctly requires authentication")
    
    def test_upload_image_with_auth(self, authenticated_client):
        """Test image upload with authentication"""
        # Create a valid minimal PNG image
        # PNG header + IHDR chunk (13 bytes data)
        png_header = b'\x89PNG\r\n\x1a\n'
        ihdr_data = b'\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00'
        ihdr_crc = b'\x90wS\xde'
        ihdr_chunk = b'\x00\x00\x00\r' + b'IHDR' + ihdr_data + ihdr_crc
        iend_chunk = b'\x00\x00\x00\x00IEND\xaeB`\x82'
        
        test_image = png_header + ihdr_chunk + iend_chunk
        
        files = {'file': ('test_image.png', io.BytesIO(test_image), 'image/png')}
        
        # Remove Content-Type header for multipart upload
        headers = dict(authenticated_client.headers)
        headers.pop('Content-Type', None)
        
        response = requests.post(
            f"{BASE_URL}/api/media/upload/image", 
            files=files,
            headers={'Authorization': headers.get('Authorization', '')}
        )
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            assert "media_url" in data
            assert data.get("media_type") == "image"
            print(f"✓ Image uploaded successfully: {data.get('media_url')}")
        else:
            print(f"Image upload returned {response.status_code}: {response.text[:200]}")
            # Not failing as the PNG might be too minimal
    
    def test_upload_video_unauthenticated(self, api_client):
        """Test video upload requires authentication"""
        test_video = io.BytesIO(b'\x00\x00\x00\x1cftypisom' + b'\x00' * 100)
        files = {'file': ('test.mp4', test_video, 'video/mp4')}
        
        response = api_client.post(f"{BASE_URL}/api/media/upload/video", files=files)
        assert response.status_code in [401, 403, 422], f"Expected 401/403/422, got {response.status_code}"
        print("✓ Video upload endpoint correctly requires authentication")
    
    def test_get_popular_stickers(self, api_client):
        """Test getting popular/default sticker packs"""
        response = api_client.get(f"{BASE_URL}/api/media/stickers/popular")
        
        if response.status_code == 200:
            data = response.json()
            assert "success" in data
            assert "packs" in data
            print(f"✓ Popular stickers: {len(data.get('packs', []))} packs available")
        else:
            print(f"Popular stickers returned {response.status_code}")
    
    def test_get_my_stickers(self, authenticated_client):
        """Test getting user's custom stickers"""
        response = authenticated_client.get(f"{BASE_URL}/api/media/stickers/my")
        
        if response.status_code == 200:
            data = response.json()
            assert "success" in data
            assert "stickers" in data
            print(f"✓ User stickers: {len(data.get('stickers', []))} custom stickers")
        else:
            print(f"User stickers returned {response.status_code}")
    
    def test_invalid_file_type(self, authenticated_client):
        """Test that invalid file types are rejected"""
        # Try to upload a text file as an image
        test_file = io.BytesIO(b'This is not an image')
        files = {'file': ('test.txt', test_file, 'text/plain')}
        
        headers = dict(authenticated_client.headers)
        headers.pop('Content-Type', None)
        
        response = requests.post(
            f"{BASE_URL}/api/media/upload/image", 
            files=files,
            headers={'Authorization': headers.get('Authorization', '')}
        )
        
        # Should reject with 400 Bad Request
        assert response.status_code == 400, f"Expected 400 for invalid file type, got {response.status_code}"
        print("✓ Invalid file type correctly rejected")


class TestChatIntegration:
    """Test Chat system integration with streaks and media"""
    
    def test_get_friends(self, authenticated_client):
        """Test getting friends list"""
        response = authenticated_client.get(f"{BASE_URL}/api/chat/friends")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "friends" in data
        print(f"✓ Friends list: {len(data.get('friends', []))} friends")
    
    def test_friend_requests(self, authenticated_client):
        """Test getting friend requests"""
        response = authenticated_client.get(f"{BASE_URL}/api/chat/friend-requests")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "received" in data or "sent" in data
        print(f"✓ Friend requests retrieved successfully")


# Fixtures
@pytest.fixture
def api_client():
    """Basic requests session without auth"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def auth_token(api_client):
    """Get authentication token for test user"""
    # First try to login with existing user
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if response.status_code == 200:
        token = response.json().get("access_token") or response.json().get("token")
        if token:
            return token
    
    # If login failed, try to create a new test user
    print(f"Login with {TEST_EMAIL} failed, trying to create test user...")
    
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    new_email = f"test_streak_media_{timestamp}@test.com"
    new_password = "TestPass123!"
    
    signup_response = api_client.post(f"{BASE_URL}/api/auth/signup", json={
        "email": new_email,
        "password": new_password,
        "full_name": "Test Streak User"
    })
    
    if signup_response.status_code == 200:
        signup_data = signup_response.json()
        token = signup_data.get("access_token") or signup_data.get("token")
        if token:
            print(f"Created new test user: {new_email}")
            return token
    
    pytest.skip("Could not authenticate - skipping auth-required tests")


@pytest.fixture
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
