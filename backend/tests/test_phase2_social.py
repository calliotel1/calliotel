"""
Phase 2 Social Features - Backend API Tests
Tests: Channels, Posts, Feed, Wrapped APIs
"""
import pytest
import requests
import os
import time
from uuid import uuid4

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "alinmy77@gmail.com"
TEST_PASSWORD = "Calliotel2024!"

class TestAuthentication:
    """Test auth endpoints first"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✅ Login successful for {TEST_EMAIL}")


@pytest.fixture(scope="class")
def auth_token():
    """Get auth token for protected endpoints"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="class")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestChannelsAPI:
    """Test Channels CRUD operations"""
    
    def test_discover_channels(self, auth_headers):
        """Test discovering public channels"""
        response = requests.get(
            f"{BASE_URL}/api/channels/discover?limit=20",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Discover channels: Found {len(data)} public channels")
    
    def test_my_channels(self, auth_headers):
        """Test getting user's joined channels"""
        response = requests.get(
            f"{BASE_URL}/api/channels/my-channels",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ My channels: User has joined {len(data)} channels")
    
    def test_create_channel(self, auth_headers):
        """Test creating a new channel"""
        unique_name = f"TEST_Channel_{uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/channels/create",
            headers=auth_headers,
            json={
                "name": unique_name,
                "description": "Test channel for automated testing",
                "is_private": False
            }
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["name"] == unique_name
        assert "channel_id" in data
        assert data["is_member"] == True
        assert data["is_admin"] == True
        print(f"✅ Created channel: {unique_name} (ID: {data['channel_id']})")
        return data["channel_id"]
    
    def test_get_channel_details(self, auth_headers):
        """Test getting channel details"""
        # First create a channel
        unique_name = f"TEST_DetailChannel_{uuid4().hex[:8]}"
        create_response = requests.post(
            f"{BASE_URL}/api/channels/create",
            headers=auth_headers,
            json={
                "name": unique_name,
                "description": "Channel for detail test",
                "is_private": False
            }
        )
        assert create_response.status_code == 200
        channel_id = create_response.json()["channel_id"]
        
        # Get channel details
        response = requests.get(
            f"{BASE_URL}/api/channels/{channel_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["channel_id"] == channel_id
        assert data["name"] == unique_name
        print(f"✅ Get channel details: {data['name']}")
    
    def test_join_leave_channel(self, auth_headers):
        """Test joining and leaving a channel (need 2nd user in real scenario)"""
        # For now, verify the endpoints exist and return proper errors
        fake_channel_id = str(uuid4())
        
        # Try to join non-existent channel
        join_response = requests.post(
            f"{BASE_URL}/api/channels/{fake_channel_id}/join",
            headers=auth_headers
        )
        assert join_response.status_code == 404, "Should return 404 for non-existent channel"
        print("✅ Join channel validation works (404 for non-existent)")
        
        # Try to leave non-existent channel
        leave_response = requests.post(
            f"{BASE_URL}/api/channels/{fake_channel_id}/leave",
            headers=auth_headers
        )
        assert leave_response.status_code == 400, f"Leave response: {leave_response.text}"
        print("✅ Leave channel validation works")
    
    def test_update_channel(self, auth_headers):
        """Test updating channel (admin only)"""
        # Create channel first
        unique_name = f"TEST_UpdateChannel_{uuid4().hex[:8]}"
        create_response = requests.post(
            f"{BASE_URL}/api/channels/create",
            headers=auth_headers,
            json={
                "name": unique_name,
                "description": "Original description",
                "is_private": False
            }
        )
        assert create_response.status_code == 200
        channel_id = create_response.json()["channel_id"]
        
        # Update channel
        response = requests.put(
            f"{BASE_URL}/api/channels/{channel_id}",
            headers=auth_headers,
            json={
                "description": "Updated description for testing"
            }
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        print(f"✅ Updated channel: {channel_id}")
    
    def test_delete_channel(self, auth_headers):
        """Test deleting a channel"""
        # Create channel first
        unique_name = f"TEST_DeleteChannel_{uuid4().hex[:8]}"
        create_response = requests.post(
            f"{BASE_URL}/api/channels/create",
            headers=auth_headers,
            json={
                "name": unique_name,
                "description": "Channel to delete",
                "is_private": False
            }
        )
        assert create_response.status_code == 200
        channel_id = create_response.json()["channel_id"]
        
        # Delete channel
        response = requests.delete(
            f"{BASE_URL}/api/channels/{channel_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify deleted
        get_response = requests.get(
            f"{BASE_URL}/api/channels/{channel_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404
        print(f"✅ Deleted channel: {channel_id}")


class TestPostsAPI:
    """Test Posts CRUD and Feed operations"""
    
    @pytest.fixture(scope="class")
    def test_channel(self, auth_headers):
        """Create a test channel for posting"""
        unique_name = f"TEST_PostsChannel_{uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/channels/create",
            headers=auth_headers,
            json={
                "name": unique_name,
                "description": "Channel for posts testing",
                "is_private": False
            }
        )
        assert response.status_code == 200
        return response.json()["channel_id"]
    
    def test_get_feed(self, auth_headers):
        """Test getting personalized feed"""
        response = requests.get(
            f"{BASE_URL}/api/posts/feed?limit=20",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Feed: Got {len(data)} posts")
    
    def test_create_post(self, auth_headers, test_channel):
        """Test creating a new post"""
        response = requests.post(
            f"{BASE_URL}/api/posts/create",
            headers=auth_headers,
            json={
                "channel_id": test_channel,
                "content": f"TEST_Post content - automated test {uuid4().hex[:8]}",
                "media_urls": []
            }
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "post_id" in data
        assert data["channel_id"] == test_channel
        assert data["is_author"] == True
        print(f"✅ Created post: {data['post_id']}")
        return data["post_id"]
    
    def test_get_channel_posts(self, auth_headers, test_channel):
        """Test getting posts from a specific channel"""
        # First create a post
        create_response = requests.post(
            f"{BASE_URL}/api/posts/create",
            headers=auth_headers,
            json={
                "channel_id": test_channel,
                "content": f"TEST_ChannelPost {uuid4().hex[:8]}",
                "media_urls": []
            }
        )
        assert create_response.status_code == 200
        
        # Get channel posts
        response = requests.get(
            f"{BASE_URL}/api/posts/channel/{test_channel}?limit=10",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Should have at least one post"
        print(f"✅ Channel posts: Found {len(data)} posts in channel")
    
    def test_get_single_post(self, auth_headers, test_channel):
        """Test getting a single post"""
        # Create a post
        create_response = requests.post(
            f"{BASE_URL}/api/posts/create",
            headers=auth_headers,
            json={
                "channel_id": test_channel,
                "content": f"TEST_SinglePost {uuid4().hex[:8]}",
                "media_urls": []
            }
        )
        assert create_response.status_code == 200
        post_id = create_response.json()["post_id"]
        
        # Get the post
        response = requests.get(
            f"{BASE_URL}/api/posts/{post_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["post_id"] == post_id
        print(f"✅ Get single post: {post_id}")
    
    def test_like_unlike_post(self, auth_headers, test_channel):
        """Test liking and unliking a post"""
        # Create a post
        create_response = requests.post(
            f"{BASE_URL}/api/posts/create",
            headers=auth_headers,
            json={
                "channel_id": test_channel,
                "content": f"TEST_LikePost {uuid4().hex[:8]}",
                "media_urls": []
            }
        )
        assert create_response.status_code == 200
        post_id = create_response.json()["post_id"]
        
        # Like the post
        like_response = requests.post(
            f"{BASE_URL}/api/posts/{post_id}/like",
            headers=auth_headers
        )
        assert like_response.status_code == 200, f"Like failed: {like_response.text}"
        print(f"✅ Liked post: {post_id}")
        
        # Unlike the post
        unlike_response = requests.delete(
            f"{BASE_URL}/api/posts/{post_id}/like",
            headers=auth_headers
        )
        assert unlike_response.status_code == 200, f"Unlike failed: {unlike_response.text}"
        print(f"✅ Unliked post: {post_id}")
    
    def test_update_post(self, auth_headers, test_channel):
        """Test updating a post (author only)"""
        # Create a post
        create_response = requests.post(
            f"{BASE_URL}/api/posts/create",
            headers=auth_headers,
            json={
                "channel_id": test_channel,
                "content": f"TEST_UpdatePost Original {uuid4().hex[:8]}",
                "media_urls": []
            }
        )
        assert create_response.status_code == 200
        post_id = create_response.json()["post_id"]
        
        # Update the post
        response = requests.put(
            f"{BASE_URL}/api/posts/{post_id}",
            headers=auth_headers,
            json={
                "content": f"TEST_UpdatePost Updated content {uuid4().hex[:8]}"
            }
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        print(f"✅ Updated post: {post_id}")
    
    def test_delete_post(self, auth_headers, test_channel):
        """Test deleting a post"""
        # Create a post
        create_response = requests.post(
            f"{BASE_URL}/api/posts/create",
            headers=auth_headers,
            json={
                "channel_id": test_channel,
                "content": f"TEST_DeletePost {uuid4().hex[:8]}",
                "media_urls": []
            }
        )
        assert create_response.status_code == 200
        post_id = create_response.json()["post_id"]
        
        # Delete the post
        response = requests.delete(
            f"{BASE_URL}/api/posts/{post_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify deleted
        get_response = requests.get(
            f"{BASE_URL}/api/posts/{post_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404
        print(f"✅ Deleted post: {post_id}")


class TestCommentsAPI:
    """Test Comments on Posts"""
    
    @pytest.fixture(scope="class")
    def test_post(self, auth_headers):
        """Create a test channel and post for comments"""
        # Create channel
        channel_response = requests.post(
            f"{BASE_URL}/api/channels/create",
            headers=auth_headers,
            json={
                "name": f"TEST_CommentsChannel_{uuid4().hex[:8]}",
                "description": "Channel for comments testing",
                "is_private": False
            }
        )
        assert channel_response.status_code == 200
        channel_id = channel_response.json()["channel_id"]
        
        # Create post
        post_response = requests.post(
            f"{BASE_URL}/api/posts/create",
            headers=auth_headers,
            json={
                "channel_id": channel_id,
                "content": f"TEST_CommentPost {uuid4().hex[:8]}",
                "media_urls": []
            }
        )
        assert post_response.status_code == 200
        return post_response.json()["post_id"]
    
    def test_add_comment(self, auth_headers, test_post):
        """Test adding a comment to a post"""
        response = requests.post(
            f"{BASE_URL}/api/posts/{test_post}/comments",
            headers=auth_headers,
            json={
                "content": f"TEST_Comment {uuid4().hex[:8]}"
            }
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "comment_id" in data
        assert data["post_id"] == test_post
        print(f"✅ Added comment: {data['comment_id']}")
        return data["comment_id"]
    
    def test_get_comments(self, auth_headers, test_post):
        """Test getting comments for a post"""
        # Add a comment first
        add_response = requests.post(
            f"{BASE_URL}/api/posts/{test_post}/comments",
            headers=auth_headers,
            json={
                "content": f"TEST_GetComment {uuid4().hex[:8]}"
            }
        )
        assert add_response.status_code == 200
        
        # Get comments
        response = requests.get(
            f"{BASE_URL}/api/posts/{test_post}/comments",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Should have at least one comment"
        print(f"✅ Got {len(data)} comments for post")
    
    def test_delete_comment(self, auth_headers, test_post):
        """Test deleting a comment"""
        # Add a comment
        add_response = requests.post(
            f"{BASE_URL}/api/posts/{test_post}/comments",
            headers=auth_headers,
            json={
                "content": f"TEST_DeleteComment {uuid4().hex[:8]}"
            }
        )
        assert add_response.status_code == 200
        comment_id = add_response.json()["comment_id"]
        
        # Delete comment
        response = requests.delete(
            f"{BASE_URL}/api/posts/comments/{comment_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        print(f"✅ Deleted comment: {comment_id}")


class TestChatWrappedAPI:
    """Test Chat Wrapped (Recap) API"""
    
    def test_get_monthly_recap(self, auth_headers):
        """Test getting monthly recap"""
        response = requests.get(
            f"{BASE_URL}/api/wrapped/recap/monthly?year=2026&month=3",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["period"] == "monthly"
        assert "total_messages" in data
        assert "personality_insight" in data
        print(f"✅ Monthly recap: {data['total_messages']} messages")
    
    def test_get_yearly_recap(self, auth_headers):
        """Test getting yearly recap"""
        response = requests.get(
            f"{BASE_URL}/api/wrapped/recap/yearly?year=2026",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["period"] == "yearly"
        assert "total_messages" in data
        assert "fun_fact" in data
        print(f"✅ Yearly recap: {data['total_messages']} total messages")
    
    def test_get_available_periods(self, auth_headers):
        """Test getting available recap periods"""
        response = requests.get(
            f"{BASE_URL}/api/wrapped/recap/available-periods",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "has_data" in data
        assert "available_years" in data
        print(f"✅ Available periods: {data['available_years']}")
    
    def test_invalid_period(self, auth_headers):
        """Test invalid period returns error"""
        response = requests.get(
            f"{BASE_URL}/api/wrapped/recap/invalid",
            headers=auth_headers
        )
        
        assert response.status_code == 400, f"Should be 400, got {response.status_code}"
        print("✅ Invalid period returns 400")


class TestPhase1StreaksAPI:
    """Test Phase 1 Streaks API (regression)"""
    
    def test_get_all_streaks(self, auth_headers):
        """Test getting all user streaks"""
        response = requests.get(
            f"{BASE_URL}/api/streaks/streaks/all",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "streaks" in data
        assert "total_active" in data
        print(f"✅ All streaks: {data['total_active']} active")
    
    def test_get_leaderboard(self, auth_headers):
        """Test getting streak leaderboard"""
        response = requests.get(
            f"{BASE_URL}/api/streaks/leaderboard",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "leaderboard" in data
        print(f"✅ Leaderboard: {len(data['leaderboard'])} entries")


class TestPhase1MediaAPI:
    """Test Phase 1 Media API (regression)"""
    
    def test_get_popular_stickers(self, auth_headers):
        """Test getting popular sticker packs"""
        response = requests.get(
            f"{BASE_URL}/api/media/stickers/popular",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "packs" in data
        assert len(data["packs"]) > 0
        print(f"✅ Popular stickers: {len(data['packs'])} packs")
    
    def test_get_my_stickers(self, auth_headers):
        """Test getting user's custom stickers"""
        response = requests.get(
            f"{BASE_URL}/api/media/stickers/my",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "stickers" in data
        print(f"✅ My stickers: {data['total']} custom stickers")


class TestChatStatsAPI:
    """Test Chat Statistics API"""
    
    def test_get_all_stats_summary(self, auth_headers):
        """Test getting summary stats across all friendships"""
        response = requests.get(
            f"{BASE_URL}/api/chat/stats/all/summary",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "total_friends" in data
        assert "total_messages" in data
        print(f"✅ Stats summary: {data['total_messages']} total messages")


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed data after all tests"""
    yield
    # Cleanup would happen here if we had direct DB access
    print("\n🧹 Test session complete - TEST_ prefixed data remains for inspection")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
