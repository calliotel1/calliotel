import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Hash } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import BottomNav from '../components/BottomNav';
import ChannelCard from '../components/ChannelCard';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChannelsPage = () => {
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' or 'joined'
  const [channels, setChannels] = useState([]);
  const [myChannels, setMyChannels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchDiscoverChannels();
    } else {
      fetchMyChannels();
    }
  }, [activeTab]);

  const fetchDiscoverChannels = async () => {
    try {
      setLoading(true);
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/channels/discover?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChannels(response.data);
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

  const fetchMyChannels = async () => {
    try {
      setLoading(true);
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/channels/my-channels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyChannels(response.data);
    } catch (error) {
      console.error('Error fetching my channels:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your channels',
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
        ch.channel_id === channelId
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

      // Update UI
      if (activeTab === 'discover') {
        setChannels(prev => prev.map(ch => 
          ch.channel_id === channelId
            ? { ...ch, is_member: false, member_count: ch.member_count - 1 }
            : ch
        ));
      } else {
        setMyChannels(prev => prev.filter(ch => ch.channel_id !== channelId));
      }

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

  const displayedChannels = activeTab === 'discover' ? channels : myChannels;
  const filteredChannels = displayedChannels.filter(ch =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ch.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center">
                <Hash className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Channels</h1>
                <p className="text-sm text-gray-600">Discover communities</p>
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

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === 'discover'
                  ? 'bg-white text-ember shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === 'joined'
                  ? 'bg-white text-ember shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Channels ({myChannels.length})
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember"></div>
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="text-center py-12">
            <Hash className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery ? 'No channels found' : activeTab === 'discover' ? 'No channels available' : 'No channels joined yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'discover'
                ? 'Be the first to create a channel!'
                : 'Browse channels and join communities'}
            </p>
            <button
              onClick={() => activeTab === 'discover' ? navigate('/channels/create') : setActiveTab('discover')}
              className="px-6 py-3 bg-gradient-to-r from-ember to-ember-light text-white rounded-lg hover:from-ember hover:to-ember-light transition-all font-semibold"
            >
              {activeTab === 'discover' ? 'Create Channel' : 'Discover Channels'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChannels.map((channel) => (
              <ChannelCard
                key={channel.channel_id}
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

export default ChannelsPage;
