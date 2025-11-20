/**
 * ✅ TASK 3: Theme & Currency Sync System
 * Unified theme persistence and real-time updates
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@reflexion_active_theme';
const DEFAULT_THEME = 'theme_default';

class ThemeService {
  constructor() {
    this.currentTheme = DEFAULT_THEME;
    this.subscribers = [];
  }

  /**
   * Get active theme from storage
   * @returns {Promise<string>} Active theme ID
   */
  async getActiveTheme() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.currentTheme = parsed.themeId || DEFAULT_THEME;
        return this.currentTheme;
      }
      return DEFAULT_THEME;
    } catch (error) {
      console.warn('⚠️ ThemeService: Could not load active theme, using default:', error);
      return DEFAULT_THEME;
    }
  }

  /**
   * Set active theme and persist
   * @param {string} themeId - Theme ID to activate
   * @returns {Promise<boolean>} Success status
   */
  async setActiveTheme(themeId) {
    try {
      if (!themeId) {
        console.warn('⚠️ ThemeService: Invalid theme ID');
        return false;
      }

      const data = {
        themeId,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.currentTheme = themeId;
      this.notifySubscribers(themeId);
      console.log(`✅ ThemeService: Active theme set to ${themeId}`);
      return true;
    } catch (error) {
      console.error('❌ ThemeService: Failed to set active theme:', error);
      return false;
    }
  }

  /**
   * Subscribe to theme changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') return () => {};
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers of theme change
   * @param {string} themeId - New theme ID
   */
  notifySubscribers(themeId) {
    this.subscribers.forEach(cb => {
      try {
        cb(themeId);
      } catch (error) {
        console.error('❌ ThemeService: Subscriber error:', error);
      }
    });
  }

  /**
   * Get current theme (synchronous)
   * @returns {string} Current theme ID
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
}

// Singleton instance
const themeService = new ThemeService();

export default themeService;













