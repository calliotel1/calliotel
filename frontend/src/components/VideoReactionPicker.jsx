import React, { useState, useEffect } from 'react';
import { Heart, ThumbsUp, Laugh, Flame, AlertCircle, Frown, Hand, Sparkles, Crown, Zap, Gem } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Reaction icon mapping
const REACTION_ICONS = {
  like: ThumbsUp,
  love: Heart,
  laugh: Laugh,
  fire: Flame,
  wow: AlertCircle,
  sad: Frown,
  applause: Hand,
  golden_fire: Sparkles,
  diamond_heart: Gem,
  confetti_blast: Sparkles,
  diamond: Gem,
  crown: Crown,
  lightning: Zap,
  unicorn: Sparkles
};

const VideoReactionPicker = ({ videoId, onReactionAdded }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [reactions, setReactions] = useState({ classic: [], super: [], mystery: [], combos: [] });
  const [selectedReactions, setSelectedReactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailableReactions();
  }, []);

  const fetchAvailableReactions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/video-reactions/reactions/available`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setReactions(data);
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const toggleReaction = (reactionId) => {
    setSelectedReactions(prev => {
      if (prev.includes(reactionId)) {
        return prev.filter(r => r !== reactionId);
      } else if (prev.length < 2) {
        // Allow max 2 reactions for combos
        return [...prev, reactionId];
      }
      return prev;
    });
  };

  const submitReaction = async (isSuper = false) => {
    if (selectedReactions.length === 0) {
      toast.error('Please select at least one reaction!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/video-reactions/reactions/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          video_id: videoId,
          reaction_ids: selectedReactions,
          is_super: isSuper
        })
      });

      const data = await response.json();

      if (response.status === 402) {
        toast.error(data.detail || 'Insufficient balance!');
        return;
      }

      if (data.success) {
        if (data.combo) {
          toast.success(`✨ ${data.combo}! +${data.xp_earned} XP`, {
            duration: 4000,
            className: 'bg-gradient-to-r from-ember to-ember-light/50 text-white'
          });
        } else {
          toast.success(data.message);
        }
        setSelectedReactions([]);
        setShowPicker(false);
        if (onReactionAdded) onReactionAdded();
      } else {
        toast.error(data.detail || 'Failed to add reaction');
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Reaction Button */}
      <Button
        onClick={() => setShowPicker(!showPicker)}
        variant="outline"
        size="sm"
        className="rounded-full"
      >
        {selectedReactions.length > 0 ? (
          <span className="flex items-center space-x-1">
            {selectedReactions.map(id => {
              const reaction = [...reactions.classic, ...reactions.super, ...reactions.mystery]
                .find(r => r.id === id);
              return reaction ? <span key={id}>{reaction.emoji}</span> : null;
            })}
          </span>
        ) : (
          <span className="flex items-center space-x-1">
            <Heart className="h-4 w-4" />
            <span>React</span>
          </span>
        )}
      </Button>

      {/* Reaction Picker Popup */}
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-2xl p-4 min-w-[320px] z-50 border-2 border-gray-200">
          {/* Classic Reactions */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">Classic Reactions</p>
            <div className="grid grid-cols-7 gap-2">
              {reactions.classic.map((reaction) => (
                <button
                  key={reaction.id}
                  onClick={() => toggleReaction(reaction.id)}
                  className={`text-3xl hover:scale-125 transition-transform p-2 rounded-lg ${
                    selectedReactions.includes(reaction.id) ? 'bg-blue-100 scale-110' : ''
                  }`}
                  title={reaction.name}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Mystery Reactions */}
          {reactions.mystery && reactions.mystery.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">🎁 Unlocked Reactions</p>
              <div className="grid grid-cols-4 gap-2">
                {reactions.mystery.map((reaction) => (
                  <button
                    key={reaction.id}
                    onClick={() => toggleReaction(reaction.id)}
                    className={`text-3xl hover:scale-125 transition-transform p-2 rounded-lg ${
                      selectedReactions.includes(reaction.id) ? 'bg-ember/10 scale-110' : ''
                    }`}
                    title={reaction.name}
                  >
                    {reaction.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Super Reactions */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">💎 Super Reactions (Paid)</p>
            <div className="grid grid-cols-3 gap-2">
              {reactions.super.map((reaction) => (
                <button
                  key={reaction.id}
                  onClick={() => toggleReaction(reaction.id)}
                  className={`flex flex-col items-center p-2 rounded-lg border-2 hover:scale-105 transition-transform ${
                    selectedReactions.includes(reaction.id)
                      ? 'bg-yellow-100 border-yellow-400 scale-105'
                      : 'border-gray-200'
                  }`}
                  title={reaction.name}
                >
                  <span className="text-2xl mb-1">{reaction.emoji}</span>
                  <span className="text-xs font-bold text-green-600">${reaction.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Combo Hint */}
          {selectedReactions.length === 2 && (
            <div className="mb-3 p-2 bg-gradient-to-r from-ember/10 to-ember-light/10 rounded-lg">
              <p className="text-xs text-ember-700 font-semibold text-center">
                ✨ Combo detected! Earn bonus XP!
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={() => submitReaction(false)}
              disabled={loading || selectedReactions.length === 0}
              className="flex-1 bg-gradient-to-r from-ember to-ember-light hover:from-ember hover:to-ember-light"
              size="sm"
            >
              {loading ? 'Adding...' : 'React'}
            </Button>
            {selectedReactions.some(id => reactions.super.find(r => r.id === id)) && (
              <Button
                onClick={() => submitReaction(true)}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                size="sm"
              >
                Super React
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoReactionPicker;