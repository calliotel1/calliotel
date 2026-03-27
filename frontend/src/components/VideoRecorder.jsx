import React, { useState, useRef, useEffect } from 'react';
import { Video, X, Send, Clock, Eye, EyeOff, Mic, Sparkles, Play, Square, Upload, Loader } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VideoRecorder = ({ recipientId, onClose, onVideoSent }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Advanced options
  const [viewOnce, setViewOnce] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('none');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [caption, setCaption] = useState('');
  
  // Effects and filters
  const [filters, setFilters] = useState([]);
  const [voiceEffects, setVoiceEffects] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showVoiceEffects, setShowVoiceEffects] = useState(false);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { toast } = useToast();
  
  useEffect(() => {
    startCamera();
    fetchFiltersAndEffects();
    
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  const fetchFiltersAndEffects = async () => {
    try {
      const response = await axios.get(`${API}/video-messages/filters`);
      setFilters(response.data.filters || []);
      setVoiceEffects(response.data.voice_effects || []);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: 'Camera Error',
        description: 'Could not access camera and microphone',
        variant: 'destructive'
      });
    }
  };
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  const startRecording = () => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    setDuration(0);
    
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
      stopCamera();
    };
    
    mediaRecorder.start(100);
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a video file',
        variant: 'destructive'
      });
      return;
    }
    
    // Check file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Maximum video size is 100MB',
        variant: 'destructive'
      });
      return;
    }
    
    setRecordedBlob(file);
    setRecordedUrl(URL.createObjectURL(file));
    stopCamera();
    
    // Get video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      setDuration(Math.floor(video.duration));
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(file);
  };
  
  const retake = () => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    startCamera();
  };
  
  const sendVideo = async () => {
    if (!recordedBlob) return;
    
    setUploading(true);
    setProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', recordedBlob, 'video.webm');
      formData.append('recipient_id', recipientId);
      formData.append('view_once', viewOnce);
      formData.append('voice_effect', selectedVoice);
      formData.append('filter_effect', selectedFilter);
      if (caption) formData.append('caption', caption);
      
      if (showSchedule && scheduleDate && scheduleTime) {
        const scheduledTime = `${scheduleDate}T${scheduleTime}:00Z`;
        formData.append('scheduled_time', scheduledTime);
      }
      
      const token = safeLocalStorage.getItem('token');
      
      const response = await axios.post(`${API}/video-messages/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      
      toast({
        title: showSchedule ? 'Video Scheduled!' : 'Video Sent!',
        description: showSchedule 
          ? `Video will be sent at ${scheduleDate} ${scheduleTime}`
          : `Video message sent with ${selectedVoice !== 'none' ? selectedVoice + ' voice' : 'normal voice'}`,
      });
      
      if (onVideoSent) onVideoSent(response.data);
      onClose();
      
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.detail || 'Could not upload video',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };
  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const activeFilter = filters.find(f => f.id === selectedFilter);
  const activeVoice = voiceEffects.find(v => v.id === selectedVoice);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Video className="w-6 h-6 text-orange-600" />
            <span>Record Video Message</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Video Preview */}
        <div className="flex-1 bg-black relative overflow-hidden">
          {recordedUrl ? (
            <video
              src={recordedUrl}
              controls
              className="w-full h-full object-contain"
              style={activeFilter?.css ? { filter: activeFilter.css } : {}}
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain transform scale-x-[-1]"
              style={activeFilter?.css ? { filter: activeFilter.css } : {}}
            />
          )}
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span className="font-bold">{formatDuration(duration)}</span>
            </div>
          )}
          
          {/* Active effects indicators */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            {activeVoice && activeVoice.id !== 'none' && (
              <div className="bg-ember text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                <span>{activeVoice.icon}</span>
                <span>{activeVoice.name}</span>
              </div>
            )}
            {activeFilter && activeFilter.id !== 'none' && (
              <div className="bg-ember text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                <span>{activeFilter.icon}</span>
                <span>{activeFilter.name}</span>
              </div>
            )}
            {viewOnce && (
              <div className="bg-ember text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                <EyeOff className="w-4 h-4" />
                <span>View Once</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Controls */}
        <div className="p-4 space-y-4">
          {/* Effects Row */}
          {!recordedUrl && (
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              <button
                onClick={() => setShowVoiceEffects(!showVoiceEffects)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
                  selectedVoice !== 'none' ? 'bg-ember text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Voice</span>
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
                  selectedFilter !== 'none' ? 'bg-ember text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Filter</span>
              </button>
              
              <button
                onClick={() => setViewOnce(!viewOnce)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
                  viewOnce ? 'bg-ember text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {viewOnce ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{viewOnce ? 'View Once' : 'Normal'}</span>
              </button>
              
              <button
                onClick={() => setShowSchedule(!showSchedule)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
                  showSchedule ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Schedule</span>
              </button>
            </div>
          )}
          
          {/* Voice Effects Selector */}
          {showVoiceEffects && !recordedUrl && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {voiceEffects.map(voice => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedVoice === voice.id
                      ? 'bg-ember text-white scale-105'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{voice.icon}</div>
                  <div className="text-xs font-medium">{voice.name}</div>
                </button>
              ))}
            </div>
          )}
          
          {/* Filters Selector */}
          {showFilters && !recordedUrl && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {filters.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedFilter === filter.id
                      ? 'bg-ember text-white scale-105'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{filter.icon}</div>
                  <div className="text-xs font-medium">{filter.name}</div>
                </button>
              ))}
            </div>
          )}
          
          {/* Schedule Selector */}
          {showSchedule && !recordedUrl && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
              />
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
              />
            </div>
          )}
          
          {/* Caption Input */}
          {recordedUrl && (
            <input
              type="text"
              placeholder="Add a caption (optional)..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          )}
          
          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-4">
            {!recordedUrl ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors flex items-center space-x-2"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload</span>
                </button>
                
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
                  >
                    <Square className="w-8 h-8 text-white fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="w-20 h-20 bg-orange-600 hover:bg-orange-700 rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
                  >
                    <Play className="w-8 h-8 text-white fill-current ml-1" />
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={retake}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors"
                >
                  Retake
                </button>
                
                <button
                  onClick={sendVideo}
                  disabled={uploading}
                  className="px-8 py-3 bg-gradient-to-r from-orange-600 to-ember-light hover:from-orange-700 hover:to-ember-light text-white rounded-full transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>{progress}%</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>{showSchedule ? 'Schedule' : 'Send'}</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoRecorder;
