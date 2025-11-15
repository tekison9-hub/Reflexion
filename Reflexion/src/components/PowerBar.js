import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

/**
 * PowerBar Component - ReflexXP Power Bar
 * Fills with perfect taps and rewards with XP multiplier
 */
export default function PowerBar({ power, isActive, theme = null }) {
  // Default theme colors if theme is not provided
  const primaryColor = theme?.primaryColor || '#4ECDC4';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Pulse animation when active
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Glow animation
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );
      glow.start();

      return () => {
        pulse.stop();
        glow.stop();
      };
    }
  }, [isActive]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
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
                backgroundColor: isActive ? primaryColor : '#4ECDC4',
                shadowOpacity: isActive ? glowOpacity : 0.3,
              },
            ]}
          />
        </View>
        {isActive && (
          <Text style={[styles.activeText, { color: primaryColor }]}>
            2× XP ACTIVE!
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 10,
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
    shadowColor: '#4ECDC4',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  activeText: {
    color: '#4ECDC4',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: '#4ECDC4',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});

