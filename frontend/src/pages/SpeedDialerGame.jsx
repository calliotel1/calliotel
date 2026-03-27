import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Timer, Trophy, Zap, Target, Flame, Crown, 
  ArrowLeft, Play, CheckCircle2, XCircle, TrendingUp 
} from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';

const API = process.env.REACT_APP_BACKEND_URL;

const SpeedDialerGame = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  
  // Game State
  const [gameState, setGameState] = useState('menu'); // menu, playing, result
  const [difficulty, setDifficulty] = useState('easy');
  const [chaosMode, setChaosMode] = useState(false);
  
  // Challenge Data
  const [challenge, setChallenge] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  
  // Result Data
  const [result, setResult] = useState(null);
  
  // Stats Data
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Chaos mode effects
  const [chaosOffset, setChaosOffset] = useState({ x: 0, y: 0 });
  const [chaosFlicker, setChaosFlicker] = useState(false);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
    fetchLeaderboard();
  }, []);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timerInterval) {
      return () => clearInterval(timerInterval);
    }
  }, [gameState, timerInterval]);

  // Chaos mode effects
  useEffect(() => {
    if (gameState === 'playing' && chaosMode) {
      const chaosInterval = setInterval(() => {
        // Random position offset
        setChaosOffset({
          x: Math.random() * 20 - 10,
          y: Math.random() * 10 - 5
        });
        
        // Random flicker
        setChaosFlicker(Math.random() > 0.7);
      }, 150);
      
      return () => clearInterval(chaosInterval);
    } else {
      setChaosOffset({ x: 0, y: 0 });
      setChaosFlicker(false);
    }
  }, [gameState, chaosMode]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/game/speed-dialer/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchLeaderboard = async (diff = 'all') => {
    try {
      const response = await axios.get(`${API}/api/game/speed-dialer/leaderboard?difficulty=${diff}&limit=10`);
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const startGame = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/api/game/speed-dialer/start`,
        { difficulty, chaos_mode: chaosMode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setChallenge(response.data);
      setUserInput('');
      setTimer(0);
      setGameState('playing');
      
      // Start timer
      const interval = setInterval(() => {
        setTimer(prev => prev + 0.01);
      }, 10);
      setTimerInterval(interval);
      
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
      
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Please try again.');
    }
  };

  const submitGame = async () => {
    if (!challenge) return;
    
    // Stop timer
    clearInterval(timerInterval);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/api/game/speed-dialer/submit`,
        {
          challenge_id: challenge.challenge_id,
          user_input: userInput,
          time_taken: parseFloat(timer.toFixed(2))
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResult(response.data);
      setGameState('result');
      
      // Celebrate if successful
      if (response.data.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        // Extra confetti for level up
        if (response.data.level_up) {
          setTimeout(() => {
            confetti({
              particleCount: 200,
              spread: 100,
              origin: { y: 0.5 }
            });
          }, 500);
        }
      }
      
      // Refresh stats
      fetchStats();
      
    } catch (error) {
      console.error('Error submitting game:', error);
      alert(error.response?.data?.detail || 'Failed to submit game');
    }
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (userInput.trim()) {
      submitGame();
    }
  };

  const resetGame = () => {
    setGameState('menu');
    setChallenge(null);
    setUserInput('');
    setTimer(0);
    setResult(null);
    clearInterval(timerInterval);
  };

  // Difficulty configs
  const difficultyConfig = {
    easy: {
      name: 'Easy',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500',
      icon: '🎯',
      xp: 10,
      description: '7-digit local number'
    },
    medium: {
      name: 'Medium',
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500',
      icon: '⚡',
      xp: 25,
      description: '10-digit international'
    },
    hard: {
      name: 'Hard',
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500',
      icon: '🔥',
      xp: 50,
      description: 'E.164 format (+1...)'
    }
  };

  // MENU STATE
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900 text-white">
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
              <Zap className="text-yellow-500" size={28} />
              <h1 className="text-3xl font-bold">Speed Dialer</h1>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Game Setup */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Target className="text-ember" />
                Start New Game
              </h2>

              {/* Difficulty Selection */}
              <div className="space-y-4 mb-6">
                <label className="block text-sm text-gray-400 mb-2">Select Difficulty</label>
                {Object.entries(difficultyConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      difficulty === key
                        ? `${config.border} ${config.bg}`
                        : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{config.icon}</span>
                        <div className="text-left">
                          <div className={`font-bold ${config.color}`}>{config.name}</div>
                          <div className="text-sm text-gray-400">{config.description}</div>
                        </div>
                      </div>
                      <div className={`text-xl font-bold ${config.color}`}>
                        {config.xp} XP
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Chaos Mode Toggle */}
              <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/30 rounded-lg">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Flame className="text-red-500" size={24} />
                    <div>
                      <div className="font-bold text-red-500">Chaos Mode</div>
                      <div className="text-sm text-gray-400">
                        Numbers flicker & move (2x XP!)
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={chaosMode}
                    onChange={(e) => setChaosMode(e.target.checked)}
                    className="w-6 h-6 rounded accent-red-500"
                  />
                </label>
              </div>

              {/* Start Button */}
              <button
                onClick={startGame}
                className="w-full py-4 bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
              >
                <Play size={24} />
                Start Game
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
                ) : stats && stats.total_games > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Games:</span>
                      <span className="font-bold">{stats.total_games}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total XP Earned:</span>
                      <span className="font-bold text-yellow-500">{stats.total_xp_earned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Chaos Mode Games:</span>
                      <span className="font-bold text-red-500">{stats.chaos_mode_games}</span>
                    </div>
                    
                    {stats.best_times && Object.keys(stats.best_times).length > 0 && (
                      <>
                        <div className="pt-3 border-t border-gray-700">
                          <div className="text-sm text-gray-400 mb-2">Personal Best Times:</div>
                          {Object.entries(stats.best_times).map(([diff, time]) => (
                            <div key={diff} className="flex justify-between text-sm">
                              <span className={difficultyConfig[diff].color}>
                                {difficultyConfig[diff].name}:
                              </span>
                              <span className="font-mono">{time.toFixed(2)}s</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    No games played yet. Start your first game!
                  </div>
                )}
              </div>

              {/* Leaderboard */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Crown className="text-yellow-500" />
                  Top 10 Speedsters
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
                            {entry.client_id || entry.email}
                          </span>
                        </div>
                        <span className="font-mono text-sm text-green-400">
                          {entry.best_time}s
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    No leaderboard data yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PLAYING STATE
  if (gameState === 'playing' && challenge) {
    const config = difficultyConfig[difficulty];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Timer & Difficulty */}
          <div className="flex items-center justify-between mb-8">
            <div className={`px-4 py-2 rounded-lg ${config.bg} ${config.border} border-2`}>
              <span className={`font-bold ${config.color}`}>
                {config.icon} {config.name}
              </span>
              {chaosMode && <span className="ml-2 text-red-500">🔥 CHAOS</span>}
            </div>
            
            <div className="flex items-center gap-2 text-3xl font-mono">
              <Timer className="text-ember" />
              <span>{timer.toFixed(2)}s</span>
            </div>
          </div>

          {/* Phone Number Display */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-12 mb-6 border-2 border-ember/50">
            <div className="text-center mb-4 text-gray-400 text-sm uppercase tracking-wider">
              Type this number:
            </div>
            <div 
              className={`text-center font-mono font-bold transition-all ${
                chaosFlicker ? 'opacity-30' : 'opacity-100'
              }`}
              style={{
                fontSize: difficulty === 'easy' ? '3rem' : difficulty === 'medium' ? '2.5rem' : '2rem',
                transform: `translate(${chaosOffset.x}px, ${chaosOffset.y}px)`,
                transition: 'transform 0.15s ease-out'
              }}
            >
              {challenge.phone_number}
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleInputSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleInputChange}
              placeholder="Type the number here..."
              className="w-full p-6 text-2xl font-mono bg-gray-800/80 backdrop-blur-sm border-2 border-gray-700 focus:border-ember rounded-xl text-center outline-none transition-all"
              autoComplete="off"
              spellCheck="false"
            />
            
            <button
              type="submit"
              className="w-full mt-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
            >
              <CheckCircle2 size={24} />
              Submit
            </button>
          </form>

          <button
            onClick={resetGame}
            className="w-full mt-3 py-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg font-bold transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // RESULT STATE
  if (gameState === 'result' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Result Header */}
          <div className="text-center mb-8">
            {result.success ? (
              <>
                <CheckCircle2 className="mx-auto text-green-500 mb-4" size={80} />
                <h1 className="text-4xl font-bold text-green-500 mb-2">Perfect!</h1>
                <p className="text-gray-400">You nailed it in {result.time_taken}s</p>
              </>
            ) : (
              <>
                <XCircle className="mx-auto text-red-500 mb-4" size={80} />
                <h1 className="text-4xl font-bold text-red-500 mb-2">Wrong Number!</h1>
                <p className="text-gray-400">Better luck next time</p>
              </>
            )}
          </div>

          {/* Result Details */}
          {result.success && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 mb-6 border border-gray-700 space-y-4">
              {/* XP Earned */}
              <div className="flex items-center justify-between text-2xl">
                <span className="text-gray-400">XP Earned:</span>
                <span className="font-bold text-yellow-500">+{result.xp_earned} XP</span>
              </div>

              {/* Multipliers */}
              {result.speed_multiplier > 1 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Speed Bonus:</span>
                  <span className="text-ember">{result.speed_multiplier}x</span>
                </div>
              )}
              
              {result.chaos_multiplier > 1 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Chaos Bonus:</span>
                  <span className="text-red-500">{result.chaos_multiplier}x</span>
                </div>
              )}

              {/* Personal Best */}
              {result.personal_best && (
                <div className="pt-4 border-t border-gray-700 text-center">
                  <TrendingUp className="inline-block text-yellow-500 mr-2" size={20} />
                  <span className="text-yellow-500 font-bold">NEW PERSONAL BEST!</span>
                </div>
              )}

              {/* Level Up */}
              {result.level_up && (
                <div className="p-4 bg-gradient-to-r from-ember/20 to-ember-light/50/20 border-2 border-ember rounded-lg text-center">
                  <div className="text-3xl mb-2">{result.level_badge}</div>
                  <div className="text-xl font-bold text-ember">LEVEL UP!</div>
                  <div className="text-lg">
                    Level {result.new_level} - {result.level_name}
                  </div>
                </div>
              )}

              {/* New Total */}
              <div className="pt-4 border-t border-gray-700 flex items-center justify-between">
                <span className="text-gray-400">Total XP:</span>
                <span className="text-xl font-bold">{result.xp_total}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                resetGame();
                setTimeout(startGame, 100);
              }}
              className="w-full py-4 bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
            >
              <Play size={24} />
              Play Again
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

export default SpeedDialerGame;
