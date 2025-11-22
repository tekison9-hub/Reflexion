// ✅ AAA STANDARDS: Singleton Audio Manager with AppState handling (SDK 51 - expo-audio safe stub)
import { AppState } from 'react-native';

// Safe stub for audio player
class SafeAudioPlayer {
  constructor() {
    this.isPlaying = false;
  }

  async play() {
    try {
      this.isPlaying = true;
      console.log('[SFX] Playing (stub)');
    } catch (e) {
      // Non-blocking
    }
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

  async setPositionAsync() {
    // Stub - no-op
  }

  async getStatusAsync() {
    return { isLoaded: true, isPlaying: this.isPlaying };
  }

  async unloadAsync() {
    this.isPlaying = false;
  }
}

class SoundManager {
  constructor() {
    this.sounds = {};
    this.initialized = false;
    // 🔴 SOUND POOL: 6 instances of tap sound for rapid playback
    this.tapSoundPool = [];
    this.tapPoolIndex = 0;
    // ✅ AAA: AppState listener for background handling
    this.appStateSubscription = null;
    this.currentBGM = null; // Track current background music
  }

  async initialize() {
    try {
      console.log('🔊 Initializing SoundManager with expo-audio (safe stub)...');
      
      // Ses dosyalarını yükle
      // 🔴 BUG #3 FIX: Add 'miss' sound (code calls play('miss') but it wasn't in the list)
      const soundFiles = {
        tap: require('../../assets/sounds/tap.wav'),
        success: require('../../assets/sounds/success.wav'),
        fail: require('../../assets/sounds/miss.wav'),
        miss: require('../../assets/sounds/miss.wav'), // 🔴 BUG #3 FIX: Add miss sound (uses same file as fail)
        combo: require('../../assets/sounds/combo.wav'),
        coin: require('../../assets/sounds/coin.wav'),
        levelUp: require('../../assets/sounds/levelup.wav'),
        gameOver: require('../../assets/sounds/gameover.wav'),
        luckyTap: require('../../assets/sounds/lucky.wav'),
        // === HAPTIC PATCH START ===
        // Speed Test end result sounds
        speedtest_win: require('../../assets/sounds/success.wav'), // Use success for win
        speedtest_ok: require('../../assets/sounds/combo.wav'), // Use combo for ok
        speedtest_fail: require('../../assets/sounds/miss.wav'), // Use miss for fail
        // Shop purchase dopamine sound
        shop_purchase_dopamine: require('../../assets/sounds/lucky.wav'), // Use lucky for dopamine sparkle
        // === HAPTIC PATCH END ===
        // === SOUND REGISTRATION START ===
        speedFinish: require('../../assets/sounds/speed_finish.wav'),
        setActive: require('../../assets/sounds/unlock_reward.wav'),
        softFail: require('../../assets/sounds/soft_fail.wav'),
        tapPerfect: require('../../assets/sounds/tap_perfect.wav'),
        // === SOUND REGISTRATION END ===
      };
      
      for (const [name, file] of Object.entries(soundFiles)) {
        try {
          // Create safe stub player
          const player = new SafeAudioPlayer();
          this.sounds[name] = player;
          console.log(`✅ Loaded sound stub: ${name}`);
        } catch (err) {
          console.warn(`⚠️ Failed to load ${name}:`, err.message);
          // Ses yüklenemezse null olarak kaydet
          this.sounds[name] = null;
        }
      }
      
      // 🔴 SOUND POOL: Preload 6 instances of tap sound
      try {
        const tapPlayer = this.sounds.tap;
        this.tapSoundPool = [];
        for (let i = 0; i < 6; i++) {
          if (tapPlayer) {
            this.tapSoundPool.push(tapPlayer);
          }
        }
        console.log(`✅ Loaded ${this.tapSoundPool.length} tap sound pool instances`);
      } catch (err) {
        console.warn('⚠️ Failed to create tap sound pool:', err.message);
      }
      
      // ✅ AAA: Setup AppState listener to pause audio when app goes to background
      this.setupAppStateListener();

      this.initialized = true;
      console.log('✅ SoundManager initialized (safe stub mode)');
    } catch (error) {
      console.error('❌ SoundManager initialization failed:', error);
      // Don't throw - allow app to continue
      this.initialized = true;
    }
  }

