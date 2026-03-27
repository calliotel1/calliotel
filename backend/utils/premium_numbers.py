"""
Premium Number Detection Utilities
Identifies "Gold" numbers with high memorability value
"""

def is_premium_number(phone_number: str) -> dict:
    """
    Analyze a phone number and determine if it's premium
    Returns dict with premium status, tier, and suggested price
    """
    # Extract just the digits
    digits = ''.join(filter(str.isdigit, phone_number))
    
    # Get last 4 digits (most important for memorability)
    if len(digits) >= 4:
        last_four = digits[-4:]
    else:
        return {"is_premium": False, "tier": None, "price": 0}
    
    premium_patterns = []
    tier = None
    price = 0
    
    # PLATINUM TIER ($100) - Rarest patterns
    if last_four in ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999']:
        premium_patterns.append("Quad Repeating")
        tier = "platinum"
        price = 100
    elif last_four in ['1234', '2345', '3456', '4567', '5678', '6789']:
        premium_patterns.append("Sequential Ascending")
        tier = "platinum"
        price = 100
    elif last_four in ['9876', '8765', '7654', '6543', '5432', '4321']:
        premium_patterns.append("Sequential Descending")
        tier = "platinum"
        price = 100
    
    # GOLD TIER ($50) - Highly desirable
    elif last_four.endswith('000') or last_four.endswith('999'):
        premium_patterns.append("Triple Zero/Nine")
        tier = "gold"
        price = 50
    elif last_four.endswith('777') or last_four.endswith('888'):
        premium_patterns.append("Triple Lucky")
        tier = "gold"
        price = 50
    elif last_four[0] == last_four[1] and last_four[2] == last_four[3]:
        premium_patterns.append("Double Pair")
        tier = "gold"
        price = 50
    elif last_four == last_four[::-1]:  # Palindrome
        premium_patterns.append("Palindrome")
        tier = "gold"
        price = 50
    
    # SILVER TIER ($25) - Nice patterns
    elif last_four.endswith('00') or last_four.endswith('11') or last_four.endswith('22'):
        premium_patterns.append("Double Ending")
        tier = "silver"
        price = 25
    elif last_four[0] == last_four[1] or last_four[2] == last_four[3]:
        premium_patterns.append("Contains Pair")
        tier = "silver"
        price = 25
    elif all(int(last_four[i]) <= int(last_four[i+1]) for i in range(3)):
        premium_patterns.append("Ascending")
        tier = "silver"
        price = 25
    elif all(int(last_four[i]) >= int(last_four[i+1]) for i in range(3)):
        premium_patterns.append("Descending")
        tier = "silver"
        price = 25
    
    is_premium = len(premium_patterns) > 0
    
    return {
        "is_premium": is_premium,
        "tier": tier,
        "price": price,
        "patterns": premium_patterns,
        "last_four": last_four
    }


def get_premium_badge_color(tier: str) -> dict:
    """Return colors for premium tier badges"""
    colors = {
        "platinum": {
            "bg": "from-purple-600 to-pink-600",
            "text": "text-white",
            "border": "border-purple-400",
            "glow": "shadow-purple-500/50"
        },
        "gold": {
            "bg": "from-yellow-500 to-orange-500",
            "text": "text-white",
            "border": "border-yellow-400",
            "glow": "shadow-yellow-500/50"
        },
        "silver": {
            "bg": "from-gray-400 to-gray-500",
            "text": "text-white",
            "border": "border-gray-300",
            "glow": "shadow-gray-500/50"
        }
    }
    return colors.get(tier, colors["silver"])
