"""
Test suite for the 8 new Devil Ideas features:
1. AI Music Generator
2. Story Empire for Kids
3. Voice Clone Marketplace
4. Time Machine (photos to videos)
5. AI Video Chat with Filters
6. Live Filter Streaming
7. 3D Avatar Creator
8. Hologram Messages
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
# Valid JWT token for testing (from login)
TEST_SESSION_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGlubXk3N0BnbWFpbC5jb20iLCJleHAiOjE3NzQzMTgyOTB9.VkgPdLDRL1AXtym5K9D7WTDktKBUvNeUJA7frgKFJ4E"


class TestMusicGenerator:
    """AI Music Generator - Generate background music for videos"""

    def test_get_genres_no_auth(self):
        """Music genres should be accessible without auth"""
        response = requests.get(f"{BASE_URL}/api/music-generator/genres")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "genres" in data
        assert len(data["genres"]) == 10  # Should have 10 genres
        
        # Verify genre structure
        genre = data["genres"][0]
        assert "id" in genre
        assert "name" in genre
        assert "icon" in genre
        assert "description" in genre

    def test_genre_content(self):
        """Verify specific genres exist"""
        response = requests.get(f"{BASE_URL}/api/music-generator/genres")
        data = response.json()
        
        genre_ids = [g["id"] for g in data["genres"]]
        expected_genres = ["epic", "calm", "happy", "scary", "romantic", 
                          "fantasy", "dramatic", "playful", "inspirational", "cinematic"]
        
        for expected in expected_genres:
            assert expected in genre_ids, f"Genre {expected} not found"

    def test_generate_music_requires_auth(self):
        """Music generation requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/music-generator/generate",
            json={"genre": "epic", "story_text": "A brave hero story"}
        )
        # Should return 403 or 401 without auth
        assert response.status_code in [401, 403]


