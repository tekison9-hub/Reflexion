import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GAME_MODES } from '../utils/GameLogic';
import { MODE_COLORS } from '../utils/themeTokens';
import { ANIMATION_EASING } from '../utils/animationConstants';

/**
 * ModeSelectorModal - Modal for selecting game mode
 * CRITICAL FIX: Restored game mode buttons with proper layout
 */
export default function ModeSelectorModal({ visible, onClose, onSelectMode, playerLevel }) {
  const insets = useSafeAreaInsets();
  
  // VISUAL UPGRADE: Mode colors using centralized MODE_COLORS
  const modes = [
    {
      id: GAME_MODES.CLASSIC,
      name: 'Classic Mode',
      icon: '⚡',
      description: 'Standard gameplay',
      color: MODE_COLORS.CLASSIC, // VISUAL UPGRADE: Turquoise
      unlocked: true,
    },
    {
      id: GAME_MODES.RUSH,
      name: 'Rush Mode',
      icon: '💥',
      description: '30s fast round, combo boost every 5 taps',
      color: MODE_COLORS.RUSH, // VISUAL UPGRADE: Energy Neon Red/Orange
      unlocked: true,
    },
    {
      id: GAME_MODES.ZEN,
      name: 'Zen Mode',
      icon: '🧠',
      description: 'Slow tempo, soothing visuals, no scoring',
      color: MODE_COLORS.ZEN, // VISUAL UPGRADE: Soft Lavender
      unlocked: true,
    },
    {
      id: GAME_MODES.SPEED_TEST,
      name: 'Speed Test',
      icon: '⏱️',
      description: 'Measure your reaction time',
      color: MODE_COLORS.SPEED_TEST, // VISUAL UPGRADE: Ice-Blue / Steel gray
      unlocked: true,
    },
  ];

  // VISUAL UPGRADE: Micro-animations for mode cards
  const modeAnims = modes.map(() => ({
    scale: useRef(new Animated.Value(1)).current,
    glow: useRef(new Animated.Value(0.75)).current,
  }));

  useEffect(() => {
    if (!visible) return;

    // VISUAL UPGRADE: Breathing glow and micro-bounce for each mode card
    modeAnims.forEach((anim, index) => {
      // Stagger animations
      const delay = index * 150;

      // === EASING FIX START ===
      // Breathing glow (opacity 0.75 → 1.0)
      const breathingGlow = Animated.loop(
        Animated.sequence([
          Animated.timing(anim.glow, {
            toValue: 1.0,
            duration: 2000,
            delay,
            easing: ANIMATION_EASING.DOPAMINE_EASING_OUT_CUBIC,
            useNativeDriver: true,
          }),
          Animated.timing(anim.glow, {
            toValue: 0.75,
            duration: 2000,
            easing: ANIMATION_EASING.DOPAMINE_EASING_OUT_CUBIC,
            useNativeDriver: true,
          }),
        ])
      );
      breathingGlow.start();

      // Soft scale micro-bounce (1.0 → 1.02 → 1.0)
      const microBounce = Animated.loop(
        Animated.sequence([
          Animated.timing(anim.scale, {
            toValue: 1.02,
            duration: 1500,
            delay,
            easing: ANIMATION_EASING.DOPAMINE_EASING_OUT_CUBIC,
            useNativeDriver: true,
          }),
          Animated.timing(anim.scale, {
            toValue: 1.0,
            duration: 1500,
            easing: ANIMATION_EASING.DOPAMINE_EASING_OUT_CUBIC,
            useNativeDriver: true,
          }),
        ])
      );
      microBounce.start();
      // === EASING FIX END ===
    });
  }, [visible]);

  const handleModeSelect = (mode) => {
    if (mode.unlocked) {
      onSelectMode(mode.id);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.container}>
          {/* HEADER */}
          <Text style={styles.title}>Select Game Mode</Text>
          
          {/* GAME MODE BUTTONS - RESTORED */}
          <ScrollView 
            style={styles.modesContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* VISUAL UPGRADE: Mode cards with micro-animations */}
            {modes.map((mode, index) => (
              <Animated.View
                key={mode.id}
                style={{
                  transform: [{ scale: modeAnims[index].scale }],
                }}
              >
                <TouchableOpacity 
                  style={[styles.modeButton, { borderColor: mode.color }]}
                  onPress={() => handleModeSelect(mode)}
                  activeOpacity={0.8}
                >
                  <Animated.View
                    style={[
                      styles.modeGlow,
                      {
                        backgroundColor: `${mode.color}20`,
                        opacity: modeAnims[index].glow,
                      },
                    ]}
                  />
                  <Text style={styles.modeIcon}>{mode.icon}</Text>
                  <Text style={[styles.modeName, { color: mode.color }]}>{mode.name}</Text>
                  <Text style={styles.modeDesc}>{mode.description}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>

          {/* CANCEL BUTTON */}
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#16213e',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    borderWidth: 2,
    borderColor: '#4dd0e1',
    overflow: 'hidden',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4dd0e1',
    textAlign: 'center',
    paddingVertical: 24,
    backgroundColor: '#0f1419',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  modesContainer: {
    maxHeight: 400, // CRITICAL FIX: Set explicit max height so ScrollView works
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modeButton: {
    backgroundColor: 'rgba(10, 15, 26, 0.8)', // VISUAL UPGRADE: Increased contrast
    borderRadius: 16, // VISUAL UPGRADE: Normalized border radius
    padding: 20,
    marginBottom: 16, // VISUAL UPGRADE: Increased spacing
    borderWidth: 2,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  modeGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  modeIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  modeName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    // VISUAL UPGRADE: Color set dynamically from mode color
  },
  modeDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)', // VISUAL UPGRADE: Increased contrast
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(150, 150, 170, 0.3)',
    paddingVertical: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 17,
    color: '#ffffff',
    fontWeight: '600',
  },
});
