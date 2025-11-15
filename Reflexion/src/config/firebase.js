/**
 * REFLEXION v6.0 - FIREBASE CONFIGURATION (SDK54 READY)
 * 
 * SETUP INSTRUCTIONS (2 minutes):
 * 1. Go to https://console.firebase.google.com/
 * 2. Create new project → "Reflexion"
 * 3. Add Web App → Copy config
 * 4. Replace DEMO_CONFIG below with your actual config
 * 5. Enable Realtime Database → Rules: Read/Write for authenticated users
 * 6. Enable Anonymous Authentication
 * 7. Enable Analytics (optional)
 * 
 * Features:
 * - Cloud Leaderboards (Realtime Database)
 * - Cloud Save (player progress sync)
 * - Anonymous Authentication
 * - Analytics (20+ events)
 * - Offline fallback (local-only mode)
 */

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';

// ============================================================================
// FIREBASE CONFIG - REPLACE WITH YOUR ACTUAL CREDENTIALS
// ============================================================================

const DEMO_CONFIG = {
  apiKey: "DEMO-REPLACE-WITH-YOUR-API-KEY",
  authDomain: "reflexion-demo.firebaseapp.com",
  databaseURL: "https://reflexion-demo-default-rtdb.firebaseio.com",
  projectId: "reflexion-demo",
  storageBucket: "reflexion-demo.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:demo",
  measurementId: "G-DEMO"
};

// ============================================================================
// PRODUCTION CONFIG (Replace the object below)
// ============================================================================

const FIREBASE_CONFIG = {
  // TODO: Replace with your actual Firebase config
  ...DEMO_CONFIG,
  
  // EXAMPLE (replace with yours):
  // apiKey: "AIzaSyC...",
  // authDomain: "reflexion-xxxxx.firebaseapp.com",
  // databaseURL: "https://reflexion-xxxxx-default-rtdb.firebaseio.com",
  // projectId: "reflexion-xxxxx",
  // storageBucket: "reflexion-xxxxx.appspot.com",
  // messagingSenderId: "123456789",
  // appId: "1:123456789:web:abcdef",
  // measurementId: "G-XXXXXXXXXX"
};

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

let app = null;
let database = null;
let auth = null;
let analytics = null;
let isFirebaseConfigured = false;

// Check if using demo config
const isDemoConfig = FIREBASE_CONFIG.apiKey === DEMO_CONFIG.apiKey;

if (isDemoConfig) {
  console.warn('⚠️ Firebase not configured (using demo config)');
  console.warn('📝 Leaderboard will work in local-only mode');
  console.warn('💡 To enable cloud sync, replace config in src/config/firebase.js');
} else {
  try {
    // Initialize Firebase
    if (getApps().length === 0) {
      app = initializeApp(FIREBASE_CONFIG);
      database = getDatabase(app);
      auth = getAuth(app);
      
      // Initialize Analytics (web only)
      if (typeof window !== 'undefined') {
        isSupported().then(supported => {
          if (supported) {
            analytics = getAnalytics(app);
            console.log('✅ Firebase Analytics initialized');
          }
        }).catch(e => console.warn('Analytics not supported:', e));
      }
      
      isFirebaseConfigured = true;
      console.log('✅ Firebase initialized successfully');
    } else {
      app = getApps()[0];
      database = getDatabase(app);
      auth = getAuth(app);
      isFirebaseConfigured = true;
    }
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.warn('📝 Falling back to local-only mode');
  }
}

// ============================================================================
// FIREBASE SERVICE
// ============================================================================

