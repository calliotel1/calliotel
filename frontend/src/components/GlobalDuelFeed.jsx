import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Flame, Target } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const GlobalDuelFeed = ({ limit = 10 }) => {
  const [recentDuels, setRecentDuels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentDuels();
    
    // Poll every 5 seconds
    const interval = setInterval(fetchRecentDuels, 5000);
    
    return () => clearInterval(interval);
  }, [limit]);

  const fetchRecentDuels = async () => {
    try {
      const response = await axios.get(
        `${API}/api/game/duel/feed?status=completed&limit=${limit}`
      );
      
      setRecentDuels(response.data.duels || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching duel feed:', error);
      setLoading(false);
    }
  };

  const getTimeSince = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getRiskEmoji = (wager) => {
    if (wager < 50) return '🟢';
    if (wager < 100) return '🟡';
    if (wager < 250) return '🟠';
    return '🔴';
  };

  const getDifficultyEmoji = (difficulty) => {
    const map = { easy: '🎯', medium: '⚡', hard: '🔥' };
    return map[difficulty] || '⚡';
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="animate-spin w-8 h-8 border-4 border-gray-600 border-t-yellow-500 rounded-full mx-auto"></div>
      </div>
    );
  }

  if (recentDuels.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No duels yet. Be the first to compete!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentDuels.map((duel) => {
        // Calculate time difference
        const winnerTime = duel.winner_id === duel.challenger_id 
          ? duel.challenger_time 
          : duel.opponent_time;
        const loserTime = duel.winner_id === duel.challenger_id 
          ? duel.opponent_time 
          : duel.challenger_time;
        const timeDiff = Math.abs(winnerTime - loserTime).toFixed(2);
        
        return (
          <div 
            key={duel.id} 
            className="bg-gray-700/50 rounded-lg p-4 border-l-4 border-yellow-500 hover:bg-gray-700/70 transition-all"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="text-yellow-500" size={20} />
                <span className="font-bold text-yellow-500">
                  {duel.winner_email?.split('@')[0]}
                </span>
                <span className="text-gray-400 text-sm">defeated</span>
                <span className="text-gray-400">
                  {(duel.winner_email === duel.challenger_email 
                    ? duel.opponent_email 
                    : duel.challenger_email)?.split('@')[0]}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                <Clock size={12} className="inline mr-1" />
                {getTimeSince(duel.completed_at)}
              </div>
            </div>

            {/* Details */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm">
                {/* Risk Level */}
                <div className="flex items-center gap-1">
                  <span>{getRiskEmoji(duel.wager_amount)}</span>
                  <span className="text-gray-400">{duel.wager_amount * 2} XP</span>
                </div>
                
                {/* Difficulty */}
                <div className="flex items-center gap-1">
                  <span>{getDifficultyEmoji(duel.difficulty)}</span>
                  <span className="text-gray-400 capitalize">{duel.difficulty}</span>
                </div>
                
                {/* Chaos Mode */}
                {duel.chaos_mode && (
                  <div className="flex items-center gap-1">
                    <Flame size={14} className="text-red-500" />
                    <span className="text-red-400 text-xs">Chaos</span>
                  </div>
                )}
                
                {/* Time Difference */}
                <div className="flex items-center gap-1">
                  <Target size={14} className="text-green-500" />
                  <span className="text-green-400 font-mono">{timeDiff}s</span>
                </div>
              </div>

              {/* Times */}
              <div className="text-sm font-mono text-gray-400">
                <span className="text-green-500">{winnerTime?.toFixed(2)}s</span>
                <span className="mx-1">vs</span>
                <span className="text-red-500">{loserTime?.toFixed(2)}s</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GlobalDuelFeed;
