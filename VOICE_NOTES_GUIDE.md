# 🎤 Voice Notes Feature - User Guide

## Overview
Advanced voice messaging with AI transcription powered by OpenAI Whisper. Send voice messages in chats with automatic speech-to-text transcription.

## Features
- **Record Voice Notes**: Record audio messages directly in chat
- **Waveform Visualization**: Real-time audio waveform during recording
- **AI Transcription**: Automatic transcription using OpenAI Whisper
- **Playback Controls**: Play/pause, speed control (1x, 1.5x, 2x)
- **Duration Display**: Shows recording and playback duration
- **Seamless Integration**: Works within the existing chat system

## How to Use

### Recording a Voice Note
1. Open a chat with a friend
2. Click the **microphone button** (🎤) in the message input area
3. Voice Recorder modal will open
4. Click the red **Record button** to start recording
5. Speak your message (waveform will animate)
6. Click the **Stop button** (gray square) when finished
7. Preview your recording (audio player will appear)
8. Click **Send** to send the voice note
9. Or click **Cancel** to discard

### Receiving Voice Notes
- Voice notes appear in the chat as interactive players
- Click **Play** to listen
- View the AI-generated transcript below the player
- Adjust playback speed (1x, 1.5x, 2x) for faster listening

## Technical Details

### Backend
- **API Endpoint**: `/api/voice/upload`
- **AI Integration**: OpenAI Whisper via emergentintegrations
- **Supported Formats**: WebM, MP3, WAV, M4A, OGG
- **Max File Size**: 25MB
- **Storage**: `/app/media/voice_notes/`

### Database Schema
```javascript
voice_notes: {
  id: String (UUID),
  user_id: String,
  url: String,
  duration: Number,
  transcript: String,
  file_size: Number,
  created_at: ISO DateTime
}
```

### Frontend Components
- **VoiceRecorder.jsx**: Recording modal with waveform
- **VoicePlayer.jsx**: Playback component with transcript
- **Integration**: MessageInput.jsx, MessageList.jsx, ChatPage.jsx

## Browser Requirements
- Modern browser with WebRTC support
- Microphone permission required
- Supported: Chrome, Firefox, Safari, Edge

## Tips
- Speak clearly for better transcription accuracy
- Keep recordings under 1 minute for best experience
- Check microphone permissions if recording fails
- Transcription is automatic - no action needed

## Troubleshooting

**Can't record:**
- Check browser microphone permissions
- Ensure no other app is using the microphone

**No transcript:**
- Transcript shows "[Transcription unavailable]" if AI fails
- Audio still plays normally

**Upload fails:**
- Check file size (max 25MB)
- Verify internet connection
- Try shorter recording

---

**Status**: ✅ Fully Implemented (Backend + Frontend)
**Integration**: OpenAI Whisper via Emergent LLM Key
**Last Updated**: March 2026