export const firebaseService = {
  /**
   * Check if Firebase is properly configured
   */
  isConfigured() {
    return isFirebaseConfigured && !isDemoConfig;
  },

  /**
   * Authenticate user anonymously
   */
  async signInAnonymously() {
    if (!this.isConfigured() || !auth) {
      return { success: false, error: 'Firebase not configured' };
    }

    try {
      const result = await signInAnonymously(auth);
      console.log('✅ Anonymous authentication successful');
      return { success: true, user: result.user };
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return auth?.currentUser || null;
  },

  /**
   * Save player data to cloud
   */
  async savePlayerData(userId, data) {
    if (!this.isConfigured() || !database) {
      return { success: false, error: 'Firebase not configured' };
    }

    try {
      const playerRef = ref(database, `players/${userId}`);
      await set(playerRef, {
        ...data,
        lastUpdated: Date.now(),
      });
      console.log('✅ Player data saved to cloud');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save player data:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Load player data from cloud
   */
  async loadPlayerData(userId) {
    if (!this.isConfigured() || !database) {
      return { success: false, error: 'Firebase not configured' };
    }

    try {
      const playerRef = ref(database, `players/${userId}`);
      const snapshot = await get(playerRef);
      
      if (snapshot.exists()) {
        console.log('✅ Player data loaded from cloud');
        return { success: true, data: snapshot.val() };
      } else {
        return { success: false, error: 'No data found' };
      }
    } catch (error) {
      console.error('❌ Failed to load player data:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Submit score to cloud leaderboard
   */
  async submitScore(mode, scoreData) {
    if (!this.isConfigured() || !database) {
      return { success: false, error: 'Firebase not configured' };
    }

    try {
      const user = this.getCurrentUser();
      if (!user) {
        await this.signInAnonymously();
      }

      const scoreRef = ref(database, `leaderboards/${mode}/${Date.now()}`);
      await set(scoreRef, {
        ...scoreData,
        userId: user?.uid || 'anonymous',
        timestamp: Date.now(),
      });
      
      console.log(`✅ Score submitted to ${mode} leaderboard`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to submit score:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get top scores from cloud leaderboard
   */
  async getLeaderboard(mode, limit = 10) {
    if (!this.isConfigured() || !database) {
      return { success: false, error: 'Firebase not configured', scores: [] };
    }

    try {
      const leaderboardRef = ref(database, `leaderboards/${mode}`);
      const topScoresQuery = query(
        leaderboardRef,
        orderByChild('score'),
        limitToLast(limit)
      );
      
      const snapshot = await get(topScoresQuery);
      
      if (snapshot.exists()) {
        const scores = [];
        snapshot.forEach((child) => {
          scores.push({ id: child.key, ...child.val() });
        });
        
        // Sort descending by score
        scores.sort((a, b) => b.score - a.score);
        
        console.log(`✅ Loaded ${scores.length} scores from ${mode} leaderboard`);
        return { success: true, scores };
      } else {
        return { success: true, scores: [] };
      }
    } catch (error) {
      console.error('❌ Failed to load leaderboard:', error);
      return { success: false, error: error.message, scores: [] };
    }
  },

  /**
   * Log analytics event
   */
  logEvent(eventName, params = {}) {
    if (!this.isConfigured() || !analytics) {
      return;
    }

    try {
      logEvent(analytics, eventName, params);
    } catch (error) {
      console.warn('⚠️ Failed to log analytics event:', error);
    }
  },

  /**
   * Analytics helper methods
   */
  analytics: {
    gameStart: (mode) => firebaseService.logEvent('game_start', { mode }),
    gameOver: (mode, score, combo) => firebaseService.logEvent('game_over', { mode, score, combo }),
    levelUp: (level) => firebaseService.logEvent('level_up', { level }),
    purchaseTheme: (themeId, price) => firebaseService.logEvent('purchase_theme', { theme_id: themeId, price }),
    revive: (adWatched) => firebaseService.logEvent('revive', { ad_watched: adWatched }),
    shareScore: (score) => firebaseService.logEvent('share_score', { score }),
    dailyReward: (streak) => firebaseService.logEvent('daily_reward_claimed', { streak }),
    achievement: (achievementId) => firebaseService.logEvent('achievement_unlocked', { achievement_id: achievementId }),
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export { app, database, auth, analytics };
export default firebaseService;
