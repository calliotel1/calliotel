import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Trophy, Plus, LogIn, LogOut, Crown, 
  Copy, Check, Trash2, ArrowLeft, Award, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TeamChallengePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState(null);
  const [teamLeaderboard, setTeamLeaderboard] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch my team
      const teamRes = await fetch(`${API_URL}/api/challenges/teams/my-team`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const teamData = await teamRes.json();
      setMyTeam(teamData.team);
      
      // Fetch team leaderboard
      const leaderboardRes = await fetch(`${API_URL}/api/challenges/teams/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const leaderboardData = await leaderboardRes.json();
      setTeamLeaderboard(leaderboardData.leaderboard || []);
      
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/challenges/teams/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          team_name: teamName,
          team_description: teamDescription
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        setShowCreateModal(false);
        setTeamName('');
        setTeamDescription('');
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    
    if (!teamCode.trim()) {
      toast.error('Please enter a team code');
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/challenges/teams/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          team_code: teamCode.toUpperCase()
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        setShowJoinModal(false);
        setTeamCode('');
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to join team');
      }
    } catch (error) {
      console.error('Error joining team:', error);
      toast.error('Failed to join team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/challenges/teams/leave`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to leave team');
      }
    } catch (error) {
      console.error('Error leaving team:', error);
      toast.error('Failed to leave team');
    }
  };

  const handleKickMember = async (userId) => {
    if (!window.confirm('Are you sure you want to kick this member?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/challenges/teams/kick/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to kick member');
      }
    } catch (error) {
      console.error('Error kicking member:', error);
      toast.error('Failed to kick member');
    }
  };

  const copyTeamCode = () => {
    navigator.clipboard.writeText(myTeam.team_code);
    setCopied(true);
    toast.success('Team code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ember mx-auto mb-4"></div>
          <p className="text-white">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/daily-challenge')}
            variant="ghost"
            className="mb-4 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Challenges
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center">
                <Users className="w-10 h-10 mr-3 text-blue-400" />
                Team Challenges
              </h1>
              <p className="text-gray-400 mt-2">
                Join forces and compete as a team!
              </p>
            </div>
            {!myTeam && (
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Team
                </Button>
                <Button
                  onClick={() => setShowJoinModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Join Team
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Team */}
            {myTeam ? (
              <Card className="bg-gradient-to-br from-olive/40 to-ember/30 border-ember/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl text-white flex items-center">
                      <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
                      {myTeam.team_name}
                    </CardTitle>
                    <Button
                      onClick={handleLeaveTeam}
                      variant="destructive"
                      size="sm"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Leave
                    </Button>
                  </div>
                  {myTeam.team_description && (
                    <CardDescription className="text-gray-300">
                      {myTeam.team_description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Team Code */}
                  <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-400 mb-2">Team Code (share with friends):</p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-gray-900 px-4 py-2 rounded text-xl font-bold text-yellow-400 tracking-wider">
                        {myTeam.team_code}
                      </code>
                      <Button
                        onClick={copyTeamCode}
                        size="sm"
                        className="bg-ember hover:bg-ember-light"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-olive/30 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-white">{myTeam.member_count}/10</p>
                      <p className="text-xs text-gray-400">Members</p>
                    </div>
                    <div className="bg-green-900/30 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-white">{myTeam.this_week.total_correct}</p>
                      <p className="text-xs text-gray-400">Correct</p>
                    </div>
                    <div className="bg-yellow-900/30 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-white">{myTeam.this_week.total_points}</p>
                      <p className="text-xs text-gray-400">Points</p>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Team Members ({myTeam.member_count})
                    </h3>
                    <div className="space-y-2">
                      {myTeam.members.map((member, index) => (
                        <div
                          key={member.user_id}
                          className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              index === 0 ? 'bg-yellow-600' :
                              index === 1 ? 'bg-gray-600' :
                              index === 2 ? 'bg-orange-600' :
                              'bg-ember'
                            }`}>
                              <span className="text-white font-bold">
                                #{index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-semibold flex items-center">
                                {member.user_name}
                                {member.is_leader && (
                                  <Crown className="w-4 h-4 ml-2 text-yellow-400" />
                                )}
                              </p>
                              <p className="text-sm text-gray-400">
                                {member.points} points • {member.correct_answers} correct
                              </p>
                            </div>
                          </div>
                          {myTeam.leader_id === (user._id || user.email) && !member.is_leader && (
                            <Button
                              onClick={() => handleKickMember(member.user_id)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="py-16 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-bold text-white mb-2">No Team Yet</h3>
                  <p className="text-gray-400 mb-6">
                    Create a team or join an existing one to compete together!
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Team
                    </Button>
                    <Button
                      onClick={() => setShowJoinModal(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <LogIn className="w-5 h-5 mr-2" />
                      Join Team
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Leaderboard */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-yellow-400" />
                  Team Leaderboard
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Top teams this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamLeaderboard.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">No teams yet</p>
                ) : (
                  <div className="space-y-2">
                    {teamLeaderboard.slice(0, 10).map((team) => (
                      <div
                        key={team.team_id}
                        className={`p-3 rounded-lg ${
                          team.rank === 1 ? 'bg-yellow-900/30 border border-yellow-700' :
                          team.rank === 2 ? 'bg-gray-700/30 border border-gray-600' :
                          team.rank === 3 ? 'bg-orange-900/30 border border-orange-700' :
                          'bg-gray-700/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-lg font-bold ${
                              team.rank === 1 ? 'text-yellow-400' :
                              team.rank === 2 ? 'text-gray-400' :
                              team.rank === 3 ? 'text-orange-400' :
                              'text-gray-500'
                            }`}>
                              #{team.rank}
                            </span>
                            <span className="text-white font-semibold">{team.team_name}</span>
                          </div>
                          <Award className="w-5 h-5 text-ember" />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>{team.member_count} members</span>
                          <span className="text-ember font-bold">{team.total_points} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How Teams Work */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">
                  📋 How Teams Work
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Create or join a team (max 10 members)</li>
                  <li>• Team points = sum of all members' points</li>
                  <li>• Compete on the team leaderboard</li>
                  <li>• Team leader can manage members</li>
                  <li>• Share team code to invite friends</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-800 border-ember/30 max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-white">Create New Team</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team Name *
                  </label>
                  <Input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g., Code Warriors"
                    className="bg-gray-700 border-gray-600 text-white"
                    maxLength={30}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder="Tell others about your team..."
                    className="w-full min-h-[80px] px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    maxLength={200}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    variant="ghost"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark"
                  >
                    {submitting ? 'Creating...' : 'Create Team'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-800 border-green-700 max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-white">Join Team</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team Code
                  </label>
                  <Input
                    type="text"
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    className="bg-gray-700 border-gray-600 text-white text-lg tracking-wider"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Ask your team leader for the code
                  </p>
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    variant="ghost"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? 'Joining...' : 'Join Team'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TeamChallengePage;
