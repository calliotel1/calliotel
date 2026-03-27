"""
Leaderboard Service - Hall of Legends
Handles leaderboard calculation, rank tracking, snapshots, and game-specific filtering
"""

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
import logging

logger = logging.getLogger(__name__)

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def get_overall_leaderboard(limit: int = 100):
    """
    Get overall leaderboard ranked by total XP.
    Includes rank_change_24h from historical snapshots.
    Tie-breaker: XP → Win Rate → Account Age (oldest wins)
    """
    try:
        # Get all users with gamification profiles
        pipeline = [
            # Join users with gamification profiles
            {
                "$lookup": {
                    "from": "gamification_profiles",
                    "localField": "_id",
                    "foreignField": "user_id",
                    "as": "profile"
                }
            },
            # Unwind profile array
            {
                "$unwind": {
                    "path": "$profile",
                    "preserveNullAndEmptyArrays": False
                }
            },
            # Get duel stats for win rate
            {
                "$lookup": {
                    "from": "duels",
                    "let": {"user_id": "$_id"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [
                                        {"$eq": ["$status", "completed"]},
                                        {"$eq": ["$winner_id", "$$user_id"]}
                                    ]
                                }
                            }
                        },
                        {"$count": "wins"}
                    ],
                    "as": "duel_wins"
                }
            },
            {
                "$lookup": {
                    "from": "duels",
                    "let": {"user_id": "$_id"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [
                                        {"$eq": ["$status", "completed"]},
                                        {
                                            "$or": [
                                                {"$eq": ["$challenger_id", "$$user_id"]},
                                                {"$eq": ["$opponent_id", "$$user_id"]}
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        {"$count": "total"}
                    ],
                    "as": "duel_total"
                }
            },
            # Calculate win rate
            {
                "$addFields": {
                    "wins": {
                        "$ifNull": [
                            {"$arrayElemAt": ["$duel_wins.wins", 0]},
                            0
                        ]
                    },
                    "total_duels": {
                        "$ifNull": [
                            {"$arrayElemAt": ["$duel_total.total", 0]},
                            0
                        ]
                    }
                }
            },
            {
                "$addFields": {
                    "win_rate": {
                        "$cond": [
                            {"$gt": ["$total_duels", 0]},
                            {
                                "$multiply": [
                                    {"$divide": ["$wins", "$total_duels"]},
                                    100
                                ]
                            },
                            0
                        ]
                    }
                }
            },
            # Project fields
            {
                "$project": {
                    "_id": 0,
                    "user_id": "$_id",
                    "email": 1,
                    "full_name": 1,
                    "profile_picture": 1,
                    "is_admin": 1,
                    "created_at": 1,
                    "total_xp": "$profile.total_points",
                    "level": "$profile.level",
                    "wins": 1,
                    "total_duels": 1,
                    "win_rate": 1
                }
            },
            # Sort: XP desc, Win Rate desc, Account Age asc (oldest first)
            {
                "$sort": {
                    "total_xp": -1,
                    "win_rate": -1,
                    "created_at": 1
                }
            },
            # Limit results
            {"$limit": limit}
        ]
        
        leaderboard = await db.users.aggregate(pipeline).to_list(limit)
        
        # Get 24h rank changes
        await add_rank_changes(leaderboard)
        
        # Add rank numbers and tier info
        for idx, entry in enumerate(leaderboard):
            entry["rank"] = idx + 1
            entry["tier"] = calculate_tier(entry["total_xp"], entry.get("is_admin", False))
        
        return leaderboard
        
    except Exception as e:
        logger.error(f"Error getting overall leaderboard: {str(e)}")
        raise

async def get_game_leaderboard(game_type: str, limit: int = 100):
    """
    Get leaderboard for specific game type.
    game_type: 'duel', 'speed_dialer', 'phish_finder'
    """
    try:
        if game_type == "duel":
            # Duel-specific: Rank by duel wins
            pipeline = [
                {
                    "$lookup": {
                        "from": "duels",
                        "let": {"user_id": "$_id"},
                        "pipeline": [
                            {
                                "$match": {
                                    "$expr": {
                                        "$and": [
                                            {"$eq": ["$status", "completed"]},
                                            {"$eq": ["$winner_id", "$$user_id"]}
                                        ]
                                    }
                                }
                            }
                        ],
                        "as": "duel_wins"
                    }
                },
                {
                    "$addFields": {
                        "game_score": {"$size": "$duel_wins"}
                    }
                },
                {
                    "$match": {
                        "game_score": {"$gt": 0}
                    }
                },
                {
                    "$lookup": {
                        "from": "gamification_profiles",
                        "localField": "_id",
                        "foreignField": "user_id",
                        "as": "profile"
                    }
                },
                {
                    "$unwind": {
                        "path": "$profile",
                        "preserveNullAndEmptyArrays": False
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "user_id": "$_id",
                        "email": 1,
                        "full_name": 1,
                        "profile_picture": 1,
                        "is_admin": 1,
                        "created_at": 1,
                        "total_xp": "$profile.total_points",
                        "level": "$profile.level",
                        "game_score": 1
                    }
                },
                {
                    "$sort": {
                        "game_score": -1,
                        "total_xp": -1,
                        "created_at": 1
                    }
                },
                {"$limit": limit}
            ]
        else:
            # For other games, use achievement-based scoring
            # (Speed Dialer, Phish-Finder achievements)
            pipeline = [
                {
                    "$lookup": {
                        "from": "gamification_profiles",
                        "localField": "_id",
                        "foreignField": "user_id",
                        "as": "profile"
                    }
                },
                {
                    "$unwind": {
                        "path": "$profile",
                        "preserveNullAndEmptyArrays": False
                    }
                },
                {
                    "$addFields": {
                        "game_achievements": {
                            "$filter": {
                                "input": "$profile.achievements",
                                "as": "ach",
                                "cond": {
                                    "$regexMatch": {
                                        "input": "$$ach.id",
                                        "regex": f"^{game_type}_"
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    "$addFields": {
                        "game_score": {"$size": "$game_achievements"}
                    }
                },
                {
                    "$match": {
                        "game_score": {"$gt": 0}
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "user_id": "$_id",
                        "email": 1,
                        "full_name": 1,
                        "profile_picture": 1,
                        "is_admin": 1,
                        "created_at": 1,
                        "total_xp": "$profile.total_points",
                        "level": "$profile.level",
                        "game_score": 1
                    }
                },
                {
                    "$sort": {
                        "game_score": -1,
                        "total_xp": -1,
                        "created_at": 1
                    }
                },
                {"$limit": limit}
            ]
        
        leaderboard = await db.users.aggregate(pipeline).to_list(limit)
        
        # Add rank changes and tier info
        await add_rank_changes(leaderboard)
        
        for idx, entry in enumerate(leaderboard):
            entry["rank"] = idx + 1
            entry["tier"] = calculate_tier(entry["total_xp"], entry.get("is_admin", False))
        
        return leaderboard
        
    except Exception as e:
        logger.error(f"Error getting {game_type} leaderboard: {str(e)}")
        raise

async def add_rank_changes(leaderboard: list):
    """
    Add rank_change_24h to each leaderboard entry.
    Compares current rank to rank from yesterday's 00:00 UTC snapshot.
    """
    try:
        # Get yesterday's 00:00 UTC timestamp
        now = datetime.now(timezone.utc)
        yesterday_midnight = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc) - timedelta(days=1)
        
        # Get latest snapshot from yesterday
        snapshot = await db.leaderboard_snapshots.find_one(
            {"snapshot_time": {"$gte": yesterday_midnight.isoformat()}},
            sort=[("snapshot_time", -1)]
        )
        
        if not snapshot:
            # No historical data, mark all as new
            for entry in leaderboard:
                entry["rank_change_24h"] = "NEW"
            return
        
        # Create lookup map: user_id → old_rank
        old_ranks = {item["user_id"]: item["rank"] for item in snapshot.get("data", [])}
        
        # Calculate rank changes
        for entry in leaderboard:
            user_id = entry["user_id"]
            current_rank = entry.get("rank", 999)
            old_rank = old_ranks.get(user_id)
            
            if old_rank is None:
                entry["rank_change_24h"] = "NEW"
            else:
                change = old_rank - current_rank  # Positive = moved up
                if change > 0:
                    entry["rank_change_24h"] = f"+{change}"
                elif change < 0:
                    entry["rank_change_24h"] = f"{change}"
                else:
                    entry["rank_change_24h"] = "STABLE"
        
    except Exception as e:
        logger.error(f"Error adding rank changes: {str(e)}")
        # Don't fail the whole request, just mark as unavailable
        for entry in leaderboard:
            entry["rank_change_24h"] = "N/A"

async def save_leaderboard_snapshot():
    """
    Save current leaderboard state as snapshot.
    Should be called daily at 00:00 UTC via cron job.
    """
    try:
        snapshot_time = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Get current leaderboard
        leaderboard = await get_overall_leaderboard(limit=100)
        
        # Save snapshot
        await db.leaderboard_snapshots.insert_one({
            "snapshot_time": snapshot_time.isoformat(),
            "data": leaderboard,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"Leaderboard snapshot saved for {snapshot_time.isoformat()}")
        
        # Clean up old snapshots (keep last 30 days)
        cutoff = snapshot_time - timedelta(days=30)
        await db.leaderboard_snapshots.delete_many({
            "snapshot_time": {"$lt": cutoff.isoformat()}
        })
        
    except Exception as e:
        logger.error(f"Error saving leaderboard snapshot: {str(e)}")
        raise

def calculate_tier(total_xp: int, is_admin: bool = False) -> dict:
    """Calculate tier badge based on total XP"""
    if is_admin:
        return {
            "name": "The Architect",
            "color": "linear-gradient(45deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
            "emoji": "👑"
        }
    elif total_xp < 100:
        return {"name": "Bronze Rookie", "color": "#CD7F32", "emoji": "🟤"}
    elif total_xp < 500:
        return {"name": "Silver Challenger", "color": "#C0C0C0", "emoji": "⚪"}
    elif total_xp < 1000:
        return {"name": "Gold Warrior", "color": "#FFD700", "emoji": "🟡"}
    elif total_xp < 2500:
        return {"name": "Platinum Elite", "color": "#E5E4E2", "emoji": "🔵"}
    else:
        return {"name": "Divine Legend", "color": "#A855F7", "emoji": "🟣"}
