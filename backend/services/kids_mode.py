"""
Story Empire for Kids - Special kid-friendly mode
Features:
- Extra strict content filtering
- Animated character styles
- Fairy tale templates
- Age-appropriate themes
"""

# Fairy Tale Templates
FAIRY_TALE_TEMPLATES = [
    {
        "id": "brave_hero",
        "title": "The Brave Hero",
        "icon": "🦸",
        "prompt": "Once upon a time, there was a brave {hero_name} who lived in {place}. One day, they discovered {problem} and decided to {action}. After a great adventure, they {resolution} and everyone lived happily ever after!",
        "variables": ["hero_name", "place", "problem", "action", "resolution"]
    },
    {
        "id": "magical_friend",
        "title": "The Magical Friend",
        "icon": "✨",
        "prompt": "In a magical forest lived a {creature} named {name}. They had the special power to {power}. When {friend} needed help, {name} used their magic to {help_action}. From that day on, they were the best of friends!",
        "variables": ["creature", "name", "power", "friend", "help_action"]
    },
    {
        "id": "lost_treasure",
        "title": "The Lost Treasure",
        "icon": "💎",
        "prompt": "{character} found an old map leading to a hidden treasure in {location}. Along the way, they met {helper} who joined the adventure. Together they solved puzzles, crossed {obstacle}, and found the treasure: {treasure}!",
        "variables": ["character", "location", "helper", "obstacle", "treasure"]
    },
    {
        "id": "animal_adventure",
        "title": "Animal Adventure",
        "icon": "🦊",
        "prompt": "In the {habitat}, lived a {animal} who dreamed of {dream}. One day, {animal} met a wise {wise_animal} who taught them about {lesson}. {animal} learned that {moral} and achieved their dream!",
        "variables": ["habitat", "animal", "dream", "wise_animal", "lesson", "moral"]
    },
    {
        "id": "bedtime_story",
        "title": "Bedtime Story",
        "icon": "🌙",
        "prompt": "As the moon rose high in the sky, little {character} got ready for bed. But before sleeping, {magical_thing} appeared and took them on a gentle journey to {dreamland}. They met {friend} and {adventure}. When morning came, {character} woke up with the sweetest dreams!",
        "variables": ["character", "magical_thing", "dreamland", "friend", "adventure"]
    }
]

# Kid-friendly image styles
KID_IMAGE_STYLES = [
    {
        "id": "cartoon",
        "name": "Cartoon",
        "icon": "🎨",
        "prompt_suffix": "colorful cartoon style, bright colors, cute characters, simple shapes"
    },
    {
        "id": "storybook",
        "name": "Storybook",
        "icon": "📚",
        "prompt_suffix": "beautiful storybook illustration, watercolor, soft colors, whimsical"
    },
    {
        "id": "animated",
        "name": "Animated",
        "icon": "🎬",
        "prompt_suffix": "3D animated movie style, Pixar-like, adorable characters, vibrant"
    },
    {
        "id": "kawaii",
        "name": "Kawaii",
        "icon": "🌸",
        "prompt_suffix": "kawaii style, super cute, big eyes, pastel colors, adorable"
    }
]

# Extra kid-safe keywords to block
KID_UNSAFE_KEYWORDS = [
    "fight", "hurt", "pain", "scary", "monster", "evil", "dark", "death",
    "weapon", "sword", "gun", "knife", "blood", "cry", "sad", "angry",
    "steal", "thief", "bad", "villain", "mean"
]

# Positive replacement suggestions
POSITIVE_REPLACEMENTS = {
    "fight": "play together",
    "hurt": "help",
    "scary": "exciting",
    "monster": "friendly creature",
    "evil": "misunderstood",
    "dark": "starry night",
    "weapon": "magic wand",
    "sword": "magic staff",
    "cry": "smile",
    "sad": "hopeful",
    "angry": "determined",
    "steal": "find",
    "bad": "learning",
    "villain": "friend who needs help",
    "mean": "grumpy but kind inside"
}

def is_kid_safe(text: str) -> tuple[bool, list[str]]:
    """
    Check if content is kid-safe
    Returns: (is_safe, found_keywords)
    """
    text_lower = text.lower()
    found_keywords = []
    
    for keyword in KID_UNSAFE_KEYWORDS:
        if keyword in text_lower:
            found_keywords.append(keyword)
    
    is_safe = len(found_keywords) == 0
    return is_safe, found_keywords


def suggest_kid_friendly_version(text: str) -> str:
    """
    Suggest a kid-friendly version of the text
    """
    text_lower = text.lower()
    suggestions = []
    
    for keyword, replacement in POSITIVE_REPLACEMENTS.items():
        if keyword in text_lower:
            suggestions.append(f"Replace '{keyword}' with '{replacement}'")
    
    if suggestions:
        return "Try making it more positive:\n" + "\n".join(suggestions)
    
    return "Make the story more cheerful and positive!"


def get_kid_friendly_prompt_suffix(base_prompt: str, style: str = "cartoon") -> str:
    """
    Add kid-friendly styling to image generation prompt
    """
    style_info = next((s for s in KID_IMAGE_STYLES if s["id"] == style), KID_IMAGE_STYLES[0])
    
    return f"{base_prompt}, {style_info['prompt_suffix']}, G-rated, family-friendly, no scary elements"
