import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Code, Copy, Check, Download, Zap, Terminal, Smartphone, Globe, Video } from 'lucide-react';

const SDKShowcase = () => {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('sms');
  const [activeLang, setActiveLang] = useState('curl');
  const [copiedId, setCopiedId] = useState(null);

  const sdkCategories = [
    { id: 'sms', name: 'SMS API', icon: Smartphone, color: 'from-ember to-cyan-500' },
    { id: 'voice', name: 'Voice API', icon: Terminal, color: 'from-ember to-ember-light/50' },
    { id: 'video', name: 'Video SDK', icon: Video, color: 'from-orange-500 to-red-500' },
  ];

  const languages = [
    { id: 'curl', name: 'cURL', color: 'bg-green-500' },
    { id: 'python', name: 'Python', color: 'bg-ember' },
    { id: 'javascript', name: 'JavaScript', color: 'bg-yellow-500' },
    { id: 'react', name: 'React', color: 'bg-cyan-500' },
  ];

  const codeExamples = {
    sms: {
      curl: `# Send SMS with Calliotel API
curl -X POST https://api.calliotel.com/v1/sms/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "+14155552671",
    "to": "+447123456789",
    "text": "Hello from Calliotel! 🚀"
  }'

# Response
{
  "status": "delivered",
  "message_id": "msg_abc123",
  "cost": 0.0075,
  "timestamp": "2026-03-18T12:00:00Z"
}`,
      python: `# Install: pip install calliotel
from calliotel import Client

# Initialize client
client = Client(api_key="YOUR_API_KEY")

# Send SMS
message = client.sms.send(
    from_number="+14155552671",
    to_number="+447123456789",
    text="Hello from Calliotel! 🚀"
)

print(f"Message sent: {message.id}")
print(f"Status: {message.status}")
print(f"Cost: {message.cost}")`,
      javascript: `// Install: npm install calliotel-js
const Calliotel = require('calliotel-js');

// Initialize client
const client = new Calliotel({
  apiKey: process.env.CALLIOTEL_API_KEY
});

// Send SMS
async function sendSMS() {
  const message = await client.sms.send({
    from: '+14155552671',
    to: '+447123456789',
    text: 'Hello from Calliotel! 🚀'
  });
  
  console.log('Message ID:', message.id);
  console.log('Status:', message.status);
  console.log('Cost:', message.cost);
}

sendSMS();`,
      react: `// Install: npm install @calliotel/react
import { useCalliotel } from '@calliotel/react';

function SMSComponent() {
  const { sms } = useCalliotel();
  const [status, setStatus] = useState('');

  const sendMessage = async () => {
    try {
      const result = await sms.send({
        from: '+14155552671',
        to: '+447123456789',
        text: 'Hello from Calliotel! 🚀'
      });
      setStatus('Sent: ' + result.id);
    } catch (error) {
      setStatus('Error: ' + error.message);
    }
  };

  return (
    <div>
      <button onClick={sendMessage}>Send SMS</button>
      <p>{status}</p>
    </div>
  );
}`
    },
    voice: {
      curl: `# Make voice call
curl -X POST https://api.calliotel.com/v1/voice/call \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "+14155552671",
    "to": "+447123456789",
    "answer_url": "https://yourdomain.com/voice-response.xml"
  }'

# Response
{
  "call_id": "call_xyz789",
  "status": "ringing",
  "duration": 0,
  "created_at": "2026-03-18T12:00:00Z"
}`,
      python: `# Make voice call with Python
from calliotel import Client

client = Client(api_key="YOUR_API_KEY")

# Make call
call = client.voice.create_call(
    from_number="+14155552671",
    to_number="+447123456789",
    answer_url="https://yourdomain.com/voice-response.xml"
)

print(f"Call ID: {call.id}")
print(f"Status: {call.status}")

# Get call status
call_status = client.voice.get_call(call.id)
print(f"Duration: {call_status.duration}s")`,
      javascript: `// Make voice call with Node.js
const Calliotel = require('calliotel-js');
const client = new Calliotel({ apiKey: process.env.CALLIOTEL_API_KEY });

async function makeCall() {
  const call = await client.voice.createCall({
    from: '+14155552671',
    to: '+447123456789',
    answerUrl: 'https://yourdomain.com/voice-response.xml'
  });
  
  console.log('Call ID:', call.id);
  console.log('Status:', call.status);
  
  // Get real-time status
  const status = await client.voice.getCall(call.id);
  console.log('Duration:', status.duration);
}

makeCall();`,
      react: `// Voice calling in React
import { useCalliotel } from '@calliotel/react';

function VoiceComponent() {
  const { voice } = useCalliotel();
  const [callStatus, setCallStatus] = useState('idle');

  const makeCall = async () => {
    setCallStatus('calling');
    
    const call = await voice.createCall({
      from: '+14155552671',
      to: '+447123456789',
      answerUrl: 'https://yourdomain.com/voice-response.xml'
    });
    
    setCallStatus('Connected: ' + call.id);
    
    // Listen for call events
    voice.on('callEnded', (event) => {
      setCallStatus('Call ended');
    });
  };

  return (
    <div>
      <button onClick={makeCall}>Make Call</button>
      <p>Status: {callStatus}</p>
    </div>
  );
}`
    },
    video: {
      curl: `# Create video room
curl -X POST https://api.calliotel.com/v1/video/rooms \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "room_name": "sales-demo-2026",
    "max_participants": 10,
    "recording": true
  }'

# Response
{
  "room_id": "room_abc123",
  "room_url": "https://video.calliotel.com/room_abc123",
  "status": "active",
  "created_at": "2026-03-18T12:00:00Z"
}`,
      python: `# Video SDK with Python
from calliotel import Client

client = Client(api_key="YOUR_API_KEY")

# Create video room
room = client.video.create_room(
    room_name="sales-demo-2026",
    max_participants=10,
    recording=True
)

print(f"Room ID: {room.id}")
print(f"Join URL: {room.url}")

# Generate participant token
token = client.video.generate_token(
    room_id=room.id,
    participant_name="John Doe",
    role="moderator"
)

print(f"Token: {token}")`,
      javascript: `// Video SDK with JavaScript
const Calliotel = require('calliotel-js');
const client = new Calliotel({ apiKey: process.env.CALLIOTEL_API_KEY });

async function createVideoRoom() {
  // Create room
  const room = await client.video.createRoom({
    roomName: 'sales-demo-2026',
    maxParticipants: 10,
    recording: true
  });
  
  console.log('Room URL:', room.url);
  
  // Generate participant token
  const token = await client.video.generateToken({
    roomId: room.id,
    participantName: 'John Doe',
    role: 'moderator'
  });
  
  console.log('Join Token:', token);
}

createVideoRoom();`,
      react: `// Video SDK with React
import { CalliotelVideo } from '@calliotel/react-video';
import { useState } from 'react';

function VideoConference() {
  const [roomUrl, setRoomUrl] = useState('');
  const [inCall, setInCall] = useState(false);

  const startVideo = async () => {
    // Create room
    const room = await CalliotelVideo.createRoom({
      roomName: 'sales-demo-2026',
      maxParticipants: 10
    });
    
    setRoomUrl(room.url);
    setInCall(true);
  };

  return (
    <div>
      {!inCall ? (
        <button onClick={startVideo}>
          Start Video Call
        </button>
      ) : (
        <CalliotelVideo
          roomUrl={roomUrl}
          userName="John Doe"
          onLeave={() => setInCall(false)}
        />
      )}
    </div>
  );
}`
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadSDK = (lang) => {
    const downloadLinks = {
      python: 'https://pypi.org/project/calliotel',
      javascript: 'https://www.npmjs.com/package/calliotel-js',
      react: 'https://www.npmjs.com/package/@calliotel/react'
    };
    
    if (downloadLinks[lang]) {
      window.open(downloadLinks[lang], '_blank');
    }
  };

  const activeCategory = sdkCategories.find(cat => cat.id === activeTab);
  const currentCode = codeExamples[activeTab]?.[activeLang] || '';

  return (
    <div className={`py-24 ${darkMode ? 'bg-gray-900' : 'bg-[#F9F9F7]'} relative overflow-hidden`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-ember to-ember-light rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-orange-500 to-ember-light/50 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 ${
              darkMode 
                ? 'bg-gradient-to-r from-ember/20 to-ember-light/20 text-blue-300' 
                : 'bg-gradient-to-r from-ember/10 to-ember-light/10 text-blue-700'
            }`}>
              <Code className="w-4 h-4" />
              <span>DEVELOPER TOOLS</span>
            </span>
          </div>
          
          <h2 className={`text-4xl sm:text-5xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            App-Ready <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">SDK Showcase</span>
          </h2>
          
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
            Production-ready code snippets. Copy, paste, ship. SMS, Voice, and Video APIs in your favorite language.
          </p>
        </div>

        {/* SDK Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {sdkCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`px-6 py-4 rounded-2xl font-bold transition-all flex items-center space-x-3 ${
                  activeTab === category.id
                    ? `bg-gradient-to-r ${category.color} text-white shadow-2xl scale-105`
                    : darkMode
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    : 'bg-[#FAFAF8] text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>

        {/* Main Code Display */}
        <div className={`rounded-3xl overflow-hidden shadow-2xl ${
          darkMode ? 'bg-gray-800 border-2 border-gray-700' : 'bg-[#FAFAF8] border-2 border-gray-200'
        }`}>
          {/* Language Selector */}
          <div className={`flex items-center justify-between px-6 py-4 border-b-2 ${
            darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-[#F9F9F7]'
          }`}>
            <div className="flex space-x-2">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setActiveLang(lang.id)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    activeLang === lang.id
                      ? `${lang.color} text-white shadow-lg`
                      : darkMode
                      ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              {activeLang !== 'curl' && (
                <button
                  onClick={() => downloadSDK(activeLang)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center space-x-2 transition-all ${
                    darkMode
                      ? 'bg-ember hover:bg-ember-light text-white'
                      : 'bg-ember hover:bg-ember text-white'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>Install SDK</span>
                </button>
              )}
              
              <button
                onClick={() => copyToClipboard(currentCode, activeTab + activeLang)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center space-x-2 transition-all ${
                  copiedId === activeTab + activeLang
                    ? 'bg-green-500 text-white'
                    : darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {copiedId === activeTab + activeLang ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Block */}
          <div className={`p-8 font-mono text-sm ${darkMode ? 'bg-gray-900' : 'bg-[#F9F9F7]'}`}>
            <pre className={`overflow-x-auto ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
              <code>{currentCode}</code>
            </pre>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className={`p-6 rounded-2xl text-center ${darkMode ? 'bg-gray-800' : 'bg-[#FAFAF8]'}`}>
            <Zap className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
            <h3 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {'< 5 min'}
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Integration time from zero to production
            </p>
          </div>

          <div className={`p-6 rounded-2xl text-center ${darkMode ? 'bg-gray-800' : 'bg-[#FAFAF8]'}`}>
            <Globe className="w-12 h-12 mx-auto mb-3 text-ember" />
            <h3 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              4 SDKs
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              cURL, Python, JavaScript, React - your choice
            </p>
          </div>

          <div className={`p-6 rounded-2xl text-center ${darkMode ? 'bg-gray-800' : 'bg-[#FAFAF8]'}`}>
            <Terminal className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <h3 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              99.98%
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              API uptime SLA with real-time monitoring
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button
            onClick={() => window.location.href = '/signup'}
            className="px-10 py-5 bg-gradient-to-r from-ember to-ember-light text-white font-black text-lg rounded-2xl shadow-2xl hover:scale-105 transition-all"
          >
            Get Your Free API Key →
          </button>
          <p className={`mt-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            No credit card required • 1,000 free SMS/month • Full API access
          </p>
        </div>
      </div>
    </div>
  );
};

export default SDKShowcase;
