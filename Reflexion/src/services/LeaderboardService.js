/**
 * REFLEXXP ULTIMATE - LEADERBOARD SERVICE
 * Global and weekly leaderboards with Firebase integration
 * 
 * Features:
 * - Global Top 10 rankings
 * - Weekly Top 10 rankings
 * - Anti-cheat score validation
 * - Local caching (5 minutes)
 * - Fallback to local-only mode if Firebase unavailable
 * - Anonymous user support
 */

/**
 * REFLEXXP ULTIMATE - LEADERBOARD SERVICE
 * Firebase Web SDK compatible with Expo Go
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { firestore, auth } from '../config/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

const STORAGE_KEYS = {
  USER_ID: '@reflexxp_user_id',
  USER_NAME: '@reflexxp_user_name',
  LOCAL_LEADERBOARD: '@reflexxp_local_leaderboard',
  CACHE_GLOBAL: '@reflexxp_cache_global',
  CACHE_WEEKLY: '@reflexxp_cache_weekly',
  CACHE_TIMESTAMP: '@reflexxp_cache_timestamp',
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_SCORE_LIMIT = 1000000; // Anti-cheat: maximum possible score
const MIN_GAME_DURATION = 10; // Anti-cheat: minimum game duration in seconds

class LeaderboardService {
  constructor() {
    this.userId = null;
    this.playerName = 'Player';
    this.isFirebaseAvailable = false;
    this.localLeaderboard = [];
    this.cachedGlobal = null;
    this.cachedWeekly = null;
    this.cacheTimestamp = 0;
    this.isInitialized = false;
  }

  /**
   * Initialize leaderboard service
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('🏆 LeaderboardService already initialized');
      return;
    }

    try {
      console.log('🏆 Initializing LeaderboardService...');

      // Check if Firebase is available
      this.isFirebaseAvailable = firestore !== null;

      // Get or create user ID
      let userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!userId) {
        userId = this.generateUserId();
        await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
      }
      this.userId = userId;

      // Get player name
      const name = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
      if (name) {
        this.playerName = name;
      }

      // Load local leaderboard
      const localData = await AsyncStorage.getItem(STORAGE_KEYS.LOCAL_LEADERBOARD);
      this.localLeaderboard = localData ? JSON.parse(localData) : [];

      // Load cache
      await this.loadCache();

      this.isInitialized = true;
      console.log('✅ LeaderboardService initialized');
      console.log(`🏆 Mode: ${this.isFirebaseAvailable ? 'Cloud' : 'Local-only'}`);
      console.log(`👤 User ID: ${this.userId}`);
    } catch (error) {
      console.error('❌ LeaderboardService initialization failed:', error);
    }
  }

  /**
   * Submit score to leaderboard
   */
  async submitScore(scoreData) {
    try {
      const {
        score,
        level,
        mode,
        gameDuration,
        maxCombo,
        accuracy,
      } = scoreData;

      // Anti-cheat validation
      if (!this.validateScore(scoreData)) {
        console.warn('⚠️ Score validation failed - not submitted');
        return { success: false, reason: 'validation_failed' };
      }

      const entry = {
        userId: this.userId,
        playerName: this.playerName,
        score,
        level,
        mode,
        timestamp: Date.now(),
        weekId: this.getWeekId(),
        maxCombo,
        accuracy,
        verified: true,
      };

      // Always save to local leaderboard
      await this.saveToLocal(entry);

      // Try to save to Firebase if available
      if (this.isFirebaseAvailable) {
        try {
          await this.saveToFirebase(entry);
          console.log('✅ Score submitted to cloud leaderboard');
        } catch (error) {
          console.warn('⚠️ Failed to submit to cloud, saved locally:', error);
        }
      }

      // Invalidate cache
      this.invalidateCache();

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to submit score:', error);
      return { success: false, reason: 'error' };
    }
  }

  /**
   * Get global top 10 leaderboard
   */
  async getGlobalLeaderboard(mode = 'all') {
    try {
      // Check cache first
      if (this.isCacheValid() && this.cachedGlobal) {
        console.log('📊 Using cached global leaderboard');
        return this.filterByMode(this.cachedGlobal, mode);
      }

      let leaderboard;

      if (this.isFirebaseAvailable) {
        leaderboard = await this.fetchGlobalFromFirebase(mode);
        this.cachedGlobal = leaderboard;
      } else {
        leaderboard = this.getGlobalFromLocal(mode);
      }

      await this.saveCache();
      return leaderboard;
    } catch (error) {
      console.error('❌ Failed to get global leaderboard:', error);
      return this.getGlobalFromLocal(mode);
    }
  }

  /**
   * Get weekly top 10 leaderboard
   */
  async getWeeklyLeaderboard(mode = 'all') {
    try {
      // Check cache first
      if (this.isCacheValid() && this.cachedWeekly) {
        console.log('📊 Using cached weekly leaderboard');
        return this.filterByMode(this.cachedWeekly, mode);
      }

      let leaderboard;

      if (this.isFirebaseAvailable) {
        leaderboard = await this.fetchWeeklyFromFirebase(mode);
        this.cachedWeekly = leaderboard;
      } else {
        leaderboard = this.getWeeklyFromLocal(mode);
      }

      await this.saveCache();
      return leaderboard;
    } catch (error) {
      console.error('❌ Failed to get weekly leaderboard:', error);
      return this.getWeeklyFromLocal(mode);
    }
  }

  /**
   * Get player's rank in leaderboard
   */
  async getPlayerRank(mode = 'all') {
    try {
      const global = await this.getGlobalLeaderboard(mode);
      const rank = global.findIndex(entry => entry.userId === this.userId);
      return rank >= 0 ? rank + 1 : null;
    } catch (error) {
      console.error('❌ Failed to get player rank:', error);
      return null;
    }
  }

  /**
   * Set player name
   */
  async setPlayerName(name) {
    try {
      this.playerName = name.trim() || 'Player';
      await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, this.playerName);
      console.log(`👤 Player name set to: ${this.playerName}`);
    } catch (error) {
      console.error('❌ Failed to set player name:', error);
    }
  }

  /**
   * Refresh leaderboards (pull-to-refresh)
   */
  async refresh() {
    this.invalidateCache();
    await this.getGlobalLeaderboard();
    await this.getWeeklyLeaderboard();
    console.log('🔄 Leaderboards refreshed');
  }

  // ========================================
  // FIREBASE METHODS
  // ========================================

  /**
   * Save entry to Firebase
   */
  async saveToFirebase(entry) {
    if (!this.isFirebaseAvailable) return;

    const docData = {
      ...entry,
      timestamp: Timestamp.fromMillis(entry.timestamp),
    };

    await addDoc(collection(firestore, 'leaderboards'), docData);
  }

  /**
   * Fetch global leaderboard from Firebase
   */
  async fetchGlobalFromFirebase(mode) {
    if (!this.isFirebaseAvailable) return [];

    const constraints = [
      orderBy('score', 'desc'),
      limit(10),
    ];

    if (mode !== 'all') {
      constraints.unshift(where('mode', '==', mode));
    }

    const q = query(collection(firestore, 'leaderboards'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc, index) => ({
      ...doc.data(),
      timestamp: doc.data().timestamp?.toMillis() || Date.now(),
      rank: index + 1,
    }));
  }

  /**
   * Fetch weekly leaderboard from Firebase
   */
  async fetchWeeklyFromFirebase(mode) {
    if (!this.isFirebaseAvailable) return [];

    const currentWeek = this.getWeekId();

    const constraints = [
      where('weekId', '==', currentWeek),
      orderBy('score', 'desc'),
      limit(10),
    ];

    if (mode !== 'all') {
      constraints.push(where('mode', '==', mode));
    }

    const q = query(collection(firestore, 'leaderboards'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc, index) => ({
      ...doc.data(),
      timestamp: doc.data().timestamp?.toMillis() || Date.now(),
      rank: index + 1,
    }));
  }

  // ========================================
  // LOCAL STORAGE METHODS
  // ========================================

  /**
   * Save entry to local storage
   */
  async saveToLocal(entry) {
    this.localLeaderboard.push(entry);

    // Keep only best 100 scores
    this.localLeaderboard.sort((a, b) => b.score - a.score);
    if (this.localLeaderboard.length > 100) {
      this.localLeaderboard = this.localLeaderboard.slice(0, 100);
    }

    await AsyncStorage.setItem(
      STORAGE_KEYS.LOCAL_LEADERBOARD,
      JSON.stringify(this.localLeaderboard)
    );
  }

  /**
   * Get global leaderboard from local storage
   */
  getGlobalFromLocal(mode) {
    let entries = [...this.localLeaderboard];

    if (mode !== 'all') {
      entries = entries.filter(e => e.mode === mode);
    }

    return entries.slice(0, 10).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  /**
   * Get weekly leaderboard from local storage
   */
  getWeeklyFromLocal(mode) {
    const currentWeek = this.getWeekId();
    let entries = this.localLeaderboard.filter(e => e.weekId === currentWeek);

    if (mode !== 'all') {
      entries = entries.filter(e => e.mode === mode);
    }

    entries.sort((a, b) => b.score - a.score);

    return entries.slice(0, 10).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  // ========================================
  // CACHE METHODS
  // ========================================

  /**
   * Load cache from storage
   */
  async loadCache() {
    try {
      const globalCache = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_GLOBAL);
      const weeklyCache = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_WEEKLY);
      const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_TIMESTAMP);

      if (globalCache) this.cachedGlobal = JSON.parse(globalCache);
      if (weeklyCache) this.cachedWeekly = JSON.parse(weeklyCache);
      if (timestamp) this.cacheTimestamp = parseInt(timestamp, 10);
    } catch (error) {
      console.warn('⚠️ Failed to load cache:', error);
    }
  }

  /**
   * Save cache to storage
   */
  async saveCache() {
    try {
      this.cacheTimestamp = Date.now();

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.CACHE_GLOBAL, JSON.stringify(this.cachedGlobal)],
        [STORAGE_KEYS.CACHE_WEEKLY, JSON.stringify(this.cachedWeekly)],
        [STORAGE_KEYS.CACHE_TIMESTAMP, this.cacheTimestamp.toString()],
      ]);
    } catch (error) {
      console.warn('⚠️ Failed to save cache:', error);
    }
  }

  /**
   * Check if cache is still valid
   */
  isCacheValid() {
    const now = Date.now();
    return (now - this.cacheTimestamp) < CACHE_DURATION;
  }

  /**
   * Invalidate cache
   */
  invalidateCache() {
    this.cacheTimestamp = 0;
    this.cachedGlobal = null;
    this.cachedWeekly = null;
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Validate score (anti-cheat)
   */
  validateScore(scoreData) {
    const { score, gameDuration, level, maxCombo } = scoreData;

    // Check score is within reasonable limits
    if (score < 0 || score > MAX_SCORE_LIMIT) {
      console.warn('⚠️ Score out of bounds:', score);
      return false;
    }

    // Check game duration is reasonable
    if (gameDuration && gameDuration < MIN_GAME_DURATION) {
      console.warn('⚠️ Game duration too short:', gameDuration);
      return false;
    }

    // Check combo is reasonable for score
    if (maxCombo > score / 10) {
      console.warn('⚠️ Combo unreasonably high:', maxCombo);
      return false;
    }

    // Check level is reasonable
    if (level > 200) {
      console.warn('⚠️ Level unreasonably high:', level);
      return false;
    }

    return true;
  }

  /**
   * Generate anonymous user ID
   */
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get or create anonymous user ID (Firebase Auth compatible)
   */
  async getOrCreateAnonymousId() {
    try {
      // Try to get existing anonymous ID
      let id = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
      
      if (!id) {
        // Try Firebase anonymous auth if available
        if (auth && auth.currentUser) {
          id = auth.currentUser.uid;
        } else {
          // Generate local anonymous ID
          id = this.generateUserId();
        }
        
        await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, id);
        console.log('🆔 Created anonymous user ID:', id);
      }
      
      return id;
    } catch (error) {
      console.error('❌ Failed to get/create anonymous ID:', error);
      return this.generateUserId();
    }
  }

  /**
   * Get current week ID (YYYY-WW format)
   */
  getWeekId() {
    const now = new Date();
    const year = now.getFullYear();
    const week = this.getWeekNumber(now);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  /**
   * Get week number of year
   */
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Filter leaderboard by mode
   */
  filterByMode(leaderboard, mode) {
    if (!leaderboard || mode === 'all') return leaderboard;
    return leaderboard.filter(entry => entry.mode === mode);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isFirebaseAvailable: this.isFirebaseAvailable,
      userId: this.userId,
      playerName: this.playerName,
      localEntries: this.localLeaderboard.length,
      cacheValid: this.isCacheValid(),
    };
  }
}

// Singleton instance
const leaderboardService = new LeaderboardService();
export default leaderboardService;
export { leaderboardService };

