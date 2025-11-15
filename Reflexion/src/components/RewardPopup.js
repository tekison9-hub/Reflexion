import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import soundManager from '../services/SoundManager';
import theme from '../styles/theme';

const { COLORS, GRADIENTS, SHADOWS, TYPOGRAPHY, SPACING, BORDER_RADIUS } = theme;

// CRITICAL FIX: Get screen width safely inside component, not at module level
const getScreenWidth = () => Dimensions.get('window').width;

/**
 * RewardPopup - Dopamine-optimized post-game reward display
 * 
 * Features:
 * - Animated count-up for XP and Coins
 * - Streak bonus display with glow
 * - Pulse animations
 * - Haptic feedback
 * - Sound effects
 * - Neon cyberpunk aesthetic
 */
const RewardPopup = React.memo(({ visible, xp, coins, streak, onClose }) => {
  const [displayXP, setDisplayXP] = useState(0);
  const [displayCoins, setDisplayCoins] = useState(0);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;

  // Count-up animation
  useEffect(() => {
    if (visible) {
      // Play reward sound
      (async () => {
        await soundManager.play('levelUp'); // XP gain sound
      })();
      
      // Haptic feedback
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        // Fail silently
      }

      // Scale-in animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Glow pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Streak animation (if streak > 1)
      if (streak > 1) {
        Animated.sequence([
          Animated.timing(streakAnim, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(streakAnim, {
            toValue: 1,
            tension: 50,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Count-up animation for XP
      const xpDuration = 1000;
      const xpSteps = 30;
      const xpIncrement = xp / xpSteps;
      let xpCurrent = 0;
      let xpStep = 0;

      const xpInterval = setInterval(() => {
        xpStep++;
        xpCurrent += xpIncrement;
        
        if (xpStep >= xpSteps) {
          setDisplayXP(xp);
          clearInterval(xpInterval);
        } else {
          setDisplayXP(Math.floor(xpCurrent));
        }
      }, xpDuration / xpSteps);

      // Count-up animation for Coins (delayed)
      setTimeout(() => {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {
          // Fail silently
        }

        const coinDuration = 800;
        const coinSteps = 20;
        const coinIncrement = coins / coinSteps;
        let coinCurrent = 0;
        let coinStep = 0;

        const coinInterval = setInterval(() => {
          coinStep++;
          coinCurrent += coinIncrement;
          
          if (coinStep >= coinSteps) {
            setDisplayCoins(coins);
            clearInterval(coinInterval);
          } else {
            setDisplayCoins(Math.floor(coinCurrent));
          }
        }, coinDuration / coinSteps);

        return () => clearInterval(coinInterval);
      }, 300);

      return () => {
        clearInterval();
        scaleAnim.setValue(0);
        glowAnim.stopAnimation();
        streakAnim.setValue(0);
      };
    } else {
      // Reset on close
      setDisplayXP(0);
      setDisplayCoins(0);
      scaleAnim.setValue(0);
      glowAnim.setValue(0);
      streakAnim.setValue(0);
    }
  }, [visible, xp, coins, streak]);

  const handleClose = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.9],
  });

  const streakBonus = streak > 1 ? Math.floor((streak - 1) * 0.1 * xp) : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View style={styles.content}>
              {/* Title */}
              <Text style={styles.title}>MISSION COMPLETE</Text>

              {/* XP Display */}
              <Animated.View
                style={[
                  styles.rewardItem,
                  {
                    shadowOpacity: glowOpacity,
                  },
                ]}
              >
                <Text style={styles.rewardLabel}>XP GAINED</Text>
                <Text style={styles.rewardValue}>+{displayXP}</Text>
              </Animated.View>

              {/* Coins Display */}
              <Animated.View
                style={[
                  styles.rewardItem,
                  styles.coinsItem,
                  {
                    shadowOpacity: glowOpacity,
                  },
                ]}
              >
                <Text style={styles.rewardLabel}>COINS EARNED</Text>
                <Text style={[styles.rewardValue, styles.coinsValue]}>
                  +{displayCoins}
                </Text>
              </Animated.View>

              {/* Streak Bonus (if applicable) */}
              {streak > 1 && (
                <Animated.View
                  style={[
                    styles.streakBonus,
                    {
                      transform: [{ scale: streakAnim }],
                    },
                  ]}
                >
                  <Text style={styles.streakLabel}>
                    🔥 STREAK BONUS x{streak}
                  </Text>
                  <Text style={styles.streakValue}>+{streakBonus} XP</Text>
                </Animated.View>
              )}

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={GRADIENTS.secondary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.closeButtonGradient}
                >
                  <Text style={styles.closeButtonText}>CONTINUE</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: getScreenWidth() * 0.9,
    maxWidth: 400,
  },
  gradientBorder: {
    padding: 3,
    borderRadius: BORDER_RADIUS.lg,
  },
  content: {
    backgroundColor: COLORS.modalBackground,
    borderRadius: BORDER_RADIUS.lg - 3,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontFamily: TYPOGRAPHY?.primary || 'System',
    fontSize: TYPOGRAPHY?.heading || 32,
    color: COLORS.neonCyan,
    letterSpacing: TYPOGRAPHY?.letterSpacingWide || 2,
    marginBottom: SPACING?.lg || 24,
    textAlign: 'center',
    fontWeight: 'bold',
    ...SHADOWS.neonCyan,
  },
  rewardItem: {
    width: '100%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.neonCyan,
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 10,
  },
  coinsItem: {
    borderColor: COLORS.neonMagenta,
    shadowColor: COLORS.neonMagenta,
  },
  rewardLabel: {
    fontFamily: TYPOGRAPHY?.secondary || 'System',
    fontSize: TYPOGRAPHY?.caption || 14,
    color: COLORS.textSecondary,
    letterSpacing: TYPOGRAPHY?.letterSpacingWide || 2,
    marginBottom: SPACING?.xs || 4,
    fontWeight: '600',
  },
  rewardValue: {
    fontFamily: TYPOGRAPHY?.primary || 'System',
    fontSize: 48,
    color: COLORS.neonCyan,
    letterSpacing: TYPOGRAPHY?.letterSpacingNormal || 0,
    fontWeight: 'bold',
  },
  coinsValue: {
    color: COLORS.neonMagenta,
  },
  streakBonus: {
    width: '100%',
    backgroundColor: 'rgba(157, 0, 255, 0.2)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.neonPurple,
    ...SHADOWS.neonPurple,
  },
  streakLabel: {
    fontFamily: TYPOGRAPHY?.secondary || 'System',
    fontSize: TYPOGRAPHY?.body || 16,
    color: COLORS.neonPurple,
    letterSpacing: TYPOGRAPHY?.letterSpacingWide || 2,
    marginBottom: SPACING?.xs || 4,
    fontWeight: '600',
  },
  streakValue: {
    fontFamily: TYPOGRAPHY?.primary || 'System',
    fontSize: TYPOGRAPHY?.heading || 32,
    color: COLORS.neonPurple,
    fontWeight: 'bold',
  },
  closeButton: {
    width: '100%',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: TYPOGRAPHY?.secondary || 'System',
    fontSize: TYPOGRAPHY?.body || 16,
    color: COLORS.textPrimary,
    letterSpacing: TYPOGRAPHY?.letterSpacingWide || 2,
    fontWeight: 'bold',
  },
});

RewardPopup.displayName = 'RewardPopup';

export default RewardPopup;

