from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# AI Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Models
class MessageAnalysisRequest(BaseModel):
    message: str

class SmartReplyRequest(BaseModel):
    conversation_context: List[str]
    max_suggestions: int = 3

class CategoryPrediction(BaseModel):
    message: str

# AI Smart Reply
@router.post("/smart-reply")
async def generate_smart_replies(request: SmartReplyRequest, current_user = Depends(get_current_user)):
    """
    Generate AI-powered smart reply suggestions.
    """
    try:
        # Create context from conversation
        context = "\n".join(request.conversation_context[-5:])  # Last 5 messages
        
        # Initialize AI chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"smart_reply_{current_user['_id']}",
            system_message="You are a helpful assistant that generates short, appropriate SMS reply suggestions. Keep replies under 160 characters."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"""Based on this conversation, suggest {request.max_suggestions} short, natural reply options:

Conversation:
{context}

Provide {request.max_suggestions} different reply suggestions, each on a new line. Make them diverse (professional, casual, friendly).
Format: Just the replies, one per line, no numbering or extra text."""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        # Parse suggestions
        suggestions = [s.strip() for s in response.strip().split('\n') if s.strip()][:request.max_suggestions]
        
        return {
            "success": True,
            "suggestions": suggestions
        }
    except Exception as e:
        logger.error(f"Error generating smart replies: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate smart replies")

# Message Summarization
@router.post("/summarize")
async def summarize_conversation(messages: List[str], current_user = Depends(get_current_user)):
    """
    Summarize a conversation using AI.
    """
    try:
        conversation = "\n".join(messages)
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"summarize_{current_user['_id']}",
            system_message="You are a helpful assistant that summarizes conversations concisely."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"""Summarize this SMS conversation in 2-3 sentences:

{conversation}

Summary:"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        return {
            "success": True,
            "summary": response.strip()
        }
    except Exception as e:
        logger.error(f"Error summarizing conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to summarize conversation")

# Sentiment Analysis
@router.post("/sentiment")
async def analyze_sentiment(request: MessageAnalysisRequest, current_user = Depends(get_current_user)):
    """
    Analyze sentiment of a message.
    """
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"sentiment_{current_user['_id']}",
            system_message="You are a sentiment analysis expert. Respond with ONLY one word: positive, negative, or neutral."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"Analyze the sentiment of this message: '{request.message}'"
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        sentiment = response.strip().lower()
        
        # Map to emoji
        emoji_map = {
            "positive": "😊",
            "negative": "😔",
            "neutral": "😐"
        }
        
        return {
            "success": True,
            "sentiment": sentiment,
            "emoji": emoji_map.get(sentiment, "😐"),
            "message": request.message
        }
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze sentiment")

# Auto-Categorization
@router.post("/categorize")
async def categorize_message(request: CategoryPrediction, current_user = Depends(get_current_user)):
    """
    Automatically categorize a message.
    """
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"categorize_{current_user['_id']}",
            system_message="You categorize messages. Respond with ONLY one category: personal, work, promotional, transactional, or spam."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"Categorize this message: '{request.message}'"
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        category = response.strip().lower()
        
        # Category colors and icons
        category_info = {
            "personal": {"color": "blue", "icon": "👤"},
            "work": {"color": "purple", "icon": "💼"},
            "promotional": {"color": "orange", "icon": "📢"},
            "transactional": {"color": "green", "icon": "💳"},
            "spam": {"color": "red", "icon": "🚫"}
        }
        
        return {
            "success": True,
            "category": category,
            "info": category_info.get(category, {"color": "gray", "icon": "📝"})
        }
    except Exception as e:
        logger.error(f"Error categorizing message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to categorize message")

# Smart Compose
@router.post("/compose")
async def smart_compose(prompt: str, tone: str = "professional", current_user = Depends(get_current_user)):
    """
    AI-powered message composition.
    """
    try:
        tone_prompts = {
            "professional": "formal and professional",
            "casual": "casual and friendly",
            "friendly": "warm and friendly",
            "formal": "very formal and polite"
        }
        
        tone_desc = tone_prompts.get(tone, "professional")
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"compose_{current_user['_id']}",
            system_message=f"You are a helpful assistant that writes {tone_desc} SMS messages. Keep messages under 160 characters."
        ).with_model("openai", "gpt-4o")
        
        message_prompt = f"Write a {tone_desc} SMS message about: {prompt}"
        
        message = UserMessage(text=message_prompt)
        response = await chat.send_message(message)
        
        return {
            "success": True,
            "composed_message": response.strip(),
            "tone": tone
        }
    except Exception as e:
        logger.error(f"Error composing message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to compose message")

# Enhanced Spam Detection
@router.post("/spam-check")
async def ai_spam_check(request: MessageAnalysisRequest, current_user = Depends(get_current_user)):
    """
    AI-powered spam detection (more accurate than keyword matching).
    """
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"spam_check_{current_user['_id']}",
            system_message="You are a spam detection expert. Analyze if a message is spam. Respond with ONLY 'spam' or 'not spam' followed by a brief reason."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"Is this message spam? Message: '{request.message}'"
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        is_spam = "spam" in response.lower() and "not spam" not in response.lower()
        
        return {
            "success": True,
            "is_spam": is_spam,
            "confidence": "high" if is_spam else "low",
            "reason": response.strip(),
            "message": request.message
        }
    except Exception as e:
        logger.error(f"Error checking spam: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check spam")

# Translation
@router.post("/translate")
async def translate_message(message: str, target_language: str, current_user = Depends(get_current_user)):
    """
    Translate message to target language.
    """
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"translate_{current_user['_id']}",
            system_message=f"You are a translator. Translate text to {target_language}. Respond with ONLY the translation."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"Translate to {target_language}: {message}"
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {
            "success": True,
            "original": message,
            "translated": response.strip(),
            "target_language": target_language
        }
    except Exception as e:
        logger.error(f"Error translating message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to translate message")

# Message Enhancement
@router.post("/enhance")
async def enhance_message(request: MessageAnalysisRequest, current_user = Depends(get_current_user)):
    """
    Improve message grammar, clarity, and professionalism.
    """
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"enhance_{current_user['_id']}",
            system_message="You improve messages by fixing grammar, clarity, and professionalism while keeping the meaning. Keep it under 160 characters."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"Improve this message: '{request.message}'"
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        return {
            "success": True,
            "original": request.message,
            "enhanced": response.strip()
        }
    except Exception as e:
        logger.error(f"Error enhancing message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to enhance message")

# AI Stats
@router.get("/stats")
async def get_ai_stats(current_user = Depends(get_current_user)):
    """
    Get AI assistant usage statistics.
    """
    try:
        user_id = current_user["_id"]
        
        # Count AI-assisted actions (would track in production)
        # For now, return sample stats
        
        return {
            "success": True,
            "stats": {
                "smart_replies_generated": 0,
                "messages_summarized": 0,
                "sentiment_analyses": 0,
                "spam_checks": 0,
                "translations": 0,
                "messages_enhanced": 0
            },
            "note": "AI features available and ready to use"
        }
    except Exception as e:
        logger.error(f"Error getting AI stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get AI stats")
