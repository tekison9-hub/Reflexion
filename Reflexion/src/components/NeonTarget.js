import React, { useEffect, useRef, memo } from 'react';
import { Pressable, View, Text, Animated, Platform } from 'react-native';
import { createSafeStyleSheet } from '../utils/safeStyleSheet';
import { GAME_CONSTANTS, DANGER_CONFIG, POWERUP_CONFIG } from '../utils/GameLogic';
import {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  SPRING_CONFIG,
  TARGET_ANIMATION_CONFIG,
  ANIMATION_SCALE,
} from '../utils/animationConstants';
import { TOUCH_TARGET, ensureTouchTarget } from '../utils/layoutConstants';

/**
 * Helper: Normalize any value to a primitive number
 * Handles objects, strings, and ensures React Native receives primitives
 */
const normalizeNumeric = (value, fallback) => {
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  
  if (value && typeof value === 'object') {
    // Support common shapes like { diameter }, { size }, { radius }, { value }
    if (typeof value.diameter === 'number') return value.diameter;
    if (typeof value.size === 'number') return value.size;
    if (typeof value.radius === 'number') return value.radius;
    if (typeof value.value === 'number') return value.value;
  }
  
  return fallback;
};

/**
 * ELITE v3.0: NeonTarget Component (Memoized for performance)
 * Features: danger points, power-ups, enhanced animations, optimized touch hitbox
 */
