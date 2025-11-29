import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { createSafeStyleSheet } from '../utils/safeStyleSheet';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import soundManager from '../services/SoundManager.js';
import theme from '../styles/theme';

const {
  COLORS,
  GRADIENTS,
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS
} = theme;

// ❗ REMOVE ALL MODULE-LEVEL Dimensions.get
// (no getScreenWidth function here)

// ------------------------------------------------------

const RewardPopup = React.memo(({ visible, xp, coins, streak, onClose }) => {
  const [displayXP, setDisplayXP] = useState(0);
  const [displayCoins, setDisplayCoins] = useState(0);

  // NEW: runtime-safe width state
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window')?.width ?? 300
  );

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub?.remove?.();
  }, []);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      (async () => {
        await soundManager.play('levelUp');
      })();

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}

      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

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

      setTimeout(() => {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {}

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
        scaleAnim.setValue(0);
        glowAnim.stopAnimation();
        streakAnim.setValue(0);
      };
    } else {
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
    }).start(() => onClose());
  };

  if (!visible) return null;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.9],
  });

  const streakBonus = streak > 1 ? Math.floor((streak - 1) * 0.1 * xp) : 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { width: screenWidth * 0.9 },
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View style={styles.content}>
              <Text style={styles.title}>MISSION COMPLETE</Text>

              <Animated.View style={[styles.rewardItem, { shadowOpacity: glowOpacity }]}>
                <Text style={styles.rewardLabel}>XP GAINED</Text>
                <Text style={styles.rewardValue}>+{displayXP}</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.rewardItem,
                  styles.coinsItem,
                  { shadowOpacity: glowOpacity }
                ]}
              >
                <Text style={styles.rewardLabel}>COINS EARNED</Text>
                <Text style={[styles.rewardValue, styles.coinsValue]}>
                  +{displayCoins}
                </Text>
              </Animated.View>

              {streak > 1 && (
                <Animated.View style={[styles.streakBonus, { transform: [{ scale: streakAnim }] }]}>
                  <Text style={styles.streakLabel}>🔥 STREAK BONUS x{streak}</Text>
                  <Text style={styles.streakValue}>+{streakBonus} XP</Text>
                </Animated.View>
              )}

              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
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

const styles = createSafeStyleSheet({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
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
    letterSpacing: 2,
    marginBottom: SPACING.lg,
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
    fontSize: 14,
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: 4,
    fontWeight: '600',
  },
  rewardValue: {
    fontSize: 48,
    color: COLORS.neonCyan,
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
    fontSize: 16,
    color: COLORS.neonPurple,
    letterSpacing: 2,
    marginBottom: 4,
    fontWeight: '600',
  },
  streakValue: {
    fontSize: 32,
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
    fontSize: 16,
    color: COLORS.textPrimary,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
});

export default RewardPopup;
