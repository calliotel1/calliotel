import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ghost, Upload, Play, Send, Loader2, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HologramMessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [myHolograms, setMyHolograms] = useState([]);

  // Form state
  const [recipientUserId, setRecipientUserId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [hologramStyle, setHologramStyle] = useState('starwars');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  useEffect(() => {
    fetchMyHolograms();
  }, []);

  const fetchMyHolograms = async () => {
    try {
      const response = await fetch(`${API_URL}/api/hologram-messages/my-holograms`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMyHolograms(data.holograms);
      }
    } catch (error) {
      console.error('Error fetching holograms:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const createHologram = async () => {
    if (!recipientUserId.trim() || !videoFile) {
      toast.error('Please provide recipient ID and upload a video');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      const requestData = {
        recipient_user_id: recipientUserId,
        message_text: messageText,
        hologram_style: hologramStyle
      };

      const response = await fetch(`${API_URL}/api/hologram-messages/create?${new URLSearchParams(requestData)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.status === 402) {
        toast.error('Insufficient balance! Need $4.99 for hologram message.');
        setTimeout(() => navigate('/wallet'), 2000);
        return;
      }

      if (data.success) {
        toast.success('✅ Creating hologram message! Processing...');
        fetchMyHolograms();
        // Reset form
        setRecipientUserId('');
        setMessageText('');
        setVideoFile(null);
        setVideoPreview(null);
      } else {
        toast.error(data.detail || 'Failed to create hologram');
      }
    } catch (error) {
      console.error('Error creating hologram:', error);
      toast.error('Failed to create hologram');
    } finally {
      setLoading(false);
    }
  };

  const viewHologram = (hologramId) => {
    window.open(`${API_URL}/api/hologram-messages/view/${hologramId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-ember-light/5">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Ghost className="w-12 h-12 text-cyan-600 mr-3" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              👻 Hologram Messages
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            AR hologram video messages! Star Wars style! ✨🛸
          </p>
        </div>

        {/* Price Banner */}
        <Card className="mb-6 bg-gradient-to-r from-ember via-blue-500 to-ember-light text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Per Hologram Message</p>
                <p className="text-4xl font-bold">$4.99</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">"Help me, Obi-Wan Kenobi."</p>
                <p className="font-semibold">🌟 Like Star Wars! 🌟</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">
              <Upload className="mr-2 h-4 w-4" />
              Create Hologram
            </TabsTrigger>
            <TabsTrigger value="my-holograms">
              <Eye className="mr-2 h-4 w-4" />
              My Holograms
            </TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Form */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Ghost className="mr-2 text-cyan-500" />
                    Create Hologram Message
                  </CardTitle>
                  <CardDescription>
                    Record a video and send it as a hologram!
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
                      Message Text (Optional)
                    </label>
                    <Textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Add a text message..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hologram Style
                    </label>
                    <Select value={hologramStyle} onValueChange={setHologramStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starwars">⭐ Star Wars (Blue)</SelectItem>
                        <SelectItem value="futuristic">🛸 Futuristic (Neon)</SelectItem>
                        <SelectItem value="glitch">🔲 Glitch (Digital)</SelectItem>
                        <SelectItem value="matrix">💻 Matrix (Green Code)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Video
                    </label>
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                    />
                    {videoPreview && (
                      <div className="mt-4">
                        <video
                          src={videoPreview}
                          controls
                          className="w-full rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={createHologram}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-cyan-600 to-ember-light hover:from-cyan-700 hover:to-ember-light"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Hologram...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Send Hologram ($4.99)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Right: Preview & Info */}
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-cyan-100 to-ember-light/10">
                  <CardHeader>
                    <CardTitle>🌟 How It Works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start">
                      <div className="text-2xl mr-3">1️⃣</div>
                      <div>
                        <p className="font-semibold">Record Your Message</p>
                        <p className="text-sm text-gray-600">Upload a video of yourself</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="text-2xl mr-3">2️⃣</div>
                      <div>
                        <p className="font-semibold">We Add Hologram Effect</p>
                        <p className="text-sm text-gray-600">Blue tint, scan lines, distortion</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="text-2xl mr-3">3️⃣</div>
                      <div>
                        <p className="font-semibold">Recipient Views in AR</p>
                        <p className="text-sm text-gray-600">Appears as hologram in their space!</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-ember/10 to-ember-light/10">
                  <CardHeader>
                    <CardTitle>🎬 Style Examples</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="font-semibold text-ember">⭐ Star Wars</p>
                        <p className="text-sm text-gray-600">Classic blue hologram with static</p>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="font-semibold text-cyan-600">🛸 Futuristic</p>
                        <p className="text-sm text-gray-600">Neon colors & glowing edges</p>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="font-semibold text-ember">🔲 Glitch</p>
                        <p className="text-sm text-gray-600">Digital artifacts & distortion</p>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="font-semibold text-green-600">💻 Matrix</p>
                        <p className="text-sm text-gray-600">Green tint with code rain</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* My Holograms Tab */}
          <TabsContent value="my-holograms">
            <Card>
              <CardHeader>
                <CardTitle>👻 My Hologram Messages</CardTitle>
                <CardDescription>
                  Sent and received holograms
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myHolograms.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Ghost className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No holograms yet. Send your first hologram message!</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {myHolograms.map((hologram) => (
                      <Card key={hologram.hologram_id} className="border-2">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {hologram.sender_id === user?.user_id
                                  ? `To: ${hologram.recipient_id}`
                                  : `From: ${hologram.sender_name}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(hologram.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              hologram.hologram_style === 'starwars' ? 'bg-blue-100 text-blue-800' :
                              hologram.hologram_style === 'futuristic' ? 'bg-cyan-100 text-cyan-800' :
                              hologram.hologram_style === 'glitch' ? 'bg-ember/10 text-ember-dark' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {hologram.hologram_style}
                            </div>
                          </div>

                          {hologram.message_text && (
                            <p className="text-sm text-gray-600 mb-3">
                              {hologram.message_text}
                            </p>
                          )}

                          <div>
                            {hologram.status === 'completed' && (
                              <Button
                                size="sm"
                                onClick={() => viewHologram(hologram.hologram_id)}
                                className="w-full bg-cyan-600 hover:bg-cyan-700"
                              >
                                <Play className="mr-1 h-4 w-4" />
                                View Hologram
                              </Button>
                            )}
                            {hologram.status === 'processing' && (
                              <div className="flex items-center text-ember justify-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                <span className="text-sm">{hologram.progress}</span>
                              </div>
                            )}
                            {hologram.status === 'failed' && (
                              <p className="text-red-600 text-sm text-center">❌ Failed</p>
                            )}
                          </div>

                          {hologram.viewed && hologram.recipient_id === user?.user_id && (
                            <p className="text-xs text-green-600 mt-2 text-center">
                              ✓ Viewed
                            </p>
                          )}
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

export default HologramMessagesPage;