"""
Admin endpoints for managing background jobs
- Check job status
- Manually trigger jobs (for testing)
- View job history
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import logging
from routes.auth import get_current_user
from services.scheduler import (
    get_job_status,
    trigger_auto_renewals_now,
    trigger_expirations_now,
    trigger_reminders_now,
    trigger_scheduled_messages_now
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/status")
async def get_scheduler_status(current_user = Depends(get_current_user)):
    """
    Get status of all scheduled background jobs
    """
    try:
        status = get_job_status()
        return {
            "success": True,
            "scheduler": status
        }
    except Exception as e:
        logger.error(f"Error getting scheduler status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get scheduler status")


@router.post("/trigger/renewals")
async def trigger_renewals(current_user = Depends(get_current_user)):
    """
    Manually trigger auto-renewals job (for testing)
    ⚠️ Admin only - processes all due renewals immediately
    """
    try:
        logger.info(f"Manual renewal trigger by user: {current_user['email']}")
        # Run in thread pool to avoid event loop conflict
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(trigger_auto_renewals_now)
            result = future.result(timeout=60)
        
        return {
            "success": True,
            "message": "Auto-renewals job triggered",
            "result": result
        }
    except Exception as e:
        logger.error(f"Error triggering renewals: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trigger/expirations")
async def trigger_expirations(current_user = Depends(get_current_user)):
    """
    Manually trigger expirations job (for testing)
    ⚠️ Admin only - processes all due expirations immediately
    """
    try:
        logger.info(f"Manual expiration trigger by user: {current_user['email']}")
        # Run in thread pool to avoid event loop conflict
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(trigger_expirations_now)
            result = future.result(timeout=60)
        
        return {
            "success": True,
            "message": "Expirations job triggered",
            "result": result
        }
    except Exception as e:
        logger.error(f"Error triggering expirations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trigger/reminders")
async def trigger_reminders(current_user = Depends(get_current_user)):
    """
    Manually trigger renewal reminders job (for testing)
    ⚠️ Admin only - sends all due reminders immediately
    """
    try:
        logger.info(f"Manual reminder trigger by user: {current_user['email']}")
        # Run in thread pool to avoid event loop conflict
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(trigger_reminders_now)
            result = future.result(timeout=60)
        
        return {
            "success": True,
            "message": "Reminders job triggered",
            "result": result
        }
    except Exception as e:
        logger.error(f"Error triggering reminders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trigger/scheduled-messages")
async def trigger_scheduled_messages(current_user = Depends(get_current_user)):
    """
    Manually trigger scheduled messages job (for testing)
    ⚠️ Admin only - sends all due scheduled messages immediately
    """
    try:
        logger.info(f"Manual scheduled messages trigger by user: {current_user['email']}")
        # Run in thread pool to avoid event loop conflict
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(trigger_scheduled_messages_now)
            result = future.result(timeout=60)
        
        return {
            "success": True,
            "message": "Scheduled messages job triggered",
            "result": result
        }
    except Exception as e:
        logger.error(f"Error triggering scheduled messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
