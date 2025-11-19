import React, { useEffect, useRef, memo } from 'react';
import { View, Animated } from 'react-native';
import { createSafeStyleSheet } from '../utils/safeStyleSheet';
import { 
  ANIMATION_DURATION, 
  ANIMATION_EASING, 
  PARTICLE_CONFIG 
} from '../utils/animationConstants';

/**
 * Particle Component (Memoized for performance)
 * Renders animated particle explosions on tap
 * Uses centralized animation constants for consistency
 */
const Particle = memo(function Particle({ x, y, color, emoji = null, onComplete, theme = null }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = PARTICLE_CONFIG.DISTANCE.MIN + 
                     Math.random() * PARTICLE_CONFIG.DISTANCE.SPREAD;
    const endX = Math.cos(angle) * distance;
    const endY = Math.sin(angle) * distance;

    // Scale up quickly on spawn
    Animated.spring(scale, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Main animation: burst outward and fade
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: endX,
        duration: ANIMATION_DURATION.PARTICLE_BURST,
        easing: ANIMATION_EASING.EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: endY,
        duration: ANIMATION_DURATION.PARTICLE_BURST,
        easing: ANIMATION_EASING.EASE_OUT,
        useNativeDriver: true,
      }),
      // VISUAL UPGRADE: Faster fade-out for clearer success communication
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIMATION_DURATION.PARTICLE_BURST * 0.85, // 15% faster fade
        easing: ANIMATION_EASING.EASE_OUT,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

  // 🔴 SAFE_EMOJI_PATCH: Never directly access emoji, always use safe fallback
  // Safe fallback: ensure emoji is always a valid string or null
  const safeEmoji = (emoji && typeof emoji === 'string' && emoji.trim() !== '') 
    ? emoji 
    : null;
  
  // === THEME SANITIZATION FIX START ===
  // 🎨 PREMIUM ESPORTS: Use theme particle colors with premium glow
  // Ensure all theme values are primitives (strings/numbers), never objects
  const safeParticleColors = Array.isArray(theme?.particleColors) && theme.particleColors.length > 0
    ? theme.particleColors.filter(c => typeof c === 'string')
    : [];
  const particleColor = safeParticleColors.length > 0 
    ? safeParticleColors[0] 
    : (typeof theme?.accentColor === 'string' ? theme.accentColor : 
       (typeof theme?.primaryColor === 'string' ? theme.primaryColor : 
        (typeof color === 'string' ? color : '#4ECDC4')));
  
  // 🎨 PREMIUM ESPORTS: Use theme particle glow for premium neon effect
  // Ensure glowColor is always a string, never an object
  const particleGlowColor = typeof theme?.particleGlow === 'string' ? theme.particleGlow :
                           (typeof theme?.glowColor === 'string' ? theme.glowColor : particleColor);
  
  // Ensure numeric values are primitives
  const safeGlowOpacity = typeof theme?.glowOpacity === 'number' ? theme.glowOpacity : 0.55;
  const safeGlowRadius = typeof theme?.glowRadius === 'number' ? theme.glowRadius : 12;
  // === THEME SANITIZATION FIX END ===

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: x,
          top: y,
          backgroundColor: safeEmoji ? 'transparent' : particleColor, // Transparent if using emoji
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
          shadowColor: safeEmoji ? 'transparent' : particleGlowColor,
          shadowOpacity: safeEmoji ? 0 : safeGlowOpacity, // VISUAL UPGRADE: Slightly brighter for success clarity
          shadowRadius: safeEmoji ? 0 : safeGlowRadius, // 🎨 PREMIUM ESPORTS: Softened radius from theme
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    >
      {safeEmoji ? (
        <Animated.Text
          style={[
            styles.emoji,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          {safeEmoji}
        </Animated.Text>
      ) : null}
    </Animated.View>
  );
});

export default Particle;

const styles = createSafeStyleSheet({
  particle: {
    position: 'absolute',
    width: PARTICLE_CONFIG.SIZE.DEFAULT,
    height: PARTICLE_CONFIG.SIZE.DEFAULT,
    borderRadius: PARTICLE_CONFIG.SIZE.DEFAULT / 2,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  emoji: {
    fontSize: PARTICLE_CONFIG.SIZE.DEFAULT * 0.8, // Slightly smaller than container
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
// ============================================================================


