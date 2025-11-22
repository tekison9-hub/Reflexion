/**
 * ✅ AAA STANDARDS: Glassmorphism Button Component
 * Liquid glass UI with blur effect and smooth interactions
 */

import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const GlassButton = React.memo(({ 
  onPress, 
  title, 
  icon, 
  style, 
  textStyle,
  intensity = 25,
  tint = 'light',
  hapticFeedback = true,
}) => {
  const handlePress = () => {
    // ✅ AAA: Haptic feedback for tactile response
    if (hapticFeedback) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Haptics not available on this device
      }
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={tint}
        style={styles.blurView}
      >
        <Text style={[styles.icon, textStyle]}>{icon}</Text>
        {title && <Text style={[styles.text, textStyle]}>{title}</Text>}
      </BlurView>
    </Pressable>
  );
});

GlassButton.displayName = 'GlassButton';

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // ✅ AAA: Glass border
  },
  blurView: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // ✅ AAA: Glass background
    minHeight: 56,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }], // ✅ AAA: Micro-interaction feedback
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default GlassButton;









