import React, { useRef, useEffect, useState } from 'react';
import { MessageSquare, Swords, Check, X } from 'lucide-react';
import { getStickerById } from '../../data/stickers';
import VoicePlayer from '../VoicePlayer';
import TranslateButton from '../TranslateButton';
import VideoReactionPicker from '../VideoReactionPicker';
import VideoReactionDisplay from '../VideoReactionDisplay';
import VideoViewTracker from '../VideoViewTracker';
import axios from 'axios';
import safeLocalStorage from '../../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MessageList = ({ messages, user, formatTime }) => {
  const messagesEndRef = useRef(null);
  const [respondingTo, setRespondingTo] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleChallengeResponse = async (challengeId, action) => {
    try {
      setRespondingTo(challengeId);
      const token = safeLocalStorage.getItem('token');
      
      const response = await axios.post(
        `${API}/game/challenge/${challengeId}/respond`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (action === 'accept' && response.data.redirect_url) {
        // Redirect will be handled by WebSocket listener
        console.log('Challenge accepted, waiting for redirect...');
      }
      
    } catch (error) {
      console.error('Error responding to challenge:', error);
      alert(error.response?.data?.detail || 'Failed to respond to challenge');
    } finally {
      setRespondingTo(null);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-gray-500">
        <MessageSquare className="w-12 h-12 mb-2" />
        <p>No messages yet. Say hi! 👋</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => {
        const isMe = msg.sender_id === user?.id;
        const sticker = msg.type === 'sticker' ? getStickerById(msg.content) : null;
        const isCustomSticker = msg.type === 'custom_sticker';
        const isVoiceNote = msg.type === 'voice';
        const isChallenge = msg.type === 'challenge';
        const isChallengeAccepted = msg.type === 'challenge_accepted';
        const isChallengeDeclined = msg.type === 'challenge_declined';
        const isGameResult = msg.type === 'game_result';
        
        // Parse voice note data if it's a voice message
        let voiceNote = null;
        if (isVoiceNote) {
          try {
            voiceNote = JSON.parse(msg.content);
          } catch (error) {
            console.error('Error parsing voice note:', error);
          }
        }
        
        // Render Challenge Card
        if (isChallenge) {
          const canRespond = !isMe;
          
          return (
            <div key={msg.id} className="flex justify-center">
              <div className="max-w-md w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border-2 border-ember p-4 shadow-xl">
                {/* Challenge Header */}
                <div className="flex items-center gap-3 mb-3">
                  <Swords className="text-yellow-500" size={28} />
                  <div className="flex-1">
                    <div className="font-bold text-white text-lg">Challenge Received!</div>
                    <div className="text-sm text-gray-400">
                      {isMe ? 'Waiting for response...' : 'Accept or Decline'}
                    </div>
                  </div>
                </div>
                
                {/* Challenge Details */}
                <div className="bg-gray-700/50 rounded-lg p-3 mb-3 text-white space-y-1">
                  <div className="whitespace-pre-line">{msg.content}</div>
                </div>
                
                {/* Action Buttons */}
                {canRespond && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleChallengeResponse(msg.challenge_id, 'accept')}
                      disabled={respondingTo === msg.challenge_id}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Check size={20} />
                      {respondingTo === msg.challenge_id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleChallengeResponse(msg.challenge_id, 'decline')}
                      disabled={respondingTo === msg.challenge_id}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <X size={20} />
                      Decline
                    </button>
                  </div>
                )}
                
                {isMe && (
                  <div className="text-center text-yellow-500 text-sm font-medium">
                    ⏳ Awaiting opponent's response...
                  </div>
                )}
                
                <p className="text-xs text-gray-500 text-center mt-2">
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        }
        
        // Render Challenge Accepted/Declined
        if (isChallengeAccepted || isChallengeDeclined) {
          return (
            <div key={msg.id} className="flex justify-center">
              <div className={`px-4 py-2 rounded-lg ${
                isChallengeAccepted 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
                <p className="font-medium text-center">{msg.content}</p>
                <p className="text-xs text-center mt-1 opacity-75">
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        }
        
        // Render Game Result
        if (isGameResult) {
          return (
            <div key={msg.id} className="flex justify-center">
              <div className="max-w-md w-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 shadow-xl">
                <div className="text-center text-white font-bold whitespace-pre-line">
                  {msg.content}
                </div>
                <p className="text-xs text-center mt-2 text-white/80">
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        }
        
        return (
          <div
            key={msg.id}
            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`${
                isVoiceNote ? '' : 'max-w-[70%]'
              } rounded-2xl ${
                isVoiceNote ? '' : 'px-4 py-2'
              } ${
                isMe && !isVoiceNote
                  ? 'bg-gradient-to-br from-ember to-ember-light text-white'
                  : !isVoiceNote ? 'bg-gray-100 text-gray-900' : ''
              }`}
            >
              {msg.type === 'sticker' && sticker ? (
                <div className="text-5xl">{sticker.emoji}</div>
              ) : isCustomSticker ? (
                <img
                  src={`${BACKEND_URL}${msg.content}`}
                  alt="Custom sticker"
                  className="w-32 h-32 object-contain"
                />
              ) : isVoiceNote && voiceNote ? (
                <div>
                  <VoicePlayer voiceNote={voiceNote} showTranscript={true} />
                  <p className={`text-xs mt-2 ${isMe ? 'text-ember' : 'text-gray-500'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              ) : msg.type === 'image' ? (
                <img 
                  src={`${BACKEND_URL}${msg.content}`} 
                  alt="Shared" 
                  className="max-w-full rounded-lg"
                />
              ) : msg.type === 'video' ? (
                <div className="space-y-2">
                  <VideoViewTracker videoId={msg.id} source="chat" />
                  <video 
                    src={`${BACKEND_URL}${msg.content}`} 
                    controls 
                    className="max-w-full rounded-lg"
                  />
                  <VideoReactionDisplay videoId={msg.id} autoRefresh={true} />
                  <VideoReactionPicker videoId={msg.id} />
                </div>
              ) : (
                <>
                  <p>{msg.content}</p>
                  {/* Translation Button for text messages */}
                  <TranslateButton message={msg.content} isMe={isMe} />
                </>
              )}
              {!isVoiceNote && (
                <p className={`text-xs mt-1 ${isMe ? 'text-ember-light' : 'text-gray-500 dark:text-gray-400'}`}>
                  {formatTime(msg.timestamp)}
                </p>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
