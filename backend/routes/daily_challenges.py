"""
Daily Challenge System API Routes
Weekly challenges with automatic winner selection and prize distribution
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime, timezone, timedelta
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
from uuid import uuid4
import random

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


# Pydantic Models
class ChallengeAttempt(BaseModel):
    challenge_id: str
    answer: str


class TeamCreate(BaseModel):
    team_name: str
    team_description: Optional[str] = None


class TeamJoin(BaseModel):
    team_code: str


class TeamKick(BaseModel):
    user_id: str


class ChallengeResponse(BaseModel):
    id: str
    title: str
    description: str
    challenge_type: str
    question: str
    options: Optional[List[str]] = None
    correct_answer: str
    points: int
    difficulty: str
    active_date: str
    expires_at: str


# Challenge Types and Data
CHALLENGES = [
    # EASY CHALLENGES (10 points)
    {
        "id": "country_code_match",
        "title": "🌍 Country Code Match",
        "description": "Match the flag to its correct international calling code!",
        "challenge_type": "multiple_choice",
        "question": "Which country uses the calling code +44?",
        "options": ["🇬🇧 United Kingdom", "🇫🇷 France", "🇩🇪 Germany", "🇮🇹 Italy"],
        "correct_answer": "🇬🇧 United Kingdom",
        "points": 10,
        "difficulty": "easy"
    },
    {
        "id": "spot_the_phish",
        "title": "🎣 Spot the Phish",
        "description": "Identify the suspicious element in this message!",
        "challenge_type": "multiple_choice",
        "question": "Which part of this SMS is suspicious? 'URGENT: Your bank account is locked. Click bit.ly/bank123 to verify NOW or account will close!'",
        "options": [
            "The bit.ly shortened link",
            "The urgent tone",
            "The threat of account closure",
            "All of the above"
        ],
        "correct_answer": "All of the above",
        "points": 10,
        "difficulty": "easy"
    },
    {
        "id": "tech_trivia",
        "title": "🧠 Tech Trivia",
        "description": "Test your tech knowledge!",
        "challenge_type": "multiple_choice",
        "question": "Who sent the first SMS message in 1992?",
        "options": ["Neil Papworth", "Steve Jobs", "Bill Gates", "Tim Berners-Lee"],
        "correct_answer": "Neil Papworth",
        "points": 10,
        "difficulty": "easy"
    },
    
    # MEDIUM CHALLENGES (15 points)
    {
        "id": "emoji_cryptogram",
        "title": "🔤 Emoji Cryptogram",
        "description": "Decode the tech phrase from emojis!",
        "challenge_type": "text_input",
        "question": "Solve this tech phrase: ☁️ + 📱 + 🔐",
        "options": None,
        "correct_answer": "cloud mobile security",
        "alternative_answers": ["cloud phone security", "cloud mobile encryption", "cloud security"],
        "points": 15,
        "difficulty": "medium"
    },
    {
        "id": "gas_fee_calculator",
        "title": "💎 Gas Fee Calculator",
        "description": "Calculate your remaining crypto after transactions!",
        "challenge_type": "text_input",
        "question": "You have 0.05 ETH. Each transaction costs 0.008 ETH. After 4 transactions, how much ETH do you have left?",
        "options": None,
        "correct_answer": "0.018",
        "alternative_answers": ["0.018 ETH", "0.018ETH", ".018"],
        "points": 15,
        "difficulty": "medium"
    },
    {
        "id": "prefix_hunter",
        "title": "🗺️ Prefix Hunter",
        "description": "Test your knowledge of area codes and city locations!",
        "challenge_type": "multiple_choice",
        "question": "The area code 212 belongs to which major city?",
        "options": ["New York City", "Los Angeles", "Chicago", "Boston"],
        "correct_answer": "New York City",
        "points": 15,
        "difficulty": "medium"
    },
    
    # HARD CHALLENGES (25 points)
    {
        "id": "binary_decrypter",
        "title": "0️⃣1️⃣ Binary Decrypter",
        "description": "Convert binary to decimal - hacker style!",
        "challenge_type": "text_input",
        "question": "Convert this binary number to decimal: 11010110",
        "options": None,
        "correct_answer": "214",
        "alternative_answers": [],
        "points": 25,
        "difficulty": "hard"
    },
    {
        "id": "routing_logic",
        "title": "🔄 Routing Logic Puzzle",
        "description": "Follow the call through multiple continents!",
        "challenge_type": "multiple_choice",
        "question": "A call starts in London (+44), forwards to NYC (+1), then to Tokyo (+81), and ends in Sydney (+61). How many continents did it touch?",
        "options": ["2 continents", "3 continents", "4 continents", "5 continents"],
        "correct_answer": "4 continents",
        "points": 25,
        "difficulty": "hard"
    },
    
    # EXPERT CHALLENGES (50 points)
    {
        "id": "hidden_sim",
        "title": "🔍 Find the Hidden SIM",
        "description": "Spot the hidden element in the tech description!",
        "challenge_type": "text_input",
        "question": "In a virtual phone system, what 3-letter acronym identifies a subscriber? (Hint: Used for authentication)",
        "options": None,
        "correct_answer": "SIM",
        "alternative_answers": ["sim", "Sim"],
        "points": 50,
        "difficulty": "expert"
    },
    {
        "id": "porting_race",
        "title": "⚡ Porting Race",
        "description": "Calculate the time for number porting!",
        "challenge_type": "text_input",
        "question": "If porting a number takes 2-4 hours, and you start at 9:00 AM, what's the LATEST time it could complete? (Format: HH:MM AM/PM)",
        "options": None,
        "correct_answer": "1:00 PM",
        "alternative_answers": ["01:00 PM", "13:00", "1 PM", "1PM"],
        "points": 50,
        "difficulty": "expert"
    }
]


def get_current_challenge_index():
    """Get today's challenge index based on day of year"""
    today = datetime.now(timezone.utc)
    day_of_year = today.timetuple().tm_yday
    return day_of_year % len(CHALLENGES)


