import React, { useEffect, useRef, memo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * Particle Component (Memoized for performance)
 * Renders animated particle explosions on tap
 */
const Particle = memo(function Particle({ x, y, color, onComplete }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 60;
    const endX = Math.cos(angle) * distance;
    const endY = Math.sin(angle) * distance;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: endX,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: endY,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: x,
          top: y,
          backgroundColor: color,
          transform: [{ translateX }, { translateY }],
          opacity,
          shadowColor: color,
        },
      ]}
    />
  );
});

export default Particle;

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});
// ============================================================================


