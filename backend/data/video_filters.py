"""
69 EXTREME VIDEO FILTERS - THE MOST IN THE WORLD! 🌍👑
"""

VIDEO_FILTERS = [
    # BASIC
    {"id": "none", "name": "Normal", "icon": "🎬", "description": "No filter", "type": "basic", "category": "Basic"},
    
    # ANIMAL KINGDOM 🦁 (12 filters)
    {"id": "cat", "name": "Cat", "icon": "🤪", "emoji": "😸", "description": "Meow! 🐱", "type": "face", "category": "Animals"},
    {"id": "dog", "name": "Dog", "icon": "🐶", "emoji": "🐕", "description": "Woof! 🐕", "type": "face", "category": "Animals"},
    {"id": "monkey", "name": "Monkey", "icon": "🐵", "emoji": "🐵", "description": "Banana time! 🍌", "type": "face", "category": "Animals"},
    {"id": "pig", "name": "Pig", "icon": "🐷", "emoji": "🐷", "description": "Oink oink! 🐷", "type": "face", "category": "Animals"},
    {"id": "cow", "name": "Cow", "icon": "🐮", "emoji": "🐮", "description": "Moo! 🐮", "type": "face", "category": "Animals"},
    {"id": "bear", "name": "Bear", "icon": "🐻", "emoji": "🐻", "description": "Grrrr! 🐻", "type": "face", "category": "Animals"},
    {"id": "tiger", "name": "Tiger", "icon": "🐯", "emoji": "🐯", "description": "Rawr! 🐯", "type": "face", "category": "Animals"},
    {"id": "panda", "name": "Panda", "icon": "🐼", "emoji": "🐼", "description": "Bamboo! 🎋", "type": "face", "category": "Animals"},
    {"id": "fox", "name": "Fox", "icon": "🦊", "emoji": "🦊", "description": "Sly fox! 🦊", "type": "face", "category": "Animals"},
    {"id": "frog", "name": "Frog", "icon": "🐸", "emoji": "🐸", "description": "Ribbit! 🐸", "type": "face", "category": "Animals"},
    {"id": "chicken", "name": "Chicken", "icon": "🐔", "emoji": "🐔", "description": "Bawk bawk! 🐔", "type": "face", "category": "Animals"},
    {"id": "donkey", "name": "Donkey", "icon": "🫏", "emoji": "🫏", "description": "Hee-haw! 🫏", "type": "face", "category": "Animals"},
    
    # FANTASY & SPOOKY 👻 (10 filters)
    {"id": "unicorn", "name": "Unicorn", "icon": "🦄", "emoji": "🦄", "description": "Magical! ✨", "type": "face", "category": "Fantasy"},
    {"id": "zombie", "name": "Zombie", "icon": "🧟", "emoji": "🧟", "description": "Brains! 🧠", "type": "face", "category": "Fantasy"},
    {"id": "vampire", "name": "Vampire", "icon": "🧛", "emoji": "🧛", "description": "Bleh! 🦇", "type": "face", "category": "Fantasy"},
    {"id": "witch", "name": "Witch", "icon": "🧙", "emoji": "🧙‍♀️", "description": "Abracadabra! 🔮", "type": "face", "category": "Fantasy"},
    {"id": "ghost", "name": "Ghost", "icon": "👻", "emoji": "👻", "description": "BOO! 👻", "type": "face", "category": "Fantasy"},
    {"id": "devil", "name": "Devil", "icon": "😈", "emoji": "😈", "description": "Evil! 😈", "type": "face", "category": "Fantasy"},
    {"id": "angel", "name": "Angel", "icon": "😇", "emoji": "😇", "description": "Halo! 😇", "type": "face", "category": "Fantasy"},
    {"id": "alien", "name": "Alien", "icon": "👽", "emoji": "👽", "description": "UFO! 🛸", "type": "face", "category": "Fantasy"},
    {"id": "robot", "name": "Robot", "icon": "🤖", "emoji": "🤖", "description": "Beep boop! 🤖", "type": "face", "category": "Fantasy"},
    {"id": "fairy", "name": "Fairy", "icon": "🧚", "emoji": "🧚", "description": "Pixie dust! ✨", "type": "face", "category": "Fantasy"},
    
    # EMOJI FACES 😂 (10 filters)
    {"id": "laugh", "name": "Crying Laugh", "icon": "😂", "emoji": "😂", "description": "LMAO! 😂", "type": "face", "category": "Emoji"},
    {"id": "heart_eyes", "name": "Heart Eyes", "icon": "😍", "emoji": "😍", "description": "Love! 💕", "type": "face", "category": "Emoji"},
    {"id": "angry", "name": "Angry", "icon": "😠", "emoji": "😠", "description": "RAGE! 😡", "type": "face", "category": "Emoji"},
    {"id": "sunglasses", "name": "Sunglasses", "icon": "😎", "emoji": "😎", "description": "Cool! 😎", "type": "face", "category": "Emoji"},
    {"id": "party", "name": "Party", "icon": "🥳", "emoji": "🥳", "description": "Party! 🎉", "type": "face", "category": "Emoji"},
    {"id": "nerd", "name": "Nerd", "icon": "🤓", "emoji": "🤓", "description": "Smart! 📚", "type": "face", "category": "Emoji"},
    {"id": "crying", "name": "Crying", "icon": "😭", "emoji": "😭", "description": "Sad! 😭", "type": "face", "category": "Emoji"},
    {"id": "money", "name": "Money", "icon": "🤑", "emoji": "🤑", "description": "Rich! 💰", "type": "face", "category": "Emoji"},
    {"id": "starstruck", "name": "Starstruck", "icon": "🤩", "emoji": "🤩", "description": "Wow! ⭐", "type": "face", "category": "Emoji"},
    {"id": "skull", "name": "Skull", "icon": "💀", "emoji": "💀", "description": "Dead! 💀", "type": "face", "category": "Emoji"},
    
    # HOLIDAYS 🎄 (6 filters)
    {"id": "santa", "name": "Santa", "icon": "🎅", "emoji": "🎅", "description": "Ho ho ho! 🎄", "type": "face", "category": "Holiday"},
    {"id": "elf", "name": "Elf", "icon": "🧝", "emoji": "🧝", "description": "Helper! 🎁", "type": "face", "category": "Holiday"},
    {"id": "bunny", "name": "Easter Bunny", "icon": "🐰", "emoji": "🐰", "description": "Hop! 🥚", "type": "face", "category": "Holiday"},
    {"id": "leprechaun", "name": "Leprechaun", "icon": "🍀", "emoji": "☘️", "description": "Lucky! 🍀", "type": "face", "category": "Holiday"},
    {"id": "cupid", "name": "Cupid", "icon": "💘", "emoji": "💘", "description": "Love! 💘", "type": "face", "category": "Holiday"},
    {"id": "pumpkin", "name": "Pumpkin", "icon": "🎃", "emoji": "🎃", "description": "Spooky! 🎃", "type": "face", "category": "Holiday"},
    
    # ACCESSORIES 👑 (8 filters)
    {"id": "crown", "name": "Crown", "icon": "👑", "emoji": "👑", "description": "King/Queen! 👑", "type": "face", "category": "Accessories"},
    {"id": "pirate", "name": "Pirate", "icon": "🏴‍☠️", "emoji": "🏴‍☠️", "description": "Arrr! 🏴‍☠️", "type": "face", "category": "Accessories"},
    {"id": "tophat", "name": "Top Hat", "icon": "🎩", "emoji": "🎩", "description": "Fancy! 🎩", "type": "face", "category": "Accessories"},
    {"id": "cowboy", "name": "Cowboy", "icon": "🤠", "emoji": "🤠", "description": "Yeehaw! 🤠", "type": "face", "category": "Accessories"},
    {"id": "ninja", "name": "Ninja", "icon": "🥷", "emoji": "🥷", "description": "Stealth! 🥷", "type": "face", "category": "Accessories"},
    {"id": "superhero", "name": "Superhero", "icon": "🦸", "emoji": "🦸", "description": "Hero! 🦸", "type": "face", "category": "Accessories"},
    {"id": "clown", "name": "Clown", "icon": "🤡", "emoji": "🤡", "description": "Honk! 🤡", "type": "face", "category": "Accessories"},
    {"id": "mustache", "name": "Mustache", "icon": "👨", "emoji": "👨", "description": "Classic! 👨", "type": "face", "category": "Accessories"},
    
    # VISUAL EFFECTS ✨ (18 filters)
    {"id": "rainbow", "name": "Rainbow", "icon": "🌈", "description": "Colorful! 🌈", "css": "hue-rotate(90deg) saturate(150%)", "type": "css", "category": "Effects"},
    {"id": "fire", "name": "Fire", "icon": "🔥", "description": "Burning! 🔥", "css": "sepia(100%) saturate(300%) hue-rotate(-50deg)", "type": "css", "category": "Effects"},
    {"id": "ice", "name": "Ice", "icon": "❄️", "description": "Frozen! ❄️", "css": "brightness(120%) saturate(50%) hue-rotate(180deg)", "type": "css", "category": "Effects"},
    {"id": "glitch", "name": "Glitch", "icon": "📺", "description": "Corrupted! 📺", "css": "hue-rotate(180deg) contrast(200%)", "type": "css", "category": "Effects"},
    {"id": "pixelated", "name": "Pixelated", "icon": "🕹️", "description": "8-bit! 🕹️", "css": "contrast(150%) saturate(200%)", "type": "css", "category": "Effects"},
    {"id": "matrix", "name": "Matrix", "icon": "💚", "description": "Code! 💚", "css": "sepia(100%) hue-rotate(50deg) saturate(200%)", "type": "css", "category": "Effects"},
    {"id": "thermal", "name": "Thermal", "icon": "🌡️", "description": "Heat! 🌡️", "css": "sepia(100%) hue-rotate(270deg) saturate(300%)", "type": "css", "category": "Effects"},
    {"id": "nightvision", "name": "Night Vision", "icon": "🌙", "description": "Military! 🌙", "css": "sepia(100%) hue-rotate(50deg) brightness(80%)", "type": "css", "category": "Effects"},
    {"id": "xray", "name": "X-Ray", "icon": "💀", "description": "Skeleton! 💀", "css": "invert(100%) contrast(200%)", "type": "css", "category": "Effects"},
    {"id": "cartoon", "name": "Cartoon", "icon": "🎨", "description": "Animated! 🎨", "css": "saturate(200%) contrast(120%) brightness(110%)", "type": "css", "category": "Effects"},
    {"id": "comic", "name": "Comic Book", "icon": "💥", "description": "POW! 💥", "css": "contrast(150%) saturate(150%)", "type": "css", "category": "Effects"},
    {"id": "underwater", "name": "Underwater", "icon": "🌊", "description": "Aqua! 🌊", "css": "hue-rotate(180deg) saturate(80%) brightness(90%)", "type": "css", "category": "Effects"},
    {"id": "space", "name": "Space", "icon": "🚀", "description": "Cosmic! 🚀", "css": "invert(100%) hue-rotate(180deg)", "type": "css", "category": "Effects"},
    {"id": "disco", "name": "Disco", "icon": "🪩", "description": "Party! 🪩", "css": "hue-rotate(45deg) saturate(200%) brightness(120%)", "type": "css", "category": "Effects"},
    {"id": "vintage", "name": "Vintage", "icon": "📼", "description": "Old school! 📼", "css": "sepia(100%) contrast(120%)", "type": "css", "category": "Effects"},
    {"id": "noir", "name": "Film Noir", "icon": "🎞️", "description": "Classic! 🎞️", "css": "grayscale(100%) contrast(150%)", "type": "css", "category": "Effects"},
    {"id": "neon", "name": "Neon", "icon": "✨", "description": "Electric! ✨", "css": "saturate(200%) brightness(120%)", "type": "css", "category": "Effects"},
    {"id": "vhs", "name": "VHS", "icon": "📹", "description": "90s! 📹", "css": "sepia(50%) saturate(80%) contrast(110%)", "type": "css", "category": "Effects"},
]

VOICE_EFFECTS = [
    {"id": "none", "name": "Normal Voice", "icon": "🎤", "description": "Your natural voice"},
    {"id": "chipmunk", "name": "Chipmunk", "icon": "🐿️", "description": "High & squeaky"},
    {"id": "darth_vader", "name": "Darth Vader", "icon": "😈", "description": "Deep & evil"},
    {"id": "robot", "name": "Robot", "icon": "🤖", "description": "Mechanical voice"},
    {"id": "deep", "name": "Deep Voice", "icon": "🎭", "description": "Bass boosted"},
    {"id": "female", "name": "Female Voice", "icon": "👩", "description": "Higher pitch"},
    {"id": "elevenlabs", "name": "AI Voice Clone", "icon": "🎙️", "description": "ElevenLabs AI (Premium)", "premium": True}
]

FILTER_CATEGORIES = ["Basic", "Animals", "Fantasy", "Emoji", "Holiday", "Accessories", "Effects"]

TOTAL_FILTERS = len(VIDEO_FILTERS)
TOTAL_VOICE_EFFECTS = len(VOICE_EFFECTS)
