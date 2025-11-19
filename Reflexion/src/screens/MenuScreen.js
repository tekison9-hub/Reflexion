import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { createSafeStyleSheet } from '../utils/safeStyleSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageService } from '../services/StorageService';
import { adService } from '../services/AdService';
import { analytics } from '../services/AnalyticsService';
import musicManager from '../services/MusicManager';
import soundManager from '../services/SoundManager';
// ✅ SAFE IMPORTS
import { settingsService } from '../services/SettingsService';
import SettingsModal from '../components/SettingsModal';
import ModeSelectorModal from '../components/ModeSelectorModal';
import { 
  GAME_MODES, 
  getLevelFromXP, 
  getXPProgress, 
  isModeUnlocked, 
  getModeUnlockLevel,
  isSpeedTestTargetCountUnlocked,
  getSpeedTestTargetCountUnlockLevel,
  getAvailableSpeedTestTargetCounts,
  GAME_CONSTANTS,
} from '../utils/GameLogic';
import theme from '../styles/theme';
import dailyChallengeService from '../services/DailyChallengeService';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { SPACING, BORDER_RADIUS } from '../utils/layoutConstants';
// === ANIMATION_EASING FIX START ===
import { ANIMATION_EASING } from '../utils/animationConstants';
// === ANIMATION_EASING FIX END ===

const { COLORS, TYPOGRAPHY } = theme;

