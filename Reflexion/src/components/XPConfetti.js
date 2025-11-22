/**
 * ✅ AAA STANDARDS: XP Confetti Particle Effect
 * Dopamine-inducing visual feedback when XP is earned
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const XPConfetti = React.memo(({ visible, amount, onComplete }) => {
  const particles = useRef([]);
  const animValues = useRef([]);

  useEffect(() => {
    if (!visible) {
      // Reset particles when hidden
      particles.current = [];
      animValues.current = [];
      return;
    }

    // ✅ AAA: Create 20-30 particles for rich visual feedback
    const particleCount = Math.min(30, Math.max(20, Math.floor(amount / 10)));
    particles.current = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // Percentage from left
      delay: Math.random() * 300, // Stagger animation
      duration: 1500 + Math.random() * 500, // 1.5-2s animation
    }));

    // ✅ AAA: Animate particles floating upward
    animValues.current = particles.current.map((particle) => {
      const anim = new Animated.Value(0);
      
      Animated.timing(anim, {
        toValue: 1,
        duration: particle.duration,
        delay: particle.delay,
        useNativeDriver: true,
      }).start(() => {
        // Call onComplete when all animations finish
        if (particle.id === particles.current.length - 1) {
          onComplete?.();
        }
      });

      return anim;
    });
  }, [visible, amount, onComplete]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle, index) => {
        const anim = animValues.current[index];
        if (!anim) return null;

        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -200], // Float upward
        });

        const opacity = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1, 0], // Fade out
        });

        const scale = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.5, 1, 0.8], // Scale up then down
        });

        // ✅ AAA: Random colors for visual variety
        const colors = ['#4ECDC4', '#FFE66D', '#FF6B6B', '#95E1D3', '#F38181'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: `${particle.x}%`,
                backgroundColor: color,
                transform: [
                  { translateY },
                  { scale },
                ],
                opacity,
              },
            ]}
          />
        );
      })}
      {/* ✅ AAA: XP amount text overlay */}
      <Animated.Text style={styles.xpText}>
        +{amount} XP
      </Animated.Text>
    </View>
  );
});

XPConfetti.displayName = 'XPConfetti';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    bottom: '50%',
  },
  xpText: {
    color: '#4ECDC4',
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: '#4ECDC4',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginTop: -100,
  },
});

export default XPConfetti;









