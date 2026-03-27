import React, { useState, useRef, useEffect } from 'react';
import { Camera as CameraIcon, X, RotateCw, Video, Square, Circle, Image, Download, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CameraCapture = ({ isOpen, onClose, onCapture, mode = 'photo' }) => {
  const [stream, setStream] = useState(null);
  const [capturedMedia, setCapturedMedia] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: mode === 'video'
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please grant permission.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      setCapturedMedia({ type: 'photo', url, blob });
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const startRecording = () => {
    if (!stream) return;

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setCapturedMedia({ type: 'video', url, blob });
      stopCamera();
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setRecordingTime(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const retake = () => {
    setCapturedMedia(null);
    setRecordingTime(0);
    startCamera();
  };

  const handleSend = async () => {
    if (!capturedMedia) return;

    setUploading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const formData = new FormData();
      
      if (capturedMedia.type === 'photo') {
        formData.append('file', capturedMedia.blob, 'photo.jpg');
        const response = await axios.post(`${API}/media/upload/image`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        onCapture({
          type: 'image',
          url: response.data.media_url
        });
      } else {
        formData.append('file', capturedMedia.blob, 'video.webm');
        const response = await axios.post(`${API}/media/upload/video`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        onCapture({
          type: 'video',
          url: response.data.media_url
        });
      }

      onClose();
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Failed to upload media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {!capturedMedia && (
              <button
                onClick={switchCamera}
                className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all"
              >
                <RotateCw className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Camera/Preview View */}
        <div className="w-full h-full flex items-center justify-center">
          {!capturedMedia ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              {capturedMedia.type === 'photo' ? (
                <img
                  src={capturedMedia.url}
                  alt="Captured"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={capturedMedia.url}
                  controls
                  className="w-full h-full object-contain"
                />
              )}
            </>
          )}
        </div>

        {/* Recording Timer */}
        {isRecording && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-full">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="font-mono font-bold">{formatTime(recordingTime)}</span>
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/50 to-transparent">
          {!capturedMedia ? (
            <div className="flex items-center justify-center space-x-8">
              {mode === 'video' && !isRecording && (
                <button className="p-4 bg-white/10 backdrop-blur-sm rounded-full">
                  <Image className="w-6 h-6 text-white" />
                </button>
              )}

              {mode === 'photo' ? (
                <button
                  onClick={capturePhoto}
                  className="p-6 bg-white rounded-full hover:scale-110 transition-transform shadow-2xl"
                >
                  <CameraIcon className="w-8 h-8 text-ember" />
                </button>
              ) : (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-6 rounded-full hover:scale-110 transition-transform shadow-2xl ${
                    isRecording ? 'bg-red-600' : 'bg-white'
                  }`}
                >
                  {isRecording ? (
                    <Square className="w-8 h-8 text-white" />
                  ) : (
                    <Circle className="w-8 h-8 text-red-600" />
                  )}
                </button>
              )}

              {mode === 'video' && !isRecording && (
                <button className="p-4 bg-white/10 backdrop-blur-sm rounded-full">
                  <Video className="w-6 h-6 text-white" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-around">
              <button
                onClick={retake}
                className="flex flex-col items-center space-y-1 text-white"
              >
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all">
                  <RotateCw className="w-6 h-6" />
                </div>
                <span className="text-sm">Retake</span>
              </button>

              <button
                onClick={handleSend}
                disabled={uploading}
                className="flex flex-col items-center space-y-1 text-white"
              >
                <div className="p-4 bg-gradient-to-r from-ember to-ember-light rounded-full hover:from-ember hover:to-ember-light transition-all shadow-2xl disabled:opacity-50">
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </div>
                <span className="text-sm">{uploading ? 'Sending...' : 'Send'}</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CameraCapture;
