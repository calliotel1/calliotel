import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Timer, Trophy, Flame, ArrowLeft, Loader2 } from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';

const API = process.env.REACT_APP_BACKEND_URL;

const DuelRaceInterface = () => {
  const { duelId } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  
  // Duel state
  const [duel, setDuel] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Game state
  const [gameState, setGameState] = useState('countdown'); // countdown, racing, waiting, result
  const [countdown, setCountdown] = useState(3);
  
  // Race data
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userInput, setUserInput] = useState('');
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [startTime, setStartTime] = useState(null);
  
  // Result
  const [result, setResult] = useState(null);
  
  // Chaos mode effects
  const [chaosOffset, setChaosOffset] = useState({ x: 0, y: 0 });
  const [chaosFlicker, setChaosFlicker] = useState(false);

  // Fetch duel data
  useEffect(() => {
    fetchDuelData();
  }, [duelId]);

  // Countdown effect
  useEffect(() => {
    if (gameState === 'countdown' && duel) {
      if (countdown > 0) {
        const timeout = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timeout);
      } else {
        // Start race!
        startRace();
      }
    }
  }, [countdown, gameState, duel]);

  // Timer effect
  useEffect(() => {
    if (gameState === 'racing' && timerInterval) {
      return () => clearInterval(timerInterval);
    }
  }, [gameState, timerInterval]);

  // Chaos mode effects
  useEffect(() => {
    if (gameState === 'racing' && duel?.chaos_mode) {
      const chaosInterval = setInterval(() => {
        setChaosOffset({
          x: Math.random() * 20 - 10,
          y: Math.random() * 10 - 5
        });
        setChaosFlicker(Math.random() > 0.7);
      }, 150);
      
      return () => clearInterval(chaosInterval);
    } else {
      setChaosOffset({ x: 0, y: 0 });
      setChaosFlicker(false);
    }
  }, [gameState, duel]);

  const fetchDuelData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Get duel details from active duels
      const response = await axios.get(`${API}/api/game/duel/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const foundDuel = response.data.duels.find(d => d.id === duelId);
      
      if (!foundDuel) {
        alert('Duel not found or no longer active');
        navigate('/games/duel');
        return;
      }
      
      setDuel(foundDuel);
      
      // Generate phone number based on difficulty
      generatePhoneNumber(foundDuel.difficulty);
      
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching duel:', error);
      alert('Failed to load duel');
      navigate('/games/duel');
    }
  };

  const generatePhoneNumber = (difficulty) => {
    let number;
    if (difficulty === 'easy') {
      number = `${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;
    } else if (difficulty === 'medium') {
      const area = Math.floor(Math.random() * 800 + 200);
      const exchange = Math.floor(Math.random() * 800 + 200);
      const num = Math.floor(Math.random() * 9000 + 1000);
      number = `(${area}) ${exchange}-${num}`;
    } else {
      const area = Math.floor(Math.random() * 800 + 200);
      const exchange = Math.floor(Math.random() * 800 + 200);
      const num = Math.floor(Math.random() * 9000 + 1000);
      number = `+1 (${area}) ${exchange}-${num}`;
    }
    setPhoneNumber(number);
  };

  const startRace = () => {
    setGameState('racing');
    setStartTime(Date.now());
    
    // Start timer
    const interval = setInterval(() => {
      setTimer(prev => prev + 0.01);
    }, 10);
    setTimerInterval(interval);
    
    // Focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const submitResult = async () => {
    if (!phoneNumber || !userInput.trim()) return;
    
    // Stop timer
    clearInterval(timerInterval);
    const finalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API}/api/game/duel/submit/${duelId}`,
        {
          phone_number: phoneNumber,
          time_taken: parseFloat(finalTime)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.duel_id) {
        // Full result returned - duel is complete
        setResult(response.data);
        setGameState('result');
        
        // Celebrate winner
        if (response.data.winner_email === localStorage.getItem('userEmail')) {
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.5 }
          });
        }
      } else {
        // Waiting for opponent
        setGameState('waiting');
        
        // Poll for result every 2 seconds
        const pollInterval = setInterval(async () => {
          try {
            const pollRes = await axios.get(`${API}/api/game/duel/feed?status=completed&limit=1`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const completedDuel = pollRes.data.duels.find(d => d.id === duelId);
            if (completedDuel && completedDuel.status === 'completed') {
              clearInterval(pollInterval);
              
              // Construct result
              const isWinner = completedDuel.winner_email === localStorage.getItem('userEmail');
              setResult({
                duel_id: duelId,
                winner_email: completedDuel.winner_email,
                loser_email: isWinner ? completedDuel.opponent_email : completedDuel.challenger_email,
                pot_amount: completedDuel.wager_amount * 2,
                winner_time: completedDuel.winner_id === completedDuel.challenger_id ? completedDuel.challenger_time : completedDuel.opponent_time,
                loser_time: completedDuel.winner_id === completedDuel.challenger_id ? completedDuel.opponent_time : completedDuel.challenger_time
              });
              setGameState('result');
              
              if (isWinner) {
                confetti({
                  particleCount: 200,
                  spread: 100,
                  origin: { y: 0.5 }
                });
              }
            }
          } catch (err) {
            console.error('Error polling for result:', err);
          }
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error submitting result:', error);
      alert(error.response?.data?.detail || 'Failed to submit result');
    }
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (userInput.trim()) {
      submitResult();
    }
  };

  const difficultyConfig = {
    easy: { name: 'Easy', color: 'text-green-500', emoji: '🎯' },
    medium: { name: 'Medium', color: 'text-yellow-500', emoji: '⚡' },
    hard: { name: 'Hard', color: 'text-red-500', emoji: '🔥' }
  };

  if (loading || !duel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-red-500" />
      </div>
    );
  }

  const config = difficultyConfig[duel.difficulty];

  // COUNTDOWN STATE
  if (gameState === 'countdown') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-9xl font-bold mb-8 animate-pulse">
            {countdown > 0 ? countdown : 'GO!'}
          </div>
          <div className="text-2xl text-gray-400">
            {duel.wager_amount * 2} XP on the line
          </div>
          <div className="text-lg text-gray-500 mt-2">
            {config.emoji} {config.name} {duel.chaos_mode && '🔥 Chaos Mode'}
          </div>
        </div>
      </div>
    );
  }

  // RACING STATE
  if (gameState === 'racing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Timer & Info */}
          <div className="flex items-center justify-between mb-8">
            <div className={`px-4 py-2 rounded-lg bg-${config.color}/20 border-2 border-${config.color}`}>
              <span className={`font-bold ${config.color}`}>
                {config.emoji} {config.name}
              </span>
              {duel.chaos_mode && <span className="ml-2 text-red-500">🔥 CHAOS</span>}
            </div>
            
            <div className="flex items-center gap-2 text-3xl font-mono">
              <Timer className="text-ember" />
              <span>{timer.toFixed(2)}s</span>
            </div>
          </div>

          {/* Phone Number Display */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-12 mb-6 border-2 border-red-500/50">
            <div className="text-center mb-4 text-gray-400 text-sm uppercase tracking-wider">
              Type this number:
            </div>
            <div 
              className={`text-center font-mono font-bold transition-all ${
                chaosFlicker ? 'opacity-30' : 'opacity-100'
              }`}
              style={{
                fontSize: duel.difficulty === 'easy' ? '3rem' : duel.difficulty === 'medium' ? '2.5rem' : '2rem',
                transform: `translate(${chaosOffset.x}px, ${chaosOffset.y}px)`,
                transition: 'transform 0.15s ease-out'
              }}
            >
              {phoneNumber}
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
              className="w-full p-6 text-2xl font-mono bg-gray-800/80 backdrop-blur-sm border-2 border-gray-700 focus:border-red-500 rounded-xl text-center outline-none transition-all"
              autoComplete="off"
              spellCheck="false"
            />
            
            <button
              type="submit"
              className="w-full mt-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-bold text-lg transition-all"
            >
              Submit Time
            </button>
          </form>
        </div>
      </div>
    );
  }

  // WAITING STATE
  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-yellow-500 mx-auto mb-6" />
          <div className="text-3xl font-bold mb-4">Waiting for Opponent...</div>
          <div className="text-lg text-gray-400">Your time: {timer.toFixed(2)}s</div>
        </div>
      </div>
    );
  }

  // RESULT STATE
  if (gameState === 'result' && result) {
    const userEmail = localStorage.getItem('userEmail') || '';
    const isWinner = result.winner_email === userEmail;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Result Header */}
          <div className="text-center mb-8">
            {isWinner ? (
              <>
                <Trophy className="mx-auto text-yellow-500 mb-4" size={80} />
                <h1 className="text-5xl font-bold text-yellow-500 mb-2">VICTORY!</h1>
                <p className="text-2xl text-gray-300">You Won the Duel!</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">😔</div>
                <h1 className="text-5xl font-bold text-red-500 mb-2">Defeated</h1>
                <p className="text-2xl text-gray-300">Better Luck Next Time</p>
              </>
            )}
          </div>

          {/* Result Details */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 mb-6 border border-gray-700 space-y-6">
            {/* Times */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${isWinner ? 'bg-green-500/20 border-2 border-green-500' : 'bg-gray-700/50'}`}>
                <div className="text-sm text-gray-400 mb-1">Your Time</div>
                <div className="text-3xl font-mono font-bold">
                  {isWinner ? result.winner_time : result.loser_time}s
                </div>
              </div>
              <div className={`p-4 rounded-lg ${!isWinner ? 'bg-green-500/20 border-2 border-green-500' : 'bg-gray-700/50'}`}>
                <div className="text-sm text-gray-400 mb-1">Opponent Time</div>
                <div className="text-3xl font-mono font-bold">
                  {isWinner ? result.loser_time : result.winner_time}s
                </div>
              </div>
            </div>

            {/* XP Change */}
            <div className="pt-6 border-t border-gray-700 text-center">
              {isWinner ? (
                <>
                  <div className="text-sm text-gray-400 mb-2">You Won</div>
                  <div className="text-5xl font-bold text-yellow-500">
                    +{result.pot_amount} XP
                  </div>
                  <div className="text-sm text-gray-400 mt-2">Total Pot</div>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-400 mb-2">You Lost</div>
                  <div className="text-5xl font-bold text-red-500">
                    -{duel.wager_amount} XP
                  </div>
                  <div className="text-sm text-gray-400 mt-2">Wager Amount</div>
                </>
              )}
            </div>

            {/* Winner Announcement */}
            <div className="pt-6 border-t border-gray-700 text-center">
              <div className="text-lg">
                <span className={isWinner ? 'text-yellow-500' : 'text-gray-400'}>
                  {result.winner_email?.split('@')[0]}
                </span>
                <span className="text-gray-400 mx-2">defeated</span>
                <span className={!isWinner ? 'text-yellow-500' : 'text-gray-400'}>
                  {result.loser_email?.split('@')[0]}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                by {Math.abs(result.winner_time - result.loser_time).toFixed(2)}s
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/games/duel')}
              className="w-full py-4 bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark rounded-lg font-bold text-lg transition-all"
            >
              Back to Duel Arena
            </button>
            
            <button
              onClick={() => navigate('/gamification')}
              className="w-full py-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg font-bold transition-all"
            >
              Back to Arcade
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DuelRaceInterface;
