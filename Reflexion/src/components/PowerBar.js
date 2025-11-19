import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { createSafeStyleSheet } from '../utils/safeStyleSheet';
import {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  ANIMATION_SCALE,
  ANIMATION_OPACITY,
} from '../utils/animationConstants';
import { SPACING } from '../utils/layoutConstants';

/**
 * PowerBar Component - ReflexXP Power Bar
 * Fills with perfect taps and rewards with XP multiplier
 * Uses centralized animation constants for consistency
 */
export default function PowerBar({ power, isActive, theme = null }) {
  // 🎨 PREMIUM ESPORTS: Support both new token structure (accentColor) and legacy (primaryColor)
  const primaryColor = theme?.accentColor || theme?.primaryColor || '#00E5FF';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Pulse animation when active - use centralized duration
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: ANIMATION_SCALE.HOVER,
            duration: ANIMATION_DURATION.PULSE_CYCLE / 2,
            easing: ANIMATION_EASING.EASE_IN_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: ANIMATION_DURATION.PULSE_CYCLE / 2,
            easing: ANIMATION_EASING.EASE_IN_OUT,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Glow animation - use centralized duration
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: ANIMATION_DURATION.GLOW_CYCLE / 2,
            easing: ANIMATION_EASING.EASE_IN_OUT,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: ANIMATION_DURATION.GLOW_CYCLE / 2,
            easing: ANIMATION_EASING.EASE_IN_OUT,
            useNativeDriver: false,
          }),
        ])
      );
      glow.start();

      return () => {
        pulse.stop();
        glow.stop();
      };
    } else {
      // Reset animations when inactive
      scaleAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isActive]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [ANIMATION_OPACITY.GLOW_MIN, ANIMATION_OPACITY.GLOW_MAX],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>⚡ ReflexXP Power</Text>
      <Animated.View
        style={[
          styles.barContainer,
          isActive && { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              {
                width: `${power}%`,
                backgroundColor: primaryColor, // 🔴 BUG FIX: Always use theme primary color
                shadowColor: primaryColor, // 🔴 BUG FIX: Use theme color for shadow
                shadowOpacity: isActive ? glowOpacity : 0.3,
              },
            ]}
          />
        </View>
        {isActive && (
          <Text style={[styles.activeText, { 
            color: primaryColor,
            textShadowColor: primaryColor, // 🔴 BUG FIX: Use theme color for text shadow
          }]}>
            2× XP ACTIVE!
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = createSafeStyleSheet({
  container: {
    width: '100%',
    paddingHorizontal: SPACING.SCREEN_PADDING,
    marginBottom: SPACING.SM,
  },
  label: {
    color: '#BDC3C7',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  barContainer: {
    width: '100%',
  },
  barTrack: {
    height: 12,
    backgroundColor: '#2C3E50',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
    // 🔴 BUG FIX: shadowColor is set dynamically via inline style
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  activeText: {
    // 🔴 BUG FIX: color is set dynamically via inline style
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
    // 🔴 BUG FIX: textShadowColor is set dynamically via inline style
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});

