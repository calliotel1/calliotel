import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Timer, Trophy, Target, TrendingUp,
  Smartphone, Mail, Link as LinkIcon, X, CheckCircle, XCircle,
  Award, Zap
} from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';

const API = process.env.REACT_APP_BACKEND_URL;

const PhishFinderGame = () => {
  const navigate = useNavigate();
  
  // Game state
  const [gameState, setGameState] = useState('menu'); // menu, playing, result
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Timer
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerInterval, setTimerInterval] = useState(null);
  const [startTime, setStartTime] = useState(null);
  
  // Result
  const [result, setResult] = useState(null);
  
  // Stats
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
    fetchLeaderboard();
  }, []);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      return () => {
        if (timerInterval) clearInterval(timerInterval);
      };
    } else if (timeLeft === 0 && gameState === 'playing') {
      // Time's up - auto submit as wrong
      handleAnswer(false); // Default to "not phish" when time runs out
    }
  }, [timeLeft, gameState, timerInterval]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/game/phish-finder/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API}/api/game/phish-finder/leaderboard?limit=50`);
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const startGame = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API}/api/game/phish-finder/challenge`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setScenario(response.data);
      setTimeLeft(30);
      setStartTime(Date.now());
      setGameState('playing');
      
      // Start countdown
      const interval = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      setTimerInterval(interval);
      
      setLoading(false);
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Please try again.');
      setLoading(false);
    }
  };

  const handleAnswer = async (userAnswer) => {
    if (!scenario || gameState !== 'playing') return;
    
    // Stop timer
    clearInterval(timerInterval);
    
    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API}/api/game/phish-finder/submit`,
        {
          scenario_id: scenario.scenario_id,
          user_answer: userAnswer,
          time_taken: parseFloat(timeTaken)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResult(response.data);
      setGameState('result');
      
      // Celebrate if correct
      if (response.data.correct) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      // Refresh stats
      fetchStats();
      
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    }
  };

  const resetGame = () => {
    setGameState('menu');
    setScenario(null);
    setResult(null);
    setTimeLeft(30);
    clearInterval(timerInterval);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'SMS': return <Smartphone className="text-ember" size={24} />;
      case 'Email': return <Mail className="text-green-500" size={24} />;
      case 'URL': return <LinkIcon className="text-ember" size={24} />;
      default: return <Shield className="text-gray-500" size={24} />;
    }
  };

  // MENU STATE
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/gamification')}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Arcade</span>
            </button>
            
            <div className="flex items-center gap-3">
              <Shield className="text-ember" size={32} />
              <h1 className="text-3xl font-bold">Phish-Finder</h1>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Game Info */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Target className="text-ember" />
                Security Training
              </h2>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-ember/10 border border-ember/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Smartphone className="text-ember mt-1" size={20} />
                    <div>
                      <div className="font-bold text-blue-400 mb-1">Real-World Scenarios</div>
                      <div className="text-sm text-gray-400">
                        Identify phishing attempts in SMS, emails, and URLs
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Timer className="text-green-500 mt-1" size={20} />
                    <div>
                      <div className="font-bold text-green-400 mb-1">30-Second Timer</div>
                      <div className="text-sm text-gray-400">
                        Fast answers earn speed bonus XP (up to +60 XP)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-ember/10 border border-ember/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Award className="text-ember mt-1" size={20} />
                    <div>
                      <div className="font-bold text-ember mb-1">Learn from Mistakes</div>
                      <div className="text-sm text-gray-400">
                        Get detailed red flag analysis after each scenario
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={startGame}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-ember to-ember-light hover:from-ember-dark hover:to-cyan-700 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50"
              >
                {loading ? 'Loading...' : (
                  <>
                    <Shield size={24} />
                    Start Training
                  </>
                )}
              </button>
            </div>

            {/* Stats & Leaderboard */}
            <div className="space-y-6">
              {/* Personal Stats */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="text-yellow-500" />
                  Your Stats
                </h3>
                
                {loadingStats ? (
                  <div className="text-center text-gray-400">Loading...</div>
                ) : stats && stats.total_scenarios > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Scenarios:</span>
                      <span className="font-bold">{stats.total_scenarios}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Correct Answers:</span>
                      <span className="font-bold text-green-500">{stats.correct_answers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Accuracy:</span>
                      <span className="font-bold text-ember">{stats.accuracy_percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total XP Earned:</span>
                      <span className="font-bold text-yellow-500">{stats.total_xp_earned}</span>
                    </div>
                    
                    {stats.by_type && Object.keys(stats.by_type).length > 0 && (
                      <div className="pt-3 border-t border-gray-700">
                        <div className="text-sm text-gray-400 mb-2">Accuracy by Type:</div>
                        {Object.entries(stats.by_type).map(([type, data]) => (
                          <div key={type} className="flex justify-between text-sm">
                            <span className="text-gray-400">{type}:</span>
                            <span className="font-mono">{data.accuracy}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    No training completed yet. Start your first scenario!
                  </div>
                )}
              </div>

              {/* Leaderboard */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="text-ember" />
                  Top Security Experts
                </h3>
                
                {leaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-700/30 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-300' :
                            index === 2 ? 'text-orange-500' :
                            'text-gray-400'
                          }`}>
                            #{entry.rank}
                          </span>
                          <span className="text-sm truncate max-w-[120px]">
                            {entry.client_id || entry.email?.split('@')[0]}
                          </span>
                        </div>
                        <span className="font-mono text-sm text-blue-400">
                          {entry.accuracy_percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    No leaderboard data yet
                  </div>
                )}
                
                <div className="mt-4 text-xs text-gray-500 text-center">
                  Minimum 10 scenarios to qualify
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PLAYING STATE
  if (gameState === 'playing' && scenario) {
    const timePercentage = (timeLeft / 30) * 100;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Timer Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Time Remaining</span>
              <span className="text-xl font-mono font-bold">{timeLeft}s</span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  timeLeft > 20 ? 'bg-green-500' :
                  timeLeft > 10 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${timePercentage}%` }}
              />
            </div>
          </div>

          {/* Smartphone Mockup */}
          <div className="bg-gray-800 rounded-3xl p-4 shadow-2xl border-4 border-gray-700">
            {/* Phone Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
              <div className="flex items-center gap-2">
                {getTypeIcon(scenario.type)}
                <span className="font-bold">{scenario.type}</span>
              </div>
              <div className="text-xs text-gray-400">
                {new Date().toLocaleTimeString()}
              </div>
            </div>

            {/* Scenario Content */}
            <div className="bg-gray-900 rounded-xl p-4 min-h-[300px] mb-4">
              {/* Sender */}
              <div className="text-sm text-gray-400 mb-2">From: {scenario.sender}</div>
              
              {/* Content */}
              <div className="whitespace-pre-wrap text-gray-100 leading-relaxed">
                {scenario.content}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAnswer(false)}
                className="py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
              >
                <Shield size={20} />
                LEGIT
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
              >
                <Target size={20} />
                PHISH
              </button>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            Faster answers = More XP bonus!
          </div>
        </div>
      </div>
    );
  }

  // RESULT STATE
  if (gameState === 'result' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Result Header */}
          <div className="text-center mb-8">
            {result.correct ? (
              <>
                <CheckCircle className="mx-auto text-green-500 mb-4" size={80} />
                <h1 className="text-4xl font-bold text-green-500 mb-2">Correct!</h1>
                <p className="text-gray-400">{result.explanation}</p>
              </>
            ) : (
              <>
                <XCircle className="mx-auto text-red-500 mb-4" size={80} />
                <h1 className="text-4xl font-bold text-red-500 mb-2">Incorrect</h1>
                <p className="text-gray-400">{result.explanation}</p>
              </>
            )}
          </div>

          {/* XP Earned (if correct) */}
          {result.correct && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 mb-6 border border-gray-700 text-center">
              <div className="text-sm text-gray-400 mb-2">XP Earned</div>
              <div className="text-5xl font-bold text-yellow-500 mb-2">
                +{result.xp_earned} XP
              </div>
              {result.time_bonus > 0 && (
                <div className="text-sm text-blue-400">
                  Includes +{result.time_bonus} speed bonus!
                </div>
              )}
              <div className="text-sm text-gray-400 mt-4">
                Total XP: {result.xp_total}
              </div>
            </div>
          )}

          {/* Red Flag Analysis */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="text-yellow-500" />
              {result.is_phish ? 'Red Flags Detected' : 'Why This Was Legit'}
            </h3>
            
            {result.red_flags && result.red_flags.length > 0 ? (
              <div className="space-y-3">
                {result.red_flags.map((flag, index) => (
                  <div key={index} className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="text-red-500 font-bold">🚩</div>
                    <div className="text-sm text-gray-300">{flag}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">
                This message came from a legitimate source with proper authentication and expected content.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                resetGame();
                setTimeout(startGame, 100);
              }}
              className="w-full py-4 bg-gradient-to-r from-ember to-ember-light hover:from-ember-dark hover:to-cyan-700 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
            >
              <Shield size={24} />
              Next Scenario
            </button>
            
            <button
              onClick={resetGame}
              className="w-full py-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg font-bold transition-all"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PhishFinderGame;
