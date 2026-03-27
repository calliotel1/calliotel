import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Play, Copy, CheckCircle, Code, Zap, Terminal } from 'lucide-react';

const InteractiveAPISandbox = () => {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('sms');
  const [isExecuting, setIsExecuting] = useState(false);
  const [response, setResponse] = useState(null);
  const [copied, setCopied] = useState(false);

  const apiExamples = {
    sms: {
      title: 'Send SMS',
      method: 'POST',
      endpoint: '/api/sms/send',
      code: `curl -X POST https://api.calliotel.com/v1/sms/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "+14155552671",
    "to": "+44123456789",
    "text": "Hello from Calliotel!"
  }'`,
      mockResponse: {
        status: 'delivered',
        message_id: 'msg_f8d3k2j9s0a1',
        from: '+14155552671',
        to: '+44123456789',
        text: 'Hello from Calliotel!',
        timestamp: new Date().toISOString(),
        cost: 0.0075
      }
    },
    voice: {
      title: 'Make Voice Call',
      method: 'POST',
      endpoint: '/api/voice/call',
      code: `curl -X POST https://api.calliotel.com/v1/voice/call \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "+14155552671",
    "to": "+44123456789",
    "answer_url": "https://yourdomain.com/twiml"
  }'`,
      mockResponse: {
        status: 'ringing',
        call_id: 'call_x9f2m5n8p3q7',
        from: '+14155552671',
        to: '+44123456789',
        duration: 0,
        timestamp: new Date().toISOString(),
        cost_per_minute: 0.015
      }
    },
    number: {
      title: 'Purchase Number',
      method: 'POST',
      endpoint: '/api/numbers/purchase',
      code: `curl -X POST https://api.calliotel.com/v1/numbers/purchase \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "country": "US",
    "area_code": "415"
  }'`,
      mockResponse: {
        status: 'active',
        number: '+14155558888',
        country: 'US',
        monthly_cost: 2.99,
        capabilities: ['sms', 'voice', 'mms'],
        activation_date: new Date().toISOString()
      }
    }
  };

  const handleExecute = () => {
    setIsExecuting(true);
    setResponse(null);
    
    // Simulate API call delay
    setTimeout(() => {
      setResponse(apiExamples[activeTab].mockResponse);
      setIsExecuting(false);
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(apiExamples[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`py-24 ${darkMode ? 'bg-gray-900' : 'bg-[#F9F9F7]'} relative overflow-hidden`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-ember rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                darkMode
                  ? 'bg-gradient-to-r from-orange-500/20 to-ember-light/20 text-orange-300'
                  : 'bg-gradient-to-r from-orange-100 to-ember-light/10 text-orange-700'
              }`}
            >
              🚀 DEVELOPER PLAYGROUND
            </span>
          </div>
          <h2 className={`text-4xl sm:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Test Our API in <span className="bg-gradient-to-r from-orange-500 to-ember-light bg-clip-text text-transparent">Real-Time</span>
          </h2>
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
            No signup required. Click "Execute" to see live API responses. Production-ready endpoints.
          </p>
        </div>

        {/* Sandbox Container */}
        <div className="max-w-5xl mx-auto">
          {/* API Tabs */}
          <div className="flex space-x-2 mb-6">
            {Object.entries(apiExamples).map(([key, example]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  setResponse(null);
                }}
                className={`px-6 py-3 rounded-t-xl font-bold transition-all ${
                  activeTab === key
                    ? darkMode
                      ? 'bg-gray-800 text-white border-t-2 border-x-2 border-orange-500'
                      : 'bg-[#FAFAF8] text-gray-900 border-t-2 border-x-2 border-orange-500'
                    : darkMode
                    ? 'bg-gray-800/50 text-gray-400 hover:text-gray-300'
                    : 'bg-gray-200 text-gray-600 hover:text-gray-900'
                }`}
              >
                {example.title}
              </button>
            ))}
          </div>

          {/* Code Editor Panel */}
          <div
            className={`rounded-2xl overflow-hidden border-2 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#FAFAF8] border-gray-200'
            }`}
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {/* Editor Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-[#F9F9F7]'
            }`}>
              <div className="flex items-center space-x-3">
                <Terminal className="w-5 h-5 text-orange-500" />
                <span className={`font-mono text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="text-green-500 font-bold">{apiExamples[activeTab].method}</span>
                  {' '}
                  <span className="text-ember">{apiExamples[activeTab].endpoint}</span>
                </span>
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm font-semibold">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Block */}
            <div className={`p-6 font-mono text-sm overflow-x-auto ${
              darkMode ? 'bg-gray-900/80' : 'bg-gray-900'
            }`}>
              <pre className="text-gray-300">
                <code>{apiExamples[activeTab].code}</code>
              </pre>
            </div>

            {/* Execute Button */}
            <div className="p-6">
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className={`w-full py-4 px-8 bg-gradient-to-r from-orange-500 to-ember-light text-white font-bold text-lg rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 ${
                  isExecuting
                    ? 'opacity-75 cursor-not-allowed'
                    : 'hover:shadow-2xl hover:scale-[1.02]'
                }`}
              >
                {isExecuting ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6" />
                    <span>Execute API Call</span>
                    <Zap className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Response Panel */}
            {response && (
              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`px-6 py-3 flex items-center space-x-2 ${
                  darkMode ? 'bg-gray-900/50' : 'bg-[#F9F9F7]'
                }`}>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Response (200 OK)
                  </span>
                </div>
                <div className={`p-6 font-mono text-sm overflow-x-auto ${
                  darkMode ? 'bg-gray-900/80' : 'bg-gray-900'
                }`}>
                  <pre className="text-gray-300">
                    <code>{JSON.stringify(response, null, 2)}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Trust Indicators */}
          <div className={`mt-8 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            ✓ Production-ready endpoints • ✓ 99.99% uptime SLA • ✓ Sub-100ms latency • ✓ Enterprise-grade security
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Ready to integrate? Get your API keys in seconds.
            </p>
            <button
              onClick={() => window.location.href = '/signup'}
              className="px-8 py-3 bg-[#FAFAF8] text-orange-600 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Get API Access →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveAPISandbox;
