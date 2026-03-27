"""
Phish-Finder Game API
Security awareness quiz game where users identify phishing attempts
Rewards accuracy over speed
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
from uuid import uuid4

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Phishing Scenarios Database
SCENARIOS = [
    # SMS (Smishing) - 12 scenarios (60%)
    {
        "id": "sms_001",
        "type": "SMS",
        "content": "URGENT: Your bank account has been suspended. Click here to verify: bit.ly/bnk-verify-2024",
        "sender": "+1-800-555-0199",
        "is_phish": True,
        "red_flags": [
            "Sense of urgency to create panic",
            "Shortened URL (bit.ly) hides the real destination",
            "Banks never ask you to verify via text links",
            "Generic message with no account details"
        ]
    },
    {
        "id": "sms_002",
        "type": "SMS",
        "content": "Your package delivery failed. Reschedule here: usps-redelivery.com/track",
        "sender": "USPS",
        "is_phish": True,
        "red_flags": [
            "Domain 'usps-redelivery.com' is not the real USPS site (usps.com)",
            "USPS doesn't use SMS for redelivery scheduling",
            "No tracking number provided",
            "Creates urgency around missed delivery"
        ]
    },
    {
        "id": "sms_003",
        "type": "SMS",
        "content": "Hi! This is Sarah from HR. Your appointment for tomorrow at 2 PM is confirmed. See you then!",
        "sender": "Sarah Chen",
        "is_phish": False,
        "red_flags": []
    },
    {
        "id": "sms_004",
        "type": "SMS",
        "content": "Congratulations! You've won a $500 Amazon gift card! Claim now: amaz0n-rewards.net/claim?id=749201",
        "sender": "+1-555-0142",
        "is_phish": True,
        "red_flags": [
            "Domain 'amaz0n-rewards.net' uses '0' instead of 'o' (typosquatting)",
            "Unsolicited prize notification",
            "Random number sender (not Amazon)",
            "Creates false sense of urgency to claim"
        ]
    },
    {
        "id": "sms_005",
        "type": "SMS",
        "content": "Your verification code is: 847293. Do not share this code with anyone. Valid for 10 minutes.",
        "sender": "Calliotel",
        "is_phish": False,
        "red_flags": []
    },
    {
        "id": "sms_006",
        "type": "SMS",
        "content": "IRS NOTICE: You have unpaid taxes. Warrant issued. Call 1-800-555-0187 immediately to avoid arrest.",
        "sender": "IRS",
        "is_phish": True,
        "red_flags": [
            "IRS never contacts via SMS",
            "Creates extreme fear (arrest warrant)",
            "Pressure to call immediately",
            "IRS communicates via official mail only"
        ]
    },
    {
        "id": "sms_007",
        "type": "SMS",
        "content": "Your Uber ride to 123 Main St is arriving in 3 minutes. Driver: Mike (Honda Civic, ABC-1234)",
        "sender": "Uber",
        "is_phish": False,
        "red_flags": []
    },
    {
        "id": "sms_008",
        "type": "SMS",
        "content": "Mom: Can you send me $200? My card isn't working and I need to pay the mechanic. Venmo me ASAP!",
        "sender": "+1-555-0198",
        "is_phish": True,
        "red_flags": [
            "Impersonation attempt (claims to be 'Mom')",
            "Creates urgency with emergency scenario",
            "Requests money transfer",
            "Unknown number, not saved as 'Mom' in contacts"
        ]
    },
    {
        "id": "sms_009",
        "type": "SMS",
        "content": "Netflix: Your payment method was declined. Update billing to continue service: netflix-billing-update.com",
        "sender": "Netflix",
        "is_phish": True,
        "red_flags": [
            "Domain 'netflix-billing-update.com' is not the real Netflix site",
            "Netflix sends billing issues via email or in-app",
            "Creates urgency to update payment",
            "Generic message with no account details"
        ]
    },
    {
        "id": "sms_010",
        "type": "SMS",
        "content": "Your meeting with Dr. Johnson is scheduled for March 15 at 10:00 AM. Reply CONFIRM or CANCEL.",
        "sender": "City Medical",
        "is_phish": False,
        "red_flags": []
    },
    {
        "id": "sms_011",
        "type": "SMS",
        "content": "COVID-19 ALERT: You were exposed. Mandatory test required. Book here: covidtest-booking.org/schedule",
        "sender": "CDC",
        "is_phish": True,
        "red_flags": [
            "CDC doesn't send exposure alerts via SMS",
            "Domain is not the official CDC site (cdc.gov)",
            "Creates fear and urgency",
            "No specific details about exposure"
        ]
    },
    {
        "id": "sms_012",
        "type": "SMS",
        "content": "Your order #A7429 has shipped! Track your package: amzn.to/3xK9pL2 - Expected delivery: March 18",
        "sender": "Amazon",
        "is_phish": False,
        "red_flags": []
    },
    
    # Email (Phishing) - 4 scenarios (20%)
    {
        "id": "email_001",
        "type": "Email",
        "content": "From: security@paypa1-support.com\nSubject: Unusual Activity Detected\n\nDear User,\n\nWe noticed suspicious login attempts on your PayPal account from Russia. Please verify your identity immediately by clicking below:\n\n[VERIFY NOW]\n\nFailure to verify within 24 hours will result in permanent account suspension.\n\nPayPal Security Team",
        "sender": "security@paypa1-support.com",
        "is_phish": True,
        "red_flags": [
            "Domain uses '1' instead of 'l' in paypal (paypa1-support.com)",
            "Generic greeting ('Dear User') instead of your name",
            "Creates urgency with threat of suspension",
            "Legitimate PayPal emails come from @paypal.com only"
        ]
    },
    {
        "id": "email_002",
        "type": "Email",
        "content": "From: support@calliotel.com\nSubject: Your Monthly Invoice - February 2024\n\nHi there,\n\nYour invoice for February is ready. Amount due: $49.99\n\nView Invoice: [Download PDF]\n\nThank you for using Calliotel!\n\nThe Calliotel Team",
        "sender": "support@calliotel.com",
        "is_phish": False,
        "red_flags": []
    },
    {
        "id": "email_003",
        "type": "Email",
        "content": "From: admin@microsoft-security-team.com\nSubject: Critical Security Alert\n\nYour Microsoft account has been compromised. We detected unauthorized access from:\n\nLocation: Beijing, China\nDevice: Unknown Android\n\nChange your password immediately: [SECURE YOUR ACCOUNT]\n\nMicrosoft Security",
        "sender": "admin@microsoft-security-team.com",
        "is_phish": True,
        "red_flags": [
            "Domain 'microsoft-security-team.com' is not official Microsoft domain",
            "Real Microsoft emails come from @microsoft.com",
            "Creates panic with 'compromised' language",
            "Generic sender name 'Microsoft Security'"
        ]
    },
    {
        "id": "email_004",
        "type": "Email",
        "content": "From: team@github.com\nSubject: Security alert: New sign-in from Firefox on Windows\n\nA new sign-in to your account was detected:\n\nBrowser: Firefox 120\nOS: Windows 11\nLocation: San Francisco, CA\nTime: March 12, 2024 at 2:14 PM PST\n\nIf this wasn't you, please secure your account immediately.\n\nGitHub Security",
        "sender": "team@github.com",
        "is_phish": False,
        "red_flags": []
    },
    
    # URLs (Malicious Links) - 4 scenarios (20%)
    {
        "id": "url_001",
        "type": "URL",
        "content": "You received a link to verify your account:\n\nhttps://www.g00gle.com/accounts/verify?user=12345",
        "sender": "Security Alert",
        "is_phish": True,
        "red_flags": [
            "Domain uses '00' (zeros) instead of 'oo' in google",
            "Real Google uses 'google.com' not 'g00gle.com'",
            "Typosquatting attack (visual similarity)",
            "Google never sends verification links like this"
        ]
    },
    {
        "id": "url_002",
        "type": "URL",
        "content": "Check out this article I found:\n\nhttps://www.nytimes.com/2024/03/technology/ai-breakthrough.html",
        "sender": "Friend",
        "is_phish": False,
        "red_flags": []
    },
    {
        "id": "url_003",
        "type": "URL",
        "content": "Your Apple ID has been locked. Unlock here:\n\nhttps://appleid.apple.com-secure-login.tk/unlock",
        "sender": "Apple Support",
        "is_phish": True,
        "red_flags": [
            "Subdomain trickery: real domain is '.tk' (Tokelau), not apple.com",
            "Apple's real domain is appleid.apple.com (no hyphens after)",
            "Uses '.tk' free domain extension (common in phishing)",
            "Real Apple never uses third-party domains"
        ]
    },
    {
        "id": "url_004",
        "type": "URL",
        "content": "Your LinkedIn connection shared a post:\n\nhttps://www.linkedin.com/feed/update/urn:li:activity:7045892341234567890/",
        "sender": "LinkedIn",
        "is_phish": False,
        "red_flags": []
    }
]

# Pydantic Models
class ScenarioResponse(BaseModel):
    scenario_id: str
    type: str
    content: str
    sender: str

class AnswerSubmit(BaseModel):
    scenario_id: str
    user_answer: bool  # True = Phish, False = Legit
    time_taken: float

class GameResult(BaseModel):
    correct: bool
    xp_earned: int
    xp_total: int
    is_phish: bool
    red_flags: List[str]
    explanation: str
    time_bonus: int

# Helper Functions
async def check_phish_finder_achievements(user_id: str):
    """Check and award Phish-Finder achievements"""
    try:
        # Get user's Phish-Finder attempts
        attempts = await db.phish_finder_attempts.find({"user_id": user_id}).to_list(1000)
        
        total_attempts = len(attempts)
        correct_attempts = sum(1 for a in attempts if a["correct"])
        accuracy = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0
        
        # First scenario
        if total_attempts == 1:
            await award_achievement(user_id, "phish_first_blood")
        
        # Accuracy milestones (minimum 10 attempts)
        if total_attempts >= 10:
            if accuracy >= 50:
                await award_achievement(user_id, "security_rookie")
            if accuracy >= 80 and total_attempts >= 20:
                await award_achievement(user_id, "cybersecurity_expert")
            if accuracy >= 95 and total_attempts >= 50:
                await award_achievement(user_id, "phish_hunter")
        
        # Perfect streak (10 correct in a row)
        if len(attempts) >= 10:
            last_10 = attempts[-10:]
            if all(a["correct"] for a in last_10):
                await award_achievement(user_id, "perfect_vision")
        
    except Exception as e:
        logger.error(f"Error checking Phish-Finder achievements: {str(e)}")

# API Endpoints
@router.get("/challenge", response_model=ScenarioResponse)
async def get_challenge(current_user = Depends(get_current_user)):
    """
    Get a random phishing scenario.
    Returns scenario details without revealing if it's phishing.
    """
    try:
        # Select random scenario
        scenario = random.choice(SCENARIOS)
        
        return ScenarioResponse(
            scenario_id=scenario["id"],
            type=scenario["type"],
            content=scenario["content"],
            sender=scenario["sender"]
        )
        
    except Exception as e:
        logger.error(f"Error getting Phish-Finder challenge: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get challenge")

@router.post("/submit", response_model=GameResult)
async def submit_answer(
    answer: AnswerSubmit,
    current_user = Depends(get_current_user)
):
    """
    Submit answer to a phishing scenario.
    Calculate XP based on accuracy and speed.
    """
    try:
        user_id = current_user["_id"]
        
        # Find scenario
        scenario = next((s for s in SCENARIOS if s["id"] == answer.scenario_id), None)
        
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        
        # Check if answer is correct
        correct = answer.user_answer == scenario["is_phish"]
        
        # Calculate XP
        xp_earned = 0
        time_bonus = 0
        
        if correct:
            base_xp = 20
            
            # Speed bonus: max 60 XP if answered in under 30 seconds
            if answer.time_taken < 30:
                time_bonus = int((30 - answer.time_taken) * 2)
            
            xp_earned = base_xp + time_bonus
            
            # Award XP
            xp_result = await award_xp(user_id, xp_earned, "Phish-Finder correct answer")
            xp_total = xp_result["new_total"]
        else:
            xp_total = 0
        
        # Save attempt
        attempt = {
            "id": str(uuid4()),
            "user_id": user_id,
            "scenario_id": answer.scenario_id,
            "scenario_type": scenario["type"],
            "user_answer": answer.user_answer,
            "correct_answer": scenario["is_phish"],
            "correct": correct,
            "time_taken": answer.time_taken,
            "xp_earned": xp_earned,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.phish_finder_attempts.insert_one(attempt)
        
        # Check achievements
        await check_phish_finder_achievements(user_id)
        
        # Build explanation
        if correct:
            if scenario["is_phish"]:
                explanation = "✅ Correct! This was a phishing attempt."
            else:
                explanation = "✅ Correct! This was a legitimate message."
        else:
            if scenario["is_phish"]:
                explanation = "❌ Incorrect. This was actually a phishing attempt!"
            else:
                explanation = "❌ Incorrect. This was a legitimate message."
        
        logger.info(f"Phish-Finder submitted: User {user_id}, Correct: {correct}, XP: {xp_earned}")
        
        return GameResult(
            correct=correct,
            xp_earned=xp_earned,
            xp_total=xp_total,
            is_phish=scenario["is_phish"],
            red_flags=scenario["red_flags"],
            explanation=explanation,
            time_bonus=time_bonus
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting Phish-Finder answer: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit answer")

@router.get("/stats")
async def get_stats(current_user = Depends(get_current_user)):
    """
    Get user's Phish-Finder statistics.
    """
    try:
        user_id = current_user["_id"]
        
        # Get all attempts
        attempts = await db.phish_finder_attempts.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(1000)
        
        if not attempts:
            return {
                "total_scenarios": 0,
                "correct_answers": 0,
                "accuracy_percentage": 0,
                "total_xp_earned": 0,
                "by_type": {}
            }
        
        # Calculate stats
        total = len(attempts)
        correct = sum(1 for a in attempts if a["correct"])
        accuracy = round((correct / total) * 100, 1)
        total_xp = sum(a["xp_earned"] for a in attempts)
        
        # Stats by type
        by_type = {}
        for attempt in attempts:
            type_key = attempt["scenario_type"]
            if type_key not in by_type:
                by_type[type_key] = {"total": 0, "correct": 0, "accuracy": 0}
            
            by_type[type_key]["total"] += 1
            if attempt["correct"]:
                by_type[type_key]["correct"] += 1
        
        # Calculate accuracy by type
        for type_key in by_type:
            total_type = by_type[type_key]["total"]
            correct_type = by_type[type_key]["correct"]
            by_type[type_key]["accuracy"] = round((correct_type / total_type) * 100, 1)
        
        return {
            "total_scenarios": total,
            "correct_answers": correct,
            "accuracy_percentage": accuracy,
            "total_xp_earned": total_xp,
            "by_type": by_type,
            "recent_attempts": attempts[-10:]
        }
        
    except Exception as e:
        logger.error(f"Error getting Phish-Finder stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get stats")

@router.get("/leaderboard")
async def get_leaderboard(limit: int = 50):
    """
    Get global Phish-Finder leaderboard.
    Ranked by accuracy percentage (minimum 10 scenarios).
    """
    try:
        # Aggregate pipeline
        pipeline = [
            {
                "$group": {
                    "_id": "$user_id",
                    "total_scenarios": {"$sum": 1},
                    "correct_answers": {
                        "$sum": {"$cond": ["$correct", 1, 0]}
                    },
                    "total_xp": {"$sum": "$xp_earned"}
                }
            },
            {
                "$match": {
                    "total_scenarios": {"$gte": 10}  # Minimum 10 scenarios
                }
            },
            {
                "$addFields": {
                    "accuracy_percentage": {
                        "$multiply": [
                            {"$divide": ["$correct_answers", "$total_scenarios"]},
                            100
                        ]
                    }
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
                    "total_scenarios": 1,
                    "correct_answers": 1,
                    "accuracy_percentage": 1,
                    "total_xp": 1
                }
            },
            {
                "$sort": {
                    "accuracy_percentage": -1,
                    "total_scenarios": -1
                }
            },
            {"$limit": limit}
        ]
        
        results = await db.phish_finder_attempts.aggregate(pipeline).to_list(limit)
        
        # Add ranks
        leaderboard = []
        for rank, entry in enumerate(results, 1):
            leaderboard.append({
                "rank": rank,
                "email": entry["email"],
                "client_id": entry.get("client_id"),
                "accuracy_percentage": round(entry["accuracy_percentage"], 1),
                "total_scenarios": entry["total_scenarios"],
                "correct_answers": entry["correct_answers"],
                "total_xp": entry["total_xp"]
            })
        
        return {
            "leaderboard": leaderboard
        }
        
    except Exception as e:
        logger.error(f"Error getting Phish-Finder leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get leaderboard")
