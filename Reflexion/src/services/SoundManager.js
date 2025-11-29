import { Audio } from 'expo-av';
import { AppState, Platform } from 'react-native';

class SoundManager {
  constructor() {
    this.sounds = {};
    this.initialized = false;
    this.isMuted = false;
    this.soundEnabled = true;
    this.appStateSubscription = null;
    this.lastPlayTime = {}; // DEBOUNCE FIX
    this.isInitializing = false; // Prevent race conditions
  }

  // Initialize audio mode - runs exactly once
  async init() {
    if (this.initialized || this.isInitializing) return;
    this.isInitializing = true;

    try {
      // CRITICAL: Audio.setAudioModeAsync MUST be called before loading any sounds
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: 1,
        interruptionModeIOS: 1,
        playThroughEarpieceAndroid: false,
      });

      this.initialized = true;
      this.setupAppStateListener();
      console.log(`✅ SoundManager initialized for ${Platform.OS}`);
    } catch (error) {
      console.error('❌ SoundManager Init Error:', error);
      this.initialized = false;
    } finally {
      this.isInitializing = false;
    }
  }

  // Check if SoundManager is initialized (for MusicManager to check)
  isInitialized() {
    return this.initialized;
  }

  // Load all sounds AFTER init() completes
  async loadAllSounds() {
    if (!this.initialized) {
      console.warn('⚠️ SoundManager not initialized, cannot load sounds');
      return;
    }

    const soundMap = {
      tap: require('../../assets/sounds/tap.wav'),
      success: require('../../assets/sounds/success.wav'),
      miss: require('../../assets/sounds/miss.wav'),
      combo: require('../../assets/sounds/combo.wav'),
      gameOver: require('../../assets/sounds/gameover.wav'),
      levelUp: require('../../assets/sounds/levelup.wav'),
      lucky: require('../../assets/sounds/lucky.wav'),
      coin: require('../../assets/sounds/coin.wav'),
      speedFinish: require('../../assets/sounds/speed_finish.wav'),
    };

    const loadPromises = Object.entries(soundMap).map(async ([key, source]) => {
      try {
        if (source) {
          const soundConfig = {
            shouldPlay: false,
            rate: 1.0,
            shouldCorrectPitch: true,
          };

          if (Platform.OS === 'android') {
            soundConfig.volume = 1.0;
          }

          const { sound } = await Audio.Sound.createAsync(source, soundConfig);
          
          if (Platform.OS === 'android') {
            try {
              await sound.setVolumeAsync(1.0);
            } catch (volError) {
              // Ignore volume errors
            }
          }
          
          this.sounds[key] = sound;
        }
      } catch (err) {
        console.warn(`⚠️ Failed to load sound ${key}:`, err.message || err);
        this.sounds[key] = null;
      }
    });

    await Promise.all(loadPromises);
    
    const loadedSounds = Object.keys(this.sounds).filter(key => this.sounds[key] !== null);
    console.log(`✅ Loaded ${loadedSounds.length} sounds`);
  }

  setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        // Optional: Pause logic if needed
      }
    });
  }

  async play(soundName) {
    if (!this.initialized) {
      return;
    }

    const soundAliases = {
      'luckyTap': 'lucky',
      'gameover': 'gameOver',
      'start': 'tap',
      'shop_purchase_dopamine': 'success',
      'setActive': 'tap',
      'error': 'miss',
    };
    const actualSoundName = soundAliases[soundName] || soundName;
    
    try {
      const { settingsService } = require('./SettingsService');
      if (settingsService && typeof settingsService.getSoundEnabled === 'function') {
        if (!settingsService.getSoundEnabled()) return;
      }
    } catch (e) {
      if (!this.soundEnabled || this.isMuted) return;
    }
    
    // Debounce: Prevent sound spam (50ms cooldown)
    const now = Date.now();
    if (this.lastPlayTime[actualSoundName] && now - this.lastPlayTime[actualSoundName] < 50) {
      return;
    }
    this.lastPlayTime[actualSoundName] = now;
    
    const sound = this.sounds[actualSoundName];
    if (!sound) {
      return; // Sound not loaded or failed to load
    }
    
    // Expo SDK 52: Use replayAsync for safe playback
    try {
      if (!sound || typeof sound.replayAsync !== 'function') {
        return;
      }
      
      const status = await sound.getStatusAsync();
      if (!status || !status.isLoaded) {
        return;
      }
      
      // replayAsync safely handles stop + reset + play in one call
      await sound.replayAsync({ 
        shouldPlay: true,
        positionMillis: 0 
      });
    } catch (error) {
      // Silent failure - don't log to avoid spam
    }
  }

  async playTap() {
    await this.play('tap');
  }

  // Backwards-compatible method for code that calls playSound()
  async playSound(type, comboMultiplier = 1) {
    // Map playSound types to our sound names
    const soundMap = {
      'tap': 'tap',
      'combo': 'combo',
      'gameOver': 'gameOver',
      'levelUp': 'levelUp',
      'luckyTap': 'lucky',
      'coin': 'coin',
      'success': 'success',
      'miss': 'miss',
    };
    
    const soundName = soundMap[type] || type;
    await this.play(soundName);
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }
  
  mute() { this.isMuted = true; }
  unmute() { this.isMuted = false; }

  async stopAll() {
    const stopPromises = Object.values(this.sounds)
      .filter(sound => sound !== null && typeof sound.stopAsync === 'function')
      .map(sound => sound.stopAsync().catch(err => {
        console.warn('⚠️ Error stopping sound:', err);
      }));
    await Promise.all(stopPromises);
  }

  async unload() {
    this.appStateSubscription?.remove();
    // CRITICAL FIX: Only unload sounds that exist and are not null
    const unloadPromises = Object.values(this.sounds)
      .filter(sound => sound !== null && typeof sound.unloadAsync === 'function')
      .map(sound => sound.unloadAsync().catch(err => {
        console.warn('⚠️ Error unloading sound:', err);
      }));
    await Promise.all(unloadPromises);
    this.sounds = {};
    this.initialized = false;
  }

  // Backwards-compatible alias
  async initialize() {
    return this.init();
  }

  // Diagnostic method to check audio system status
  getAudioStatus() {
    const loadedSounds = Object.keys(this.sounds).filter(key => this.sounds[key] !== null);
    const failedSounds = Object.keys(this.sounds).filter(key => this.sounds[key] === null);
    
    return {
      isInitialized: this.initialized,
      isEnabled: this.soundEnabled,
      isMuted: this.isMuted,
      platform: Platform.OS,
      totalSounds: Object.keys(this.sounds).length,
      loadedSounds: loadedSounds.length,
      failedSounds: failedSounds.length,
      loadedSoundNames: loadedSounds,
      failedSoundNames: failedSounds,
    };
  }

  // Test method to verify audio is working
  async testAudio() {
    console.log('🧪 Testing audio system...');
    console.log('Audio Status:', this.getAudioStatus());
    
    if (!this.initialized) {
      console.warn('⚠️ SoundManager not initialized, attempting init...');
      await this.init();
    }
    
    if (this.initialized) {
      console.log('🔊 Playing test sound (tap)...');
      await this.play('tap');
      return true;
    } else {
      console.error('❌ SoundManager failed to initialize');
      return false;
    }
  }
}

export default new SoundManager();