class TestKidsMode:
    """Story Empire for Kids - Kid-safe story creation"""

    def test_get_templates_no_auth(self):
        """Templates should be accessible without auth (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/kids-mode/templates")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "templates" in data
        assert len(data["templates"]) == 5  # Should have 5 fairy tale templates

    def test_template_structure(self):
        """Verify template structure"""
        response = requests.get(f"{BASE_URL}/api/kids-mode/templates")
        data = response.json()
        
        template = data["templates"][0]
        assert "id" in template
        assert "title" in template
        assert "icon" in template
        assert "prompt" in template
        assert "variables" in template

    def test_template_content(self):
        """Verify specific templates exist"""
        response = requests.get(f"{BASE_URL}/api/kids-mode/templates")
        data = response.json()
        
        template_ids = [t["id"] for t in data["templates"]]
        expected_templates = ["brave_hero", "magical_friend", "lost_treasure", 
                             "animal_adventure", "bedtime_story"]
        
        for expected in expected_templates:
            assert expected in template_ids, f"Template {expected} not found"

    def test_usage_requires_auth(self):
        """Usage endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/kids-mode/usage")
        assert response.status_code in [401, 403]

    def test_create_requires_auth(self):
        """Creating kid movie requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/kids-mode/create",
            json={"story_text": "A friendly dragon story", "image_style": "cartoon"}
        )
        assert response.status_code in [401, 403]


class TestVoiceMarketplace:
    """Voice Clone Marketplace - Buy/sell AI voice clones"""

    def test_marketplace_public(self):
        """Marketplace listing is public (browse voices)"""
        response = requests.get(f"{BASE_URL}/api/voice-marketplace/marketplace")
        # This endpoint is public for browsing
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_my_voices_requires_auth(self):
        """My voices listing requires authentication"""
        response = requests.get(f"{BASE_URL}/api/voice-marketplace/my-voices")
        assert response.status_code in [401, 403]


class TestTimeMachine:
    """Time Machine - Turn photos into animated videos"""

    def test_my_videos_requires_auth(self):
        """My videos listing requires authentication"""
        response = requests.get(f"{BASE_URL}/api/time-machine/my-videos")
        assert response.status_code in [401, 403]


class TestVideoChat:
    """AI Video Chat - 1-on-1 video calls with filters"""

    def test_filters_public(self):
        """Filters listing is public (preview available filters)"""
        response = requests.get(f"{BASE_URL}/api/video-chat/filters-available")
        # This endpoint is public for previewing filters
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "filters" in data

    def test_call_history_requires_auth(self):
        """Call history requires authentication"""
        response = requests.get(f"{BASE_URL}/api/video-chat/call-history")
        assert response.status_code in [401, 403]


class TestLiveStreaming:
    """Live Filter Streaming - Stream with filters"""

    def test_discover_streams_public(self):
        """Discover streams is public (browse live streams)"""
        response = requests.get(f"{BASE_URL}/api/live-streaming/discover")
        # This endpoint is public for discovering live streams
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "streams" in data

    def test_my_streams_requires_auth(self):
        """My streams listing requires authentication"""
        response = requests.get(f"{BASE_URL}/api/live-streaming/my-streams")
        assert response.status_code in [401, 403]


class TestAvatarCreator:
    """3D Avatar Creator - Selfie to 3D avatar"""

    def test_my_avatars_requires_auth(self):
        """My avatars listing requires authentication"""
        response = requests.get(f"{BASE_URL}/api/avatar-creator/my-avatars")
        assert response.status_code in [401, 403]


class TestHologramMessages:
    """Hologram Messages - AR video messages"""

    def test_my_holograms_requires_auth(self):
        """My holograms listing requires authentication"""
        response = requests.get(f"{BASE_URL}/api/hologram-messages/my-holograms")
        assert response.status_code in [401, 403]


class TestAuthenticatedEndpoints:
    """Test authenticated endpoints with valid session"""
    
    @pytest.fixture
    def auth_headers(self):
        return {"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
    
    def test_music_generate_with_auth(self, auth_headers):
        """Test music generation with authentication"""
        response = requests.post(
            f"{BASE_URL}/api/music-generator/generate",
            headers=auth_headers,
            json={"genre": "epic", "story_text": "A brave hero on a quest"}
        )
        # With valid auth, should succeed or return 200 with success=True
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "genre" in data

    def test_kids_usage_with_auth(self, auth_headers):
        """Test kids mode usage with authentication"""
        response = requests.get(
            f"{BASE_URL}/api/kids-mode/usage",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "is_premium" in data
        assert "used_this_month" in data
        assert "monthly_limit" in data

    def test_kids_create_with_auth(self, auth_headers):
        """Test creating kid-safe movie with authentication"""
        response = requests.post(
            f"{BASE_URL}/api/kids-mode/create",
            headers=auth_headers,
            json={
                "story_text": "Once upon a time, a friendly rabbit helped a lost bird find its way home. They became best friends forever!",
                "image_style": "cartoon"
            }
        )
        # Should succeed (200) or hit usage limit (402)
        assert response.status_code in [200, 402]
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            assert "movie_id" in data

    def test_kids_create_unsafe_content_rejected(self, auth_headers):
        """Test that unsafe content is rejected in kids mode"""
        response = requests.post(
            f"{BASE_URL}/api/kids-mode/create",
            headers=auth_headers,
            json={
                "story_text": "A scary monster fought the villain with a sword",
                "image_style": "cartoon"
            }
        )
        # Should be rejected with 400
        assert response.status_code == 400
        data = response.json()
        assert "inappropriate" in data["detail"].lower() or "unsafe" in data["detail"].lower() or "content" in data["detail"].lower()

    def test_voice_marketplace_with_auth(self, auth_headers):
        """Test marketplace listing with authentication"""
        response = requests.get(
            f"{BASE_URL}/api/voice-marketplace/marketplace",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "voices" in data

    def test_voice_marketplace_my_voices_with_auth(self, auth_headers):
        """Test my voices listing with authentication"""
        response = requests.get(
            f"{BASE_URL}/api/voice-marketplace/my-voices",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "voices" in data
        assert "stats" in data

    def test_time_machine_my_videos_with_auth(self, auth_headers):
        """Test my videos listing with authentication"""
        response = requests.get(
            f"{BASE_URL}/api/time-machine/my-videos",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "videos" in data

    def test_video_chat_filters_with_auth(self, auth_headers):
        """Test filters listing with authentication"""
        response = requests.get(
            f"{BASE_URL}/api/video-chat/filters-available",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "filters" in data

    def test_video_chat_history_with_auth(self, auth_headers):
        """Test call history with authentication"""
        response = requests.get(
            f"{BASE_URL}/api/video-chat/call-history",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "calls" in data

    def test_live_streaming_discover_with_auth(self, auth_headers):
        """Test discover streams with authentication"""
        response = requests.get(
            f"{BASE_URL}/api/live-streaming/discover",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "streams" in data

    def test_live_streaming_my_streams_with_auth(self, auth_headers):
        """Test my streams listing with authentication"""
        response = requests.get(
            f"{BASE_URL}/api/live-streaming/my-streams",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "streams" in data

    def test_avatar_creator_my_avatars_with_auth(self, auth_headers):
        """Test my avatars listing with authentication"""
        response = requests.get(
            f"{BASE_URL}/api/avatar-creator/my-avatars",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "avatars" in data

    def test_hologram_messages_my_holograms_with_auth(self, auth_headers):
        """Test my holograms listing with authentication"""
        response = requests.get(
            f"{BASE_URL}/api/hologram-messages/my-holograms",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "holograms" in data

    def test_kids_my_movies_with_auth(self, auth_headers):
        """Test my kids movies listing with authentication"""
        response = requests.get(
            f"{BASE_URL}/api/kids-mode/my-movies",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "movies" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
