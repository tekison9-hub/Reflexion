/**
 * REFLEXION v5.0 - DAILY CHALLENGE SERVICE
 * Seeded random pattern generator for fair global competition
 * All players get same pattern each day
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class DailyChallengeService {
  constructor() {
    this.currentChallenge = null;
    this.userBestScore = 0;
  }

  async initialize() {
    await this.loadDailyChallenge();
  }

  /**
   * Generate same pattern for all users based on date
   * Uses seeded random to ensure fairness
   */
  generateDailyPattern(date) {
    const seed = this.dateToSeed(date);
    const random = this.seededRandom(seed);
    
    const targets = [];
    for (let i = 0; i < 20; i++) {
      targets.push({
        x: random() * 0.8 + 0.1, // 0.1 to 0.9 (normalized)
        y: random() * 0.8 + 0.1,
        delay: i * 800, // 800ms between targets
      });
    }
    
    return targets;
  }

  /**
   * Convert date to seed number
   */
  dateToSeed(date) {
    const d = new Date(date);
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  /**
   * Seeded random number generator (Linear Congruential Generator)
   */
  seededRandom(seed) {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }

  /**
   * Load or create daily challenge
   */
  async loadDailyChallenge() {
    const today = new Date().toISOString().split('T')[0];
    const stored = await AsyncStorage.getItem('@daily_challenge');
    
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        this.currentChallenge = data;
        return;
      }
    }

    // Create new daily challenge
    const pattern = this.generateDailyPattern(today);
    this.currentChallenge = {
      date: today,
      pattern,
      attempts: 0,
      bestScore: 0,
      completed: false,
    };

    await this.saveChallenge();
  }

  /**
   * Submit score for daily challenge
   */
  async submitScore(score) {
    if (!this.currentChallenge) return;

    this.currentChallenge.attempts += 1;
    this.currentChallenge.bestScore = Math.max(
      this.currentChallenge.bestScore,
      score
    );
    this.currentChallenge.completed = true;

    await this.saveChallenge();
  }

  /**
   * Save challenge to storage
   */
  async saveChallenge() {
    await AsyncStorage.setItem(
      '@daily_challenge',
      JSON.stringify(this.currentChallenge)
    );
  }

  /**
   * Get current challenge
   */
  getChallenge() {
    return this.currentChallenge;
  }

  /**
   * Get time until next challenge
   */
  getTimeUntilNext() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }
}

// Singleton instance
const dailyChallengeService = new DailyChallengeService();
export default dailyChallengeService;
export { dailyChallengeService };





