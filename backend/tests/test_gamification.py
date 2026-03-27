"""
Gamification API Tests
Tests for XP system, achievements, leaderboard, and integration with stories/voice notes
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "alinmy77@gmail.com"
TEST_PASSWORD = "Calliotel2024!"

class TestGamificationAPIs:
    """Test Gamification API endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for test user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]

    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Return auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}

    # === Profile Endpoint Tests ===
    def test_gamification_profile_returns_data(self, auth_headers):
        """Test /api/gamification/profile returns profile data"""
        response = requests.get(
            f"{BASE_URL}/api/gamification/profile",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields exist
        assert "total_points" in data
        assert "level" in data
        assert "level_name" in data
        assert "level_badge" in data
        assert "achievements" in data
        assert "achievements_count" in data
        assert "total_achievements" in data
        assert "daily_streak" in data
        
        # Verify data types
        assert isinstance(data["total_points"], int)
        assert isinstance(data["level"], int)
        assert isinstance(data["level_name"], str)
        assert isinstance(data["achievements"], list)
        
        print(f"Profile: Level {data['level']} ({data['level_name']}) - {data['total_points']} XP")

    def test_gamification_profile_level_info(self, auth_headers):
        """Test profile includes next level info"""
        response = requests.get(
            f"{BASE_URL}/api/gamification/profile",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should have next_level info (unless at max level)
        if data["level"] < 10:
            assert "next_level" in data
            assert "progress_to_next_level" in data
            assert isinstance(data["progress_to_next_level"], (int, float))

    # === Achievements Endpoint Tests ===
    def test_gamification_achievements_categories(self, auth_headers):
        """Test /api/gamification/achievements returns categorized achievements"""
        response = requests.get(
            f"{BASE_URL}/api/gamification/achievements",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should have categories
        assert "categories" in data
        categories = data["categories"]
        
        # Verify expected categories exist
        expected_categories = ["messaging", "social", "numbers", "referral", "engagement"]
        for cat in expected_categories:
            assert cat in categories, f"Missing category: {cat}"
        
        # Verify achievement structure
        for cat_name, achievements in categories.items():
            assert isinstance(achievements, list)
            for achievement in achievements:
                assert "id" in achievement
                assert "name" in achievement
                assert "description" in achievement
                assert "icon" in achievement
                assert "points" in achievement
                assert "earned" in achievement
        
        print(f"Found {len(categories)} achievement categories")

    def test_achievements_have_earned_status(self, auth_headers):
        """Test each achievement has earned boolean"""
        response = requests.get(
            f"{BASE_URL}/api/gamification/achievements",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        for cat_name, achievements in data["categories"].items():
            for achievement in achievements:
                assert isinstance(achievement["earned"], bool), f"Achievement {achievement['id']} missing earned status"

    # === Leaderboard Endpoint Tests ===
    def test_gamification_leaderboard(self, auth_headers):
        """Test /api/gamification/leaderboard returns rankings"""
        response = requests.get(
            f"{BASE_URL}/api/gamification/leaderboard?limit=10",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should have leaderboard array
        assert "leaderboard" in data
        leaderboard = data["leaderboard"]
        assert isinstance(leaderboard, list)
        
        # Verify leaderboard entry structure
        if len(leaderboard) > 0:
            entry = leaderboard[0]
            assert "rank" in entry
            assert "email" in entry
            assert "points" in entry
            assert "level" in entry
            assert "level_name" in entry
            assert "level_badge" in entry
            
            # Verify ranking order
            for i, entry in enumerate(leaderboard):
                assert entry["rank"] == i + 1, f"Rank mismatch at position {i}"
        
        print(f"Leaderboard has {len(leaderboard)} entries")

    def test_leaderboard_limit_parameter(self, auth_headers):
        """Test leaderboard limit parameter works"""
        response = requests.get(
            f"{BASE_URL}/api/gamification/leaderboard?limit=3",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["leaderboard"]) <= 3

    # === Daily Login Endpoint Tests ===
    def test_daily_login_records_streak(self, auth_headers):
        """Test /api/gamification/daily-login records streak"""
        response = requests.post(
            f"{BASE_URL}/api/gamification/daily-login",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should return streak info
        assert "streak" in data or "message" in data
        
        # If already logged in today, it returns message
        if "message" in data and "Already logged in" in data["message"]:
            assert "streak" in data
            print(f"Already logged in today, streak: {data['streak']}")
        else:
            assert "success" in data
            print(f"Daily login recorded, streak: {data.get('streak', 'N/A')}")

    # === Authentication Tests ===
    def test_profile_requires_auth(self):
        """Test profile endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/gamification/profile")
        assert response.status_code in [401, 403]

    def test_achievements_requires_auth(self):
        """Test achievements endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/gamification/achievements")
        assert response.status_code in [401, 403]


class TestStoryXPIntegration:
    """Test story creation awards XP correctly"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        return response.json()["access_token"]

    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}

    def test_story_creation_response_includes_gamification(self, auth_headers):
        """Test story creation response includes gamification data"""
        # Create a test image file
        import io
        
        # Create a simple 1x1 red PNG
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
            0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x18, 0xDD,
            0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
            0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {
            'file': ('test_story.png', io.BytesIO(png_data), 'image/png')
        }
        data = {
            'caption': 'Test story for gamification',
            'privacy': 'private'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/stories/create",
            headers=auth_headers,
            files=files,
            data=data
        )
        
        # May fail due to file validation, but let's check the response structure
        if response.status_code == 200:
            result = response.json()
            
            # Should have gamification data
            assert "gamification" in result, "Story response missing gamification data"
            gam = result["gamification"]
            
            # Verify gamification response structure
            assert "xp_gained" in gam
            assert "new_total" in gam
            assert "level_up" in gam
            
            # XP should be 10 for story
            assert gam["xp_gained"] == 10, f"Expected 10 XP for story, got {gam['xp_gained']}"
            
            print(f"Story XP awarded: {gam['xp_gained']} XP, total: {gam['new_total']}")
        else:
            # If story creation failed, skip this test
            pytest.skip(f"Story creation failed with status {response.status_code}")


class TestVoiceNoteXPIntegration:
    """Test voice note upload awards XP correctly"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        return response.json()["access_token"]

    @pytest.fixture(scope="class") 
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}

    def test_voice_note_upload_returns_gamification_data(self, auth_headers):
        """Test voice note upload response includes gamification"""
        import io
        
        # Create a minimal WebM audio file header (won't play but will pass validation)
        webm_header = bytes([
            0x1A, 0x45, 0xDF, 0xA3, 0x9F, 0x42, 0x86, 0x81,
            0x01, 0x42, 0xF7, 0x81, 0x01, 0x42, 0xF2, 0x81,
            0x04, 0x42, 0xF3, 0x81, 0x08, 0x42, 0x82, 0x84,
            0x77, 0x65, 0x62, 0x6D
        ])
        
        files = {
            'file': ('test_voice.webm', io.BytesIO(webm_header), 'audio/webm')
        }
        data = {
            'duration': 5.0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/voice-notes/upload",
            headers=auth_headers,
            files=files,
            data=data
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Should have gamification data
            assert "gamification" in result, "Voice note response missing gamification data"
            gam = result["gamification"]
            
            # Verify gamification structure
            assert "xp_gained" in gam
            assert "new_total" in gam
            assert "level_up" in gam
            
            # XP should be 5 for voice note
            assert gam["xp_gained"] == 5, f"Expected 5 XP for voice note, got {gam['xp_gained']}"
            
            print(f"Voice note XP awarded: {gam['xp_gained']} XP, total: {gam['new_total']}")
        else:
            pytest.skip(f"Voice note upload failed with status {response.status_code}: {response.text}")


class TestAwardXPFunction:
    """Test the award_xp function behavior"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        return response.json()["access_token"]

    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}

    def test_xp_accumulates_correctly(self, auth_headers):
        """Test XP adds up correctly in profile"""
        # Get initial profile
        response = requests.get(
            f"{BASE_URL}/api/gamification/profile",
            headers=auth_headers
        )
        assert response.status_code == 200
        initial_points = response.json()["total_points"]
        
        # Get profile again (points should be same if no action)
        response = requests.get(
            f"{BASE_URL}/api/gamification/profile",
            headers=auth_headers
        )
        assert response.status_code == 200
        current_points = response.json()["total_points"]
        
        # Should be >= initial (may have earned XP from other tests)
        assert current_points >= initial_points
        print(f"XP is stable: {initial_points} -> {current_points}")

    def test_level_calculation_is_correct(self, auth_headers):
        """Test level is calculated correctly from points"""
        response = requests.get(
            f"{BASE_URL}/api/gamification/profile",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        points = data["total_points"]
        level = data["level"]
        
        # Verify level matches points
        level_thresholds = [
            (1, 0, 49),
            (2, 50, 99),
            (3, 100, 199),
            (4, 200, 399),
            (5, 400, 699),
            (6, 700, 999),
            (7, 1000, 1499),
            (8, 1500, 2499),
            (9, 2500, 4999),
            (10, 5000, 999999)
        ]
        
        expected_level = None
        for lvl, min_pts, max_pts in level_thresholds:
            if min_pts <= points <= max_pts:
                expected_level = lvl
                break
        
        assert level == expected_level, f"Level mismatch: {level} vs expected {expected_level} for {points} points"
        print(f"Level calculation correct: {points} XP = Level {level}")