const NeonTarget = memo(function NeonTarget({ target, onTap, combo, theme = null }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dangerPulseAnim = useRef(new Animated.Value(1)).current;
  const powerUpPulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 🔴 CRITICAL FIX: Ensure danger targets are immediately visible
    // Set initial opacity to 1 for all targets (especially danger targets)
    opacityAnim.setValue(1);
    
    // Entrance animation - Use centralized spring config
    // === NEON SAFE VALUES FIX START ===
    // Ensure spring config is safe and toValue is a primitive number
    const springConfig = TARGET_ANIMATION_CONFIG.ENTRANCE.CONFIG || SPRING_CONFIG.RESPONSIVE;
    const safeSpringConfig = {
      tension: typeof springConfig?.tension === 'number' ? springConfig.tension : 60,
      friction: typeof springConfig?.friction === 'number' ? springConfig.friction : 7,
    };
    // === NEON SAFE VALUES FIX END ===
    Animated.spring(scaleAnim, {
      ...safeSpringConfig,
      toValue: 1,
      useNativeDriver: true,
    }).start();

    // Lucky target pulse - Use centralized config
    if (target.isLucky) {
      const pulseConfig = TARGET_ANIMATION_CONFIG.PULSE.LUCKY;
      // === NEON SAFE VALUES FIX START ===
      // Ensure toValue is always a primitive number
      const pulseMax = typeof pulseConfig?.MAX === 'number' ? pulseConfig.MAX : 1.2;
      const pulseMin = typeof pulseConfig?.MIN === 'number' ? pulseConfig.MIN : 1.0;
      const pulseDuration = typeof pulseConfig?.DURATION === 'number' ? pulseConfig.DURATION : 250;
      // === NEON SAFE VALUES FIX END ===
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: pulseMax,
            duration: pulseDuration,
            easing: ANIMATION_EASING.EASE_IN_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: pulseMin,
            duration: pulseDuration,
            easing: ANIMATION_EASING.EASE_IN_OUT,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Danger target intense pulse - WARNING EFFECT
    if (target.isDanger) {
      const pulseConfig = TARGET_ANIMATION_CONFIG.PULSE.DANGER;
      // === NEON SAFE VALUES FIX START ===
      // Ensure toValue is always a primitive number
      const pulseMax = typeof pulseConfig?.MAX === 'number' ? pulseConfig.MAX : 1.3;
      const pulseMin = typeof pulseConfig?.MIN === 'number' ? pulseConfig.MIN : 0.9;
      const pulseDuration = typeof pulseConfig?.DURATION === 'number' ? pulseConfig.DURATION : 200;
      // === NEON SAFE VALUES FIX END ===
      Animated.loop(
        Animated.sequence([
          Animated.timing(dangerPulseAnim, {
            toValue: pulseMax,
            duration: pulseDuration,
            easing: ANIMATION_EASING.EASE_IN_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(dangerPulseAnim, {
            toValue: pulseMin,
            duration: pulseDuration,
            easing: ANIMATION_EASING.EASE_IN_OUT,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // ELITE v3.0: Power-up smooth pulse and rotation - REWARD EFFECT
    if (target.isPowerUp) {
      const pulseConfig = TARGET_ANIMATION_CONFIG.PULSE.POWER_UP;
      // === NEON SAFE VALUES FIX START ===
      // Ensure toValue is always a primitive number
      const pulseMax = typeof pulseConfig?.MAX === 'number' ? pulseConfig.MAX : 1.25;
      const pulseMin = typeof pulseConfig?.MIN === 'number' ? pulseConfig.MIN : 1.0;
      const pulseDuration = typeof pulseConfig?.DURATION === 'number' ? pulseConfig.DURATION : 400;
      // === NEON SAFE VALUES FIX END ===
      // Smooth breathing pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(powerUpPulseAnim, {
            toValue: pulseMax,
            duration: pulseDuration,
            easing: ANIMATION_EASING.EASE_IN_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(powerUpPulseAnim, {
            toValue: pulseMin,
            duration: pulseDuration,
            easing: ANIMATION_EASING.EASE_IN_OUT,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Continuous rotation
      // === NEON SAFE VALUES FIX START ===
      // Ensure rotation duration is a primitive number
      const rotationDuration = typeof ANIMATION_DURATION.ROTATION_CYCLE === 'number' ? ANIMATION_DURATION.ROTATION_CYCLE : 3000;
      // === NEON SAFE VALUES FIX END ===
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: rotationDuration,
          easing: ANIMATION_EASING.LINEAR,
          useNativeDriver: true,
        })
      ).start();
    }

    // Exit animation before lifetime ends
    let lifetime = GAME_CONSTANTS.CLASSIC_TARGET_LIFETIME;
    
    // Adjust lifetime based on target type
    if (target.isDanger) {
      lifetime = Math.floor(lifetime * DANGER_CONFIG.LIFETIME_MULTIPLIER); // 30% faster
    } else if (target.isPowerUp) {
      lifetime = Math.floor(lifetime * POWERUP_CONFIG.LIFETIME_MULTIPLIER); // 50% longer
    }
    
    const timer = setTimeout(() => {
      // === NEON SAFE VALUES FIX START ===
      // Ensure exit animation values are primitive numbers
      const exitScale = typeof ANIMATION_SCALE.EXIT === 'number' ? ANIMATION_SCALE.EXIT : 0.5;
      const exitDuration = typeof TARGET_ANIMATION_CONFIG.EXIT?.DURATION === 'number' ? TARGET_ANIMATION_CONFIG.EXIT.DURATION : 300;
      const exitEasing = TARGET_ANIMATION_CONFIG.EXIT?.EASING || ANIMATION_EASING.EASE_OUT;
      // === NEON SAFE VALUES FIX END ===
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: exitScale,
          duration: exitDuration,
          easing: exitEasing,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: exitDuration,
          easing: exitEasing,
          useNativeDriver: true,
        }),
      ]).start();
    }, lifetime - (typeof TARGET_ANIMATION_CONFIG.EXIT?.DURATION === 'number' ? TARGET_ANIMATION_CONFIG.EXIT.DURATION : 300) - 50); // Start fade slightly earlier

    return () => clearTimeout(timer);
  }, [target.isLucky, target.isDanger, target.isPowerUp]);

  const handlePress = () => {
    // 🔴 SINGLE TAP PIPELINE: NeonTarget only forwards taps, no processing
    if (!target || !target.id || !onTap) {
      return;
    }
    
    // Forward tap immediately - all processing happens in GameScreen
    try {
      onTap(target);
      console.log(`[TAP_OK] targetId=${target.id}`);
    } catch (error) {
      console.error('[TAP] NeonTarget: Error calling onTap', error);
    }
    
    // Visual feedback only - no gameplay logic
    // === NEON SAFE VALUES FIX START ===
    // Ensure bounce animation values are primitive numbers
    const bounceScale = typeof ANIMATION_SCALE.BOUNCE === 'number' ? ANIMATION_SCALE.BOUNCE : 1.2;
    const instantDuration = typeof ANIMATION_DURATION.INSTANT === 'number' ? ANIMATION_DURATION.INSTANT : 100;
    // === NEON SAFE VALUES FIX END ===
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: bounceScale,
        duration: instantDuration,
        easing: ANIMATION_EASING.EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: instantDuration,
        easing: ANIMATION_EASING.EASE_OUT,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // === NEON SAFE VALUES FIX START ===
  // 🎨 PREMIUM ESPORTS: Premium glow with max opacity 0.55 for non-fatiguing visuals
  // Use theme glow settings if available, otherwise use defaults
  // Ensure all theme values are primitives (numbers/strings), never objects
  const baseGlowRadius = typeof theme?.glowRadius === 'number' ? theme.glowRadius : 12;
  const baseGlowOpacity = typeof theme?.glowOpacity === 'number' ? theme.glowOpacity : 0.45;
  
  let glowIntensity = baseGlowRadius + Math.min(combo * 1, 6); // Softened radius with combo boost
  let glowOpacity = baseGlowOpacity;
  if (target.isDanger) {
    glowIntensity = baseGlowRadius + 6; // Softened intense glow for danger
    glowOpacity = Math.min(0.55, baseGlowOpacity + 0.1); // Max premium opacity
  } else if (target.isPowerUp) {
    glowIntensity = baseGlowRadius + 8; // Softened maximum glow for power-ups
    glowOpacity = Math.min(0.55, baseGlowOpacity + 0.1); // Max premium opacity
  }
  
  // Safe theme color extraction - ensure strings only, never objects
  const safePrimaryColor = typeof theme?.primaryColor === 'string' ? theme.primaryColor : (theme?.accentColor && typeof theme.accentColor === 'string' ? theme.accentColor : '#4ECDC4');
  const safeAccentColor = typeof theme?.accentColor === 'string' ? theme.accentColor : safePrimaryColor;
  const safeGlowColor = typeof theme?.glowColor === 'string' ? theme.glowColor : (typeof theme?.accentColor === 'string' ? theme.accentColor : safePrimaryColor);
  const themeGlowColor = safeGlowColor;
  
  // Safe particle color extraction
  const safeParticleColor = Array.isArray(theme?.particleColors) && typeof theme.particleColors[0] === 'string' ? theme.particleColors[0] : safePrimaryColor;
  
  console.log("NEON SAFE VALUES", { safePrimaryColor, safeAccentColor, safeGlowColor, safeParticleColor, baseGlowRadius, baseGlowOpacity });
  // === NEON SAFE VALUES FIX END ===

  // === NUMERIC NORMALIZATION FIX START ===
  // CRITICAL: Normalize all size/radius values to primitives before use in styles
  // Resolve raw size from target, with a sane fallback
  const rawTargetSize = target?.size;
  const normalizedTargetSize = normalizeNumeric(rawTargetSize, 80);
  
  // Resolve radius; if not provided or not numeric, fallback to diameter / 2
  const rawRadius = TOUCH_TARGET?.RADIUS?.[normalizedTargetSize];
  const normalizedBorderRadius = normalizeNumeric(rawRadius, normalizedTargetSize / 2);
  
  // Normalize TOUCH_TARGET.MINIMUM (may be object from Platform.select)
  const rawTouchMinimum = TOUCH_TARGET?.MINIMUM;
  const normalizedTouchMinimum = normalizeNumeric(rawTouchMinimum, 44);
  
  // Debug log in dev mode
  if (__DEV__) {
    console.log('[NEON_TARGET] size normalization', {
      sizeKey: rawTargetSize,
      rawSize: rawTargetSize,
      diameter: normalizedTargetSize,
      rawRadius: rawRadius,
      borderRadius: normalizedBorderRadius,
      touchMinimum: normalizedTouchMinimum,
    });
  }
  // === NUMERIC NORMALIZATION FIX END ===
  
  // IMPROVED: Larger touch hitbox than visual size
  // Ensure minimum touch target size per platform guidelines
  const visualSize = normalizedTargetSize;
  const minTouchSize = ensureTouchTarget(visualSize);
  const touchPadding = Math.max(15, (minTouchSize - visualSize) / 2);
  const hitSlop = { 
    top: touchPadding, 
    bottom: touchPadding, 
    left: touchPadding, 
    right: touchPadding 
  };

  // Determine pulse animation priority: danger > power-up > lucky > normal
  const activePulse = target.isDanger ? dangerPulseAnim : 
                      target.isPowerUp ? powerUpPulseAnim : 
                      pulseAnim;

  // Rotation for power-ups
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // 🔴 KESİN ÇÖZÜM: isProcessing mantığı kaldırıldı - target hemen siliniyor
  // Artık isProcessing kontrolüne gerek yok, her tap işleniyor

  return (
    <Animated.View
        style={[
        styles.container,
        {
          // === NUMERIC NORMALIZATION FIX START ===
          // CRITICAL: Use ONLY normalized primitive numbers for all numeric style props
          left: typeof target.x === 'number' ? target.x : 0,
          top: typeof target.y === 'number' ? target.y : 0,
          width: normalizedTargetSize,
          height: normalizedTargetSize,
          // === NUMERIC NORMALIZATION FIX END ===
          transform: [
            { scale: Animated.multiply(scaleAnim, activePulse) },
            ...(target.isPowerUp ? [{ rotate: rotation }] : []), // Rotate only power-ups
          ],
          opacity: opacityAnim, // 🔴 KRİTİK DÜZELTME: isProcessing durumunda useEffect ile 0.5'e animate ediliyor
        },
      ]}
      pointerEvents="box-none" // Allow touches to pass through transparent areas
    >
      <Pressable
        onPress={handlePress}
        hitSlop={hitSlop} // CRITICAL: Increases touch target size
          style={[
          styles.target,
          {
            // === NUMERIC NORMALIZATION FIX START ===
            // CRITICAL: minWidth and minHeight must use normalized primitive numbers
            minWidth: normalizedTouchMinimum,
            minHeight: normalizedTouchMinimum,
            // === NUMERIC NORMALIZATION FIX END ===
            // === NEON SAFE VALUES FIX START ===
            // 🎨 PREMIUM ESPORTS: Use theme accent color with premium glow
            // Ensure all color values are strings, never objects
            backgroundColor: safeAccentColor || (typeof target.color === 'string' ? target.color : '#4ECDC4'),
            shadowColor: target.isDanger
              ? (typeof DANGER_CONFIG.GLOW_COLOR === 'string' ? DANGER_CONFIG.GLOW_COLOR : '#FF0000')
              : target.isPowerUp
              ? (typeof POWERUP_CONFIG.GLOW_COLOR === 'string' ? POWERUP_CONFIG.GLOW_COLOR : '#FFA500')
              : themeGlowColor,
            shadowOpacity: glowOpacity, // Always plain number - shadowOpacity cannot use Animated values
            shadowRadius: glowIntensity, // 🎨 PREMIUM ESPORTS: Softened radius from theme
            elevation: glowIntensity,
            borderWidth: target.isLucky ? 4 : 
                        target.isDanger ? 3 : 
                        target.isPowerUp ? 4 : 0,
            borderColor: target.isLucky ? '#FFD93D' : 
                        target.isDanger ? '#FF0000' : 
                        target.isPowerUp ? '#FFA500' : 'transparent',
            // === NEON SAFE VALUES FIX END ===
          },
        ]}
        android_ripple={{
          color: 'rgba(255, 255, 255, 0.3)',
          borderless: true,
          radius: normalizedTargetSize / 2, // Use normalized size
        }}
      >
        {target.isLucky && (
          <View style={styles.luckyContainer}>
            <Text style={styles.luckyIcon}>⭐</Text>
          </View>
        )}
        {target.isDanger && (
          <View style={styles.dangerContainer}>
            <Text style={styles.dangerIcon}>⚠️</Text>
          </View>
        )}
        {target.isPowerUp && (
          <View style={styles.powerUpContainer}>
            <Text style={styles.powerUpIcon}>💎</Text>
          </View>
        )}
        {!target.isLucky && !target.isDanger && !target.isPowerUp && (() => {
          // 🔴 SAFE_EMOJI_PATCH: Never directly access emoji, always use safe fallback
          const safeEmoji = target?.ballEmoji ?? target?.emoji ?? target?.icon ?? target?.character ?? '⭕';
          return safeEmoji ? (
            <View style={styles.ballEmojiContainer}>
              <Text style={styles.ballEmoji}>{safeEmoji}</Text>
            </View>
          ) : null;
        })()}
        <View
          style={[
            styles.innerCircle,
            {
              width: '60%',
              height: '60%',
              backgroundColor: target.isDanger ? 'rgba(255, 0, 0, 0.6)' : 
                              target.isPowerUp ? 'rgba(255, 215, 0, 0.7)' :
                              'rgba(255, 255, 255, 0.3)',
            },
          ]}
        />
        
        {combo >= 5 && (
          <View style={styles.comboIndicator}>
            <Text style={styles.comboText}>{combo}×</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

export default NeonTarget;

const styles = createSafeStyleSheet({
  container: {
    position: 'absolute',
    // IMPORTANT: No overflow hidden - allows hitSlop to work
  },
  target: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    // NOTE: minWidth and minHeight are set dynamically in component style
    // to use normalized values - see inline styles in component
  },
  innerCircle: {
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Slightly more visible
  },
  luckyContainer: {
    position: 'absolute',
    zIndex: 2,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  luckyIcon: {
    fontSize: 28, // Larger for visibility
    textShadowColor: '#FFD93D',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  dangerContainer: {
    position: 'absolute',
    zIndex: 2,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerIcon: {
    fontSize: 32, // Larger than lucky
    textShadowColor: '#FF0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  powerUpContainer: {
    position: 'absolute',
    zIndex: 2,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  powerUpIcon: {
    fontSize: 36, // Largest icon - most important
    textShadowColor: '#FFA500',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  comboIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  comboText: {
    color: '#1a1a2e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ballEmojiContainer: {
    position: 'absolute',
    zIndex: 2,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ballEmoji: {
    fontSize: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
