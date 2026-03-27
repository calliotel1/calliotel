"""
Co-Op Stack Game API Tests
Tests for multiplayer room creation, joining, and game state management
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "alinmy77@gmail.com"
TEST_PASSWORD = "Calliotel2024!"


class TestCoOpStackAPIs:
    """Co-Op Stack Game API Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("access_token")  # API returns access_token, not token
            self.user_id = data.get("user", {}).get("id")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip(f"Authentication failed: {login_response.status_code}")
    
    def test_01_login_success(self):
        """Test login works and returns token"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data  # API returns access_token
        assert "user" in data
        print(f"✅ Login successful, user_id: {data['user'].get('id')}")
    
    def test_02_create_coop_room(self):
        """Test creating a new Co-Op Stack room"""
        response = self.session.post(
            f"{BASE_URL}/api/coop/room/create",
            json={
                "max_players": 4,
                "level_id": 1,
                "xp_pot": 100
            }
        )
        
        assert response.status_code == 200, f"Failed to create room: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True
        assert "room_id" in data
        assert len(data["room_id"]) == 8  # 8-character room code
        assert data.get("max_players") == 4
        assert data.get("level_id") == 1
        
        self.room_id = data["room_id"]
        print(f"✅ Room created: {self.room_id}")
        
        return data["room_id"]
    
    def test_03_get_room_info(self):
        """Test getting room information after creation"""
        # First create a room
        create_response = self.session.post(
            f"{BASE_URL}/api/coop/room/create",
            json={"max_players": 4, "level_id": 1, "xp_pot": 100}
        )
        assert create_response.status_code == 200
        room_id = create_response.json()["room_id"]
        
        # Get room info
        response = self.session.get(f"{BASE_URL}/api/coop/room/{room_id}")
        
        assert response.status_code == 200, f"Failed to get room: {response.text}"
        data = response.json()
        
        # Verify room data
        assert data.get("room_id") == room_id
        assert data.get("status") == "waiting"
        assert data.get("max_players") == 4
        assert data.get("xp_pot") == 100
        assert "players" in data
        assert len(data["players"]) >= 1  # Host should be in players list
        
        print(f"✅ Room info retrieved: {room_id}, status: {data['status']}, players: {len(data['players'])}")
    
    def test_04_get_room_not_found(self):
        """Test getting non-existent room returns 404"""
        response = self.session.get(f"{BASE_URL}/api/coop/room/NOTEXIST")
        
        assert response.status_code == 404
        print("✅ Non-existent room correctly returns 404")
    
    def test_05_join_own_room(self):
        """Test joining a room you already created (should succeed with 'Already in room')"""
        # Create a room
        create_response = self.session.post(
            f"{BASE_URL}/api/coop/room/create",
            json={"max_players": 4, "level_id": 1, "xp_pot": 100}
        )
        assert create_response.status_code == 200
        room_id = create_response.json()["room_id"]
        
        # Try to join the same room
        join_response = self.session.post(
            f"{BASE_URL}/api/coop/room/join",
            json={"room_id": room_id}
        )
        
        assert join_response.status_code == 200
        data = join_response.json()
        assert data.get("success") == True
        assert "Already in room" in data.get("message", "")
        
        print(f"✅ Joining own room correctly returns 'Already in room'")
    
    def test_06_join_nonexistent_room(self):
        """Test joining a non-existent room returns 404"""
        response = self.session.post(
            f"{BASE_URL}/api/coop/room/join",
            json={"room_id": "NOTEXIST"}
        )
        
        assert response.status_code == 404
        print("✅ Joining non-existent room correctly returns 404")
    
    def test_07_get_active_rooms(self):
        """Test getting list of active rooms"""
        # First create a room to ensure there's at least one
        self.session.post(
            f"{BASE_URL}/api/coop/room/create",
            json={"max_players": 4, "level_id": 1, "xp_pot": 100}
        )
        
        # Get active rooms
        response = self.session.get(f"{BASE_URL}/api/coop/rooms/active")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "rooms" in data
        assert "count" in data
        assert isinstance(data["rooms"], list)
        
        print(f"✅ Active rooms retrieved: {data['count']} rooms")
    
    def test_08_room_has_host_info(self):
        """Test that created room has correct host information"""
        create_response = self.session.post(
            f"{BASE_URL}/api/coop/room/create",
            json={"max_players": 4, "level_id": 1, "xp_pot": 100}
        )
        assert create_response.status_code == 200
        room_id = create_response.json()["room_id"]
        
        # Get room info
        response = self.session.get(f"{BASE_URL}/api/coop/room/{room_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify host info
        assert "host_id" in data
        assert "host_email" in data
        assert data["host_email"] == TEST_EMAIL
        
        # Verify host is in players list
        players = data.get("players", [])
        host_in_players = any(p.get("email") == TEST_EMAIL for p in players)
        assert host_in_players, "Host should be in players list"
        
        print(f"✅ Room has correct host info: {data['host_email']}")
    
    def test_09_room_xp_pot_validation(self):
        """Test room creation with different XP pot values"""
        # Create room with custom XP pot
        response = self.session.post(
            f"{BASE_URL}/api/coop/room/create",
            json={"max_players": 2, "level_id": 1, "xp_pot": 200}
        )
        
        assert response.status_code == 200
        room_id = response.json()["room_id"]
        
        # Verify XP pot in room info
        room_response = self.session.get(f"{BASE_URL}/api/coop/room/{room_id}")
        assert room_response.status_code == 200
        assert room_response.json()["xp_pot"] == 200
        
        print("✅ Custom XP pot value correctly saved")
    
    def test_10_room_case_insensitive_join(self):
        """Test that room codes are case-insensitive when joining"""
        # Create a room
        create_response = self.session.post(
            f"{BASE_URL}/api/coop/room/create",
            json={"max_players": 4, "level_id": 1, "xp_pot": 100}
        )
        assert create_response.status_code == 200
        room_id = create_response.json()["room_id"]
        
        # Try to join with lowercase room code
        join_response = self.session.post(
            f"{BASE_URL}/api/coop/room/join",
            json={"room_id": room_id.lower()}
        )
        
        assert join_response.status_code == 200
        print("✅ Room codes are case-insensitive")


class TestCoOpStackCombatCard:
    """Test Combat Card integration for Co-Op Stack"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("access_token")  # API returns access_token, not token
            self.user_id = data.get("user", {}).get("id")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip(f"Authentication failed: {login_response.status_code}")
    
    def test_combat_card_endpoint(self):
        """Test that combat card endpoint works for lobby display"""
        response = self.session.get(f"{BASE_URL}/api/profile/combat-card/{self.user_id}")
        
        assert response.status_code == 200, f"Failed to get combat card: {response.text}"
        data = response.json()
        
        # Verify combat card structure
        assert "email" in data
        assert "tier" in data
        assert "total_xp" in data
        assert "level" in data
        
        # Verify tier structure
        tier = data.get("tier", {})
        assert "name" in tier
        assert "color" in tier
        
        print(f"✅ Combat card retrieved: {data['email']}, tier: {tier['name']}, XP: {data['total_xp']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
