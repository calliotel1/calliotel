import React, { useState, useEffect } from 'react';
import { Eye, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VideoReactionDisplay = ({ videoId, autoRefresh = false }) => {
  const [reactions, setReactions] = useState([]);
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReactions();
    
    if (autoRefresh) {
      const interval = setInterval(fetchReactions, 5000); // Refresh every 5s
      return () => clearInterval(interval);
    }
  }, [videoId, autoRefresh]);

  const fetchReactions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/video-reactions/reactions/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setReactions(data.reactions);
        setCounts(data.counts);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const reactionEmojis = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    fire: '🔥',
    wow: '😮',
    sad: '😢',
    applause: '👏'
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading reactions...</div>;
  }

  if (total === 0) {
    return (
      <div className="text-sm text-gray-500">
        <span className="flex items-center space-x-1">
          <span>No reactions yet. Be the first!</span>
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Reaction Counts */}
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(counts).map(([reactionId, count]) => (
          <div
            key={reactionId}
            className="flex items-center space-x-1 bg-gray-100 rounded-full px-3 py-1 hover:bg-gray-200 transition-colors"
          >
            <span className="text-lg">{reactionEmojis[reactionId] || '✨'}</span>
            <span className="text-sm font-semibold text-gray-700">{count}</span>
          </div>
        ))}
      </div>

      {/* Total Reactions */}
      <div className="text-xs text-gray-500">
        {total} {total === 1 ? 'reaction' : 'reactions'}
      </div>
    </div>
  );
};

export default VideoReactionDisplay;