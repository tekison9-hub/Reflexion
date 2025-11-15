class AnalyticsService {
  logEvent(eventName, params = {}) {
    console.log(`📊 [Analytics] ${eventName}`, params);
    // In production: Firebase Analytics
    // Analytics.logEvent(eventName, params);
  }

  logGameStart() {
    this.logEvent('game_start', { timestamp: Date.now() });
  }

  logGameOver(score, combo, coins, xp) {
    this.logEvent('game_over', { score, combo, coins, xp });
  }

  logAdWatch(adType) {
    this.logEvent('ad_watch', { adType, timestamp: Date.now() });
  }

  logLevelUp(newLevel, totalXP) {
    this.logEvent('level_up', { level: newLevel, totalXP });
  }

  logRewardClaim(rewardType, amount) {
    this.logEvent('reward_claim', { rewardType, amount });
  }
}

export const analytics = new AnalyticsService();
