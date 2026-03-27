/**
 * Gamification Event Manager
 * Handles XP gains and achievement unlocks with visual feedback
 */

class GamificationEventManager {
  constructor() {
    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify(event) {
    this.listeners.forEach(callback => callback(event));
  }

  /**
   * Show XP gain notification
   * @param {number} xp - Amount of XP gained
   * @param {string} reason - Reason for XP gain
   * @param {Object} levelInfo - Optional level up info
   */
  showXPGain(xp, reason, levelInfo = null) {
    this.notify({
      type: 'xp_gain',
      xp,
      reason,
      levelUp: levelInfo ? true : false,
      levelInfo
    });
  }

  /**
   * Show achievement unlock celebration
   * @param {Object} achievement - Achievement object
   */
  showAchievement(achievement) {
    this.notify({
      type: 'achievement',
      achievement
    });
  }

  /**
   * Show level up celebration
   * @param {Object} levelInfo - New level information
   */
  showLevelUp(levelInfo) {
    this.notify({
      type: 'level_up',
      levelInfo
    });
  }
}

// Singleton instance
export const gamificationEvents = new GamificationEventManager();

/**
 * Hook into API responses to detect gamification events
 * Call this after actions that award XP
 */
export const processGamificationResponse = (response) => {
  if (!response) return;

  // Check for XP gain
  if (response.xp_gained && response.xp_gained > 0) {
    gamificationEvents.showXPGain(
      response.xp_gained,
      response.reason || 'Action completed',
      response.level_up ? {
        level: response.new_level,
        name: response.level_name,
        badge: response.level_badge
      } : null
    );
  }

  // Check for achievement unlock
  if (response.achievement_unlocked) {
    gamificationEvents.showAchievement(response.achievement_unlocked);
  }
};

export default gamificationEvents;
