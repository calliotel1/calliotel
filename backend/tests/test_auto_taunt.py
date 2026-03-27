"""
Auto-Taunt System Tests
Tests for the psychological warfare engine - tier-based taunts, custom messages, and dual-strike delivery
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "alinmy77@gmail.com"
TEST_USER_PASSWORD = "Calliotel2024!"


class TestAutoTauntSettings:
    """Tests for Auto-Taunt Settings API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            self.user_id = login_response.json().get("user", {}).get("id")
        else:
            pytest.skip(f"Authentication failed: {login_response.status_code}")
    
    def test_get_auto_taunt_settings(self):
        """Test GET /api/profile/auto-taunt-settings - Fetch current settings"""
        response = self.session.get(f"{BASE_URL}/api/profile/auto-taunt-settings")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "auto_taunt_enabled" in data, "Missing auto_taunt_enabled field"
        assert "taunt_style" in data, "Missing taunt_style field"
        assert "custom_taunt_message" in data, "Missing custom_taunt_message field"
        assert "can_use_custom" in data, "Missing can_use_custom field"
        assert "can_use_silence" in data, "Missing can_use_silence field"
        assert "current_tier" in data, "Missing current_tier field"
        assert "total_xp" in data, "Missing total_xp field"
        
        # Verify data types
        assert isinstance(data["auto_taunt_enabled"], bool)
        assert isinstance(data["taunt_style"], str)
        assert isinstance(data["can_use_custom"], bool)
        assert isinstance(data["can_use_silence"], bool)
        assert isinstance(data["total_xp"], int)
        
        print(f"✅ Auto-taunt settings retrieved: enabled={data['auto_taunt_enabled']}, style={data['taunt_style']}, tier={data['current_tier']}, XP={data['total_xp']}")
    
    def test_update_auto_taunt_enable_toggle(self):
        """Test PUT /api/profile/auto-taunt-settings - Enable/disable toggle"""
        # First get current settings
        get_response = self.session.get(f"{BASE_URL}/api/profile/auto-taunt-settings")
        current_enabled = get_response.json().get("auto_taunt_enabled", False)
        
        # Toggle the setting
        new_enabled = not current_enabled
        response = self.session.put(f"{BASE_URL}/api/profile/auto-taunt-settings", json={
            "auto_taunt_enabled": new_enabled,
            "taunt_style": "honorable",
            "custom_taunt_message": ""
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        
        # Verify the change persisted
        verify_response = self.session.get(f"{BASE_URL}/api/profile/auto-taunt-settings")
        assert verify_response.json()["auto_taunt_enabled"] == new_enabled, "Setting did not persist"
        
        print(f"✅ Auto-taunt toggle works: {current_enabled} → {new_enabled}")
    
    def test_update_taunt_style_honorable(self):
        """Test setting taunt style to 'honorable'"""
        response = self.session.put(f"{BASE_URL}/api/profile/auto-taunt-settings", json={
            "auto_taunt_enabled": True,
            "taunt_style": "honorable",
            "custom_taunt_message": ""
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify
        verify_response = self.session.get(f"{BASE_URL}/api/profile/auto-taunt-settings")
        assert verify_response.json()["taunt_style"] == "honorable"
        
        print("✅ Taunt style 'honorable' set successfully")
    
    def test_update_taunt_style_ruthless(self):
        """Test setting taunt style to 'ruthless'"""
        response = self.session.put(f"{BASE_URL}/api/profile/auto-taunt-settings", json={
            "auto_taunt_enabled": True,
            "taunt_style": "ruthless",
            "custom_taunt_message": ""
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify
        verify_response = self.session.get(f"{BASE_URL}/api/profile/auto-taunt-settings")
        assert verify_response.json()["taunt_style"] == "ruthless"
        
        print("✅ Taunt style 'ruthless' set successfully")
    
    def test_silence_style_tier_restriction(self):
        """Test that 'silence' style requires Divine tier (2500+ XP)"""
        # First check user's XP
        settings_response = self.session.get(f"{BASE_URL}/api/profile/auto-taunt-settings")
        settings = settings_response.json()
        
        if settings["can_use_silence"]:
            # User has Divine+ tier, should be able to set silence
            response = self.session.put(f"{BASE_URL}/api/profile/auto-taunt-settings", json={
                "auto_taunt_enabled": True,
                "taunt_style": "silence",
                "custom_taunt_message": ""
            })
            assert response.status_code == 200, "Divine+ user should be able to use silence"
            print("✅ Divine+ user can use Architect's Silence")
        else:
            # User doesn't have Divine tier, should get 403
            response = self.session.put(f"{BASE_URL}/api/profile/auto-taunt-settings", json={
                "auto_taunt_enabled": True,
                "taunt_style": "silence",
                "custom_taunt_message": ""
            })
            assert response.status_code == 403, f"Expected 403 for non-Divine user, got {response.status_code}"
            assert "Divine tier" in response.json().get("detail", ""), "Error should mention Divine tier"
            print(f"✅ Silence style correctly restricted for user with {settings['total_xp']} XP (needs 2500+)")
    
    def test_custom_message_tier_restriction(self):
        """Test that custom messages require Gold tier (1000+ XP)"""
        settings_response = self.session.get(f"{BASE_URL}/api/profile/auto-taunt-settings")
        settings = settings_response.json()
        
        if settings["can_use_custom"]:
            # User has Gold+ tier, should be able to set custom message
            response = self.session.put(f"{BASE_URL}/api/profile/auto-taunt-settings", json={
                "auto_taunt_enabled": True,
                "taunt_style": "honorable",
                "custom_taunt_message": "You just got schooled!"
            })
            assert response.status_code == 200, "Gold+ user should be able to use custom message"
            print("✅ Gold+ user can use custom taunt message")
        else:
            # User doesn't have Gold tier, should get 403
            response = self.session.put(f"{BASE_URL}/api/profile/auto-taunt-settings", json={
                "auto_taunt_enabled": True,
                "taunt_style": "honorable",
                "custom_taunt_message": "Custom taunt test"
            })
            assert response.status_code == 403, f"Expected 403 for non-Gold user, got {response.status_code}"
            assert "Gold tier" in response.json().get("detail", ""), "Error should mention Gold tier"
            print(f"✅ Custom message correctly restricted for user with {settings['total_xp']} XP (needs 1000+)")
    
    def test_custom_message_200_char_limit(self):
        """Test that custom messages are limited to 200 characters"""
        settings_response = self.session.get(f"{BASE_URL}/api/profile/auto-taunt-settings")
        settings = settings_response.json()
        
        if not settings["can_use_custom"]:
            pytest.skip("User doesn't have Gold tier for custom messages")
        
        # Try to set a message that's too long (201 chars)
        long_message = "A" * 201
        response = self.session.put(f"{BASE_URL}/api/profile/auto-taunt-settings", json={
            "auto_taunt_enabled": True,
            "taunt_style": "honorable",
            "custom_taunt_message": long_message
        })
        
        assert response.status_code == 400, f"Expected 400 for 201-char message, got {response.status_code}"
        print("✅ 200 character limit enforced correctly")
    
    def test_empty_custom_message_allowed(self):
        """Test that empty custom message falls back to tier defaults"""
        response = self.session.put(f"{BASE_URL}/api/profile/auto-taunt-settings", json={
            "auto_taunt_enabled": True,
            "taunt_style": "honorable",
            "custom_taunt_message": ""
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ Empty custom message allowed (falls back to tier defaults)")


class TestTauntGenerator:
    """Tests for the taunt generation utility"""
    
    def test_tier_name_calculation(self):
        """Test tier name calculation based on XP"""
        # Import the taunt generator
        import sys
        sys.path.insert(0, '/app/backend')
        from utils.taunt_generator import get_tier_name
        
        # Test tier thresholds
        assert get_tier_name(0) == "Bronze Rookie"
        assert get_tier_name(99) == "Bronze Rookie"
        assert get_tier_name(100) == "Silver Challenger"
        assert get_tier_name(499) == "Silver Challenger"
        assert get_tier_name(500) == "Gold Warrior"
        assert get_tier_name(999) == "Gold Warrior"
        assert get_tier_name(1000) == "Platinum Elite"
        assert get_tier_name(2499) == "Platinum Elite"
        assert get_tier_name(2500) == "Divine Legend"
        assert get_tier_name(10000) == "Divine Legend"
        
        # Test admin override
        assert get_tier_name(0, is_admin=True) == "The Architect"
        
        print("✅ Tier name calculation works correctly")
    
    def test_default_taunt_style_by_tier(self):
        """Test default taunt style assignment by tier"""
        import sys
        sys.path.insert(0, '/app/backend')
        from utils.taunt_generator import get_default_taunt_style
        
        # Bronze-Silver: Honorable
        assert get_default_taunt_style("Bronze Rookie") == "honorable"
        assert get_default_taunt_style("Silver Challenger") == "honorable"
        
        # Gold-Platinum: Ruthless
        assert get_default_taunt_style("Gold Warrior") == "ruthless"
        assert get_default_taunt_style("Platinum Elite") == "ruthless"
        
        # Divine-Architect: Silence
        assert get_default_taunt_style("Divine Legend") == "silence"
        assert get_default_taunt_style("The Architect") == "silence"
        
        print("✅ Default taunt style by tier works correctly")
    
    def test_taunt_generation_honorable(self):
        """Test honorable taunt generation"""
        import sys
        sys.path.insert(0, '/app/backend')
        from utils.taunt_generator import generate_taunt, HONORABLE_TAUNTS
        
        taunt = generate_taunt("Silver Challenger", "honorable")
        assert taunt is not None, "Honorable taunt should not be None"
        assert taunt in HONORABLE_TAUNTS.get("Silver Challenger", []) or taunt in HONORABLE_TAUNTS.get("Bronze Rookie", [])
        
        print(f"✅ Honorable taunt generated: '{taunt}'")
    
    def test_taunt_generation_ruthless(self):
        """Test ruthless taunt generation"""
        import sys
        sys.path.insert(0, '/app/backend')
        from utils.taunt_generator import generate_taunt, RUTHLESS_TAUNTS
        
        taunt = generate_taunt("Gold Warrior", "ruthless")
        assert taunt is not None, "Ruthless taunt should not be None"
        assert taunt in RUTHLESS_TAUNTS.get("Gold Warrior", []) or taunt in RUTHLESS_TAUNTS.get("Bronze Rookie", [])
        
        print(f"✅ Ruthless taunt generated: '{taunt}'")
    
    def test_taunt_generation_silence(self):
        """Test silence mode returns None (visual-only)"""
        import sys
        sys.path.insert(0, '/app/backend')
        from utils.taunt_generator import generate_taunt
        
        taunt = generate_taunt("Divine Legend", "silence")
        assert taunt is None, "Silence mode should return None (visual-only)"
        
        print("✅ Silence mode correctly returns None")
    
    def test_custom_message_override(self):
        """Test that custom message overrides tier defaults"""
        import sys
        sys.path.insert(0, '/app/backend')
        from utils.taunt_generator import generate_taunt
        
        custom = "You just got schooled!"
        taunt = generate_taunt("Silver Challenger", "honorable", custom_message=custom)
        assert taunt == custom, f"Expected custom message, got: {taunt}"
        
        print("✅ Custom message override works correctly")
    
    def test_tier_unlock_functions(self):
        """Test tier unlock validation functions"""
        import sys
        sys.path.insert(0, '/app/backend')
        from utils.taunt_generator import can_use_custom_taunt, can_use_silence
        
        # Custom taunt: Gold+ (1000+ XP)
        assert can_use_custom_taunt(999) == False
        assert can_use_custom_taunt(1000) == True
        assert can_use_custom_taunt(5000) == True
        
        # Silence: Divine+ (2500+ XP) or admin
        assert can_use_silence(2499) == False
        assert can_use_silence(2500) == True
        assert can_use_silence(0, is_admin=True) == True
        
        print("✅ Tier unlock functions work correctly")


class TestCombatCard:
    """Tests for Combat Card API (used in TauntModal)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            self.user_id = TEST_USER_EMAIL  # User ID is email in this system
        else:
            pytest.skip(f"Authentication failed: {login_response.status_code}")
    
    def test_get_combat_card(self):
        """Test GET /api/profile/combat-card/{user_id}"""
        response = self.session.get(f"{BASE_URL}/api/profile/combat-card/{self.user_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify Combat Card structure
        assert "user_id" in data
        assert "email" in data
        assert "tier" in data
        assert "total_xp" in data
        assert "level" in data
        assert "duel_stats" in data
        
        # Verify tier structure
        tier = data["tier"]
        assert "name" in tier
        assert "color" in tier
        assert "emoji" in tier
        
        # Verify duel stats structure
        duel_stats = data["duel_stats"]
        assert "total_duels" in duel_stats
        assert "wins" in duel_stats
        assert "losses" in duel_stats
        assert "win_rate" in duel_stats
        
        print(f"✅ Combat Card retrieved: {data['email']}, Tier: {tier['emoji']} {tier['name']}, XP: {data['total_xp']}, Win Rate: {duel_stats['win_rate']}%")
    
    def test_combat_card_not_found(self):
        """Test Combat Card for non-existent user"""
        response = self.session.get(f"{BASE_URL}/api/profile/combat-card/nonexistent@user.com")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Combat Card returns 404 for non-existent user")


class TestDuelIntegration:
    """Tests for Duel API integration with Auto-Taunt"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            self.user_id = TEST_USER_EMAIL  # User ID is email in this system
        else:
            pytest.skip(f"Authentication failed: {login_response.status_code}")
    
    def test_duel_feed_endpoint(self):
        """Test GET /api/game/duel/feed - Verify duel system is working"""
        response = self.session.get(f"{BASE_URL}/api/game/duel/feed")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "duels" in data
        assert "count" in data
        
        print(f"✅ Duel feed working: {data['count']} duels found")
    
    def test_duel_stats_endpoint(self):
        """Test GET /api/game/duel/stats - User's duel statistics"""
        response = self.session.get(f"{BASE_URL}/api/game/duel/stats")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "wins" in data
        assert "losses" in data
        assert "total_duels" in data
        assert "win_rate" in data
        
        print(f"✅ Duel stats: {data['wins']}W / {data['losses']}L ({data['win_rate']}% win rate)")


class TestProfileSettings:
    """Tests for Profile Settings page data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            self.user_id = TEST_USER_EMAIL  # User ID is email in this system
        else:
            pytest.skip(f"Authentication failed: {login_response.status_code}")
    
    def test_get_my_profile(self):
        """Test GET /api/profile/me - Profile settings data"""
        response = self.session.get(f"{BASE_URL}/api/profile/me")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "tier" in data
        assert "total_xp" in data
        
        print(f"✅ Profile data retrieved: {data['email']}, Tier: {data['tier']['name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
