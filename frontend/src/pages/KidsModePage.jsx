import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart, Wand2, Film, Loader2, Crown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const KidsModePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [storyText, setStoryText] = useState('');
  const [imageStyle, setImageStyle] = useState('cartoon');
  const [myMovies, setMyMovies] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
  const [usageCount, setUsageCount] = useState({ used: 0, limit: 2 });

  useEffect(() => {
    fetchTemplates();
    fetchMyMovies();
    checkPremiumStatus();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/api/kids-mode/templates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchMyMovies = async () => {
    try {
      const response = await fetch(`${API_URL}/api/kids-mode/my-movies`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMyMovies(data.movies);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
  };

  const checkPremiumStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/kids-mode/usage`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setIsPremium(data.is_premium);
        setUsageCount({ used: data.used_this_month, limit: data.monthly_limit });
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const createMovie = async () => {
    if (!storyText.trim()) {
      toast.error('Please write or select a story!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/kids-mode/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          story_text: storyText,
          image_style: imageStyle,
          use_template: selectedTemplate?.id || null
        })
      });

      const data = await response.json();

      if (response.status === 402) {
        // Payment required
        toast.error('Monthly limit reached! Upgrade to Premium for unlimited kids movies.');
        setTimeout(() => navigate('/story-empire'), 2000);
        return;
      }

      if (data.success) {
        toast.success('🎬 Creating your kid-safe movie! This takes 2-3 minutes.');
        fetchMyMovies();
        checkPremiumStatus();
      } else {
        toast.error(data.detail || 'Failed to create movie');
      }
    } catch (error) {
      console.error('Error creating movie:', error);
      toast.error('Failed to create movie');
    } finally {
      setLoading(false);
    }
  };

  const upgradeToPremium = () => {
    navigate('/story-empire');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ember/10 via-purple-100 to-ember-light/10">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-12 h-12 text-ember-500 mr-3" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              👶 Story Empire for Kids
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Safe, magical stories that come to life! 🌈✨
          </p>
        </div>

        {/* Usage Stats */}
        <Card className="mb-6 bg-gradient-to-r from-ember/50 to-ember-light text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">This Month's Movies</p>
                <p className="text-3xl font-bold">
                  {usageCount.used} / {isPremium ? '20' : usageCount.limit}
                </p>
              </div>
              {!isPremium && (
                <Button
                  onClick={upgradeToPremium}
                  className="bg-white text-ember hover:bg-gray-100"
                >
                  <Crown className="mr-2" />
                  Upgrade to Premium
                </Button>
              )}
              {isPremium && (
                <div className="flex items-center bg-yellow-400 text-ember-900 px-4 py-2 rounded-full font-bold">
                  <Crown className="mr-2" />
                  Premium Member
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Story Creator */}
          <div>
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wand2 className="mr-2 text-ember" />
                  Create Your Story
                </CardTitle>
                <CardDescription>
                  Write your own story or use a fairy tale template!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🧚 Pick a Fairy Tale Template
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {templates.slice(0, 6).map((template) => (
                      <Button
                        key={template.id}
                        variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedTemplate(template);
                          setStoryText(template.prompt);
                        }}
                        className="h-auto py-3"
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{template.icon}</div>
                          <div className="text-xs">{template.title}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Story Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ✍️ Your Story
                  </label>
                  <Textarea
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="Once upon a time..."
                    rows={8}
                    className="resize-none"
                  />
                </div>

                {/* Image Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎨 Animation Style
                  </label>
                  <Select value={imageStyle} onValueChange={setImageStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cartoon">🎨 Colorful Cartoon</SelectItem>
                      <SelectItem value="storybook">📚 Storybook Illustration</SelectItem>
                      <SelectItem value="animated">🎬 3D Animated (Pixar-like)</SelectItem>
                      <SelectItem value="kawaii">🌸 Kawaii (Super Cute)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Create Button */}
                <Button
                  onClick={createMovie}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-ember/50 to-ember-light hover:from-ember hover:to-ember-light"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Magic...
                    </>
                  ) : (
                    <>
                      <Film className="mr-2 h-5 w-5" />
                      Create Kid-Safe Movie! 🌟
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: My Movies */}
          <div>
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>🎬 My Kid-Safe Movies</CardTitle>
                <CardDescription>
                  All your magical creations in one place!
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myMovies.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No movies yet! Create your first magical story! 🌟</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {myMovies.map((movie) => (
                      <Card key={movie.movie_id} className="border-2">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {movie.title || 'Untitled Story'}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {movie.story_text?.substring(0, 100)}...
                              </p>
                              <div className="mt-2">
                                {movie.status === 'completed' && (
                                  <Button
                                    size="sm"
                                    onClick={() => window.open(movie.video_url, '_blank')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    ▶️ Watch Movie
                                  </Button>
                                )}
                                {movie.status === 'processing' && (
                                  <div className="flex items-center text-ember">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span className="text-sm">{movie.progress}</span>
                                  </div>
                                )}
                                {movie.status === 'failed' && (
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

        {/* Safety Notice */}
        <Card className="mt-8 bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start">
              <div className="text-3xl mr-4">🛡️</div>
              <div>
                <h3 className="font-bold text-green-900 mb-2">100% Kid-Safe Content</h3>
                <p className="text-green-800 text-sm">
                  All stories are automatically filtered for inappropriate content. We block scary, violent, or unsuitable themes and only create positive, age-appropriate stories! 🌈✨
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KidsModePage;