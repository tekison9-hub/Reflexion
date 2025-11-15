import React, { useEffect, useRef, memo } from 'react';
import { Pressable, View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { GAME_CONSTANTS, DANGER_CONFIG, POWERUP_CONFIG } from '../utils/GameLogic';

/**
 * ELITE v3.0: NeonTarget Component (Memoized for performance)
 * Features: danger points, power-ups, enhanced animations, optimized touch hitbox
 */
const NeonTarget = memo(function NeonTarget({ target, onTap, combo }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dangerPulseAnim = useRef(new Animated.Value(1)).current;
  const powerUpPulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation - Quick spring for responsive feel
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Lucky target pulse - More noticeable
    if (target.isLucky) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2, // Increased from 1.15
            duration: 250, // Faster pulse
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Danger target intense pulse - WARNING EFFECT
    if (target.isDanger) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dangerPulseAnim, {
            toValue: 1.3, // Aggressive pulse
            duration: 200, // Faster than lucky
            useNativeDriver: true,
          }),
          Animated.timing(dangerPulseAnim, {
            toValue: 0.9, // Contracts more
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // ELITE v3.0: Power-up smooth pulse and rotation - REWARD EFFECT
    if (target.isPowerUp) {
      // Smooth breathing pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(powerUpPulseAnim, {
            toValue: 1.25, // Gentle expansion
            duration: 400, // Slower, more majestic
            useNativeDriver: true,
          }),
          Animated.timing(powerUpPulseAnim, {
            toValue: 1.0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Continuous rotation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
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
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, lifetime - 350); // Start fade slightly earlier

    return () => clearTimeout(timer);
  }, [target.isLucky, target.isDanger, target.isPowerUp]);

  const handlePress = () => {
    // Immediate tap feedback - Scale up then fade out
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => onTap(target));
  };

  // Dynamic glow based on target type
  let glowIntensity = 20 + Math.min(combo * 2, 30);
  if (target.isDanger) {
    glowIntensity = 40; // Intense glow for danger
  } else if (target.isPowerUp) {
    glowIntensity = 50; // Maximum glow for power-ups (most attractive)
  }

  // IMPROVED: Larger touch hitbox than visual size
  const touchPadding = 15; // Extra touch area around target
  const hitSlop = { top: touchPadding, bottom: touchPadding, left: touchPadding, right: touchPadding };

  // Determine pulse animation priority: danger > power-up > lucky > normal
  const activePulse = target.isDanger ? dangerPulseAnim : 
                      target.isPowerUp ? powerUpPulseAnim : 
                      pulseAnim;

  // Rotation for power-ups
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: target.x,
          top: target.y,
          width: target.size,
          height: target.size,
          transform: [
            { scale: Animated.multiply(scaleAnim, activePulse) },
            ...(target.isPowerUp ? [{ rotate: rotation }] : []), // Rotate only power-ups
          ],
          opacity: opacityAnim,
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
            backgroundColor: target.color,
            shadowColor: target.isDanger ? DANGER_CONFIG.GLOW_COLOR : 
                        target.isPowerUp ? POWERUP_CONFIG.GLOW_COLOR : 
                        target.color,
            shadowOpacity: target.isDanger || target.isPowerUp ? 1.0 : 0.8,
            shadowRadius: glowIntensity,
            elevation: glowIntensity,
            borderWidth: target.isLucky ? 4 : 
                        target.isDanger ? 3 : 
                        target.isPowerUp ? 4 : 0,
            borderColor: target.isLucky ? '#FFD93D' : 
                        target.isDanger ? '#FF0000' : 
                        target.isPowerUp ? '#FFA500' : 'transparent',
          },
        ]}
        android_ripple={{
          color: 'rgba(255, 255, 255, 0.3)',
          borderless: true,
          radius: target.size / 2,
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
        {!target.isLucky && !target.isDanger && !target.isPowerUp && target.ballEmoji && (
          <View style={styles.ballEmojiContainer}>
            <Text style={styles.ballEmoji}>{target.ballEmoji}</Text>
          </View>
        )}
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

const styles = StyleSheet.create({
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
    // Minimum touch target size (iOS HIG: 44pt, Material: 48dp)
    minWidth: Platform.select({ ios: 44, android: 48, default: 44 }),
    minHeight: Platform.select({ ios: 44, android: 48, default: 44 }),
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
