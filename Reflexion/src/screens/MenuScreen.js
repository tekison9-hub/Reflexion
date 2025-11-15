import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageService } from '../services/StorageService';
import { adService } from '../services/AdService';
import { analytics } from '../services/AnalyticsService';
import musicManager from '../services/MusicManager';
import soundManager from '../services/SoundManager';
import settingsService from '../services/SettingsService';
import SettingsModal from '../components/SettingsModal';
import ModeSelectorModal from '../components/ModeSelectorModal';
import { GAME_MODES, getLevelFromXP, getXPProgress, isModeUnlocked, getModeUnlockLevel } from '../utils/GameLogic';
import theme from '../styles/theme';
import dailyChallengeService from '../services/DailyChallengeService';
import { useGlobalState } from '../contexts/GlobalStateContext';

const { COLORS, TYPOGRAPHY } = theme;

// MenuScreen.js - en üste ekleyin
console.log('🔍 MenuScreen loading...');
console.log('🔍 useGlobalState:', typeof useGlobalState);

const MenuScreen = React.memo(({ navigation, playerData: propPlayerData, onUpdateData }) => {
  console.log('🔍 MenuScreen rendering...');
  console.log('🔍 propPlayerData:', propPlayerData);
  
  // ✅ CRITICAL FIX: Safe fallback for playerData
  const globalState = useGlobalState();
  console.log('🔍 globalState:', globalState);
  console.log('🔍 globalState.playerData:', globalState?.playerData);
  const playerData = globalState?.playerData || propPlayerData || {
    coins: 0,
    xp: 0,
    level: 1,
    highScore: 0,
    gamesPlayed: 0,
  };

  // ✅ Safe function wrappers
  const addCoins = globalState?.addCoins || (async () => {});
  const updatePlayerData = globalState?.updatePlayerData || onUpdateData || (async () => {});

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
  
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
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
      const newData = {
        ...playerData,
        xp: playerData.xp + bonus.xp,
        coins: playerData.coins + bonus.coins,
      };
      
      await storageService.setItem('playerData', newData);
      await storageService.setItem('lastDailyReward', Date.now());
      
      // ✅ Use updatePlayerData wrapper (includes globalState.updatePlayerData or onUpdateData fallback)
      await updatePlayerData(newData);
      setDailyRewardClaimed(true);
      analytics.logRewardClaim('daily_reward', bonus.coins);
      
      setTimeout(() => setShowDailyReward(false), 2000);
    }
  }, [playerData, updatePlayerData]);

  // CRITICAL FIX: Use same level calculation as GameScreen to prevent NaN
  const level = useMemo(() => {
    if (!playerData || playerData.xp === undefined || playerData.xp === null) {
      return 1; // Default to level 1 if XP not available
    }
    return getLevelFromXP(playerData.xp);
  }, [playerData]);
  
  // CRITICAL FIX: Calculate XP progress using proper XP system
  const xpProgress = useMemo(() => {
    if (!playerData || playerData.xp === undefined || playerData.xp === null) {
      return 0;
    }
    const currentLevel = getLevelFromXP(playerData.xp);
    const progress = getXPProgress(playerData.xp, currentLevel);
    
    // CRITICAL FIX: Format percentage to max 1 decimal place (e.g., 90.6% instead of 90.60000000000001%)
    // Round to 1 decimal place and clamp to 0-100
    const formattedProgress = Math.min(100, Math.max(0, Math.round(progress * 10) / 10));
    
    return formattedProgress;
  }, [playerData]);

  const handleButtonPress = useCallback((action) => {
    // CRITICAL FIX: Play sound on button press
    soundManager.play('tap').catch(error => {
      console.warn('⚠️ Button sound failed:', error);
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
      } else if (action === 'zen') {
        // CRITICAL FIX: Check if Zen mode is unlocked before navigating
        if (isModeUnlocked(GAME_MODES.ZEN, level)) {
          navigation.navigate('Game', { mode: GAME_MODES.ZEN });
        } else {
          const unlockLevel = getModeUnlockLevel(GAME_MODES.ZEN);
          Alert.alert(
            '🔒 Zen Mode Locked',
            `Reach Level ${unlockLevel} to unlock Zen Mode.`,
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
        <Pressable
          style={({ pressed }) => [
            styles.gameModeButton,
            styles.playButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => handleButtonPress('play')}
        >
          <Text style={styles.buttonIcon}>⚡</Text>
          <Text style={[styles.buttonText, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>Play</Text>
          <View style={styles.buttonGlow} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.gameModeButton,
            styles.zenButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => handleButtonPress('zen')}
        >
          <Text style={styles.buttonIcon}>🧠</Text>
          <Text style={[styles.buttonText, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>Zen Mode</Text>
          <View style={styles.buttonGlow} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.gameModeButton,
            styles.rushButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => handleButtonPress('rush')}
        >
          <Text style={styles.buttonIcon}>💥</Text>
          <Text style={[styles.buttonText, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>Rush Mode</Text>
          <View style={styles.buttonGlow} />
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
    </SafeAreaView>
  );
});

MenuScreen.displayName = 'MenuScreen';

export default MenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
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
    marginBottom: 50,
    marginTop: 80,
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
    gap: 20,
    marginBottom: 20,
  },
  gameModeButton: {
    height: 80,
    borderRadius: 20,
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
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
  },
  zenButton: {
    backgroundColor: 'rgba(197, 108, 240, 0.2)',
    borderColor: '#C56CF0',
    shadowColor: '#C56CF0',
  },
  rushButton: {
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    borderColor: '#FF6B9D',
    shadowColor: '#FF6B9D',
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  buttonGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  secondaryButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
    marginBottom: 30,
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    height: 60,
    borderRadius: 15,
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
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(44, 62, 80, 0.8)',
    borderRadius: 15,
    padding: 15,
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
    marginLeft: 15,
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
    paddingVertical: 15,
    borderRadius: 10,
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
    paddingVertical: 12,
    borderRadius: 10,
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
});
