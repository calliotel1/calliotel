"""
Advanced Video Processing Service for Video Empire
Features:
- Real-time face detection and filter overlays (Cat, Dog, Alien, etc.)
- ElevenLabs voice cloning for video audio
- AI caption generation using GPT-4o-mini
- Video effects and transformations
"""

import cv2
import numpy as np
from pathlib import Path
import ffmpeg
import subprocess
import logging
import os
import tempfile
from typing import Optional, Tuple
import requests
import json
from openai import OpenAI

logger = logging.getLogger(__name__)

# ElevenLabs API
ELEVENLABS_API_KEY = os.environ.get('ELEVENLABS_API_KEY')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

# Initialize OpenAI for captions
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


class VideoFilterProcessor:
    """Process videos with fun filters using OpenCV"""
    
    # Filter emoji overlays (we'll use text overlays for now)
    FILTER_CONFIGS = {
        'cat': {'emoji': '😸', 'scale': 1.5, 'position': 'face'},
        'dog': {'emoji': '🐕', 'scale': 1.5, 'position': 'face'},
        'donkey': {'emoji': '🫏', 'scale': 1.5, 'position': 'face'},
        'alien': {'emoji': '👽', 'scale': 1.8, 'position': 'face'},
        'robot': {'emoji': '🤖', 'scale': 1.5, 'position': 'face'},
        'clown': {'emoji': '🤡', 'scale': 1.5, 'position': 'face'},
        'pirate': {'emoji': '🏴‍☠️', 'scale': 1.2, 'position': 'top'}
    }
    
    def __init__(self):
        # Load face detection cascade
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
    
    def apply_css_filter(self, input_path: str, output_path: str, filter_type: str) -> bool:
        """Apply CSS-like filters using FFmpeg"""
        try:
            filter_configs = {
                'vintage': 'eq=contrast=1.2:brightness=0.1,colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131',
                'noir': 'hue=s=0,eq=contrast=1.5:brightness=-0.1',
                'neon': 'eq=saturation=2:brightness=0.2'
            }
            
            if filter_type not in filter_configs:
                return False
            
            (
                ffmpeg
                .input(input_path)
                .filter('video', filter_configs[filter_type])
                .output(output_path, c='libx264', preset='fast')
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True, quiet=True)
            )
            return True
        except Exception as e:
            logger.error(f"Error applying CSS filter: {str(e)}")
            return False
    
    def apply_face_filter(self, input_path: str, output_path: str, filter_type: str) -> bool:
        """Apply face-based emoji filters to video"""
        try:
            if filter_type not in self.FILTER_CONFIGS:
                return False
            
            filter_config = self.FILTER_CONFIGS[filter_type]
            emoji = filter_config['emoji']
            
            # Open video
            cap = cv2.VideoCapture(input_path)
            
            # Get video properties
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            # Create temporary output for processed video
            temp_output = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
            temp_output.close()
            
            # Video writer
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(temp_output.name, fourcc, fps, (width, height))
            
            frame_count = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Detect faces every 5 frames (for performance)
                if frame_count % 5 == 0:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
                    
                    # Draw emoji over each face
                    for (x, y, w, h) in faces:
                        # Calculate emoji position and size
                        emoji_size = int(w * filter_config['scale'])
                        emoji_x = x + w // 2 - emoji_size // 2
                        emoji_y = y + h // 2 - emoji_size // 2
                        
                        # Add text emoji (OpenCV doesn't support emoji rendering well, so we draw a box)
                        cv2.putText(
                            frame, 
                            emoji, 
                            (emoji_x, emoji_y + emoji_size // 2), 
                            cv2.FONT_HERSHEY_SIMPLEX, 
                            filter_config['scale'], 
                            (255, 255, 255), 
                            3
                        )
                
                out.write(frame)
                frame_count += 1
            
            cap.release()
            out.release()
            
            # Extract audio from original and merge with processed video
            self._merge_audio(input_path, temp_output.name, output_path)
            
            # Cleanup
            os.unlink(temp_output.name)
            
            return True
            
        except Exception as e:
            logger.error(f"Error applying face filter: {str(e)}")
            return False
    
    def _merge_audio(self, original_video: str, processed_video: str, output_path: str):
        """Merge audio from original video with processed video"""
        try:
            video = ffmpeg.input(processed_video)
            audio = ffmpeg.input(original_video).audio
            
            (
                ffmpeg
                .output(video, audio, output_path, vcodec='libx264', acodec='aac')
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True, quiet=True)
            )
        except Exception as e:
            logger.error(f"Error merging audio: {str(e)}")
            # Fallback: just use processed video
            subprocess.run(['cp', processed_video, output_path])