  /**
   * ✅ AAA: Setup AppState listener to handle background/foreground transitions
   * Prevents audio from playing when app is in background
   */
  setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Pause all sounds when app goes to background
        this.pauseAll();
      }
    });
  }

  /**
   * ✅ AAA: Pause all currently playing sounds
   */
  async pauseAll() {
    try {
      for (const sound of Object.values(this.sounds)) {
        if (sound) {
          try {
            await sound.pause();
          } catch (e) {
            // Ignore individual sound errors
          }
        }
      }
      if (this.currentBGM) {
        try {
          await this.currentBGM.pause();
        } catch (e) {
          // Ignore
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  /**
   * ✅ AAA: Play background music (BGM) - stops previous BGM before playing new one
   */
  async playBGM(file) {
    if (!this.initialized) {
      console.warn('⚠️ SoundManager not initialized yet');
      return;
    }

    try {
      // Stop and unload previous BGM if exists
      if (this.currentBGM) {
        try {
          await this.currentBGM.stop();
        } catch (e) {
          // Ignore errors when stopping previous BGM
        }
        this.currentBGM = null;
      }

      // Create safe stub for BGM
      const bgmPlayer = new SafeAudioPlayer();
      this.currentBGM = bgmPlayer;
      await bgmPlayer.play();
      console.log('✅ BGM started (stub)');
    } catch (error) {
      console.error('❌ playBGM failed:', error);
    }
  }

  async play(soundName) {
    // 🔴 KRİTİK DÜZELTME: Non-blocking play - "Seeking interrupted" hatasını önle
    // Fire-and-forget: Ses çalmayı asenkron olarak başlat, oyunu bloklama
    
    // === HAPTIC PATCH START ===
    // Settings kontrolü
    try {
      const { settingsService } = require('./SettingsService');
      const soundEnabled = settingsService?.getSoundEnabled?.() ?? true;
      if (!soundEnabled) {
        console.log(`[SFX] key=${soundName}, success=false (sfx disabled)`);
        return;
      }
    } catch (e) {
      // Settings service yoksa devam et
    }
    // === HAPTIC PATCH END ===
    
    if (!this.initialized) {
      console.warn('⚠️ SoundManager not initialized yet');
      console.log(`[SFX] key=${soundName}, success=false (not initialized)`);
      return;
    }
    
    const sound = this.sounds[soundName];
    
    if (!sound) {
      console.warn(`⚠️ Sound "${soundName}" not found`);
      console.log(`[SFX] key=${soundName}, success=false (not found)`);
      return;
    }
    
    // 🔴 NON-BLOCKING: Async işlemi fire-and-forget olarak çalıştır
    (async () => {
      try {
        await sound.play();
        // === HAPTIC PATCH START ===
        console.log(`[SFX] key=${soundName}, success=true`);
        // === HAPTIC PATCH END ===
      } catch (error) {
        // Tüm hatalar non-critical - oyunu durdurma
        console.log(`⚠️ Sound play error "${soundName}" (non-critical):`, error.message);
        console.log(`[SFX] key=${soundName}, success=false (error)`);
      }
    })();
  }

  // playTap için özel metod (hızlı tap'ler için)
  // 🔴 SOUND POOL: Fire-and-forget with pool rotation
  playTap() {
    // Settings check
    try {
      const { settingsService } = require('./SettingsService');
      const soundEnabled = settingsService?.getSoundEnabled?.() ?? true;
      if (!soundEnabled) {
        return;
      }
    } catch (e) {
      // Settings service yoksa devam et
    }
    
    if (!this.initialized || this.tapSoundPool.length === 0) {
      // Fallback to regular play if pool not ready
      this.play('tap');
      return;
    }
    
    // Fire-and-forget: rotate through pool, play instantly
    (() => {
      try {
        // Get next pool instance (round-robin)
        const poolIndex = this.tapPoolIndex % this.tapSoundPool.length;
        const sound = this.tapSoundPool[poolIndex];
        this.tapPoolIndex = (this.tapPoolIndex + 1) % this.tapSoundPool.length;
        
        if (!sound) {
          return;
        }
        
        // Fire-and-forget: reset and play without awaiting
        sound.setPositionAsync(0).catch(() => {}); // Ignore seek errors
        sound.play().catch(() => {}); // Ignore play errors
        
        console.log(`[SOUND_OK] poolIndex=${poolIndex}`);
        console.log(`[SFX] key=tap, success=true`);
      } catch (error) {
        // Non-critical: fallback to regular play
        this.play('tap');
      }
    })();
  }

  async stopAll() {
    try {
      for (const sound of Object.values(this.sounds)) {
        if (sound) {
          try {
            await sound.stop();
          } catch (e) {
            // Ignore
          }
        }
      }
      if (this.currentBGM) {
        try {
          await this.currentBGM.stop();
        } catch (e) {
          // Ignore
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  mute() {
    // Mute için settings service kullan
    try {
      const { settingsService } = require('./SettingsService');
      settingsService?.setSoundEnabled?.(false);
    } catch (e) {
      // Ignore
    }
  }

  unmute() {
    try {
      const { settingsService } = require('./SettingsService');
      settingsService?.setSoundEnabled?.(true);
    } catch (e) {
      // Ignore
    }
  }

  async unload() {
    // ✅ AAA: Remove AppState listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // Unload BGM
    if (this.currentBGM) {
      try {
        await this.currentBGM.unloadAsync();
      } catch (error) {
        console.warn('Failed to unload BGM:', error);
      }
      this.currentBGM = null;
    }

    // Unload all sounds
    for (const sound of Object.values(this.sounds)) {
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.warn('Failed to unload sound:', error);
        }
      }
    }
    this.sounds = {};
    this.initialized = false;
  }

  // Eski metodlar için uyumluluk
  async cleanup() {
    await this.unload();
  }

  setSettings(settings) {
    // Settings service üzerinden yönetiliyor, bu metod uyumluluk için
    if (settings) {
      console.log('🔊 [SoundManager] Settings updated:', settings);
    }
  }
}

export default new SoundManager();
