/**
 * Centralized Animation Constants & Utilities
 * Ensures consistent timing, easing, and animation behavior across the app
 * Based on Apple HIG and modern mobile game best practices
 */

import { Easing } from 'react-native';

/**
 * Standard Animation Durations (ms)
 * Based on Apple HIG: Fast (200ms), Normal (300ms), Slow (500ms)
 */
export const ANIMATION_DURATION = {
  // Instant feedback (taps, presses)
  INSTANT: 100,
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  SLOWER: 800,
  
  // Specific use cases
  TARGET_ENTRANCE: 250,      // Target spawn animation
  TARGET_EXIT: 300,           // Target fade out
  PARTICLE_BURST: 600,        // Particle explosion
  FLOATING_SCORE: 1000,       // Score text animation
  MODAL_ENTER: 300,           // Modal appearance
  MODAL_EXIT: 200,            // Modal dismissal
  BUTTON_PRESS: 150,          // Button feedback
  PULSE_CYCLE: 800,           // Pulse animation cycle
  GLOW_CYCLE: 1000,           // Glow animation cycle
  ROTATION_CYCLE: 3000,       // Full rotation (power-up)
};

/**
 * Standard Easing Curves
 * Using React Native's built-in easing functions
 */
export const ANIMATION_EASING = {
  // Standard curves
  LINEAR: Easing.linear,
  EASE_IN: Easing.in(Easing.ease),
  EASE_OUT: Easing.out(Easing.ease),
  EASE_IN_OUT: Easing.inOut(Easing.ease),
  
  // Material Design curves
  STANDARD: Easing.bezier(0.4, 0.0, 0.2, 1.0),
  DECELERATE: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  ACCELERATE: Easing.bezier(0.4, 0.0, 1.0, 1.0),
  
  // iOS curves
  EASE_IN_QUAD: Easing.in(Easing.quad),
  EASE_OUT_QUAD: Easing.out(Easing.quad),
  EASE_IN_OUT_QUAD: Easing.inOut(Easing.quad),
  
  // Bounce effects
  BOUNCE_OUT: Easing.out(Easing.bounce),
  
  // Elastic effects
  ELASTIC_OUT: Easing.out(Easing.elastic(1)),
  
  // === EASING FIX START ===
  // VISUAL UPGRADE: Safe dopamine easing helper for breathing glow and micro-bounce animations
  DOPAMINE_EASING_OUT_CUBIC: (() => {
    try {
      return Easing && typeof Easing.out === 'function' && typeof Easing.cubic === 'function'
        ? Easing.out(Easing.cubic)
        : Easing.ease; // Fallback to default easing if construction fails
    } catch (e) {
      return Easing.ease; // Fallback to default easing on error
    }
  })(),
  // === EASING FIX END ===
};

/**
 * Spring Animation Presets
 * Consistent spring physics across components
 */
export const SPRING_CONFIG = {
  // Responsive (for immediate feedback)
  RESPONSIVE: {
    tension: 60,
    friction: 7,
  },
  
  // Smooth (for UI transitions)
  SMOOTH: {
    tension: 40,
    friction: 6,
  },
  
  // Bouncy (for celebratory effects)
  BOUNCY: {
    tension: 100,
    friction: 8,
  },
  
  // Gentle (for subtle animations)
  GENTLE: {
    tension: 30,
    friction: 8,
  },
};

/**
 * Animation Scale Values
 * Consistent scale transformations
 */
export const ANIMATION_SCALE = {
  PRESSED: 0.95,
  HOVER: 1.05,
  PULSE_MIN: 0.9,
  PULSE_MAX: 1.15,
  PULSE_AGGRESSIVE: 1.3,
  ENTRANCE: 0,
  EXIT: 0.5,
  BOUNCE: 1.2,
};

/**
 * Animation Opacity Values
 * Consistent opacity transitions
 */
export const ANIMATION_OPACITY = {
  HIDDEN: 0,
  VISIBLE: 1,
  DISABLED: 0.5,
  OVERLAY: 0.9,
  GLOW_MIN: 0.4,
  GLOW_MAX: 1.0,
};

/**
 * Particle Animation Constants
 */
export const PARTICLE_CONFIG = {
  COUNT: {
    NORMAL: 10,
    LUCKY: 15,
    DANGER: 15,
    POWER_UP: 20,
  },
  DISTANCE: {
    MIN: 40,
    MAX: 100,
    SPREAD: 60,
  },
  SIZE: {
    MIN: 8,
    MAX: 12,
    DEFAULT: 10,
  },
};

/**
 * Floating Score Animation Constants
 */
export const FLOATING_SCORE_CONFIG = {
  DISTANCE: 60,
  DURATION: ANIMATION_DURATION.FLOATING_SCORE,
  FONT_SIZE: {
    NORMAL: 24,
    COMBO: 28,
    BONUS: 32,
  },
};

/**
 * Target Animation Constants
 */
export const TARGET_ANIMATION_CONFIG = {
  ENTRANCE: {
    TYPE: 'spring',
    CONFIG: SPRING_CONFIG.RESPONSIVE,
  },
  EXIT: {
    DURATION: ANIMATION_DURATION.TARGET_EXIT,
    EASING: ANIMATION_EASING.EASE_OUT,
  },
  PULSE: {
    LUCKY: {
      MIN: 1,
      MAX: 1.2,
      DURATION: 250,
    },
    DANGER: {
      MIN: 0.9,
      MAX: 1.3,
      DURATION: 200,
    },
    POWER_UP: {
      MIN: 1.0,
      MAX: 1.25,
      DURATION: 400,
    },
  },
};

/**
 * Combo Animation Constants
 */
export const COMBO_ANIMATION_CONFIG = {
  MILESTONE_TRIGGER: 5,        // Trigger effects every N combos
  CAMERA_SHAKE_DURATION: 200,  // Total shake duration
  CAMERA_SHAKE_INTENSITY: 10,  // Shake distance in pixels
};

/**
 * Helper function to create consistent timing animation
 */
export function createTimingAnimation(value, toValue, duration = ANIMATION_DURATION.NORMAL, easing = ANIMATION_EASING.EASE_OUT) {
  return {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  };
}

/**
 * Helper function to create consistent spring animation
 */
export function createSpringAnimation(value, toValue, config = SPRING_CONFIG.SMOOTH) {
  return {
    toValue,
    ...config,
    useNativeDriver: true,
  };
}

/**
 * Helper function to create pulse animation loop
 */
export function createPulseAnimation(value, min, max, duration) {
  return {
    inputRange: [0, 1],
    outputRange: [min, max],
    duration,
  };
}

// === ANIMATION_EASING FIX START ===
// VISUAL UPGRADE: Global fallback for ANIMATION_EASING to prevent ReferenceError
// This ensures ANIMATION_EASING exists globally even if import is missed
if (typeof globalThis !== 'undefined' && !Object.prototype.hasOwnProperty.call(globalThis, 'ANIMATION_EASING')) {
  Object.defineProperty(globalThis, 'ANIMATION_EASING', {
    value: ANIMATION_EASING,
    writable: false,
    configurable: false,
  });
  console.log('SAFE_ANIMATION_EASING_APPLIED');
}
// === ANIMATION_EASING FIX END ===

export default {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  SPRING_CONFIG,
  ANIMATION_SCALE,
  ANIMATION_OPACITY,
  PARTICLE_CONFIG,
  FLOATING_SCORE_CONFIG,
  TARGET_ANIMATION_CONFIG,
  COMBO_ANIMATION_CONFIG,
  createTimingAnimation,
  createSpringAnimation,
  createPulseAnimation,
};






