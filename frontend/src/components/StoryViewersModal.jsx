import React, { useState, useEffect } from 'react';
import { X, Eye, Loader2 } from 'lucide-react';
import axios from 'axios';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StoryViewersModal = ({ storyId, onClose }) => {
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchViewers();
  }, [storyId]);

  const fetchViewers = async () => {
    try {
      setLoading(true);
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/stories/${storyId}/views`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setViewers(response.data.views || []);
    } catch (error) {
      console.error('Error fetching viewers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Eye className="w-6 h-6 text-ember" />
            <h2 className="text-xl font-bold text-gray-900">
              Viewers ({viewers.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-ember animate-spin mb-4" />
              <p className="text-gray-600">Loading viewers...</p>
            </div>
          ) : viewers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Eye className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No views yet
              </h3>
              <p className="text-gray-600">
                When people view your story, they'll appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {viewers.map((view, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-ember/40 to-ember-light/40 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {view.viewer.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {view.viewer.full_name || view.viewer.email?.split('@')[0]}
                      </p>
                      <p className="text-sm text-gray-600">
                        {view.viewer.email}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatTime(view.viewed_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {viewers.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <p className="text-sm text-gray-600 text-center">
              {viewers.length} {viewers.length === 1 ? 'person has' : 'people have'} viewed your story
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewersModal;
