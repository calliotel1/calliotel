import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Hash, TrendingUp, Filter, Grid, List,
  Users, Flame, Clock, ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import BottomNav from '../components/BottomNav';
import ChannelCard from '../components/ChannelCard';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChannelDiscoveryPage = () => {
  const [view, setView] = useState('discover'); // discover, trending, categories
  const [channels, setChannels] = useState([]);
  const [trendingChannels, setTrendingChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular'); // popular, recent, members
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchTrending();
  }, []);

  useEffect(() => {
    if (view === 'discover') {
      fetchDiscoverChannels();
    }
  }, [view, selectedCategory, sortBy, searchQuery]);

  const fetchCategories = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/channels/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTrending = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/channels/trending?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrendingChannels(response.data.trending || []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const fetchDiscoverChannels = async () => {
    try {
      setLoading(true);
      const token = safeLocalStorage.getItem('token');
      
      let url = `${API}/channels/discover?limit=50&sort_by=${sortBy}`;
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setChannels(response.data.channels || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast({
        title: 'Error',
        description: 'Failed to load channels',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (channelId) => {
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(`${API}/channels/${channelId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update UI
      setChannels(prev => prev.map(ch => 
        ch.id === channelId
          ? { ...ch, is_member: true, member_count: ch.member_count + 1 }
          : ch
      ));

      setTrendingChannels(prev => prev.map(ch =>
        ch.id === channelId
          ? { ...ch, is_member: true, member_count: ch.member_count + 1 }
          : ch
      ));

      toast({
        title: 'Success',
        description: 'Joined channel successfully!'
      });
    } catch (error) {
      console.error('Error joining channel:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to join channel',
        variant: 'destructive'
      });
    }
  };

  const handleLeave = async (channelId) => {
    if (!window.confirm('Are you sure you want to leave this channel?')) return;

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(`${API}/channels/${channelId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setChannels(prev => prev.map(ch => 
        ch.id === channelId
          ? { ...ch, is_member: false, member_count: ch.member_count - 1 }
          : ch
      ));

      toast({
        title: 'Success',
        description: 'Left channel successfully'
      });
    } catch (error) {
      console.error('Error leaving channel:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to leave channel',
        variant: 'destructive'
      });
    }
  };

  const displayedChannels = view === 'trending' ? trendingChannels : channels;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pb-24`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm sticky top-0 z-10 border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/channels')}
                className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center">
                <Hash className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Discover Channels
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Find your community
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/channels/create')}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-ember to-ember-light text-white rounded-lg hover:from-ember hover:to-ember-light transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline font-semibold">Create</span>
            </button>
          </div>

          {/* View Tabs */}
          <div className={`flex space-x-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-1 mb-4`}>
            <button
              onClick={() => setView('discover')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                view === 'discover'
                  ? darkMode 
                    ? 'bg-gray-800 text-ember shadow-sm'
                    : 'bg-white text-ember shadow-sm'
                  : darkMode
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Search className="w-4 h-4" />
              Discover
            </button>
            <button
              onClick={() => setView('trending')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                view === 'trending'
                  ? darkMode 
                    ? 'bg-gray-800 text-ember shadow-sm'
                    : 'bg-white text-ember shadow-sm'
                  : darkMode
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Flame className="w-4 h-4" />
              Trending
            </button>
          </div>

          {/* Search & Filters */}
          {view === 'discover' && (
            <>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search channels..."
                  className={`w-full pl-10 pr-4 py-2 border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900'
                  } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === null
                        ? 'bg-gradient-to-r from-ember to-ember-light text-white'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        selectedCategory === cat.name
                          ? 'bg-gradient-to-r from-ember to-ember-light text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {cat.name} ({cat.count})
                    </button>
                  ))}
                </div>
              )}

              {/* Sort & View Toggle */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy('popular')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      sortBy === 'popular'
                        ? 'bg-ember/10 text-ember'
                        : darkMode
                          ? 'text-gray-400 hover:bg-gray-700'
                          : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Popular
                  </button>
                  <button
                    onClick={() => setSortBy('recent')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      sortBy === 'recent'
                        ? 'bg-ember/10 text-ember'
                        : darkMode
                          ? 'text-gray-400 hover:bg-gray-700'
                          : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Recent
                  </button>
                  <button
                    onClick={() => setSortBy('members')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      sortBy === 'members'
                        ? 'bg-ember/10 text-ember'
                        : darkMode
                          ? 'text-gray-400 hover:bg-gray-700'
                          : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Members
                  </button>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-ember/10 text-ember'
                        : darkMode
                          ? 'text-gray-400 hover:bg-gray-700'
                          : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'list'
                        ? 'bg-ember/10 text-ember'
                        : darkMode
                          ? 'text-gray-400 hover:bg-gray-700'
                          : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember"></div>
          </div>
        ) : displayedChannels.length === 0 ? (
          <div className="text-center py-12">
            <Hash className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              No channels found
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Be the first to create a channel in this category!
            </p>
            <button
              onClick={() => navigate('/channels/create')}
              className="px-6 py-3 bg-gradient-to-r from-ember to-ember-light text-white rounded-lg hover:from-ember hover:to-ember-light transition-all font-semibold"
            >
              Create Channel
            </button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }>
            {displayedChannels.map((channel) => (
              <ChannelCard
                key={channel.id || channel.channel_id}
                channel={channel}
                onJoin={handleJoin}
                onLeave={handleLeave}
                onNavigate={(id) => navigate(`/channels/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ChannelDiscoveryPage;
