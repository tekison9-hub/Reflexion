import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { GAME_MODES, isModeUnlocked } from '../utils/GameLogic';

/**
 * ModeSelectorModal - Modal for selecting game mode
 * Shows Classic, Rush, and Zen modes with unlock status
 */
export default function ModeSelectorModal({ visible, onClose, onSelectMode, playerLevel }) {
  const modes = [
    {
      id: GAME_MODES.CLASSIC,
      name: 'Classic Mode',
      icon: '⚡',
      description: 'Standard gameplay',
      color: '#4ECDC4',
      unlocked: true,
    },
    {
      id: GAME_MODES.RUSH,
      name: 'Rush Mode',
      icon: '💥',
      description: '30s fast round, combo boost every 5 taps',
      color: '#FF6B9D',
      unlocked: true,
    },
    {
      id: GAME_MODES.ZEN,
      name: 'Zen Mode',
      icon: '🧠',
      description: 'Slow tempo, soothing visuals, no scoring',
      color: '#C56CF0',
      unlocked: true,
    },
    {
      id: GAME_MODES.SPEED_TEST,
      name: 'Speed Test',
      icon: '⚡',
      description: 'Measure your reaction time',
      color: '#FFD93D',
      unlocked: true,
    },
  ];

  const handleModeSelect = (mode) => {
    if (mode.unlocked) {
      onSelectMode(mode.id);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Select Game Mode</Text>
          
          <View style={styles.modesContainer}>
            {modes.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.modeButton,
                  !mode.unlocked && styles.modeButtonLocked,
                ]}
                onPress={() => handleModeSelect(mode)}
                disabled={!mode.unlocked}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeIcon, { color: mode.color }]}>
                  {mode.icon}
                </Text>
                <Text style={styles.modeName}>{mode.name}</Text>
                <Text style={styles.modeDescription}>{mode.description}</Text>
                {!mode.unlocked && (
                  <Text style={styles.lockText}>
                    Unlock at Level {mode.unlockLevel}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#2C3E50',
    borderRadius: 20,
    padding: 30,
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
    textShadowRadius: 20,
  },
  modesContainer: {
    gap: 15,
    marginBottom: 20,
  },
  modeButton: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderWidth: 2,
    borderColor: '#4ECDC4',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  modeButtonLocked: {
    opacity: 0.5,
    borderColor: '#7F8C8D',
  },
  modeIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  modeName: {
    color: '#ECF0F1',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modeDescription: {
    color: '#BDC3C7',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  lockText: {
    color: '#FFD93D',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
  },
  closeButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#7F8C8D',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '600',
  },
});


