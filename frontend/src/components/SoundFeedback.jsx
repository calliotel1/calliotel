import React, { useState, useEffect } from 'react';
import { Volume2, Bell, MessageSquare, UserPlus, Sparkles } from 'lucide-react';

const SoundFeedback = () => {
  const [feedbackStack, setFeedbackStack] = useState([]);

  useEffect(() => {
    // Listen for sound played events
    const handleSoundPlayed = (event) => {
      const { type } = event.detail;
      
      const feedback = {
        id: Date.now() + Math.random(),
        type,
        timestamp: Date.now()
      };
      
      setFeedbackStack(prev => [...prev, feedback]);
      
      // Auto-remove after 2 seconds
      setTimeout(() => {
        setFeedbackStack(prev => prev.filter(f => f.id !== feedback.id));
      }, 2000);
    };

    window.addEventListener('soundPlayed', handleSoundPlayed);
    return () => window.removeEventListener('soundPlayed', handleSoundPlayed);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'new_message':
        return <MessageSquare className="w-4 h-4" />;
      case 'new_invite':
        return <UserPlus className="w-4 h-4" />;
      case 'message_sent':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getLabel = (type) => {
    switch (type) {
      case 'new_message':
        return 'New Message';
      case 'new_invite':
        return 'Friend Request';
      case 'message_sent':
        return 'Message Sent';
      default:
        return 'Notification';
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'new_message':
        return 'from-ember to-ember-light';
      case 'new_invite':
        return 'from-ember to-ember-light';
      case 'message_sent':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (feedbackStack.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] space-y-2 pointer-events-none">
      {feedbackStack.map((feedback, index) => (
        <div
          key={feedback.id}
          className={`animate-in slide-in-from-right-5 fade-in duration-300 bg-gradient-to-r ${getColor(feedback.type)} text-white px-4 py-3 rounded-lg shadow-2xl flex items-center space-x-3`}
          style={{
            animation: 'slideInRight 0.3s ease-out, fadeOut 0.3s ease-in 1.7s',
            animationFillMode: 'forwards'
          }}
        >
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            {getIcon(feedback.type)}
          </div>
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-semibold">{getLabel(feedback.type)}</span>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SoundFeedback;
