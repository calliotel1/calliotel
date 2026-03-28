from fastapi import FastAPI, APIRouter, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone
from contextlib import asynccontextmanager


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging for production (Kubernetes-friendly)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Output to stdout for K8s log collection
    ]
)
logger = logging.getLogger(__name__)

# Import shared MongoDB client and database
from database import client, db

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize background scheduler
    logger.info("🚀 Starting Calliotel backend...")
    
    # Verify MongoDB connection before starting scheduler
    try:
        # Ping database to ensure connection is alive
        await client.admin.command('ping')
        logger.info(f"✅ MongoDB connected: {os.environ.get('DB_NAME', 'default')}")
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {str(e)}")
        # Continue startup even if MongoDB is temporarily unavailable
    
    # Start background scheduler in non-blocking mode
    try:
        from services.scheduler import start_scheduler
        scheduler_started = start_scheduler()
        if scheduler_started:
            logger.info("✅ Background job scheduler initialized")
        else:
            logger.warning("⚠️ Background job scheduler failed to start")
    except Exception as e:
        logger.error(f"❌ Error starting scheduler: {str(e)}")
    
    # Signal that startup is complete (important for K8s readiness probe)
    logger.info("✅ Calliotel backend startup complete - ready to serve requests")
    
    yield
    
    # Shutdown: Stop background scheduler
    logger.info("⏹️ Shutting down Calliotel backend...")
    try:
        from services.scheduler import stop_scheduler
        stop_scheduler()
        logger.info("✅ Background job scheduler stopped")
    except Exception as e:
        logger.error(f"❌ Error stopping scheduler: {str(e)}")
    
    # Close MongoDB connection
    client.close()
    logger.info("✅ MongoDB connection closed")

# Create the main app without a prefix
app = FastAPI(lifespan=lifespan)

# Import Error Filter Middleware (WHITE-LABEL PROTECTION)
from middleware.error_filter import ErrorFilterMiddleware

# Cookie Reset Middleware - Forces clean state for users with old sessions
class CookieResetMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Current deployment version
        CURRENT_VERSION = os.environ.get('APP_VERSION', 'v1.0.1_fortress')
        
        # Check if user has already been updated
        visitor_version = request.cookies.get("app_version")
        
        response = await call_next(request)
        
        # If version mismatch or missing, clear old cookies
        if visitor_version != CURRENT_VERSION:
            # List of cookies to clear (add any session/auth cookies)
            cookies_to_clear = ["session", "access_token", "fastapiusersauth", "token"]
            
            for cookie in cookies_to_clear:
                response.delete_cookie(
                    key=cookie,
                    path="/",
                    domain=None  # Auto-detects domain
                )
            
            # Mark user as updated (prevent repeated clears)
            response.set_cookie(
                key="app_version",
                value=CURRENT_VERSION,
                httponly=True,
                max_age=31536000,  # 1 year
                samesite="lax"
            )
            
            # Signal frontend to clear localStorage
            response.headers["X-Clear-LocalStorage"] = "true"
            
            logger.info(f"🔄 Cookie reset performed for version: {CURRENT_VERSION}")
        
        return response

# Register cookie reset middleware FIRST (before CORS)
app.add_middleware(CookieResetMiddleware)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    """Root endpoint - instant response for K8s probes"""
    return {"message": "Fortress Active", "status": "operational"}

@api_router.get("/health")
async def health_check():
    """
    ULTRA-FAST health check - NO database calls
    Returns immediately (<10ms) for K8s health probes
    Use /health/full for detailed check including database
    """
    return {
        "status": "alive",
        "service": "calliotel-backend",
        "version": "1.0.0"
    }

@api_router.get("/health/full")
async def health_check_full():
    """
    Full health check with database ping
    Use this for detailed diagnostics, not for K8s probes
    """
    health_status = {
        "status": "healthy",
        "service": "calliotel-backend",
        "version": "1.0.0"
    }
    
    # Quick database ping (non-blocking with timeout)
    try:
        await client.admin.command('ping', maxTimeMS=1000)
        health_status["database"] = "connected"
    except Exception as e:
        # Don't fail health check if DB is slow, just report status
        health_status["database"] = "timeout"
        logger.warning(f"Health check: DB ping timeout - {str(e)}")
    
    return health_status

