import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Hash, Lock, Globe } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateChannelPage = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (name.length < 3) {
      toast({
        title: 'Error',
        description: 'Channel name must be at least 3 characters',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const token = safeLocalStorage.getItem('token');
      
      const response = await axios.post(
        `${API}/channels/create`,
        {
          name,
          description,
          is_private: isPrivate
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Success!',
        description: 'Channel created successfully'
      });

      // Navigate to the new channel
      navigate(`/channels/${response.data.channel_id}`);
    } catch (error) {
      console.error('Error creating channel:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create channel',
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
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Channel</h1>
              <p className="text-sm text-gray-600">Start a new community</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* Channel Icon Preview */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-ember to-ember-light rounded-2xl flex items-center justify-center">
              <Hash className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Channel Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Tech Discussions"
              maxLength={50}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {name.length}/50 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              maxLength={500}
              rows={4}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/500 characters
            </p>
          </div>

          {/* Privacy Setting */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Privacy
            </label>
            <div className="space-y-3">
              {/* Public Option */}
              <div
                onClick={() => setIsPrivate(false)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  !isPrivate
                    ? 'border-ember bg-ember/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`mt-0.5 ${!isPrivate ? 'text-ember' : 'text-gray-400'}`}>
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Public</h3>
                      {!isPrivate && (
                        <div className="w-5 h-5 bg-ember rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Anyone can discover and join this channel
                    </p>
                  </div>
                </div>
              </div>

              {/* Private Option */}
              <div
                onClick={() => setIsPrivate(true)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isPrivate
                    ? 'border-ember bg-ember/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`mt-0.5 ${isPrivate ? 'text-ember' : 'text-gray-400'}`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Private</h3>
                      {isPrivate && (
                        <div className="w-5 h-5 bg-ember rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Only members you invite can see and join
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !name || !description}
              className="w-full py-3 bg-gradient-to-r from-ember to-ember-light text-white font-semibold rounded-lg hover:from-ember hover:to-ember-light transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Choose a clear, descriptive name that tells people what your channel is about. 
            You can always update the name and description later from channel settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateChannelPage;
