/**
 * Notification Sound Manager
 * Plays notification sounds based on user preferences
 */

class NotificationSoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.settings = {
      sound_enabled: true,
      volume: 80,
      sound_theme: 'default',
      new_message_sound: true,
      friend_request_sound: true,
      friend_accept_sound: true,
      story_reaction_sound: true,
      mention_sound: true
    };
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Load notification settings from API
      await this.loadSettings();
      
      this.initialized = true;
      console.log('✅ Notification Sound Manager initialized');
    } catch (error) {
      console.error('Failed to initialize sound manager:', error);
    }
  }

  async loadSettings() {
    try {
      const token = safeLocalStorage.getItem('token');
      if (!token) return;

      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/notifications/settings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        this.settings = data.settings;
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    try {
      const token = safeLocalStorage.getItem('token');
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      
      await fetch(`${BACKEND_URL}/api/notifications/settings/update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.settings)
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  }

  /**
   * Generate notification sound using Web Audio API
   */
  generateSound(type = 'default') {
    if (!this.audioContext) return null;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Different sound profiles
    const soundProfiles = {
      default: { frequency: 800, duration: 0.1, type: 'sine' },
      chime: { frequency: 1000, duration: 0.15, type: 'sine' },
      bell: { frequency: 1200, duration: 0.2, type: 'triangle' },
      pop: { frequency: 600, duration: 0.08, type: 'square' }
    };

    const profile = soundProfiles[type] || soundProfiles.default;

    oscillator.type = profile.type;
    oscillator.frequency.setValueAtTime(profile.frequency, ctx.currentTime);

    // Volume envelope
    const volume = (this.settings.volume / 100) * 0.3;
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + profile.duration);

    return { oscillator, gainNode, duration: profile.duration };
  }

  /**
   * Play notification sound
   */
  async play(notificationType) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check if sounds are globally enabled
    if (!this.settings.sound_enabled) {
      return;
    }

    // Check if this specific notification type is enabled
    const settingKey = `${notificationType}_sound`;
    if (this.settings[settingKey] === false) {
      return;
    }

    try {
      // Resume audio context if suspended (required by browser autoplay policies)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const sound = this.generateSound(this.settings.sound_theme);
      if (sound) {
        sound.oscillator.start(this.audioContext.currentTime);
        sound.oscillator.stop(this.audioContext.currentTime + sound.duration);
        
        // Dispatch event for visual feedback
        window.dispatchEvent(new CustomEvent('soundPlayed', {
          detail: { type: notificationType }
        }));
      }
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  /**
   * Play specific notification types
   */
  playNewMessage() {
    this.play('new_message');
  }

  playFriendRequest() {
    this.play('friend_request');
  }

  playFriendAccept() {
    this.play('friend_accept');
  }

  playStoryReaction() {
    this.play('story_reaction');
  }

  playMention() {
    this.play('mention');
  }

  /**
   * Test sound
   */
  async testSound() {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const sound = this.generateSound(this.settings.sound_theme);
    if (sound) {
      sound.oscillator.start(this.audioContext.currentTime);
      sound.oscillator.stop(this.audioContext.currentTime + sound.duration);
    }
  }

  /**
   * Set volume (0-100)
   */
  setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(100, volume));
  }

  /**
   * Enable/disable all sounds
   */
  setEnabled(enabled) {
    this.settings.sound_enabled = enabled;
  }

  /**
   * Change sound theme
   */
  setSoundTheme(theme) {
    this.settings.sound_theme = theme;
  }
}

// Create singleton instance
const notificationSoundManager = new NotificationSoundManager();

export default notificationSoundManager;
