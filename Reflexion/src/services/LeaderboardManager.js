/**
 * REFLEXION v3.0 - LOCAL WEEKLY LEADERBOARD MANAGER
 * Manages local leaderboards for Classic and Rush modes
 * Resets weekly, persists in AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GAME_MODES } from '../utils/GameLogic';

const LEADERBOARD_KEYS = {
  CLASSIC: '@leaderboard_classic',
  RUSH: '@leaderboard_rush',
  LAST_RESET: '@leaderboard_last_reset',
};

const MAX_ENTRIES = 10; // Top 10 per mode
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class LeaderboardManager {
  constructor() {
    this.leaderboards = {
      [GAME_MODES.CLASSIC]: [],
      [GAME_MODES.RUSH]: [],
    };
    this.lastResetDate = null;
    this.isInitialized = false;
  }

  /**
   * Initialize leaderboard system
   * Checks if weekly reset is needed
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('📊 LeaderboardManager already initialized');
      return;
    }

    try {
      // Load leaderboards
      await this.loadLeaderboards();

      // Check if weekly reset is needed
      await this.checkWeeklyReset();

      this.isInitialized = true;
      console.log('✅ LeaderboardManager initialized');
    } catch (error) {
      console.error('❌ LeaderboardManager initialization failed:', error);
      this.isInitialized = true; // Set anyway to prevent blocking
    }
  }

  /**
   * Load leaderboards from AsyncStorage
   */
  async loadLeaderboards() {
    try {
      // Load Classic leaderboard
      const classicData = await AsyncStorage.getItem(LEADERBOARD_KEYS.CLASSIC);
      this.leaderboards[GAME_MODES.CLASSIC] = classicData ? JSON.parse(classicData) : [];

      // Load Rush leaderboard
      const rushData = await AsyncStorage.getItem(LEADERBOARD_KEYS.RUSH);
      this.leaderboards[GAME_MODES.RUSH] = rushData ? JSON.parse(rushData) : [];

      // Load last reset date
      const lastResetData = await AsyncStorage.getItem(LEADERBOARD_KEYS.LAST_RESET);
      this.lastResetDate = lastResetData ? parseInt(lastResetData) : Date.now();

      console.log(`📊 Loaded leaderboards: Classic (${this.leaderboards[GAME_MODES.CLASSIC].length}), Rush (${this.leaderboards[GAME_MODES.RUSH].length})`);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    }
  }

  /**
   * Check if weekly reset is needed
   */
  async checkWeeklyReset() {
    const now = Date.now();
    const timeSinceReset = now - this.lastResetDate;

    if (timeSinceReset >= WEEK_IN_MS) {
      console.log('📊 Weekly leaderboard reset triggered');
      await this.resetLeaderboards();
    }
  }

  /**
   * Reset all leaderboards (weekly reset)
   */
  async resetLeaderboards() {
    try {
      // Clear all leaderboards
      this.leaderboards[GAME_MODES.CLASSIC] = [];
      this.leaderboards[GAME_MODES.RUSH] = [];
      this.lastResetDate = Date.now();

      // Save to AsyncStorage
      await AsyncStorage.setItem(LEADERBOARD_KEYS.CLASSIC, JSON.stringify([]));
      await AsyncStorage.setItem(LEADERBOARD_KEYS.RUSH, JSON.stringify([]));
      await AsyncStorage.setItem(LEADERBOARD_KEYS.LAST_RESET, this.lastResetDate.toString());

      console.log('✅ Leaderboards reset successfully');
    } catch (error) {
      console.error('Error resetting leaderboards:', error);
    }
  }

  /**
   * Add a score to the leaderboard
   * @param {string} mode - Game mode (CLASSIC or RUSH)
   * @param {object} entry - Score entry { score, combo, timestamp, playerName }
   */
  async addScore(mode, entry) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (mode !== GAME_MODES.CLASSIC && mode !== GAME_MODES.RUSH) {
      console.warn(`Invalid mode: ${mode}`);
      return false;
    }

    try {
      // Get current leaderboard
      const leaderboard = this.leaderboards[mode];

      // Add new entry with timestamp
      const newEntry = {
        score: entry.score,
        combo: entry.combo || 0,
        timestamp: entry.timestamp || Date.now(),
        playerName: entry.playerName || 'Player',
      };

      leaderboard.push(newEntry);

      // Sort by score (descending)
      leaderboard.sort((a, b) => b.score - a.score);

      // Keep only top 10
      if (leaderboard.length > MAX_ENTRIES) {
        leaderboard.splice(MAX_ENTRIES);
      }

      // Save to AsyncStorage
      const storageKey = mode === GAME_MODES.CLASSIC 
        ? LEADERBOARD_KEYS.CLASSIC 
        : LEADERBOARD_KEYS.RUSH;

      await AsyncStorage.setItem(storageKey, JSON.stringify(leaderboard));

      console.log(`📊 Score added to ${mode} leaderboard: ${entry.score}`);

      // Check if entry made it to top 10
      const rank = leaderboard.findIndex(e => e.timestamp === newEntry.timestamp) + 1;
      return rank;
    } catch (error) {
      console.error('Error adding score to leaderboard:', error);
      return false;
    }
  }

  /**
   * Get leaderboard for a specific mode
   * @param {string} mode - Game mode
   * @returns {Array} Sorted leaderboard entries
   */
  async getLeaderboard(mode) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (mode !== GAME_MODES.CLASSIC && mode !== GAME_MODES.RUSH) {
      return [];
    }

    return this.leaderboards[mode] || [];
  }

  /**
   * Get player's rank in a specific mode
   * @param {string} mode - Game mode
   * @param {number} score - Player's score
   * @returns {number} Rank (1-indexed), or null if not in top 10
   */
  async getPlayerRank(mode, score) {
    const leaderboard = await this.getLeaderboard(mode);
    const rank = leaderboard.findIndex(entry => entry.score === score) + 1;
    return rank > 0 ? rank : null;
  }

  /**
   * Check if score qualifies for leaderboard
   * @param {string} mode - Game mode
   * @param {number} score - Score to check
   * @returns {boolean} True if score would make top 10
   */
  async qualifiesForLeaderboard(mode, score) {
    const leaderboard = await this.getLeaderboard(mode);

    if (leaderboard.length < MAX_ENTRIES) {
      return true; // Leaderboard not full yet
    }

    const lowestScore = leaderboard[leaderboard.length - 1].score;
    return score > lowestScore;
  }

  /**
   * Get time until next weekly reset
   * @returns {number} Milliseconds until reset
   */
  getTimeUntilReset() {
    const timeSinceReset = Date.now() - this.lastResetDate;
    const timeUntilReset = WEEK_IN_MS - timeSinceReset;
    return Math.max(0, timeUntilReset);
  }

  /**
   * Format time until reset as human-readable string
   * @returns {string} "X days Y hours"
   */
  getTimeUntilResetFormatted() {
    const ms = this.getTimeUntilReset();
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  }
}

// Singleton instance
const leaderboardManager = new LeaderboardManager();
export default leaderboardManager;

