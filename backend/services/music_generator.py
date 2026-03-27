"""
AI Music Generator Service
Generates or selects background music for story videos
"""

import os
import logging
from pathlib import Path
import requests
from typing import Optional
import random

logger = logging.getLogger(__name__)

# Music storage
MUSIC_LIBRARY_DIR = Path("/app/backend/music_library")
MUSIC_LIBRARY_DIR.mkdir(parents=True, exist_ok=True)

# Music genres and their characteristics
MUSIC_GENRES = {
    "epic": {
        "name": "Epic Adventure",
        "icon": "⚔️",
        "description": "Heroic, grand orchestral music",
        "keywords": ["adventure", "hero", "battle", "quest", "brave", "knight"]
    },
    "calm": {
        "name": "Peaceful",
        "icon": "🌸",
        "description": "Soft, relaxing ambient music",
        "keywords": ["peaceful", "calm", "gentle", "quiet", "serene", "tranquil"]
    },
    "happy": {
        "name": "Happy & Upbeat",
        "icon": "☀️",
        "description": "Cheerful, positive energy",
        "keywords": ["happy", "joy", "fun", "cheerful", "bright", "celebration"]
    },
    "scary": {
        "name": "Suspenseful",
        "icon": "👻",
        "description": "Dark, mysterious atmosphere",
        "keywords": ["scary", "dark", "mystery", "horror", "spooky", "fear"]
    },
    "romantic": {
        "name": "Romantic",
        "icon": "💕",
        "description": "Love, emotional, heartfelt",
        "keywords": ["love", "romance", "heart", "passion", "kiss", "together"]
    },
    "fantasy": {
        "name": "Magical Fantasy",
        "icon": "✨",
        "description": "Whimsical, enchanting melodies",
        "keywords": ["magic", "fantasy", "fairy", "wizard", "enchanted", "mystical"]
    },
    "dramatic": {
        "name": "Dramatic",
        "icon": "🎭",
        "description": "Intense, emotional moments",
        "keywords": ["dramatic", "intense", "powerful", "emotional", "climax"]
    },
    "playful": {
        "name": "Playful & Fun",
        "icon": "🎪",
        "description": "Light, bouncy, comedic",
        "keywords": ["funny", "playful", "silly", "comedy", "laugh", "joke"]
    },
    "inspirational": {
        "name": "Inspirational",
        "icon": "🌟",
        "description": "Uplifting, motivational",
        "keywords": ["inspire", "hope", "dream", "achieve", "success", "rise"]
    },
    "cinematic": {
        "name": "Cinematic",
        "icon": "🎬",
        "description": "Movie-like, professional score",
        "keywords": ["movie", "cinema", "film", "scene", "dramatic"]
    }
}


def detect_story_mood(story_text: str) -> str:
    """
    Auto-detect the mood/genre from story text
    Returns the best matching genre ID
    """
    story_lower = story_text.lower()
    
    # Count keyword matches for each genre
    genre_scores = {}
    for genre_id, genre_info in MUSIC_GENRES.items():
        score = 0
        for keyword in genre_info["keywords"]:
            score += story_lower.count(keyword)
        genre_scores[genre_id] = score
    
    # Return genre with highest score
    best_genre = max(genre_scores, key=genre_scores.get)
    
    # If no clear winner, default to cinematic
    if genre_scores[best_genre] == 0:
        return "cinematic"
    
    return best_genre


async def get_background_music(genre: str = "auto", story_text: str = "") -> Optional[Path]:
    """
    Get background music for a story
    
    Args:
        genre: Music genre ID or "auto" for auto-detection
        story_text: Story text for auto-detection
    
    Returns:
        Path to music file or None
    """
    try:
        # Auto-detect genre if needed
        if genre == "auto" and story_text:
            genre = detect_story_mood(story_text)
            logger.info(f"Auto-detected music genre: {genre}")
        
        # For now, we'll use royalty-free music library
        # In production, integrate with music generation API like:
        # - Soundraw.io
        # - Mubert API
        # - AIVA API
        
        # For MVP: Use pre-downloaded royalty-free tracks
        music_file = MUSIC_LIBRARY_DIR / f"{genre}.mp3"
        
        # If music file doesn't exist, use a default
        if not music_file.exists():
            logger.warning(f"Music file not found for genre {genre}, using default")
            # Return None for now - we'll add default music files later
            return None
        
        return music_file
        
    except Exception as e:
        logger.error(f"Error getting background music: {str(e)}")
        return None


def create_default_music_library():
    """
    Create placeholder music files (silence)
    In production, replace with real royalty-free music
    """
    try:
        import subprocess
        
        for genre_id in MUSIC_GENRES.keys():
            music_file = MUSIC_LIBRARY_DIR / f"{genre_id}.mp3"
            
            if not music_file.exists():
                # Create 30 seconds of silence as placeholder
                # In production, use real music tracks
                subprocess.run([
                    'ffmpeg', '-y',
                    '-f', 'lavfi',
                    '-i', 'anullsrc=r=44100:cl=stereo',
                    '-t', '30',
                    '-acodec', 'libmp3lame',
                    '-b:a', '128k',
                    str(music_file)
                ], capture_output=True)
        
        logger.info("Default music library created")
        
    except Exception as e:
        logger.error(f"Error creating default music library: {str(e)}")


# Create default library on import
create_default_music_library()


def get_music_genres():
    """Get list of available music genres"""
    return [
        {
            "id": genre_id,
            "name": info["name"],
            "icon": info["icon"],
            "description": info["description"]
        }
        for genre_id, info in MUSIC_GENRES.items()
    ]
