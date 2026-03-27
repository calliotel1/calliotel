import React, { useState } from 'react';
import { X, Clock, Calendar, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';

const API = process.env.REACT_APP_BACKEND_URL;

const ScheduleMessageModal = ({ 
  receiverId, 
  receiverName,
  messageContent, 
  messageType = 'text',
  challengeConfig = null,
  onClose, 
  onSuccess 
}) => {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const { toast } = useToast();

  // Calculate minimum datetime (5 minutes from now)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now;
  };

  // Calculate maximum datetime (30 days from now)
  const getMaxDateTime = () => {
    const max = new Date();
    max.setDate(max.getDate() + 30);
    return max;
  };

  // Format date for input min/max
  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Calculate countdown
  const getCountdown = () => {
    if (!scheduledDate || !scheduledTime) return null;

    const scheduled = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    const diff = scheduled - now;

    if (diff < 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  };

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select both date and time',
        variant: 'destructive'
      });
      return;
    }

    try {
      setScheduling(true);
      const token = localStorage.getItem('token');
      
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const now = new Date();

      // Validation
      const diff = scheduledDateTime - now;
      if (diff < 5 * 60 * 1000) {
        toast({
          title: 'Invalid Time',
          description: 'Scheduled time must be at least 5 minutes in the future',
          variant: 'destructive'
        });
        return;
      }

      if (diff > 30 * 24 * 60 * 60 * 1000) {
        toast({
          title: 'Invalid Time',
          description: 'Cannot schedule more than 30 days in advance',
          variant: 'destructive'
        });
        return;
      }

      const payload = {
        receiver_id: receiverId,
        content: messageContent,
        type: messageType,
        scheduled_time: scheduledDateTime.toISOString(),
        challenge_config: challengeConfig
      };

      const response = await axios.post(
        `${API}/api/scheduled-messages/schedule`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: '⏰ Scheduled!',
        description: response.data.message,
        duration: 5000
      });

      onSuccess && onSuccess();
      onClose();

    } catch (error) {
      console.error('Error scheduling message:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to schedule message',
        variant: 'destructive'
      });
    } finally {
      setScheduling(false);
    }
  };

  const countdown = getCountdown();
  const isChallenge = messageType === 'challenge';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="schedule-message-modal">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 relative shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Close Button */}
        <button
          onClick={onClose}
          data-testid="schedule-modal-close"
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="text-gray-500 dark:text-gray-400" size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-ember/10 dark:bg-olive/30 rounded-full">
              <Clock className="text-ember dark:text-ember" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="time-bender-title">
                ⏰ Time-Bender
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Schedule {isChallenge ? 'challenge' : 'message'} for later
              </p>
            </div>
          </div>
        </div>

        {/* Recipient */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Sending to:</p>
          <p className="font-semibold text-gray-900 dark:text-white" data-testid="schedule-recipient">{receiverName}</p>
        </div>

        {/* Preview */}
        <div className="mb-4 p-3 bg-gradient-to-r from-ember/5 to-ember-light/5 dark:from-ember-dark/20 dark:to-ember-dark/20 rounded-lg border border-ember/20 dark:border-ember/20" data-testid="schedule-preview">
          <p className="text-xs text-ember-700 dark:text-ember font-semibold mb-1">PREVIEW:</p>
          <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3">
            {messageContent || (isChallenge ? '⚔️ Game Challenge' : 'Message')}
          </p>
          {isChallenge && challengeConfig && (
            <p className="text-xs text-ember dark:text-ember mt-1" data-testid="challenge-preview-details">
              {challengeConfig.game_type?.replace('_', ' ').toUpperCase()} 
              {challengeConfig.wager_amount && ` • ${challengeConfig.wager_amount} XP`}
              {challengeConfig.difficulty && ` • ${challengeConfig.difficulty}`}
              {challengeConfig.chaos_mode && ' • CHAOS MODE'}
            </p>
          )}
        </div>

        {/* Date/Time Picker */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={formatDateForInput(getMinDateTime())}
              max={formatDateForInput(getMaxDateTime())}
              data-testid="schedule-date-input"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Clock className="inline w-4 h-4 mr-1" />
              Time
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              data-testid="schedule-time-input"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Countdown Display */}
        {countdown && (
          <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border-2 border-yellow-400 dark:border-yellow-600" data-testid="t-minus-countdown">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-800 dark:text-yellow-300 font-semibold">T-MINUS:</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="countdown-value">{countdown}</p>
              </div>
              <div className="text-4xl">💣</div>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-ember/20 flex items-start gap-2">
          <AlertCircle className="text-ember dark:text-blue-400 flex-shrink-0" size={18} />
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <p className="font-semibold mb-1">Minimum: 5 minutes • Maximum: 30 days</p>
            <p>{isChallenge ? 'XP will be locked when challenge is sent' : 'Message will appear as "⏰ Scheduled Taunt"'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            data-testid="schedule-cancel-btn"
            className="flex-1 py-3 px-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={scheduling || !scheduledDate || !scheduledTime}
            data-testid="set-time-bomb-btn"
            className="flex-1 py-3 px-4 bg-gradient-to-r from-ember to-ember-light text-white rounded-lg font-semibold hover:from-ember-light hover:to-ember-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {scheduling ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Scheduling...
              </>
            ) : (
              <>
                <Clock size={20} />
                Set Time-Bomb
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMessageModal;
