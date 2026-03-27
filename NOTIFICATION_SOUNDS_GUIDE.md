# 🔔 Notification Sounds - User Guide

## What is Notification Sounds?
A system that plays audio notifications when important events happen in the app. You have full control over which sounds play and their volume.

## Features

### ✅ Sound Types
- **New Messages** - When someone sends you a message
- **Friend Requests** - When someone sends you a friend request
- **Friend Accepted** - When someone accepts your friend request
- **Story Reactions** - When someone reacts to your story
- **Mentions** - When someone mentions you

### ✅ Customization Options
- **Master Toggle** - Turn all sounds on/off instantly
- **Volume Control** - Adjust from 0-100%
- **Sound Themes** - 4 different sound styles:
  - **Default** - Classic notification
  - **Chime** - Gentle chime
  - **Bell** - Clear bell
  - **Pop** - Quick pop
- **Individual Toggles** - Enable/disable each notification type
- **Test Sound** - Try before you commit

### ✅ Settings Sync
- Your preferences sync across all devices
- Changes are saved automatically

## How to Use

### Access Settings
1. Go to **Account** page (tap profile icon)
2. Tap **"Notification Settings"** button
3. Or navigate to `/settings/notifications`

### Configure Sounds
1. **Master Toggle** - Turn sounds on/off at the top
2. **Volume Slider** - Adjust to your preference
3. **Test Sound** - Click "Test Sound" to hear current settings
4. **Sound Theme** - Choose your preferred sound style
5. **Individual Toggles** - Turn specific notifications on/off

### When Sounds Play
- ✅ Only when app is open in browser
- ✅ Only for incoming events (not your own actions)
- ✅ Respects browser audio permissions
- ✅ Plays through device speakers/headphones

## Technical Details

### How It Works
- Uses **Web Audio API** for sound generation
- No external sound files needed
- Generates tones dynamically
- Settings stored in MongoDB
- Loaded on app initialization

### Browser Compatibility
- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari (full support)
- ⚠️ Requires user interaction first (browser autoplay policy)

### Privacy
- No sound data is collected
- Settings are private to your account
- Only plays locally on your device

## API Endpoints (For Developers)

### Get Settings
```bash
curl -X GET $API_URL/api/notifications/settings/ \
  -H "Authorization: Bearer $TOKEN"
```

### Update Settings
```bash
curl -X POST $API_URL/api/notifications/settings/update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sound_enabled": true,
    "volume": 80,
    "sound_theme": "chime",
    "new_message_sound": true,
    "friend_request_sound": true,
    "friend_accept_sound": true,
    "story_reaction_sound": true,
    "mention_sound": true
  }'
```

### Quick Toggle
```bash
curl -X POST $API_URL/api/notifications/settings/toggle/new_message_sound \
  -H "Authorization: Bearer $TOKEN"
```

### Test Sound
```bash
curl -X POST $API_URL/api/notifications/settings/test-sound \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

**No sound playing?**
- Check master toggle is ON
- Check volume is above 0
- Check specific notification type is enabled
- Browser may be muting the tab
- Try clicking "Test Sound"

**Sound too quiet/loud?**
- Adjust volume slider
- Check device volume
- Check browser tab audio settings

**Sound not working in Safari?**
- Interact with page first (click anywhere)
- Browser autoplay policy requires user gesture

**Settings not saving?**
- Check internet connection
- Check you're logged in
- Try refreshing the page

## Best Practices

✅ **Do:**
- Test sound after changing theme
- Adjust volume to comfortable level
- Turn off sounds in quiet environments
- Use different themes for variety

❌ **Don't:**
- Set volume to 100% (may be too loud)
- Enable all sounds if easily distracted
- Expect sounds when app is closed

## Coming Soon (Future Features)
- Do Not Disturb schedule
- Custom sound upload
- Per-friend sound settings
- Vibration support (mobile)
- Desktop notifications integration
- Ringtone for calls
