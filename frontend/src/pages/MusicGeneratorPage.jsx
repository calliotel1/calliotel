import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Sparkles, Download, Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MusicGeneratorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('auto');
  const [storyText, setStoryText] = useState('');
  const [generatedMusic, setGeneratedMusic] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [audioRef] = useState(new Audio());

  useEffect(() => {
    fetchGenres();
    return () => {
      audioRef.pause();
    };
  }, []);

  const fetchGenres = async () => {
    try {
      const response = await fetch(`${API_URL}/api/music-generator/genres`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setGenres(data.genres);
      }
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const generateMusic = async () => {
    if (!storyText.trim()) {
      toast.error('Please enter story text or select a genre');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/music-generator/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          genre: selectedGenre,
          story_text: storyText
        })
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedMusic(data);
        toast.success('🎵 Music generated successfully!');
      } else {
        toast.error(data.detail || 'Failed to generate music');
      }
    } catch (error) {
      console.error('Error generating music:', error);
      toast.error('Failed to generate music');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (playing) {
      audioRef.pause();
      setPlaying(false);
    } else {
      audioRef.src = generatedMusic.music_url;
      audioRef.play();
      setPlaying(true);
    }
  };

  audioRef.onended = () => setPlaying(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-ember/5 via-pink-50 to-ember-light/5">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Music className="w-12 h-12 text-ember mr-3" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              🎵 AI Music Generator
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Generate perfect background music for your videos using AI
          </p>
        </div>

        {/* Main Generator Card */}
        <Card className="mb-8 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 text-yellow-500" />
              Generate Music
            </CardTitle>
            <CardDescription>
              Enter your story text or select a genre to generate matching background music
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Story Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Story Text (Optional)
              </label>
              <Textarea
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="Paste your story here and we'll auto-detect the mood... or just select a genre below!"
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Genre Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Music Genre
              </label>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">🪄 Auto-Detect from Story</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.id}>
                      {genre.icon} {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateMusic}
              disabled={loading}
              className="w-full bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Music...
                </>
              ) : (
                <>
                  <Music className="mr-2 h-5 w-5" />
                  Generate Music
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Music Player */}
        {generatedMusic && (
          <Card className="shadow-xl bg-gradient-to-br from-ember/10 to-ember-light/10">
            <CardHeader>
              <CardTitle>🎼 Your Generated Music</CardTitle>
              <CardDescription>
                Genre: {generatedMusic.genre_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <Button
                  onClick={togglePlay}
                  size="lg"
                  className="bg-ember hover:bg-ember-light"
                >
                  {playing ? (
                    <>
                      <Pause className="mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2" />
                      Play
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => window.open(generatedMusic.music_url, '_blank')}
                  variant="outline"
                  size="lg"
                >
                  <Download className="mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Genre Showcase */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            🎭 Available Music Genres
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {genres.map((genre) => (
              <Card
                key={genre.id}
                className="text-center cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedGenre(genre.id)}
              >
                <CardContent className="pt-6">
                  <div className="text-4xl mb-2">{genre.icon}</div>
                  <p className="font-semibold text-sm">{genre.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicGeneratorPage;