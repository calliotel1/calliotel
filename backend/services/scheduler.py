"""
Background job scheduler for Calliotel
Handles automated tasks for virtual number billing, renewals, expirations, and scheduled messages
"""

import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from services.billing_jobs import (
    run_auto_renewals, 
    run_expirations, 
    run_renewal_reminders,
    run_scheduled_messages,
    run_scheduled_video_messages
)
from services.birthday_jobs import run_birthday_checks


# Import challenge winner selection
async def run_weekly_challenge_winner():
    """Run weekly challenge winner selection"""
    try:
        from routes.daily_challenges import process_weekly_winner
        result = await process_weekly_winner()
        logger.info(f"✅ Weekly challenge winner processed: {result}")
        return result
    except Exception as e:
        logger.error(f"❌ Error processing weekly winner: {str(e)}")
        return {"success": False, "error": str(e)}

logger = logging.getLogger(__name__)

# Initialize scheduler
scheduler = BackgroundScheduler(timezone='UTC')


def setup_billing_jobs():
    """
    Register all billing-related background jobs
    """
    
    # Job 1: Auto-Renewals - Run daily at 2:00 AM UTC
    scheduler.add_job(
        run_auto_renewals,
        CronTrigger(hour=2, minute=0),
        id='auto_renewals',
        name='Process Virtual Number Auto-Renewals',
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=3600  # 1 hour grace period if server was down
    )
    logger.info("✅ Scheduled: Auto-renewals job (daily at 2:00 AM UTC)")
    
    # Job 2: Expirations - Run daily at 3:00 AM UTC
    scheduler.add_job(
        run_expirations,
        CronTrigger(hour=3, minute=0),
        id='number_expirations',
        name='Process Number Expirations',
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=3600
    )
    logger.info("✅ Scheduled: Expiration job (daily at 3:00 AM UTC)")
    
    # Job 3: Renewal Reminders - Run daily at 10:00 AM UTC
    scheduler.add_job(
        run_renewal_reminders,
        CronTrigger(hour=10, minute=0),
        id='renewal_reminders',
        name='Send Renewal Reminder Emails',
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=3600
    )
    logger.info("✅ Scheduled: Renewal reminders job (daily at 10:00 AM UTC)")
    
    # Job 4: Scheduled Messages - Run every minute
    scheduler.add_job(
        run_scheduled_messages,
        IntervalTrigger(minutes=1),
        id='scheduled_messages',
        name='Send Scheduled Messages',
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=300
    )
    logger.info("✅ Scheduled: Scheduled messages job (every 1 minute)")
    
    # Job 5: Scheduled Video Messages - Run every minute
    scheduler.add_job(
        run_scheduled_video_messages,
        IntervalTrigger(minutes=1),
        id='scheduled_video_messages',
        name='Send Scheduled Video Messages',
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=300
    )
    logger.info("✅ Scheduled: Scheduled video messages job (every 1 minute)")
    
    # Job 6: Birthday Checks - Run daily at 1:00 AM UTC
    scheduler.add_job(
        run_birthday_checks,
        CronTrigger(hour=1, minute=0),
        id='birthday_checks',
        name='Check Birthdays and Send Notifications',
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=3600
    )
    logger.info("✅ Scheduled: Birthday checks job (daily at 1:00 AM UTC)")
    
    # Job 7: Weekly Challenge Winner - Run every Sunday at 11:59 PM UTC
    scheduler.add_job(
        run_weekly_challenge_winner,
        CronTrigger(day_of_week='sun', hour=23, minute=59),
        id='weekly_challenge_winner',
        name='Select Weekly Challenge Winner',
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=3600
    )
    logger.info("✅ Scheduled: Weekly challenge winner job (every Sunday at 11:59 PM UTC)")
    
    logger.info("✅ All billing jobs configured successfully")


def start_scheduler():
    """
    Start the background scheduler
    """
    try:
        setup_billing_jobs()
        scheduler.start()
        logger.info("🚀 Background job scheduler started successfully")
        logger.info(f"📅 Active jobs: {len(scheduler.get_jobs())}")
        
        # Print job details
        for job in scheduler.get_jobs():
            logger.info(f"   - {job.name} (ID: {job.id}) - Next run: {job.next_run_time}")
        
        return True
    except Exception as e:
        logger.error(f"❌ Failed to start scheduler: {str(e)}")
        return False


def stop_scheduler():
    """
    Stop the background scheduler
    """
    try:
        scheduler.shutdown(wait=False)
        logger.info("⏹️ Background job scheduler stopped")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to stop scheduler: {str(e)}")
        return False


def get_job_status():
    """
    Get status of all scheduled jobs
    """
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run_time": str(job.next_run_time),
            "trigger": str(job.trigger)
        })
    return {
        "running": scheduler.running,
        "jobs": jobs,
        "total_jobs": len(jobs)
    }


# Manual trigger endpoints (for testing)
def trigger_auto_renewals_now():
    """Manually trigger auto-renewals job (for testing)"""
    logger.info("🔧 Manually triggering auto-renewals job...")
    return run_auto_renewals()


def trigger_expirations_now():
    """Manually trigger expirations job (for testing)"""
    logger.info("🔧 Manually triggering expirations job...")
    return run_expirations()


def trigger_reminders_now():
    """Manually trigger reminders job (for testing)"""
    logger.info("🔧 Manually triggering reminders job...")
    return run_renewal_reminders()


def trigger_scheduled_messages_now():
    """Manually trigger scheduled messages job (for testing)"""
    logger.info("🔧 Manually triggering scheduled messages job...")
    return run_scheduled_messages()

