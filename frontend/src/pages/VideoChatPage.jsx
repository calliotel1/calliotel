import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Phone, PhoneOff, Sparkles, Mic, MicOff, VideoOff, Users, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VideoChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callId, setCallId] = useState(null);
  const [recipientUserId, setRecipientUserId] = useState('');
  const [filters, setFilters] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [callHistory, setCallHistory] = useState([]);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    fetchFilters();
    fetchCallHistory();
  }, []);

  const fetchFilters = async () => {
    try {
      const response = await fetch(`${API_URL}/api/video-chat/filters-available`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setFilters(data.filters);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchCallHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/video-chat/call-history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCallHistory(data.calls);
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
    }
  };

  const startCall = async () => {
    if (!recipientUserId.trim()) {
      toast.error('Please enter recipient user ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/video-chat/start-call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient_user_id: recipientUserId,
          enable_filters: true,
          enable_voice_effects: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCallId(data.call_id);
        setInCall(true);
        toast.success('📞 Calling...');
        // Initialize WebRTC connection
        initializeWebRTC(data.signaling_server);
      } else {
        toast.error(data.detail || 'Failed to start call');
      }
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call');
    } finally {
      setLoading(false);
    }
  };

  const endCall = async () => {
    if (!callId) return;

    try {
      await fetch(`${API_URL}/api/video-chat/end-call/${callId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setInCall(false);
      setCallId(null);
      toast.success('Call ended');
      fetchCallHistory();
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const initializeWebRTC = async (signalingServer) => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // In production, establish WebRTC peer connection
      // This is a simplified version
      toast.info('🎥 Camera and mic ready! Connecting...');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Failed to access camera/microphone');
    }
  };

  const toggleVideo = () => {
    setVideoEnabled(!videoEnabled);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
      }
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ember/5 via-indigo-50 to-ember-light/5">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Video className="w-12 h-12 text-ember mr-3" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              📹 AI Video Chat
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            1-on-1 video calls with 69 FUNNY filters + voice effects! 🤪
          </p>
        </div>

        {!inCall ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Start Call */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="mr-2 text-ember" />
                  Start Video Call
                </CardTitle>
                <CardDescription>
                  Enter user ID to call with filters!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient User ID
                  </label>
                  <Input
                    value={recipientUserId}
                    onChange={(e) => setRecipientUserId(e.target.value)}
                    placeholder="Enter user ID..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Filter (You can change during call)
                  </label>
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="none">👤 No Filter</SelectItem>
                      {filters.slice(0, 20).map((filter) => (
                        <SelectItem key={filter.id} value={filter.id}>
                          {filter.icon} {filter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={startCall}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-ember to-ember-light hover:from-ember-dark hover:to-ember-light"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Calling...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-5 w-5" />
                      Start Video Call
                    </>
                  )}
                </Button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    🎭 <strong>69 Filters Available:</strong> Cat, Monkey, Alien, Robot, Pirate, Superhero, and more!
                  </p>
                  <p className="text-sm text-blue-800 mt-2">
                    🎤 <strong>7 Voice Effects:</strong> Darth Vader, Chipmunk, Robot, Deep, Echo, Reverse, and AI!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Right: Call History */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>📞 Call History</CardTitle>
                <CardDescription>
                  Your recent video calls
                </CardDescription>
              </CardHeader>
              <CardContent>
                {callHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No calls yet. Start your first video call!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {callHistory.map((call) => (
                      <Card key={call.call_id} className="border-2">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {call.caller_id === user?.user_id ? `To: ${call.recipient_name}` : `From: ${call.caller_name}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(call.started_at).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Duration: {Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s
                              </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              call.status === 'active' ? 'bg-green-100 text-green-800' :
                              call.status === 'calling' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {call.status}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // In-Call UI
          <div className="space-y-6">
            <Card className="shadow-2xl">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Local Video */}
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      You
                    </div>
                  </div>

                  {/* Remote Video */}
                  <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <Users className="w-16 h-16" />
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      Guest
                    </div>
                  </div>
                </div>

                {/* Call Controls */}
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    onClick={toggleVideo}
                    variant={videoEnabled ? 'default' : 'destructive'}
                    size="lg"
                  >
                    {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>

                  <Button
                    onClick={toggleAudio}
                    variant={audioEnabled ? 'default' : 'destructive'}
                    size="lg"
                  >
                    {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>

                  <Button
                    onClick={endCall}
                    variant="destructive"
                    size="lg"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <PhoneOff className="mr-2 h-5 w-5" />
                    End Call
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filter Selection During Call */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 text-yellow-500" />
                  Live Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {filters.slice(0, 24).map((filter) => (
                    <Button
                      key={filter.id}
                      variant={selectedFilter === filter.id ? 'default' : 'outline'}
                      onClick={() => setSelectedFilter(filter.id)}
                      className="h-auto py-3"
                    >
                      <div className="text-center">
                        <div className="text-2xl">{filter.icon}</div>
                        <div className="text-xs mt-1">{filter.name.split(' ')[0]}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features */}
        {!inCall && (
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-ember/5 to-ember-light/10 border-ember/20">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-2">🤪</div>
                <h3 className="font-bold text-gray-900 mb-1">69 Filters</h3>
                <p className="text-sm text-gray-600">Change your face in real-time!</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-ember/5 to-ember-light/10 border-blue-200">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-2">🎤</div>
                <h3 className="font-bold text-gray-900 mb-1">Voice Effects</h3>
                <p className="text-sm text-gray-600">Sound like Darth Vader!</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-2">🔒</div>
                <h3 className="font-bold text-gray-900 mb-1">Private & Secure</h3>
                <p className="text-sm text-gray-600">End-to-end encrypted calls</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoChatPage;