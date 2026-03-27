import React, { useState } from 'react';
import { ArrowLeft, BarChart3, Sprout, Sparkles, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CombatCard from '../CombatCard';

const ChatHeader = ({ 
  friend, 
  onBack, 
  onShowStats, 
  onShowStreak,
  onShowWrapped,
  onChallenge 
}) => {
  const navigate = useNavigate();
  const [showCombatCard, setShowCombatCard] = useState(false);

  return (
    <>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          
          {/* Clickable Avatar */}
          <div 
            onClick={() => setShowCombatCard(true)}
            className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          >
            <span className="text-white font-bold">
              {friend.email.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div>
            <h3 
              className="font-bold text-gray-900 cursor-pointer hover:text-ember"
              onClick={() => setShowCombatCard(true)}
            >
              {friend.full_name || friend.email}
            </h3>
            {/* Mood Status Display */}
            {friend.mood_status && (
              <p className="text-xs text-ember italic">
                {friend.mood_status}
              </p>
            )}
            {!friend.mood_status && (
              <p className="text-xs text-gray-600">{friend.email}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Challenge Button */}
          <button
            onClick={onChallenge}
            className="p-2 hover:bg-red-100 rounded-full transition-colors group"
            title="Challenge to Game"
          >
            <Swords className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
          </button>
          
          {/* Wrapped Button */}
          <button
            onClick={onShowWrapped}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="View Wrapped"
          >
            <Sparkles className="w-5 h-5 text-ember" />
          </button>
          
          {/* Stats Button */}
          <button
            onClick={onShowStats}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="View Stats"
          >
            <BarChart3 className="w-5 h-5 text-ember" />
          </button>
          
          {/* Streak Button */}
          <button
            onClick={onShowStreak}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="View Streak"
          >
            <Sprout className="w-5 h-5 text-green-600" />
          </button>
        </div>
      </div>

      {/* Combat Card Modal */}
      {showCombatCard && (
        <CombatCard
          userId={friend.user_id}
          onClose={() => setShowCombatCard(false)}
        />
      )}
    </>
  );
};

export default ChatHeader;
