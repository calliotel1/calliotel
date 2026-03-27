import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StoriesBar = ({ onStoryClick }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/stories/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStories(response.data.stories || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3 overflow-x-auto">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        <span className="text-sm text-gray-500">Loading stories...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 overflow-x-auto">
      <div className="flex items-center space-x-4">
        {/* Create Story Button */}
        <button
          onClick={() => navigate('/stories/create')}
          className="flex-shrink-0 flex flex-col items-center space-y-1"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-700">Your Story</span>
        </button>

        {/* Story Circles */}
        {stories.map((storyGroup) => (
          <button
            key={storyGroup.user.id}
            onClick={() => onStoryClick(storyGroup)}
            className="flex-shrink-0 flex flex-col items-center space-y-1"
          >
            <div
              className={`w-16 h-16 rounded-full p-0.5 ${
                storyGroup.has_unviewed
                  ? 'bg-gradient-to-br from-ember/50 via-ember to-ember-light'
                  : 'bg-gray-300'
              }`}
            >
              <div className="w-full h-full bg-white rounded-full p-0.5">
                <div className="w-full h-full bg-gradient-to-br from-ember/40 to-ember-light/40 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {storyGroup.user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <span className="text-xs font-medium text-gray-700 max-w-[64px] truncate">
              {storyGroup.user.full_name || storyGroup.user.email?.split('@')[0]}
            </span>
          </button>
        ))}

        {stories.length === 0 && (
          <div className="text-center py-2 text-gray-500 text-sm">
            No stories available. Be the first to post! 🎉
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesBar;
