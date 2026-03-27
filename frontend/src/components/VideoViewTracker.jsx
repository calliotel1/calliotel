import React, { useEffect } from 'react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VideoViewTracker = ({ videoId, source = 'direct', autoRecord = true }) => {
  useEffect(() => {
    if (!autoRecord || !videoId) return;

    let watchStartTime = Date.now();
    let viewRecorded = false;

    const recordView = async (watchDuration = 0) => {
      if (viewRecorded) return;
      
      try {
        const response = await fetch(`${API_URL}/api/video-reactions/views/record`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            video_id: videoId,
            watch_duration: Math.floor(watchDuration),
            source: source
          })
        });

        const data = await response.json();
        if (data.success) {
          viewRecorded = true;
        }
      } catch (error) {
        console.error('Error recording view:', error);
      }
    };

    // Record view after 2 seconds (to avoid accidental views)
    const viewTimeout = setTimeout(() => {
      const watchDuration = (Date.now() - watchStartTime) / 1000;
      recordView(watchDuration);
    }, 2000);

    // Record final watch duration on unmount
    return () => {
      clearTimeout(viewTimeout);
      if (viewRecorded) {
        const watchDuration = (Date.now() - watchStartTime) / 1000;
        // Update watch duration (optional final update)
        if (watchDuration > 2) {
          recordView(watchDuration);
        }
      }
    };
  }, [videoId, source, autoRecord]);

  return null; // This is a tracker component, no UI
};

export default VideoViewTracker;