@api_router.get("/readiness")
async def readiness_check():
    """
    Kubernetes readiness probe - INSTANT response
    Confirms app is ready to serve traffic
    """
    return {"ready": True}

@api_router.get("/liveness")
async def liveness_check():
    """
    Kubernetes liveness probe - INSTANT response
    Confirms app is still alive
    """
    return {"alive": True}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

# Add TRUE root endpoint (no /api prefix) for K8s probes
@app.get("/")
async def true_root():
    """True root endpoint for K8s/load balancer probes"""
    return {"message": "Calliotel Digital Fortress", "status": "active"}

@app.get("/health")
async def true_health():
    """Root-level health check for K8s (no /api prefix)"""
    return {"status": "alive", "service": "calliotel"}

# Include authentication router
from routes import auth
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

# Include number management router
from routes import number_management
app.include_router(number_management.router, prefix="/api/numbers", tags=["Number Management"])

# Include smart purchase router (SMART BALANCE LOGIC)
from routes import smart_purchase
app.include_router(smart_purchase.router, prefix="/api/numbers", tags=["Smart Purchase"])

# Include SMS router
from routes import sms
app.include_router(sms.router, prefix="/api/sms", tags=["SMS"])

# Include BulkSMS router
from routes import bulksms
app.include_router(bulksms.router, prefix="/api/bulksms", tags=["BulkSMS Notifications"])

# Include calls router
from routes import calls
app.include_router(calls.router, prefix="/api/calls", tags=["Calls"])

# Include wallet router
from routes import wallet
app.include_router(wallet.router, prefix="/api/wallet", tags=["Wallet"])

# Include Emergent Auth router
from routes import emergent_auth
app.include_router(emergent_auth.router, prefix="/api/auth/emergent", tags=["Emergent OAuth"])

# Include Email Verification router
from routes import email_verification
app.include_router(email_verification.router, prefix="/api/email", tags=["Email Verification"])

# Include Payments router
from routes import payments
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])

# Include Telecom router (NEW - Integrated Backend!)
from routes import telecom
app.include_router(telecom.router)

# Include SMM Reseller router (NEW - SMM Empire Expansion!)
from routes import smm
app.include_router(smm.router)

# Include Sonetel Virtual Numbers router (NEW - Monthly Renewable Numbers!)
from routes import sonetel
app.include_router(sonetel.router, prefix="/api/sonetel", tags=["Sonetel Virtual Numbers"])

# Include Contacts router
from routes import contacts
app.include_router(contacts.router, prefix="/api/contacts", tags=["Contacts"])

# Include Referrals router
from routes import referrals
app.include_router(referrals.router, prefix="/api/referrals", tags=["Referrals"])

# Include Chat router
from routes import chat
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

# Include SMS Automation router
from routes import sms_automation
app.include_router(sms_automation.router, prefix="/api/sms-automation", tags=["SMS Automation"])

# Include Analytics router
from routes import analytics
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

from routes import sms_automation
app.include_router(sms_automation.router, prefix="/api/sms-automation", tags=["SMS Automation"])

# Include Gamification router
from routes import gamification
app.include_router(gamification.router, prefix="/api/gamification", tags=["Gamification"])

# Include Speed Dialer Game router
from routes import speed_dialer
app.include_router(speed_dialer.router, prefix="/api/game/speed-dialer", tags=["Speed Dialer Game"])

# Include Duel System router
from routes import duel
app.include_router(duel.router, prefix="/api/game/duel", tags=["Duel System"])

# Include Phish-Finder Game router
from routes import phish_finder
app.include_router(phish_finder.router, prefix="/api/game/phish-finder", tags=["Phish-Finder Game"])

# Include Game Challenges router (Chat-to-Game Bridge)
from routes import game_challenges
app.include_router(game_challenges.router, prefix="/api/game/challenge", tags=["Game Challenges"])

# Include Profile Management router (Combat Card, Avatar, Mood)
from routes import profile
app.include_router(profile.router, prefix="/api/profile", tags=["Profile Management"])

# Include Co-Op Stack Game router
from routes import coop_stack
app.include_router(coop_stack.router, prefix="/api/coop", tags=["Co-Op Stack Game"])

