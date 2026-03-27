import React, { useState, useEffect, useRef } from 'react';
import { Send, Pin, Crown, Loader2, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL;

const GlobalSquare = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [silencedUntil, setSilencedUntil] = useState(null);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    connectToSquare();
    fetchPinnedMessage();
    fetchUserRank();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cooldown ticker
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining(cooldownRemaining - 0.1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  // Silence countdown
  useEffect(() => {
    if (silencedUntil && silencedUntil > Date.now()) {
      const timer = setTimeout(() => {
        setSilencedUntil(silencedUntil);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (silencedUntil && silencedUntil <= Date.now()) {
      setSilencedUntil(null);
    }
  }, [silencedUntil]);

  const connectToSquare = () => {
    const wsUrl = `${API.replace('http', 'ws')}/api/global-square/ws/global-square`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('🏛️ Connected to Global Square');
      setConnected(true);

      // Send authentication
      wsRef.current.send(JSON.stringify({
        token: localStorage.getItem('token'),
        user_id: user.id
      }));
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket closed');
      setConnected(false);
    };
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'message_history':
        setMessages(data.messages);
        break;

      case 'new_message':
        setMessages(prev => [...prev, data.message]);
        break;

      case 'message_sent':
        setSending(false);
        setMessageInput('');
        break;

      case 'cooldown_active':
        setCooldownRemaining(data.time_remaining);
        toast({
          title: '⏱️ Cooldown Active',
          description: `Wait ${data.time_remaining.toFixed(1)}s before next message`,
          variant: 'destructive'
        });
        setSending(false);
        break;

      case 'timed_out':
        // User tried to send but is silenced
        setSilencedUntil(Date.now() + (data.time_remaining * 1000));
        toast({
          title: '🔇 SILENCED',
          description: data.message,
          variant: 'destructive',
          duration: 5000
        });
        setSending(false);
        break;

      case 'you_are_silenced':
        // Just got silenced by Alpha
        setSilencedUntil(Date.now() + (data.duration * 1000));
        toast({
          title: `⚖️ SILENCED BY ${data.issuer_tier}`,
          description: data.message,
          variant: 'destructive',
          duration: 8000
        });
        break;

      case 'timeout_issued':
        // Successfully issued a timeout
        toast({
          title: '⚖️ Judgment Delivered',
          description: data.message,
          duration: 3000
        });
        break;

      case 'auto_muted':
        toast({
          title: '🚫 Auto-Muted',
          description: data.message,
          variant: 'destructive',
          duration: 10000
        });
        setCooldownRemaining(data.duration);
        setSending(false);
        break;

      case 'shadow_banned':
        // They never know - just show success
        toast({
          title: '✅ Message Sent',
          description: 'Your message has been delivered',
          duration: 2000
        });
        setSending(false);
        break;

      case 'error':
        toast({
          title: 'Error',
          description: data.message,
          variant: 'destructive'
        });
        setSending(false);
        break;

      default:
        break;
    }
  };

  const fetchPinnedMessage = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/global-square/pinned`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.pinned_message) {
        setPinnedMessage(data.pinned_message);
      }
    } catch (error) {
      console.error('Error fetching pinned message:', error);
    }
  };

  const fetchUserRank = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/leaderboard/overall?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.leaderboard) {
        const userEntry = data.leaderboard.find(entry => entry.user_id === user.id);
        if (userEntry) {
          setUserRank(data.leaderboard.indexOf(userEntry) + 1);
        }
      }
    } catch (error) {
      console.error('Error fetching user rank:', error);
    }
  };

  const timeoutUser = (targetUserId) => {
    if (!wsRef.current || !connected) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'timeout_user',
      target_user_id: targetUserId
    }));
    
    setSelectedPlayer(null);
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !connected || sending || cooldownRemaining > 0 || (silencedUntil && silencedUntil > Date.now())) {
      if (silencedUntil && silencedUntil > Date.now()) {
        const remaining = Math.ceil((silencedUntil - Date.now()) / 1000);
        toast({
          title: '🔇 SILENCED',
          description: `You are silenced for ${remaining}s`,
          variant: 'destructive'
        });
      }
      return;
    }

    setSending(true);

    wsRef.current.send(JSON.stringify({
      type: 'send_message',
      content: messageInput.trim()
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getTierBorderStyle = (tier) => {
    if (!tier) return {};

    if (tier.name === "The Architect") {
      return {
        border: '2px solid transparent',
        backgroundImage: 'linear-gradient(#1a1a2e, #1a1a2e), linear-gradient(45deg, #667eea, #764ba2, #f093fb)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: '0 0 20px rgba(102, 126, 234, 0.6), 0 0 40px rgba(118, 75, 162, 0.3)'
      };
    }

    // Divine glow
    if (tier.name === "Divine Legend") {
      return {
        border: `2px solid ${tier.color}`,
        boxShadow: `0 0 12px ${tier.color}80, 0 0 24px ${tier.color}40`
      };
    }

    return {
      border: `1px solid ${tier.color}60`,
      boxShadow: `0 0 8px ${tier.color}30`
    };
  };

  const renderMessage = (msg) => {
    // Void Broadcast - Purple Pulse
    if (msg.type === 'void_broadcast') {
      return (
        <div key={msg.id} className="my-4">
          <div className="void-pulse-container">
            <div className="bg-gradient-to-r from-ember-dark via-pink-800 to-ember-900 rounded-xl p-6 text-center border-2 border-ember shadow-2xl animate-void-pulse">
              <div className="text-4xl mb-3">⚡</div>
              <p className="text-white font-bold text-lg sm:text-xl mb-2">{msg.content}</p>
              <p className="text-xs text-ember">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (msg.type === 'system_message') {
      return (
        <div key={msg.id} className="flex justify-center my-2">
          <div className="bg-gray-800/50 rounded-full px-4 py-1 text-xs text-gray-400">
            {msg.content}
          </div>
        </div>
      );
    }

    const isOwnMessage = msg.user_id === user.id;

    return (
      <div
        key={msg.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}
      >
        <div className="max-w-[70%]">
          {/* Sender info */}
          {!isOwnMessage && (
            <button
              onClick={() => setSelectedPlayer(msg)}
              className="text-xs text-gray-400 hover:text-ember transition-colors mb-1 flex items-center gap-1"
            >
              <span style={{ color: msg.tier?.color }}>
                {msg.tier?.emoji} {msg.full_name || msg.email.split('@')[0]}
              </span>
            </button>
          )}

          {/* Message bubble */}
          <div
            className={`rounded-lg p-3 ${
              isOwnMessage
                ? 'bg-ember text-white'
                : 'bg-gray-800/60 backdrop-blur-sm text-white'
            }`}
            style={!isOwnMessage ? getTierBorderStyle(msg.tier) : {}}
          >
            <p className="text-sm break-words">{msg.content}</p>
            <p className="text-xs opacity-60 mt-1">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-obsidian/40 to-transparent border-b border-ember/20/30 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-ember" size={24} />
              <div>
                <h1 className="text-xl font-bold text-white">
                  🏛️ The Global Square
                </h1>
                <p className="text-xs text-gray-400">Where warriors congregate</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Users size={16} />
              <span>{onlineCount || '...'} online</span>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div
          className="bg-gradient-to-r from-ember-dark/30 to-ember-dark/30 border-b-2 border-ember/50 backdrop-blur-sm p-4"
          style={
            pinnedMessage.pinned_by_rank === 1 && pinnedMessage.permanent
              ? {
                  backgroundImage: 'linear-gradient(90deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))',
                  animation: 'architectGlow 3s ease-in-out infinite alternate'
                }
              : {}
          }
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {pinnedMessage.permanent ? (
                  <Crown className="text-yellow-500" size={20} />
                ) : (
                  <Pin className="text-ember" size={18} />
                )}
              </div>
              <div className="flex-1">
                {pinnedMessage.permanent && (
                  <p className="text-xs text-yellow-500 font-bold mb-1 uppercase tracking-wider">
                    👑 THE ARCHITECT HAS SPOKEN
                  </p>
                )}
                <p className="text-white font-semibold text-sm sm:text-base mb-1">
                  {pinnedMessage.message.content}
                </p>
                <p className="text-xs text-gray-400">
                  Pinned by #{pinnedMessage.pinned_by_rank} •{' '}
                  {pinnedMessage.permanent ? 'Permanent' : 'Expires in 1 hour'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Feed */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      >
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">The Square is silent. Be the first to speak.</p>
            </div>
          )}

          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t border-ember/20/30 bg-[#0a0a0f]/95 backdrop-blur-sm p-4">
        {/* Silenced Overlay */}
        {silencedUntil && silencedUntil > Date.now() && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center">
            <div className="bg-gradient-to-br from-red-900/90 to-black/90 rounded-2xl p-8 max-w-md mx-4 border-2 border-red-500 shadow-2xl animate-pulse-slow">
              <div className="text-center">
                <div className="text-6xl mb-4">🔇</div>
                <h2 className="text-3xl font-bold text-red-400 mb-2">SILENCED</h2>
                <p className="text-gray-300 mb-4">The Alpha has spoken.</p>
                <div className="text-5xl font-bold text-white mb-2">
                  {Math.ceil((silencedUntil - Date.now()) / 1000)}s
                </div>
                <p className="text-sm text-gray-400">Judgment expires in...</p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  cooldownRemaining > 0
                    ? `Cooldown: ${cooldownRemaining.toFixed(1)}s`
                    : 'Speak to the Square...'
                }
                disabled={!connected || cooldownRemaining > 0}
                maxLength={500}
                rows={2}
                className="w-full bg-gray-900/50 border border-ember/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-ember disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>{messageInput.length}/500</span>
                {cooldownRemaining > 0 && (
                  <span className="text-orange-400 font-bold animate-pulse">
                    ⏱️ {cooldownRemaining.toFixed(1)}s
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={sendMessage}
              disabled={
                !connected ||
                !messageInput.trim() ||
                sending ||
                cooldownRemaining > 0
              }
              className={`p-4 rounded-lg font-bold transition-all flex items-center justify-center ${
                cooldownRemaining > 0
                  ? 'bg-gray-700 cursor-not-allowed'
                  : sending
                  ? 'bg-olive-700'
                  : 'bg-ember hover:bg-ember-light'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {sending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : cooldownRemaining > 0 ? (
                <span className="text-sm">{cooldownRemaining.toFixed(1)}</span>
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mini-Combat Card Overlay */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full border-2 animate-slide-in-right"
            style={{
              borderColor: selectedPlayer.tier?.color,
              boxShadow: `0 0 40px ${selectedPlayer.tier?.color}60`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div
                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold"
                style={{
                  background:
                    selectedPlayer.tier?.name === 'The Architect'
                      ? 'linear-gradient(45deg, #667eea, #764ba2, #f093fb)'
                      : `linear-gradient(135deg, ${selectedPlayer.tier?.color}40, ${selectedPlayer.tier?.color}60)`,
                  border: `3px solid ${selectedPlayer.tier?.color}`,
                  boxShadow: `0 0 20px ${selectedPlayer.tier?.color}80`
                }}
              >
                {selectedPlayer.profile_picture ? (
                  <img
                    src={`${API}${selectedPlayer.profile_picture}`}
                    alt={selectedPlayer.full_name || selectedPlayer.email}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  selectedPlayer.email.charAt(0).toUpperCase()
                )}
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                {selectedPlayer.full_name || selectedPlayer.email.split('@')[0]}
              </h2>

              <div
                className="inline-block px-4 py-2 rounded-lg font-bold text-sm mb-6"
                style={{
                  background:
                    selectedPlayer.tier?.name === 'The Architect'
                      ? 'linear-gradient(45deg, #667eea, #764ba2)'
                      : selectedPlayer.tier?.color,
                  color: 'white'
                }}
              >
                {selectedPlayer.tier?.emoji} {selectedPlayer.tier?.name}
              </div>
            </div>

            {/* Alpha's Gavel - Only for #1 Ranked Player */}
            {userRank === 1 && selectedPlayer.user_id !== user.id && selectedPlayer.tier?.name === 'Bronze Rookie' && (
              <div className="mb-4">
                <button
                  onClick={() => timeoutUser(selectedPlayer.user_id)}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <span className="text-xl">⚖️</span>
                  <span>SILENCE (60s)</span>
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">The Alpha's Gavel</p>
              </div>
            )}

            <button
              onClick={() => setSelectedPlayer(null)}
              className="w-full py-3 bg-ember hover:bg-ember-light rounded-lg font-bold text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <BottomNav />

      <style jsx>{`
        @keyframes architectGlow {
          from {
            box-shadow: 0 0 20px rgba(102, 126, 234, 0.4);
          }
          to {
            box-shadow: 0 0 40px rgba(118, 75, 162, 0.6);
          }
        }

        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes void-pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7);
          }
          50% {
            transform: scale(1);
            box-shadow: 0 0 60px 20px rgba(168, 85, 247, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(168, 85, 247, 0);
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-void-pulse {
          animation: void-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .void-pulse-container {
          animation: void-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default GlobalSquare;
