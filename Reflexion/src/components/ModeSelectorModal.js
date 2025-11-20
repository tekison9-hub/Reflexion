import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GAME_MODES, GAME_CONSTANTS } from '../utils/GameLogic';
import { MODE_COLORS } from '../utils/themeTokens';
import { ANIMATION_EASING } from '../utils/animationConstants';
import { isSpeedTestTargetCountUnlocked } from '../utils/GameLogic';

/**
 * === AAA UI REDESIGN: Premium Mode Selector ===
 * Modern card-based design with LinearGradient and shadows
 * Speed Test: Shows target count selection sub-menu
 */
export default function ModeSelectorModal({ visible, onClose, onSelectMode, playerLevel = 1 }) {
  const insets = useSafeAreaInsets();
  const [expandedSpeedTest, setExpandedSpeedTest] = useState(false);
  const [selectedTargetCount, setSelectedTargetCount] = useState(null);
  
  // === AAA PREMIUM: Mode definitions with unlock logic ===
  const modes = [
    {
      id: GAME_MODES.CLASSIC,
      name: 'Classic Mode',
      icon: '⚡',
      description: 'Standard gameplay',
      color: MODE_COLORS.CLASSIC,
      gradientColors: ['#4ECDC4', '#00D9FF'],
      unlocked: true,
    },
    {
      id: GAME_MODES.RUSH,
      name: 'Rush Mode',
      icon: '💥',
      description: '30s fast round, combo boost every 5 taps',
      color: MODE_COLORS.RUSH,
      gradientColors: ['#FF6B9D', '#FFA500'],
      unlocked: true,
    },
    {
      id: GAME_MODES.ZEN,
      name: 'Zen Mode',
      icon: '🧠',
      description: 'Slow tempo, soothing visuals, no scoring',
      color: MODE_COLORS.ZEN,
      gradientColors: ['#C56CF0', '#E056FD'],
      unlocked: true,
    },
    {
      id: GAME_MODES.SPEED_TEST,
      name: 'Speed Test',
      icon: '⏱️',
      description: 'Measure your reaction time',
      color: MODE_COLORS.SPEED_TEST,
      gradientColors: ['#00D9FF', '#4ECDC4'],
      unlocked: true,
      isSpeedTest: true, // Special flag for Speed Test
    },
  ];

  // === AAA ANIMATIONS: Micro-animations for mode cards ===
  const modeAnims = modes.map(() => ({
    scale: useRef(new Animated.Value(1)).current,
    glow: useRef(new Animated.Value(0.75)).current,
  }));

  useEffect(() => {
    if (!visible) {
      // Reset state when modal closes
      setExpandedSpeedTest(false);
      setSelectedTargetCount(null);
      return;
    }

    // Breathing glow and micro-bounce animations
    modeAnims.forEach((anim, index) => {
      const delay = index * 150;

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
    });
  }, [visible]);

  // === AAA SPEED TEST FIX: Handle mode selection with target count ===
  const handleModeSelect = (mode) => {
    if (!mode.unlocked) return;

    // Speed Test: Show target count selection instead of launching immediately
    if (mode.isSpeedTest) {
      setExpandedSpeedTest(!expandedSpeedTest);
      return;
    }

    // Other modes: Launch immediately
    onSelectMode(mode.id);
    onClose();
  };

  // === AAA SPEED TEST FIX: Handle target count selection ===
  const handleTargetCountSelect = (targetCount) => {
    setSelectedTargetCount(targetCount);
    onSelectMode(GAME_MODES.SPEED_TEST, targetCount);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.95)', 'rgba(10, 15, 26, 0.95)']}
          style={styles.gradientOverlay}
        >
          <View style={styles.container}>
            {/* === AAA PREMIUM HEADER === */}
            <LinearGradient
              colors={['#0f1419', '#16213e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <Text style={styles.title}>Select Game Mode</Text>
            </LinearGradient>
            
            {/* === AAA PREMIUM: Mode cards with LinearGradient === */}
            <ScrollView 
              style={styles.modesContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {modes.map((mode, index) => (
                <Animated.View
                  key={mode.id}
                  style={{
                    transform: [{ scale: modeAnims[index].scale }],
                  }}
                >
                  <TouchableOpacity 
                    style={styles.modeCard}
                    onPress={() => handleModeSelect(mode)}
                    activeOpacity={0.9}
                  >
                    {/* === AAA PREMIUM: Gradient background === */}
                    <LinearGradient
                      colors={[`${mode.color}15`, `${mode.color}05`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardGradient}
                    />
                    
                    {/* Border glow effect */}
                    <Animated.View
                      style={[
                        styles.cardGlow,
                        {
                          borderColor: mode.color,
                          opacity: modeAnims[index].glow,
                        },
                      ]}
                    />

                    {/* Content */}
                    <View style={styles.cardContent}>
                      <Text style={styles.modeIcon}>{mode.icon}</Text>
                      <Text style={[styles.modeName, { color: mode.color }]}>
                        {mode.name}
                      </Text>
                      <Text style={styles.modeDesc}>{mode.description}</Text>
                    </View>

                    {/* === AAA SPEED TEST FIX: Target count selection sub-menu === */}
                    {mode.isSpeedTest && expandedSpeedTest && (
                      <View style={styles.targetCountContainer}>
                        <Text style={styles.targetCountTitle}>Select Target Count:</Text>
                        {GAME_CONSTANTS.SPEED_TEST_TARGET_COUNTS.map((count) => {
                          const isUnlocked = isSpeedTestTargetCountUnlocked(count, playerLevel);
                          const unlockLevel = GAME_CONSTANTS.SPEED_TEST_UNLOCK_LEVELS[count];
                          
                          return (
                            <TouchableOpacity
                              key={count}
                              style={[
                                styles.targetCountButton,
                                !isUnlocked && styles.targetCountButtonLocked,
                                selectedTargetCount === count && styles.targetCountButtonSelected,
                              ]}
                              onPress={() => isUnlocked && handleTargetCountSelect(count)}
                              disabled={!isUnlocked}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.targetCountText,
                                  !isUnlocked && styles.targetCountTextLocked,
                                ]}
                              >
                                {count} Targets
                                {!isUnlocked && ` (Level ${unlockLevel})`}
                              </Text>
                              {!isUnlocked && (
                                <Text style={styles.lockIcon}>🔒</Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>

            {/* === AAA PREMIUM: Cancel button === */}
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(150, 150, 170, 0.3)', 'rgba(100, 100, 120, 0.3)']}
                style={styles.cancelGradient}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gradientOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#16213e',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    overflow: 'hidden',
    // === AAA PREMIUM: Shadow effect ===
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    paddingVertical: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4ECDC4',
    textAlign: 'center',
    textShadowColor: 'rgba(78, 205, 196, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  modesContainer: {
    maxHeight: 500,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modeCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    // === AAA PREMIUM: Card shadow ===
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 2,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
    zIndex: 1,
  },
  modeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  modeName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  modeDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  // === AAA SPEED TEST: Target count selection styles ===
  targetCountContainer: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  targetCountTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    textAlign: 'center',
  },
  targetCountButton: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.4)',
  },
  targetCountButtonLocked: {
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
    borderColor: 'rgba(100, 100, 100, 0.4)',
    opacity: 0.5,
  },
  targetCountButtonSelected: {
    backgroundColor: 'rgba(78, 205, 196, 0.4)',
    borderColor: '#4ECDC4',
    borderWidth: 2,
  },
  targetCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  targetCountTextLocked: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  lockIcon: {
    fontSize: 16,
  },
  cancelButton: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cancelGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
  },
});
