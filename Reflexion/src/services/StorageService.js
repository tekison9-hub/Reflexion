import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  constructor() {
    this.isInitialized = false;
    this.initPromise = null; // Track initialization promise
  }

  async initialize() {
    // ✅ Prevent multiple initializations
    if (this.initPromise) {
      return this.initPromise;
    }
    if (this.isInitialized) {
      console.log('🔄 StorageService already initialized');
      return Promise.resolve();
    }
    
    this.initPromise = (async () => {
      try {
        // ✅ CRITICAL FIX: Wait for AsyncStorage to be ready
        if (!AsyncStorage) {
          throw new Error('AsyncStorage is not available');
        }
        
        // Test storage access
        await AsyncStorage.getItem('@test_key');
        this.isInitialized = true;
        console.log('✅ StorageService initialized');
      } catch (error) {
        console.error('❌ StorageService initialization failed:', error);
        // Set initialized anyway to prevent blocking app
        this.isInitialized = true;
      }
    })();

    return this.initPromise;
  }

  /**
   * ✅ CRITICAL FIX: Safe getItem with initialization check
   */
  async getItem(key) {
    // Ensure initialized before accessing storage
    if (!this.isInitialized) {
      await this.initialize();
    }
    try {
      if (!AsyncStorage) {
        console.warn('⚠️ AsyncStorage not available');
        return null;
      }
      
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn(`⚠️ Storage get failed for key "${key}":`, error.message);
      return null;
    }
  }

  /**
   * ✅ CRITICAL FIX: Safe setItem with initialization check
   */
  async setItem(key, value) {
    // Ensure initialized before accessing storage
    if (!this.isInitialized) {
      await this.initialize();
    }
    try {
      if (!AsyncStorage) {
        console.warn('⚠️ AsyncStorage not available');
        return;
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`⚠️ Storage set failed for key "${key}":`, error.message);
    }
  }

  async removeItem(key) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    try {
      if (!AsyncStorage) {
        console.warn('⚠️ AsyncStorage not available');
        return;
      }
      
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`⚠️ Storage remove failed for key "${key}":`, error.message);
    }
  }
}

// Singleton instance
const storageService = new StorageService();

// ✅ CRITICAL FIX: Auto-initialize on creation
storageService.initialize().catch(err => {
  console.warn('⚠️ StorageService auto-init failed:', err);
});

export default storageService;
export { storageService };
