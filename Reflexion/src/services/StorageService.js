/**
 * REFLEXION v6.0 - STORAGE SERVICE
 * ✅ Async initialization
 * ✅ Safe getters/setters
 * ✅ Automatic recovery
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  constructor() {
    this.isInitialized = false;
    this.initPromise = null;
  }

  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.isInitialized) {
      return Promise.resolve();
    }

    this.initPromise = (async () => {
      try {
        // Test AsyncStorage availability
        await AsyncStorage.getItem('@reflexion_test');
        this.isInitialized = true;
        console.log('✅ StorageService initialized');
      } catch (error) {
        console.error('❌ StorageService init failed:', error);
        this.isInitialized = true; // Set anyway
      }
    })();

    return this.initPromise;
  }

  async getItem(key) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn(`⚠️ getItem failed for "${key}":`, error.message);
      return null;
    }
  }

  async setItem(key, value) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`⚠️ setItem failed for "${key}":`, error.message);
      return false;
    }
  }

  async removeItem(key) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`⚠️ removeItem failed for "${key}":`, error.message);
      return false;
    }
  }

  async clear() {
    try {
      await AsyncStorage.clear();
      console.log('✅ Storage cleared');
      return true;
    } catch (error) {
      console.error('❌ clear failed:', error);
      return false;
    }
  }
}

const storageService = new StorageService();

// Auto-initialize
storageService.initialize();

export default storageService;
export { storageService };
