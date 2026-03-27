import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, TrendingUp, Filter, Grid, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import BottomNav from '../components/BottomNav';
import PostCard from '../components/PostCard';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [feedType, setFeedType] = useState('personalized'); // personalized, recent, media
  const [algorithm, setAlgorithm] = useState('engagement'); // engagement, recent, popular
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeed();
  }, [feedType, algorithm]);

  const fetchFeed = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const token = safeLocalStorage.getItem('token');
      let endpoint = '';
      
      if (feedType === 'personalized') {
        endpoint = `${API}/feed/personalized?limit=20&algorithm=${algorithm}`;
      } else if (feedType === 'media') {
        endpoint = `${API}/feed/media-feed?limit=20&media_type=all`;
      } else {
        endpoint = `${API}/posts/feed?limit=20`;
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPosts(feedType === 'media' ? response.data.posts || [] : response.data);
    } catch (error) {
      console.error('Error fetching feed:', error);
      toast({
        title: 'Error',
        description: 'Failed to load feed',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(`${API}/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update UI optimistically
      setPosts(prev => prev.map(post => 
        post.post_id === postId
          ? { ...post, is_liked: true, likes_count: post.likes_count + 1 }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleUnlike = async (postId) => {
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.delete(`${API}/posts/${postId}/like`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update UI optimistically
      setPosts(prev => prev.map(post => 
        post.post_id === postId
          ? { ...post, is_liked: false, likes_count: post.likes_count - 1 }
          : post
      ));
    } catch (error) {
      console.error('Error unliking post:', error);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.delete(`${API}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPosts(prev => prev.filter(p => p.post_id !== postId));
      
      toast({
        title: 'Success',
        description: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pb-24`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm sticky top-0 z-10 border-b`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Feed
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Your personalized updates
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 ${
                  showFilters
                    ? 'bg-ember/10 text-ember'
                    : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } rounded-lg transition-all`}
                title="Filter Feed"
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/channels/discovery')}
                className={`p-2 ${
                  darkMode
                    ? 'bg-ember hover:bg-ember-light'
                    : 'bg-ember/10 hover:bg-ember/20'
                } text-ember ${darkMode ? 'text-white' : ''} rounded-lg transition-all`}
                title="Discover Channels"
              >
                <TrendingUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/channels/create-post')}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-ember to-ember-light text-white rounded-lg hover:from-ember hover:to-ember-light transition-all shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline font-semibold">Post</span>
              </button>
            </div>
          </div>

          {/* Feed Type Tabs */}
          <div className={`flex space-x-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-1 mb-3`}>
            <button
              onClick={() => setFeedType('personalized')}
              className={`flex-1 py-2 px-3 rounded-md font-medium transition-all text-sm flex items-center justify-center gap-1.5 ${
                feedType === 'personalized'
                  ? darkMode
                    ? 'bg-gray-800 text-ember shadow-sm'
                    : 'bg-white text-ember shadow-sm'
                  : darkMode
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              For You
            </button>
            <button
              onClick={() => setFeedType('recent')}
              className={`flex-1 py-2 px-3 rounded-md font-medium transition-all text-sm flex items-center justify-center gap-1.5 ${
                feedType === 'recent'
                  ? darkMode
                    ? 'bg-gray-800 text-ember shadow-sm'
                    : 'bg-white text-ember shadow-sm'
                  : darkMode
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              All
            </button>
            <button
              onClick={() => setFeedType('media')}
              className={`flex-1 py-2 px-3 rounded-md font-medium transition-all text-sm flex items-center justify-center gap-1.5 ${
                feedType === 'media'
                  ? darkMode
                    ? 'bg-gray-800 text-ember shadow-sm'
                    : 'bg-white text-ember shadow-sm'
                  : darkMode
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Media
            </button>
          </div>

          {/* Algorithm Filter (For Personalized Feed) */}
          {showFilters && feedType === 'personalized' && (
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3 mb-2`}>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                Sort by:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setAlgorithm('engagement')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    algorithm === 'engagement'
                      ? 'bg-ember text-white'
                      : darkMode
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Engagement
                </button>
                <button
                  onClick={() => setAlgorithm('recent')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    algorithm === 'recent'
                      ? 'bg-ember text-white'
                      : darkMode
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Recent
                </button>
                <button
                  onClick={() => setAlgorithm('popular')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    algorithm === 'popular'
                      ? 'bg-ember text-white'
                      : darkMode
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Popular
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              No Posts Yet
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Join some channels to see posts in your feed!
            </p>
            <button
              onClick={() => navigate('/channels/discovery')}
              className="px-6 py-3 bg-gradient-to-r from-ember to-ember-light text-white rounded-lg hover:from-ember hover:to-ember-light transition-all font-semibold"
            >
              Discover Channels
            </button>
          </div>
        ) : (
          <>
            {/* Refresh Button */}
            <div className="mb-4 flex justify-center">
              <button
                onClick={() => fetchFeed(false)}
                disabled={refreshing}
                className="text-sm text-ember hover:text-ember-light font-medium disabled:opacity-50"
              >
                {refreshing ? 'Refreshing...' : '↻ Refresh Feed'}
              </button>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.post_id}
                  post={post}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                  onDelete={handleDelete}
                  onNavigate={(postId) => navigate(`/posts/${postId}`)}
                />
              ))}
            </div>

            {/* Load More */}
            <div className="mt-6 text-center">
              <button
                onClick={() => fetchFeed(false)}
                className="text-ember hover:text-ember-light font-medium text-sm"
              >
                Load More Posts
              </button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default FeedPage;
