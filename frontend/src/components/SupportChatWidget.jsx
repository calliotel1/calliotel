import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MessageCircle, X, Send, User, Bot, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SupportChatWidget = () => {
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      setMessages([
        {
          id: '1',
          text: "👋 Hi! I'm Calliotel's AI support assistant. How can I help you today?",
          isAI: true,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isAI: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/support/chat/send`, {
        message: inputMessage,
        session_id: sessionId
      });

      // Update session ID if new
      if (!sessionId) {
        setSessionId(response.data.session_id);
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        isAI: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again or contact support directly.",
        isAI: true,
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!sessionId) return;

    setIsLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/support/chat/escalate`, {
        session_id: sessionId,
        reason: "User requested human agent",
        user_email: null // Can be populated if user is logged in
      });

      setIsEscalated(true);

      const escalationMessage = {
        id: Date.now().toString(),
        text: `✅ Your request has been escalated! Ticket ID: ${response.data.ticket_id}\n\nA human agent will review your conversation and get back to you via email shortly. Average response time: 2-4 hours.`,
        isAI: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, escalationMessage]);
    } catch (error) {
      console.error('Escalation error:', error);
      const errorMessage = {
        id: Date.now().toString(),
        text: "Sorry, I couldn't create a support ticket right now. Please email support@calliotel.com directly.",
        isAI: true,
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-ember to-ember-light rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
          aria-label="Open support chat"
        >
          <MessageCircle className="w-8 h-8 text-white" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white animate-pulse"></div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 w-96 h-[600px] ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-ember to-ember-light p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">Calliotel Support</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/90 text-xs">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${message.isAI ? '' : 'flex-row-reverse space-x-reverse'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.isAI 
                      ? 'bg-gradient-to-br from-ember to-ember-light' 
                      : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    {message.isAI ? (
                      <Bot className="w-5 h-5 text-white" />
                    ) : (
                      <User className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`rounded-2xl px-4 py-2 ${
                    message.isAI
                      ? darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                      : 'bg-gradient-to-r from-ember to-ember-light text-white'
                  } ${message.isError ? 'border-2 border-red-500' : ''}`}>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <span className={`text-xs mt-1 block ${
                      message.isAI 
                        ? darkMode ? 'text-gray-400' : 'text-gray-500'
                        : 'text-white/70'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Loader className="w-4 h-4 animate-spin text-orange-500" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Thinking...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Escalate Button */}
          {!isEscalated && messages.length > 2 && (
            <div className="px-4 py-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
              <button
                onClick={handleEscalate}
                disabled={isLoading}
                className={`w-full py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  darkMode
                    ? 'bg-ember hover:bg-ember-light text-white'
                    : 'bg-ember hover:bg-ember text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">Talk to Human Agent</span>
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading || isEscalated}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50`}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim() || isEscalated}
                className="px-4 py-2 bg-gradient-to-r from-ember to-ember-light text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportChatWidget;