# Include Leaderboard router
from routes import leaderboard
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["Leaderboard - Hall of Legends"])

# Include Global Square router
from routes import global_square
app.include_router(global_square.router, prefix="/api/global-square", tags=["Global Square - Social Layer"])


# Include Co-Op Stack router (Multiplayer Game)
from routes import coop_stack
app.include_router(coop_stack.router, prefix="/api/coop", tags=["Co-Op Stack Game"])

# Include Spam Protection router
from routes import spam_protection
app.include_router(spam_protection.router, prefix="/api/spam", tags=["Spam Protection"])

# Include Public API router
from routes import public_api
app.include_router(public_api.router, prefix="/api/public-api", tags=["Public API"])

# Include AI Assistant router
from routes import ai_assistant
app.include_router(ai_assistant.router, prefix="/api/ai", tags=["AI Assistant"])

# Include Teams router
from routes import teams
app.include_router(teams.router, prefix="/api/teams", tags=["Team Accounts"])

# Include Voicemail router
from routes import voicemail
app.include_router(voicemail.router, prefix="/api/voicemail", tags=["Voicemail & Recording"])

# Include USDT Payments router
from routes import usdt_payments
app.include_router(usdt_payments.router, prefix="/api/usdt", tags=["USDT TRC20 Payments"])

# Include Birthday Feature router
from routes import birthdays
app.include_router(birthdays.router, prefix="/api/birthdays", tags=["Birthday Features"])

# Include Webhooks router
from routes import webhooks
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])

# Include NorthSMS Platform Verification router
from routes import northsms_routes
app.include_router(northsms_routes.router)

# Include support chat router
from routes import support_chat
app.include_router(support_chat.router, prefix="/api/support", tags=["Support Chat"])

# Include privacy settings router
from routes import privacy_settings

# Include premium numbers router
from routes import premium_numbers
app.include_router(premium_numbers.router, prefix="/api", tags=["Premium Numbers"])

# Include credit packages router

# Include reseller API router
from routes import reseller_api

# Include Telnyx integration routers
from routes import telnyx_numbers, telnyx_sms
app.include_router(telnyx_numbers.router, prefix="/api", tags=["Telnyx Numbers"])
app.include_router(telnyx_sms.router, prefix="/api", tags=["Telnyx SMS"])

app.include_router(reseller_api.router, prefix="/api", tags=["Reseller API"])

from routes import credit_packages
app.include_router(credit_packages.router, prefix="/api", tags=["Credit Packages"])

app.include_router(privacy_settings.router, prefix="/api/settings", tags=["Privacy Settings"])



# Include Notifications router
from routes import notifications
app.include_router(notifications.router, prefix="/api/notifications", tags=["Broadcast Notifications"])

# Include Daily Challenges router
from routes import daily_challenges
app.include_router(daily_challenges.router, prefix="/api/challenges", tags=["Daily Challenges"])

# Include Trust Stats router
from routes import trust_stats
app.include_router(trust_stats.router, prefix="/api/stats", tags=["Trust Stats"])

# Include Coverage router
from routes import coverage
app.include_router(coverage.router, prefix="/api", tags=["Coverage"])

# Include Live Numbers router
from routes import live_numbers
app.include_router(live_numbers.router, prefix="/api", tags=["Live Numbers"])


# Include Password Reset router
from routes import password_reset

# Include Streak System router
from routes import streaks

# Include Media Upload router
from routes import media

# Include Chat Stats router
from routes import chat_stats

# Include Chat Wrapped router
from routes import chat_wrapped

# Include Channels router
from routes import channels

# Include Posts router
from routes import posts

# Include Feed router
from routes import feed

# Include Stories router
from routes import stories

# Include Notification Settings router
from routes import notification_settings

# Include Push Notifications router
from routes import push_notifications

# Include Theme Settings router
from routes import theme_settings

# Include Voice Notes router
from routes import voice_notes

app.include_router(media.router, prefix="/api/media", tags=["Media & Stickers"])
app.include_router(chat_stats.router, prefix="/api/chat", tags=["Chat Statistics"])
app.include_router(chat_wrapped.router, prefix="/api/wrapped", tags=["Chat Wrapped"])
app.include_router(channels.router, prefix="/api/channels", tags=["Channels"])
app.include_router(posts.router, prefix="/api/posts", tags=["Posts & Feed"])
app.include_router(feed.router, prefix="/api/feed", tags=["Intelligent Feed"])

