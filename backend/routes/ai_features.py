"""
AI Features Router
Smart Replies and Translation powered by OpenAI
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
import os
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from routes.auth import get_current_user
import asyncio

load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter()

# Get Emergent LLM Key
EMERGENT_KEY = os.getenv("EMERGENT_LLM_KEY")

# Import gamification functions
async def update_user_stat(user_id: str, stat_name: str, increment: int = 1):
    try:
        from routes.gamification import update_stat
        await update_stat(user_id, stat_name, increment)
    except Exception as e:
        logger.error(f"Error updating stat: {e}")

class SmartRepliesRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []
    language: Optional[str] = "en"
    ai_tone: Optional[str] = "friendly"  # friendly, professional, casual

class TranslateRequest(BaseModel):
    text: str
    target_language: str
    source_language: Optional[str] = None

@router.post("/smart-replies")
async def generate_smart_replies(
    request: SmartRepliesRequest,
    current_user = Depends(get_current_user)
):
    """
    Generate 3 smart reply suggestions based on the received message
    """
    try:
        # Build context from conversation history
        context = ""
        if request.conversation_history:
            recent_messages = request.conversation_history[-5:]  # Last 5 messages
            context = "\n".join([
                f"{'You' if msg.get('is_me') else 'Friend'}: {msg.get('content', '')}"
                for msg in recent_messages
            ])
        
        # Create prompt for smart replies based on tone
        tone_instructions = {
            "friendly": "warm, casual, and friendly",
            "professional": "formal, professional, and business-appropriate",
            "casual": "relaxed, informal, and laid-back"
        }
        
        tone_style = tone_instructions.get(request.ai_tone, "friendly and natural")
        
        # Create prompt for smart replies
        prompt = f"""You are a helpful assistant that suggests quick, natural reply options.

Recent conversation:
{context}

Latest message: "{request.message}"

Generate 3 diverse, natural reply suggestions that someone might send in response. Make them:
1. Concise (under 15 words each)
2. {tone_style} in tone
3. Diverse in approach
4. Contextually appropriate

Return ONLY the 3 replies, one per line, without numbering or extra formatting."""

        # Generate replies using LlmChat
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"smart_replies_{current_user['_id']}",
            system_message="You are a helpful assistant that generates smart reply suggestions."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse the response
        reply_text = response.strip()
        suggestions = [line.strip() for line in reply_text.split('\n') if line.strip()]
        
        # Ensure we have exactly 3 suggestions
        suggestions = suggestions[:3]
        while len(suggestions) < 3:
            suggestions.append("Thanks!")
        
        logger.info(f"Generated {len(suggestions)} smart replies for user {current_user['_id']}")
        
        # Track smart replies usage
        asyncio.create_task(update_user_stat(current_user['_id'], "smart_replies_used", 1))
        
        return {
            "success": True,
            "suggestions": suggestions
        }
        
    except Exception as e:
        logger.error(f"Error generating smart replies: {str(e)}")
        # Return fallback suggestions on error
        return {
            "success": True,
            "suggestions": [
                "Thanks!",
                "Sounds good!",
                "Got it 👍"
            ],
            "fallback": True
        }

@router.post("/translate")
async def translate_message(
    request: TranslateRequest,
    current_user = Depends(get_current_user)
):
    """
    Translate text to target language
    """
    try:
        # Detect source language if not provided
        source_info = f" from {request.source_language}" if request.source_language else ""
        
        # Create translation prompt
        prompt = f"""Translate the following text{source_info} to {request.target_language}.
Return ONLY the translated text without any explanation or additional formatting.

Text to translate: "{request.text}"

Translation:"""

        # Generate translation using LlmChat
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"translate_{current_user['_id']}",
            system_message="You are a professional translator."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        translated_text = response.strip()
        
        # Remove quotes if present
        if translated_text.startswith('"') and translated_text.endswith('"'):
            translated_text = translated_text[1:-1]
        
        logger.info(f"Translated message for user {current_user['_id']}")
        
        # Track translation usage
        asyncio.create_task(update_user_stat(current_user['_id'], "translations_used", 1))
        
        return {
            "success": True,
            "original": request.text,
            "translated": translated_text,
            "target_language": request.target_language
        }
        
    except Exception as e:
        logger.error(f"Error translating message: {str(e)}")
        raise HTTPException(status_code=500, detail="Translation failed")

@router.post("/detect-language")
async def detect_language(
    text: str,
    current_user = Depends(get_current_user)
):
    """
    Detect the language of the given text
    """
    try:
        prompt = f"""Detect the language of this text and respond with ONLY the language name in English.

Text: "{text}"

Language:"""

        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"detect_lang_{current_user['_id']}",
            system_message="You are a language detector."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        language = response.strip()
        
        return {
            "success": True,
            "language": language
        }
        
    except Exception as e:
        logger.error(f"Error detecting language: {str(e)}")
        raise HTTPException(status_code=500, detail="Language detection failed")
