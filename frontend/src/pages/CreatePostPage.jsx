import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreatePostPage = () => {
  const [myChannels, setMyChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    fetchMyChannels();
  }, []);

  const fetchMyChannels = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/channels/my-channels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyChannels(response.data);
      
      // Auto-select first channel if available
      if (response.data.length > 0) {
        setSelectedChannel(response.data[0].channel_id);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your channels',
        variant: 'destructive'
      });
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedChannel) {
      toast({
        title: 'Error',
        description: 'Please select a channel',
        variant: 'destructive'
      });
      return;
    }

    if (content.trim().length === 0) {
      toast({
        title: 'Error',
        description: 'Post content cannot be empty',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const token = safeLocalStorage.getItem('token');
      
      const response = await axios.post(
        `${API}/posts/create`,
        {
          channel_id: selectedChannel,
          content: content.trim(),
          media_urls: []
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Success!',
        description: 'Post created successfully'
      });

      // Navigate to feed or channel
      navigate('/feed');
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create post',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingChannels) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember"></div>
      </div>
    );
  }

  if (myChannels.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-ember" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Channels Yet</h2>
          <p className="text-gray-600 mb-6">
            You need to join or create a channel before you can post
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/channels')}
              className="px-6 py-3 bg-gradient-to-r from-ember to-ember-light text-white rounded-lg font-semibold hover:from-ember hover:to-ember-light transition-all"
            >
              Browse Channels
            </button>
            <button
              onClick={() => navigate('/channels/create')}
              className="px-6 py-3 bg-white border-2 border-ember text-ember rounded-lg font-semibold hover:bg-ember/5 transition-all"
            >
              Create Channel
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold text-gray-900">Create Post</h1>
                <p className="text-sm text-gray-600">Share with your community</p>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading || !content.trim() || !selectedChannel}
              className="px-6 py-2 bg-gradient-to-r from-ember to-ember-light text-white font-semibold rounded-lg hover:from-ember hover:to-ember-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Channel Selection */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Post to Channel
            </label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {myChannels.map((channel) => (
                <option key={channel.channel_id} value={channel.channel_id}>
                  {channel.name} ({channel.member_count} members)
                </option>
              ))}
            </select>
          </div>

          {/* Post Content */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {user?.full_name || user?.email || 'You'}
                </p>
                <p className="text-xs text-gray-500">
                  Posting to {myChannels.find(c => c.channel_id === selectedChannel)?.name}
                </p>
              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={8}
              maxLength={5000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                {content.length}/5000 characters
              </p>
              <button
                type="button"
                className="text-sm text-ember hover:text-ember-light font-medium"
                onClick={() => setContent('')}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Media Upload (Future Feature) */}
          <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-dashed border-gray-300">
            <div className="text-center py-8">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Media uploads coming soon</p>
              <p className="text-xs text-gray-500">
                Photos and videos will be supported in a future update
              </p>
            </div>
          </div>
        </form>

        {/* Tips */}
        <div className="mt-6 bg-ember/5 border border-ember/20 rounded-lg p-4">
          <p className="text-sm text-ember-dark">
            <strong>💡 Tips for great posts:</strong>
          </p>
          <ul className="text-sm text-ember-700 mt-2 space-y-1 list-disc list-inside">
            <li>Be clear and concise</li>
            <li>Ask questions to encourage discussion</li>
            <li>Stay relevant to the channel topic</li>
            <li>Be respectful and constructive</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;
