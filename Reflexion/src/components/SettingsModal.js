import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { createSafeStyleSheet } from '../utils/safeStyleSheet';
// ✅ FIX: Use named import for consistency
import { settingsService } from '../services/SettingsService';
import musicManager from '../services/MusicManager';

export default function SettingsModal({ visible, onClose }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  useEffect(() => {
    if (visible) {
      try {
        // Load current settings safely
        if (settingsService && typeof settingsService.getSoundEnabled === 'function') {
          setSoundEnabled(settingsService.getSoundEnabled());
        }
        if (settingsService && typeof settingsService.getHapticsEnabled === 'function') {
          setHapticsEnabled(settingsService.getHapticsEnabled());
        }
        
        // Load music setting safely
        if (musicManager && typeof musicManager.getStatus === 'function') {
          const musicStatus = musicManager.getStatus();
          setMusicEnabled(musicStatus?.isMusicEnabled ?? true);
        }
      } catch (error) {
        console.warn('⚠️ Error loading settings in SettingsModal:', error);
      }
    }
  }, [visible]);

  const handleSoundToggle = async (value) => {
    setSoundEnabled(value);
    try {
      if (settingsService && typeof settingsService.setSoundEnabled === 'function') {
        await settingsService.setSoundEnabled(value);
        // === HAPTIC PATCH START ===
        // Log real updated values
        const currentSfx = value;
        const currentVibration = hapticsEnabled;
        console.log(`⚙️ SettingsChange => { sfx: ${currentSfx}, vibration: ${currentVibration} }`);
        // === HAPTIC PATCH END ===
        const { debugEvents } = require('../utils/debugLog');
        debugEvents.settingsChange(value, hapticsEnabled);
      }
    } catch (error) {
      console.warn('⚠️ Error toggling sound:', error);
    }
  };

  const handleMusicToggle = async (value) => {
    setMusicEnabled(value);
    try {
      if (musicManager && typeof musicManager.setEnabled === 'function') {
        await musicManager.setEnabled(value);
        if (value) {
          // Resume menu music if enabled
          if (typeof musicManager.playMenuMusic === 'function') {
            await musicManager.playMenuMusic();
          }
        } else {
          if (typeof musicManager.stopAll === 'function') {
            await musicManager.stopAll();
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error toggling music:', error);
    }
  };

  const handleHapticsToggle = async (value) => {
    setHapticsEnabled(value);
    try {
      if (settingsService && typeof settingsService.setHapticsEnabled === 'function') {
        await settingsService.setHapticsEnabled(value);
        // === HAPTIC PATCH START ===
        // Log real updated values
        const currentSfx = soundEnabled;
        const currentVibration = value;
        console.log(`⚙️ SettingsChange => { sfx: ${currentSfx}, vibration: ${currentVibration} }`);
        // === HAPTIC PATCH END ===
        const { debugEvents } = require('../utils/debugLog');
        debugEvents.settingsChange(soundEnabled, value);
      }
    } catch (error) {
      console.warn('⚠️ Error toggling haptics:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>⚙️ Settings</Text>

          {/* Music Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>🎵 Background Music</Text>
              <Text style={styles.settingDesc}>
                Enable menu and gameplay music
              </Text>
            </View>
            <Switch
              value={musicEnabled}
              onValueChange={handleMusicToggle}
              trackColor={{ false: '#7F8C8D', true: '#4ECDC4' }}
              thumbColor={musicEnabled ? '#FFF' : '#BDC3C7'}
              ios_backgroundColor="#7F8C8D"
            />
          </View>

          {/* Sound Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>🔊 Sound Effects</Text>
              <Text style={styles.settingDesc}>
                Enable audio for taps, combos, and events
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={handleSoundToggle}
              trackColor={{ false: '#7F8C8D', true: '#4ECDC4' }}
              thumbColor={soundEnabled ? '#FFF' : '#BDC3C7'}
              ios_backgroundColor="#7F8C8D"
            />
          </View>

          {/* Haptics Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>📳 Vibration</Text>
              <Text style={styles.settingDesc}>
                Haptic feedback on taps and combos
              </Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={handleHapticsToggle}
              trackColor={{ false: '#7F8C8D', true: '#4ECDC4' }}
              thumbColor={hapticsEnabled ? '#FFF' : '#BDC3C7'}
              ios_backgroundColor="#7F8C8D"
            />
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = createSafeStyleSheet({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#2C3E50',
    borderRadius: 20,
    padding: 25,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  title: {
    color: '#4ECDC4',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    textShadowColor: '#4ECDC4',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.5)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    color: '#ECF0F1',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDesc: {
    color: '#BDC3C7',
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  closeButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


