import React, { useState, useEffect, useRef } from 'react';
import { 
  Voicemail, Play, Pause, Trash2, Download, Phone, 
  Settings, Mic, Upload, Check, X, Search, Filter,
  Clock, User, FileText, Volume2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VoicemailPage = () => {
  const [voicemails, setVoicemails] = useState([]);
  const [greetings, setGreetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, unread, read
  const [searchQuery, setSearchQuery] = useState('');
  const [showGreetingModal, setShowGreetingModal] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox'); // inbox, greetings
  
  const audioRef = useRef(null);
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    fetchVoicemails();
    fetchGreetings();
  }, []);

  const fetchVoicemails = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/voicemail/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setVoicemails(response.data.voicemails || []);
    } catch (error) {
      console.error('Error fetching voicemails:', error);
      toast({
        title: 'Error',
        description: 'Failed to load voicemails',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGreetings = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/voicemail/greetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGreetings(response.data.greetings || []);
    } catch (error) {
      console.error('Error fetching greetings:', error);
    }
  };

  const playVoicemail = async (voicemail) => {
    try {
      if (playingId === voicemail.id) {
        // Pause
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setPlayingId(null);
      } else {
        // Play new
        if (audioRef.current) {
          audioRef.current.src = `${BACKEND_URL}${voicemail.audio_url}`;
          audioRef.current.play();
          setPlayingId(voicemail.id);

          // Mark as read
          if (!voicemail.is_read) {
            await markAsRead(voicemail.id);
          }
        }
      }
    } catch (error) {
      console.error('Error playing voicemail:', error);
      toast({
        title: 'Error',
        description: 'Failed to play voicemail',
        variant: 'destructive'
      });
    }
  };

  const markAsRead = async (voicemailId) => {
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(
        `${API}/voicemail/${voicemailId}/mark-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setVoicemails(voicemails.map(vm => 
        vm.id === voicemailId ? { ...vm, is_read: true } : vm
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteVoicemail = async (voicemailId) => {
    if (!window.confirm('Delete this voicemail?')) return;

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.delete(`${API}/voicemail/${voicemailId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setVoicemails(voicemails.filter(vm => vm.id !== voicemailId));

      toast({
        title: 'Success',
        description: 'Voicemail deleted'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete voicemail',
        variant: 'destructive'
      });
    }
  };

  const downloadVoicemail = (voicemail) => {
    const link = document.createElement('a');
    link.href = `${BACKEND_URL}${voicemail.audio_url}`;
    link.download = `voicemail-${voicemail.id}.mp3`;
    link.click();
  };

  const activateGreeting = async (greetingId) => {
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(
        `${API}/voicemail/greetings/${greetingId}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Success',
        description: 'Greeting activated'
      });

      await fetchGreetings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to activate greeting',
        variant: 'destructive'
      });
    }
  };

  const deleteGreeting = async (greetingId) => {
    if (!window.confirm('Delete this greeting?')) return;

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.delete(`${API}/voicemail/greetings/${greetingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: 'Success',
        description: 'Greeting deleted'
      });

      await fetchGreetings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete greeting',
        variant: 'destructive'
      });
    }
  };

  const filteredVoicemails = voicemails
    .filter(vm => {
      if (filterStatus === 'unread') return !vm.is_read;
      if (filterStatus === 'read') return vm.is_read;
      return true;
    })
    .filter(vm => {
      if (!searchQuery) return true;
      return (
        vm.caller_number?.includes(searchQuery) ||
        vm.transcription?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  const unreadCount = voicemails.filter(vm => !vm.is_read).length;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center pb-24`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-ember mx-auto mb-4"></div>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading voicemails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 to-ember-light/5'}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        onPause={() => setPlayingId(null)}
      />

      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white'} shadow-sm sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center shadow-lg">
                <Voicemail className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Voicemail
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'inbox'
                  ? 'bg-ember text-white shadow-md'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}>
              <span className="flex items-center gap-2">
                <Voicemail size={18} />
                Inbox ({voicemails.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('greetings')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'greetings'
                  ? 'bg-ember text-white shadow-md'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Settings size={18} />
                Greetings ({greetings.length})
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'inbox' ? (
          <div>
            {/* Filters & Search */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-4 mb-6 shadow-sm border`}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by number or transcription..."
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'unread', 'read'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                        filterStatus === status
                          ? 'bg-ember text-white'
                          : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Voicemail List */}
            {filteredVoicemails.length === 0 ? (
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-12 text-center shadow-sm border`}>
                <Voicemail className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {searchQuery || filterStatus !== 'all' ? 'No voicemails found' : 'No voicemails yet'}
                </h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {searchQuery ? 'Try a different search' : 'Voicemails will appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVoicemails.map((voicemail) => (
                  <div
                    key={voicemail.id}
                    className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-sm hover:shadow-md transition-all border ${
                      !voicemail.is_read ? 'border-l-4 border-l-purple-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Play Button */}
                        <button
                          onClick={() => playVoicemail(voicemail)}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                            playingId === voicemail.id
                              ? 'bg-ember hover:bg-ember-light'
                              : 'bg-gradient-to-br from-ember to-ember-light hover:from-ember hover:to-indigo-700'
                          } shadow-lg`}
                        >
                          {playingId === voicemail.id ? (
                            <Pause className="w-6 h-6 text-white" />
                          ) : (
                            <Play className="w-6 h-6 text-white ml-1" />
                          )}
                        </button>

                        {/* Voicemail Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <Phone className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              <span className={`font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {voicemail.caller_number || 'Unknown'}
                              </span>
                            </div>
                            {!voicemail.is_read && (
                              <span className="px-2 py-1 bg-ember/10 dark:bg-olive text-ember-dark dark:text-ember text-xs font-medium rounded-full">
                                New
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm mb-3">
                            <div className="flex items-center gap-1">
                              <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                                {formatDate(voicemail.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Volume2 className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                                {formatDuration(voicemail.duration || 0)}
                              </span>
                            </div>
                          </div>

                          {/* Transcription */}
                          {voicemail.transcription && (
                            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className={`w-4 h-4 ${darkMode ? 'text-ember' : 'text-ember'}`} />
                                <span className={`text-sm font-medium ${darkMode ? 'text-ember' : 'text-ember'}`}>
                                  Transcription
                                </span>
                              </div>
                              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {voicemail.transcription}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadVoicemail(voicemail)}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                          title="Download"
                        >
                          <Download className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        </button>
                        <button
                          onClick={() => deleteVoicemail(voicemail.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Greetings Section */}
            <div className="mb-6">
              <button
                onClick={() => setShowGreetingModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-ember text-white rounded-lg hover:bg-ember-light transition-colors flex items-center gap-2 justify-center shadow-sm"
              >
                <Plus size={20} />
                Create New Greeting
              </button>
            </div>

            {greetings.length === 0 ? (
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-12 text-center shadow-sm border`}>
                <Mic className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  No greetings yet
                </h3>
                <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Create a custom voicemail greeting
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {greetings.map((greeting) => (
                  <div
                    key={greeting.id}
                    className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border ${
                      greeting.is_active ? 'border-2 border-ember' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {greeting.name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {greeting.type}
                        </span>
                      </div>
                      {greeting.is_active && (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs font-medium rounded-full flex items-center gap-1">
                          <Check size={14} />
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {!greeting.is_active && (
                        <button
                          onClick={() => activateGreeting(greeting.id)}
                          className="flex-1 px-4 py-2 bg-ember text-white rounded-lg hover:bg-ember-light transition-colors font-medium"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => deleteGreeting(greeting.id)}
                        className={`${greeting.is_active ? 'flex-1' : ''} px-4 py-2 rounded-lg font-medium transition-colors ${
                          darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default VoicemailPage;
