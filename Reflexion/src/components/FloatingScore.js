import React, { useEffect, useRef, memo } from 'react';
import { Text, Animated } from 'react-native';
import { createSafeStyleSheet } from '../utils/safeStyleSheet';
import { 
  ANIMATION_DURATION, 
  ANIMATION_EASING, 
  FLOATING_SCORE_CONFIG 
} from '../utils/animationConstants';

/**
 * FloatingScore Component (Memoized for performance)
 * Renders animated floating score text on tap
 * Uses centralized animation constants for consistency
 */
const FloatingScore = memo(function FloatingScore({ x, y, text, color, onComplete, isCombo = false, isBonus = false }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance: scale up quickly
    Animated.spring(scale, {
      toValue: 1,
      tension: 100,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Main animation: float up and fade out
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -FLOATING_SCORE_CONFIG.DISTANCE,
        duration: FLOATING_SCORE_CONFIG.DURATION,
        easing: ANIMATION_EASING.EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: FLOATING_SCORE_CONFIG.DURATION,
        easing: ANIMATION_EASING.EASE_OUT,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

  // Determine font size based on type
  const fontSize = isBonus 
    ? FLOATING_SCORE_CONFIG.FONT_SIZE.BONUS 
    : isCombo 
    ? FLOATING_SCORE_CONFIG.FONT_SIZE.COMBO 
    : FLOATING_SCORE_CONFIG.FONT_SIZE.NORMAL;

  return (
    <Animated.Text
      style={[
        styles.text,
        {
          left: x,
          top: y,
          color: color || '#FFD93D',
          fontSize,
          transform: [{ translateY }, { scale }],
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

const styles = createSafeStyleSheet({
  text: {
    position: 'absolute',
    fontWeight: 'bold',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
});
// ============================================================================


