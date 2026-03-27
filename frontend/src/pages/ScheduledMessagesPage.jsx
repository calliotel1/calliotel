import React, { useState, useEffect } from 'react';
import { Clock, Trash2, Edit, Send, Calendar, User, MessageSquare, Loader } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ScheduledMessagesPage = () => {
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    fetchScheduledMessages();
  }, []);

  const fetchScheduledMessages = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/scheduled-messages/scheduled`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScheduledMessages(response.data.scheduled_messages || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load scheduled messages',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelScheduled = async (messageId) => {
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.delete(`${API}/scheduled-messages/scheduled/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast({
        title: 'Success',
        description: 'Scheduled message cancelled'
      });
      
      fetchScheduledMessages();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to cancel message',
        variant: 'destructive'
      });
    }
  };

  const getTimeUntilSend = (scheduledTime) => {
    try {
      const scheduled = new Date(scheduledTime);
      const now = new Date();
      
      if (scheduled <= now) {
        return 'Sending soon...';
      }
      
      return 'in ' + formatDistanceToNow(scheduled, { addSuffix: false });
    } catch (error) {
      return 'Soon';
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy · h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const pendingMessages = scheduledMessages.filter(m => m.status === 'pending');
  const sentMessages = scheduledMessages.filter(m => m.status === 'sent');

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading scheduled messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="w-8 h-8 text-orange-600" />
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Scheduled Messages
            </h1>
          </div>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Manage your scheduled messages
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {pendingMessages.length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sent</p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {sentMessages.length}
                </p>
              </div>
              <Send className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Pending Messages */}
        {pendingMessages.length > 0 && (
          <div className="mb-8">
            <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Pending Messages
            </h2>
            <div className="space-y-4">
              {pendingMessages.map((message) => (
                <div
                  key={message.scheduled_time}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`${darkMode ? 'bg-gray-700' : 'bg-orange-100'} rounded-full p-3`}>
                        <User className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                          To: {message.recipient_id}
                        </p>
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          {message.content}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-orange-600" />
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                              {formatDateTime(message.scheduled_time)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium">
                              Sending {getTimeUntilSend(message.scheduled_time)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelScheduled(message.scheduled_time)}
                      className="ml-4 p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                      title="Cancel"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent Messages */}
        {sentMessages.length > 0 && (
          <div>
            <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Recently Sent
            </h2>
            <div className="space-y-4">
              {sentMessages.slice(0, 10).map((message, idx) => (
                <div
                  key={idx}
                  className={`${darkMode ? 'bg-gray-800 opacity-75' : 'bg-white opacity-75'} rounded-xl p-6 shadow-sm`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`${darkMode ? 'bg-gray-700' : 'bg-green-100'} rounded-full p-3`}>
                      <Send className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                        To: {message.recipient_id}
                      </p>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 text-sm`}>
                        {message.content}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}>
                          Sent {message.sent_at ? formatDateTime(message.sent_at) : 'recently'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {scheduledMessages.length === 0 && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center shadow-sm`}>
            <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              No Scheduled Messages
            </h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Start scheduling messages from your chat conversations
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduledMessagesPage;
