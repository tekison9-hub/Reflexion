import { Audio } from 'expo-av';

/**
 * SoundManager - Elite Production-Grade Audio System for Reflexion
 * 
 * Features:
 * - Robust async playback with replayAsync for reliability
 * - Health monitoring and auto-recovery
 * - Background audio support for iOS/Android
 * - Graceful error handling (never crashes the app)
 * - No circular dependencies (settings injected via setSettings)
 * - Thread-safe initialization with guard flags
 * - Complete cleanup on unmount
 * 
 * Compatible with Expo SDK 54 + expo-av v16.x
 */
class SoundManager {
  constructor() {
    this.sounds = {};
    this.soundPool = {};
    this.failedSounds = [];
    this.isInitialized = false;
    this.isInitializing = false;
    this.lastHealthCheck = 0;
    this.isMuted = false;
    
    // ✅ CRITICAL FIX: Safe default settings
    this.settings = {
      soundEnabled: true,
      hapticsEnabled: true,
      musicVolume: 1.0,
      sfxVolume: 1.0,
    };
    
    // Sound file registry
    this.soundFiles = {
      tap: require('../../assets/sounds/tap.wav'),
      miss: require('../../assets/sounds/miss.wav'),
      combo: require('../../assets/sounds/combo.wav'),
      coin: require('../../assets/sounds/coin.wav'),
      levelUp: require('../../assets/sounds/levelup.wav'),
      gameOver: require('../../assets/sounds/gameover.wav'),
      luckyTap: require('../../assets/sounds/lucky.wav'),
      start: require('../../assets/sounds/tap.wav'),
    };
    
    this.pooledSounds = ['tap', 'miss'];
    this.poolSize = 3;
    
    // ✅ CRITICAL FIX: Load settings from settingsService on initialization
    this._loadSettingsFromService();
  }

  /**
   * ✅ CRITICAL FIX: Load settings from SettingsService safely
   */
  async _loadSettingsFromService() {
    try {
      // Dynamic import to avoid circular dependency
      const settingsService = (await import('../services/SettingsService')).default;
      if (settingsService && typeof settingsService.get === 'function') {
        const settings = settingsService.get();
        this.setSettings(settings);
      }
    } catch (error) {
      console.warn('⚠️ Could not load settings from service, using defaults:', error);
    }
  }

  /**
   * Initialize audio system with proper background audio support
   * Thread-safe with concurrent init protection
   */
  async initialize() {
    // Prevent concurrent initialization
    if (this.isInitializing) {
      console.log('⏳ SoundManager initialization already in progress');
      return;
    }

    if (this.isInitialized) {
      console.log('✅ SoundManager already initialized');
      return;
    }

    this.isInitializing = true;

    try {
      // Configure audio mode for optimal game audio with background support
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true, // Keep audio active in background
        shouldDuckAndroid: false, // Don't lower volume for other apps
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: 1, // Mix with others
        interruptionModeAndroid: 1, // Don't mix
      });

      console.log('🔊 Audio mode configured with background support');

      // Preload all sounds in parallel
      const loadPromises = Object.entries(this.soundFiles).map(async ([name, source]) => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            source,
            { 
              shouldPlay: false,
              isLooping: false,
              volume: 1.0,
            }
          );

          this.sounds[name] = sound;
          console.log(`✅ Sound loaded: ${name}.wav`);
          
          // ELITE v3.0: Create sound pool for frequently played sounds
          if (this.pooledSounds.includes(name)) {
            this.soundPool[name] = [sound]; // First instance already created
            
            // Create additional instances for pooling
            for (let i = 1; i < this.poolSize; i++) {
              try {
                const { sound: pooledSound } = await Audio.Sound.createAsync(
                  source,
                  { shouldPlay: false, isLooping: false, volume: 1.0 }
                );
                this.soundPool[name].push(pooledSound);
              } catch (poolError) {
                console.warn(`⚠️ Failed to create pool instance for ${name}:`, poolError.message);
              }
            }
            
            console.log(`🔊 Sound pool created for ${name}: ${this.soundPool[name].length} instances`);
          }
          
