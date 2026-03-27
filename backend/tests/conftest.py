"""
Test Configuration - Digital Colosseum
Sets up isolated test environment with mocked credentials
"""
import os
import sys
import pytest
from unittest.mock import Mock

# Add backend to path
sys.path.insert(0, '/app/backend')

# 🎯 HARD-MOCK MONGO_URL for test isolation
# This prevents leaderboard_service from failing on import
os.environ['MONGO_URL'] = 'mongodb://localhost:27017/test_colosseum'
os.environ['DB_NAME'] = 'test_colosseum'

# Mock BulkSMS credentials (don't burn real credits in tests)
os.environ['BULKSMS_TOKEN_ID'] = 'test_token_id'
os.environ['BULKSMS_TOKEN_SECRET'] = 'test_secret'

@pytest.fixture
def mock_db():
    """Provides a mock MongoDB instance for tests"""
    return Mock()

@pytest.fixture
def mock_bulksms_client():
    """Provides a mock BulkSMS client for tests"""
    return Mock()
