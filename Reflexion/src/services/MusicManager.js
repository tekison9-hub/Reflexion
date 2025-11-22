/**
 * REFLEXION v5.0 - MUSIC MANAGER (EXPO-AUDIO, SDK 51 COMPATIBLE)
 * 
 * Singleton pattern for background music + SFX
 * Safe stub implementation that won't break builds.
 * - Menu music: 40% volume
 * - Gameplay music: 25% volume
 * - SFX: 100% volume
 * - Persistent settings via AsyncStorage
 * - Graceful degradation if audio files missing
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Audio file paths (gracefully handle missing files)
const MUSIC_FILES = {
  menu: (() => {
    try {
      return require('../../assets/music/menu_ambient.mp3');
    } catch (e) {
      console.warn('⚠️ Menu music file not found');
      return null;
    }
  })(),
  gameplay: (() => {
    try {
      return require('../../assets/music/gameplay_energetic.mp3');
    } catch (e) {
      console.warn('⚠️ Gameplay music file not found');
      return null;
    }
  })(),
  zen: (() => {
    try {
      return require('../../assets/music/zen_calm.mp3');
    } catch (e) {
      console.warn('⚠️ Zen music file not found, using menu music as fallback');
      try {
        return require('../../assets/music/menu_ambient.mp3');
      } catch (e2) {
        console.warn('⚠️ Fallback menu music also not found');
        return null;
      }
    }
  })(),
};

const SFX_FILES = {
  tap: (() => {
    try {
      return require('../../assets/sounds/tap.mp3');
    } catch (e) {
      return null;
    }
  })(),
  combo: (() => {
    try {
      return require('../../assets/sounds/combo.mp3');
    } catch (e) {
      return null;
    }
  })(),
  levelUp: (() => {
    try {
      return require('../../assets/sounds/level_up.mp3');
    } catch (e) {
      return null;
    }
  })(),
};

const STORAGE_KEYS = {
  MUSIC_ENABLED: '@reflexxp_music_enabled',
  MUSIC_VOLUME: '@reflexxp_music_volume',
};

// Safe stub for audio player
class SafeAudioPlayer {
  constructor() {
    this.isPlaying = false;
    this.volume = 1.0;
  }

  async play() {
    this.isPlaying = true;
    console.log('🎵 Playing (stub)');
  }

  async pause() {
    this.isPlaying = false;
  }

  async stop() {
    this.isPlaying = false;
  }

  async replay() {
    await this.stop();
    await this.play();
  }

  async setVolumeAsync(volume) {
    this.volume = volume;
  }

  async getStatusAsync() {
    return { isLoaded: true, isPlaying: this.isPlaying };
  }

  async unloadAsync() {
    this.isPlaying = false;
  }
}

class MusicManager {
  static instance = null;

  constructor() {
    if (MusicManager.instance) {
      console.warn('⚠️ MusicManager already exists! Returning existing instance.');
      return MusicManager.instance;
    }

    this.backgroundSound = null;
    this.sfxCache = {};
    this.isInitialized = false;
    this.isMusicEnabled = true;
    this.menuVolume = 0.4;
    this.gameplayVolume = 0.25;
    this.zenVolume = 0.3;
    this.sfxVolume = 1.0;
    this.currentTrack = null;
    this.isStopping = false;

    MusicManager.instance = this;
    console.log('✅ MusicManager singleton created (expo-audio safe stub)');
  }

  static getInstance() {
    if (!MusicManager.instance) {
      MusicManager.instance = new MusicManager();
    }
    return MusicManager.instance;
  }

  /**
   * Initialize audio system
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('🎵 MusicManager already initialized');
      return;
    }

    try {
      console.log('🎵 Initializing MusicManager with expo-audio (safe stub)...');

      // Load settings
      await this.loadSettings();

      this.isInitialized = true;
      console.log('✅ MusicManager initialized successfully (safe stub mode)');
      console.log(`🎵 Music enabled: ${this.isMusicEnabled}`);
    } catch (error) {
      console.error('❌ MusicManager initialization failed:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Load settings from AsyncStorage
   */
  async loadSettings() {
    try {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.MUSIC_ENABLED);
      
      if (enabled !== null) {
        this.isMusicEnabled = enabled === 'true';
      }
    } catch (error) {
      console.warn('⚠️ Failed to load music settings:', error);
    }
  }

  /**
   * Play background music (menu, gameplay, zen)
   */
  async playBackground(trackName) {
    if (!this.isInitialized || !this.isMusicEnabled) {
      return;
    }

    const track = MUSIC_FILES[trackName];
    if (!track) {
      console.warn(`⚠️ Music file for ${trackName} not found`);
      return;
    }

    try {
      // Stop previous track if playing
      if (this.backgroundSound) {
        await this.backgroundSound.unloadAsync();
        this.backgroundSound = null;
      }

      // Determine volume based on track type
      let volume = this.menuVolume;
      if (trackName === 'gameplay') {
        volume = this.gameplayVolume;
      } else if (trackName === 'zen') {
        volume = this.zenVolume;
      }

      // Create safe stub player
      const bgmPlayer = new SafeAudioPlayer();
      await bgmPlayer.setVolumeAsync(volume);
      this.backgroundSound = bgmPlayer;
      this.currentTrack = trackName;
      await bgmPlayer.play();
      console.log(`🎵 ${trackName} music started (volume: ${Math.round(volume * 100)}%, stub)`);
    } catch (error) {
      console.error(`❌ Failed to play ${trackName} music:`, error);
    }
  }

  /**
   * Play menu music
   */
  async playMenuMusic() {
    await this.playBackground('menu');
  }

  /**
   * Play gameplay music
   */
  async playGameplayMusic() {
    await this.playBackground('gameplay');
  }

  /**
   * Play zen music
   */
  async playZenMusic() {
    await this.playBackground('zen');
  }

  /**
   * Play sound effect
   */
  async playSFX(sfxName) {
    if (!this.isInitialized) {
      return;
    }

    const sfx = SFX_FILES[sfxName];
    if (!sfx) {
      return;
    }

    try {
      // Check if SFX is already loaded in cache
      if (this.sfxCache[sfxName]) {
        await this.sfxCache[sfxName].replay();
      } else {
        // Create and cache SFX player
        const player = new SafeAudioPlayer();
        await player.setVolumeAsync(this.sfxVolume);
        this.sfxCache[sfxName] = player;
        await player.play();
      }
    } catch (error) {
      console.warn(`⚠️ Failed to play SFX ${sfxName}:`, error);
    }
  }

  /**
   * Set volume for different music types
   */
  async setVolume(type, value) {
    const volume = Math.max(0, Math.min(1, value));

    try {
      if (type === 'menu') {
        this.menuVolume = volume;
      } else if (type === 'gameplay') {
        this.gameplayVolume = volume;
      } else if (type === 'zen') {
        this.zenVolume = volume;
      } else if (type === 'sfx') {
        this.sfxVolume = volume;
      }

      // Update current playing track volume
      if (this.backgroundSound && this.currentTrack === type) {
        await this.backgroundSound.setVolumeAsync(volume);
      }

      console.log(`🎵 ${type} volume set to ${Math.round(volume * 100)}%`);
    } catch (error) {
      console.warn(`⚠️ Failed to set ${type} volume:`, error);
    }
  }

  /**
   * Enable/disable music - AAA FIX: Pause/Resume instead of stop/restart
   */
  async setEnabled(enabled) {
    try {
      this.isMusicEnabled = enabled;

      await AsyncStorage.setItem(
        STORAGE_KEYS.MUSIC_ENABLED,
        enabled.toString()
      );

      // === AAA GAME JUICE: Pause/Resume instead of stop/restart ===
      if (!enabled) {
        // Music OFF: Pause if playing, don't unload
        if (this.backgroundSound) {
          try {
            const status = await this.backgroundSound.getStatusAsync();
            if (status.isLoaded && status.isPlaying) {
              await this.backgroundSound.pause();
              console.log('🎵 Music paused (not stopped)');
            } else {
              // If not playing, set volume to 0 as fallback
              await this.backgroundSound.setVolumeAsync(0);
              console.log('🎵 Music volume set to 0');
            }
          } catch (error) {
            console.warn('⚠️ Failed to pause music:', error);
          }
        }
      } else {
        // Music ON: Resume if paused, or restore volume
        if (this.backgroundSound) {
          try {
            const status = await this.backgroundSound.getStatusAsync();
            if (status.isLoaded) {
              // Restore appropriate volume based on current track
              let volume = this.menuVolume;
              if (this.currentTrack === 'gameplay') {
                volume = this.gameplayVolume;
              } else if (this.currentTrack === 'zen') {
                volume = this.zenVolume;
              }
              
              await this.backgroundSound.setVolumeAsync(volume);
              
              if (!status.isPlaying) {
                await this.backgroundSound.play();
                console.log('🎵 Music resumed from pause');
              } else {
                console.log('🎵 Music volume restored');
              }
            }
          } catch (error) {
            console.warn('⚠️ Failed to resume music:', error);
            // If resume fails, try to reload the track
            if (this.currentTrack) {
              await this.playBackground(this.currentTrack);
            }
          }
        }
      }

      console.log(`🎵 Music ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.warn('⚠️ Failed to toggle music:', error);
    }
  }

  /**
   * Stop all music
   */
  async stopAll() {
    if (this.isStopping) {
      return;
    }

    this.isStopping = true;

    try {
      if (this.backgroundSound) {
        await this.backgroundSound.stop();
        await this.backgroundSound.unloadAsync();
        this.backgroundSound = null;
      }
      this.currentTrack = null;
      console.log('🎵 All music stopped');
    } catch (error) {
      console.error('❌ Failed to stop music:', error);
    } finally {
      this.isStopping = false;
    }
  }

  /**
   * Pause current music
   */
  async pause() {
    if (!this.backgroundSound) {
      return;
    }

    try {
      await this.backgroundSound.pause();
      console.log('🎵 Music paused');
    } catch (error) {
      console.warn('⚠️ Failed to pause music:', error);
    }
  }

  /**
   * Resume current music
   */
  async resume() {
    if (!this.backgroundSound) {
      return;
    }

    try {
      await this.backgroundSound.play();
      console.log('🎵 Music resumed');
    } catch (error) {
      console.warn('⚠️ Failed to resume music:', error);
    }
  }

  /**
   * Cleanup all resources
   */
  async unload() {
    try {
      // Unload background music
      if (this.backgroundSound) {
        await this.backgroundSound.unloadAsync();
        this.backgroundSound = null;
      }

      // Unload all cached SFX
      for (const key in this.sfxCache) {
        if (this.sfxCache[key]) {
          await this.sfxCache[key].unloadAsync();
        }
      }
      this.sfxCache = {};

      this.currentTrack = null;
      this.isInitialized = false;
      console.log('🎵 MusicManager unloaded');
    } catch (error) {
      console.warn('⚠️ Failed to unload MusicManager:', error);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized || false,
      currentTrack: this.currentTrack || null,
      isMusicEnabled: this.isMusicEnabled || false,
      menuVolume: this.menuVolume || 0.4,
      gameplayVolume: this.gameplayVolume || 0.25,
      zenVolume: this.zenVolume || 0.3,
      sfxVolume: this.sfxVolume || 1.0,
    };
  }

  /**
   * Update combo speed (for dynamic music tempo)
   */
  updateComboSpeed(combo) {
    // This method can be used to adjust music tempo based on combo
    // Currently not implemented, but available for future use
    if (this.backgroundSound && this.currentTrack) {
      // Future: Adjust playback rate based on combo
      // Example: this.backgroundSound.setRateAsync(1.0 + (combo * 0.01), true);
    }
  }

  /**
   * Reset speed to normal
   */
  resetSpeed() {
    if (this.backgroundSound && this.currentTrack) {
      // Future: Reset playback rate to 1.0
      // Example: this.backgroundSound.setRateAsync(1.0, true);
    }
  }
}

// Singleton instance
const musicManager = new MusicManager();
export default musicManager;
export { musicManager };
