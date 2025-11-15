/**
 * REFLEXXP ULTIMATE - PROGRESS TRACKER SERVICE
 * Advanced player statistics and improvement tracking
 * 
 * Features:
 * - Daily/Weekly/Monthly statistics
 * - Reaction time tracking (last 100 taps)
 * - Score progression analysis
 * - Improvement percentage calculation
 * - 7-day chart data preparation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  DAILY_STATS: '@reflexxp_daily_stats',
  REACTION_TIMES: '@reflexxp_reaction_times',
  GAME_SESSIONS: '@reflexxp_game_sessions',
  MILESTONES: '@reflexxp_milestones',
};

class ProgressTracker {
  constructor() {
    this.dailyStats = {};
    this.reactionTimes = [];
    this.gameSessions = [];
    this.isInitialized = false;
  }

  /**
   * Initialize progress tracker
   * Load all saved data from AsyncStorage
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('📊 ProgressTracker already initialized');
      return;
    }

    try {
      console.log('📊 Initializing ProgressTracker...');

      // Load daily stats
      const dailyData = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_STATS);
      this.dailyStats = dailyData ? JSON.parse(dailyData) : {};

      // Load reaction times
      const reactionData = await AsyncStorage.getItem(STORAGE_KEYS.REACTION_TIMES);
      this.reactionTimes = reactionData ? JSON.parse(reactionData) : [];

      // Load game sessions
      const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.GAME_SESSIONS);
      this.gameSessions = sessionData ? JSON.parse(sessionData) : [];

      this.isInitialized = true;
      console.log('✅ ProgressTracker initialized');
      console.log(`📊 Loaded ${Object.keys(this.dailyStats).length} days of data`);
      console.log(`📊 Loaded ${this.gameSessions.length} game sessions`);
    } catch (error) {
      console.error('❌ ProgressTracker initialization failed:', error);
    }
  }

  /**
   * Record a completed game session
   * Call this after every game ends
   */
  async recordGameSession(sessionData) {
    try {
      const {
        score,
        maxCombo,
        accuracy,
        xpEarned,
        coinsEarned,
        mode,
        reactionTimes, // Array of individual tap reaction times
        duration,
        level,
      } = sessionData;

      const today = this.getTodayKey();
      const now = Date.now();

      // Create session record
      const session = {
        timestamp: now,
        date: today,
        score,
        maxCombo,
        accuracy,
        xpEarned,
        coinsEarned,
        mode,
        duration,
        level,
        avgReactionTime: this.calculateAverage(reactionTimes),
      };

      // Add to sessions history
      this.gameSessions.push(session);

      // Keep only last 100 sessions
      if (this.gameSessions.length > 100) {
        this.gameSessions = this.gameSessions.slice(-100);
      }

      // Update daily stats
      if (!this.dailyStats[today]) {
        this.dailyStats[today] = {
          date: today,
          gamesPlayed: 0,
          totalScore: 0,
          totalXP: 0,
          totalCoins: 0,
          bestScore: 0,
          bestCombo: 0,
          totalReactionTime: 0,
          reactionTimeCount: 0,
        };
      }

      const dayStats = this.dailyStats[today];
      dayStats.gamesPlayed += 1;
      dayStats.totalScore += score;
      dayStats.totalXP += xpEarned;
      dayStats.totalCoins += coinsEarned;
      dayStats.bestScore = Math.max(dayStats.bestScore, score);
      dayStats.bestCombo = Math.max(dayStats.bestCombo, maxCombo);

      // Update reaction times
      if (reactionTimes && reactionTimes.length > 0) {
        this.reactionTimes.push(...reactionTimes);
        
        // Keep only last 100 reaction times
        if (this.reactionTimes.length > 100) {
          this.reactionTimes = this.reactionTimes.slice(-100);
        }

        // Update daily averages
        const avgReaction = this.calculateAverage(reactionTimes);
        dayStats.totalReactionTime += avgReaction * reactionTimes.length;
        dayStats.reactionTimeCount += reactionTimes.length;
      }

      // Save to storage
      await this.saveData();

      console.log('✅ Game session recorded:', {
        score,
        avgReactionTime: session.avgReactionTime,
        mode,
      });
    } catch (error) {
      console.error('❌ Failed to record game session:', error);
    }
  }

  /**
   * Get 7-day chart data for reaction times
   * Returns array suitable for react-native-chart-kit
   */
  getLast7DaysReactionData() {
    const days = this.getLast7Days();
    const data = days.map(day => {
      const dayStats = this.dailyStats[day];
      if (!dayStats || dayStats.reactionTimeCount === 0) {
        return 0;
      }
      return Math.round(dayStats.totalReactionTime / dayStats.reactionTimeCount);
    });

    return {
      labels: days.map(d => this.formatDayLabel(d)),
      datasets: [{ data }],
    };
  }

  /**
   * Get 7-day chart data for scores
   */
  getLast7DaysScoreData() {
    const days = this.getLast7Days();
    const data = days.map(day => {
      const dayStats = this.dailyStats[day];
      return dayStats ? dayStats.bestScore : 0;
    });

    return {
      labels: days.map(d => this.formatDayLabel(d)),
      datasets: [{ data }],
    };
  }

  /**
   * Get 7-day chart data for XP earned
   */
  getLast7DaysXPData() {
    const days = this.getLast7Days();
    const data = days.map(day => {
      const dayStats = this.dailyStats[day];
      return dayStats ? dayStats.totalXP : 0;
    });

    return {
      labels: days.map(d => this.formatDayLabel(d)),
      datasets: [{ data }],
    };
  }

  /**
   * Calculate improvement percentage
   * Compares this week vs last week
   */
  getImprovementPercentage(metric = 'reactionTime') {
    try {
      const thisWeek = this.getThisWeekStats();
      const lastWeek = this.getLastWeekStats();

      let thisWeekValue, lastWeekValue;

      switch (metric) {
        case 'reactionTime':
          thisWeekValue = thisWeek.avgReactionTime;
          lastWeekValue = lastWeek.avgReactionTime;
          // Lower is better for reaction time
          if (!lastWeekValue || lastWeekValue === 0) return 0;
          return ((lastWeekValue - thisWeekValue) / lastWeekValue) * 100;

        case 'score':
          thisWeekValue = thisWeek.avgScore;
          lastWeekValue = lastWeek.avgScore;
          break;

        case 'accuracy':
          thisWeekValue = thisWeek.avgAccuracy;
          lastWeekValue = lastWeek.avgAccuracy;
          break;

        case 'combo':
          thisWeekValue = thisWeek.bestCombo;
          lastWeekValue = lastWeek.bestCombo;
          break;

        default:
          return 0;
      }

      if (!lastWeekValue || lastWeekValue === 0) return 0;
      return ((thisWeekValue - lastWeekValue) / lastWeekValue) * 100;
    } catch (error) {
      console.warn('⚠️ Failed to calculate improvement:', error);
      return 0;
    }
  }

  /**
   * Get this week's stats summary
   */
  getThisWeekStats() {
    const days = this.getLast7Days();
    return this.calculatePeriodStats(days);
  }

  /**
   * Get last week's stats summary
   */
  getLastWeekStats() {
    const days = this.getLast7Days(7); // Offset by 7 days
    return this.calculatePeriodStats(days);
  }

  /**
   * Calculate aggregate stats for a period
   */
  calculatePeriodStats(days) {
    let totalScore = 0;
    let totalXP = 0;
    let totalGames = 0;
    let bestCombo = 0;
    let totalReactionTime = 0;
    let reactionTimeCount = 0;

    days.forEach(day => {
      const dayStats = this.dailyStats[day];
      if (dayStats) {
        totalScore += dayStats.totalScore;
        totalXP += dayStats.totalXP;
        totalGames += dayStats.gamesPlayed;
        bestCombo = Math.max(bestCombo, dayStats.bestCombo);
        totalReactionTime += dayStats.totalReactionTime;
        reactionTimeCount += dayStats.reactionTimeCount;
      }
    });

    return {
      totalGames,
      totalScore,
      totalXP,
      avgScore: totalGames > 0 ? Math.round(totalScore / totalGames) : 0,
      bestCombo,
      avgReactionTime: reactionTimeCount > 0 
        ? Math.round(totalReactionTime / reactionTimeCount) 
        : 0,
    };
  }

  /**
   * Get overall statistics
   */
  getOverallStats() {
    const allDays = Object.keys(this.dailyStats);
    const stats = this.calculatePeriodStats(allDays);

    // Add additional lifetime stats
    const allSessions = this.gameSessions;
    const bestSession = allSessions.reduce((best, session) => {
      return session.score > (best?.score || 0) ? session : best;
    }, null);

    return {
      ...stats,
      totalDaysPlayed: allDays.length,
      bestScore: bestSession?.score || 0,
      bestCombo: bestSession?.maxCombo || 0,
      fastestReactionTime: Math.min(...this.reactionTimes, 1000),
    };
  }

  /**
   * Get recent sessions (last N)
   */
  getRecentSessions(count = 10) {
    return this.gameSessions.slice(-count).reverse();
  }

  /**
   * Clear all progress data (use with caution)
   */
  async clearAllData() {
    try {
      this.dailyStats = {};
      this.reactionTimes = [];
      this.gameSessions = [];

      await AsyncStorage.multiRemove([
        STORAGE_KEYS.DAILY_STATS,
        STORAGE_KEYS.REACTION_TIMES,
        STORAGE_KEYS.GAME_SESSIONS,
      ]);

      console.log('🗑️ All progress data cleared');
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Save all data to AsyncStorage
   */
  async saveData() {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.DAILY_STATS, JSON.stringify(this.dailyStats)],
        [STORAGE_KEYS.REACTION_TIMES, JSON.stringify(this.reactionTimes)],
        [STORAGE_KEYS.GAME_SESSIONS, JSON.stringify(this.gameSessions)],
      ]);
    } catch (error) {
      console.error('❌ Failed to save progress data:', error);
    }
  }

  /**
   * Get today's date key (YYYY-MM-DD)
   */
  getTodayKey() {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Get last N days as date keys
   */
  getLast7Days(offset = 0) {
    const days = [];
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i - offset);
      days.unshift(date.toISOString().split('T')[0]);
    }
    
    return days;
  }

  /**
   * Format day label for charts (Mon, Tue, etc.)
   */
  formatDayLabel(dateKey) {
    const date = new Date(dateKey + 'T00:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }

  /**
   * Calculate average of array
   */
  calculateAverage(array) {
    if (!array || array.length === 0) return 0;
    const sum = array.reduce((acc, val) => acc + val, 0);
    return sum / array.length;
  }

  /**
   * Get progress status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      totalDays: Object.keys(this.dailyStats).length,
      totalSessions: this.gameSessions.length,
      reactionTimeSamples: this.reactionTimes.length,
    };
  }
}

// Singleton instance
const progressTracker = new ProgressTracker();
export default progressTracker;
export { progressTracker };






