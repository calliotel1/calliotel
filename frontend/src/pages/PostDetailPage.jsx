import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PostDetailPage = () => {
  const { postId } = useParams();
  const { darkMode } = useTheme();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: 'Error',
        description: 'Failed to load post',
        variant: 'destructive'
      });
      if (error.response?.status === 404) {
        navigate('/feed');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      if (post.is_liked) {
        await axios.delete(`${API}/posts/${postId}/like`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPost(prev => ({ ...prev, is_liked: false, likes_count: prev.likes_count - 1 }));
      } else {
        await axios.post(`${API}/posts/${postId}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPost(prev => ({ ...prev, is_liked: true, likes_count: prev.likes_count + 1 }));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/posts/${postId}/comments`,
        { content: newComment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments(prev => [...prev, response.data]);
      setPost(prev => ({ ...prev, comments_count: prev.comments_count + 1 }));
      setNewComment('');
      
      toast({
        title: 'Success',
        description: 'Comment added!'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.delete(`${API}/posts/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setComments(prev => prev.filter(c => c.comment_id !== commentId));
      setPost(prev => ({ ...prev, comments_count: prev.comments_count - 1 }));
      
      toast({
        title: 'Success',
        description: 'Comment deleted'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive'
      });
    }
  };

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Post not found</p>
          <button
            onClick={() => navigate('/feed')}
            className="mt-4 text-ember hover:text-ember-light"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Post</h1>
              <p className="text-sm text-gray-600">in {post.channel_name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Post Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {post.author_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{post.author_name}</p>
                <p className="text-sm text-gray-500">
                  <span className="text-ember font-medium">{post.channel_name}</span> • {formatTime(post.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Post Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              {post.media_urls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt="Post media"
                  className="w-full h-64 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center space-x-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                post.is_liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart className={`w-6 h-6 ${post.is_liked ? 'fill-current' : ''}`} />
              <span className="font-medium">{post.likes_count}</span>
            </button>

            <div className="flex items-center space-x-2 text-gray-600">
              <MessageCircle className="w-6 h-6" />
              <span className="font-medium">{post.comments_count}</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Comments ({comments.length})
          </h2>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                  maxLength={1000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">{newComment.length}/1000</p>
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-ember to-ember-light text-white rounded-lg hover:from-ember hover:to-ember-light transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Posting...' : 'Post'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.comment_id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {comment.author_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{comment.author_name}</p>
                        <p className="text-xs text-gray-500">{formatTime(comment.created_at)}</p>
                      </div>
                      {comment.is_author && (
                        <button
                          onClick={() => handleDeleteComment(comment.comment_id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 mt-2">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
