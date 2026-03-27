"""
Speed Dialer Game API
Solo speed-typing game where users race to type phone numbers
Integrated with gamification system for XP rewards
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from routes.gamification import award_xp, award_achievement
from motor.motor_asyncio import AsyncIOMotorClient
import os
import random
import secrets
from uuid import uuid4

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Game Configuration
DIFFICULTIES = {
    "easy": {
        "name": "Easy",
        "base_xp": 10,
        "length": 7,
        "format": "###-####",
        "description": "7-digit local number"
    },
    "medium": {
        "name": "Medium",
        "base_xp": 25,
        "length": 10,
        "format": "(###) ###-####",
        "description": "10-digit international number"
    },
    "hard": {
        "name": "Hard",
        "base_xp": 50,
        "length": 13,
        "format": "+1 (###) ###-####",
        "description": "E.164 formatted number"
    }
}

# Speed multipliers for XP
SPEED_MULTIPLIERS = {
    5: 3.0,   # Under 5 seconds = 3x
    10: 2.0,  # Under 10 seconds = 2x
    15: 1.5,  # Under 15 seconds = 1.5x
    30: 1.0   # Under 30 seconds = 1x
}

# Chaos Mode bonus
CHAOS_MODE_MULTIPLIER = 2.0

# Pydantic Models
class GameStart(BaseModel):
    difficulty: str
    chaos_mode: bool = False

class GameSubmit(BaseModel):
    challenge_id: str
    user_input: str
    time_taken: float

class ChallengeResponse(BaseModel):
    challenge_id: str
    phone_number: str
    difficulty: str
    chaos_mode: bool
    base_xp: int
    started_at: str

class GameResult(BaseModel):
    success: bool
    correct_number: str
    time_taken: float
    xp_earned: int
    xp_total: int
    level_up: bool
    new_level: Optional[int] = None
    level_name: Optional[str] = None
    level_badge: Optional[str] = None
    speed_multiplier: float
    chaos_multiplier: float
    personal_best: bool = False

# Helper Functions
def generate_phone_number(difficulty: str) -> str:
    """Generate a random phone number based on difficulty"""
    if difficulty == "easy":
        # 7-digit: 555-1234
        return f"{random.randint(100, 999)}-{random.randint(1000, 9999)}"
    elif difficulty == "medium":
        # 10-digit: (555) 123-4567
        area_code = random.randint(200, 999)
        exchange = random.randint(200, 999)
        number = random.randint(1000, 9999)
        return f"({area_code}) {exchange}-{number}"
    else:  # hard
        # E.164: +1 (555) 123-4567
        area_code = random.randint(200, 999)
        exchange = random.randint(200, 999)
        number = random.randint(1000, 9999)
        return f"+1 ({area_code}) {exchange}-{number}"

def normalize_phone_input(input_str: str) -> str:
    """Remove all non-digit characters for comparison"""
    return ''.join(filter(str.isdigit, input_str))

def calculate_xp(difficulty: str, time_taken: float, chaos_mode: bool) -> tuple:
    """
    Calculate XP earned based on difficulty, speed, and chaos mode.
    Returns (xp_earned, speed_multiplier, chaos_multiplier)
    """
    base_xp = DIFFICULTIES[difficulty]["base_xp"]
    
    # Determine speed multiplier
    speed_mult = 1.0
    for time_threshold, multiplier in sorted(SPEED_MULTIPLIERS.items()):
        if time_taken < time_threshold:
            speed_mult = multiplier
            break
    
    # Apply chaos mode multiplier
    chaos_mult = CHAOS_MODE_MULTIPLIER if chaos_mode else 1.0
    
    # Calculate final XP
    xp_earned = int(base_xp * speed_mult * chaos_mult)
    
    return xp_earned, speed_mult, chaos_mult

async def check_speed_dialer_achievements(user_id: str):
    """Check and award Speed Dialer specific achievements"""
    try:
        # Get user's Speed Dialer stats
        attempts = await db.speed_dialer_attempts.count_documents({"user_id": user_id})
        
        # First game achievement
        if attempts == 1:
            await award_achievement(user_id, "speed_dialer_first")
        elif attempts == 10:
            await award_achievement(user_id, "speed_dialer_10")
        elif attempts == 50:
            await award_achievement(user_id, "speed_dialer_50")
        elif attempts == 100:
            await award_achievement(user_id, "speed_dialer_100")
        
        # Check for speed demon (under 3 seconds on hard)
        speed_demon = await db.speed_dialer_attempts.find_one({
            "user_id": user_id,
            "difficulty": "hard",
            "time_taken": {"$lt": 3.0}
        })
        
        if speed_demon:
            await award_achievement(user_id, "speed_demon")
        
    except Exception as e:
        logger.error(f"Error checking Speed Dialer achievements: {str(e)}")

# API Endpoints
@router.post("/start", response_model=ChallengeResponse)
async def start_game(
    game_start: GameStart,
    current_user = Depends(get_current_user)
):
    """
    Start a new Speed Dialer challenge.
    Generates a phone number and returns challenge ID.
    """
    try:
        difficulty = game_start.difficulty.lower()
        
        if difficulty not in DIFFICULTIES:
            raise HTTPException(status_code=400, detail="Invalid difficulty. Choose: easy, medium, or hard")
        
        # Generate phone number
        phone_number = generate_phone_number(difficulty)
        
        # Create challenge
        challenge = {
            "id": str(uuid4()),
            "user_id": current_user["_id"],
            "phone_number": phone_number,
            "difficulty": difficulty,
            "chaos_mode": game_start.chaos_mode,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "completed": False
        }
        
        await db.speed_dialer_challenges.insert_one(challenge)
        
        logger.info(f"Speed Dialer challenge started: {challenge['id']} by user {current_user['_id']}")
        
        return ChallengeResponse(
            challenge_id=challenge["id"],
            phone_number=phone_number,
            difficulty=difficulty,
            chaos_mode=game_start.chaos_mode,
            base_xp=DIFFICULTIES[difficulty]["base_xp"],
            started_at=challenge["started_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting Speed Dialer game: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start game")

@router.post("/submit", response_model=GameResult)
async def submit_game(
    game_submit: GameSubmit,
    current_user = Depends(get_current_user)
):
    """
    Submit a completed Speed Dialer challenge.
    Validates input, checks for cheating, and awards XP.
    """
    try:
        user_id = current_user["_id"]
        
        # Get challenge
        challenge = await db.speed_dialer_challenges.find_one({
            "id": game_submit.challenge_id,
            "user_id": user_id
        })
        
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        
        if challenge.get("completed"):
            raise HTTPException(status_code=400, detail="Challenge already completed")
        
        # Anti-cheat: Check if time is impossibly fast
        if game_submit.time_taken < 0.5:
            logger.warning(f"Possible cheating detected: User {user_id} submitted time {game_submit.time_taken}s")
            raise HTTPException(status_code=400, detail="Invalid completion time")
        
        # Anti-cheat: Check if time matches server-side timestamp
        started_at = datetime.fromisoformat(challenge["started_at"])
        time_diff = (datetime.now(timezone.utc) - started_at).total_seconds()
        
        # Allow 10 second grace period for network latency and testing
        if game_submit.time_taken > time_diff + 10:
            logger.warning(f"Time mismatch detected: Reported {game_submit.time_taken}s vs actual {time_diff}s")
            raise HTTPException(status_code=400, detail="Time validation failed")
        
        # Normalize inputs for comparison (remove formatting)
        correct_digits = normalize_phone_input(challenge["phone_number"])
        user_digits = normalize_phone_input(game_submit.user_input)
        
        success = correct_digits == user_digits
        
        if not success:
            # Mark challenge as completed but failed
            await db.speed_dialer_challenges.update_one(
                {"id": game_submit.challenge_id},
                {"$set": {"completed": True, "success": False}}
            )
            
            return GameResult(
                success=False,
                correct_number=challenge["phone_number"],
                time_taken=game_submit.time_taken,
                xp_earned=0,
                xp_total=0,
                level_up=False,
                speed_multiplier=0.0,
                chaos_multiplier=0.0
            )
        
        # Calculate XP
        xp_earned, speed_mult, chaos_mult = calculate_xp(
            challenge["difficulty"],
            game_submit.time_taken,
            challenge["chaos_mode"]
        )
        
        # Award XP through gamification system
        xp_result = await award_xp(user_id, xp_earned, "Speed Dialer victory")
        
        # Check if personal best
        personal_best = False
        best_attempt = await db.speed_dialer_attempts.find_one(
            {
                "user_id": user_id,
                "difficulty": challenge["difficulty"],
                "success": True
            },
            sort=[("time_taken", 1)]
        )
        
        if not best_attempt or game_submit.time_taken < best_attempt["time_taken"]:
            personal_best = True
        
        # Save attempt to history
        attempt = {
            "id": str(uuid4()),
            "user_id": user_id,
            "challenge_id": game_submit.challenge_id,
            "phone_number": challenge["phone_number"],
            "difficulty": challenge["difficulty"],
            "chaos_mode": challenge["chaos_mode"],
            "time_taken": game_submit.time_taken,
            "xp_earned": xp_earned,
            "speed_multiplier": speed_mult,
            "chaos_multiplier": chaos_mult,
            "success": True,
            "personal_best": personal_best,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.speed_dialer_attempts.insert_one(attempt)
        
        # Mark challenge as completed
        await db.speed_dialer_challenges.update_one(
            {"id": game_submit.challenge_id},
            {"$set": {"completed": True, "success": True}}
        )
        
        # Check for achievements
        await check_speed_dialer_achievements(user_id)
        
        logger.info(f"Speed Dialer completed: User {user_id} earned {xp_earned} XP")
        
        return GameResult(
            success=True,
            correct_number=challenge["phone_number"],
            time_taken=game_submit.time_taken,
            xp_earned=xp_earned,
            xp_total=xp_result["new_total"],
            level_up=xp_result.get("level_up", False),
            new_level=xp_result.get("new_level"),
            level_name=xp_result.get("level_name"),
            level_badge=xp_result.get("level_badge"),
            speed_multiplier=speed_mult,
            chaos_multiplier=chaos_mult,
            personal_best=personal_best
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting Speed Dialer game: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit game")

@router.get("/stats")
async def get_stats(current_user = Depends(get_current_user)):
    """
    Get user's personal Speed Dialer statistics.
    """
    try:
        user_id = current_user["_id"]
        
        # Get all successful attempts
        attempts = await db.speed_dialer_attempts.find(
            {"user_id": user_id, "success": True},
            {"_id": 0}
        ).to_list(1000)
        
        if not attempts:
            return {
                "total_games": 0,
                "total_xp_earned": 0,
                "best_times": {},
                "average_times": {},
                "chaos_mode_games": 0
            }
        
        # Calculate stats
        total_games = len(attempts)
        total_xp = sum(a["xp_earned"] for a in attempts)
        chaos_games = sum(1 for a in attempts if a.get("chaos_mode", False))
        
        # Best times by difficulty
        best_times = {}
        average_times = {}
        
        for difficulty in ["easy", "medium", "hard"]:
            diff_attempts = [a for a in attempts if a["difficulty"] == difficulty]
            
            if diff_attempts:
                times = [a["time_taken"] for a in diff_attempts]
                best_times[difficulty] = min(times)
                average_times[difficulty] = sum(times) / len(times)
        
        return {
            "total_games": total_games,
            "total_xp_earned": total_xp,
            "best_times": best_times,
            "average_times": average_times,
            "chaos_mode_games": chaos_games,
            "recent_attempts": attempts[-10:]  # Last 10 attempts
        }
        
    except Exception as e:
        logger.error(f"Error getting Speed Dialer stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get stats")

@router.get("/leaderboard")
async def get_leaderboard(
    difficulty: str = "all",
    limit: int = 50
):
    """
    Get global Speed Dialer leaderboard.
    """
    try:
        # Validate difficulty
        if difficulty != "all" and difficulty not in DIFFICULTIES:
            raise HTTPException(status_code=400, detail="Invalid difficulty")
        
        # Build match filter
        match_filter = {"success": True}
        if difficulty != "all":
            match_filter["difficulty"] = difficulty
        
        # Get top times
        pipeline = [
            {"$match": match_filter},
            {
                "$group": {
                    "_id": "$user_id",
                    "best_time": {"$min": "$time_taken"},
                    "total_games": {"$sum": 1},
                    "total_xp": {"$sum": "$xp_earned"}
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "_id",
                    "foreignField": "_id",
                    "as": "user"
                }
            },
            {"$unwind": "$user"},
            {
                "$project": {
                    "_id": 0,
                    "user_id": "$_id",
                    "email": "$user.email",
                    "client_id": "$user.client_id",
                    "best_time": 1,
                    "total_games": 1,
                    "total_xp": 1
                }
            },
            {"$sort": {"best_time": 1}},
            {"$limit": limit}
        ]
        
        results = await db.speed_dialer_attempts.aggregate(pipeline).to_list(limit)
        
        # Add ranks
        leaderboard = []
        for rank, entry in enumerate(results, 1):
            leaderboard.append({
                "rank": rank,
                "email": entry["email"],
                "client_id": entry.get("client_id"),
                "best_time": round(entry["best_time"], 2),
                "total_games": entry["total_games"],
                "total_xp": entry["total_xp"]
            })
        
        return {
            "difficulty": difficulty,
            "leaderboard": leaderboard
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting Speed Dialer leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get leaderboard")
