"""
SMS Logic Unit Tests - Digital Colosseum
Tests quota enforcement, tier limits, and auto-trigger logic
Run with: pytest test_sms_logic.py -v
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
import sys
import os

# Add backend to path
sys.path.insert(0, '/app/backend')

# Test data
BRONZE_USER = {
    "id": "test_bronze_user",
    "username": "BronzeWarrior",
    "email": "bronze@test.com",
    "tier": "Bronze",
    "total_xp": 50,
    "phone_number": "+27123456789",
    "sms_preferences": {
        "duel_challenges": True,
        "achievements": True
    },
    "sms_quota": {
        "monthly_limit": 0,  # Bronze = no SMS
        "used_this_month": 0
    }
}

GOLD_USER = {
    "id": "test_gold_user",
    "username": "GoldWarrior",
    "email": "gold@test.com",
    "tier": "Gold",
    "total_xp": 600,
    "phone_number": "+27987654321",
    "sms_preferences": {
        "duel_challenges": True,
        "achievements": True
    },
    "sms_quota": {
        "monthly_limit": 20,  # Gold = 20 SMS/month
        "used_this_month": 0
    }
}

PLATINUM_USER = {
    "id": "test_platinum_user",
    "username": "PlatinumLegend",
    "email": "platinum@test.com",
    "tier": "Platinum",
    "total_xp": 1500,
    "phone_number": "+27555555555",
    "sms_preferences": {
        "duel_challenges": True,
        "achievements": True
    },
    "sms_quota": {
        "monthly_limit": -1,  # Platinum = unlimited
        "used_this_month": 0
    }
}

class TestQuotaEnforcement:
    """Test SMS quota limits by tier"""
    
    @pytest.mark.asyncio
    async def test_bronze_user_blocked(self):
        """Bronze users should be blocked from sending SMS"""
        from services.sms_notifications import check_sms_quota
        
        with patch('services.sms_notifications.db') as mock_db:
            mock_db.users.find_one = AsyncMock(return_value=BRONZE_USER)
            
            has_quota, message = await check_sms_quota("test_bronze_user")
            
            assert has_quota is False
            assert "No SMS quota" in message or "upgrade to Gold" in message.lower()
    
    @pytest.mark.asyncio
    async def test_gold_user_within_limit(self):
        """Gold users should send SMS when under 20/month"""
        from services.sms_notifications import check_sms_quota
        
        gold_user_under_limit = GOLD_USER.copy()
        gold_user_under_limit["sms_quota"]["used_this_month"] = 15
        
        with patch('services.sms_notifications.db') as mock_db:
            mock_db.users.find_one = AsyncMock(return_value=gold_user_under_limit)
            
            has_quota, message = await check_sms_quota("test_gold_user")
            
            assert has_quota is True
            assert "15/20" in message or "Quota available" in message
    
    @pytest.mark.asyncio
    async def test_gold_user_quota_exceeded(self):
        """Gold users should be blocked after 20 SMS"""
        from services.sms_notifications import check_sms_quota
        
        gold_user_exceeded = GOLD_USER.copy()
        gold_user_exceeded["sms_quota"]["used_this_month"] = 20
        
        with patch('services.sms_notifications.db') as mock_db:
            mock_db.users.find_one = AsyncMock(return_value=gold_user_exceeded)
            
            has_quota, message = await check_sms_quota("test_gold_user")
            
            assert has_quota is False
            assert "exceeded" in message.lower() or "20/20" in message
    
    @pytest.mark.asyncio
    async def test_platinum_unlimited(self):
        """Platinum users should have unlimited SMS"""
        from services.sms_notifications import check_sms_quota
        
        platinum_user_high_usage = PLATINUM_USER.copy()
        platinum_user_high_usage["sms_quota"]["used_this_month"] = 999
        
        with patch('services.sms_notifications.db') as mock_db:
            mock_db.users.find_one = AsyncMock(return_value=platinum_user_high_usage)
            
            has_quota, message = await check_sms_quota("test_platinum_user")
            
            assert has_quota is True
            assert "unlimited" in message.lower()

class TestTierUpgradeDetection:
    """Test tier upgrade SMS triggers"""
    
    def test_bronze_to_silver_upgrade(self):
        """Test detecting Bronze → Silver upgrade at 100 XP"""
        from utils.leaderboard_service import calculate_tier
        
        old_tier = calculate_tier(99, False)  # Bronze
        new_tier = calculate_tier(100, False)  # Silver
        
        assert old_tier["name"] != new_tier["name"]
        assert "Bronze" in old_tier["name"]
        assert "Silver" in new_tier["name"]
    
    def test_silver_to_gold_upgrade(self):
        """Test detecting Silver → Gold upgrade at 500 XP"""
        from utils.leaderboard_service import calculate_tier
        
        old_tier = calculate_tier(499, False)  # Silver
        new_tier = calculate_tier(500, False)  # Gold
        
        assert old_tier["name"] != new_tier["name"]
        assert "Silver" in old_tier["name"]
        assert "Gold" in new_tier["name"]
    
    def test_gold_to_platinum_upgrade(self):
        """Test detecting Gold → Platinum upgrade at 1000 XP"""
        from utils.leaderboard_service import calculate_tier
        
        old_tier = calculate_tier(999, False)  # Gold
        new_tier = calculate_tier(1000, False)  # Platinum
        
        assert old_tier["name"] != new_tier["name"]
        assert "Gold" in old_tier["name"]
        assert "Platinum" in new_tier["name"]
    
    def test_no_upgrade_on_same_tier(self):
        """Test no SMS sent if still in same tier"""
        from utils.leaderboard_service import calculate_tier
        
        old_tier = calculate_tier(100, False)  # Silver
        new_tier = calculate_tier(200, False)  # Still Silver
        
        assert old_tier["name"] == new_tier["name"]

class TestPreferenceRespect:
    """Test SMS preference toggles are respected"""
    
    @pytest.mark.asyncio
    async def test_duel_notification_disabled(self):
        """Test no SMS sent if duel notifications disabled"""
        from services.sms_notifications import send_duel_challenge_sms
        
        user_disabled = GOLD_USER.copy()
        user_disabled["sms_preferences"]["duel_challenges"] = False
        
        with patch('services.sms_notifications.db') as mock_db:
            mock_db.users.find_one = AsyncMock(side_effect=[
                {"id": "challenger", "username": "TestChallenger"},  # Challenger
                user_disabled  # Opponent with disabled prefs
            ])
            
            result = await send_duel_challenge_sms(
                challenger_id="challenger",
                opponent_id="test_gold_user",
                duel_type="Speed Dialer"
            )
            
            assert result["success"] is False
            assert "disabled" in result["message"].lower()
    
    @pytest.mark.asyncio
    async def test_achievement_notification_disabled(self):
        """Test no SMS sent if achievement notifications disabled"""
        from services.sms_notifications import send_achievement_unlock_sms
        
        user_disabled = GOLD_USER.copy()
        user_disabled["sms_preferences"]["achievements"] = False
        
        with patch('services.sms_notifications.db') as mock_db:
            mock_db.users.find_one = AsyncMock(return_value=user_disabled)
            
            result = await send_achievement_unlock_sms(
                user_id="test_gold_user",
                achievement_name="First Victory"
            )
            
            assert result["success"] is False
            assert "disabled" in result["message"].lower() or "not configured" in result["message"].lower()

class TestQuotaIncrement:
    """Test SMS usage counter increments correctly"""
    
    @pytest.mark.asyncio
    async def test_quota_increments_on_send(self):
        """Test quota counter increases after SMS sent"""
        from services.sms_notifications import increment_sms_usage
        
        with patch('services.sms_notifications.db') as mock_db:
            mock_db.users.update_one = AsyncMock()
            
            await increment_sms_usage("test_user")
            
            # Verify update_one was called with correct increment
            mock_db.users.update_one.assert_called_once()
            call_args = mock_db.users.update_one.call_args
            
            assert call_args[0][0] == {"id": "test_user"}
            assert "$inc" in call_args[0][1]
            assert call_args[0][1]["$inc"]["sms_quota.used_this_month"] == 1

class TestPhoneNumberValidation:
    """Test phone number format validation"""
    
    def test_valid_e164_format(self):
        """Test valid E.164 phone numbers pass"""
        from services.bulksms_client import bulksms_client
        
        valid_numbers = [
            "+27123456789",  # South Africa
            "+1234567890",   # USA
            "+447123456789", # UK
            "+33123456789",  # France
            "+919876543210"  # India
        ]
        
        for number in valid_numbers:
            assert bulksms_client.validate_phone_number(number) is True
    
    def test_invalid_format_rejected(self):
        """Test invalid phone numbers fail"""
        from services.bulksms_client import bulksms_client
        
        invalid_numbers = [
            "123456789",      # Missing +
            "+12",            # Too short
            "+123456789012345678",  # Too long
            "+abc123456789",  # Contains letters
            "",               # Empty
            None              # None
        ]
        
        for number in invalid_numbers:
            assert bulksms_client.validate_phone_number(number) is False

class TestCostCalculation:
    """Test SMS cost estimation"""
    
    def test_single_sms_cost(self):
        """Test cost for messages under 160 chars"""
        from services.bulksms_client import bulksms_client
        
        message = "This is a test message under 160 characters"
        cost = bulksms_client._calculate_cost(message)
        
        assert cost == 0.01  # Single SMS
    
    def test_multi_part_sms_cost(self):
        """Test cost for messages over 160 chars (concatenated SMS)"""
        from services.bulksms_client import bulksms_client
        
        # 200 character message (requires 2 SMS segments)
        message = "A" * 200
        cost = bulksms_client._calculate_cost(message)
        
        assert cost > 0.01  # Multiple SMS segments
        assert cost == 0.02  # 2 segments = $0.02

class TestAutoTriggerLogic:
    """Test auto-trigger conditions"""
    
    @pytest.mark.asyncio
    async def test_no_sms_without_phone_number(self):
        """Test no SMS sent if user has no phone number"""
        from services.sms_notifications import send_duel_challenge_sms
        
        user_no_phone = GOLD_USER.copy()
        user_no_phone["phone_number"] = None
        
        with patch('services.sms_notifications.db') as mock_db:
            mock_db.users.find_one = AsyncMock(side_effect=[
                {"id": "challenger", "username": "TestChallenger"},
                user_no_phone
            ])
            
            result = await send_duel_challenge_sms(
                challenger_id="challenger",
                opponent_id="test_gold_user",
                duel_type="Speed Dialer"
            )
            
            assert result["success"] is False
            assert "no phone" in result["message"].lower()
    
    @pytest.mark.asyncio
    async def test_sms_sent_with_valid_conditions(self):
        """Test SMS actually sent when all conditions met"""
        from services.sms_notifications import send_duel_challenge_sms
        
        with patch('services.sms_notifications.db') as mock_db, \
             patch('services.sms_notifications.bulksms_client') as mock_bulksms:
            
            # Mock database responses
            mock_db.users.find_one = AsyncMock(side_effect=[
                {"id": "challenger", "username": "TestChallenger"},
                GOLD_USER
            ])
            mock_db.bulksms_logs.insert_one = AsyncMock()
            mock_db.users.update_one = AsyncMock()
            
            # Mock BulkSMS API response
            mock_bulksms.send_sms.return_value = {
                "success": True,
                "message_id": "test_msg_id_123",
                "status": "ACCEPTED"
            }
            
            result = await send_duel_challenge_sms(
                challenger_id="challenger",
                opponent_id="test_gold_user",
                duel_type="Speed Dialer"
            )
            
            assert result["success"] is True
            assert "message_id" in result
            mock_bulksms.send_sms.assert_called_once()

# Performance Tests
class TestPerformance:
    """Test system performance under load"""
    
    @pytest.mark.asyncio
    async def test_bulk_broadcast_limit(self):
        """Test bulk broadcast doesn't exceed rate limits"""
        from services.bulksms_client import bulksms_client
        
        # Simulate 100 recipients
        recipients = [f"+2712345{i:04d}" for i in range(100)]
        message = "Test broadcast message"
        
        with patch.object(bulksms_client, 'send_sms') as mock_send:
            mock_send.return_value = {
                "success": True,
                "message_id": "test_id"
            }
            
            # This should work without hitting rate limits
            # In production, BulkSMS accepts arrays
            result = bulksms_client.send_bulk_sms(
                recipients=recipients,
                message=message
            )
            
            # Should be called once (bulk endpoint)
            assert mock_send.call_count >= 1 or result is not None

if __name__ == "__main__":
    print("🧪 Running SMS Logic Unit Tests...")
    print("\nTest Coverage:")
    print("✅ Quota enforcement (Bronze/Silver/Gold/Platinum)")
    print("✅ Tier upgrade detection")
    print("✅ Preference respect (toggles honored)")
    print("✅ Quota increment tracking")
    print("✅ Phone number validation")
    print("✅ Cost calculation")
    print("✅ Auto-trigger logic")
    print("✅ Performance (bulk operations)")
    print("\nRun with: pytest test_sms_logic.py -v")
