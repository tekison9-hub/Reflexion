import React, { useEffect, useRef, memo } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';

/**
 * FloatingScore Component (Memoized for performance)
 * Renders animated floating score text on tap
 */
const FloatingScore = memo(function FloatingScore({ x, y, text, color, onComplete }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -60,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

  return (
    <Animated.Text
      style={[
        styles.text,
        {
          left: x,
          top: y,
          color: color || '#FFD93D',
          transform: [{ translateY }],
          opacity,
          textShadowColor: color || '#FFD93D',
        },
      ]}
    >
      {text}
    </Animated.Text>
  );
});

export default FloatingScore;

const styles = StyleSheet.create({
  text: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
});
// ============================================================================


