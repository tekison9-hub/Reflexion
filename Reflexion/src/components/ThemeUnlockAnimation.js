import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import soundManager from '../services/SoundManager';
import theme from '../styles/theme';

const { COLORS, GRADIENTS, TYPOGRAPHY, SPACING, BORDER_RADIUS } = theme;

// CRITICAL FIX: Get screen width safely inside component, not at module level
const getScreenWidth = () => Dimensions.get('window').width;

/**
 * ThemeUnlockAnimation - Celebratory animation for theme unlocks
 * 
 * Features:
 * - Particle burst effect
 * - Theme name reveal with scale animation
 * - Neon glow pulse
 * - Haptic feedback
 * - Sound effect
 * - Auto-dismiss after 3 seconds
 */
const ThemeUnlockAnimation = React.memo(({ visible, theme, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particles = useRef(
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible && theme) {
      // Play theme unlock sound
      (async () => {
        await soundManager.play('luckyTap'); // Theme unlock sound
      })();

      // Haptic feedback - heavy impact
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {
        // Fail silently
      }

      // Fade in overlay
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Scale in main content
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        delay: 200,
        useNativeDriver: true,
      }).start();

      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Particle burst animation
      const particleAnimations = particles.map((particle, index) => {
        const angle = (index / particles.length) * Math.PI * 2;
        const distance = 150 + Math.random() * 100;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;

        return Animated.parallel([
          Animated.timing(particle.translateX, {
            toValue: endX,
            duration: 1500 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: endY,
            duration: 1500 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 1500,
            delay: 500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.scale, {
              toValue: 1.5,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ]);
      });

      Animated.parallel(particleAnimations).start();

      // Auto-dismiss after 3 seconds
      const timeout = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => {
        clearTimeout(timeout);
        scaleAnim.setValue(0);
        fadeAnim.setValue(0);
        glowAnim.stopAnimation();
        particles.forEach(p => {
          p.translateX.setValue(0);
          p.translateY.setValue(0);
          p.opacity.setValue(1);
          p.scale.setValue(1);
        });
      };
    }
  }, [visible, theme]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible || !theme) return null;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1.0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Particle burst */}
        <View style={styles.particleContainer}>
          {particles.map((particle) => (
            <Animated.View
              key={particle.id}
              style={[
                styles.particle,
                {
                  backgroundColor: theme.primaryColor || COLORS.neonCyan,
                  transform: [
                    { translateX: particle.translateX },
                    { translateY: particle.translateY },
                    { scale: particle.scale },
                  ],
                  opacity: particle.opacity,
                },
              ]}
            />
          ))}
        </View>

        {/* Main content */}
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              theme.primaryColor || COLORS.neonCyan,
              theme.secondaryColor || COLORS.neonPurple,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View style={styles.content}>
              <Text style={styles.unlockLabel}>THEME UNLOCKED</Text>
              
              <Animated.View
                style={[
                  styles.themeNameContainer,
                  {
                    shadowColor: theme.primaryColor || COLORS.neonCyan,
                    shadowOpacity: glowOpacity,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.themeName,
                    { color: theme.primaryColor || COLORS.neonCyan },
                  ]}
                >
                  {theme.name || 'NEW THEME'}
                </Text>
              </Animated.View>

              <View style={styles.decorativeBar}>
                <LinearGradient
                  colors={[
                    theme.primaryColor || COLORS.neonCyan,
                    theme.secondaryColor || COLORS.neonPurple,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.decorativeBarGradient}
                />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  container: {
    width: getScreenWidth() * 0.85,
    maxWidth: 400,
  },
  gradientBorder: {
    padding: 4,
    borderRadius: BORDER_RADIUS.xl,
  },
  content: {
    backgroundColor: COLORS.modalBackground,
    borderRadius: BORDER_RADIUS.xl - 4,
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  unlockLabel: {
    fontFamily: TYPOGRAPHY?.secondary || 'System',
    fontSize: TYPOGRAPHY?.caption || 14,
    color: COLORS.textSecondary,
    letterSpacing: TYPOGRAPHY?.letterSpacingExtraWide || 4,
    marginBottom: SPACING?.lg || 24,
    fontWeight: '600',
  },
  themeNameContainer: {
    marginBottom: SPACING.xl,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 25,
    elevation: 15,
  },
  themeName: {
    fontFamily: TYPOGRAPHY?.primary || 'System',
    fontSize: 42,
    letterSpacing: TYPOGRAPHY?.letterSpacingWide || 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  decorativeBar: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  decorativeBarGradient: {
    flex: 1,
  },
});

ThemeUnlockAnimation.displayName = 'ThemeUnlockAnimation';

export default ThemeUnlockAnimation;