def get_current_week_id():
    """Get current week identifier (year-week format)"""
    today = datetime.now(timezone.utc)
    # ISO week date: week starts on Monday
    year, week, _ = today.isocalendar()
    return f"{year}-W{week:02d}"


def get_current_month_id():
    """Get current month identifier (year-month format)"""
    today = datetime.now(timezone.utc)
    return f"{today.year}-{today.month:02d}"


async def update_user_streak(user_id: str, today_str: str):
    """Update user's challenge streak and calculate bonuses"""
    try:
        user = await db.users.find_one({"_id": user_id})
        
        # Get current streak data
        streak_data = user.get("challenge_streak", {
            "current_streak": 0,
            "longest_streak": 0,
            "last_attempt_date": None
        })
        
        last_date_str = streak_data.get("last_attempt_date")
        current_streak = streak_data.get("current_streak", 0)
        longest_streak = streak_data.get("longest_streak", 0)
        
        # Check if this is consecutive day
        if last_date_str:
            last_date = datetime.fromisoformat(last_date_str)
            today = datetime.fromisoformat(today_str)
            days_diff = (today - last_date).days
            
            if days_diff == 1:
                # Consecutive day - increment streak
                current_streak += 1
            elif days_diff == 0:
                # Same day - keep streak
                pass
            else:
                # Streak broken - reset
                current_streak = 1
        else:
            # First attempt ever
            current_streak = 1
        
        # Update longest streak
        if current_streak > longest_streak:
            longest_streak = current_streak
        
        # Calculate bonuses
        bonus_points = 0
        cash_reward = 0
        
        # Streak milestones
        if current_streak == 3:
            bonus_points = 5
        elif current_streak == 7:
            bonus_points = 20
            cash_reward = 0.50
            # Add cash to wallet
            await db.wallets.update_one(
                {"user_id": user_id},
                {"$inc": {"balance": cash_reward}}
            )
            await db.wallet_transactions.insert_one({
                "user_id": user_id,
                "type": "streak_bonus",
                "amount": cash_reward,
                "description": "7-Day Challenge Streak Bonus",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        elif current_streak == 30:
            bonus_points = 100
            cash_reward = 5.00
            # Add cash to wallet
            await db.wallets.update_one(
                {"user_id": user_id},
                {"$inc": {"balance": cash_reward}}
            )
            await db.wallet_transactions.insert_one({
                "user_id": user_id,
                "type": "streak_bonus",
                "amount": cash_reward,
                "description": "30-Day Challenge Streak Bonus! 🔥",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        elif current_streak % 30 == 0 and current_streak > 30:
            # Every 30 days after first 30
            bonus_points = 100
            cash_reward = 5.00
            await db.wallets.update_one(
                {"user_id": user_id},
                {"$inc": {"balance": cash_reward}}
            )
            await db.wallet_transactions.insert_one({
                "user_id": user_id,
                "type": "streak_bonus",
                "amount": cash_reward,
                "description": f"{current_streak}-Day Challenge Streak! 🔥🔥🔥",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        
        # Update user document
        await db.users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "challenge_streak.current_streak": current_streak,
                    "challenge_streak.longest_streak": longest_streak,
                    "challenge_streak.last_attempt_date": today_str
                },
                "$inc": {
                    "challenge_streak.total_streak_points": bonus_points
                }
            }
        )
        
        return {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "bonus_points": bonus_points,
            "cash_reward": cash_reward
        }
        
    except Exception as e:
        logger.error(f"Error updating streak: {str(e)}")
        return {
            "current_streak": 1,
            "longest_streak": 1,
            "bonus_points": 0,
            "cash_reward": 0
        }


async def is_admin(current_user) -> bool:
    """Check if user is admin"""
    admin_emails = [
        "admin@calliotel.com",
        "bigboss@calliotel.com",
        "alinmy77@gmail.com",
        "worl212211@yahoo.com",
    ]
    user_email = current_user.get("_id") or current_user.get("email")
    return user_email in admin_emails


@router.get("/current")
async def get_current_challenge(current_user = Depends(get_current_user)):
    """Get today's active challenge"""
    try:
        # Get today's challenge
        challenge_index = get_current_challenge_index()
        challenge = CHALLENGES[challenge_index].copy()
        
        # Set active date and expiry
        today = datetime.now(timezone.utc)
        tomorrow = today + timedelta(days=1)
        tomorrow_midnight = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
        
        challenge["active_date"] = today.isoformat()
        challenge["expires_at"] = tomorrow_midnight.isoformat()
        
        # Remove correct answer from response (don't send to client)
        challenge_response = challenge.copy()
        challenge_response.pop("correct_answer", None)
        challenge_response.pop("alternative_answers", None)
        
        # Check if user already attempted today
        user_id = current_user.get("_id") or current_user.get("email")
        today_str = today.strftime("%Y-%m-%d")
        
        attempt = await db.challenge_attempts.find_one({
            "user_id": user_id,
            "challenge_id": challenge["id"],
            "date": today_str
        })
        
        challenge_response["user_attempted"] = attempt is not None
        challenge_response["user_correct"] = attempt.get("is_correct", False) if attempt else False
        
        return {
            "success": True,
            "challenge": challenge_response
        }
        
    except Exception as e:
        logger.error(f"Error getting current challenge: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get current challenge")


@router.post("/submit")
async def submit_challenge_answer(
    attempt: ChallengeAttempt,
    current_user = Depends(get_current_user)
):
    """Submit an answer to today's challenge"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        today = datetime.now(timezone.utc)
        today_str = today.strftime("%Y-%m-%d")
        
        # Get the challenge
        challenge = next((c for c in CHALLENGES if c["id"] == attempt.challenge_id), None)
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        
        # Check if challenge is for today
        current_challenge_index = get_current_challenge_index()
        if CHALLENGES[current_challenge_index]["id"] != attempt.challenge_id:
            raise HTTPException(status_code=400, detail="This challenge is not active today")
        
        # Check if user already attempted today
        existing_attempt = await db.challenge_attempts.find_one({
            "user_id": user_id,
            "challenge_id": attempt.challenge_id,
            "date": today_str
        })
        
        if existing_attempt:
            raise HTTPException(status_code=400, detail="You already attempted this challenge today")
        
        # Check answer
        user_answer = attempt.answer.strip().lower()
        correct_answer = challenge["correct_answer"].strip().lower()
        
        # Check alternative answers if available
        is_correct = user_answer == correct_answer
        if not is_correct and "alternative_answers" in challenge:
            is_correct = any(user_answer == alt.strip().lower() for alt in challenge["alternative_answers"])
        
        # Store attempt
        week_id = get_current_week_id()
        attempt_doc = {
            "id": str(uuid4()),
            "user_id": user_id,
            "user_name": current_user.get("full_name") or user_id,
            "challenge_id": attempt.challenge_id,
            "date": today_str,
            "week_id": week_id,
            "answer": attempt.answer,
            "is_correct": is_correct,
            "points": challenge["points"] if is_correct else 0,
            "submitted_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.challenge_attempts.insert_one(attempt_doc)
        
        # Update user's weekly stats
        await db.users.update_one(
            {"_id": user_id},
            {
                "$inc": {
                    f"challenge_stats.week_{week_id}.attempts": 1,
                    f"challenge_stats.week_{week_id}.correct": 1 if is_correct else 0,
                    f"challenge_stats.week_{week_id}.points": challenge["points"] if is_correct else 0
                }
            }
        )
        
        # Update streak if correct
        streak_bonus = 0
        streak_reward = 0
        if is_correct:
            streak_info = await update_user_streak(user_id, today_str)
            streak_bonus = streak_info["bonus_points"]
            streak_reward = streak_info["cash_reward"]
            
            # Add streak bonus to attempt
            if streak_bonus > 0:
                await db.challenge_attempts.update_one(
                    {"id": attempt_doc["id"]},
                    {"$set": {"streak_bonus": streak_bonus}}
                )
        
        logger.info(f"Challenge attempt by {user_id}: {attempt.challenge_id} - {'Correct' if is_correct else 'Wrong'}")
        
        response_data = {
            "success": True,
            "is_correct": is_correct,
            "points": challenge["points"] if is_correct else 0,
            "message": "🎉 Correct! You're entered in this week's draw!" if is_correct else "❌ Not quite right. Try again tomorrow!"
        }
        
        if streak_bonus > 0:
            response_data["streak_bonus"] = streak_bonus
            response_data["message"] = f"🔥 {streak_info['current_streak']}-DAY STREAK! +{streak_bonus} bonus points!"
            if streak_reward > 0:
                response_data["cash_reward"] = streak_reward
                response_data["message"] += f" 💰 +${streak_reward} bonus!"
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting challenge answer: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit answer")


@router.get("/leaderboard")
async def get_weekly_leaderboard(current_user = Depends(get_current_user)):
    """Get this week's leaderboard"""
    try:
        week_id = get_current_week_id()
        
        # Get all correct attempts for this week
        attempts = await db.challenge_attempts.find({
            "week_id": week_id,
            "is_correct": True
        }).to_list(1000)
        
        # Aggregate by user
        user_stats = {}
        for attempt in attempts:
            user_id = attempt["user_id"]
            if user_id not in user_stats:
                user_stats[user_id] = {
                    "user_id": user_id,
                    "user_name": attempt.get("user_name", "Unknown"),
                    "correct_answers": 0,
                    "total_points": 0
                }
            user_stats[user_id]["correct_answers"] += 1
            user_stats[user_id]["total_points"] += attempt.get("points", 0)
            user_stats[user_id]["total_points"] += attempt.get("streak_bonus", 0)
        
        # Sort by correct answers, then by total points
        leaderboard = sorted(
            user_stats.values(),
            key=lambda x: (x["correct_answers"], x["total_points"]),
            reverse=True
        )
        
        # Add rank
        for i, entry in enumerate(leaderboard, 1):
            entry["rank"] = i
        
        return {
            "success": True,
            "week_id": week_id,
            "leaderboard": leaderboard[:50]  # Top 50
        }
        
    except Exception as e:
        logger.error(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get leaderboard")


@router.get("/leaderboard/monthly")
async def get_monthly_leaderboard(current_user = Depends(get_current_user)):
    """Get this month's leaderboard"""
    try:
        month_id = get_current_month_id()
        
        # Get all correct attempts for this month
        attempts = await db.challenge_attempts.find({
            "date": {"$regex": f"^{month_id}"},
            "is_correct": True
        }).to_list(10000)
        
        # Aggregate by user
        user_stats = {}
        for attempt in attempts:
            user_id = attempt["user_id"]
            if user_id not in user_stats:
                user_stats[user_id] = {
                    "user_id": user_id,
                    "user_name": attempt.get("user_name", "Unknown"),
                    "correct_answers": 0,
                    "total_points": 0,
                    "participation_days": set()
                }
            user_stats[user_id]["correct_answers"] += 1
            user_stats[user_id]["total_points"] += attempt.get("points", 0)
            user_stats[user_id]["total_points"] += attempt.get("streak_bonus", 0)
            user_stats[user_id]["participation_days"].add(attempt["date"])
        
        # Convert set to count
        for stats in user_stats.values():
            stats["participation_days"] = len(stats["participation_days"])
        
        # Sort by total points, then by correct answers
        leaderboard = sorted(
            user_stats.values(),
            key=lambda x: (x["total_points"], x["correct_answers"]),
            reverse=True
        )
        
        # Add rank and badges
        for i, entry in enumerate(leaderboard, 1):
            entry["rank"] = i
            if i == 1:
                entry["badge"] = "🥇 Champion"
            elif i == 2:
                entry["badge"] = "🥈 Runner-up"
            elif i == 3:
                entry["badge"] = "🥉 3rd Place"
            else:
                entry["badge"] = None
        
        return {
            "success": True,
            "month_id": month_id,
            "leaderboard": leaderboard[:100],  # Top 100
            "grand_prize": "$10 for #1",
            "prizes": {
                "1st": "$10.00",
                "2nd": "$5.00",
                "3rd": "$2.00"
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting monthly leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get monthly leaderboard")


@router.get("/my-stats")
async def get_my_challenge_stats(current_user = Depends(get_current_user)):
    """Get user's challenge statistics"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        week_id = get_current_week_id()
        month_id = get_current_month_id()
        
        # Get streak info
        user = await db.users.find_one({"_id": user_id})
        streak_data = user.get("challenge_streak", {
            "current_streak": 0,
            "longest_streak": 0,
            "total_streak_points": 0
        })
        
        # Get this week's attempts
        attempts = await db.challenge_attempts.find({
            "user_id": user_id,
            "week_id": week_id
        }).to_list(100)
        
        correct_count = sum(1 for a in attempts if a.get("is_correct"))
        total_points = sum(a.get("points", 0) for a in attempts)
        streak_bonus = sum(a.get("streak_bonus", 0) for a in attempts)
        
        # Get this month's attempts
        month_attempts = await db.challenge_attempts.find({
            "user_id": user_id,
            "date": {"$regex": f"^{month_id}"}
        }).to_list(1000)
        
        month_correct = sum(1 for a in month_attempts if a.get("is_correct"))
        month_points = sum(a.get("points", 0) for a in month_attempts)
        
        # Get all-time stats
        all_attempts = await db.challenge_attempts.find({
            "user_id": user_id
        }).to_list(1000)
        
        all_time_correct = sum(1 for a in all_attempts if a.get("is_correct"))
        all_time_points = sum(a.get("points", 0) for a in all_attempts)
        
        # Check if user won any week/month
        wins = await db.challenge_winners.find({
            "user_id": user_id
        }).to_list(100)
        
        return {
            "success": True,
            "streak": {
                "current": streak_data.get("current_streak", 0),
                "longest": streak_data.get("longest_streak", 0),
                "total_bonus_points": streak_data.get("total_streak_points", 0)
            },
            "this_week": {
                "attempts": len(attempts),
                "correct": correct_count,
                "points": total_points,
                "streak_bonus": streak_bonus,
                "week_id": week_id
            },
            "this_month": {
                "attempts": len(month_attempts),
                "correct": month_correct,
                "points": month_points,
                "month_id": month_id
            },
            "all_time": {
                "total_attempts": len(all_attempts),
                "total_correct": all_time_correct,
                "total_points": all_time_points,
                "wins": len(wins)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting user stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get stats")


@router.get("/history")
async def get_challenge_history(
    limit: int = 7,
    current_user = Depends(get_current_user)
):
    """Get past challenges (last 7 days by default)"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        history = []
        today = datetime.now(timezone.utc)
        
        for i in range(limit):
            date = today - timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            day_of_year = date.timetuple().tm_yday
            challenge_index = day_of_year % len(CHALLENGES)
            
            challenge = CHALLENGES[challenge_index].copy()
            
            # Get user's attempt for this day
            attempt = await db.challenge_attempts.find_one({
                "user_id": user_id,
                "challenge_id": challenge["id"],
                "date": date_str
            })
            
            history.append({
                "date": date_str,
                "challenge_title": challenge["title"],
                "challenge_id": challenge["id"],
                "attempted": attempt is not None,
                "correct": attempt.get("is_correct", False) if attempt else False,
                "points": attempt.get("points", 0) if attempt else 0
            })
        
        return {
            "success": True,
            "history": history
        }
        
    except Exception as e:
        logger.error(f"Error getting challenge history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get history")


@router.get("/admin/stats")
async def get_admin_challenge_stats(current_user = Depends(get_current_user)):
    """Get challenge statistics (admin only)"""
    try:
        if not await is_admin(current_user):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        week_id = get_current_week_id()
        
        # Total attempts this week
        attempts = await db.challenge_attempts.find({"week_id": week_id}).to_list(10000)
        correct_attempts = [a for a in attempts if a.get("is_correct")]
        unique_participants = len(set(a["user_id"] for a in attempts))
        
        # Challenge breakdown
        challenge_stats = {}
        for challenge in CHALLENGES:
            challenge_attempts = [a for a in attempts if a["challenge_id"] == challenge["id"]]
            challenge_correct = [a for a in challenge_attempts if a.get("is_correct")]
            
            challenge_stats[challenge["id"]] = {
                "title": challenge["title"],
                "total_attempts": len(challenge_attempts),
                "correct_attempts": len(challenge_correct),
                "success_rate": round(len(challenge_correct) / len(challenge_attempts) * 100, 1) if challenge_attempts else 0
            }
        
        return {
            "success": True,
            "week_id": week_id,
            "total_attempts": len(attempts),
            "correct_attempts": len(correct_attempts),
            "unique_participants": unique_participants,
            "eligible_for_prize": len(set(a["user_id"] for a in correct_attempts)),
            "challenge_breakdown": challenge_stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting admin stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get stats")


@router.post("/admin/select-winner")
async def select_weekly_winner(current_user = Depends(get_current_user)):
    """Manually trigger weekly winner selection (admin only)"""
    try:
        if not await is_admin(current_user):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = await process_weekly_winner()
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error selecting winner: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to select winner")


async def process_weekly_winner():
    """Process weekly winner selection and prize distribution"""
    try:
        week_id = get_current_week_id()
        
        # Check if winner already selected for this week
        existing_winner = await db.challenge_winners.find_one({"week_id": week_id})
        if existing_winner:
            return {
                "success": False,
                "message": "Winner already selected for this week",
                "winner": existing_winner
            }
        
        # Get all users with at least one correct answer this week
        correct_attempts = await db.challenge_attempts.find({
            "week_id": week_id,
            "is_correct": True
        }).to_list(10000)
        
        if not correct_attempts:
            logger.info(f"No correct attempts for week {week_id}")
            return {
                "success": False,
                "message": "No participants with correct answers this week"
            }
        
        # Get unique users
        eligible_users = list(set(a["user_id"] for a in correct_attempts))
        
        # Randomly select winner
        winner_id = random.choice(eligible_users)
        winner_attempts = [a for a in correct_attempts if a["user_id"] == winner_id]
        winner_name = winner_attempts[0].get("user_name", "Unknown")
        total_correct = len(winner_attempts)
        
        # Record winner
        winner_doc = {
            "id": str(uuid4()),
            "week_id": week_id,
            "user_id": winner_id,
            "user_name": winner_name,
            "correct_answers": total_correct,
            "prize_amount": 2.00,
            "selected_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.challenge_winners.insert_one(winner_doc)
        
        # Add $2 to winner's wallet
        await db.wallets.update_one(
            {"user_id": winner_id},
            {"$inc": {"balance": 2.00}}
        )
        
        # Log transaction
        await db.wallet_transactions.insert_one({
            "user_id": winner_id,
            "type": "challenge_prize",
            "amount": 2.00,
            "description": f"Weekly Challenge Winner - Week {week_id}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Send broadcast notification
        from routes.notifications import db as notif_db
        notification_id = str(uuid4())
        await notif_db.notifications.insert_one({
            "id": notification_id,
            "title": "🏆 Weekly Challenge Winner!",
            "message": f"Congratulations to {winner_name} for winning this week's challenge! They answered {total_correct} questions correctly and won $2! Keep playing for your chance to win next week!",
            "sent_by": "system",
            "sent_by_name": "Calliotel",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Create notification for all users
        all_users = await db.users.find({}, {"_id": 1}).to_list(10000)
        user_notifications = []
        for user in all_users:
            user_notifications.append({
                "notification_id": notification_id,
                "user_id": user["_id"],
                "is_read": False,
                "is_deleted": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        if user_notifications:
            await notif_db.user_notifications.insert_many(user_notifications)
        
        logger.info(f"Weekly winner selected: {winner_name} ({winner_id}) - Week {week_id}")
        
        return {
            "success": True,
            "message": f"Winner selected: {winner_name}",
            "winner": winner_doc
        }
        
    except Exception as e:
        logger.error(f"Error processing weekly winner: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process winner")


# ============================================
# TEAM CHALLENGES ENDPOINTS (PHASE 3)
# ============================================

def generate_team_code():
    """Generate a unique 6-character team code"""
    import string
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=6))


@router.post("/teams/create")
async def create_team(
    team_data: TeamCreate,
    current_user = Depends(get_current_user)
):
    """Create a new challenge team"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        # Check if user is already in a team
        existing_team = await db.teams.find_one({"members": user_id})
        if existing_team:
            raise HTTPException(
                status_code=400,
                detail="You are already in a team. Leave your current team first."
            )
        
        # Validate team name
        if len(team_data.team_name) < 3:
            raise HTTPException(status_code=400, detail="Team name must be at least 3 characters")
        
        if len(team_data.team_name) > 30:
            raise HTTPException(status_code=400, detail="Team name must be less than 30 characters")
        
        # Check if team name already exists
        existing_name = await db.teams.find_one({"team_name": team_data.team_name})
        if existing_name:
            raise HTTPException(status_code=400, detail="Team name already taken")
        
        # Generate unique team code
        team_code = generate_team_code()
        while await db.teams.find_one({"team_code": team_code}):
            team_code = generate_team_code()
        
        # Create team
        team_id = str(uuid4())
        team = {
            "id": team_id,
            "team_name": team_data.team_name,
            "team_description": team_data.team_description or "",
            "team_code": team_code,
            "leader_id": user_id,
            "leader_name": current_user.get("full_name") or user_id,
            "members": [user_id],
            "member_names": {user_id: current_user.get("full_name") or user_id},
            "created_at": datetime.now(timezone.utc).isoformat(),
            "total_points": 0,
            "total_correct": 0
        }
        
        await db.teams.insert_one(team)
        
        # Update user's team
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"team_id": team_id}}
        )
        
        logger.info(f"Team created: {team_data.team_name} by {user_id}")
        
        return {
            "success": True,
            "message": f"Team '{team_data.team_name}' created successfully!",
            "team": {
                "id": team_id,
                "team_name": team_data.team_name,
                "team_code": team_code,
                "member_count": 1
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating team: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create team")


@router.post("/teams/join")
async def join_team(
    join_data: TeamJoin,
    current_user = Depends(get_current_user)
):
    """Join a team using team code"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        # Check if user is already in a team
        existing_team = await db.teams.find_one({"members": user_id})
        if existing_team:
            raise HTTPException(
                status_code=400,
                detail="You are already in a team. Leave your current team first."
            )
        
        # Find team by code
        team = await db.teams.find_one({"team_code": join_data.team_code.upper()})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found. Check the team code.")
        
        # Check if team is full (max 10 members)
        if len(team.get("members", [])) >= 10:
            raise HTTPException(status_code=400, detail="Team is full (max 10 members)")
        
        # Add user to team
        user_name = current_user.get("full_name") or user_id
        await db.teams.update_one(
            {"id": team["id"]},
            {
                "$push": {"members": user_id},
                "$set": {f"member_names.{user_id}": user_name}
            }
        )
        
        # Update user's team
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"team_id": team["id"]}}
        )
        
        logger.info(f"User {user_id} joined team {team['team_name']}")
        
        return {
            "success": True,
            "message": f"Successfully joined team '{team['team_name']}'!",
            "team": {
                "id": team["id"],
                "team_name": team["team_name"],
                "member_count": len(team["members"]) + 1
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error joining team: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to join team")


@router.get("/teams/my-team")
async def get_my_team(current_user = Depends(get_current_user)):
    """Get user's current team details"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        # Find user's team
        team = await db.teams.find_one({"members": user_id}, {"_id": 0})
        
        if not team:
            return {
                "success": True,
                "team": None,
                "message": "You are not in a team"
            }
        
        # Get team stats for current week
        week_id = get_current_week_id()
        team_attempts = await db.challenge_attempts.find({
            "week_id": week_id,
            "user_id": {"$in": team["members"]},
            "is_correct": True
        }).to_list(1000)
        
        team_points = sum(a.get("points", 0) + a.get("streak_bonus", 0) for a in team_attempts)
        team_correct = len(team_attempts)
        
        # Get member details
        members = []
        for member_id in team["members"]:
            member_attempts = [a for a in team_attempts if a["user_id"] == member_id]
            members.append({
                "user_id": member_id,
                "user_name": team["member_names"].get(member_id, "Unknown"),
                "correct_answers": len(member_attempts),
                "points": sum(a.get("points", 0) + a.get("streak_bonus", 0) for a in member_attempts),
                "is_leader": member_id == team["leader_id"]
            })
        
        # Sort members by points
        members.sort(key=lambda x: x["points"], reverse=True)
        
        return {
            "success": True,
            "team": {
                "id": team["id"],
                "team_name": team["team_name"],
                "team_description": team["team_description"],
                "team_code": team["team_code"],
                "leader_id": team["leader_id"],
                "leader_name": team["leader_name"],
                "member_count": len(team["members"]),
                "members": members,
                "this_week": {
                    "total_points": team_points,
                    "total_correct": team_correct
                },
                "created_at": team["created_at"]
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting team: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get team details")


@router.delete("/teams/leave")
async def leave_team(current_user = Depends(get_current_user)):
    """Leave current team"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        # Find user's team
        team = await db.teams.find_one({"members": user_id})
        
        if not team:
            raise HTTPException(status_code=404, detail="You are not in a team")
        
        # If user is leader and there are other members, transfer leadership
        if team["leader_id"] == user_id and len(team["members"]) > 1:
            # Transfer to next member
            new_leader = [m for m in team["members"] if m != user_id][0]
            await db.teams.update_one(
                {"id": team["id"]},
                {
                    "$set": {
                        "leader_id": new_leader,
                        "leader_name": team["member_names"].get(new_leader, "Unknown")
                    }
                }
            )
        
        # If user is the only member, delete the team
        if len(team["members"]) == 1:
            await db.teams.delete_one({"id": team["id"]})
        else:
            # Remove user from team
            await db.teams.update_one(
                {"id": team["id"]},
                {
                    "$pull": {"members": user_id},
                    "$unset": {f"member_names.{user_id}": ""}
                }
            )
        
        # Update user's team
        await db.users.update_one(
            {"_id": user_id},
            {"$unset": {"team_id": ""}}
        )
        
        logger.info(f"User {user_id} left team {team['team_name']}")
        
        return {
            "success": True,
            "message": "Successfully left the team"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error leaving team: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to leave team")


@router.post("/teams/kick/{user_id_to_kick}")
async def kick_team_member(
    user_id_to_kick: str,
    current_user = Depends(get_current_user)
):
    """Kick a member from the team (leader only)"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        # Find user's team
        team = await db.teams.find_one({"members": user_id})
        
        if not team:
            raise HTTPException(status_code=404, detail="You are not in a team")
        
        # Check if user is team leader
        if team["leader_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only team leader can kick members")
        
        # Check if target user is in the team
        if user_id_to_kick not in team["members"]:
            raise HTTPException(status_code=404, detail="User is not in your team")
        
        # Can't kick yourself
        if user_id_to_kick == user_id:
            raise HTTPException(status_code=400, detail="You can't kick yourself. Use leave instead.")
        
        # Remove user from team
        await db.teams.update_one(
            {"id": team["id"]},
            {
                "$pull": {"members": user_id_to_kick},
                "$unset": {f"member_names.{user_id_to_kick}": ""}
            }
        )
        
        # Update kicked user's team
        await db.users.update_one(
            {"_id": user_id_to_kick},
            {"$unset": {"team_id": ""}}
        )
        
        logger.info(f"User {user_id_to_kick} kicked from team {team['team_name']} by {user_id}")
        
        return {
            "success": True,
            "message": "Member kicked successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error kicking member: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to kick member")


@router.get("/teams/leaderboard")
async def get_team_leaderboard(current_user = Depends(get_current_user)):
    """Get weekly team leaderboard"""
    try:
        week_id = get_current_week_id()
        
        # Get all teams
        teams = await db.teams.find({}, {"_id": 0}).to_list(1000)
        
        # Calculate points for each team
        team_stats = []
        for team in teams:
            # Get team's attempts for this week
            team_attempts = await db.challenge_attempts.find({
                "week_id": week_id,
                "user_id": {"$in": team["members"]},
                "is_correct": True
            }).to_list(1000)
            
            total_points = sum(a.get("points", 0) + a.get("streak_bonus", 0) for a in team_attempts)
            total_correct = len(team_attempts)
            
            team_stats.append({
                "team_id": team["id"],
                "team_name": team.get("team_name", "Unknown Team"),
                "leader_name": team.get("leader_name", "Unknown"),
                "member_count": len(team.get("members", [])),
                "total_points": total_points,
                "total_correct": total_correct,
                "avg_points_per_member": round(total_points / len(team["members"]), 1) if team.get("members") else 0
            })
        
        # Sort by total points
        team_stats.sort(key=lambda x: (x["total_points"], x["total_correct"]), reverse=True)
        
        # Add rank
        for i, team in enumerate(team_stats, 1):
            team["rank"] = i
        
        return {
            "success": True,
            "week_id": week_id,
            "leaderboard": team_stats[:50],  # Top 50 teams
            "total_teams": len(team_stats)
        }
        
    except Exception as e:
        logger.error(f"Error getting team leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get team leaderboard")

