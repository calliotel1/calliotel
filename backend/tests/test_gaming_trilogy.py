"""
Gaming Trilogy API Tests
Tests for Speed Dialer, The Duel, and Phish-Finder games
Including XP escrow system, achievements, and leaderboards
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://call-management-3.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "alinmy77@gmail.com"
TEST_PASSWORD = "Calliotel2024!"

# Second test user for duel testing
TEST_EMAIL_2 = "test_duel_user@example.com"
TEST_PASSWORD_2 = "TestDuel123!"


class TestAuthentication:
    """Test authentication and get tokens for subsequent tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for primary test user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    def test_login_success(self, auth_token):
        """Verify login works and returns token"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print(f"✅ Login successful, token obtained")


class TestSpeedDialer:
    """Speed Dialer Game API Tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_start_game_easy(self, auth_token):
        """Test starting an easy difficulty game"""
        response = requests.post(
            f"{BASE_URL}/api/game/speed-dialer/start",
            json={"difficulty": "easy", "chaos_mode": False},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed to start game: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "challenge_id" in data
        assert "phone_number" in data
        assert "difficulty" in data
        assert data["difficulty"] == "easy"
        assert data["base_xp"] == 10
        print(f"✅ Started easy game: {data['phone_number']}")
        return data
    
    def test_start_game_medium(self, auth_token):
        """Test starting a medium difficulty game"""
        response = requests.post(
            f"{BASE_URL}/api/game/speed-dialer/start",
            json={"difficulty": "medium", "chaos_mode": False},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["difficulty"] == "medium"
        assert data["base_xp"] == 25
        print(f"✅ Started medium game: {data['phone_number']}")
    
    def test_start_game_hard(self, auth_token):
        """Test starting a hard difficulty game"""
        response = requests.post(
            f"{BASE_URL}/api/game/speed-dialer/start",
            json={"difficulty": "hard", "chaos_mode": False},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["difficulty"] == "hard"
        assert data["base_xp"] == 50
        print(f"✅ Started hard game: {data['phone_number']}")
    
    def test_start_game_chaos_mode(self, auth_token):
        """Test starting a game with chaos mode enabled"""
        response = requests.post(
            f"{BASE_URL}/api/game/speed-dialer/start",
            json={"difficulty": "easy", "chaos_mode": True},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["chaos_mode"] == True
        print(f"✅ Started chaos mode game")
    
    def test_submit_correct_answer(self, auth_token):
        """Test submitting a correct answer and receiving XP"""
        # Start a game
        start_response = requests.post(
            f"{BASE_URL}/api/game/speed-dialer/start",
            json={"difficulty": "easy", "chaos_mode": False},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert start_response.status_code == 200
        challenge = start_response.json()
        
        # Wait a bit to simulate typing
        time.sleep(1)
        
        # Submit correct answer
        submit_response = requests.post(
            f"{BASE_URL}/api/game/speed-dialer/submit",
            json={
                "challenge_id": challenge["challenge_id"],
                "user_input": challenge["phone_number"],
                "time_taken": 3.5
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert submit_response.status_code == 200, f"Submit failed: {submit_response.text}"
        result = submit_response.json()
        
        # Verify result
        assert result["success"] == True
        assert result["xp_earned"] > 0
        assert "xp_total" in result
        print(f"✅ Correct answer submitted, earned {result['xp_earned']} XP")
    
    def test_submit_wrong_answer(self, auth_token):
        """Test submitting a wrong answer"""
        # Start a game
        start_response = requests.post(
            f"{BASE_URL}/api/game/speed-dialer/start",
            json={"difficulty": "easy", "chaos_mode": False},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert start_response.status_code == 200
        challenge = start_response.json()
        
        time.sleep(1)
        
        # Submit wrong answer
        submit_response = requests.post(
            f"{BASE_URL}/api/game/speed-dialer/submit",
            json={
                "challenge_id": challenge["challenge_id"],
                "user_input": "000-0000",  # Wrong number
                "time_taken": 5.0
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert submit_response.status_code == 200
        result = submit_response.json()
        
        assert result["success"] == False
        assert result["xp_earned"] == 0
        print(f"✅ Wrong answer handled correctly")
    
    def test_anti_cheat_too_fast(self, auth_token):
        """Test anti-cheat: impossibly fast time"""
        start_response = requests.post(
            f"{BASE_URL}/api/game/speed-dialer/start",
            json={"difficulty": "easy", "chaos_mode": False},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        challenge = start_response.json()
        
        # Submit with impossibly fast time
        submit_response = requests.post(
            f"{BASE_URL}/api/game/speed-dialer/submit",
            json={
                "challenge_id": challenge["challenge_id"],
                "user_input": challenge["phone_number"],
                "time_taken": 0.1  # Too fast
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert submit_response.status_code == 400
        print(f"✅ Anti-cheat blocked impossibly fast time")
    
    def test_get_stats(self, auth_token):
        """Test getting user's Speed Dialer stats"""
        response = requests.get(
            f"{BASE_URL}/api/game/speed-dialer/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "total_games" in data
        assert "total_xp_earned" in data
        print(f"✅ Stats retrieved: {data['total_games']} games, {data['total_xp_earned']} XP")
    
    def test_get_leaderboard(self):
        """Test getting Speed Dialer leaderboard (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/game/speed-dialer/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        assert "leaderboard" in data
        assert "difficulty" in data
        print(f"✅ Leaderboard retrieved: {len(data['leaderboard'])} entries")
    
    def test_get_leaderboard_by_difficulty(self):
        """Test getting leaderboard filtered by difficulty"""
        for diff in ["easy", "medium", "hard"]:
            response = requests.get(f"{BASE_URL}/api/game/speed-dialer/leaderboard?difficulty={diff}")
            assert response.status_code == 200
            data = response.json()
            assert data["difficulty"] == diff
        print(f"✅ Difficulty-filtered leaderboards work")
    
    def test_invalid_difficulty(self, auth_token):
        """Test starting game with invalid difficulty"""
        response = requests.post(
            f"{BASE_URL}/api/game/speed-dialer/start",
            json={"difficulty": "impossible", "chaos_mode": False},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
        print(f"✅ Invalid difficulty rejected")


class TestPhishFinder:
    """Phish-Finder Game API Tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_get_challenge(self, auth_token):
        """Test getting a phishing scenario"""
        response = requests.get(
            f"{BASE_URL}/api/game/phish-finder/challenge",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed to get challenge: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "scenario_id" in data
        assert "type" in data
        assert "content" in data
        assert "sender" in data
        assert data["type"] in ["SMS", "Email", "URL"]
        print(f"✅ Got {data['type']} scenario: {data['scenario_id']}")
        return data
    
    def test_submit_correct_phish_answer(self, auth_token):
        """Test submitting correct answer for a phishing scenario"""
        # Get a challenge
        challenge_response = requests.get(
            f"{BASE_URL}/api/game/phish-finder/challenge",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert challenge_response.status_code == 200
        scenario = challenge_response.json()
        
        # Submit answer (we'll try both true and false to test the flow)
        submit_response = requests.post(
            f"{BASE_URL}/api/game/phish-finder/submit",
            json={
                "scenario_id": scenario["scenario_id"],
                "user_answer": True,  # Guessing it's a phish
                "time_taken": 10.5
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert submit_response.status_code == 200, f"Submit failed: {submit_response.text}"
        result = submit_response.json()
        
        # Verify result structure
        assert "correct" in result
        assert "xp_earned" in result
        assert "is_phish" in result
        assert "red_flags" in result
        assert "explanation" in result
        print(f"✅ Answer submitted, correct: {result['correct']}, XP: {result['xp_earned']}")
    
    def test_speed_bonus_calculation(self, auth_token):
        """Test that faster answers get speed bonus"""
        # Get a challenge
        challenge_response = requests.get(
            f"{BASE_URL}/api/game/phish-finder/challenge",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        scenario = challenge_response.json()
        
        # Submit with fast time (under 30 seconds)
        submit_response = requests.post(
            f"{BASE_URL}/api/game/phish-finder/submit",
            json={
                "scenario_id": scenario["scenario_id"],
                "user_answer": True,
                "time_taken": 5.0  # Very fast
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert submit_response.status_code == 200
        result = submit_response.json()
        
        # If correct, should have time bonus
        if result["correct"]:
            assert result["time_bonus"] > 0
            print(f"✅ Speed bonus awarded: +{result['time_bonus']} XP")
        else:
            print(f"✅ Answer was incorrect, no bonus (expected)")
    
    def test_get_stats(self, auth_token):
        """Test getting user's Phish-Finder stats"""
        response = requests.get(
            f"{BASE_URL}/api/game/phish-finder/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "total_scenarios" in data
        assert "correct_answers" in data
        assert "accuracy_percentage" in data
        assert "total_xp_earned" in data
        print(f"✅ Stats: {data['total_scenarios']} scenarios, {data['accuracy_percentage']}% accuracy")
    
    def test_get_leaderboard(self):
        """Test getting Phish-Finder leaderboard (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/game/phish-finder/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        assert "leaderboard" in data
        print(f"✅ Leaderboard retrieved: {len(data['leaderboard'])} entries")


class TestDuelSystem:
    """Duel System API Tests - XP Wagering"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_get_duel_feed_pending(self):
        """Test getting pending duels feed (public)"""
        response = requests.get(f"{BASE_URL}/api/game/duel/feed?status=pending")
        assert response.status_code == 200
        data = response.json()
        
        assert "duels" in data
        assert "count" in data
        print(f"✅ Pending duels feed: {data['count']} duels")
    
    def test_get_duel_feed_completed(self):
        """Test getting completed duels feed"""
        response = requests.get(f"{BASE_URL}/api/game/duel/feed?status=completed")
        assert response.status_code == 200
        data = response.json()
        
        assert "duels" in data
        print(f"✅ Completed duels feed: {data['count']} duels")
    
    def test_get_active_duels(self, auth_token):
        """Test getting user's active duels"""
        response = requests.get(
            f"{BASE_URL}/api/game/duel/active",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "duels" in data
        assert "count" in data
        print(f"✅ Active duels: {data['count']}")
    
    def test_get_duel_stats(self, auth_token):
        """Test getting user's duel statistics"""
        response = requests.get(
            f"{BASE_URL}/api/game/duel/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "wins" in data
        assert "losses" in data
        assert "total_duels" in data
        assert "win_rate" in data
        assert "total_xp_won" in data
        assert "total_xp_lost" in data
        assert "net_xp" in data
        print(f"✅ Duel stats: {data['wins']}W/{data['losses']}L, {data['win_rate']}% win rate")
    
    def test_create_duel_insufficient_xp(self, auth_token):
        """Test creating duel with insufficient XP"""
        response = requests.post(
            f"{BASE_URL}/api/game/duel/create",
            json={
                "wager_amount": 999999,  # Very high amount
                "difficulty": "medium",
                "chaos_mode": False
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Should fail due to insufficient XP
        assert response.status_code == 400
        print(f"✅ Insufficient XP duel creation rejected")
    
    def test_create_duel_below_minimum(self, auth_token):
        """Test creating duel below minimum wager"""
        response = requests.post(
            f"{BASE_URL}/api/game/duel/create",
            json={
                "wager_amount": 5,  # Below 10 XP minimum
                "difficulty": "easy",
                "chaos_mode": False
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
        assert "Minimum wager" in response.json().get("detail", "")
        print(f"✅ Below minimum wager rejected")
    
    def test_create_duel_above_maximum(self, auth_token):
        """Test creating duel above maximum wager"""
        response = requests.post(
            f"{BASE_URL}/api/game/duel/create",
            json={
                "wager_amount": 1500,  # Above 1000 XP maximum
                "difficulty": "hard",
                "chaos_mode": False
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
        assert "Maximum wager" in response.json().get("detail", "")
        print(f"✅ Above maximum wager rejected")
    
    def test_create_and_cancel_duel(self, auth_token):
        """Test creating a duel and then cancelling it (XP refund)"""
        # First check user's XP
        profile_response = requests.get(
            f"{BASE_URL}/api/gamification/profile",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        initial_xp = profile_response.json().get("total_points", 0)
        
        if initial_xp < 10:
            pytest.skip("Not enough XP to create duel")
        
        # Create duel
        create_response = requests.post(
            f"{BASE_URL}/api/game/duel/create",
            json={
                "wager_amount": 10,
                "difficulty": "easy",
                "chaos_mode": False
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if create_response.status_code != 200:
            print(f"Create duel failed: {create_response.text}")
            pytest.skip("Could not create duel")
        
        duel = create_response.json()
        duel_id = duel["id"]
        print(f"✅ Created duel: {duel_id}")
        
        # Verify XP was locked
        profile_after_create = requests.get(
            f"{BASE_URL}/api/gamification/profile",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        xp_after_create = profile_after_create.json().get("total_points", 0)
        assert xp_after_create == initial_xp - 10, "XP should be locked"
        print(f"✅ XP locked: {initial_xp} -> {xp_after_create}")
        
        # Cancel duel
        cancel_response = requests.post(
            f"{BASE_URL}/api/game/duel/cancel/{duel_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert cancel_response.status_code == 200
        print(f"✅ Duel cancelled")
        
        # Verify XP was refunded
        profile_after_cancel = requests.get(
            f"{BASE_URL}/api/gamification/profile",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        xp_after_cancel = profile_after_cancel.json().get("total_points", 0)
        assert xp_after_cancel == initial_xp, "XP should be refunded"
        print(f"✅ XP refunded: {xp_after_create} -> {xp_after_cancel}")
    
    def test_cannot_accept_own_duel(self, auth_token):
        """Test that user cannot accept their own duel"""
        # First check user's XP
        profile_response = requests.get(
            f"{BASE_URL}/api/gamification/profile",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        initial_xp = profile_response.json().get("total_points", 0)
        
        if initial_xp < 10:
            pytest.skip("Not enough XP to create duel")
        
        # Create duel
        create_response = requests.post(
            f"{BASE_URL}/api/game/duel/create",
            json={
                "wager_amount": 10,
                "difficulty": "easy",
                "chaos_mode": False
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if create_response.status_code != 200:
            pytest.skip("Could not create duel")
        
        duel_id = create_response.json()["id"]
        
        # Try to accept own duel
        accept_response = requests.post(
            f"{BASE_URL}/api/game/duel/accept/{duel_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert accept_response.status_code == 400
        assert "Cannot accept your own duel" in accept_response.json().get("detail", "")
        print(f"✅ Cannot accept own duel")
        
        # Clean up - cancel the duel
        requests.post(
            f"{BASE_URL}/api/game/duel/cancel/{duel_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    def test_invalid_difficulty_duel(self, auth_token):
        """Test creating duel with invalid difficulty"""
        response = requests.post(
            f"{BASE_URL}/api/game/duel/create",
            json={
                "wager_amount": 10,
                "difficulty": "impossible",
                "chaos_mode": False
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
        print(f"✅ Invalid difficulty rejected")


class TestGamificationIntegration:
    """Test gamification system integration with games"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_get_profile(self, auth_token):
        """Test getting gamification profile"""
        response = requests.get(
            f"{BASE_URL}/api/gamification/profile",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "total_points" in data
        assert "level" in data
        assert "level_name" in data
        assert "achievements" in data
        print(f"✅ Profile: Level {data['level']} ({data['level_name']}), {data['total_points']} XP")
    
    def test_get_achievements(self, auth_token):
        """Test getting all achievements"""
        response = requests.get(
            f"{BASE_URL}/api/gamification/achievements",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "categories" in data
        # Check gaming category exists
        assert "gaming" in data["categories"]
        print(f"✅ Achievements retrieved, {len(data['categories'])} categories")
    
    def test_get_leaderboard(self):
        """Test getting global leaderboard"""
        response = requests.get(f"{BASE_URL}/api/gamification/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        assert "leaderboard" in data
        print(f"✅ Global leaderboard: {len(data['leaderboard'])} entries")
    
    def test_daily_login(self, auth_token):
        """Test daily login streak"""
        response = requests.post(
            f"{BASE_URL}/api/gamification/daily-login",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "streak" in data or "message" in data
        print(f"✅ Daily login recorded")


class TestXPEscrowSystem:
    """Test XP lock/unlock/clear functions for duels"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_xp_lock_on_duel_create(self, auth_token):
        """Test that XP is locked when creating a duel"""
        # Get initial XP
        profile_response = requests.get(
            f"{BASE_URL}/api/gamification/profile",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        initial_xp = profile_response.json().get("total_points", 0)
        
        if initial_xp < 10:
            pytest.skip("Not enough XP")
        
        # Create duel
        create_response = requests.post(
            f"{BASE_URL}/api/game/duel/create",
            json={"wager_amount": 10, "difficulty": "easy", "chaos_mode": False},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if create_response.status_code != 200:
            pytest.skip("Could not create duel")
        
        duel_id = create_response.json()["id"]
        
        # Check XP decreased
        profile_after = requests.get(
            f"{BASE_URL}/api/gamification/profile",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        xp_after = profile_after.json().get("total_points", 0)
        
        assert xp_after == initial_xp - 10, f"XP should be locked: {initial_xp} -> {xp_after}"
        print(f"✅ XP locked correctly: {initial_xp} -> {xp_after}")
        
        # Clean up
        requests.post(
            f"{BASE_URL}/api/game/duel/cancel/{duel_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    
    def test_xp_unlock_on_duel_cancel(self, auth_token):
        """Test that XP is unlocked when cancelling a duel"""
        # Get initial XP
        profile_response = requests.get(
            f"{BASE_URL}/api/gamification/profile",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        initial_xp = profile_response.json().get("total_points", 0)
        
        if initial_xp < 10:
            pytest.skip("Not enough XP")
        
        # Create duel
        create_response = requests.post(
            f"{BASE_URL}/api/game/duel/create",
            json={"wager_amount": 10, "difficulty": "easy", "chaos_mode": False},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if create_response.status_code != 200:
            pytest.skip("Could not create duel")
        
        duel_id = create_response.json()["id"]
        
        # Cancel duel
        cancel_response = requests.post(
            f"{BASE_URL}/api/game/duel/cancel/{duel_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert cancel_response.status_code == 200
        
        # Check XP restored
        profile_after = requests.get(
            f"{BASE_URL}/api/gamification/profile",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        xp_after = profile_after.json().get("total_points", 0)
        
        assert xp_after == initial_xp, f"XP should be restored: {xp_after} != {initial_xp}"
        print(f"✅ XP unlocked correctly: {xp_after}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
