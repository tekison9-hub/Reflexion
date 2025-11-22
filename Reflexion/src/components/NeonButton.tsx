/**
 * ✅ NEON BUTTON - Reanimated 3 Animated Button
 * 
 * A button component with continuous pulsing glow animation
 * using React Native Reanimated 3.
 * 
 * Features:
 * - Continuous breathing/pulsing glow effect
 * - Haptic feedback on press
 * - Type-safe props
 * - Smooth animations with useSharedValue and withRepeat
 */

import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface NeonButtonProps {
  onPress: () => void;
  title: string;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  glowColor?: string;
  backgroundColor?: string;
  disabled?: boolean;
  hapticFeedback?: boolean;
}

/**
 * NeonButton Component
 * 
 * A button with continuous pulsing glow animation.
 * Uses Reanimated 3 for smooth, performant animations.
 * 
 * @param onPress - Callback function when button is pressed
 * @param title - Button text
 * @param icon - Optional emoji/icon to display before title
 * @param style - Additional styles for the button container
 * @param textStyle - Additional styles for the button text
 * @param glowColor - Color of the glow effect (default: '#4ECDC4')
 * @param backgroundColor - Background color of the button (default: 'rgba(78, 205, 196, 0.2)')
 * @param disabled - Whether the button is disabled
 * @param hapticFeedback - Enable haptic feedback on press (default: true)
 */
const NeonButton: React.FC<NeonButtonProps> = ({
  onPress,
  title,
  icon,
  style,
  textStyle,
  glowColor = '#4ECDC4',
  backgroundColor = 'rgba(78, 205, 196, 0.2)',
  disabled = false,
  hapticFeedback = true,
}) => {
  // ✅ Reanimated 3: Shared value for animation
  // This value will continuously animate from 0 to 1 and back
  const pulseAnimation = useSharedValue(0);

  // ✅ Start continuous pulsing animation on mount
  useEffect(() => {
    // ✅ withRepeat: Continuously repeat the animation
    // -1 means infinite repeat
    // true means reverse (goes back and forth)
    pulseAnimation.value = withRepeat(
      withTiming(1, {
        duration: 2000, // 2 seconds for one cycle
        easing: Easing.inOut(Easing.ease), // Smooth easing
      }),
      -1, // Infinite repeat
      true // Reverse animation (breathing effect)
    );
  }, [pulseAnimation]);

  // ✅ Animated style for glow effect
  const animatedGlowStyle = useAnimatedStyle(() => {
    // ✅ Interpolate opacity from 0.3 to 0.8 for breathing effect
    const opacity = interpolate(
      pulseAnimation.value,
      [0, 1],
      [0.3, 0.8]
    );

    // ✅ Interpolate scale from 1.0 to 1.05 for subtle size change
    const scale = interpolate(
      pulseAnimation.value,
      [0, 1],
      [1.0, 1.05]
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  // ✅ Animated style for shadow/glow
  const animatedShadowStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      pulseAnimation.value,
      [0, 1],
      [0.3, 0.6]
    );

    const shadowRadius = interpolate(
      pulseAnimation.value,
      [0, 1],
      [10, 20]
    );

    return {
      shadowOpacity,
      shadowRadius,
    };
  });

  // ✅ Handle press with haptic feedback
  const handlePress = () => {
    if (disabled) {
      return;
    }

    // ✅ Haptic feedback for tactile response
    if (hapticFeedback) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Haptics not available on this device
      }
    }

    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        style,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {/* ✅ Animated glow background */}
      <Animated.View
        style={[
          styles.glowBackground,
          {
            backgroundColor: glowColor,
          },
          animatedGlowStyle,
        ]}
      />

      {/* ✅ Animated shadow/glow effect */}
      <Animated.View
        style={[
          styles.shadowGlow,
          {
            shadowColor: glowColor,
          },
          animatedShadowStyle,
        ]}
      />

      {/* ✅ Button content */}
      <Animated.View style={styles.content}>
        {icon && <Text style={[styles.icon, textStyle]}>{icon}</Text>}
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  shadowGlow: {
    ...StyleSheet.absoluteFillObject,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    zIndex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});

export default NeonButton;








