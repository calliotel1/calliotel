#!/usr/bin/env python3
"""
🧹 DIGITAL COLOSSEUM - DATABASE CLEANUP & OPTIMIZATION
Purpose: Remove test data, optimize indexes, prepare for production launch
Run this ONCE before going live with real users
"""

import os
import sys
from pymongo import MongoClient, ASCENDING, DESCENDING
from datetime import datetime

# ANSI Color codes
BLUE = '\033[0;34m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
RED = '\033[0;31m'
NC = '\033[0m'  # No Color

def print_header(text):
    print(f"{BLUE}{text}{NC}")

def print_success(text):
    print(f"{GREEN}✅ {text}{NC}")

def print_warning(text):
    print(f"{YELLOW}⚠️  {text}{NC}")

def print_error(text):
    print(f"{RED}❌ {text}{NC}")

def main():
    print_header("🧹 DIGITAL COLOSSEUM - DATABASE SANITIZATION")
    print_header("="*50)
    print()
    
    # Get MongoDB connection string
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
    db_name = os.getenv('DB_NAME', 'calliotel_production')
    
    print(f"Connecting to: {mongo_url}")
    print(f"Database: {db_name}")
    print()
    
    try:
        client = MongoClient(mongo_url)
        db = client[db_name]
        
        # Test connection
        client.server_info()
        print_success("Database connection established")
        print()
        
    except Exception as e:
        print_error(f"Failed to connect to MongoDB: {e}")
        sys.exit(1)
    
    # PHASE 1: Data Cleanup
    print_header("[PHASE 1] DATA CLEANUP")
    print()
    
    # Ask for confirmation
    print_warning("This will DELETE test data. Production admin accounts will be preserved.")
    confirmation = input(f"{YELLOW}Type 'DELETE' to confirm: {NC}")
    
    if confirmation != "DELETE":
        print_error("Cleanup aborted")
        sys.exit(0)
    
    # Preserve admin emails (edit this list)
    ADMIN_EMAILS = [
        "admin@calliotel.com",
        "bigboss@calliotel.com",
        # Add your production admin emails here
    ]
    
    print(f"Preserving admin accounts: {ADMIN_EMAILS}")
    print()
    
    # Delete test users (preserve admins)
    users_deleted = db.users.delete_many({
        "email": {"$nin": ADMIN_EMAILS}
    })
    print_success(f"Deleted {users_deleted.deleted_count} test users")
    
    # Clear game history
    duels_deleted = db.duels.delete_many({})
    print_success(f"Deleted {duels_deleted.deleted_count} duel records")
    
    speed_dialer_deleted = db.speed_dialer_sessions.delete_many({})
    print_success(f"Deleted {speed_dialer_deleted.deleted_count} Speed Dialer sessions")
    
    phish_finder_deleted = db.phish_finder_sessions.delete_many({})
    print_success(f"Deleted {phish_finder_deleted.deleted_count} Phish Finder sessions")
    
    coop_deleted = db.coop_stack_sessions.delete_many({})
    print_success(f"Deleted {coop_deleted.deleted_count} Co-Op Stack sessions")
    
    # Clear chat messages
    messages_deleted = db.global_square_messages.delete_many({})
    print_success(f"Deleted {messages_deleted.deleted_count} Global Square messages")
    
    # Clear achievements (will be re-earned)
    achievements_deleted = db.achievements.delete_many({})
    print_success(f"Deleted {achievements_deleted.deleted_count} achievement records")
    
    print()
    
    # PHASE 2: Index Optimization
    print_header("[PHASE 2] INDEX OPTIMIZATION")
    print()
    
    # Users collection indexes
    print("Creating indexes for 'users' collection...")
    db.users.create_index([("email", ASCENDING)], unique=True)
    db.users.create_index([("username", ASCENDING)], unique=True)
    db.users.create_index([("tier", DESCENDING), ("total_xp", DESCENDING)])
    db.users.create_index([("created_at", DESCENDING)])
    print_success("Users indexes created")
    
    # Duels collection indexes
    print("Creating indexes for 'duels' collection...")
    db.duels.create_index([("challenger_id", ASCENDING), ("created_at", DESCENDING)])
    db.duels.create_index([("opponent_id", ASCENDING), ("created_at", DESCENDING)])
    db.duels.create_index([("status", ASCENDING), ("created_at", DESCENDING)])
    db.duels.create_index([("winner_id", ASCENDING)])
    print_success("Duels indexes created")
    
    # Global Square messages indexes
    print("Creating indexes for 'global_square_messages' collection...")
    db.global_square_messages.create_index([("timestamp", DESCENDING)])
    db.global_square_messages.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
    print_success("Global Square indexes created")
    
    # Achievements indexes
    print("Creating indexes for 'achievements' collection...")
    db.achievements.create_index([("user_id", ASCENDING), ("achievement_id", ASCENDING)], unique=True)
    db.achievements.create_index([("unlocked_at", DESCENDING)])
    print_success("Achievements indexes created")
    
    # Game sessions indexes
    print("Creating indexes for game sessions...")
    db.speed_dialer_sessions.create_index([("user_id", ASCENDING), ("completed_at", DESCENDING)])
    db.phish_finder_sessions.create_index([("user_id", ASCENDING), ("completed_at", DESCENDING)])
    db.coop_stack_sessions.create_index([("session_id", ASCENDING)], unique=True)
    db.coop_stack_sessions.create_index([("created_at", DESCENDING)])
    print_success("Game session indexes created")
    
    print()
    
    # PHASE 3: Database Statistics
    print_header("[PHASE 3] DATABASE HEALTH CHECK")
    print()
    
    stats = db.command("dbStats")
    
    print(f"{BLUE}📊 Database Statistics:{NC}")
    print(f"  Collections: {stats['collections']}")
    print(f"  Data Size: {stats['dataSize'] / 1024 / 1024:.2f} MB")
    print(f"  Storage Size: {stats['storageSize'] / 1024 / 1024:.2f} MB")
    print(f"  Indexes: {stats['indexes']}")
    print(f"  Index Size: {stats['indexSize'] / 1024 / 1024:.2f} MB")
    print()
    
    # Collection counts
    print(f"{BLUE}📋 Collection Counts:{NC}")
    collections = ['users', 'duels', 'global_square_messages', 'achievements', 'speed_dialer_sessions', 'phish_finder_sessions', 'coop_stack_sessions']
    for coll in collections:
        count = db[coll].count_documents({})
        print(f"  {coll}: {count}")
    print()
    
    # Index verification
    print(f"{BLUE}🔍 Index Verification:{NC}")
    for coll in collections:
        indexes = db[coll].list_indexes()
        index_names = [idx['name'] for idx in indexes]
        print(f"  {coll}: {len(index_names)} indexes - {', '.join(index_names)}")
    print()
    
    print_success("🎯 DATABASE SANITIZATION COMPLETE!")
    print()
    print(f"{BLUE}Next steps:{NC}")
    print(f"  1. Verify admin account login")
    print(f"  2. Run load testing: ./websocket_stress_test.sh")
    print(f"  3. Deploy to production: ./deploy_to_digitalocean.sh")
    print()
    
    client.close()

if __name__ == "__main__":
    main()
