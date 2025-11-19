/**
 * REFLEXION v6.0 - SETTINGS SERVICE
 * ✅ Safe initialization with defaults
 * ✅ Never returns undefined
 * ✅ Auto-recovery from corruption
 * ✅ Subscriber pattern for live updates
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@reflexion_settings';

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  hapticsEnabled: true,
  musicVolume: 1.0,
  sfxVolume: 1.0,
  theme: 'auto',
  language: 'en',
  notifications: true,
};

class SettingsService {
  constructor() {
    // ✅ ALWAYS initialize with safe defaults
    this.settings = { ...DEFAULT_SETTINGS };
    this.isInitialized = false;
    this.subscribers = [];
    this.initPromise = null;

    // ✅ Auto-initialize in background
    this._autoInitialize();
  }

  /**
   * ✅ Background initialization (non-blocking)
   */
  _autoInitialize() {
    this.initialize().catch(error => {
      console.warn('⚠️ Settings auto-init failed, using defaults:', error);
    });
  }

  /**
   * Initialize from storage
   */
  async initialize() {
    // ✅ Prevent concurrent initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.isInitialized) {
      console.log('📄 SettingsService already initialized');
      return Promise.resolve();
    }

    this.initPromise = (async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const saved = JSON.parse(savedData);
          if (saved && typeof saved === 'object') {
            // ✅ Merge with defaults to ensure all keys exist
            this.settings = { ...DEFAULT_SETTINGS, ...saved };
          }
        }

        this.isInitialized = true;
        console.log('✅ SettingsService initialized:', this.settings);
      } catch (error) {
        console.error('❌ SettingsService init failed:', error);
        // ✅ Use defaults on error
        this.settings = { ...DEFAULT_SETTINGS };
        this.isInitialized = true;
      }
    })();

    return this.initPromise;
  }

  /**
   * ✅ CRITICAL: SAFE get() - NEVER returns undefined
   */
  get() {
    // ✅ Always return valid object
    if (!this.settings || typeof this.settings !== 'object') {
      console.warn('⚠️ Settings corrupted, resetting to defaults');
      this.settings = { ...DEFAULT_SETTINGS };
    }

    // Return copy to prevent external mutations
    return { ...this.settings };
  }

  /**
   * Update settings (partial)
   */
  async set(patch) {
    if (!patch || typeof patch !== 'object') {
      console.warn('⚠️ Invalid settings patch');
      return false;
    }

    try {
      this.settings = { ...this.settings, ...patch };
      await this.save();
      this.notify();
      return true;
    } catch (error) {
      console.error('❌ Failed to set settings:', error);
      return false;
    }
  }

  /**
   * Save to storage
   */
  async save() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.warn('⚠️ Failed to save settings:', error);
    }
  }

  /**
   * Reset to defaults
   */
  async reset() {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.save();
    this.notify();
    console.log('✅ Settings reset to defaults');
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback) {
    if (typeof callback !== 'function') return () => {};

    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify subscribers
   */
  notify() {
    const currentSettings = this.get();
    this.subscribers.forEach(cb => {
      try {
        cb(currentSettings);
      } catch (error) {
        console.error('❌ Subscriber error:', error);
      }
    });
  }

  // ✅ SAFE GETTERS (never throw)
  getSoundEnabled() {
    return this.get().soundEnabled ?? true;
  }

  getHapticsEnabled() {
    return this.get().hapticsEnabled ?? true;
  }

  getMusicVolume() {
    return this.get().musicVolume ?? 1.0;
  }

  getSfxVolume() {
    return this.get().sfxVolume ?? 1.0;
  }

  getTheme() {
    return this.get().theme || 'auto';
  }

  // ✅ SAFE SETTERS
  async setSoundEnabled(enabled) {
    return await this.set({ soundEnabled: !!enabled });
  }

  async setHapticsEnabled(enabled) {
    return await this.set({ hapticsEnabled: !!enabled });
  }

  async setMusicVolume(volume) {
    return await this.set({ musicVolume: Math.max(0, Math.min(1, volume)) });
  }

  async setSfxVolume(volume) {
    return await this.set({ sfxVolume: Math.max(0, Math.min(1, volume)) });
  }

  async setTheme(theme) {
    return await this.set({ theme });
  }
}

// ✅ Create singleton
const settingsService = new SettingsService();

// ✅ CRITICAL FIX: NAMED EXPORT ONLY (no default export to prevent Metro bundler issues)
export { settingsService, DEFAULT_SETTINGS };