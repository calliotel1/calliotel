"""
Auto-Taunt System - Psychological Warfare Engine
Generates tier-based victory taunts for automated post-game flexing
"""

import random
from typing import Optional

# Tier-based taunt pools
HONORABLE_TAUNTS = {
    "Bronze Rookie": [
        "A learning experience. You'll improve.",
        "Well fought, Rookie. Your time will come.",
        "The path to mastery begins with defeat.",
    ],
    "Silver Challenger": [
        "Well played, but the Challenger prevails.",
        "A respectable effort. Better luck next time.",
        "You fought with honor. Victory is mine today.",
    ],
    "Gold Warrior": [
        "Your effort was noted. My victory was inevitable.",
        "The Golden standard has been maintained.",
        "A worthy challenge, but the Warrior stands victorious.",
    ],
    "Platinum Elite": [
        "A respectable attempt. The Elite endure.",
        "You tested me. I rose to the challenge.",
        "Platinum shines brightest under pressure.",
    ],
    "Divine Legend": [
        "The legends write themselves.",
        "Divinity cannot be challenged.",
        "Your courage was admirable. My power, undeniable.",
    ],
    "The Architect": [
        "The system always wins.",
        "Efficiency optimized. Threat neutralized.",
        "The design is perfect. You were not.",
    ]
}

RUTHLESS_TAUNTS = {
    "Bronze Rookie": [
        "Back to training, Rookie. This wasn't close.",
        "Did you think you had a chance? Adorable.",
        "Bronze stays bronze for a reason.",
    ],
    "Silver Challenger": [
        "Your Challenger status is... questionable.",
        "Silver tarnishes. I remain unblemished.",
        "Challenging me was your first mistake.",
    ],
    "Gold Warrior": [
        "Did you even try? Golden standard unmet.",
        "Your tactics were transparent. Your defeat, predictable.",
        "The Warrior class is closed. You weren't invited.",
    ],
    "Platinum Elite": [
        "The Elite don't lose to... this.",
        "You thought you belonged here. You don't.",
        "Platinum crushes pretenders. Remember that.",
    ],
    "Divine Legend": [
        "You challenged a god. Know your place.",
        "Mortals don't defeat legends. They become footnotes.",
        "Your stats are a tragedy. Try a different game.",
    ],
    "The Architect": [
        "Your existence is a bug I just patched.",
        "The system rejected your input. Try again? Don't.",
        "I didn't just beat you. I optimized you out of existence.",
    ]
}

def get_tier_name(total_xp: int, is_admin: bool = False) -> str:
    """Get tier name based on XP"""
    if is_admin:
        return "The Architect"
    elif total_xp < 100:
        return "Bronze Rookie"
    elif total_xp < 500:
        return "Silver Challenger"
    elif total_xp < 1000:
        return "Gold Warrior"
    elif total_xp < 2500:
        return "Platinum Elite"
    else:
        return "Divine Legend"

def get_default_taunt_style(tier_name: str) -> str:
    """
    Get default taunt style based on tier (tier-escalation policy)
    Bronze-Silver: Honorable
    Gold-Platinum: Ruthless
    Divine-Architect: Silence
    """
    if tier_name in ["Bronze Rookie", "Silver Challenger"]:
        return "honorable"
    elif tier_name in ["Gold Warrior", "Platinum Elite"]:
        return "ruthless"
    else:  # Divine Legend, The Architect
        return "silence"

def generate_taunt(
    winner_tier: str,
    taunt_style: str,
    custom_message: Optional[str] = None
) -> Optional[str]:
    """
    Generate a taunt message based on tier and style.
    Returns None for 'silence' style (visual-only flex).
    """
    # Custom message takes precedence
    if custom_message and custom_message.strip():
        return custom_message.strip()
    
    # Architect's Silence - no text
    if taunt_style == "silence":
        return None
    
    # Select pool
    pool = HONORABLE_TAUNTS if taunt_style == "honorable" else RUTHLESS_TAUNTS
    
    # Get taunts for this tier
    tier_taunts = pool.get(winner_tier, pool.get("Bronze Rookie", []))
    
    if not tier_taunts:
        return "Victory is mine."
    
    return random.choice(tier_taunts)

def can_use_custom_taunt(total_xp: int) -> bool:
    """Custom taunts unlock at Gold tier (1000+ XP)"""
    return total_xp >= 1000

def can_use_silence(total_xp: int, is_admin: bool = False) -> bool:
    """Architect's Silence unlocks at Divine tier (2500+ XP) or admin"""
    return is_admin or total_xp >= 2500