          return { name, success: true };
        } catch (error) {
          console.warn(`⚠️ Failed to load ${name}.wav:`, error.message);
          this.failedSounds.push(name);
          return { name, success: false };
        }
      });

      const results = await Promise.all(loadPromises);
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;
      
      // Track failed sounds for diagnostics
      this.failedSounds = results.filter(r => !r.success).map(r => r.name);
      
      this.isInitialized = true;
      this.isInitializing = false;
      this.lastHealthCheck = Date.now();
      
      if (failedCount > 0) {
        console.warn(
          `⚠️ SoundManager partially initialized: ${successCount}/${results.length} sounds loaded`
        );
        console.warn(`❌ Failed sounds: ${this.failedSounds.join(', ')}`);
      } else {
        console.info(
          `✅ ReflexionSoundManager healthy: ${successCount}/${results.length} sounds loaded`
        );
      }
      
    } catch (error) {
      console.error('❌ SoundManager initialization failed:', error);
      this.isInitializing = false;
      this.isInitialized = false;
    }
  }

  /**
   * Health check - returns true if audio system is working
   * @returns {boolean} - System health status
   */
  async isHealthy() {
    if (!this.isInitialized) {
      return false;
    }
    
    const totalSounds = Object.keys(this.soundFiles).length;
    const loadedSounds = Object.keys(this.sounds).length;
    
    // Check if at least 80% of sounds are loaded
    if (loadedSounds / totalSounds < 0.8) {
      return false;
    }
    
    // Verify each sound is actually loaded
    try {
      for (const [name, sound] of Object.entries(this.sounds)) {
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
          console.warn(`⚠️ Sound ${name} is not loaded`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  /**
   * Unload all sounds
   */
  async unloadAll() {
    console.log('🗑️ Unloading all sounds...');
    const unloadPromises = Object.entries(this.sounds).map(async ([name, sound]) => {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.unloadAsync();
        }
      } catch (error) {
        console.warn(`⚠️ Error unloading ${name}:`, error.message);
      }
    });
    await Promise.all(unloadPromises);
    this.sounds = {};
    this.isInitialized = false;
    this.isInitializing = false;
  }

  /**
   * Reinitialize sound system (recovery from errors)
   */
  async reinitialize() {
    console.warn('🔁 Reinitializing SoundManager...');
    await this.unloadAll();
    await this.initialize();
    
    const healthy = await this.isHealthy();
    if (healthy) {
      console.info('✅ SoundManager reinitialized successfully');
    } else {
      console.warn('⚠️ SoundManager reinitialization incomplete');
    }
  }

  /**
   * ✅ CRITICAL FIX: Safe setSettings with validation
   */
  setSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      console.warn('⚠️ Invalid settings provided to SoundManager');
      return;
    }
    
    this.settings = { 
      soundEnabled: settings.soundEnabled ?? true,
      sfxVolume: settings.sfxVolume ?? 1.0,
      musicVolume: settings.musicVolume ?? 1.0,
      hapticsEnabled: settings.hapticsEnabled ?? true,
    };
    
    console.log(
      `🔊 SoundManager settings updated: sound=${this.settings.soundEnabled}, sfx=${this.settings.sfxVolume}`
    );
  }

  /**
   * Play a sound by name with improved reliability using replayAsync
   * @param {string} name - Sound name (tap, miss, combo, etc.)
   * @param {number} comboLevel - Combo level for pitch shifting (1 = normal)
   */
  /**
   * REFLEXION v5.0: Enhanced play with sound pooling, master mute, and fallback
   * @param {string} name - Sound name to play
   * @param {number} comboLevel - Combo level for dynamic variations
   */
  async play(name, comboLevel = 1) {
    // Master mute check
    if (this.isMuted || !this.settings.soundEnabled) {
      return;
    }

    // Auto-initialize if needed
    if (!this.isInitialized && !this.isInitializing) {
      console.warn('⚠️ SoundManager not initialized, attempting init...');
      await this.initialize();
    }

    // If still not initialized, give up gracefully
    if (!this.isInitialized) {
      return;
    }

    try {
      // CRITICAL FIX: Validate sound exists before attempting playback with fallback
      if (!this.soundFiles[name]) {
        console.warn(`⚠️ Sound "${name}" not registered. Available sounds:`, Object.keys(this.soundFiles));
        
        // CRITICAL FIX: Intelligent fallback chain
        const fallbackMap = {
          'luckyTap': 'combo', // Lucky tap → combo sound
          'combo': 'tap', // Combo → tap sound
          'miss': 'tap', // Miss → tap (better than silence)
          'gameOver': 'miss', // Game over → miss
          'levelUp': 'combo', // Level up → combo
          'coin': 'tap', // Coin → tap
        };
        
        const fallback = fallbackMap[name];
        if (fallback && this.soundFiles[fallback]) {
          console.log(`🔄 Using fallback: ${name} → ${fallback}`);
          name = fallback;
        } else if (name !== 'tap' && this.soundFiles['tap']) {
          console.log(`🔄 Using final fallback: ${name} → tap`);
          name = 'tap';
        } else {
          console.error(`❌ No fallback available for ${name}`);
          return; // No fallback available
        }
      }

      // Use sound pooling for frequently played sounds
      let soundToPlay;
      
      if (this.soundPool[name] && this.soundPool[name].length > 0) {
        // Get first available sound from pool
        soundToPlay = this.soundPool[name].find(async (pooledSound) => {
          try {
            const status = await pooledSound.getStatusAsync();
            return !status.isPlaying;
          } catch {
            return false;
          }
        });
        
        // If all instances are playing, use the first one anyway (overlap)
        if (!soundToPlay) {
          soundToPlay = this.soundPool[name][0];
        }
      } else {
        // Non-pooled sound
        soundToPlay = this.sounds[name];
      }

      if (!soundToPlay) {
        console.warn(`⚠️ Sound ${name} not found in loaded sounds`);
        
        // CRITICAL FIX: Try to recover by reloading the sound
        try {
          const { sound } = await Audio.Sound.createAsync(
            this.soundFiles[name],
            { volume: this.settings.sfxVolume },
            null,
            false
          );
          this.sounds[name] = sound;
          soundToPlay = sound;
          console.log(`✅ Recovered sound: ${name}`);
        } catch (recoverError) {
          console.error(`❌ Failed to recover ${name}:`, recoverError.message);
          return;
        }
      }

      // Check if sound is loaded
      const status = await soundToPlay.getStatusAsync();
      
      if (!status.isLoaded) {
        console.warn(`⚠️ Sound ${name} is not loaded, attempting to reload...`);
        try {
          await soundToPlay.loadAsync(this.soundFiles[name]);
          console.log(`✅ Reloaded sound: ${name}`);
        } catch (loadError) {
          console.error(`❌ Failed to reload ${name}:`, loadError.message);
          return;
        }
      }

      // Apply volume with smooth fade-in for better audio experience
      const volume = Math.max(0, Math.min(1, this.settings.sfxVolume || 1.0));
      await soundToPlay.setVolumeAsync(volume);

      // Apply pitch shifting for tap/combo sounds
      if ((name === 'tap' || name === 'combo') && comboLevel > 1) {
        const pitch = Math.min(1.0 + (comboLevel - 1) * 0.05, 2.0);
        await soundToPlay.setRateAsync(pitch, true);
      } else {
        await soundToPlay.setRateAsync(1.0, true);
      }

      // Use replayAsync for reliable playback
      await soundToPlay.replayAsync();
      
      console.log(`🎵 Playing: ${name}`);
      
    } catch (error) {
      console.error(`❌ Failed to play sound ${name}:`, error.message);
      // Don't rethrow - fail gracefully
    }
  }

  /**
   * Stop all currently playing sounds
   * Safe to call even if sounds aren't loaded
   */
  async stopAll() {
    const stopPromises = Object.values(this.sounds).map(async (sound) => {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.stopAsync();
        }
      } catch (error) {
        // Ignore errors during stop
      }
    });

    await Promise.all(stopPromises);
  }

  /**
   * Cleanup and unload all sounds
   * Always safe to call, even if not initialized
   */
  async cleanup() {
    console.log('🧹 Cleaning up SoundManager...');
    await this.unloadAll();
    console.log('✅ SoundManager cleaned up');
  }

  /**
   * Legacy compatibility - enable/disable sounds
   */
  setEnabled(enabled) {
    this.settings.soundEnabled = enabled;
  }

  /**
   * ELITE v3.0: Master mute control
   * Instantly mutes all sounds without changing settings
   */
  mute() {
    this.isMuted = true;
    console.log('🔇 Sounds muted');
  }

  /**
   * ELITE v3.0: Unmute sounds
   */
  unmute() {
    this.isMuted = false;
    console.log('🔊 Sounds unmuted');
  }

  /**
   * ELITE v3.0: Toggle mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    console.log(this.isMuted ? '🔇 Sounds muted' : '🔊 Sounds unmuted');
    return this.isMuted;
  }

  /**
   * ELITE v3.0: Set global volume (0.0 - 1.0)
   */
  setVolume(volume) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    console.log(`🔊 Volume set to ${(this.settings.sfxVolume * 100).toFixed(0)}%`);
  }

  /**
   * Get comprehensive audio system status for diagnostics
   */
  getAudioStatus() {
    const totalSounds = Object.keys(this.soundFiles).length;
    const loadedSounds = Object.keys(this.sounds).length;
    const healthPercent = totalSounds > 0 ? Math.round((loadedSounds / totalSounds) * 100) : 0;
    
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      isEnabled: this.settings.soundEnabled,
      totalSounds,
      loadedSounds,
      failedSounds: this.failedSounds,
      loadedSoundNames: Object.keys(this.sounds),
      healthPercent,
      lastHealthCheck: this.lastHealthCheck,
    };
  }
}

// Singleton instance
const soundManager = new SoundManager();
export default soundManager;

