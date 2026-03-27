import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Sparkles, Video, AlertCircle, CheckCircle, Clock, 
  Wand2, BookOpen, Film, Crown, Loader, Play, Download,
  Shield, Zap, TrendingUp
} from 'lucide-react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StoryEmpirePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  
  const [mode, setMode] = useState('write'); // write or ai_generate
  const [storyText, setStoryText] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [musicGenre, setMusicGenre] = useState('auto');
  const [musicGenres, setMusicGenres] = useState([]);
  const [kidsMode, setKidsMode] = useState(false);
  
  // Usage & movies
  const [usage, setUsage] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [pollingMovies, setPollingMovies] = useState(new Set());
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchUsageAndMovies();
    fetchMusicGenres();
    
    // Poll for processing movies every 10 seconds
    const interval = setInterval(() => {
      if (pollingMovies.size > 0) {
        fetchUsageAndMovies();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [user, pollingMovies]);
  
  const fetchMusicGenres = async () => {
    try {
      const response = await axios.get(`${API}/story-empire/music-genres`);
      setMusicGenres(response.data.genres);
    } catch (error) {
      console.error('Error fetching music genres:', error);
    }
  };
  
  const fetchUsageAndMovies = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [usageRes, moviesRes] = await Promise.all([
        axios.get(`${API}/story-empire/usage`, { headers }),
        axios.get(`${API}/story-empire/my-movies`, { headers })
      ]);
      
      setUsage(usageRes.data.usage);
      setMovies(moviesRes.data.movies);
      
      // Track processing movies for polling
      const processing = new Set();
      moviesRes.data.movies.forEach(m => {
        if (m.status === 'processing') {
          processing.add(m.story_id);
        }
      });
      setPollingMovies(processing);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingMovies(false);
    }
  };
  
  const generateStory = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a story prompt',
        variant: 'destructive'
      });
      return;
    }
    
    setGenerating(true);
    setResult(null);
    
    try {
      const token = safeLocalStorage.getItem('token');
      
      const response = await axios.post(
        `${API}/story-empire/create`,
        {
          story_text: '', // Will be generated
          title: title || 'AI Generated Story',
          generate_mode: 'ai_generate',
          prompt: aiPrompt,
          voice_style: 'neutral',
          music_genre: musicGenre,
          kids_mode: kidsMode
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResult(response.data);
      
      if (response.data.moderation_passed) {
        toast({
          title: '✅ Story Approved!',
          description: 'Generating your movie... Check status below!'
        });
        fetchUsageAndMovies();
      } else {
        toast({
          title: '❌ Content Rejected',
          description: response.data.message,
          variant: 'destructive'
        });
      }
      
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to generate story',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };
  
  const createMovie = async () => {
    if (!storyText.trim()) {
      toast({
        title: 'Story Required',
        description: 'Please write your story first',
        variant: 'destructive'
      });
      return;
    }
    
    const wordCount = storyText.trim().split(/\s+/).length;
    if (wordCount < 50) {
      toast({
        title: 'Story Too Short',
        description: 'Minimum 50 words required',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const token = safeLocalStorage.getItem('token');
      
      const response = await axios.post(
        `${API}/story-empire/create`,
        {
          story_text: storyText,
          title: title || 'My Story',
          generate_mode: 'manual',
          voice_style: 'neutral',
          music_genre: musicGenre,
          kids_mode: kidsMode
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResult(response.data);
      
      if (response.data.moderation_passed) {
        toast({
          title: '✅ Story Approved!',
          description: 'Generating your movie... Check status below!'
        });
        fetchUsageAndMovies();
      } else {
        toast({
          title: '❌ Content Rejected',
          description: response.data.message,
          variant: 'destructive'
        });
      }
      
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create movie',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const wordCount = storyText.trim().split(/\s+/).filter(w => w).length;
  const isOverLimit = wordCount > 2000;
  
  const downloadVideo = (storyId, title) => {
    const token = safeLocalStorage.getItem('token');
    const downloadUrl = `${API}/story-empire/video/${storyId}?token=${token}`;
    window.open(downloadUrl, '_blank');
  };
  
  const deleteStory = async (storyId) => {
    if (!window.confirm('Delete this story movie?')) return;
    
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.delete(`${API}/story-empire/${storyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast({
        title: 'Deleted',
        description: 'Story movie deleted successfully'
      });
      
      fetchUsageAndMovies();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete story',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-ember via-pink-600 to-orange-500 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-4">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">WORLD'S FIRST AI STORY-TO-MOVIE PLATFORM</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              📖 STORY EMPIRE 🎬
            </h1>
            
            <p className="text-xl text-white/90 mb-6 max-w-3xl mx-auto">
              Turn your words into cinematic videos! Write stories or let AI create them, then watch as they become beautiful movies with narration and scenes!
            </p>
            
            {/* Usage Stats */}
            {usage && (
              <div className="inline-flex items-center space-x-6 bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4">
                <div className="text-center">
                  <div className="text-3xl font-black text-white">{usage.remaining}</div>
                  <div className="text-white/80 text-sm">Videos Left</div>
                </div>
                <div className="w-px h-12 bg-white/30"></div>
                <div className="text-center">
                  <div className="text-3xl font-black text-white">{usage.limit}</div>
                  <div className="text-white/80 text-sm">Monthly Limit</div>
                </div>
                {!usage.is_premium && (
                  <>
                    <div className="w-px h-12 bg-white/30"></div>
                    <button
                      className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-3 rounded-full font-bold transition-all"
                    >
                      <Crown className="w-5 h-5" />
                      <span>Upgrade - $2.99/mo</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mode Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
            <button
              onClick={() => setMode('write')}
              className={`px-8 py-3 rounded-full font-semibold transition-all flex items-center space-x-2 ${
                mode === 'write'
                  ? 'bg-gradient-to-r from-ember to-ember-light text-white'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Write Story</span>
            </button>
            <button
              onClick={() => setMode('ai_generate')}
              className={`px-8 py-3 rounded-full font-semibold transition-all flex items-center space-x-2 ${
                mode === 'ai_generate'
                  ? 'bg-gradient-to-r from-ember to-ember-light text-white'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Wand2 className="w-5 h-5" />
              <span>AI Generate</span>
            </button>
          </div>
        </div>
        
        {/* Creator Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Left: Story Input */}
          <div className={`rounded-3xl shadow-xl p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {mode === 'write' ? (
              <>
                <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  ✍️ Write Your Story
                </h2>
                
                <input
                  type="text"
                  placeholder="Story Title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl mb-4 ${
                    darkMode 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  } border focus:ring-2 focus:ring-purple-500 outline-none`}
                />
                
                <textarea
                  placeholder="Once upon a time..."
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  rows={12}
                  className={`w-full px-4 py-3 rounded-xl mb-4 ${
                    darkMode 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  } border focus:ring-2 focus:ring-purple-500 outline-none resize-none`}
                />
                
                {/* Music Genre Selector */}
                <div className="mb-4">
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    🎵 Background Music
                  </label>
                  <select
                    value={musicGenre}
                    onChange={(e) => setMusicGenre(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-gray-50 border-gray-200'
                    } border focus:ring-2 focus:ring-purple-500 outline-none`}
                  >
                    {musicGenres.map(genre => (
                      <option key={genre.id} value={genre.id}>
                        {genre.icon} {genre.name} - {genre.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Kids Mode Toggle */}
                <div className="mb-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kidsMode}
                      onChange={(e) => setKidsMode(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-ember focus:ring-purple-500"
                    />
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      👶 Kids Mode (Extra Safe & Cute!)
                    </span>
                  </label>
                  {kidsMode && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2 ml-8">
                      ✅ Kid-friendly filtering + Cartoon style images!
                    </p>
                  )}
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-sm ${
                    isOverLimit ? 'text-red-500' : darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {wordCount} / 2000 words {wordCount < 50 && '(min 50)'}
                  </span>
                </div>
                
                <button
                  onClick={createMovie}
                  disabled={loading || wordCount < 50 || isOverLimit || !usage || usage.remaining === 0}
                  className="w-full bg-gradient-to-r from-ember to-ember-light text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Film className="w-5 h-5" />
                      <span>Create Movie</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🪄 AI Story Generator
                </h2>
                
                <input
                  type="text"
                  placeholder="Story Title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl mb-4 ${
                    darkMode 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  } border focus:ring-2 focus:ring-purple-500 outline-none`}
                />
                
                <textarea
                  placeholder="Describe your story... e.g., 'A brave knight saves a dragon from hunters'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={6}
                  className={`w-full px-4 py-3 rounded-xl mb-4 ${
                    darkMode 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  } border focus:ring-2 focus:ring-purple-500 outline-none resize-none`}
                />
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Tip:</strong> Be specific! Include characters, setting, and what happens.
                  </p>
                </div>
                
                {/* Music Genre Selector */}
                <div className="mb-4">
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    🎵 Background Music
                  </label>
                  <select
                    value={musicGenre}
                    onChange={(e) => setMusicGenre(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-gray-50 border-gray-200'
                    } border focus:ring-2 focus:ring-purple-500 outline-none`}
                  >
                    {musicGenres.map(genre => (
                      <option key={genre.id} value={genre.id}>
                        {genre.icon} {genre.name} - {genre.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={generateStory}
                  disabled={generating || !aiPrompt.trim() || !usage || usage.remaining === 0}
                  className="w-full bg-gradient-to-r from-ember to-ember-light text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {generating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      <span>Generate Movie</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
          
          {/* Right: Info & Result */}
          <div className="space-y-6">
            {/* Safety Notice */}
            <div className={`rounded-3xl shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    🛡️ AI Content Moderation
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    All stories are automatically checked for safety. We reject content containing violence, sexual material, hate speech, or copyrighted characters.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Result */}
            {result && (
              <div className={`rounded-3xl shadow-xl p-6 ${
                result.moderation_passed
                  ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                  : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500'
              }`}>
                <div className="flex items-start space-x-3">
                  {result.moderation_passed ? (
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className={`font-bold mb-2 ${
                      result.moderation_passed ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                    }`}>
                      {result.moderation_passed ? '✅ Approved!' : '❌ Rejected'}
                    </h3>
                    <p className={`text-sm ${
                      result.moderation_passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Features */}
            <div className={`rounded-3xl shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ⭐ What You Get:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    4-8 cinematic scenes
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    AI voice narration
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    Epic background music 🎵
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    HD video export
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* My Movies */}
        <div className={`rounded-3xl shadow-xl p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            🎬 My Movies
          </h2>
          
          {loadingMovies ? (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 animate-spin mx-auto text-ember" />
            </div>
          ) : movies.length === 0 ? (
            <div className="text-center py-12">
              <Film className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                No movies yet. Create your first story movie above!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {movies.map((movie) => (
                <div
                  key={movie.story_id}
                  className={`rounded-xl p-6 border-2 ${
                    movie.status === 'completed'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : movie.status === 'processing'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {movie.title}
                    </h3>
                    {movie.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {movie.status === 'processing' && (
                      <Clock className="w-5 h-5 text-yellow-600 animate-spin" />
                    )}
                    {movie.status === 'rejected' && (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  
                  <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {movie.story_text?.substring(0, 100)}...
                  </p>
                  
                  {movie.status === 'processing' && movie.progress && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {movie.progress}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full transition-all"
                          style={{ 
                            width: movie.progress?.includes('%') 
                              ? movie.progress.match(/\d+/)?.[0] + '%' 
                              : '50%'
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    {movie.status === 'completed' && (
                      <>
                        <button 
                          onClick={() => {
                            // Open video in modal or new tab
                            window.open(`${API}/story-empire/video/${movie.story_id}`, '_blank');
                          }}
                          className="flex-1 bg-ember text-white py-2 rounded-lg font-medium flex items-center justify-center space-x-1 hover:bg-ember-light"
                        >
                          <Play className="w-4 h-4" />
                          <span>Watch</span>
                        </button>
                        <button 
                          onClick={() => downloadVideo(movie.story_id, movie.title)}
                          className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-medium flex items-center justify-center space-x-1 hover:bg-gray-700"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      </>
                    )}
                    {movie.status === 'processing' && (
                      <button className="w-full bg-yellow-600 text-white py-2 rounded-lg font-medium flex items-center justify-center space-x-2">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </button>
                    )}
                    {movie.status === 'rejected' && (
                      <button className="w-full bg-red-600 text-white py-2 rounded-lg font-medium">
                        Rejected
                      </button>
                    )}
                    {movie.status === 'failed' && (
                      <button className="w-full bg-red-600 text-white py-2 rounded-lg font-medium">
                        Failed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default StoryEmpirePage;