import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Clock, TrendingUp, Calendar, ArrowLeft, 
  Send, CheckCircle, XCircle, Award, Star, Target, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DailyChallengePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' or 'monthly'
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  useEffect(() => {
    // Update countdown timer every second
    const timer = setInterval(() => {
      if (challenge) {
        updateCountdown();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch current challenge
      const challengeRes = await fetch(`${API_URL}/api/challenges/current`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const challengeData = await challengeRes.json();
      setChallenge(challengeData.challenge);
      
      // Fetch leaderboard
      const leaderboardRes = await fetch(`${API_URL}/api/challenges/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const leaderboardData = await leaderboardRes.json();
      setLeaderboard(leaderboardData.leaderboard || []);
      
      // Fetch monthly leaderboard
      const monthlyRes = await fetch(`${API_URL}/api/challenges/leaderboard/monthly`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const monthlyData = await monthlyRes.json();
      setMonthlyLeaderboard(monthlyData.leaderboard || []);
      
      // Fetch my stats
      const statsRes = await fetch(`${API_URL}/api/challenges/my-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      setMyStats(statsData);
      
    } catch (error) {
      console.error('Error fetching challenge data:', error);
      toast.error('Failed to load challenge');
    } finally {
      setLoading(false);
    }
  };

  const updateCountdown = () => {
    if (!challenge) return;
    
    const now = new Date();
    const expiry = new Date(challenge.expires_at);
    const diff = expiry - now;
    
    if (diff <= 0) {
      setTimeLeft('Challenge expired - Refreshing...');
      setTimeout(fetchData, 2000);
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      toast.error('Please enter an answer');
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/challenges/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          challenge_id: challenge.id,
          answer: answer
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.is_correct) {
          let message = data.message;
          if (data.streak_bonus) {
            message += ` 🔥 +${data.streak_bonus} streak bonus!`;
          }
          if (data.cash_reward) {
            message += ` 💰 +$${data.cash_reward} bonus reward!`;
          }
          toast.success(message, {
            icon: '🎉',
            duration: 6000
          });
        } else {
          toast.error(data.message);
        }
        
        // Refresh data
        fetchData();
        setAnswer('');
      } else {
        toast.error(data.detail || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ember mx-auto mb-4"></div>
          <p className="text-white">Loading challenge...</p>
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
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="mb-4 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center">
                <Trophy className="w-10 h-10 mr-3 text-yellow-400" />
                Daily Challenge
              </h1>
              <p className="text-gray-400 mt-2">
                Answer correctly for a chance to win <span className="text-green-400 font-bold">$2</span> every week!
              </p>
            </div>
            <Button
              onClick={() => navigate('/team-challenge')}
              className="bg-gradient-to-r from-ember to-ember-light hover:from-ember-dark hover:to-ember-light"
            >
              <Users className="w-5 h-5 mr-2" />
              Team Challenges
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Challenge Card */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-ember-dark/50 to-blue-900/50 border-ember/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-white flex items-center">
                    <Target className="w-6 h-6 mr-2 text-ember" />
                    {challenge?.title}
                  </CardTitle>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">{timeLeft}</span>
                  </div>
                </div>
                <CardDescription className="text-gray-300 mt-2">
                  {challenge?.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {challenge?.user_attempted ? (
                  <div className="py-12 text-center">
                    {challenge.user_correct ? (
                      <>
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                        <h3 className="text-2xl font-bold text-green-400 mb-2">
                          Correct! 🎉
                        </h3>
                        <p className="text-gray-300 mb-4">
                          You've completed today's challenge!
                        </p>
                        <p className="text-sm text-ember">
                          Come back tomorrow for a new challenge
                        </p>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                        <h3 className="text-2xl font-bold text-red-400 mb-2">
                          Not quite right
                        </h3>
                        <p className="text-gray-300 mb-4">
                          You've already attempted today's challenge
                        </p>
                        <p className="text-sm text-ember">
                          Try again tomorrow!
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Challenge Question */}
                    <div className="bg-gray-800/50 p-6 rounded-lg mb-6">
                      <h3 className="text-xl font-semibold text-white mb-4">
                        {challenge?.question}
                      </h3>
                      
                      {/* Answer Form */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {challenge?.challenge_type === 'multiple_choice' ? (
                          <div className="space-y-3">
                            {challenge?.options?.map((option, index) => (
                              <label
                                key={index}
                                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  answer === option
                                    ? 'border-ember bg-olive/30'
                                    : 'border-gray-700 bg-gray-700/30 hover:border-ember'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="answer"
                                  value={option}
                                  checked={answer === option}
                                  onChange={(e) => setAnswer(e.target.value)}
                                  className="mr-3 w-4 h-4"
                                />
                                <span className="text-white">{option}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <Input
                            type="text"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Enter your answer..."
                            className="bg-gray-700 border-gray-600 text-white text-lg"
                            required
                          />
                        )}
                        
                        <Button
                          type="submit"
                          disabled={submitting || !answer}
                          className="w-full bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark text-white font-semibold py-3"
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-2" />
                              Submit Answer
                            </>
                          )}
                        </Button>
                      </form>
                    </div>
                    
                    {/* Challenge Info */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-olive/30 p-4 rounded-lg text-center">
                        <Star className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                        <p className="text-2xl font-bold text-white">{challenge?.points}</p>
                        <p className="text-xs text-gray-400">Points</p>
                      </div>
                      <div className="bg-blue-900/30 p-4 rounded-lg text-center">
                        <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                        <p className="text-2xl font-bold text-white capitalize">{challenge?.difficulty}</p>
                        <p className="text-xs text-gray-400">Difficulty</p>
                      </div>
                      <div className="bg-green-900/30 p-4 rounded-lg text-center">
                        <Award className="w-6 h-6 mx-auto mb-2 text-green-400" />
                        <p className="text-2xl font-bold text-white">$2</p>
                        <p className="text-xs text-gray-400">Weekly Prize</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* My Stats */}
            {myStats && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-ember" />
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Streak Section */}
                    {myStats.streak && myStats.streak.current > 0 && (
                      <>
                        <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 p-3 rounded-lg border border-orange-700">
                          <div className="flex items-center justify-between">
                            <span className="text-orange-300 text-sm font-semibold">🔥 Current Streak</span>
                            <span className="text-white text-2xl font-bold">{myStats.streak.current}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Longest: {myStats.streak.longest} days
                          </p>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-400 pb-2 border-b border-gray-700">
                          <span>Streak Bonuses</span>
                          <span className="text-yellow-400 font-bold">+{myStats.streak.total_bonus_points} pts</span>
                        </div>
                      </>
                    )}
                    
                    <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                      <span className="text-gray-400">This Week</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Correct Answers</span>
                      <span className="text-green-400 font-bold">{myStats.this_week.correct}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Points</span>
                      <span className="text-ember font-bold">{myStats.this_week.points}</span>
                    </div>
                    
                    {/* Monthly Stats */}
                    <div className="flex justify-between items-center pt-2 pb-2 border-t border-gray-700">
                      <span className="text-gray-400">This Month</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Correct Answers</span>
                      <span className="text-green-400 font-bold">{myStats.this_month.correct}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Points</span>
                      <span className="text-ember font-bold">{myStats.this_month.points}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                      <span className="text-gray-400">All Time</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Wins</span>
                      <span className="text-yellow-400 font-bold">{myStats.all_time.wins}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-yellow-400" />
                    Leaderboard
                  </CardTitle>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('weekly')}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                        viewMode === 'weekly' 
                          ? 'bg-ember text-white' 
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => setViewMode('monthly')}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                        viewMode === 'monthly' 
                          ? 'bg-yellow-600 text-white' 
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
                <CardDescription className="text-gray-400">
                  {viewMode === 'weekly' 
                    ? 'Top performers this week' 
                    : '🏆 Top performers this month - Win $10!'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(viewMode === 'weekly' ? leaderboard : monthlyLeaderboard).length === 0 ? (
                  <p className="text-center text-gray-400 py-4">No entries yet</p>
                ) : (
                  <div className="space-y-2">
                    {(viewMode === 'weekly' ? leaderboard : monthlyLeaderboard).slice(0, 10).map((entry, index) => (
                      <div
                        key={entry.user_id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          index === 0 ? 'bg-yellow-900/30 border border-yellow-700' :
                          index === 1 ? 'bg-gray-700/30 border border-gray-600' :
                          index === 2 ? 'bg-orange-900/30 border border-orange-700' :
                          'bg-gray-700/20'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`text-lg font-bold ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-400' :
                            index === 2 ? 'text-orange-400' :
                            'text-gray-500'
                          }`}>
                            #{entry.rank}
                          </span>
                          <div>
                            <span className="text-white text-sm truncate max-w-[120px] block">
                              {entry.user_name}
                            </span>
                            {viewMode === 'monthly' && entry.badge && (
                              <span className="text-xs text-yellow-400">{entry.badge}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${viewMode === 'monthly' ? 'text-ember' : 'text-green-400'}`}>
                            {viewMode === 'monthly' ? entry.total_points : entry.correct_answers}
                          </p>
                          <p className="text-xs text-gray-400">
                            {viewMode === 'monthly' ? 'points' : 'correct'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">
                  📋 How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• New challenge every day at midnight UTC</li>
                  <li>• Answer correctly to enter the weekly draw</li>
                  <li>• <span className="text-green-400 font-bold">Weekly Prize: $2</span> (announced Sunday)</li>
                  <li>• <span className="text-yellow-400 font-bold">Monthly Prize: $10</span> for #1</li>
                  <li className="pt-2 border-t border-gray-700">🔥 <strong>Streak Bonuses:</strong></li>
                  <li>  - 3 days: +5 bonus points</li>
                  <li>  - 7 days: +20 points + <span className="text-green-400">$0.50</span></li>
                  <li>  - 30 days: +100 points + <span className="text-green-400">$5.00!</span></li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyChallengePage;
