import { Audio } from 'expo-av';
import soundManager from './SoundManager.js';

class MusicManager {
  constructor() {
    this.bgm = null;
    this.isPlaying = false;
    this.currentTrack = null;
    this.isMusicEnabled = true;
    this.volume = 0.5;
    this.isMenuPlaying = false;
    this.isGameplayPlaying = false;
  }

  async playMenuMusic() {
    if (!soundManager.isInitialized()) {
      return;
    }
    if (this.currentTrack === 'menu' && this.isPlaying) {
      return;
    }
    
    this.isMenuPlaying = true;
    this.isGameplayPlaying = false;
    await this.playTrack('menu', require('../../assets/music/menu_ambient.mp3'), 0.4);
  }

  async playGameplayMusic() {
    if (!soundManager.isInitialized()) {
      return;
    }
    if (this.currentTrack === 'game' && this.isPlaying) {
      return;
    }
    
    this.isGameplayPlaying = true;
    this.isMenuPlaying = false;
    await this.playTrack('game', require('../../assets/music/gameplay_energetic.mp3'), 0.25);
  }

  async playTrack(trackId, source, volume = 0.5) {
    if (!soundManager.isInitialized()) {
      return;
    }

    if (!this.isMusicEnabled) return;

    if (this.currentTrack === trackId && this.isPlaying) return; 

    try {
      const oldBgm = this.bgm;
      if (oldBgm) {
        this.bgm = null;
        this.isPlaying = false;
        this.currentTrack = null;
        try {
          await oldBgm.stopAsync();
        } catch (e) {
        }
        oldBgm.unloadAsync().catch(() => {});
      }

      const { sound } = await Audio.Sound.createAsync(
        source,
        { isLooping: true, volume: volume, shouldPlay: false }
      );

      this.bgm = sound;
      this.currentTrack = trackId;
      this.volume = volume; 

      await this.bgm.playAsync();
      this.isPlaying = true;
    } catch (error) {
      console.warn('Error playing music:', error);
      this.bgm = null;
      this.isPlaying = false;
      this.currentTrack = null;
    }
  }

  async stopMenuMusic() {
    if (this.currentTrack === 'menu' && this.bgm) {
      try {
        await this.bgm.stopAsync();
        await this.bgm.unloadAsync();
      } catch (e) { }
      this.bgm = null;
      this.isPlaying = false;
      this.currentTrack = null;
    }
    this.isMenuPlaying = false;
  }

  async stopGameplayMusic() {
    if (this.currentTrack === 'game' && this.bgm) {
      try {
        await this.bgm.stopAsync();
        await this.bgm.unloadAsync();
      } catch (e) { }
      this.bgm = null;
      this.isPlaying = false;
      this.currentTrack = null;
    }
    this.isGameplayPlaying = false;
  }

  async stopAll() {
    if (this.bgm) {
      try {
        await this.bgm.stopAsync();
        await this.bgm.unloadAsync();
      } catch (e) { }
      this.bgm = null;
    }
    this.isPlaying = false;
    this.currentTrack = null;
  }

  async setEnabled(enabled) {
    this.isMusicEnabled = enabled;
    if (!enabled) {
      await this.stopAll();
      this.isMenuPlaying = false;
      this.isGameplayPlaying = false;
    } else {
      if (soundManager.isInitialized()) {
        if (this.currentTrack === 'menu' && this.isPlaying) {
          return;
        }
        if (this.currentTrack === 'game' && this.isPlaying) {
          return;
        }
        if (!this.isPlaying && !this.currentTrack) {
          await this.playMenuMusic();
        }
      }
    }
  }

  async resetSpeed() {
    try {
      if (this.bgm && this.bgm.setRateAsync) {
        await this.bgm.setRateAsync(1.0, true);
        console.log('🎵 Music speed reset to normal');
      }
    } catch (error) {
      console.warn('⚠️ MusicManager.resetSpeed failed:', error);
    }
  }

  // Initialize MusicManager - does NOT play music automatically
  async init() {
    // MusicManager initialization is complete - no audio operations here
    // Music will be played only after SoundManager is fully initialized
    return Promise.resolve();
  }

  async initialize() {
    return this.init();
  }
}

export default new MusicManager();
