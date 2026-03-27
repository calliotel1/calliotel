import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, DollarSign, Upload, ShoppingCart, TrendingUp, Loader2, Crown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VoiceMarketplacePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [marketplace, setMarketplace] = useState([]);
  const [myVoices, setMyVoices] = useState([]);
  const [myPurchases, setMyPurchases] = useState([]);
  const [stats, setStats] = useState({ total_voices: 0, total_earnings: 0, total_uses: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  // Create voice form
  const [voiceName, setVoiceName] = useState('');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [voiceCategory, setVoiceCategory] = useState('storyteller');
  const [voicePrice, setVoicePrice] = useState('0.99');
  const [audioFile, setAudioFile] = useState(null);

  useEffect(() => {
    fetchMarketplace();
    fetchMyVoices();
    fetchMyPurchases();
  }, [selectedCategory, sortBy, searchTerm]);

  const fetchMarketplace = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      params.append('sort', sortBy);

      const response = await fetch(`${API_URL}/api/voice-marketplace/marketplace?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMarketplace(data.voices);
      }
    } catch (error) {
      console.error('Error fetching marketplace:', error);
    }
  };

  const fetchMyVoices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/voice-marketplace/my-voices`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMyVoices(data.voices);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching my voices:', error);
    }
  };

  const fetchMyPurchases = async () => {
    try {
      const response = await fetch(`${API_URL}/api/voice-marketplace/my-purchases`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMyPurchases(data.purchases);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const createVoice = async () => {
    if (!voiceName.trim() || !audioFile) {
      toast.error('Please provide voice name and audio sample');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      
      const requestData = {
        name: voiceName,
        description: voiceDescription,
        category: voiceCategory,
        price: parseFloat(voicePrice),
        is_public: true
      };

      const response = await fetch(`${API_URL}/api/voice-marketplace/create?${new URLSearchParams(requestData)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.status === 402) {
        toast.error('Insufficient balance! Need $9.99 to create voice clone.');
        setTimeout(() => navigate('/wallet'), 2000);
        return;
      }

      if (data.status === 'success') {
        toast.success('✅ Voice clone created! Now listed in marketplace.');
        fetchMyVoices();
        // Reset form
        setVoiceName('');
        setVoiceDescription('');
        setAudioFile(null);
      } else {
        toast.error(data.message || 'Failed to create voice');
      }
    } catch (error) {
      console.error('Error creating voice:', error);
      toast.error('Failed to create voice');
    } finally {
      setLoading(false);
    }
  };

  const purchaseVoice = async (voiceId, voiceName) => {
    if (!window.confirm(`Purchase this voice for usage? You'll be able to use it in your videos!`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/voice-marketplace/purchase/${voiceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.status === 402) {
        toast.error('Insufficient balance! Please add funds to your wallet.');
        setTimeout(() => navigate('/wallet'), 2000);
        return;
      }

      if (data.success) {
        toast.success(`✅ Purchased: ${voiceName}! Creator earned $${data.creator_earned.toFixed(2)}`);
        fetchMyPurchases();
        fetchMarketplace();
      } else {
        toast.error(data.detail || 'Failed to purchase voice');
      }
    } catch (error) {
      console.error('Error purchasing voice:', error);
      toast.error('Failed to purchase voice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-ember-light/5">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Mic className="w-12 h-12 text-ember mr-3" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              🎤 Voice Clone Marketplace
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Create, sell & buy custom AI voice clones • 70% goes to creator!
          </p>
        </div>

        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="marketplace">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Browse Marketplace
            </TabsTrigger>
            <TabsTrigger value="create">
              <Upload className="mr-2 h-4 w-4" />
              Create Voice
            </TabsTrigger>
            <TabsTrigger value="my-voices">
              <TrendingUp className="mr-2 h-4 w-4" />
              My Voices & Earnings
            </TabsTrigger>
          </TabsList>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace">
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <Input
                    placeholder="🔍 Search voices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">🎭 All Categories</SelectItem>
                      <SelectItem value="storyteller">📚 Storyteller</SelectItem>
                      <SelectItem value="narrator">🎤 Narrator</SelectItem>
                      <SelectItem value="character">🎭 Character</SelectItem>
                      <SelectItem value="celebrity_impression">🌟 Celebrity</SelectItem>
                      <SelectItem value="podcast">🎧 Podcast</SelectItem>
                      <SelectItem value="audiobook">📚 Audiobook</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">🔥 Most Popular</SelectItem>
                      <SelectItem value="newest">✨ Newest</SelectItem>
                      <SelectItem value="price_low">💰 Price: Low to High</SelectItem>
                      <SelectItem value="price_high">💸 Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Voice Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketplace.map((voice) => (
                <Card key={voice.voice_id} className="hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{voice.name}</span>
                      <span className="text-green-600 font-bold">${voice.price}</span>
                    </CardTitle>
                    <CardDescription>
                      by {voice.creator_name} • {voice.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{voice.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>🔥 {voice.total_uses} uses</span>
                      <span>💰 ${voice.total_earnings?.toFixed(2)} earned</span>
                    </div>
                    <Button
                      onClick={() => purchaseVoice(voice.voice_id, voice.name)}
                      disabled={loading}
                      className="w-full bg-ember hover:bg-ember-light"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Purchase for ${voice.price}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {marketplace.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <Mic className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No voices found. Try different filters!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Create Voice Tab */}
          <TabsContent value="create">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>🎤 Create Your Voice Clone</CardTitle>
                <CardDescription>
                  Upload a voice sample and list it in the marketplace. Creation fee: $9.99
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice Name
                  </label>
                  <Input
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="e.g., Epic Movie Narrator"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={voiceDescription}
                    onChange={(e) => setVoiceDescription(e.target.value)}
                    placeholder="Describe your voice style..."
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <Select value={voiceCategory} onValueChange={setVoiceCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="storyteller">Storyteller</SelectItem>
                        <SelectItem value="narrator">Narrator</SelectItem>
                        <SelectItem value="character">Character</SelectItem>
                        <SelectItem value="celebrity_impression">Celebrity Impression</SelectItem>
                        <SelectItem value="podcast">Podcast</SelectItem>
                        <SelectItem value="audiobook">Audiobook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Use ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.99"
                      value={voicePrice}
                      onChange={(e) => setVoicePrice(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audio Sample (MP3, at least 30 seconds)
                  </label>
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files[0])}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💰 <strong>Revenue Split:</strong> You earn 70% of each sale. Platform takes 30%.
                  </p>
                </div>

                <Button
                  onClick={createVoice}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Voice...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      Create Voice ($9.99)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Voices Tab */}
          <TabsContent value="my-voices">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-ember">{stats.total_voices}</p>
                    <p className="text-sm text-gray-600 mt-1">Voice Clones</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">${stats.total_earnings?.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 mt-1">Total Earnings</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-ember">{stats.total_uses}</p>
                    <p className="text-sm text-gray-600 mt-1">Total Uses</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* My Voices List */}
            <Card>
              <CardHeader>
                <CardTitle>My Voice Clones</CardTitle>
              </CardHeader>
              <CardContent>
                {myVoices.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Mic className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No voices yet. Create your first voice clone!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myVoices.map((voice) => (
                      <Card key={voice.voice_id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{voice.name}</p>
                              <p className="text-sm text-gray-600">{voice.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {voice.total_uses} uses • ${voice.total_earnings?.toFixed(2)} earned
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">${voice.price}</p>
                              <p className="text-xs text-gray-500">{voice.category}</p>
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

export default VoiceMarketplacePage;