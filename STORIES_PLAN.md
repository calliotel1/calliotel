# 📖 Stories Feature - Implementation Plan

## Overview
Instagram/WhatsApp-style Stories feature where users can post photos/videos that expire after 24 hours.

## Features
1. **Post Stories**
   - Upload photo/video
   - Add text/stickers overlay
   - Privacy settings (All friends / Selected friends / Private)

2. **View Stories**
   - Story circles on top of chat page
   - Tap to view full-screen
   - Swipe to next story
   - See who viewed your story

3. **Auto-Expiration**
   - Stories disappear after 24 hours
   - Background job to clean up expired stories

4. **Reactions**
   - Quick emoji reactions
   - Reply to story (goes to DM)

## Database Schema

### `stories` collection
```json
{
  "id": "uuid",
  "user_id": "user_id",
  "media_url": "/media/stories/xxx.jpg",
  "media_type": "image|video",
  "caption": "Optional caption text",
  "privacy": "all|selected|private",
  "selected_friends": ["user_id1", "user_id2"],
  "created_at": "ISO timestamp",
  "expires_at": "ISO timestamp (created_at + 24h)",
  "is_expired": false,
  "views_count": 0,
  "reactions_count": 0
}
```

### `story_views` collection
```json
{
  "id": "uuid",
  "story_id": "story_id",
  "viewer_id": "user_id",
  "viewed_at": "ISO timestamp"
}
```

### `story_reactions` collection
```json
{
  "id": "uuid",
  "story_id": "story_id",
  "user_id": "user_id",
  "reaction": "❤️|😂|😮|😢|🔥",
  "created_at": "ISO timestamp"
}
```

## API Endpoints

### Backend (`/app/backend/routers/stories.py`)
1. `POST /api/stories/create` - Upload story
2. `GET /api/stories/active` - Get all active stories (from friends)
3. `GET /api/stories/my-active` - Get user's own active stories
4. `GET /api/stories/{story_id}` - Get specific story
5. `POST /api/stories/{story_id}/view` - Mark story as viewed
6. `GET /api/stories/{story_id}/views` - Get story viewers
7. `POST /api/stories/{story_id}/react` - React to story
8. `DELETE /api/stories/{story_id}` - Delete own story
9. `POST /api/stories/cleanup-expired` - Cleanup job (cron)

## Frontend Components

### 1. `StoriesBar.jsx` - Top bar with story circles
```
+------------------------------------------+
| [+] [User1] [User2] [User3] [User4] ... |
+------------------------------------------+
```
- Shows on ChatPage top
- "+" to create story
- Blue ring = unviewed stories
- Gray ring = all viewed

### 2. `StoryViewer.jsx` - Full-screen story viewer
- Fullscreen overlay
- Progress bars at top
- Tap left/right to navigate
- Hold to pause
- Swipe up to close
- Shows view count
- Reaction buttons at bottom

### 3. `StoryCreator.jsx` - Create story page
- Camera/gallery upload
- Text overlay tool
- Privacy selector
- Post button

### 4. `StoryViewers.jsx` - List of who viewed story
- Shows avatars + names
- Timestamp of view

## Implementation Steps

### Phase 1: Backend (Stories CRUD)
1. Create stories.py router
2. Implement all 9 endpoints
3. Add file upload for stories
4. Test with curl

### Phase 2: Frontend Components
1. Build StoryCreator page
2. Build StoriesBar component
3. Build StoryViewer modal
4. Build StoryViewers list

### Phase 3: Integration
1. Add StoriesBar to ChatPage
2. Connect all APIs
3. Test upload → view → react flow
4. Add privacy controls

### Phase 4: Polish
1. Add animations (story transitions)
2. Add expiration cleanup job
3. Test 24-hour expiration
4. Mobile optimization

## Technical Notes
- Stories stored in `/app/media/stories/`
- Video max size: 50MB
- Image max size: 10MB
- Max 10 active stories per user
- Stories auto-delete after 24h
