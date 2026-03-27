import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Play, Square, Users, TrendingUp, Loader2, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LiveStreamingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStream, setCurrentStream] = useState(null);
  const [liveStreams, setLiveStreams] = useState([]);
  const [myStreams, setMyStreams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Stream form
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [streamCategory, setStreamCategory] = useState('general');

  useEffect(() => {
    discoverStreams();
    fetchMyStreams();
    const interval = setInterval(discoverStreams, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [selectedCategory, searchTerm]);

  const discoverStreams = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API_URL}/api/live-streaming/discover?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setLiveStreams(data.streams);
      }
    } catch (error) {
      console.error('Error discovering streams:', error);
    }
  };

  const fetchMyStreams = async () => {
    try {
      const response = await fetch(`${API_URL}/api/live-streaming/my-streams`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMyStreams(data.streams);
      }
    } catch (error) {
      console.error('Error fetching my streams:', error);
    }
  };

  const startStream = async () => {
    if (!streamTitle.trim()) {
      toast.error('Please provide a stream title');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/live-streaming/start-stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: streamTitle,
          description: streamDescription,
          category: streamCategory,
          is_public: true,
          enable_filters: true
        })
      });

      const data = await response.json();

      if (data.success) {
        setCurrentStream(data);
        setIsStreaming(true);
        toast.success('📡 Stream started! You are LIVE!');
        fetchMyStreams();
      } else {
        toast.error(data.detail || 'Failed to start stream');
      }
    } catch (error) {
      console.error('Error starting stream:', error);
      toast.error('Failed to start stream');
    } finally {
      setLoading(false);
    }
  };

  const endStream = async () => {
    if (!currentStream?.stream_id) return;

    try {
      const response = await fetch(`${API_URL}/api/live-streaming/end-stream/${currentStream.stream_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ Stream ended! Peak viewers: ${data.peak_viewers}`);
        setIsStreaming(false);
        setCurrentStream(null);
        fetchMyStreams();
      }
    } catch (error) {
      console.error('Error ending stream:', error);
    }
  };

  const joinStream = async (streamId) => {
    try {
      const response = await fetch(`${API_URL}/api/live-streaming/join-stream/${streamId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Joined stream!');
        // In production, open stream player
      } else {
        toast.error(data.detail || 'Failed to join stream');
      }
    } catch (error) {
      console.error('Error joining stream:', error);
      toast.error('Failed to join stream');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Radio className="w-12 h-12 text-red-600 mr-3" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              📡 Live Filter Streaming
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Stream with 69 filters to unlimited viewers! Like Twitch but funnier! 😂
          </p>
        </div>

        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="discover">
              <Eye className="mr-2 h-4 w-4" />
              Discover Streams
            </TabsTrigger>
            <TabsTrigger value="go-live">
              <Radio className="mr-2 h-4 w-4" />
              Go Live
            </TabsTrigger>
            <TabsTrigger value="my-streams">
              <TrendingUp className="mr-2 h-4 w-4" />
              My Streams
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover">
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="🔍 Search streams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">🌎 All Categories</SelectItem>
                      <SelectItem value="gaming">🎮 Gaming</SelectItem>
                      <SelectItem value="music">🎵 Music</SelectItem>
                      <SelectItem value="talk">💬 Talk Show</SelectItem>
                      <SelectItem value="creative">🎨 Creative</SelectItem>
                      <SelectItem value="comedy">😂 Comedy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Live Streams Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveStreams.map((stream) => (
                <Card key={stream.stream_id} className="hover:shadow-xl transition-shadow relative">
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center">
                      <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                      LIVE
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{stream.title}</CardTitle>
                    <CardDescription>
                      by {stream.streamer_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{stream.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {stream.viewer_count} watching
                      </span>
                      <span className="bg-ember/10 text-ember-dark px-2 py-1 rounded text-xs">
                        {stream.category}
                      </span>
                    </div>
                    <Button
                      onClick={() => joinStream(stream.stream_id)}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Watch Stream
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {liveStreams.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <Radio className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No live streams right now. Be the first to go live!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Go Live Tab */}
          <TabsContent value="go-live">
            {!isStreaming ? (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>📡 Start Your Stream</CardTitle>
                  <CardDescription>
                    Go live with filters and stream to the world!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stream Title
                    </label>
                    <Input
                      value={streamTitle}
                      onChange={(e) => setStreamTitle(e.target.value)}
                      placeholder="e.g., Epic Gaming Session with Filters!"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Textarea
                      value={streamDescription}
                      onChange={(e) => setStreamDescription(e.target.value)}
                      placeholder="Tell viewers what to expect..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <Select value={streamCategory} onValueChange={setStreamCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">🌎 General</SelectItem>
                        <SelectItem value="gaming">🎮 Gaming</SelectItem>
                        <SelectItem value="music">🎵 Music</SelectItem>
                        <SelectItem value="talk">💬 Talk Show</SelectItem>
                        <SelectItem value="creative">🎨 Creative</SelectItem>
                        <SelectItem value="comedy">😂 Comedy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-orange-800">
                      🎭 <strong>69 Filters Available:</strong> Apply filters in real-time during your stream!
                    </p>
                  </div>

                  <Button
                    onClick={startStream}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Starting Stream...
                      </>
                    ) : (
                      <>
                        <Radio className="mr-2 h-5 w-5" />
                        Go Live!
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              // Streaming UI
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-red-600 rounded-full mr-2 animate-pulse"></span>
                      YOU ARE LIVE!
                    </span>
                    <span className="text-lg font-normal flex items-center text-gray-600">
                      <Users className="w-5 h-5 mr-2" />
                      0 viewers
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Video Preview */}
                  <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
                    <div className="text-white text-center">
                      <Radio className="w-16 h-16 mx-auto mb-4" />
                      <p>Your Stream (Camera view would appear here)</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{streamTitle}</p>
                      <p className="text-sm text-gray-600">{streamDescription}</p>
                    </div>
                    <Button
                      onClick={endStream}
                      variant="destructive"
                      size="lg"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Square className="mr-2 h-5 w-5" />
                      End Stream
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Streams Tab */}
          <TabsContent value="my-streams">
            <Card>
              <CardHeader>
                <CardTitle>My Stream History</CardTitle>
              </CardHeader>
              <CardContent>
                {myStreams.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Radio className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No streams yet. Go live!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myStreams.map((stream) => (
                      <Card key={stream.stream_id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{stream.title}</p>
                              <p className="text-sm text-gray-600">{stream.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(stream.started_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                👁️ Peak: {stream.peak_viewers} viewers
                              </p>
                              {stream.duration_seconds && (
                                <p className="text-xs text-gray-500">
                                  Duration: {Math.floor(stream.duration_seconds / 60)}m
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LiveStreamingPage;