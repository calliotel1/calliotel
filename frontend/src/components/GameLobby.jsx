import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Crown, Users, Play, ArrowLeft, Loader2, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import safeLocalStorage from '../utils/safeLocalStorage';

const API = process.env.REACT_APP_BACKEND_URL;

const GameLobby = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();  // Get user from AuthContext
  const ws = useRef(null);
  
  // Room state
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [readyPlayers, setReadyPlayers] = useState(new Set());
  
  // Combat card data
  const [combatCards, setCombatCards] = useState({});

  useEffect(() => {
    if (roomId && user) {
      fetchRoomData();
      initializeWebSocket();
    }
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [roomId, user]);

  const fetchRoomData = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await fetch(`${API}/api/coop/room/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Room not found');
      }
      
      const data = await response.json();
      setRoom(data);
      setPlayers(data.players || []);
      
      // Use user from AuthContext
      setIsHost(data.host_id === user?.id);
      
      // Fetch combat cards for all players
      await fetchCombatCards(data.players);
      
    } catch (error) {
      console.error('Error fetching room:', error);
      toast({
        title: 'Error',
        description: 'Failed to load room',
        variant: 'destructive'
      });
      navigate('/games/duel');
    } finally {
      setLoading(false);
    }
  };

  const fetchCombatCards = async (playerList) => {
    const token = safeLocalStorage.getItem('token');
    const cards = {};
    
    for (const player of playerList) {
      try {
        const response = await fetch(`${API}/api/profile/combat-card/${player.user_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        cards[player.user_id] = data;
      } catch (error) {
        console.error(`Error fetching combat card for ${player.user_id}:`, error);
      }
    }
    
    setCombatCards(cards);
  };

  const initializeWebSocket = () => {
    const wsUrl = `${API.replace('http', 'ws')}/ws/coop/${roomId}`;
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      console.log('🔌 Connected to Co-Op Stack lobby');
      // Use user from AuthContext
      ws.current.send(JSON.stringify({
        user_id: user?.id
      }));
    };
    
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.current.onclose = () => {
      console.log('🔌 Disconnected from lobby');
    };
  };

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'player_joined':
        toast({
          title: '✅ Player Joined',
          description: `${message.player_count} warriors in the lobby`,
          duration: 2000
        });
        fetchRoomData(); // Refresh room data
        break;
        
      case 'player_left':
        toast({
          title: '⚠️ Player Left',
          description: 'A warrior has retreated',
          duration: 2000
        });
        fetchRoomData();
        break;
        
      case 'player_ready':
        setReadyPlayers(prev => new Set([...prev, message.user_id]));
        break;
        
      case 'player_unready':
        setReadyPlayers(prev => {
          const updated = new Set(prev);
          updated.delete(message.user_id);
          return updated;
        });
        break;
        
      case 'game_started':
        // Transition to game
        navigate(`/games/coop-stack/play/${roomId}`);
        break;
        
      default:
        break;
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    toast({
      title: '📋 Room Code Copied!',
      description: 'Share this code with your squad',
      duration: 2000
    });
  };

  const toggleReady = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: newReadyState ? 'player_ready' : 'player_unready',
        user_id: user.id
      }));
    }
    
    if (newReadyState) {
      setReadyPlayers(prev => new Set([...prev, user.id]));
    } else {
      setReadyPlayers(prev => {
        const updated = new Set(prev);
        updated.delete(user.id);
        return updated;
      });
    }
  };

  const startGame = () => {
    if (!isHost) return;
    
    // Check if all players are ready
    const allReady = players.every(p => readyPlayers.has(p.user_id));
    
    if (!allReady) {
      toast({
        title: '⚠️ Not Ready',
        description: 'All warriors must be ready before starting',
        variant: 'destructive'
      });
      return;
    }
    
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'start_game'
      }));
    } else {
      // Fallback: Navigate directly if WebSocket is not connected
      console.log('WebSocket not connected, navigating directly to game');
      navigate(`/games/coop-stack/play/${roomId}`);
    }
  };

  const getTierBorderStyle = (tier) => {
    if (tier.name === "The Architect") {
      return {
        border: '3px solid transparent',
        backgroundImage: 'linear-gradient(#1a1a2e, #1a1a2e), linear-gradient(45deg, #667eea, #764ba2, #f093fb)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: '0 0 30px rgba(102, 126, 234, 0.6), 0 0 60px rgba(118, 75, 162, 0.3)'
      };
    }
    
    return {
      borderColor: tier.color,
      borderWidth: '3px',
      boxShadow: `0 0 15px ${tier.color}60, 0 0 30px ${tier.color}30`
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-ember animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading War Room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">Room not found</p>
          <button
            onClick={() => navigate('/games/duel')}
            className="px-6 py-3 bg-ember hover:bg-ember-light rounded-lg"
          >
            Return to Games
          </button>
        </div>
      </div>
    );
  }

  const allPlayersReady = players.every(p => readyPlayers.has(p.user_id));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-ember/20/30 bg-gradient-to-b from-obsidian/20 to-transparent">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/games/duel')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Games</span>
            </button>
            
            <div className="flex items-center gap-2 text-ember">
              <Users size={20} />
              <span className="text-sm font-medium">
                {players.length}/{room.max_players} Warriors
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Room Code Card */}
        <div className="mb-8 bg-gradient-to-br from-ember-dark/20 to-olive/10 border border-ember/30 rounded-xl p-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-ember/40 to-ember-light/50 bg-clip-text text-transparent">
              🏗️ CO-OP STACK
            </h1>
            <p className="text-gray-400 text-sm mb-6">The Obsidian Vault • Level {room.level_id}</p>
            
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-gray-800 rounded-lg px-6 py-3 border border-ember/50">
                <p className="text-xs text-gray-500 mb-1">ROOM CODE</p>
                <p className="text-3xl font-mono font-bold text-ember tracking-wider">
                  {roomId}
                </p>
              </div>
              
              <button
                onClick={copyRoomCode}
                className="p-3 bg-ember hover:bg-ember-light rounded-lg transition-colors"
              >
                <Copy size={20} />
              </button>
            </div>
            
            <p className="text-gray-500 text-sm">
              💰 Victory Pot: <span className="text-yellow-500 font-bold">{room.xp_pot} XP</span> (split equally)
            </p>
          </div>
        </div>

        {/* Player Roster */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="text-ember" size={24} />
            Warriors in Lobby
          </h2>
          
          <div className="grid gap-4">
            {players.map((player) => {
              const card = combatCards[player.user_id];
              const playerReady = readyPlayers.has(player.user_id);
              const playerIsHost = player.user_id === room.host_id;
              
              if (!card) {
                return (
                  <div key={player.user_id} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="animate-pulse flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                );
              }
              
              const tier = card.tier;
              
              return (
                <div
                  key={player.user_id}
                  className="bg-gray-800/50 rounded-lg p-4 border-2 transition-all"
                  style={getTierBorderStyle(tier)}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                        style={{
                          background: tier.name === "The Architect"
                            ? 'linear-gradient(45deg, #667eea, #764ba2, #f093fb)'
                            : `linear-gradient(135deg, ${tier.color}20, ${tier.color}40)`,
                          border: `3px solid ${tier.color}`,
                          boxShadow: `0 0 15px ${tier.color}60`
                        }}
                      >
                        {card.profile_picture ? (
                          <img
                            src={`${API}${card.profile_picture}`}
                            alt={card.full_name || card.email}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          card.email.charAt(0).toUpperCase()
                        )}
                      </div>
                      
                      {/* Ready Badge */}
                      <div className="absolute -bottom-1 -right-1">
                        {playerReady ? (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-800">
                            <CheckCircle size={16} className="text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center border-2 border-gray-800">
                            <Clock size={16} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Player Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">
                          {card.full_name || card.email}
                        </h3>
                        {playerIsHost && (
                          <Crown className="text-yellow-500" size={18} />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-xs font-bold px-2 py-1 rounded"
                          style={{
                            background: tier.name === "The Architect"
                              ? 'linear-gradient(45deg, #667eea, #764ba2)'
                              : tier.color,
                            color: 'white'
                          }}
                        >
                          {tier.emoji} {tier.name}
                        </span>
                      </div>
                      
                      <div className="flex gap-4 text-xs text-gray-400">
                        <span>💪 {card.total_xp} XP</span>
                        <span>🏆 Level {card.level}</span>
                        <span>🎯 {card.duel_stats.win_rate}% Win Rate</span>
                      </div>
                    </div>
                    
                    {/* Ready Status */}
                    <div>
                      {playerReady ? (
                        <span className="text-green-500 font-bold text-sm">READY</span>
                      ) : (
                        <span className="text-gray-500 text-sm">Waiting...</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Ready Toggle - All players including host can mark ready */}
          <button
            onClick={toggleReady}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              isReady
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-ember hover:bg-ember-light text-white'
            }`}
          >
            {isReady ? '✅ READY' : '⏳ MARK AS READY'}
          </button>
          
          {/* Host Start Button */}
          {isHost && (
            <button
              onClick={startGame}
              disabled={!allPlayersReady}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                allPlayersReady
                  ? 'bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Play size={24} />
              {allPlayersReady ? 'START MISSION' : 'WAITING FOR ALL WARRIORS...'}
            </button>
          )}
          
          {/* Info */}
          <div className="text-center text-gray-500 text-sm">
            {isHost ? (
              <p>👑 You are the Host. Start the mission when all warriors are ready.</p>
            ) : (
              <p>⏳ Waiting for Host to start the mission...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