class ElevenLabsVideoVoice:
    """Clone voice in video using ElevenLabs"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.elevenlabs.io/v1"
    
    def clone_video_voice(self, input_video: str, output_video: str, voice_id: str = None) -> bool:
        """
        Extract audio from video, clone with ElevenLabs, merge back
        
        Args:
            input_video: Path to input video
            output_video: Path to output video
            voice_id: ElevenLabs voice ID (optional, uses default)
        """
        try:
            # Extract audio from video
            audio_path = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
            audio_path.close()
            
            (
                ffmpeg
                .input(input_video)
                .output(audio_path.name, acodec='libmp3lame')
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True, quiet=True)
            )
            
            # Use speech-to-speech API to clone voice
            cloned_audio_path = self._clone_audio(audio_path.name, voice_id)
            
            if not cloned_audio_path:
                logger.error("Failed to clone audio with ElevenLabs")
                os.unlink(audio_path.name)
                return False
            
            # Merge cloned audio with original video
            video = ffmpeg.input(input_video).video
            audio = ffmpeg.input(cloned_audio_path)
            
            (
                ffmpeg
                .output(video, audio, output_video, vcodec='copy', acodec='aac', shortest=None)
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True, quiet=True)
            )
            
            # Cleanup
            os.unlink(audio_path.name)
            os.unlink(cloned_audio_path)
            
            return True
            
        except Exception as e:
            logger.error(f"Error cloning video voice: {str(e)}")
            return False
    
    def _clone_audio(self, audio_path: str, voice_id: str = None) -> Optional[str]:
        """Clone audio using ElevenLabs speech-to-speech"""
        try:
            # Use default voice if not specified
            if not voice_id:
                voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel voice
            
            url = f"{self.base_url}/speech-to-speech/{voice_id}"
            
            with open(audio_path, 'rb') as audio_file:
                files = {'audio': audio_file}
                headers = {'xi-api-key': self.api_key}
                data = {'model_id': 'eleven_multilingual_v2'}
                
                response = requests.post(url, headers=headers, files=files, data=data)
                
                if response.status_code == 200:
                    # Save cloned audio
                    output_path = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
                    output_path.write(response.content)
                    output_path.close()
                    return output_path.name
                else:
                    logger.error(f"ElevenLabs API error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error in ElevenLabs audio cloning: {str(e)}")
            return None


class AICaptionGenerator:
    """Generate AI captions for videos using GPT-4o-mini"""
    
    def __init__(self, openai_client):
        self.client = openai_client
    
    def generate_caption(self, video_path: str, context: str = "") -> Optional[str]:
        """
        Generate caption for video by analyzing first frame
        
        Args:
            video_path: Path to video file
            context: Optional context about the video
        """
        try:
            if not self.client:
                return None
            
            # Extract first frame
            cap = cv2.VideoCapture(video_path)
            ret, frame = cap.read()
            cap.release()
            
            if not ret:
                return None
            
            # Convert frame to base64
            _, buffer = cv2.imencode('.jpg', frame)
            import base64
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Generate caption using GPT-4o-mini with vision
            prompt = f"""Generate a fun, engaging caption for this video message. 
            Keep it short (1-2 sentences), creative, and emoji-rich! 
            {f'Context: {context}' if context else ''}"""
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{frame_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=100
            )
            
            caption = response.choices[0].message.content.strip()
            return caption
            
        except Exception as e:
            logger.error(f"Error generating AI caption: {str(e)}")
            return None


# Export processors
def get_filter_processor():
    """Get video filter processor instance"""
    return VideoFilterProcessor()


def get_voice_cloner():
    """Get ElevenLabs voice cloner instance"""
    if ELEVENLABS_API_KEY:
        return ElevenLabsVideoVoice(ELEVENLABS_API_KEY)
    return None


def get_caption_generator():
    """Get AI caption generator instance"""
    if openai_client:
        return AICaptionGenerator(openai_client)
    return None
