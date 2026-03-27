import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const VoicePlayer = ({ voiceNote, showTranscript = true }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(voiceNote.duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const changeSpeed = () => {
    const speeds = [1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-ember/5 to-ember-light/5 dark:from-ember-dark/20 dark:to-obsidian-light/20 rounded-xl p-4 max-w-sm">
      <audio
        ref={audioRef}
        src={`${BACKEND_URL}${voiceNote.url}`}
        preload="metadata"
      />
      
      <div className="flex items-center space-x-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-ember to-ember-light hover:from-ember hover:to-ember-light text-white rounded-full flex items-center justify-center transition-all shadow-md"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" fill="currentColor" />
          ) : (
            <Play className="w-6 h-6 ml-1" fill="currentColor" />
          )}
        </button>

        <div className="flex-1">
          {/* Progress Bar */}
          <div className="relative h-2 bg-white/50 dark:bg-gray-700/50 rounded-full overflow-hidden mb-1">
            <div
              className="absolute top-0 left-0 h-full bg-ember transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Time and Speed */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <button
              onClick={changeSpeed}
              className="px-2 py-1 bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800 rounded text-ember dark:text-ember font-semibold transition-colors"
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>

      {/* Transcript */}
      {showTranscript && voiceNote.transcript && voiceNote.transcript !== '[Transcription unavailable]' && (
        <div className="mt-3 pt-3 border-t border-ember/20 dark:border-ember/20">
          <p className="text-xs font-semibold text-ember dark:text-ember mb-1">
            📝 Transcript:
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
            "{voiceNote.transcript}"
          </p>
        </div>
      )}
    </div>
  );
};

export default VoicePlayer;
