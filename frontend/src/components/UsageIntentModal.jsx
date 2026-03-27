import React, { useState } from 'react';
import { X, MessageSquare, Briefcase, TrendingUp, Heart, Bot, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const UsageIntentModal = ({ isOpen, onClose, phoneNumber, onSubmit }) => {
  const { darkMode } = useTheme();
  const [selectedUse, setSelectedUse] = useState('');
  const [customUse, setCustomUse] = useState('');

  const useCases = [
    {
      id: 'whatsapp',
      name: 'WhatsApp/Telegram',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'green',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      id: 'business',
      name: 'Business Calls',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'blue',
      gradient: 'from-ember to-ember-light'
    },
    {
      id: 'sms_marketing',
      name: 'SMS Marketing',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'purple',
      gradient: 'from-ember to-ember-light'
    },
    {
      id: 'dating',
      name: 'Dating Apps',
      icon: <Heart className="w-6 h-6" />,
      color: 'pink',
      gradient: 'from-ember/50 to-rose-600'
    },
    {
      id: 'ai_testing',
      name: 'AI & API Testing',
      icon: <Bot className="w-6 h-6" />,
      color: 'indigo',
      gradient: 'from-ember to-ember-light'
    },
    {
      id: 'other',
      name: 'Other',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'gray',
      gradient: 'from-gray-500 to-gray-600'
    }
  ];

  const handleSubmit = () => {
    if (selectedUse) {
      onSubmit(selectedUse, selectedUse === 'other' ? customUse : null);
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-2xl w-full p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              🎯 What will you use this number for?
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Help us improve recommendations for {phoneNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {useCases.map((useCase) => (
            <button
              key={useCase.id}
              onClick={() => setSelectedUse(useCase.id)}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedUse === useCase.id
                  ? `border-${useCase.color}-500 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} scale-105 shadow-lg`
                  : `${darkMode ? 'border-gray-600 bg-gray-700/50 hover:border-gray-500' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`
              }`}
            >
              <div
                className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center text-white ${
                  selectedUse === useCase.id ? 'scale-110' : ''
                } transition-transform`}
              >
                {useCase.icon}
              </div>
              <p className={`text-sm font-semibold text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {useCase.name}
              </p>
            </button>
          ))}
        </div>

        {/* Custom Use Input */}
        {selectedUse === 'other' && (
          <div className="mb-6">
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Please specify:
            </label>
            <input
              type="text"
              value={customUse}
              onChange={(e) => setCustomUse(e.target.value)}
              placeholder="e.g., Customer support, Personal use..."
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        )}

        {/* Info Box */}
        <div className={`p-4 rounded-xl mb-6 ${darkMode ? 'bg-blue-900/20 border border-ember/30' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            💡 <strong>Why we ask:</strong> This helps us recommend the best numbers to other users and improves your future searches!
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            Skip for now
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedUse}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsageIntentModal;
