import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MyStickersPage = () => {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    fetchStickers();
  }, []);

  const fetchStickers = async () => {
    try {
      setLoading(true);
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/media/stickers/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStickers(response.data.stickers || []);
    } catch (error) {
      console.error('Error fetching stickers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your stickers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stickerId) => {
    if (!window.confirm('Are you sure you want to delete this sticker?')) {
      return;
    }

    try {
      setDeletingId(stickerId);
      const token = safeLocalStorage.getItem('token');
      await axios.delete(`${API}/media/sticker/${stickerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStickers(prev => prev.filter(s => s.id !== stickerId));
      toast({
        title: 'Success',
        description: 'Sticker deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting sticker:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete sticker',
        variant: 'destructive'
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Stickers</h1>
                <p className="text-sm text-gray-600">
                  {stickers.length} {stickers.length === 1 ? 'sticker' : 'stickers'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/stickers/create')}
              className="px-4 py-2 bg-gradient-to-r from-ember to-ember-light text-white font-semibold rounded-lg hover:from-ember hover:to-ember-light transition-all shadow-md flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-ember animate-spin mb-4" />
            <p className="text-gray-600">Loading your stickers...</p>
          </div>
        ) : stickers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-ember" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No stickers yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first custom sticker to use in chats!
            </p>
            <button
              onClick={() => navigate('/stickers/create')}
              className="px-6 py-3 bg-gradient-to-r from-ember to-ember-light text-white font-semibold rounded-lg hover:from-ember hover:to-ember-light transition-all shadow-md inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Sticker</span>
            </button>
          </div>
        ) : (
          <>
            {/* Stickers Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {stickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Sticker Image */}
                  <div className="aspect-square bg-gradient-to-br from-ember/5 to-ember-light/5 relative">
                    <img
                      src={`${BACKEND_URL}${sticker.url}`}
                      alt={sticker.name}
                      className="w-full h-full object-contain p-4"
                    />
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(sticker.id)}
                      disabled={deletingId === sticker.id}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                      title="Delete sticker"
                    >
                      {deletingId === sticker.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  {/* Sticker Info */}
                  <div className="p-3 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {sticker.name}
                    </h3>
                    {sticker.tags && sticker.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sticker.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-ember/10 text-ember text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {sticker.tags.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{sticker.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Card */}
            <div className="mt-8 bg-gradient-to-br from-ember to-ember-light rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-2">✨ Your Sticker Collection</h3>
              <p className="text-ember-100 mb-4">
                You have created {stickers.length} custom {stickers.length === 1 ? 'sticker' : 'stickers'}!
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-sm text-ember-100">Total Stickers</p>
                  <p className="text-2xl font-bold">{stickers.length}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-sm text-ember-100">Storage Used</p>
                  <p className="text-2xl font-bold">
                    {(stickers.reduce((sum, s) => sum + (s.file_size || 0), 0) / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyStickersPage;
