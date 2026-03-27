import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, Loader, Zap, ArrowRight } from 'lucide-react';

const AgenticServiceSelector = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);

  const suggestions = [
    "I need 5 UK numbers for WhatsApp marketing",
    "Find me cheap US numbers for 2FA testing",
    "I want a UK number for Telegram bot",
    "Show me fresh numbers for Instagram verification"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // AI Response Logic (mock for now, can integrate real AI later)
  const getAIResponse = (userInput) => {
    const inputLower = userInput.toLowerCase();
    
    // Parse intent
    let quantity = 1;
    let country = null;
    let useCase = null;
    let budget = null;

    // Extract quantity
    const quantityMatch = userInput.match(/(\d+)/);
    if (quantityMatch) quantity = parseInt(quantityMatch[1]);

    // Extract country
    if (inputLower.includes('uk') || inputLower.includes('united kingdom') || inputLower.includes('britain')) {
      country = 'GB';
    } else if (inputLower.includes('us') || inputLower.includes('usa') || inputLower.includes('america')) {
      country = 'US';
    } else if (inputLower.includes('canada') || inputLower.includes('ca')) {
      country = 'CA';
    } else if (inputLower.includes('germany') || inputLower.includes('de')) {
      country = 'DE';
    }

    // Extract use case
    if (inputLower.includes('whatsapp')) useCase = 'WhatsApp';
    if (inputLower.includes('telegram')) useCase = 'Telegram';
    if (inputLower.includes('instagram')) useCase = 'Instagram';
    if (inputLower.includes('2fa') || inputLower.includes('verification')) useCase = '2FA';
    if (inputLower.includes('marketing') || inputLower.includes('bot')) useCase = 'Marketing';

    // Build response
    const countryName = country === 'GB' ? 'UK' : country === 'US' ? 'US' : country === 'CA' ? 'Canada' : 'Germany';
    const basePrice = 2.99;
    let discount = 0;
    
    if (quantity >= 5 && quantity < 16) discount = 17;
    if (quantity >= 16 && quantity < 31) discount = 33;
    if (quantity >= 31) discount = 50;

    const pricePerNumber = basePrice * (1 - discount / 100);
    const totalPrice = (pricePerNumber * quantity).toFixed(2);
    const savings = ((basePrice - pricePerNumber) * quantity).toFixed(2);

    return {
      message: `Found ${quantity > 10 ? '12+' : quantity} fresh ${countryName} numbers${useCase ? ` verified for ${useCase}` : ''}! 

Here's your deal:
🎯 ${quantity} numbers × $${pricePerNumber.toFixed(2)}/mo = $${totalPrice}/mo
${discount > 0 ? `💰 You save $${savings}/mo (${discount}% bulk discount)` : ''}
✅ All numbers tested in the last 10 minutes
🚀 Instant activation

Ready to purchase?`,
      action: {
        type: 'bundle',
        quantity,
        country,
        useCase,
        totalPrice,
        discount
      }
    };
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowSuggestions(false);
    setIsThinking(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const aiResponse = getAIResponse(input);
      const aiMessage = {
        role: 'assistant',
        content: aiResponse.message,
        action: aiResponse.action
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsThinking(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setShowSuggestions(false);
  };

  const handleAction = (action) => {
    // Navigate to browse page with filters
    navigate(`/browse-numbers?country=${action.country}&qty=${action.quantity}`);
  };

  return (
    <div className={`py-24 ${darkMode ? 'bg-gray-900' : 'bg-[#F9F9F7]'} relative overflow-hidden`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-ember/10 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-ember/15 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 ${
                darkMode
                  ? 'bg-gradient-to-r from-ember/20 to-ember-light/20 text-ember-light'
                  : 'bg-gradient-to-r from-orange-100 to-orange-50 text-ember'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI-POWERED</span>
            </span>
          </div>
          <h2 className={`text-4xl sm:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Tell Us What You <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">Need</span>
          </h2>
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
            No more searching. Just describe your project in plain English.
          </p>
        </div>

        {/* Chat Interface */}
        <div
          className={`rounded-2xl overflow-hidden border-2 shadow-2xl ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#FAFAF8] border-gray-200'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && showSuggestions && (
              <div className="space-y-4">
                <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Try these:
                </p>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      darkMode
                        ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                        : 'bg-[#F9F9F7] hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Zap className="w-4 h-4 inline mr-2 text-orange-500" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-ember to-ember-light text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-200'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-line text-sm">{message.content}</p>
                  
                  {/* Action Button */}
                  {message.action && (
                    <button
                      onClick={() => handleAction(message.action)}
                      className="mt-3 w-full px-4 py-2 bg-[#FAFAF8] text-orange-600 rounded-lg font-bold flex items-center justify-center space-x-2 hover:bg-gray-100 transition-all"
                    >
                      <span>View Numbers</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div
                  className={`px-4 py-3 rounded-2xl flex items-center space-x-2 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <Loader className="w-4 h-4 animate-spin text-orange-500" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Searching carrier networks...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
            <div className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="e.g., I need 5 UK numbers for WhatsApp marketing..."
                className={`flex-1 px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-[#F9F9F7] border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className="px-6 py-3 bg-gradient-to-r from-ember to-ember-light text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(199,78,30,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className={`mt-8 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          ✓ AI-powered recommendations • ✓ Real-time inventory • ✓ Instant bundle pricing
        </div>
      </div>
    </div>
  );
};

export default AgenticServiceSelector;
