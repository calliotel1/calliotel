# 📖 Stories Feature - User Guide

## What is Stories?
Stories is an Instagram/WhatsApp-style feature where you can share photos and videos with friends that automatically disappear after 24 hours.

## How to Use

### Creating a Story
1. Go to **Chat** page
2. Click the **"+ Your Story"** button at the top (purple circle with plus icon)
3. Upload a photo or video:
   - Images: Up to 10MB
   - Videos: Up to 50MB
4. Add an optional caption (up to 200 characters)
5. Choose privacy:
   - **All Friends**: Everyone can see
   - **Only Me**: Private (test mode)
6. Click **"Post Story"**
7. Your story will appear at the top of the chat page for 24 hours

### Viewing Stories
1. On the Chat page, you'll see story circles at the top
2. **Blue/Pink ring** = Unviewed stories
3. **Gray ring** = Already viewed
4. Click any story circle to view full-screen
5. **Swipe left/right** or click arrows to navigate between stories
6. **Hold** to pause
7. React with emojis: ❤️ 👍 😂 🔥

### Checking Who Viewed Your Story
1. While viewing your own story
2. Click the **eye icon** at the bottom showing view count
3. See list of who viewed and when
4. Viewers are sorted by most recent first

### Story Features
- ✅ Auto-expires after 24 hours
- ✅ View counter
- ✅ Emoji reactions
- ✅ Privacy controls
- ✅ Caption support
- ✅ Photo & video support
- ✅ Full-screen viewer
- ✅ Progress bars
- ✅ Viewer list

## API Endpoints

### For Developers/Testing

**Create Story:**
```bash
curl -X POST $API_URL/api/stories/create \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@photo.jpg" \
  -F "caption=My first story!" \
  -F "privacy=all"
```

**Get Active Stories:**
```bash
curl -X GET $API_URL/api/stories/active \
  -H "Authorization: Bearer $TOKEN"
```

**View Story:**
```bash
curl -X POST $API_URL/api/stories/{story_id}/view \
  -H "Authorization: Bearer $TOKEN"
```

**React to Story:**
```bash
curl -X POST $API_URL/api/stories/{story_id}/react \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reaction": "❤️"}'
```

**Get Viewers:**
```bash
curl -X GET $API_URL/api/stories/{story_id}/views \
  -H "Authorization: Bearer $TOKEN"
```

**Delete Story:**
```bash
curl -X DELETE $API_URL/api/stories/{story_id} \
  -H "Authorization: Bearer $TOKEN"
```

## Technical Details

### Storage
- Stories stored in `/app/media/stories/`
- Unique filename per story
- Files deleted on expiration

### Database
- `stories` collection: Story metadata
- `story_views` collection: View tracking
- `story_reactions` collection: Emoji reactions

### Expiration
- Stories auto-expire 24 hours after creation
- Cleanup endpoint: `/api/stories/cleanup-expired`
- Expired stories marked as `is_expired: true`

### Limits
- Max 10 active stories per user
- Max 10MB for images
- Max 50MB for videos
- Max 200 characters for captions

## Troubleshooting

**Story not appearing?**
- Check you have friends added
- Refresh the chat page
- Story might have expired (24h limit)

**Can't upload video?**
- Check file size (max 50MB)
- Ensure format is MP4, WebM, or QuickTime

**Can't see views?**
- Only story owner can see views
- Views update in real-time

**Story disappeared early?**
- Stories expire exactly 24h after posting
- Check timestamp in viewer

## Next Features (Future)
- Story replies (DM response)
- Highlights (save favorite stories)
- Music/sound overlay
- Filters & effects
- Multi-photo stories
- Story mentions (@friends)
