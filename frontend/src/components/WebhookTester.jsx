import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Send, CheckCircle, XCircle, Code, Zap, RefreshCw, Copy, Check } from 'lucide-react';

const WebhookTester = () => {
  const { darkMode } = useTheme();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showPayload, setShowPayload] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Sample test payload
  const testPayload = {
    message_id: `msg_${Date.now()}_test`,
    from_number: '+14155552671',
    to_number: '+447123456789',
    body: 'Hello from Calliotel! Your webhook is working perfectly. 🚀',
    timestamp: new Date().toISOString(),
    direction: 'inbound',
    status: 'received',
    country: 'US',
    carrier: 'Bandwidth',
    test_mode: true
  };

  const sendTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter a valid webhook URL',
        duration: 0
      });
      return;
    }

    // Validate URL format
    try {
      new URL(webhookUrl);
    } catch (e) {
      setTestResult({
        success: false,
        message: 'Invalid URL format. Please use http:// or https://',
        duration: 0
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    const startTime = Date.now();

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/webhooks/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          payload: testPayload
        })
      });

      const duration = Date.now() - startTime;
      const data = await response.json();

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: `Webhook delivered successfully! Your server responded with ${data.status_code || 200}.`,
          duration: duration,
          response: data.response_body
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Webhook delivery failed. Check your endpoint.',
          duration: duration,
          details: data.details
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResult({
        success: false,
        message: `Connection failed: ${error.message}`,
        duration: duration,
        details: 'Make sure your webhook URL is accessible from the internet.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(testPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className={`rounded-3xl overflow-hidden shadow-2xl ${
      darkMode ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white border-2 border-gray-200'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-ember to-ember-light/50 p-6">
        <div className="flex items-center space-x-3">
          <Zap className="w-8 h-8 text-white" />
          <div>
            <h3 className="text-2xl font-black text-white">Webhook Testing Tool</h3>
            <p className="text-white/90 text-sm font-semibold">Developer First. Zero Cost Testing.</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* URL Input */}
        <div className="mb-6">
          <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Your Webhook URL
          </label>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-server.com/webhook/sms"
            className={`w-full px-4 py-3 rounded-xl border-2 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              darkMode
                ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                : 'bg-[#F9F9F7] border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
            disabled={isLoading}
          />
          <p className={`mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
            💡 Your webhook must accept POST requests and return a 200 status code
          </p>
        </div>

        {/* Test Button */}
        <button
          onClick={sendTestWebhook}
          disabled={isLoading || !webhookUrl.trim()}
          className={`w-full px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-3 transition-all ${
            isLoading || !webhookUrl.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-ember to-ember-light/50 hover:scale-105 shadow-2xl'
          } text-white`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Sending Test Payload...</span>
            </>
          ) : (
            <>
              <Send className="w-6 h-6" />
              <span>Send Test Webhook</span>
            </>
          )}
        </button>

        {/* Result Display */}
        {testResult && (
          <div className={`mt-6 p-6 rounded-2xl border-2 ${
            testResult.success
              ? darkMode
                ? 'bg-green-900/20 border-green-700'
                : 'bg-green-50 border-green-200'
              : darkMode
              ? 'bg-red-900/20 border-red-700'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start space-x-4">
              {testResult.success ? (
                <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h4 className={`text-lg font-bold mb-2 ${
                  testResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {testResult.success ? '✓ Success!' : '✗ Failed'}
                </h4>
                <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {testResult.message}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  Response time: {testResult.duration}ms
                </p>
                {testResult.details && (
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                    {testResult.details}
                  </p>
                )}
                {testResult.response && (
                  <div className={`mt-3 p-3 rounded-lg font-mono text-xs ${
                    darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-800'
                  }`}>
                    <pre className="whitespace-pre-wrap">{testResult.response}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payload Preview */}
        <div className="mt-8">
          <button
            onClick={() => setShowPayload(!showPayload)}
            className={`w-full px-4 py-3 rounded-xl font-semibold flex items-center justify-between transition-all ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5" />
              <span>View Test Payload</span>
            </div>
            <span className="text-sm">{showPayload ? '▼' : '▶'}</span>
          </button>

          {showPayload && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  JSON Payload (what your webhook will receive)
                </span>
                <button
                  onClick={copyPayload}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                    copiedPayload
                      ? 'bg-green-500 text-white'
                      : darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {copiedPayload ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className={`p-4 rounded-xl font-mono text-xs overflow-x-auto ${
                darkMode ? 'bg-gray-900 text-gray-300' : 'bg-[#F9F9F7] text-gray-800'
              }`}>
                <pre>{JSON.stringify(testPayload, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Developer Tips */}
        <div className={`mt-6 p-4 rounded-xl ${
          darkMode ? 'bg-blue-900/20 border border-ember/30' : 'bg-blue-50 border border-blue-200'
        }`}>
          <h4 className={`text-sm font-bold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            💡 Developer Tips
          </h4>
          <ul className={`text-xs space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <li>• Your webhook must return HTTP 200 (or 201-299) to confirm receipt</li>
            <li>• Test with a service like <code className="font-mono bg-gray-200 px-1 rounded">webhook.site</code> or <code className="font-mono bg-gray-200 px-1 rounded">requestbin.com</code></li>
            <li>• Production webhooks will include signature headers for security verification</li>
            <li>• Failed webhooks will be retried with exponential backoff</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WebhookTester;
