import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, UserPlus, Check, X, Search, Trash2, Mail } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import CameraCapture from '../components/CameraCapture';
import StreakModal from '../components/StreakModal';
import ChatStatsModal from '../components/ChatStatsModal';
import FriendList from '../components/chat/FriendList';
import ChatHeader from '../components/chat/ChatHeader';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import StoriesBar from '../components/StoriesBar';
import StoryViewer from '../components/StoryViewer';
import StoryViewersModal from '../components/StoryViewersModal';
import notificationSoundManager from '../utils/notificationSoundManager';
import VoiceRecorder from '../components/VoiceRecorder';
import VideoRecorder from '../components/VideoRecorder';
import SmartReplies from '../components/SmartReplies';
import ChallengeModal from '../components/ChallengeModal';
import ScheduleMessageModal from '../components/ScheduleMessageModal';
import { gamificationEvents } from '../utils/gamificationEvents';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

const ChatPage = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  
  // Friend requests
  const [friendRequests, setFriendRequests] = useState({ received: [], sent: [] });
  const [showRequests, setShowRequests] = useState(false);
  
  // Add friend
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  
  // Email invitation
  const [showEmailInvite, setShowEmailInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  
  // Stickers
  const [showStickers, setShowStickers] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('reactions');
  const [customStickers, setCustomStickers] = useState([]);
  const [loadingStickers, setLoadingStickers] = useState(false);
  
  // Camera & Media
  const [showCamera, setShowCamera] = useState(false);
  
  // Voice Notes
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  
  // Video Messages
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  
  // Streaks
  const [showStreakModal, setShowStreakModal] = useState(false);
  
  // Chat Stats
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  // Stories
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState(null);
  const [viewersStoryId, setViewersStoryId] = useState(null);
  
  // Smart Replies
  const [showSmartReplies, setShowSmartReplies] = useState(false);
  const [lastReceivedMessage, setLastReceivedMessage] = useState(null);
  
  // Challenge Modal
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  
  // Schedule Message Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const wsRef = useRef(null);
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  // WebSocket Setup
  useEffect(() => {
    const token = safeLocalStorage.getItem('token');
    if (!token) return;

    // Connect WebSocket
    const ws = new WebSocket(`${WS_URL}/api/chat/ws/${token}`);
    
    ws.onopen = () => {
      console.log('WebSocket Connected');
      setWsConnected(true);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setWsConnected(false);
    };
    
    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setWsConnected(false);
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (safeLocalStorage.getItem('token')) {
          window.location.reload();
        }
      }, 3000);
    };
    
    wsRef.current = ws;
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'connection':
        console.log('Connected to chat server');
        break;
      
      case 'new_message':
        // Add new message to the list if it's from the selected friend
        if (selectedFriend && data.message.sender_id === selectedFriend.user_id) {
          setMessages(prev => [...prev, data.message]);
          
          // Show smart replies for text messages
          if (data.message.type === 'text') {
            setLastReceivedMessage(data.message.content);
            setShowSmartReplies(true);
          }
          
          // Play notification sound for incoming message
          notificationSoundManager.playNewMessage();
          
          // Mark as read
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'mark_read',
              message_id: data.message.id
            }));
          }
        }
        
        // Update friend list to show new message indicator
        fetchFriends();
        break;
      
      case 'message_sent':
        console.log('Message delivered:', data.message_id);
        break;
      
      case 'typing':
        // Show typing indicator (you can implement this)
        console.log('User typing:', data.sender_id);
        break;
      
      case 'reaction_added':
        // Update message with new reaction
        setMessages(prev => prev.map(msg => 
          msg.id === data.message_id 
            ? { ...msg, reactions: [...(msg.reactions || []), { user_id: data.user_id, reaction: data.reaction }] }
            : msg
        ));
        break;
      
      case 'new_challenge':
        // New challenge received
        if (selectedFriend && data.challenge.challenger_id === selectedFriend.user_id) {
          setMessages(prev => [...prev, data.message]);
        }
        
        toast({
          title: '⚔️ New Challenge!',
          description: `${data.challenge.challenger_email} challenged you to ${data.challenge.game_name}`,
          duration: 5000,
        });
        
        notificationSoundManager.playNewMessage();
        fetchFriends();
        break;
      
      case 'challenge_accepted':
        // Challenge was accepted - redirect to game
        toast({
          title: '✅ Challenge Accepted!',
          description: 'Redirecting to game...',
          duration: 2000,
        });
        
        setTimeout(() => {
          navigate(data.redirect_url);
        }, 2000);
        break;
      
      case 'challenge_declined':
        // Challenge was declined
        toast({
          title: '❌ Challenge Declined',
          description: 'Your opponent declined the challenge.',
          duration: 3000,
        });
        break;
      
      case 'game_result':
        // Game result posted to chat
        if (selectedFriend && 
            (data.message.sender_id === selectedFriend.user_id || 
             data.message.receiver_id === selectedFriend.user_id)) {
          setMessages(prev => [...prev, data.message]);
        }
        fetchFriends();
        break;
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  useEffect(() => {
    if (selectedFriend) {
      fetchMessages(selectedFriend.user_id);
    }
  }, [selectedFriend]);

  const fetchFriends = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/chat/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(response.data.friends);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/chat/friend-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
    }
  };

  const fetchMessages = async (friendId, silent = false) => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/chat/messages/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages);
    } catch (error) {
      if (!silent) {
        toast({
          title: 'Error',
          description: 'Could not load messages',
          variant: 'destructive',
        });
      }
    }
  };

  const sendMessage = async (content, type = 'text') => {
    if (!selectedFriend || (!content.trim() && type === 'text')) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Error',
        description: 'Not connected to chat server',
        variant: 'destructive',
      });
      return;
    }
    
    setSending(true);
    
    // Send via WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      receiver_id: selectedFriend.user_id,
      content: content,
      message_type: type
    }));
    
    // Optimistically add message to UI
    const tempMessage = {
      id: 'temp-' + Date.now(),
      sender_id: user.id,
      receiver_id: selectedFriend.user_id,
      content: content,
      type: type,
      timestamp: new Date().toISOString(),
      read: false
    };
    setMessages(prev => [...prev, tempMessage]);
    
    // Update streak after sending message
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(
        `${API}/streaks/streak/update/${selectedFriend.user_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Failed to update streak:', error);
      // Non-blocking - don't show error to user
    }
    
    setMessageText('');
    setShowStickers(false);
    setSending(false);
  };

  const handleSendMessage = () => {
    sendMessage(messageText, 'text');
    setShowSmartReplies(false); // Hide smart replies after sending
  };
  
  // Open schedule modal (replaces old implementation)
  const handleScheduleMessage = () => {
    if (!selectedFriend || !messageText.trim()) {
      toast({
        title: 'No message',
        description: 'Type a message before scheduling',
        variant: 'destructive'
      });
      return;
    }
    setShowScheduleModal(true);
  };
  
  const scheduleMessage = async (scheduledTime) => {
    if (!selectedFriend || !messageText.trim()) return;

    setSending(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/scheduled-messages/schedule`,
        {
          recipient_id: selectedFriend.user_id,
          message_type: 'text',
          content: messageText,
          scheduled_time: scheduledTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast({
        title: '🎉 Message Scheduled!',
        description: response.data.message,
      });

      setMessageText('');
      setShowStickers(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to schedule message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };
  
  const handleSelectSmartReply = (reply) => {
    setMessageText(reply);
    // Auto-send the smart reply
    sendMessage(reply, 'text');
  };

  const handleSendSticker = (stickerId) => {
    sendMessage(stickerId, 'sticker');
  };
  
  const handleSendCustomSticker = (stickerUrl) => {
    sendMessage(stickerUrl, 'custom_sticker');
  };
  
  const fetchCustomStickers = async () => {
    if (customStickers.length > 0) return; // Already loaded
    
    try {
      setLoadingStickers(true);
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/media/stickers/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomStickers(response.data.stickers || []);
    } catch (error) {
      console.error('Error fetching custom stickers:', error);
    } finally {
      setLoadingStickers(false);
    }
  };
  
  const handleMediaCapture = async (media) => {
    // media = { type: 'image' or 'video', url: '/media/...' }
    // Send the media URL as message content
    sendMessage(media.url, media.type);
  };
  
  const handleSendVoiceNote = (voiceNote) => {
    // voiceNote = { id, url, duration, transcript }
    // Send as a JSON string so we can include all metadata
    const voiceData = JSON.stringify({
      id: voiceNote.id,
      url: voiceNote.url,
      duration: voiceNote.duration,
      transcript: voiceNote.transcript
    });
    sendMessage(voiceData, 'voice');
  };

  const handleSearchUser = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setSearchResult(null);
    
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/chat/search-user`,
        { query: searchQuery },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSearchResult(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not search user',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (clientId) => {
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(
        `${API}/chat/friend-request`,
        { receiver_client_id: clientId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast({
        title: 'Success',
        description: 'Friend request sent!',
      });
      
      setShowAddFriend(false);
      setSearchQuery('');
      setSearchResult(null);
      fetchFriendRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Could not send friend request',
        variant: 'destructive',
      });
    }
  };

  const handleSendEmailInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    setSendingInvite(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/chat/invite-by-email`,
        {
          email: inviteEmail,
          message: inviteMessage
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.user_exists) {
        toast({
          title: 'User Found!',
          description: response.data.message,
        });
        setShowEmailInvite(false);
        setShowAddFriend(true);
        setSearchQuery(inviteEmail);
      } else {
        toast({
          title: 'Success',
          description: response.data.message,
        });
        setShowEmailInvite(false);
        setInviteEmail('');
        setInviteMessage('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleFriendRequestAction = async (requestId, action) => {
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.put(
        `${API}/chat/friend-request/${requestId}`,
        { action },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast({
        title: 'Success',
        description: `Friend request ${action}ed`,
      });
      
      fetchFriendRequests();
      fetchFriends();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not process request',
        variant: 'destructive',
      });
    }
  };

  const selectFriend = (friend) => {
    setSelectedFriend(friend);
    fetchMessages(friend.user_id);
    setShowStickers(false);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
                <p className="text-sm text-gray-600">{friends.length} friends</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRequests(true)}
                className="relative px-4 py-2 bg-ember text-white rounded-lg hover:bg-ember-light transition-all"
              >
                Requests
                {friendRequests.received.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {friendRequests.received.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowAddFriend(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stories Bar */}
      <StoriesBar
        onStoryClick={(storyGroup) => {
          setSelectedStoryGroup(storyGroup);
          setShowStoryViewer(true);
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-250px)]">
          {/* Friends List Component */}
          <FriendList
            friends={friends}
            selectedFriend={selectedFriend}
            loading={loading}
            onSelectFriend={selectFriend}
            onAddFriend={() => setShowAddFriend(true)}
            formatTime={formatTime}
          />

          {/* Chat Area */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm flex flex-col">
            {selectedFriend ? (
              <>
                {/* Chat Header Component */}
                <ChatHeader
                  friend={selectedFriend}
                  onBack={() => setSelectedFriend(null)}
                  onShowStats={() => setShowStatsModal(true)}
                  onShowStreak={() => setShowStreakModal(true)}
                  onShowWrapped={() => navigate('/wrapped')}
                  onChallenge={() => setShowChallengeModal(true)}
                />

                {/* Message List Component */}
                <MessageList
                  messages={messages}
                  user={user}
                  formatTime={formatTime}
                />

                {/* Smart Replies Component */}
                {showSmartReplies && lastReceivedMessage && (
                  <div className="px-4">
                    <SmartReplies
                      lastMessage={lastReceivedMessage}
                      conversationHistory={messages.slice(-10).map(m => ({
                        content: m.content,
                        is_me: m.sender_id === user?.id
                      }))}
                      onSelectReply={handleSelectSmartReply}
                      onClose={() => setShowSmartReplies(false)}
                    />
                  </div>
                )}

                {/* Message Input Component */}
                <MessageInput
                  messageText={messageText}
                  onMessageChange={setMessageText}
                  onSendMessage={handleSendMessage}
                  onScheduleMessage={handleScheduleMessage}
                  sending={sending}
                  showStickers={showStickers}
                  onToggleStickers={() => setShowStickers(!showStickers)}
                  onShowCamera={() => setShowCamera(true)}
                  onShowVideoRecorder={() => setShowVideoRecorder(true)}
                  onShowVoiceRecorder={() => setShowVoiceRecorder(true)}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  onSendSticker={handleSendSticker}
                  customStickers={customStickers}
                  loadingStickers={loadingStickers}
                  onFetchCustomStickers={fetchCustomStickers}
                  onSendCustomSticker={handleSendCustomSticker}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Select a friend to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Friend</h2>
              <button
                onClick={() => {
                  setShowAddFriend(false);
                  setSearchQuery('');
                  setSearchResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
                  placeholder="Enter Client ID or Email"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearchUser}
                  disabled={searching}
                  className="px-4 py-2 bg-ember text-white rounded-lg hover:bg-ember-light transition-all disabled:opacity-50"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {searchResult && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  {searchResult.found ? (
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {searchResult.user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{searchResult.user.full_name || searchResult.user.email}</p>
                          <p className="text-sm text-gray-600">{searchResult.user.client_id}</p>
                        </div>
                      </div>
                      
                      {searchResult.is_friend ? (
                        <p className="text-green-600 text-sm">✓ Already friends</p>
                      ) : searchResult.has_pending_request ? (
                        <p className="text-yellow-600 text-sm">⏳ Friend request pending</p>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(searchResult.user.client_id)}
                          className="w-full px-4 py-2 bg-ember text-white rounded-lg hover:bg-ember-light transition-all"
                        >
                          Send Friend Request
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">User not found</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Friend Requests Modal */}
      {showRequests && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Friend Requests</h2>
              <button
                onClick={() => setShowRequests(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Received Requests */}
              {friendRequests.received.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Received</h3>
                  <div className="space-y-2">
                    {friendRequests.received.map((req) => (
                      <div key={req.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{req.sender.full_name || req.sender.email}</p>
                          <p className="text-sm text-gray-600">{req.sender.client_id}</p>


      {/* Email Invite Modal */}
      {showEmailInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Invite by Email</h2>
              <button
                onClick={() => {
                  setShowEmailInvite(false);
                  setInviteEmail('');
                  setInviteMessage('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Hey! Join me on Calliotel so we can chat..."
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleSendEmailInvite}
                disabled={sendingInvite || !inviteEmail.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-ember to-ember-dark text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {sendingInvite ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Send Invitation</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                They'll receive an email with a link to sign up and connect with you
              </p>
            </div>
          </div>
        </div>
      )}

                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFriendRequestAction(req.id, 'accept')}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleFriendRequestAction(req.id, 'reject')}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sent Requests */}
              {friendRequests.sent.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Sent</h3>
                  <div className="space-y-2">
                    {friendRequests.sent.map((req) => (
                      <div key={req.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">{req.receiver.full_name || req.receiver.email}</p>
                        <p className="text-sm text-gray-600">{req.receiver.client_id}</p>
                        <p className="text-xs text-yellow-600 mt-1">⏳ Pending</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {friendRequests.received.length === 0 && friendRequests.sent.length === 0 && (
                <p className="text-center text-gray-600 py-8">No pending friend requests</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleMediaCapture}
        mode="photo"
      />

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onSendVoiceNote={handleSendVoiceNote}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}
      
      {/* Video Recorder Modal */}
      {showVideoRecorder && (
        <VideoRecorder
          recipientId={selectedFriend?.email}
          onClose={() => setShowVideoRecorder(false)}
          onVideoSent={() => fetchMessages(selectedFriend.email)}
        />
      )}

      {/* Streak Modal */}
      {selectedFriend && (
        <StreakModal
          isOpen={showStreakModal}
          onClose={() => setShowStreakModal(false)}
          friendUserId={selectedFriend.user_id}
          friendName={selectedFriend.full_name || selectedFriend.email}
        />
      )}

      {/* Chat Stats Modal */}
      {selectedFriend && (
        <ChatStatsModal
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          friendUserId={selectedFriend.user_id}
          friendName={selectedFriend.full_name || selectedFriend.email}
        />
      )}

      {/* Story Viewer */}
      {showStoryViewer && selectedStoryGroup && (
        <StoryViewer
          storyGroup={selectedStoryGroup}
          onClose={() => {
            setShowStoryViewer(false);
            setSelectedStoryGroup(null);
          }}
          onShowViewers={(storyId) => {
            setViewersStoryId(storyId);
            setShowStoryViewer(false);
          }}
        />
      )}

      {/* Story Viewers Modal */}
      {viewersStoryId && (
        <StoryViewersModal
          storyId={viewersStoryId}
          onClose={() => setViewersStoryId(null)}
        />
      )}

      {/* Challenge Modal */}
      {showChallengeModal && selectedFriend && (
        <ChallengeModal
          friend={selectedFriend}
          onClose={() => setShowChallengeModal(false)}
          onSuccess={() => {
            toast({
              title: '⚔️ Challenge Sent!',
              description: 'Your challenge has been sent.',
              duration: 3000,
            });
            fetchMessages(selectedFriend.user_id);
          }}
        />
      )}

      {/* Schedule Message Modal */}
      {showScheduleModal && selectedFriend && (
        <ScheduleMessageModal
          receiverId={selectedFriend.user_id}
          receiverName={selectedFriend.full_name || selectedFriend.email}
          messageContent={messageText}
          messageType="text"
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            setMessageText('');
            setShowScheduleModal(false);
          }}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default ChatPage;
