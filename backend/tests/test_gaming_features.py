"""
Gaming Features API Tests
Tests for Gamification and Daily Challenge systems
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://call-management-3.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "alinmy77@gmail.com"
TEST_PASSWORD = "Calliotel2024!"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for testing"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Authentication failed: {response.text}")


@pytest.fixture
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestGamificationProfile:
    """Gamification Profile endpoint tests"""
    
    def test_get_profile_success(self, auth_headers):
        """Test getting gamification profile"""
        response = requests.get(
            f"{BASE_URL}/api/gamification/profile",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        # Verify profile structure
        assert "total_points" in data
        assert "level" in data
        assert "level_name" in data
        assert "level_badge" in data
        assert "achievements" in data
        assert "achievements_count" in data
        assert "daily_streak" in data
        
        # Verify data types
        assert isinstance(data["total_points"], int)
        assert isinstance(data["level"], int)
        assert isinstance(data["achievements"], list)
        print(f"✓ Profile: Level {data['level']} ({data['level_name']}), {data['total_points']} XP")
    
    def test_get_profile_unauthorized(self):
        """Test profile endpoint without auth"""
        response = requests.get(f"{BASE_URL}/api/gamification/profile")
        assert response.status_code in [401, 403]  # Either unauthorized or forbidden


class TestGamificationAchievements:
    """Gamification Achievements endpoint tests"""
    
    def test_get_achievements_success(self, auth_headers):
        """Test getting all achievements"""
        response = requests.get(
            f"{BASE_URL}/api/gamification/achievements",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        
        # Verify categories exist
        categories = data["categories"]
        assert isinstance(categories, dict)
        assert len(categories) > 0
        
        # Verify achievement structure
        for category, achievements in categories.items():
            assert isinstance(achievements, list)
            for ach in achievements:
                assert "id" in ach
                assert "name" in ach
                assert "description" in ach
                assert "points" in ach
                assert "earned" in ach
        
        total_achievements = sum(len(achs) for achs in categories.values())
        print(f"✓ Found {total_achievements} achievements across {len(categories)} categories")


class TestGamificationLeaderboard:
    """Gamification Leaderboard endpoint tests"""
    
    def test_get_leaderboard_success(self, auth_headers):
        """Test getting leaderboard"""
        response = requests.get(
            f"{BASE_URL}/api/gamification/leaderboard?limit=10",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
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
            assert entry["rank"] == 1
        
        print(f"✓ Leaderboard has {len(leaderboard)} entries")


class TestGamificationDailyLogin:
    """Gamification Daily Login endpoint tests"""
    
    def test_daily_login_success(self, auth_headers):
        """Test recording daily login"""
        response = requests.post(
            f"{BASE_URL}/api/gamification/daily-login",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        # Either success or already logged in today
        assert "streak" in data or "message" in data
        print(f"✓ Daily login recorded: {data}")


class TestDailyChallengesCurrent:
    """Daily Challenges - Current Challenge endpoint tests"""
    
    def test_get_current_challenge_success(self, auth_headers):
        """Test getting current daily challenge"""
        response = requests.get(
            f"{BASE_URL}/api/challenges/current",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "challenge" in data
        
        challenge = data["challenge"]
        # Verify challenge structure
        assert "id" in challenge
        assert "title" in challenge
        assert "description" in challenge
        assert "challenge_type" in challenge
        assert "question" in challenge
        assert "points" in challenge
        assert "difficulty" in challenge
        assert "expires_at" in challenge
        assert "user_attempted" in challenge
        
        # Correct answer should NOT be in response
        assert "correct_answer" not in challenge
        
        print(f"✓ Current challenge: {challenge['title']} ({challenge['difficulty']}, {challenge['points']} pts)")
    
    def test_get_current_challenge_unauthorized(self):
        """Test current challenge without auth"""
        response = requests.get(f"{BASE_URL}/api/challenges/current")
        assert response.status_code in [401, 403]  # Either unauthorized or forbidden


class TestDailyChallengesLeaderboard:
    """Daily Challenges - Leaderboard endpoint tests"""
    
    def test_get_weekly_leaderboard_success(self, auth_headers):
        """Test getting weekly leaderboard"""
        response = requests.get(
            f"{BASE_URL}/api/challenges/leaderboard",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "week_id" in data
        assert "leaderboard" in data
        
        # Verify week_id format (YYYY-WXX)
        assert "-W" in data["week_id"]
        
        print(f"✓ Weekly leaderboard for {data['week_id']}: {len(data['leaderboard'])} entries")
    
    def test_get_monthly_leaderboard_success(self, auth_headers):
        """Test getting monthly leaderboard"""
        response = requests.get(
            f"{BASE_URL}/api/challenges/leaderboard/monthly",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "month_id" in data
        assert "leaderboard" in data
        assert "prizes" in data
        
        # Verify prizes structure
        prizes = data["prizes"]
        assert "1st" in prizes
        assert "2nd" in prizes
        assert "3rd" in prizes
        
        print(f"✓ Monthly leaderboard for {data['month_id']}: {len(data['leaderboard'])} entries")


class TestDailyChallengesMyStats:
    """Daily Challenges - My Stats endpoint tests"""
    
    def test_get_my_stats_success(self, auth_headers):
        """Test getting user's challenge stats"""
        response = requests.get(
            f"{BASE_URL}/api/challenges/my-stats",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        
        # Verify stats structure
        assert "streak" in data
        assert "this_week" in data
        assert "this_month" in data
        assert "all_time" in data
        
        # Verify streak structure
        streak = data["streak"]
        assert "current" in streak
        assert "longest" in streak
        
        # Verify this_week structure
        this_week = data["this_week"]
        assert "attempts" in this_week
        assert "correct" in this_week
        assert "points" in this_week
        
        print(f"✓ Stats: Streak {streak['current']}, This week: {this_week['correct']} correct, {this_week['points']} pts")


class TestDailyChallengesHistory:
    """Daily Challenges - History endpoint tests"""
    
    def test_get_history_success(self, auth_headers):
        """Test getting challenge history"""
        response = requests.get(
            f"{BASE_URL}/api/challenges/history?limit=7",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "history" in data
        
        history = data["history"]
        assert isinstance(history, list)
        assert len(history) <= 7
        
        # Verify history entry structure
        if len(history) > 0:
            entry = history[0]
            assert "date" in entry
            assert "challenge_title" in entry
            assert "challenge_id" in entry
            assert "attempted" in entry
            assert "correct" in entry
            assert "points" in entry
        
        print(f"✓ History: {len(history)} days")


class TestTeamChallenges:
    """Team Challenges endpoint tests"""
    
    def test_get_my_team_success(self, auth_headers):
        """Test getting user's team"""
        response = requests.get(
            f"{BASE_URL}/api/challenges/teams/my-team",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        
        # User may or may not be in a team
        if data.get("team"):
            team = data["team"]
            assert "id" in team
            assert "team_name" in team
            assert "team_code" in team
            assert "members" in team
            print(f"✓ User is in team: {team['team_name']} ({len(team['members'])} members)")
        else:
            print("✓ User is not in a team")
    
    def test_get_team_leaderboard_success(self, auth_headers):
        """Test getting team leaderboard"""
        response = requests.get(
            f"{BASE_URL}/api/challenges/teams/leaderboard",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "week_id" in data
        assert "leaderboard" in data
        assert "total_teams" in data
        
        leaderboard = data["leaderboard"]
        if len(leaderboard) > 0:
            team = leaderboard[0]
            assert "team_id" in team
            assert "team_name" in team
            assert "total_points" in team
            assert "rank" in team
        
        print(f"✓ Team leaderboard: {data['total_teams']} teams")


class TestChallengeSubmission:
    """Challenge Submission endpoint tests"""
    
    def test_submit_answer_structure(self, auth_headers):
        """Test challenge submission endpoint structure"""
        # First get current challenge
        response = requests.get(
            f"{BASE_URL}/api/challenges/current",
            headers=auth_headers
        )
        assert response.status_code == 200
        challenge = response.json()["challenge"]
        
        # If already attempted, skip submission test
        if challenge.get("user_attempted"):
            print("✓ Challenge already attempted today - skipping submission test")
            return
        
        # Test with wrong answer to verify endpoint works
        response = requests.post(
            f"{BASE_URL}/api/challenges/submit",
            headers=auth_headers,
            json={
                "challenge_id": challenge["id"],
                "answer": "test_wrong_answer_12345"
            }
        )
        
        # Should return 200 with is_correct: false
        assert response.status_code == 200
        data = response.json()
        assert "is_correct" in data
        assert "message" in data
        print(f"✓ Submission endpoint working: {data['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
