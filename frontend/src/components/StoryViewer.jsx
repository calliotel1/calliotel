import React, { useState, useEffect } from 'react';
import { X, Heart, ThumbsUp, Laugh, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StoryViewer = ({ storyGroup, onClose, onShowViewers }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const stories = storyGroup?.stories || [];
  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!currentStory || isPaused) return;

    // Mark story as viewed
    markAsViewed(currentStory.id);

    // Progress bar animation (5 seconds per story)
    const duration = 5000;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const newProgress = (elapsed / duration) * 100;
      
      if (newProgress >= 100) {
        handleNext();
      } else {
        setProgress(newProgress);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, currentStory]);

  const markAsViewed = async (storyId) => {
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(
        `${API}/stories/${storyId}/view`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  };

  const handleReact = async (reaction) => {
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(
        `${API}/stories/${currentStory.id}/react`,
        { reaction },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Reacted!',
        description: `You reacted with ${reaction}`
      });
    } catch (error) {
      console.error('Error reacting to story:', error);
      toast({
        title: 'Error',
        description: 'Failed to react',
        variant: 'destructive'
      });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleMouseDown = () => setIsPaused(true);
  const handleMouseUp = () => setIsPaused(false);

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{
                width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-ember/40 to-ember-light/40 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">
              {storyGroup.user.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white font-semibold">
              {storyGroup.user.full_name || storyGroup.user.email?.split('@')[0]}
            </p>
            <p className="text-white/70 text-xs">
              {new Date(currentStory.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Navigation */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
        disabled={currentIndex === 0}
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Story Content */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        {currentStory.media_type === 'image' ? (
          <img
            src={`${BACKEND_URL}${currentStory.media_url}`}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            src={`${BACKEND_URL}${currentStory.media_url}`}
            autoPlay
            className="max-w-full max-h-full object-contain"
          />
        )}

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-24 left-0 right-0 px-8">
            <p className="text-white text-center text-lg font-medium bg-black/50 rounded-lg px-4 py-2">
              {currentStory.caption}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        {/* View Count (if own story) */}
        {currentStory.user_id === user?.id && (
          <button
            onClick={() => onShowViewers(currentStory.id)}
            className="flex items-center space-x-2 mb-4 text-white hover:text-ember transition-colors"
          >
            <Eye className="w-5 h-5" />
            <span className="font-semibold">{currentStory.views_count} views</span>
          </button>
        )}

        {/* Reaction Buttons */}
        {currentStory.user_id !== user?.id && (
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleReact('❤️')}
              className="p-4 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-sm"
            >
              <span className="text-3xl">❤️</span>
            </button>
            <button
              onClick={() => handleReact('👍')}
              className="p-4 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-sm"
            >
              <span className="text-3xl">👍</span>
            </button>
            <button
              onClick={() => handleReact('😂')}
              className="p-4 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-sm"
            >
              <span className="text-3xl">😂</span>
            </button>
            <button
              onClick={() => handleReact('🔥')}
              className="p-4 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-sm"
            >
              <span className="text-3xl">🔥</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
