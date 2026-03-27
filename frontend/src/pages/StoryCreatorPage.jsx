import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, Image as ImageIcon, Video, X, Globe, Lock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { gamificationEvents } from '../utils/gamificationEvents';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StoryCreatorPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState('all');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast({
        title: 'Error',
        description: 'Please select an image or video file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size with detailed error
    const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
    
    if (file.size > maxSize) {
      toast({
        title: `File Too Large (${fileSizeMB}MB)`,
        description: `${isImage ? 'Images' : 'Videos'} must be under ${maxSizeMB}MB. Try compressing your file.`,
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);
    setMediaType(isImage ? 'image' : 'video');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType(null);
    setCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a photo or video',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);
      const token = safeLocalStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('privacy', privacy);
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      const response = await axios.post(
        `${API}/stories/create`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );

      // Process gamification response
      if (response.data?.gamification) {
        const gam = response.data.gamification;
        if (gam.xp_gained > 0) {
          gamificationEvents.showXPGain(
            gam.xp_gained,
            "Story posted",
            gam.level_up ? {
              level: gam.new_level,
              name: gam.level_name,
              badge: gam.level_badge
            } : null
          );
        }
      }

      toast({
        title: 'Story Posted! 🎉',
        description: 'Your story is now live for 24 hours'
      });

      navigate('/chat');
    } catch (error) {
      console.error('Error creating story:', error);
      
      let errorMessage = 'Failed to create story';
      if (error.response?.status === 413) {
        errorMessage = 'File too large for server. Try a smaller file.';
      } else if (error.response?.status === 415) {
        errorMessage = 'File format not supported. Use JPG, PNG, or MP4.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Story</h1>
                <p className="text-sm text-gray-600">Share a moment with friends</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Area */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upload Media</h2>
            
            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-ember hover:bg-ember/5 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex justify-center space-x-4 mb-4">
                  <ImageIcon className="w-16 h-16 text-gray-400" />
                  <Video className="w-16 h-16 text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Click to upload photo or video
                </p>
                <p className="text-sm text-gray-600">
                  Images up to 10MB • Videos up to 50MB
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="bg-black rounded-xl overflow-hidden flex items-center justify-center" style={{ maxHeight: '400px' }}>
                  {mediaType === 'image' ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-[400px] object-contain"
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      controls
                      className="max-w-full max-h-[400px] object-contain"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Caption */}
          {previewUrl && (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Caption (Optional)</h2>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  maxLength={200}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {caption.length}/200 characters
                </p>
              </div>

              {/* Privacy Settings */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Privacy</h2>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setPrivacy('all')}
                    className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                      privacy === 'all'
                        ? 'border-ember bg-ember/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Globe className={`w-6 h-6 ${privacy === 'all' ? 'text-ember' : 'text-gray-400'}`} />
                    <div className="text-left flex-1">
                      <p className="font-semibold text-gray-900">All Friends</p>
                      <p className="text-sm text-gray-600">Everyone can see your story</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivacy('private')}
                    className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                      privacy === 'private'
                        ? 'border-ember bg-ember/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Lock className={`w-6 h-6 ${privacy === 'private' ? 'text-ember' : 'text-gray-400'}`} />
                    <div className="text-left flex-1">
                      <p className="font-semibold text-gray-900">Only Me</p>
                      <p className="text-sm text-gray-600">Private story, only you can see</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Post Button */}
              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="w-full py-4 bg-gradient-to-r from-ember to-ember-light text-white font-bold rounded-lg hover:from-ember hover:to-ember-light transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Uploading {uploadProgress}%...</span>
                  </>
                ) : (
                  <span>Post Story</span>
                )}
              </button>

              {/* Upload Progress Bar */}
              {loading && (
                <div className="bg-ember/5 rounded-lg p-4 border border-ember/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Uploading...</span>
                    <span className="text-sm font-bold text-ember">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-ember/20 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-ember to-ember-light transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {uploadProgress < 30 && '📤 Preparing your story...'}
                    {uploadProgress >= 30 && uploadProgress < 70 && '⬆️ Uploading media...'}
                    {uploadProgress >= 70 && uploadProgress < 100 && '✨ Almost done...'}
                    {uploadProgress === 100 && '🎉 Processing...'}
                  </p>
                </div>
              )}
            </>
          )}
        </form>

        {/* Tips */}
        <div className="mt-6 bg-gradient-to-br from-ember/5 to-ember-light/5 border border-ember/20 rounded-lg p-4">
          <p className="text-sm text-ember-900 font-semibold mb-2">
            ✨ Story Tips:
          </p>
          <ul className="text-sm text-ember-dark space-y-1 list-disc list-inside">
            <li>Stories disappear after 24 hours</li>
            <li>Friends can react with emojis</li>
            <li>See who viewed your story</li>
            <li>Share moments, photos, or quick videos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StoryCreatorPage;
