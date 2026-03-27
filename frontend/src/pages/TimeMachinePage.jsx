import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Upload, Film, Loader2, Crown, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TimeMachinePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [myVideos, setMyVideos] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
  const [usageCount, setUsageCount] = useState({ used: 0, limit: 2 });

  // Form state
  const [title, setTitle] = useState('');
  const [narrationText, setNarrationText] = useState('');
  const [musicGenre, setMusicGenre] = useState('nostalgic');
  const [voiceStyle, setVoiceStyle] = useState('warm');
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    fetchMyVideos();
    checkPremiumStatus();
  }, []);

  const fetchMyVideos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/time-machine/my-videos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMyVideos(data.videos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const checkPremiumStatus = async () => {
    try {
      // Check if user has Story Empire premium (shares the same subscription)
      const response = await fetch(`${API_URL}/api/story-empire/my-movies`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      // For now, count videos this month
      const now = new Date();
      const thisMonth = data.movies?.filter(m => {
        const created = new Date(m.created_at);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length || 0;
      setUsageCount({ used: thisMonth, limit: 2 });
    } catch (error) {
      console.error('Error checking premium:', error);
    }
  };

  const createVideo = async () => {
    if (!title.trim() || photos.length === 0) {
      toast.error('Please provide title and upload at least 1 photo');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      photos.forEach(photo => {
        formData.append('photos', photo);
      });

      const requestData = {
        title,
        narration_text: narrationText,
        music_genre: musicGenre,
        voice_style: voiceStyle
      };

      const response = await fetch(`${API_URL}/api/time-machine/create?${new URLSearchParams(requestData)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.status === 402) {
        toast.error('Monthly limit reached or insufficient balance! $1.99 per video or upgrade to premium.');
        setTimeout(() => navigate('/wallet'), 2000);
        return;
      }

      if (data.success) {
        toast.success(`✅ Processing ${photos.length} photos into memory movie! Takes 2-3 minutes.`);
        fetchMyVideos();
        checkPremiumStatus();
        // Reset form
        setTitle('');
        setNarrationText('');
        setPhotos([]);
      } else {
        toast.error(data.detail || 'Failed to create video');
      }
    } catch (error) {
      console.error('Error creating video:', error);
      toast.error('Failed to create video');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 20) {
      toast.error('Maximum 20 photos allowed');
      return;
    }
    setPhotos(files);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-12 h-12 text-amber-600 mr-3" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              ⏰ Time Machine
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Turn old family photos into animated memory videos! 📸✨
          </p>
        </div>

        {/* Usage Stats */}
        <Card className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">This Month's Videos</p>
                <p className="text-3xl font-bold">
                  {usageCount.used} / {isPremium ? '20' : usageCount.limit}
                </p>
              </div>
              {!isPremium && (
                <Button
                  onClick={() => navigate('/story-empire')}
                  className="bg-white text-orange-600 hover:bg-gray-100"
                >
                  <Crown className="mr-2" />
                  Upgrade ($2.99/mo)
                </Button>
              )}
              <div className="text-right">
                <p className="text-sm opacity-90">Pay Per Video</p>
                <p className="text-2xl font-bold">$1.99</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Create Video */}
          <div>
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 text-amber-500" />
                  Create Memory Video
                </CardTitle>
                <CardDescription>
                  Upload old photos and watch them come to life!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Family Memories 1985"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Photos (1-20)
                  </label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {photos.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      📸 {photos.length} photos selected
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Narration Text (Optional)
                  </label>
                  <Textarea
                    value={narrationText}
                    onChange={(e) => setNarrationText(e.target.value)}
                    placeholder="Add a voiceover narration to your video..."
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Music Genre
                    </label>
                    <Select value={musicGenre} onValueChange={setMusicGenre}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nostalgic">🎵 Nostalgic</SelectItem>
                        <SelectItem value="happy">☀️ Happy</SelectItem>
                        <SelectItem value="calm">🌸 Calm</SelectItem>
                        <SelectItem value="inspirational">🌟 Inspirational</SelectItem>
                        <SelectItem value="cinematic">🎬 Cinematic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voice Style
                    </label>
                    <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warm">🤗 Warm</SelectItem>
                        <SelectItem value="professional">🎤 Professional</SelectItem>
                        <SelectItem value="friendly">😊 Friendly</SelectItem>
                        <SelectItem value="storyteller">📚 Storyteller</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={createVideo}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Memory...
                    </>
                  ) : (
                    <>
                      <Film className="mr-2 h-5 w-5" />
                      Create Memory Video
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: My Videos */}
          <div>
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>🎬 My Memory Videos</CardTitle>
                <CardDescription>
                  All your precious memories preserved!
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myVideos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No videos yet. Create your first memory video!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {myVideos.map((video) => (
                      <Card key={video.video_id} className="border-2">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{video.title}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                📸 {video.photo_count} photos
                              </p>
                              <div className="mt-2">
                                {video.status === 'completed' && (
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => window.open(video.video_path, '_blank')}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      ▶️ Watch
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(video.video_path, '_blank')}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                                {video.status === 'processing' && (
                                  <div className="flex items-center text-ember">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span className="text-sm">{video.progress}</span>
                                  </div>
                                )}
                                {video.status === 'failed' && (
                                  <p className="text-red-600 text-sm">❌ Failed</p>
                                )}
                              </div>
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
        </div>

        {/* Feature Showcase */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-ember/5 to-ember-light/10 border-blue-200">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-2">🎬</div>
              <h3 className="font-bold text-gray-900 mb-1">Ken Burns Effect</h3>
              <p className="text-sm text-gray-600">Smooth zoom and pan animations</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-ember/5 to-ember-light/10 border-ember/20">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-2">🎵</div>
              <h3 className="font-bold text-gray-900 mb-1">Background Music</h3>
              <p className="text-sm text-gray-600">Perfect soundtrack for your memories</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-2">🎤</div>
              <h3 className="font-bold text-gray-900 mb-1">AI Narration</h3>
              <p className="text-sm text-gray-600">Add voiceover to tell your story</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TimeMachinePage;