import React, { useState } from 'react';
import { X, Swords, Zap, Shield, Flame, Trophy, Clock } from 'lucide-react';
import axios from 'axios';
import ScheduleMessageModal from './ScheduleMessageModal';

const API = process.env.REACT_APP_BACKEND_URL;

const ChallengeModal = ({ friend, onClose, onSuccess }) => {
  const [gameType, setGameType] = useState('duel');
  const [wagerAmount, setWagerAmount] = useState(50);
  const [difficulty, setDifficulty] = useState('medium');
  const [chaosMode, setChaosMode] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const games = [
    {
      id: 'speed_dialer',
      name: 'Speed Dialer',
      icon: '⚡',
      color: 'purple',
      description: 'Race to type phone numbers',
      needsWager: false
    },
    {
      id: 'duel',
      name: 'The Duel',
      icon: '⚔️',
      color: 'red',
      description: '1v1 XP wagering battle',
      needsWager: true
    },
    {
      id: 'phish_finder',
      name: 'Phish-Finder',
      icon: '🧠',
      color: 'blue',
      description: 'Security awareness quiz',
      needsWager: false
    }
  ];

  const selectedGame = games.find(g => g.id === gameType);

  const sendChallenge = async () => {
    try {
      setSending(true);
      const token = localStorage.getItem('token');
      
      const payload = {
        opponent_id: friend.user_id,
        game_type: gameType,
        difficulty,
        chaos_mode: chaosMode,
        message: message.trim() || null
      };
      
      if (gameType === 'duel') {
        payload.wager_amount = wagerAmount;
      }
      
      await axios.post(
        `${API}/api/game/challenge/send`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error sending challenge:', error);
      alert(error.response?.data?.detail || 'Failed to send challenge');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full border-2 border-ember max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="text-yellow-500" />
              Challenge {friend.full_name || friend.name || friend.email}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Send a game challenge via chat
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="text-gray-400" size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Game Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Game
            </label>
            <div className="space-y-2">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setGameType(game.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    gameType === game.id
                      ? `border-${game.color}-500 bg-${game.color}-500/10`
                      : 'border-gray-700 bg-gray-700/30 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{game.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-white">{game.name}</div>
                      <div className="text-sm text-gray-400">{game.description}</div>
                    </div>
                    {gameType === game.id && (
                      <div className="text-green-500">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Wager (Only for Duel) */}
          {gameType === 'duel' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                XP Wager
              </label>
              <input
                type="number"
                value={wagerAmount}
                onChange={(e) => setWagerAmount(parseInt(e.target.value) || 50)}
                min="10"
                max="1000"
                step="10"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white outline-none focus:border-red-500"
              />
              <div className="text-xs text-gray-400 mt-1">
                Min: 10 XP • Max: 1000 XP • Winner takes all!
              </div>
            </div>
          )}

          {/* Difficulty */}
          {(gameType === 'speed_dialer' || gameType === 'duel') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      difficulty === diff
                        ? 'border-ember bg-ember/20'
                        : 'border-gray-700 bg-gray-700/30 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-bold text-white capitalize">{diff}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chaos Mode */}
          {(gameType === 'speed_dialer' || gameType === 'duel') && (
            <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-lg">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Flame className="text-red-500" size={24} />
                  <div>
                    <div className="font-bold text-red-500">Chaos Mode</div>
                    <div className="text-xs text-gray-400">
                      Numbers flicker & move (2x XP!)
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={chaosMode}
                  onChange={(e) => setChaosMode(e.target.checked)}
                  className="w-6 h-6 rounded accent-red-500"
                />
              </label>
            </div>
          )}

          {/* Trash Talk Message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Trash Talk (Optional) 💬
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message to your challenge..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white outline-none focus:border-ember resize-none"
              rows="3"
            />
          </div>

          {/* Schedule Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600" data-testid="schedule-toggle-container">
            <div className="flex items-center gap-2">
              <Clock className="text-ember" size={20} />
              <div>
                <p className="text-sm font-medium text-white">Schedule Challenge</p>
                <p className="text-xs text-gray-400">Send at a specific time</p>
              </div>
            </div>
            <button
              onClick={() => setScheduleMode(!scheduleMode)}
              data-testid="schedule-toggle-btn"
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                scheduleMode ? 'bg-ember' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  scheduleMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Send Buttons */}
          <div className="flex gap-3">
            <button
              onClick={sendChallenge}
              disabled={sending || scheduleMode}
              data-testid="send-now-btn"
              className="flex-1 py-4 bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                'Sending...'
              ) : (
                <>
                  <Swords size={24} />
                  Send Now
                </>
              )}
            </button>
            
            {scheduleMode && (
              <button
                onClick={() => setShowScheduleModal(true)}
                data-testid="schedule-challenge-btn"
                className="flex-1 py-4 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
              >
                <Clock size={24} />
                Schedule
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleMessageModal
          receiverId={friend.user_id}
          receiverName={friend.full_name || friend.email}
          messageContent={message || `⚔️ ${selectedGame.name} Challenge`}
          messageType="challenge"
          challengeConfig={{
            game_type: gameType,
            wager_amount: gameType === 'duel' ? wagerAmount : undefined,
            difficulty,
            chaos_mode: chaosMode
          }}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            setShowScheduleModal(false);
            onClose();
            onSuccess && onSuccess();
          }}
        />
      )}
    </div>
  );
};

export default ChallengeModal;