const MenuScreen = React.memo(({ navigation }) => {
  
  // ✅ SAFE: Context hook with fallback
  const {
    playerData,
    addCoins,
    addXP,
    updatePlayerData,
    isInitialized,
    loadPlayerData,
  } = useGlobalState();

  // ✅ SAFE: Check initialization before rendering
  useEffect(() => {
    if (!isInitialized) {
      console.warn('⚠️ MenuScreen loaded before GlobalState initialized');
    }
  }, [isInitialized]);

  // CRITICAL FIX PRIORITY 2: Reload player data when screen focuses (with infinite loop prevention)
  const loadingRef = React.useRef(false);
  
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true; // Prevent state updates if unmounted
      
      const refreshData = async () => {
        // Prevent multiple simultaneous loads
        if (loadingRef.current) {
          return;
        }
        
        if (!isInitialized || !loadPlayerData) {
          return;
        }
        
        loadingRef.current = true;
        
        try {
          await loadPlayerData();
          // CRITICAL FIX: Removed console.log to prevent spam
          // Data will update via context automatically
        } catch (error) {
          console.warn('⚠️ Failed to reload player data:', error);
        } finally {
          loadingRef.current = false;
        }
      };
      
      refreshData();
      
      // Cleanup function
      return () => {
        isActive = false;
      };
    }, [isInitialized, loadPlayerData]) // CRITICAL FIX: Removed playerData from dependencies
  );

  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const update = () => setScreenDimensions(Dimensions.get('window'));
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove?.();
  }, []);

  // Initialize Daily Challenge
  useEffect(() => {
    const initDailyChallenge = async () => {
      await dailyChallengeService.initialize();
      const challenge = dailyChallengeService.getChallenge();
      setDailyChallengeCompleted(challenge?.completed || false);
      setTimeUntilNext(dailyChallengeService.getTimeUntilNext());
    };
    initDailyChallenge();
  }, []);

  // ULTIMATE: Start menu music when screen loads
  useEffect(() => {
    musicManager.playMenuMusic();
    return () => {
      musicManager.stopAll();
    };
  }, []);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // VISUAL UPGRADE: Breathing glow and micro-bounce for Play button
  const playButtonGlowAnim = useRef(new Animated.Value(0.75)).current;
  const playButtonBounceAnim = useRef(new Animated.Value(1)).current;
  
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showSpeedTestSelector, setShowSpeedTestSelector] = useState(false);
  const [selectedMode, setSelectedMode] = useState(GAME_MODES.CLASSIC);
  const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState('');

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // === EASING FIX START ===
    // VISUAL UPGRADE: Breathing glow animation for Play button (opacity 0.75 → 1.0)
    const breathingGlow = Animated.loop(
      Animated.sequence([
        Animated.timing(playButtonGlowAnim, {
          toValue: 1.0,
          duration: 2000,
          easing: ANIMATION_EASING.DOPAMINE_EASING_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(playButtonGlowAnim, {
          toValue: 0.75,
          duration: 2000,
          easing: ANIMATION_EASING.DOPAMINE_EASING_OUT_CUBIC,
          useNativeDriver: true,
        }),
      ])
    );
    breathingGlow.start();

    // VISUAL UPGRADE: Soft scale micro-bounce for Play button (1.0 → 1.04 → 1.0)
    const microBounce = Animated.loop(
      Animated.sequence([
        Animated.timing(playButtonBounceAnim, {
          toValue: 1.04,
          duration: 1500,
          easing: ANIMATION_EASING.DOPAMINE_EASING_OUT_CUBIC,
          useNativeDriver: true,
        }),
        Animated.timing(playButtonBounceAnim, {
          toValue: 1.0,
          duration: 1500,
          easing: ANIMATION_EASING.DOPAMINE_EASING_OUT_CUBIC,
          useNativeDriver: true,
        }),
      ])
    );
    microBounce.start();
    // === EASING FIX END ===

    let dailyRewardTimer = null;
    let mounted = true;

    const checkReward = async () => {
      try {
        const lastClaimData = await AsyncStorage.getItem('lastDailyReward');
        const lastClaim = lastClaimData ? parseInt(lastClaimData) : null;
        const now = Date.now();
        
        if (mounted && (!lastClaim || now - lastClaim > 86400000)) {
          dailyRewardTimer = setTimeout(() => {
            if (mounted) setShowDailyReward(true);
          }, 1000);
        }
      } catch (error) {
        console.warn('⚠️ Failed to check daily reward:', error);
      }
    };

    checkReward();

    return () => {
      mounted = false;
      if (dailyRewardTimer) clearTimeout(dailyRewardTimer);
      pulse.stop();
    };
  }, []);

  const claimDailyReward = useCallback(async () => {
    const result = await adService.showRewardedAd('daily_reward');
    if (result.success) {
      const bonus = { xp: 100, coins: 50 };
      
      console.log('🎁 DAILY REWARD - Claiming reward:');
      console.log('  XP Bonus:', bonus.xp);
      console.log('  Coins Bonus:', bonus.coins);
      console.log('  Current Player Data:', {
        xp: playerData?.xp,
        totalXp: playerData?.totalXp,
        level: playerData?.level,
        coins: playerData?.coins,
      });
      
      // Save last claim time
      await storageService.setItem('lastDailyReward', Date.now());
      
      // CRITICAL FIX: Use addXP to properly save XP with all progression fields
      console.log('🎁 DAILY REWARD - Adding XP:', bonus.xp);
      const xpSuccess = await addXP(bonus.xp);
      console.log('  XP Save Result:', xpSuccess ? '✅ Success' : '❌ Failed');
      
      // CRITICAL FIX: Use addCoins to properly save coins
      console.log('🎁 DAILY REWARD - Adding Coins:', bonus.coins);
      const coinsSuccess = await addCoins(bonus.coins);
      console.log('  Coins Save Result:', coinsSuccess ? '✅ Success' : '❌ Failed');
      
      // Verify save worked
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const STORAGE_KEY = '@reflexion_player_data';
        const verification = await AsyncStorage.getItem(STORAGE_KEY);
        if (verification) {
          const verified = JSON.parse(verification);
          console.log('🎁 DAILY REWARD - Verification:');
          console.log('  Total XP:', verified.totalXp);
          console.log('  Level:', verified.level);
          console.log('  Coins:', verified.coins);
        }
      } catch (verifyError) {
        console.warn('⚠️ Could not verify daily reward save:', verifyError);
      }
      
      setDailyRewardClaimed(true);
      analytics.logRewardClaim('daily_reward', bonus.coins);
      
      setTimeout(() => setShowDailyReward(false), 2000);
    }
  }, [playerData, addXP, addCoins]);

  // CRITICAL FIX: Use single source of truth for player progress
  const playerProgress = useMemo(() => {
    if (!playerData || playerData.xp === undefined) {
      return { level: 1, currentXp: 0, xpToNextLevel: 100, totalXp: 0 };
    }
    const { getPlayerProgress } = require('../utils/GameLogic');
    return getPlayerProgress(playerData.xp || 0);
  }, [playerData]);
  
  const level = playerProgress.level;
  
  // CRITICAL FIX: Calculate progress bar from currentXp / xpToNextLevel (not hardcoded)
  const xpProgress = useMemo(() => {
    if (playerProgress.xpToNextLevel === 0) return 100;
    const progress = (playerProgress.currentXp / playerProgress.xpToNextLevel) * 100;
    return Math.min(100, Math.max(0, Math.round(progress * 10) / 10));
  }, [playerProgress]);

  const handleButtonPress = useCallback((action) => {
    // ✅ SAFE: Sound with error handling
    soundManager.play('tap').catch(err => {
      console.warn('⚠️ Sound failed:', err);
    });
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => {
      if (action === 'play') {
        setShowModeSelector(true);
      } else if (action === 'speed') {
        // CRITICAL FIX: Check if Speed Test mode is unlocked, then show target count selector
        if (isModeUnlocked(GAME_MODES.SPEED_TEST, level)) {
          setShowSpeedTestSelector(true);
        } else {
          const unlockLevel = getModeUnlockLevel(GAME_MODES.SPEED_TEST);
          Alert.alert(
            '🔒 Speed Test Locked',
            `Reach Level ${unlockLevel} to unlock Speed Test Mode.`,
            [{ text: 'OK' }]
          );
        }
      } else if (action === 'rush') {
        // CRITICAL FIX: Check if Rush mode is unlocked before navigating
        if (isModeUnlocked(GAME_MODES.RUSH, level)) {
          navigation.navigate('Game', { mode: GAME_MODES.RUSH });
        } else {
          const unlockLevel = getModeUnlockLevel(GAME_MODES.RUSH);
          Alert.alert(
            '🔒 Rush Mode Locked',
            `Reach Level ${unlockLevel} to unlock Rush Mode.`,
            [{ text: 'OK' }]
          );
        }
      } else if (action === 'daily') {
        navigation.navigate('DailyChallenge');
      } else if (action === 'battle') {
        navigation.navigate('Battle');
      }
    }, 200);
  }, [navigation, scaleAnim, level]);

  const handleModeSelect = useCallback((mode) => {
    setSelectedMode(mode);
    navigation.navigate('Game', { mode });
  }, [navigation]);

  const openSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  if (screenDimensions.width === 0) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={openSettings}
        activeOpacity={0.8}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>

      <Animated.View 
        style={[
          styles.titleContainer,
          {
            transform: [
              { scale: Animated.multiply(pulseAnim, scaleAnim) },
            ],
          },
        ]}
      >
        <Text style={[styles.title, { fontFamily: TYPOGRAPHY?.black || 'System' }]}>Reflexion</Text>
        <View style={styles.titleGlow} />
      </Animated.View>

      <View style={styles.menuContainer}>
        {/* VISUAL UPGRADE: Play button - dominant CTA with breathing glow and micro-bounce */}
        <Animated.View
          style={{
            transform: [{ scale: playButtonBounceAnim }],
          }}
        >
          <Pressable
            style={({ pressed }) => [
              styles.gameModeButton,
              styles.playButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleButtonPress('play')}
          >
            <Animated.View
              style={[
                styles.buttonGlow,
                {
                  opacity: playButtonGlowAnim,
                },
              ]}
            />
            <Text style={styles.buttonIcon}>▶️</Text>
            <Text style={[styles.buttonText, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>Play</Text>
          </Pressable>
        </Animated.View>

        {/* VISUAL UPGRADE: Speed Test - visually demoted */}
        <Pressable
          style={({ pressed }) => [
            styles.gameModeButton,
            styles.secondaryModeButton,
            styles.speedButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => handleButtonPress('speed')}
        >
          <Text style={styles.secondaryButtonIcon}>⏱️</Text>
          <Text style={[styles.secondaryButtonText, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>Speed Test</Text>
        </Pressable>

        {/* VISUAL UPGRADE: Rush Mode - visually demoted */}
        <Pressable
          style={({ pressed }) => [
            styles.gameModeButton,
            styles.secondaryModeButton,
            styles.rushButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => handleButtonPress('rush')}
        >
          <Text style={styles.secondaryButtonIcon}>💥</Text>
          <Text style={[styles.secondaryButtonText, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>Rush Mode</Text>
        </Pressable>
      </View>

      <View style={styles.secondaryButtonsContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
          onPress={() => navigation.navigate('Shop')}
        >
          <Text style={styles.secondaryButtonIcon}>🛒</Text>
          <Text style={[styles.secondaryButtonText, { fontFamily: TYPOGRAPHY?.regular || 'System' }]}>Shop</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
          onPress={() => navigation.navigate('Stats')}
        >
          <Text style={styles.secondaryButtonIcon}>📊</Text>
          <Text style={[styles.secondaryButtonText, { fontFamily: TYPOGRAPHY?.regular || 'System' }]}>Stats</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <Text style={styles.secondaryButtonIcon}>🏆</Text>
          <Text style={[styles.secondaryButtonText, { fontFamily: TYPOGRAPHY?.regular || 'System' }]}>Leaderboard</Text>
        </Pressable>
      </View>

      {/* Additional Row */}
      <View style={styles.secondaryButtonsContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
          onPress={() => navigation.navigate('Achievements')}
        >
          <Text style={styles.secondaryButtonIcon}>🎖️</Text>
          <Text style={[styles.secondaryButtonText, { fontFamily: TYPOGRAPHY?.regular || 'System' }]}>Achievements</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
          onPress={() => navigation.navigate('Instructions')}
        >
          <Text style={styles.secondaryButtonIcon}>📖</Text>
          <Text style={[styles.secondaryButtonText, { fontFamily: TYPOGRAPHY?.regular || 'System' }]}>How to Play</Text>
        </Pressable>
      </View>

      {/* CRITICAL FIX: Daily Challenge & Battle Mode HIDDEN until future update */}
      {/* Keeping code intact but UI invisible as requested by client */}
      {false && (
        <View style={styles.viralFeaturesContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.viralButton,
              styles.dailyChallengeButton,
              pressed && styles.viralButtonPressed,
            ]}
            onPress={() => handleButtonPress('daily')}
          >
            <Text style={styles.viralButtonIcon}>🌟</Text>
            <Text style={[styles.viralButtonText, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>Daily Challenge</Text>
            {!dailyChallengeCompleted && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.viralButton,
              styles.battleButton,
              pressed && styles.viralButtonPressed,
            ]}
            onPress={() => handleButtonPress('battle')}
          >
            <Text style={styles.viralButtonIcon}>⚔️</Text>
            <Text style={[styles.viralButtonText, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>Battle Mode</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>🪙</Text>
          <Text style={[styles.statValue, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>{playerData.coins || 0}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={[styles.statValue, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>Level {level}</Text>
        </View>
        
        <View style={styles.xpContainer}>
          <View style={styles.xpBar}>
            <View 
              style={[
                styles.xpFill,
                { width: `${xpProgress}%` },
              ]}
            />
          </View>
          <Text style={styles.xpText}>{xpProgress}%</Text>
        </View>
      </View>

      <Modal visible={showDailyReward} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { fontFamily: TYPOGRAPHY?.black || 'System' }]}>🎁 Daily Reward!</Text>
            {!dailyRewardClaimed ? (
              <>
                <Text style={styles.modalText}>Watch an ad to claim:</Text>
                <Text style={[styles.modalText, styles.rewardXP]}>+100 XP</Text>
                <Text style={[styles.modalText, styles.rewardCoins]}>+50 Coins</Text>
                <TouchableOpacity style={styles.adButton} onPress={claimDailyReward}>
                  <Text style={[styles.adButtonText, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>📺 Claim Reward</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => setShowDailyReward(false)}
                >
                  <Text style={styles.skipButtonText}>Maybe Later</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.modalText, styles.claimedText]}>✅ Reward Claimed!</Text>
                <Text style={styles.modalText}>Come back tomorrow!</Text>
              </>
            )}
          </View>
        </View>
      </Modal>

      <SettingsModal visible={showSettings} onClose={closeSettings} />

      <ModeSelectorModal
        visible={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        onSelectMode={handleModeSelect}
        playerLevel={level}
      />
      
      {/* Speed Test Target Count Selector Modal */}
      <Modal visible={showSpeedTestSelector} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>
              ⏱️ Speed Test
            </Text>
            <Text style={styles.modalSubtitle}>Select Target Count</Text>
            
            <View style={styles.targetCountContainer}>
              {GAME_CONSTANTS.SPEED_TEST_TARGET_COUNTS.map((count) => {
                const isUnlocked = isSpeedTestTargetCountUnlocked(count, level);
                const unlockLevel = getSpeedTestTargetCountUnlockLevel(count);
                
                return (
                  <Pressable
                    key={count}
                    style={[
                      styles.targetCountButton,
                      !isUnlocked && styles.targetCountButtonLocked,
                    ]}
                    onPress={() => {
                      if (isUnlocked) {
                        soundManager.play('tap').catch(() => {});
                        // CRITICAL FIX: Navigate directly without delay or modal closing
                        // This prevents menu screen flash and ensures immediate navigation
                        navigation.navigate('Game', { 
                          mode: GAME_MODES.SPEED_TEST,
                          targetCount: count,
                        });
                        // Close modal after navigation starts
                        setShowSpeedTestSelector(false);
                      } else {
                        Alert.alert(
                          '🔒 Locked',
                          `Reach Level ${unlockLevel} to unlock ${count} targets.`,
                          [{ text: 'OK' }]
                        );
                      }
                    }}
                    disabled={!isUnlocked}
                  >
                    <Text style={[styles.targetCountText, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>
                      {count} Targets
                    </Text>
                    {!isUnlocked && (
                      <Text style={styles.targetCountLockText}>
                        Level {unlockLevel}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
            
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => {
                soundManager.play('tap');
                setShowSpeedTestSelector(false);
              }}
            >
              <Text style={[styles.modalCloseButtonText, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
});

MenuScreen.displayName = 'MenuScreen';

export default MenuScreen;

const styles = createSafeStyleSheet({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.SCREEN_PADDING,
  },
  settingsButton: {
    position: 'absolute',
    top: SPACING.SAFE_AREA_TOP + SPACING.MD,
    right: SPACING.SCREEN_PADDING,
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.ROUND,
    backgroundColor: 'rgba(197, 108, 240, 0.2)',
    borderWidth: 2,
    borderColor: '#C56CF0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C56CF0',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  settingsIcon: {
    fontSize: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.XXL,
    marginTop: SPACING.SAFE_AREA_TOP + SPACING.XL,
  },
  title: {
    color: '#4ECDC4',
    fontSize: 56,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#4ECDC4',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
    letterSpacing: 4,
  },
  titleGlow: {
    position: 'absolute',
    width: 300,
    height: 100,
    backgroundColor: '#4ECDC4',
    opacity: 0.2,
    borderRadius: 50,
    blur: 30,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 400,
    gap: SPACING.XL, // VISUAL UPGRADE: Increased spacing between UI blocks
    marginBottom: SPACING.XL, // VISUAL UPGRADE: Increased bottom margin
  },
  gameModeButton: {
    borderRadius: BORDER_RADIUS.LG, // VISUAL UPGRADE: Normalized border radius
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  playButton: {
    // VISUAL UPGRADE: Dominant CTA - larger size
    height: SPACING.BUTTON_HEIGHT + SPACING.LG,
    backgroundColor: 'rgba(78, 205, 196, 0.25)',
    borderColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
  },
  secondaryModeButton: {
    // VISUAL UPGRADE: Demoted secondary modes - smaller size
    height: SPACING.BUTTON_HEIGHT_COMPACT + SPACING.SM,
    backgroundColor: 'rgba(77, 208, 225, 0.15)',
    borderWidth: 1.5,
  },
  speedButton: {
    borderColor: '#6B9BD1', // VISUAL UPGRADE: Ice-Blue / Steel gray for Speed Test
    shadowColor: '#6B9BD1',
  },
  rushButton: {
    borderColor: '#FF6B35', // VISUAL UPGRADE: Energy Neon Red/Orange for Rush
    shadowColor: '#FF6B35',
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  buttonGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(78, 205, 196, 0.3)', // VISUAL UPGRADE: Theme-matched glow color
    borderRadius: BORDER_RADIUS.LG, // VISUAL UPGRADE: Normalized border radius
  },
  buttonIcon: {
    fontSize: 36, // VISUAL UPGRADE: Larger icon for Play button
    marginBottom: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 22, // VISUAL UPGRADE: Larger text for Play button
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  // VISUAL UPGRADE: Secondary mode button text styling (demoted)
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16, // Smaller than Play button
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  secondaryButtonIcon: {
    fontSize: 24, // Smaller than Play button icon
    marginBottom: 4,
  },
  secondaryButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
    marginBottom: SPACING.XL,
    gap: SPACING.SM,
  },
  secondaryButton: {
    flex: 1,
    height: SPACING.BUTTON_HEIGHT_COMPACT + SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(78, 205, 196, 0.4)',
  },
  secondaryButtonPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: 'rgba(78, 205, 196, 0.25)',
  },
  secondaryButtonIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  secondaryButtonText: {
    color: '#4ECDC4',
    fontSize: 11,
    fontWeight: '600',
  },
  statsBar: {
    position: 'absolute',
    bottom: SPACING.SAFE_AREA_BOTTOM + SPACING.XL,
    left: SPACING.SCREEN_PADDING,
    right: SPACING.SCREEN_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(44, 62, 80, 0.8)',
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    color: '#ECF0F1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  xpContainer: {
    flex: 1,
    marginLeft: SPACING.MD,
    alignItems: 'flex-end',
  },
  xpBar: {
    width: 100,
    height: 8,
    backgroundColor: '#2C3E50',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  xpText: {
    color: '#BDC3C7',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2C3E50',
    borderRadius: BORDER_RADIUS.MODAL,
    padding: SPACING.XL,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  modalTitle: {
    color: '#4ECDC4',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#4ECDC4',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  modalText: {
    color: '#BDC3C7',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  rewardXP: {
    color: '#4ECDC4',
    fontSize: 24,
    fontWeight: 'bold',
  },
  rewardCoins: {
    color: '#FFD93D',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  claimedText: {
    color: '#4ECDC4',
    fontSize: 20,
    fontWeight: 'bold',
  },
  adButton: {
    backgroundColor: '#FFD93D',
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.SM,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FFD93D',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  adButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#7F8C8D',
    paddingVertical: SPACING.SM + SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    alignItems: 'center',
    marginTop: 10,
  },
  skipButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '600',
  },
  viralFeaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
    gap: 10,
  },
  viralButton: {
    flex: 1,
    height: 70,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    position: 'relative',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  dailyChallengeButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
  },
  battleButton: {
    backgroundColor: 'rgba(255, 107, 157, 0.15)',
    borderColor: '#FF6B9D',
    shadowColor: '#FF6B9D',
  },
  viralButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  viralButtonIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  viralButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  newBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF1744',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  newBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2C3E50',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  modalTitle: {
    color: '#4ECDC4',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    color: '#BDC3C7',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  targetCountContainer: {
    gap: 12,
    marginBottom: 20,
  },
  targetCountButton: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderWidth: 2,
    borderColor: '#4ECDC4',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  targetCountButtonLocked: {
    backgroundColor: 'rgba(44, 62, 80, 0.5)',
    borderColor: '#666',
    opacity: 0.6,
  },
  targetCountText: {
    color: '#4ECDC4',
    fontSize: 20,
    fontWeight: 'bold',
  },
  targetCountLockText: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  modalCloseButton: {
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    borderWidth: 2,
    borderColor: '#FF6B9D',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FF6B9D',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
