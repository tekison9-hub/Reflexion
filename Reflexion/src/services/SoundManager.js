// 🔴 KRİTİK DÜZELTME: Basitleştirilmiş ve güvenilir ses sistemi
import { Audio } from 'expo-av';

class SoundManager {
  constructor() {
    this.sounds = {};
    this.initialized = false;
    // 🔴 SOUND POOL: 6 instances of tap sound for rapid playback
    this.tapSoundPool = [];
    this.tapPoolIndex = 0;
  }

  async initialize() {
    try {
      console.log('🔊 Initializing SoundManager...');
      
      // Audio modunu ayarla
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      
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
          const { sound } = await Audio.Sound.createAsync(
            file,
            { shouldPlay: false, volume: 0.5 },
            null,
            true // <- Download first
          );
          
          this.sounds[name] = sound;
          console.log(`✅ Loaded sound: ${name}`);
        } catch (err) {
          console.warn(`⚠️ Failed to load ${name}:`, err.message);
          // Ses yüklenemezse null olarak kaydet
          this.sounds[name] = null;
        }
      }
      
      // 🔴 SOUND POOL: Preload 6 instances of tap sound
      try {
        const tapFile = soundFiles.tap;
        this.tapSoundPool = [];
        for (let i = 0; i < 6; i++) {
          try {
            const { sound } = await Audio.Sound.createAsync(
              tapFile,
              { shouldPlay: false, volume: 0.5 },
              null,
              true
            );
            this.tapSoundPool.push(sound);
          } catch (err) {
            console.warn(`⚠️ Failed to load tap pool instance ${i}:`, err.message);
          }
        }
        console.log(`✅ Loaded ${this.tapSoundPool.length} tap sound pool instances`);
      } catch (err) {
        console.warn('⚠️ Failed to create tap sound pool:', err.message);
      }
      
      this.initialized = true;
      console.log('✅ SoundManager initialized');
    } catch (error) {
      console.error('❌ SoundManager initialization failed:', error);
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
        // Ses çalıyorsa durdur ve başa sar
        const status = await sound.getStatusAsync();
        
        if (status.isLoaded) {
          // 🔴 FIX: Seeking hatasını önlemek için try-catch ile sarmala
          try {
            if (status.isPlaying) {
              await sound.stopAsync();
            }
            // Position reset'i try-catch içinde yap
            // 🔴 BUG #4 FIX: Better logging for seeking errors
            try {
              await sound.setPositionAsync(0);
            } catch (seekError) {
              // Seeking interrupted hatası olabilir, devam et
              // 🔴 BUG #4 FIX: Improved logging - show error type but don't block
              console.log(`⚠️ Seek skipped for ${soundName} (non-critical): ${seekError.message || 'Seeking interrupted'}`);
            }
            await sound.playAsync();
            // === HAPTIC PATCH START ===
            console.log(`[SFX] key=${soundName}, success=true`);
            // === HAPTIC PATCH END ===
          } catch (playError) {
            // Play hatası oyunu durdurmamalı
            console.log(`⚠️ Play error for ${soundName} (non-critical):`, playError.message);
            console.log(`[SFX] key=${soundName}, success=false (play error)`);
          }
        }
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
        sound.playAsync().catch(() => {}); // Ignore play errors
        
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
            const status = await sound.getStatusAsync();
            if (status.isLoaded && status.isPlaying) {
              await sound.stopAsync();
            }
          } catch (e) {
            // Ignore
          }
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

