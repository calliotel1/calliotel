import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VoiceRecorder = ({ onSendVoiceNote, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [waveformData, setWaveformData] = useState([]);
  const [recordingQuality, setRecordingQuality] = useState('good'); // good, fair, poor
  
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerInterval = useRef(null);
  const animationFrame = useRef(null);
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      if (audioContext.current) audioContext.current.close();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for waveform
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      analyser.current = audioContext.current.createAnalyser();
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyser.current);
      analyser.current.fftSize = 256;
      
      // Start recording
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setAudioBlob(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.current.start();
      setIsRecording(true);
      
      // Start timer
      timerInterval.current = setInterval(() => {
        setDuration(prev => prev + 0.1);
      }, 100);
      
      // Start waveform visualization
      visualizeWaveform();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: 'Error',
        description: 'Could not access microphone',
        variant: 'destructive'
      });
    }
  };

  const visualizeWaveform = () => {
    if (!analyser.current) return;
    
    const bufferLength = analyser.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!isRecording) return;
      
      analyser.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume for quality indicator
      const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      if (average > 100) {
        setRecordingQuality('good');
      } else if (average > 50) {
        setRecordingQuality('fair');
      } else {
        setRecordingQuality('poor');
      }
      
      // Sample 20 points for waveform
      const samples = [];
      const step = Math.floor(bufferLength / 20);
      for (let i = 0; i < 20; i++) {
        samples.push(dataArray[i * step]);
      }
      
      setWaveformData(samples);
      animationFrame.current = requestAnimationFrame(draw);
    };
    
    draw();
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    
    try {
      setUploading(true);
      setTranscribing(false);
      const token = safeLocalStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice-note.webm');
      formData.append('duration', duration.toFixed(1));
      
      // Show transcribing state after upload starts
      setTimeout(() => {
        if (uploading) setTranscribing(true);
      }, 500);
      
      const response = await axios.post(
        `${API}/voice/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        onSendVoiceNote(response.data.voice_note);
        toast({
          title: 'Success!',
          description: 'Voice note sent'
        });
        onClose();
      }
      
    } catch (error) {
      console.error('Error uploading voice note:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send voice note',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    onClose();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {audioURL ? 'Voice Note Ready' : 'Record Voice Note'}
          </h3>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Waveform Visualization */}
        <div className="bg-gradient-to-br from-ember/5 to-ember-light/5 dark:from-ember-dark/20 dark:to-obsidian-light/20 rounded-xl p-6 mb-6">
          {/* Quality Indicator */}
          {isRecording && (
            <div className="flex items-center justify-center mb-4">
              <div className={`px-4 py-2 rounded-full flex items-center space-x-2 ${
                recordingQuality === 'good' ? 'bg-green-100 dark:bg-green-900/30' : 
                recordingQuality === 'fair' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 
                'bg-red-100 dark:bg-red-900/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  recordingQuality === 'good' ? 'bg-green-500' : 
                  recordingQuality === 'fair' ? 'bg-yellow-500' : 
                  'bg-red-500'
                } animate-pulse`}></div>
                <span className={`text-xs font-semibold ${
                  recordingQuality === 'good' ? 'text-green-700 dark:text-green-400' : 
                  recordingQuality === 'fair' ? 'text-yellow-700 dark:text-yellow-400' : 
                  'text-red-700 dark:text-red-400'
                }`}>
                  {recordingQuality === 'good' && '🎤 Great Quality'}
                  {recordingQuality === 'fair' && '🔊 Speak Louder'}
                  {recordingQuality === 'poor' && '⚠️ Too Quiet'}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-end justify-center space-x-1 h-24">
            {(isRecording ? waveformData : Array(20).fill(30)).map((value, index) => (
              <div
                key={index}
                className={`w-2 rounded-full transition-all ${
                  isRecording ? 'bg-ember' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                style={{
                  height: `${Math.max(10, (value / 255) * 100)}%`,
                  animation: isRecording ? 'pulse 0.5s ease-in-out infinite' : 'none'
                }}
              />
            ))}
          </div>
          
          {/* Duration */}
          <div className="text-center mt-4">
            <p className="text-3xl font-bold text-ember dark:text-ember">
              {formatDuration(duration)}
            </p>
          </div>
        </div>

        {/* Audio Playback */}
        {audioURL && !isRecording && (
          <div className="mb-6">
            <audio src={audioURL} controls className="w-full" />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          {!audioURL ? (
            <>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="p-6 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full shadow-lg transition-all"
                >
                  <Mic className="w-8 h-8" />
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="p-6 bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-full shadow-lg transition-all"
                >
                  <Square className="w-8 h-8" />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={uploading}
                className="px-6 py-3 bg-gradient-to-r from-ember to-ember-light hover:from-ember hover:to-ember-light text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{transcribing ? 'Transcribing AI...' : 'Uploading...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-ember/20 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            {!audioURL
              ? isRecording
                ? '🔴 Recording... Click square to stop'
                : '🎤 Click microphone to start recording'
              : '✨ AI will transcribe your voice automatically!'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;

// Add CSS animations for smooth entrance
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
`;
if (!document.querySelector('#voice-recorder-animations')) {
  style.id = 'voice-recorder-animations';
  document.head.appendChild(style);
}
