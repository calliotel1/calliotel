"""
Leaderboard API Routes
Endpoints for the Hall of Legends
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import logging
import sys
sys.path.append('/app/backend')
from utils.leaderboard_service import (
    get_overall_leaderboard,
    get_game_leaderboard,
    save_leaderboard_snapshot
)
from routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/overall")
async def get_overall_rankings(
    limit: int = Query(100, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """
    Get overall leaderboard ranked by total XP.
    Includes rank_change_24h from historical snapshots.
    """
    try:
        leaderboard = await get_overall_leaderboard(limit=limit)
        
        return {
            "success": True,
            "leaderboard": leaderboard,
            "count": len(leaderboard),
            "type": "overall"
        }
        
    except Exception as e:
        logger.error(f"Error getting overall leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get leaderboard")

@router.get("/game/{game_type}")
async def get_game_rankings(
    game_type: str,
    limit: int = Query(100, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """
    Get leaderboard for specific game.
    game_type: 'duel', 'speed_dialer', 'phish_finder'
    """
    try:
        if game_type not in ["duel", "speed_dialer", "phish_finder"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid game type. Must be 'duel', 'speed_dialer', or 'phish_finder'"
            )
        
        leaderboard = await get_game_leaderboard(game_type, limit=limit)
        
        return {
            "success": True,
            "leaderboard": leaderboard,
            "count": len(leaderboard),
            "type": game_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting {game_type} leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get leaderboard")

@router.post("/snapshot")
async def create_snapshot(current_user = Depends(get_current_user)):
    """
    Manually trigger leaderboard snapshot creation.
    (Normally done via daily cron at 00:00 UTC)
    Admin only.
    """
    try:
        # Check if user is admin
        if not current_user.get("is_admin", False):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        await save_leaderboard_snapshot()
        
        return {
            "success": True,
            "message": "Leaderboard snapshot saved"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating snapshot: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create snapshot")

@router.get("/my-rank")
async def get_my_rank(current_user = Depends(get_current_user)):
    """
    Get current user's rank across all leaderboards.
    """
    try:
        user_id = current_user["_id"]
        
        # Get overall leaderboard to find user's rank
        overall = await get_overall_leaderboard(limit=100)
        
        user_rank = None
        for entry in overall:
            if entry["user_id"] == user_id:
                user_rank = entry
                break
        
        if not user_rank:
            # User not in top 100
            return {
                "success": True,
                "in_top_100": False,
                "message": "Keep climbing! You're not in the top 100 yet."
            }
        
        return {
            "success": True,
            "in_top_100": True,
            "rank": user_rank["rank"],
            "total_xp": user_rank["total_xp"],
            "rank_change_24h": user_rank.get("rank_change_24h", "N/A"),
            "tier": user_rank["tier"]
        }
        
    except Exception as e:
        logger.error(f"Error getting user rank: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get rank")
