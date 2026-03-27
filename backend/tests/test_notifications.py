"""
Test suite for Admin Broadcast Notification System
Tests: POST /api/notifications/admin/broadcast, GET /api/notifications/user,
       GET /api/notifications/unread-count, PUT /api/notifications/{id}/read,
       DELETE /api/notifications/{id}, GET /api/notifications/admin/users-list,
       PUT /api/notifications/admin/users/{id}/broadcast-permission
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')

# Test credentials (super admin)
SUPER_ADMIN_EMAIL = "alinmy77@gmail.com"
SUPER_ADMIN_PASSWORD = "Calliotel2024!"


class TestNotificationSystem:
    """Test Admin Broadcast Notification System"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for super admin"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": SUPER_ADMIN_EMAIL, "password": SUPER_ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        token = data.get("access_token") or data.get("token")
        assert token, f"No token in response: {data}"
        return token
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Auth headers for requests"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    # ----- Test Unread Count Endpoint -----
    def test_get_unread_count(self, headers):
        """Test GET /api/notifications/unread-count"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/unread-count",
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "unread_count" in data, f"Missing unread_count: {data}"
        assert isinstance(data["unread_count"], int), "unread_count should be int"
        print(f"✅ Unread count: {data['unread_count']}")
    
    # ----- Test User Notifications Endpoint -----
    def test_get_user_notifications(self, headers):
        """Test GET /api/notifications/user"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/user",
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Expected list, got: {type(data)}"
        print(f"✅ User notifications: {len(data)} total")
        
        # Check notification structure if any exist
        if len(data) > 0:
            notif = data[0]
            assert "id" in notif, "Missing id field"
            assert "title" in notif, "Missing title field"
            assert "message" in notif, "Missing message field"
            assert "sent_by_name" in notif, "Missing sent_by_name field"
            assert "created_at" in notif, "Missing created_at field"
            assert "is_read" in notif, "Missing is_read field"
            print(f"✅ First notification: '{notif['title']}' - read: {notif['is_read']}")
    
    # ----- Test Admin Users List Endpoint (Super Admin Only) -----
    def test_get_admin_users_list(self, headers):
        """Test GET /api/notifications/admin/users-list - super admin only"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/admin/users-list",
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "success" in data, f"Missing success field: {data}"
        assert data["success"] == True
        assert "users" in data, "Missing users field"
        assert isinstance(data["users"], list), "users should be a list"
        print(f"✅ Admin users list: {len(data['users'])} users")
        
        # Check user structure
        if len(data["users"]) > 0:
            user = data["users"][0]
            assert "user_id" in user, "Missing user_id"
            assert "email" in user, "Missing email"
            assert "can_broadcast" in user, "Missing can_broadcast"
            assert "is_super_admin" in user, "Missing is_super_admin"
    
    # ----- Test Send Broadcast Endpoint -----
    def test_send_broadcast_notification(self, headers):
        """Test POST /api/notifications/admin/broadcast - super admin only"""
        test_id = str(uuid.uuid4())[:8]
        broadcast_data = {
            "title": f"Test Broadcast {test_id}",
            "message": f"This is a test broadcast message created during automated testing. ID: {test_id}"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/notifications/admin/broadcast",
            json=broadcast_data,
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "success" in data, f"Missing success field: {data}"
        assert data["success"] == True
        assert "notification_id" in data, "Missing notification_id"
        assert "message" in data, "Missing message field"
        print(f"✅ Broadcast sent: {data['message']}")
        print(f"✅ Notification ID: {data['notification_id']}")
        
        # Store notification_id for later tests
        return data["notification_id"]
    
    # ----- Test Mark as Read Endpoint -----
    def test_mark_notification_as_read(self, headers):
        """Test PUT /api/notifications/{id}/read"""
        # First, get user notifications to find one to mark as read
        response = requests.get(
            f"{BASE_URL}/api/notifications/user",
            headers=headers
        )
        assert response.status_code == 200
        notifications = response.json()
        
        if len(notifications) == 0:
            pytest.skip("No notifications to mark as read")
        
        # Find an unread notification or use any
        notification = next((n for n in notifications if not n["is_read"]), notifications[0])
        notification_id = notification["id"]
        
        # Mark as read
        response = requests.put(
            f"{BASE_URL}/api/notifications/{notification_id}/read",
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "success" in data, f"Missing success field: {data}"
        assert data["success"] == True
        print(f"✅ Marked notification {notification_id} as read")
    
    # ----- Test Delete Notification Endpoint -----
    def test_delete_notification(self, headers):
        """Test DELETE /api/notifications/{id} - soft delete"""
        # First, create a fresh broadcast to delete
        test_id = str(uuid.uuid4())[:8]
        broadcast_data = {
            "title": f"Delete Test {test_id}",
            "message": f"This notification will be deleted. ID: {test_id}"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/notifications/admin/broadcast",
            json=broadcast_data,
            headers=headers
        )
        assert response.status_code == 200
        notification_id = response.json()["notification_id"]
        print(f"Created notification for deletion: {notification_id}")
        
        # Delete the notification
        response = requests.delete(
            f"{BASE_URL}/api/notifications/{notification_id}",
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "success" in data, f"Missing success field: {data}"
        assert data["success"] == True
        print(f"✅ Deleted notification {notification_id}")
        
        # Verify it's no longer in the user's notifications list
        response = requests.get(
            f"{BASE_URL}/api/notifications/user",
            headers=headers
        )
        assert response.status_code == 200
        notifications = response.json()
        notification_ids = [n["id"] for n in notifications]
        assert notification_id not in notification_ids, "Deleted notification still appears in list"
        print("✅ Verified notification is no longer in user's list")
    
    # ----- Test Broadcast Permission Toggle -----
    def test_toggle_broadcast_permission(self, headers):
        """Test PUT /api/notifications/admin/users/{id}/broadcast-permission"""
        # First get a user that's not a super admin
        response = requests.get(
            f"{BASE_URL}/api/notifications/admin/users-list",
            headers=headers
        )
        assert response.status_code == 200
        users = response.json()["users"]
        
        # Find a non-super admin user
        non_super_admin = next((u for u in users if not u.get("is_super_admin")), None)
        
        if non_super_admin is None:
            pytest.skip("No non-super admin users to test permission toggle")
        
        user_id = non_super_admin["user_id"]
        current_permission = non_super_admin.get("can_broadcast", False)
        new_permission = not current_permission
        
        # Toggle permission
        response = requests.put(
            f"{BASE_URL}/api/notifications/admin/users/{user_id}/broadcast-permission",
            json={"can_broadcast": new_permission},
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "success" in data, f"Missing success field: {data}"
        assert data["success"] == True
        print(f"✅ Toggled broadcast permission for {user_id}: {current_permission} -> {new_permission}")
        
        # Revert permission back to original
        response = requests.put(
            f"{BASE_URL}/api/notifications/admin/users/{user_id}/broadcast-permission",
            json={"can_broadcast": current_permission},
            headers=headers
        )
        assert response.status_code == 200
        print(f"✅ Reverted permission back to {current_permission}")
    
    # ----- Test Error Cases -----
    def test_broadcast_without_auth(self):
        """Test that broadcast endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/admin/broadcast",
            json={"title": "Test", "message": "Test message"}
        )
        # Should return 401 or 403
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ Broadcast requires authentication")
    
    def test_mark_nonexistent_notification_as_read(self, headers):
        """Test marking non-existent notification as read returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.put(
            f"{BASE_URL}/api/notifications/{fake_id}/read",
            headers=headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Non-existent notification returns 404")
    
    def test_delete_nonexistent_notification(self, headers):
        """Test deleting non-existent notification returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(
            f"{BASE_URL}/api/notifications/{fake_id}",
            headers=headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Non-existent notification delete returns 404")
    
    def test_admin_users_list_without_auth(self):
        """Test that admin users list requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/admin/users-list"
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ Admin users list requires authentication")
    
    def test_unread_count_without_auth(self):
        """Test that unread count requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/unread-count"
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ Unread count requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
