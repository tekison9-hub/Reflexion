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
  SPEED_TEST: '@leaderboard_speed_test', // === AAA LEADERBOARD: Speed Test support ===
  LAST_RESET: '@leaderboard_last_reset',
};

const MAX_ENTRIES = 10; // Top 10 per mode
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class LeaderboardManager {
  constructor() {
    this.leaderboards = {
      [GAME_MODES.CLASSIC]: [],
      [GAME_MODES.RUSH]: [],
      [GAME_MODES.SPEED_TEST]: [], // === AAA LEADERBOARD: Speed Test support ===
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

      // === AAA LEADERBOARD: Load Speed Test leaderboard ===
      const speedTestData = await AsyncStorage.getItem(LEADERBOARD_KEYS.SPEED_TEST);
      this.leaderboards[GAME_MODES.SPEED_TEST] = speedTestData ? JSON.parse(speedTestData) : [];

      // Load last reset date
      const lastResetData = await AsyncStorage.getItem(LEADERBOARD_KEYS.LAST_RESET);
      this.lastResetDate = lastResetData ? parseInt(lastResetData) : Date.now();

      console.log(`📊 Loaded leaderboards: Classic (${this.leaderboards[GAME_MODES.CLASSIC].length}), Rush (${this.leaderboards[GAME_MODES.RUSH].length}), Speed Test (${this.leaderboards[GAME_MODES.SPEED_TEST].length})`);
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
      this.leaderboards[GAME_MODES.SPEED_TEST] = []; // === AAA LEADERBOARD: Reset Speed Test ===
      this.lastResetDate = Date.now();

      // Save to AsyncStorage
      await AsyncStorage.setItem(LEADERBOARD_KEYS.CLASSIC, JSON.stringify([]));
      await AsyncStorage.setItem(LEADERBOARD_KEYS.RUSH, JSON.stringify([]));
      await AsyncStorage.setItem(LEADERBOARD_KEYS.SPEED_TEST, JSON.stringify([])); // === AAA LEADERBOARD: Reset Speed Test ===
      await AsyncStorage.setItem(LEADERBOARD_KEYS.LAST_RESET, this.lastResetDate.toString());

      console.log('✅ Leaderboards reset successfully');
    } catch (error) {
      console.error('Error resetting leaderboards:', error);
    }
  }

  /**
   * Add a score to the leaderboard
   * @param {string} mode - Game mode (CLASSIC, RUSH, or SPEED_TEST)
   * @param {object} entry - Score entry { score, combo, timestamp, playerName, time (for Speed Test), targetCount (for Speed Test) }
   */
  async addScore(mode, entry) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (mode !== GAME_MODES.CLASSIC && mode !== GAME_MODES.RUSH && mode !== GAME_MODES.SPEED_TEST) {
      console.warn(`Invalid mode: ${mode}`);
      return false;
    }

    try {
      // ✅ FIX: Speed Test için target count'a göre ayrı key kullan
      let storageKey;
      if (mode === GAME_MODES.SPEED_TEST) {
        const targetCount = entry.targetCount || 50;
        storageKey = `@leaderboard_speed_test_${targetCount}`; // Örn: @leaderboard_speed_test_20
      } else if (mode === GAME_MODES.CLASSIC) {
        storageKey = LEADERBOARD_KEYS.CLASSIC;
      } else if (mode === GAME_MODES.RUSH) {
        storageKey = LEADERBOARD_KEYS.RUSH;
      } else {
        return false;
      }

      // Mevcut leaderboard'u al
      const data = await AsyncStorage.getItem(storageKey);
      let leaderboard = data ? JSON.parse(data) : [];

      // === AAA LEADERBOARD: Speed Test uses time, others use score ===
      const isSpeedTest = mode === GAME_MODES.SPEED_TEST;
      
      // Yeni entry ekle
      const newEntry = {
        score: entry.score || 0,
        combo: entry.combo || 0,
        // FIX: Speed Test için time field'ını doğru set et (saniye cinsinden)
        time: isSpeedTest ? (entry.time !== null && entry.time !== undefined ? parseFloat(entry.time) : null) : null,
        targetCount: entry.targetCount || null,
        timestamp: entry.timestamp || Date.now(),
        playerName: entry.playerName || 'Player',
      };

      leaderboard.push(newEntry);

      // === FIX: Sort by time (ascending) for Speed Test, score (descending) for others ===
      if (isSpeedTest) {
        // FIX: Speed Test - EN DÜŞÜK SÜRE EN ÜSTTE (Küçükten büyüğe sıralama)
        leaderboard.sort((a, b) => {
          const timeA = a.time !== null && a.time !== undefined ? parseFloat(a.time) : Infinity;
          const timeB = b.time !== null && b.time !== undefined ? parseFloat(b.time) : Infinity;
          
          // Önce süreye göre sırala (küçükten büyüğe: 5.2s üstte, 15.5s altta)
          if (timeA !== timeB) {
            return timeA - timeB; // ✅ DOĞRU: Küçükten büyüğe
          }
          
          // Süreler eşitse timestamp'e göre (daha yeni üstte)
          return (b.timestamp || 0) - (a.timestamp || 0);
        });
      } else {
        // Classic/Rush: Higher score is better (descending order)
        leaderboard.sort((a, b) => b.score - a.score);
      }

      // Top 10'u kaydet
      leaderboard = leaderboard.slice(0, MAX_ENTRIES);
      await AsyncStorage.setItem(storageKey, JSON.stringify(leaderboard));

      const displayValue = isSpeedTest ? `${entry.time?.toFixed(1)}s` : entry.score;
      console.log(`✅ Leaderboard updated (${mode}${isSpeedTest ? ` - ${entry.targetCount || 50} targets` : ''}):`, leaderboard.map(e => e.time || e.score));

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
   * @param {number} targetCount - Target count for Speed Test (optional)
   * @returns {Array} Sorted leaderboard entries
   */
  async getLeaderboard(mode, targetCount = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      let storageKey;
      if (mode === GAME_MODES.SPEED_TEST && targetCount) {
        storageKey = `@leaderboard_speed_test_${targetCount}`;
      } else if (mode === GAME_MODES.SPEED_TEST) {
        storageKey = '@leaderboard_speed_test_50'; // Default 50
      } else if (mode === GAME_MODES.CLASSIC) {
        storageKey = LEADERBOARD_KEYS.CLASSIC;
      } else if (mode === GAME_MODES.RUSH) {
        storageKey = LEADERBOARD_KEYS.RUSH;
      } else {
        return [];
      }

      const data = await AsyncStorage.getItem(storageKey);
      let leaderboard = data ? JSON.parse(data) : [];
      
      // FIX: Tekrar sırala (güvenlik için) - Speed Test için küçükten büyüğe
      if (mode === GAME_MODES.SPEED_TEST) {
        return leaderboard.sort((a, b) => {
          const timeA = a.time !== null && a.time !== undefined ? parseFloat(a.time) : Infinity;
          const timeB = b.time !== null && b.time !== undefined ? parseFloat(b.time) : Infinity;
          
          if (timeA !== timeB) {
            return timeA - timeB; // ✅ Küçükten büyüğe (5.2s üstte)
          }
          
          return (b.timestamp || 0) - (a.timestamp || 0);
        });
      }
      
      // Classic/Rush: Yüksekten düşüğe
      return leaderboard.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('❌ getLeaderboard error:', error);
      return [];
    }
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