# Serve static media files
from fastapi.staticfiles import StaticFiles
app.mount("/media", StaticFiles(directory="/app/media"), name="media")

app.include_router(streaks.router, prefix="/api/streaks", tags=["Streak System"])
app.include_router(stories.router, prefix="/api/stories", tags=["Stories Feature"])
app.include_router(notification_settings.router, prefix="/api/notifications/settings", tags=["Notification Settings"])
app.include_router(push_notifications.router, prefix="/api/push", tags=["Push Notifications"])
app.include_router(theme_settings.router, prefix="/api/theme", tags=["Theme Settings"])
app.include_router(voice_notes.router, prefix="/api/voice", tags=["Voice Notes"])

# AI Features (Smart Replies, Translation) - mounted at /api/ai-chat to avoid conflict with /api/ai
from routes import ai_features
app.include_router(ai_features.router, prefix="/api/ai-chat", tags=["AI Chat Features"])

# AI Settings
from routes import ai_settings
app.include_router(ai_settings.router, prefix="/api/ai-settings", tags=["AI Settings"])

app.include_router(password_reset.router, prefix="/api/password", tags=["Password Reset"])

# Include Telnyx routers
from routes import phone_numbers, messaging
app.include_router(phone_numbers.router, prefix="/api/telnyx/phone-numbers", tags=["Telnyx Phone Numbers"])
app.include_router(messaging.router, prefix="/api/telnyx/messaging", tags=["Telnyx Messaging"])

# Include Number Intelligence router
from routes import number_intelligence
app.include_router(number_intelligence.router, prefix="/api/number-intelligence", tags=["Number Intelligence"])

# Include Admin Jobs router (for background job management)
from routes import admin_jobs
app.include_router(admin_jobs.router, prefix="/api/admin/jobs", tags=["Admin - Background Jobs"])

# Include Voice Changer router (Premium Feature)
from routes import voice_changer
app.include_router(voice_changer.router, prefix="/api/voice-changer", tags=["Voice Changer"])

# Include Scheduled Messages router (NEW!)
from routes import scheduled_messages
from routes import video_messages
from routes import story_empire
from routes import voice_marketplace
from routes import time_machine
from routes import video_chat
from routes import live_streaming
from routes import avatar_creator
from routes import hologram_messages
from routes import music_generator
from routes import kids_mode
from routes import video_reactions
from routes import admin
app.include_router(scheduled_messages.router, prefix="/api/scheduled-messages", tags=["Scheduled Messages"])
app.include_router(video_messages.router, prefix="/api/video-messages", tags=["Video Messages"])
app.include_router(video_reactions.router, prefix="/api/video-reactions", tags=["Video Reactions & Views"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(story_empire.router, prefix="/api/story-empire", tags=["Story Empire"])
app.include_router(voice_marketplace.router, prefix="/api/voice-marketplace", tags=["Voice Marketplace"])
app.include_router(time_machine.router, prefix="/api/time-machine", tags=["Time Machine"])
app.include_router(video_chat.router, prefix="/api/video-chat", tags=["Video Chat"])
app.include_router(live_streaming.router, prefix="/api/live-streaming", tags=["Live Streaming"])
app.include_router(avatar_creator.router, prefix="/api/avatar-creator", tags=["3D Avatars"])
app.include_router(hologram_messages.router, prefix="/api/hologram-messages", tags=["Hologram Messages"])
app.include_router(music_generator.router, prefix="/api/music-generator", tags=["AI Music Generator"])
app.include_router(kids_mode.router, prefix="/api/kids-mode", tags=["Kids Mode"])

# Include Verification Checkout router (NEW - Revenue Stream)
from routes import verification_checkout
app.include_router(verification_checkout.router, tags=["Verification Purchase"])

# Add Error Filter Middleware FIRST (before CORS) to mask provider names
app.add_middleware(ErrorFilterMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    # Production-ready CORS: Parse origins from .env, support wildcards
    allow_origins=[origin.strip() for origin in os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')],
    allow_origin_regex=r"https://.*\.(emergent\.host|emergentagent\.com)",  # Allow all Emergent subdomains
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)