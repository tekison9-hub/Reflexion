import { analytics } from './AnalyticsService';

class AdService {
  constructor() {
    this.isInitialized = false;
    this.sessionCount = 0;
    this.lastInterstitialTime = 0;
  }

  async initialize() {
    if (this.isInitialized) return;
    try {
      // In production: Initialize AdMob
      // await AdMobRewarded.setAdUnitID('ca-app-pub-xxxxx');
      // await AdMobInterstitial.setAdUnitID('ca-app-pub-xxxxx');
      this.isInitialized = true;
      console.log('✅ Ad service initialized (Demo Mode)');
    } catch (error) {
      console.warn('Ad initialization failed:', error);
    }
  }

  async showRewardedAd(rewardType) {
    return new Promise((resolve) => {
      console.log(`📺 [AD] Showing rewarded ad: ${rewardType}`);
      analytics.logAdWatch(rewardType);
      
      // Simulate ad watch delay
      setTimeout(() => {
        resolve({ success: true });
      }, 2000);
    });
  }

  async showInterstitialAd() {
    const now = Date.now();
    
    // Rate limit: max 1 interstitial per 3 minutes
    if (now - this.lastInterstitialTime < 180000) {
      return { success: false, reason: 'rate_limited' };
    }
    
    this.sessionCount++;
    
    // Show every 3rd session
    if (this.sessionCount % 3 !== 0) {
      return { success: false, reason: 'session_count' };
    }
    
    console.log('📺 [AD] Showing interstitial ad');
    analytics.logAdWatch('interstitial');
    this.lastInterstitialTime = now;
    
    return { success: true };
  }
}

// Singleton instance
const adService = new AdService();
export default adService;
export { adService };
