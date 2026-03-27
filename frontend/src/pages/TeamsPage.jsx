import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Settings, Crown, Shield, Eye, UserPlus, 
  Phone, MessageSquare, TrendingUp, BarChart3, Trash2, LogOut
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [sharedNumbers, setSharedNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamDetails();
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/teams/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTeams(response.data.teams || []);
      if (response.data.teams && response.data.teams.length > 0) {
        setSelectedTeam(response.data.teams[0]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teams',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamDetails = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [membersRes, analyticsRes, numbersRes] = await Promise.all([
        axios.get(`${API}/teams/${selectedTeam.id}/members`, { headers }),
        axios.get(`${API}/teams/${selectedTeam.id}/analytics`, { headers }),
        axios.get(`${API}/teams/${selectedTeam.id}/numbers`, { headers })
      ]);

      setMembers(membersRes.data.members || []);
      setAnalytics(analyticsRes.data);
      setSharedNumbers(numbersRes.data.numbers || []);
    } catch (error) {
      console.error('Error fetching team details:', error);
    }
  };

  const createTeam = async (name, description) => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/teams/create`,
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Success',
        description: 'Team created successfully'
      });

      await fetchTeams();
      setShowCreateModal(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create team',
        variant: 'destructive'
      });
    }
  };

  const inviteMember = async (email, role) => {
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(
        `${API}/teams/${selectedTeam.id}/invite`,
        { email, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Success',
        description: `${email} invited to team`
      });

      await fetchTeamDetails();
      setShowInviteModal(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to invite member',
        variant: 'destructive'
      });
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm('Remove this member from the team?')) return;

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.delete(
        `${API}/teams/${selectedTeam.id}/members/${memberId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Success',
        description: 'Member removed'
      });

      await fetchTeamDetails();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive'
      });
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'member':
        return <Shield className="w-4 h-4 text-ember" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'member':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center pb-24`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-ember mx-auto mb-4"></div>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-ember/5 to-ember-light/5'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white'} shadow-sm sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Teams
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Collaborate with your team
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-ember text-white rounded-lg hover:bg-ember-light transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Team</span>
            </button>
          </div>

          {/* Team Selector */}
          {teams.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedTeam?.id === team.id
                      ? 'bg-ember text-white shadow-md'
                      : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {teams.length === 0 ? (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-12 text-center shadow-sm border`}>
            <Users className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              No teams yet
            </h3>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Create your first team to start collaborating
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-ember text-white rounded-lg hover:bg-ember-light transition-colors"
            >
              Create Team
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Analytics */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-sm border`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Members</p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analytics.member_count}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-sm border`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Messages</p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analytics.total_messages}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-sm border`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shared Numbers</p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analytics.shared_numbers}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-sm border`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Stories</p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analytics.total_stories}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Members Section */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-sm border`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Team Members ({members.length})
                </h2>
                {selectedTeam?.user_role === 'admin' && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-ember text-white rounded-lg hover:bg-ember-light transition-colors"
                  >
                    <UserPlus size={18} />
                    Invite
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center text-white font-bold">
                        {member.user_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {member.user_name}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {member.user_email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getRoleBadgeColor(member.role)}`}>
                        {getRoleIcon(member.role)}
                        {member.role}
                      </span>
                      {selectedTeam?.user_role === 'admin' && member.user_id !== user.id && (
                        <button
                          onClick={() => removeMember(member.id)}
                          className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shared Numbers */}
            {sharedNumbers.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-sm border`}>
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Shared Phone Numbers ({sharedNumbers.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sharedNumbers.map((number) => (
                    <div
                      key={number.id}
                      className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Phone className={`w-8 h-8 ${darkMode ? 'text-ember' : 'text-ember'}`} />
                        <div>
                          <p className={`font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {number.phone_number}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {number.country_code}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createTeam}
          darkMode={darkMode}
        />
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onInvite={inviteMember}
          darkMode={darkMode}
        />
      )}

      <BottomNav />
    </div>
  );
};

// Create Team Modal Component
const CreateTeamModal = ({ onClose, onCreate, darkMode }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 max-w-md w-full shadow-2xl`}>
        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Create New Team
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Team Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="My Awesome Team"
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
              rows="3"
              placeholder="What's this team about?"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-ember text-white rounded-lg hover:bg-ember-light font-medium transition-colors"
            >
              Create Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Invite Member Modal Component  
const InviteMemberModal = ({ onClose, onInvite, darkMode }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      onInvite(email.trim(), role);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 max-w-md w-full shadow-2xl`}>
        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Invite Team Member
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="colleague@example.com"
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="admin">Admin - Full access</option>
              <option value="member">Member - Can invite & use resources</option>
              <option value="viewer">Viewer - Read-only access</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-ember text-white rounded-lg hover:bg-ember-light font-medium transition-colors"
            >
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamsPage;