import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, Settings, Plus, Lock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import PostCard from '../components/PostCard';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChannelDetailPage = () => {
  const { channelId } = useParams();
  const { darkMode } = useTheme();
  const [channel, setChannel] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchChannel();
    fetchPosts();
  }, [channelId]);

  const fetchChannel = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/channels/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChannel(response.data);
    } catch (error) {
      console.error('Error fetching channel:', error);
      toast({
        title: 'Error',
        description: error.response?.status === 404 ? 'Channel not found' : 'Failed to load channel',
        variant: 'destructive'
      });
      if (error.response?.status === 404) {
        navigate('/channels');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/posts/channel/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleJoin = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(`${API}/channels/${channelId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setChannel(prev => ({
        ...prev,
        is_member: true,
        member_count: prev.member_count + 1
      }));

      toast({
        title: 'Success',
        description: 'Joined channel successfully!'
      });
    } catch (error) {
      console.error('Error joining channel:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to join channel',
        variant: 'destructive'
      });
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this channel?')) return;

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(`${API}/channels/${channelId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: 'Success',
        description: 'Left channel successfully'
      });

      navigate('/channels');
    } catch (error) {
      console.error('Error leaving channel:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to leave channel',
        variant: 'destructive'
      });
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(`${API}/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Channel not found</p>
          <button
            onClick={() => navigate('/channels')}
            className="mt-4 text-ember hover:text-ember-light"
          >
            Back to Channels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 p-2 hover:bg-gray-100 rounded-full transition-colors inline-flex items-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Channel Banner */}
          <div className="h-32 bg-gradient-to-br from-ember to-ember-light rounded-xl relative mb-16">
            {channel.is_private && (
              <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-2">
                <Lock className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Channel Info */}
          <div className="-mt-12 px-4">
            <div className="flex items-end justify-between">
              <div className="flex items-end space-x-4">
                <div className="w-24 h-24 bg-gradient-to-br from-ember to-ember-light rounded-2xl flex items-center justify-center ring-4 ring-white">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <div className="pb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{channel.name}</h1>
                  <p className="text-gray-600 mt-1">{channel.description}</p>
                </div>
              </div>

              {channel.is_member ? (
                <button
                  onClick={handleLeave}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold"
                >
                  Leave
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  className="px-6 py-2 bg-gradient-to-r from-ember to-ember-light text-white rounded-lg hover:from-ember hover:to-ember-light transition-all font-semibold shadow-lg"
                >
                  Join Channel
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{channel.member_count.toLocaleString()} members</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>{channel.post_count.toLocaleString()} posts</span>
              </div>
              {channel.is_admin && (
                <div className="text-ember font-semibold">
                  👑 Admin
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {channel.is_member && (
          <button
            onClick={() => navigate('/channels/create-post')}
            className="w-full mb-6 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 flex items-center space-x-3 text-left"
          >
            <Plus className="w-6 h-6 text-ember" />
            <span className="text-gray-600">Create a post in this channel...</span>
          </button>
        )}

        {/* Posts */}
        {loadingPosts ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Posts Yet</h3>
            <p className="text-gray-600 mb-6">
              {channel.is_member 
                ? 'Be the first to post in this channel!' 
                : 'Join the channel to see posts'}
            </p>
            {channel.is_member && (
              <button
                onClick={() => navigate('/channels/create-post')}
                className="px-6 py-3 bg-gradient-to-r from-ember to-ember-light text-white rounded-lg hover:from-ember hover:to-ember-light transition-all font-semibold"
              >
                Create First Post
              </button>
            )}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default ChannelDetailPage;
