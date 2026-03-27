import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Image as ImageIcon, X, Check, Smile } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StickerCreatorPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [stickerName, setStickerName] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image must be less than 10MB',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    // Auto-generate name from filename
    if (!stickerName) {
      const name = file.name.split('.')[0].replace(/[_-]/g, ' ');
      setStickerName(name);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setStickerName('');
    setTags('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select an image',
        variant: 'destructive'
      });
      return;
    }

    if (!stickerName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a sticker name',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const token = safeLocalStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', stickerName.trim());
      if (tags.trim()) {
        formData.append('tags', tags.trim());
      }

      const response = await axios.post(
        `${API}/media/sticker/create`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast({
        title: 'Success!',
        description: 'Sticker created successfully'
      });

      // Navigate to my stickers page
      navigate('/stickers/my');
    } catch (error) {
      console.error('Error creating sticker:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create sticker',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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
                <h1 className="text-2xl font-bold text-gray-900">Create Sticker</h1>
                <p className="text-sm text-gray-600">Upload your custom sticker</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/stickers/my')}
              className="text-sm text-ember hover:text-ember-light font-semibold"
            >
              My Stickers
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Area */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upload Image</h2>
            
            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-ember hover:bg-ember/5 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Click to upload image
                </p>
                <p className="text-sm text-gray-600">
                  PNG, JPG, GIF, or WEBP (max 10MB)
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="bg-gradient-to-br from-ember/10 to-ember-light/10 rounded-xl p-8 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-64 object-contain rounded-lg shadow-lg"
                  />
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

          {/* Sticker Details */}
          {previewUrl && (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Sticker Details</h2>
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sticker Name *
                  </label>
                  <input
                    type="text"
                    value={stickerName}
                    onChange={(e) => setStickerName(e.target.value)}
                    placeholder="e.g., Happy Face"
                    maxLength={50}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {stickerName.length}/50 characters
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tags (optional)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g., happy, smile, emoji"
                    maxLength={100}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate with commas
                  </p>
                </div>
              </div>

              {/* Preview in Chat */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Preview in Chat</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-end space-x-2 mb-2">
                    <div className="w-8 h-8 bg-ember rounded-full"></div>
                    <div className="bg-ember rounded-2xl px-4 py-2 max-w-xs">
                      <img
                        src={previewUrl}
                        alt="Sticker preview"
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 ml-10">
                    This is how your sticker will appear in chat
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !stickerName.trim()}
                className="w-full py-4 bg-gradient-to-r from-ember to-ember-light text-white font-bold rounded-lg hover:from-ember hover:to-ember-light transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Create Sticker</span>
                  </>
                )}
              </button>
            </>
          )}
        </form>

        {/* Tips */}
        <div className="mt-6 bg-ember/5 border border-ember/20 rounded-lg p-4">
          <p className="text-sm text-ember-dark mb-2">
            <strong>💡 Tips for great stickers:</strong>
          </p>
          <ul className="text-sm text-ember-700 space-y-1 list-disc list-inside">
            <li>Use images with transparent backgrounds for best results</li>
            <li>Square images (1:1 ratio) work best</li>
            <li>Keep file size under 1MB for faster loading</li>
            <li>Avoid text-heavy images</li>
            <li>Test in light and dark themes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StickerCreatorPage;
