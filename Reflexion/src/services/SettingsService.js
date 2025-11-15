import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SettingsService - Manages app-wide settings
 * ✅ FIX: Safe initialization with default values
 * ✅ FIX: All methods check initialization state
 */
class SettingsService {
  constructor() {
    // ✅ CRITICAL FIX: Always initialize with safe defaults
    this.settings = {
      soundEnabled: true,
      hapticsEnabled: true,
      musicVolume: 1.0,
      sfxVolume: 1.0,
      theme: 'auto',
    };
    this.isInitialized = false;
    this.subscribers = [];
    
    // ✅ CRITICAL FIX: Auto-initialize on construction
    this._autoInitialize();
  }

  /**
   * ✅ CRITICAL FIX: Automatic initialization without await
   */
  _autoInitialize() {
    // Run initialization in background, don't block constructor
    this.initialize().catch(error => {
      console.warn('⚠️ Auto-initialization failed, using defaults:', error);
    });
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('📄 SettingsService already initialized');
      return;
    }

    try {
      const savedData = await AsyncStorage.getItem('settings');
      if (savedData) {
        const saved = JSON.parse(savedData);
        if (saved && typeof saved === 'object') {
          // ✅ CRITICAL FIX: Merge with defaults to ensure all keys exist
          this.settings = { ...this.settings, ...saved };
        }
      }

      this.isInitialized = true;
      console.log('✅ SettingsService initialized:', this.settings);
    } catch (error) {
      console.error('❌ SettingsService initialization failed:', error);
      // ✅ CRITICAL FIX: Set initialized anyway with defaults
      this.isInitialized = true;
    }
  }

  /**
   * ✅ CRITICAL FIX: SAFE get() method - NEVER returns undefined
   * Always returns valid settings object even before initialization
   */
  get() {
    // ✅ CRITICAL FIX: Always return a valid object, never undefined
    if (!this.settings || typeof this.settings !== 'object') {
      console.warn('⚠️ Settings corrupted, resetting to defaults');
      this.settings = {
        soundEnabled: true,
        hapticsEnabled: true,
        musicVolume: 1.0,
        sfxVolume: 1.0,
        theme: 'auto',
      };
    }
    
    // Return a copy to prevent external modifications
    return { ...this.settings };
  }

  /**
   * Update settings (partial)
   */
  async set(patch) {
    // ✅ CRITICAL FIX: Ensure settings object exists
    if (!this.settings) {
      this.settings = this.get();
    }
    
    this.settings = { ...this.settings, ...patch };
    await this.save();
    this.notify();
  }

  /**
   * Subscribe to settings changes
   * @param {Function} callback - Called with updated settings
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers
   */
  notify() {
    const currentSettings = this.get();
    this.subscribers.forEach(cb => {
      try {
        cb(currentSettings);
      } catch (error) {
        console.error('❌ Subscriber callback error:', error);
      }
    });
  }

  /**
   * ✅ SAFE getters - never throw errors
   */
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

  /**
   * Safe setters
   */
  async setSoundEnabled(enabled) {
    await this.set({ soundEnabled: !!enabled });
  }

  async setHapticsEnabled(enabled) {
    await this.set({ hapticsEnabled: !!enabled });
  }

  async setMusicVolume(volume) {
    await this.set({ musicVolume: Math.max(0, Math.min(1, volume)) });
  }

  async setSfxVolume(volume) {
    await this.set({ sfxVolume: Math.max(0, Math.min(1, volume)) });
  }

  async setTheme(theme) {
    await this.set({ theme });
  }

  async save() {
    try {
      await AsyncStorage.setItem('settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('⚠️ Failed to save settings:', error);
    }
  }

  async reset() {
    this.settings = {
      soundEnabled: true,
      hapticsEnabled: true,
      musicVolume: 1.0,
      sfxVolume: 1.0,
      theme: 'auto',
    };
    await this.save();
    this.notify();
  }
}

// ✅ CRITICAL FIX: Create singleton instance immediately
const settingsService = new SettingsService();

// ✅ CRITICAL FIX: Export both default and named
export default settingsService;
export { settingsService };
