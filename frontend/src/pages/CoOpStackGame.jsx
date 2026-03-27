import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Users, Key, DoorOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import safeLocalStorage from '../utils/safeLocalStorage';

const API = process.env.REACT_APP_BACKEND_URL;

// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.5;
const JUMP_VELOCITY = -12;
const MOVE_SPEED = 5;
const PLAYER_SIZE = 40;
const PLATFORM_HEIGHT = 20;

// Platforms (static obstacles)
const PLATFORMS = [
  { x: 0, y: 580, width: 800, height: 20 }, // Ground
  { x: 100, y: 450, width: 200, height: 20 },
  { x: 500, y: 450, width: 200, height: 20 },
  { x: 300, y: 320, width: 150, height: 20 },
  { x: 50, y: 200, width: 120, height: 20 },
  { x: 600, y: 200, width: 120, height: 20 }
];

const KEY_POSITION = { x: 680, y: 150 }; // High ledge requiring stack
const GOAL_POSITION = { x: 20, y: 100, width: 60, height: 80 }; // Door

const CoOpStackGame = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const ws = useRef(null);
  const gameLoopRef = useRef(null);
  const lastBroadcastRef = useRef(0);
  const { user } = useAuth();  // Get user from AuthContext
  
  const [gameState, setGameState] = useState('countdown'); // countdown, playing, victory
  const [countdown, setCountdown] = useState(3);
  const [room, setRoom] = useState(null);
  
  // Player states (local player)
  const [localPlayer, setLocalPlayer] = useState({
    x: 100,
    y: 400,
    velocityX: 0,
    velocityY: 0,
    isGrounded: false,
    squashScale: 1.0 // For weight animation
  });
  
  // Other players
  const [remotePlayers, setRemotePlayers] = useState({});
  
  // Combat card data
  const [combatCards, setCombatCards] = useState({});
  
  // Game state
  const [keyCollected, setKeyCollected] = useState(false);
  const [goalReached, setGoalReached] = useState(false);
  const [winner, setWinner] = useState(null);
  const [xpEarned, setXpEarned] = useState(0);
  
  // Controls
  const [keys, setKeys] = useState({
    left: false,
    right: false,
    up: false
  });
  
  // Particles for high-tier players
  const [particles, setParticles] = useState([]);
  
  // Performance tracking
  const [fps, setFps] = useState(60);
  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now() });
  
  // Misalignment shake
  const [shakeIntensity, setShakeIntensity] = useState(0);

  useEffect(() => {
    if (user) {
      fetchRoomData();
      initializeWebSocket();
    }
    
    // Keyboard controls
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      if (ws.current) ws.current.close();
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [user]);

  // Countdown effect
  useEffect(() => {
    if (gameState === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'countdown' && countdown === 0) {
      setGameState('playing');
      startGameLoop();
    }
  }, [countdown, gameState]);

  const fetchRoomData = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await fetch(`${API}/api/coop/room/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setRoom(data);
      
      // Fetch combat cards
      const cards = {};
      for (const player of data.players) {
        try {
          const cardRes = await fetch(`${API}/api/profile/combat-card/${player.user_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const cardData = await cardRes.json();
          cards[player.user_id] = cardData;
        } catch (err) {
          console.error('Error fetching combat card:', err);
        }
      }
      setCombatCards(cards);
    } catch (error) {
      console.error('Error fetching room:', error);
    }
  };

  const initializeWebSocket = () => {
    const wsUrl = `${API.replace('http', 'ws')}/ws/coop/${roomId}`;
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      console.log('🎮 Connected to Co-Op Stack game');
      // Use user from AuthContext
      ws.current.send(JSON.stringify({ user_id: user?.id }));
    };
    
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };
  };

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'game_state':
        // Initial game state from server
        if (message.state.players) {
          const others = {};
          Object.keys(message.state.players).forEach(playerId => {
            if (playerId !== user.id) {
              others[playerId] = message.state.players[playerId];
            }
          });
          setRemotePlayers(others);
        }
        setKeyCollected(message.state.key_collected);
        break;
        
      case 'player_position':
        if (message.user_id !== user.id) {
          setRemotePlayers(prev => ({
            ...prev,
            [message.user_id]: {
              ...prev[message.user_id],
              ...message.position
            }
          }));
        }
        break;
        
      case 'key_collected':
        setKeyCollected(true);
        if (message.user_id === user.id) {
          // You collected the key!
          playSound('key');
        }
        break;
        
      case 'game_completed':
        setGameState('victory');
        setXpEarned(message.xp_earned);
        triggerVictory();
        break;
        
      default:
        break;
    }
  };

  const handleKeyDown = (e) => {
    if (gameState !== 'playing') return;
    
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      setKeys(prev => ({ ...prev, left: true }));
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      setKeys(prev => ({ ...prev, right: true }));
    }
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
      setKeys(prev => ({ ...prev, up: true }));
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      setKeys(prev => ({ ...prev, left: false }));
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      setKeys(prev => ({ ...prev, right: false }));
    }
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
      setKeys(prev => ({ ...prev, up: false }));
    }
  };

  const startGameLoop = () => {
    const loop = () => {
      updateGameState();
      render();
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const updateGameState = () => {
    if (gameState !== 'playing') return;
    
    setLocalPlayer(prev => {
      let newX = prev.x;
      let newY = prev.y;
      let newVelocityX = prev.velocityX;
      let newVelocityY = prev.velocityY;
      let newIsGrounded = false;
      let newSquashScale = 1.0;
      
      // Horizontal movement
      if (keys.left) {
        newVelocityX = -MOVE_SPEED;
      } else if (keys.right) {
        newVelocityX = MOVE_SPEED;
      } else {
        newVelocityX = 0;
      }
      
      newX += newVelocityX;
      
      // Boundary check
      if (newX < 0) newX = 0;
      if (newX > CANVAS_WIDTH - PLAYER_SIZE) newX = CANVAS_WIDTH - PLAYER_SIZE;
      
      // Vertical movement (gravity)
      newVelocityY += GRAVITY;
      newY += newVelocityY;
      
      // Platform collision
      for (const platform of PLATFORMS) {
        if (
          newX + PLAYER_SIZE > platform.x &&
          newX < platform.x + platform.width &&
          newY + PLAYER_SIZE > platform.y &&
          newY + PLAYER_SIZE < platform.y + platform.height + 10 &&
          newVelocityY >= 0
        ) {
          newY = platform.y - PLAYER_SIZE;
          newVelocityY = 0;
          newIsGrounded = true;
        }
      }
      
      // Player-on-player collision (stacking!)
      Object.keys(remotePlayers).forEach(playerId => {
        const other = remotePlayers[playerId];
        if (other && 
            newX + PLAYER_SIZE > other.x &&
            newX < other.x + PLAYER_SIZE &&
            newY + PLAYER_SIZE > other.y &&
            newY + PLAYER_SIZE < other.y + PLAYER_SIZE / 2 &&
            newVelocityY >= 0) {
          // Land on top of other player
          newY = other.y - PLAYER_SIZE;
          newVelocityY = 0;
          newIsGrounded = true;
          
          // Squash effect for bottom player (visual weight)
          newSquashScale = 0.9;
          
          // Check alignment - trigger shake if misaligned
          const centerOffset = Math.abs((newX + PLAYER_SIZE / 2) - (other.x + PLAYER_SIZE / 2));
          if (centerOffset > PLAYER_SIZE * 0.3) {
            // Misaligned! Trigger vibration
            setShakeIntensity(centerOffset / 10);
            setTimeout(() => setShakeIntensity(0), 200);
          }
        }
      });
      
      // Jump
      if (keys.up && newIsGrounded) {
        newVelocityY = JUMP_VELOCITY;
        newIsGrounded = false;
      }
      
      // Key collection
      if (!keyCollected &&
          Math.abs(newX - KEY_POSITION.x) < PLAYER_SIZE &&
          Math.abs(newY - KEY_POSITION.y) < PLAYER_SIZE) {
        setKeyCollected(true);
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            type: 'key_collected'
          }));
        }
      }
      
      // Goal reached (only if key collected)
      if (keyCollected &&
          newX >= GOAL_POSITION.x &&
          newX <= GOAL_POSITION.x + GOAL_POSITION.width &&
          newY >= GOAL_POSITION.y &&
          newY <= GOAL_POSITION.y + GOAL_POSITION.height) {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            type: 'goal_reached'
          }));
        }
      }
      
      return {
        x: newX,
        y: newY,
        velocityX: newVelocityX,
        velocityY: newVelocityY,
        isGrounded: newIsGrounded,
        squashScale: newSquashScale
      };
    });
    
    // Broadcast position (throttled to 50ms)
    const now = Date.now();
    if (now - lastBroadcastRef.current > 50) {
      broadcastPosition();
      lastBroadcastRef.current = now;
    }
    
    // Update particles for high-tier players
    updateParticles();
  };

  const broadcastPosition = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'player_move',
        position: {
          x: localPlayer.x,
          y: localPlayer.y,
          velocity_x: localPlayer.velocityX,
          velocity_y: localPlayer.velocityY,
          is_grounded: localPlayer.isGrounded
        }
      }));
    }
  };

  const updateParticles = () => {
    // Generate particles for Divine/Architect players
    const card = combatCards[user.id];
    if (card && (card.tier.name === "Divine Legend" || card.tier.name === "The Architect")) {
      // Spawn particle
      setParticles(prev => [
        ...prev.filter(p => p.life > 0),
        {
          x: localPlayer.x + PLAYER_SIZE / 2 + (Math.random() - 0.5) * 20,
          y: localPlayer.y + PLAYER_SIZE,
          life: 30,
          color: card.tier.color
        }
      ]);
    }
    
    // Update particle positions
    setParticles(prev => prev.map(p => ({
      ...p,
      y: p.y - 2,
      life: p.life - 1
    })));
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // FPS Counter
    const now = performance.now();
    fpsCounterRef.current.frames++;
    if (now - fpsCounterRef.current.lastTime >= 1000) {
      setFps(fpsCounterRef.current.frames);
      fpsCounterRef.current.frames = 0;
      fpsCounterRef.current.lastTime = now;
    }
    
    // Clear canvas (Obsidian Vault background)
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid (Matrix-style)
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }
    
    // Draw platforms (neon purple borders)
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
    PLATFORMS.forEach(platform => {
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    });
    
    // Draw key (if not collected)
    if (!keyCollected) {
      ctx.save();
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#FFD700';
      ctx.font = '30px Arial';
      ctx.fillText('🔑', KEY_POSITION.x, KEY_POSITION.y + 30);
      ctx.restore();
    }
    
    // Draw goal door
    ctx.save();
    if (keyCollected) {
      // Unlocked - animated gradient
      const gradient = ctx.createLinearGradient(
        GOAL_POSITION.x,
        GOAL_POSITION.y,
        GOAL_POSITION.x,
        GOAL_POSITION.y + GOAL_POSITION.height
      );
      gradient.addColorStop(0, '#a855f7');
      gradient.addColorStop(0.5, '#764ba2');
      gradient.addColorStop(1, '#667eea');
      ctx.fillStyle = gradient;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 30;
    } else {
      // Locked - gray
      ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
    }
    ctx.fillRect(GOAL_POSITION.x, GOAL_POSITION.y, GOAL_POSITION.width, GOAL_POSITION.height);
    ctx.strokeStyle = keyCollected ? '#a855f7' : '#666';
    ctx.lineWidth = 3;
    ctx.strokeRect(GOAL_POSITION.x, GOAL_POSITION.y, GOAL_POSITION.width, GOAL_POSITION.height);
    ctx.restore();
    
    // Draw particles
    particles.forEach(p => {
      ctx.save();
      ctx.fillStyle = typeof p.color === 'string' && p.color.startsWith('linear-gradient')
        ? '#a855f7' // Fallback for Architect
        : p.color;
      ctx.globalAlpha = p.life / 30;
      ctx.fillRect(p.x, p.y, 3, 3);
      ctx.restore();
    });
    
    // Draw remote players
    Object.keys(remotePlayers).forEach(playerId => {
      const player = remotePlayers[playerId];
      const card = combatCards[playerId];
      if (player && card) {
        drawPlayer(ctx, player.x, player.y, card, 1.0);
      }
    });
    
    // Draw local player (with squash effect)
    const localCard = combatCards[user.id];
    if (localCard) {
      drawPlayer(ctx, localPlayer.x, localPlayer.y, localCard, localPlayer.squashScale);
    }
    
    // Draw FPS counter (top-left)
    ctx.fillStyle = '#a855f7';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS: ${fps}`, 10, 20);
    
    // Draw controls hint (bottom-left)
    ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.font = '12px monospace';
    ctx.fillText('WASD / Arrow Keys to move', 10, CANVAS_HEIGHT - 10);
  };

  const drawPlayer = (ctx, x, y, card, squashScale = 1.0) => {
    const tier = card.tier;
    
    ctx.save();
    
    // Apply squash and stretch
    ctx.translate(x + PLAYER_SIZE / 2, y + PLAYER_SIZE / 2);
    ctx.scale(1, squashScale);
    ctx.translate(-(x + PLAYER_SIZE / 2), -(y + PLAYER_SIZE / 2));
    
    // Tier glow
    const glowColor = tier.name === "The Architect" ? '#667eea' : tier.color;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;
    
    // Draw avatar
    if (card.profile_picture) {
      const img = new Image();
      img.src = `${API}${card.profile_picture}`;
      ctx.drawImage(img, x, y, PLAYER_SIZE, PLAYER_SIZE);
    } else {
      // Fallback: colored circle with initial
      ctx.fillStyle = tier.name === "The Architect" 
        ? '#667eea' 
        : tier.color;
      ctx.beginPath();
      ctx.arc(x + PLAYER_SIZE / 2, y + PLAYER_SIZE / 2, PLAYER_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.email.charAt(0).toUpperCase(), x + PLAYER_SIZE / 2, y + PLAYER_SIZE / 2);
    }
    
    // Border (tier color)
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + PLAYER_SIZE / 2, y + PLAYER_SIZE / 2, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
    
    // Name tag
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(card.full_name || card.email.split('@')[0], x + PLAYER_SIZE / 2, y - 5);
  };

  const playSound = (type) => {
    // Placeholder for sound effects
    console.log(`🔊 Sound: ${type}`);
  };

  const triggerVictory = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  if (gameState === 'countdown') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-8xl font-bold text-ember mb-4 animate-pulse">
            {countdown === 0 ? 'GO!' : countdown}
          </h1>
          <p className="text-gray-400 text-xl">Get ready to stack...</p>
        </div>
      </div>
    );
  }

  if (gameState === 'victory') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6 animate-bounce" />
          <h1 className="text-4xl font-bold text-white mb-4">
            🎉 MISSION COMPLETE! 🎉
          </h1>
          <p className="text-gray-400 mb-6">
            Your squad reached The Reach and secured the vault!
          </p>
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl p-6 mb-6">
            <p className="text-yellow-500 font-bold text-2xl">
              +{xpEarned} XP
            </p>
            <p className="text-gray-400 text-sm">Split equally among warriors</p>
          </div>
          <button
            onClick={() => navigate('/games/duel')}
            className="px-8 py-3 bg-ember hover:bg-ember-light rounded-lg font-bold transition-colors"
          >
            Return to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-4xl mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(`/games/coop-stack/lobby/${roomId}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Exit Game</span>
        </button>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-400">
            <Users size={20} />
            <span>{Object.keys(remotePlayers).length + 1} Players</span>
          </div>
          
          <div className="flex items-center gap-2">
            {keyCollected ? (
              <span className="text-green-500 font-bold">🔑 KEY COLLECTED</span>
            ) : (
              <span className="text-gray-500">🔒 Find the Key</span>
            )}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div 
        className="border-4 border-ember/50 rounded-lg overflow-hidden shadow-2xl shadow-purple-900/50"
        style={{
          animation: shakeIntensity > 0 ? `shake ${0.1}s ease-in-out` : 'none'
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block"
        />
      </div>

      {/* Controls Help */}
      <div className="mt-4 text-center text-gray-500 text-sm">
        <p>🎮 Controls: Arrow Keys or WASD to move • Space/W to jump</p>
        <p className="mt-1">🎯 Objective: Stack on teammates to reach the key, then enter the door!</p>
      </div>
      
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px) rotate(-0.5deg); }
          75% { transform: translateX(4px) rotate(0.5deg); }
        }
      `}</style>
    </div>
  );
};

export default CoOpStackGame;
