import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import soundManager from '../services/SoundManager';
import { adService } from '../services/AdService';
import { storageService } from '../services/StorageService';
import { analytics } from '../services/AnalyticsService';
// ✅ FIX: Safe import
import { settingsService } from '../services/SettingsService';
import musicManager from '../services/MusicManager';
import progressTracker from '../services/ProgressTracker';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { 
  GAME_CONSTANTS,
  GAME_MODES,
  DANGER_CONFIG,
  POWERUP_CONFIG,
  generateTarget, 
  calculateScore, 
  getLuckyBonus,
  calculateDifficulty,
  getDifficultyMultiplier,
  getSpawnInterval,
  getGameDuration,
  getTargetLifetime,
  getThemeForLevel,
  getThemeUnlock,
  getLevelFromXP,
  calculateComboBonusXP,
  THEMES,
} from '../utils/GameLogic';
import NeonTarget from '../components/NeonTarget';
import Particle from '../components/Particle';
import FloatingScore from '../components/FloatingScore';
import ComboBar from '../components/ComboBar';
import PowerBar from '../components/PowerBar';
import { ShareCard } from '../components/ShareCard';

export default function GameScreen({ navigation, route, playerData: propPlayerData, onUpdateData }) {
  const { playerData: globalPlayerData, updatePlayerData, addCoins, addXP } = useGlobalState();
  const playerData = globalPlayerData || propPlayerData;
  // Get game mode from route params (default to Classic)
  const gameMode = route?.params?.mode || GAME_MODES.CLASSIC;
  
  // Get player level using new XP system
  const playerLevel = getLevelFromXP(playerData.xp);
  
  const [currentTheme, setCurrentTheme] = useState(getThemeForLevel(playerLevel));
  const [activeBallEmoji, setActiveBallEmoji] = useState('⚪');
  
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const update = () => setScreenDimensions(Dimensions.get('window'));
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove?.();
  }, []);

  const [targets, setTargets] = useState([]);
  const [particles, setParticles] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [health, setHealth] = useState(GAME_CONSTANTS.MAX_HEALTH);
  const [timeLeft, setTimeLeft] = useState(getGameDuration(gameMode));
  const [gameActive, setGameActive] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [showReviveOption, setShowReviveOption] = useState(false);
  const [showDoubleReward, setShowDoubleReward] = useState(false);
  const [hasRevived, setHasRevived] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const [powerBar, setPowerBar] = useState(0); // ReflexXP Power Bar (0-100)
  const [powerBarActive, setPowerBarActive] = useState(false); // Is power bar active
  const [rushComboMultiplier, setRushComboMultiplier] = useState(1); // Rush mode combo multiplier
  const [showThemeUnlock, setShowThemeUnlock] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [avgReactionTime, setAvgReactionTime] = useState(0);
  const [unlockedTheme, setUnlockedTheme] = useState(null);
  const [shakeAnim] = useState(new Animated.Value(0));
  
  const [speedTestTrials, setSpeedTestTrials] = useState(0);
  const [speedTestTimes, setSpeedTestTimes] = useState([]);
  const [speedTestTargetTime, setSpeedTestTargetTime] = useState(0);
  const [speedTestWaiting, setSpeedTestWaiting] = useState(true);

  const spawnTimerRef = useRef(null);
  const gameTimerRef = useRef(null);
  const targetCleanupRef = useRef(null);
  const powerBarTimerRef = useRef(null);
  const powerBarActiveTimerRef = useRef(null);
  
  // CRITICAL FIX: Prevent game start spam (100+ logs)
  const gameStartLoggedRef = useRef(false);

  const gameAreaWidth = screenDimensions.width - 40;
  const gameAreaHeight = screenDimensions.height * 0.6;

  useEffect(() => {
    const loadActiveCosmetics = async () => {
      try {
        const activeItemsData = await AsyncStorage.getItem('@active_items');
        if (activeItemsData) {
          const activeItems = JSON.parse(activeItemsData);
          const { getItemById } = require('../data/ShopItems');
          
          const activeThemeId = activeItems.themes;
          if (activeThemeId) {
            const themeItem = getItemById(activeThemeId);
            if (themeItem && themeItem.colors) {
              const shopTheme = {
                name: themeItem.name,
                backgroundColor: themeItem.colors.background[0] || '#1a1a2e',
                gradientColors: themeItem.colors.background || ['#1a1a2e', '#16213e'],
                primaryColor: themeItem.colors.primary || '#00E5FF',
                secondaryColor: themeItem.colors.secondary || '#FF6B9D',
                particleColors: [
                  themeItem.colors.primary || '#00E5FF',
                  themeItem.colors.secondary || '#FF6B9D',
                  '#FFD93D',
                ],
              };
              setCurrentTheme(shopTheme);
              console.log(`🎨 Active theme loaded: ${themeItem.name}`);
            }
          }
          
          const activeBallId = activeItems.balls;
          if (activeBallId) {
            const ballItem = getItemById(activeBallId);
            if (ballItem && ballItem.emoji) {
              setActiveBallEmoji(ballItem.emoji);
              console.log(`⚽ Active ball loaded: ${ballItem.name} ${ballItem.emoji}`);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to load active cosmetics, using defaults:', error);
      }
    };
    
    loadActiveCosmetics();
  }, []);

  // REFLEXION FIX: Cleanup effect - Stop all sounds and clear timers on unmount
  useEffect(() => {
    // CRITICAL FIX: Start gameplay music when GameScreen mounts
    console.log('🎵 GameScreen mounted - starting gameplay music');
    musicManager.playGameplayMusic();
    
    return () => {
      console.log('🧹 GameScreen unmounting - cleaning up...');
      
      // Stop all audio immediately
      soundManager.stopAll().catch(err => {
        console.warn('⚠️ Error stopping sounds on unmount:', err);
      });
      
      // CRITICAL FIX: Stop music when leaving game
      musicManager.stopAll().catch(err => {
        console.warn('⚠️ Error stopping music on unmount:', err);
      });
      
      // Clear all timers
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
        gameTimerRef.current = null;
      }
      if (targetCleanupRef.current) {
        clearInterval(targetCleanupRef.current);
        targetCleanupRef.current = null;
      }
      if (powerBarTimerRef.current) {
        clearTimeout(powerBarTimerRef.current);
        powerBarTimerRef.current = null;
      }
      if (powerBarActiveTimerRef.current) {
        clearTimeout(powerBarActiveTimerRef.current);
        powerBarActiveTimerRef.current = null;
      }
      
      console.log('✅ GameScreen cleanup complete');
    };
  }, []); // Empty deps - only run on mount/unmount

  useEffect(() => {
    // CRITICAL FIX: Prevent game start spam with ref guard
    if (gameStartLoggedRef.current) {
      console.log('⚠️ Game start already logged, skipping duplicate');
      return;
    }
    
    gameStartLoggedRef.current = true;
    
    // CRITICAL FIX: Log game start only once when component mounts
    console.log(`🎮 Game started - Mode: ${gameMode}, Level: ${playerLevel}, Theme: ${currentTheme.name}`);
    analytics.logGameStart();
    
    // CRITICAL FIX: Only show theme unlock if it's a NEW unlock
    // Track unlocked themes to prevent showing animation every game start
    const themeUnlock = getThemeUnlock(playerLevel);
    if (themeUnlock) {
      // Check if this theme was already unlocked before
      // Calculate what level player was before (using XP - 1 to simulate previous state)
      const currentXP = playerData.xp || 0;
      const previousXP = Math.max(0, currentXP - 1);
      const previousLevel = getLevelFromXP(previousXP);
      
      // Only show if:
      // 1. Previous level was less than current level (leveled up)
      // 2. Previous level didn't unlock this theme (new unlock)
      const justUnlocked = previousLevel < playerLevel && getThemeUnlock(previousLevel) !== themeUnlock;
      
      if (justUnlocked) {
        // This is a new unlock - show animation
        setUnlockedTheme(themeUnlock);
        setShowThemeUnlock(true);
        setTimeout(() => setShowThemeUnlock(false), 3000);
        console.log(`🎨 New theme unlocked: ${themeUnlock.name} (Level ${playerLevel})`);
      } else {
        // Theme already unlocked or player already at this level - don't show
        console.log(`🎨 Theme ${themeUnlock.name} already unlocked (Level ${playerLevel}, Previous: ${previousLevel})`);
      }
    }
    
    // Zen mode: disable haptics and scoring
    if (gameMode === GAME_MODES.ZEN) {
      console.log('🧠 Zen Mode: Relaxing gameplay activated');
    }
    
    // Rush mode: initialize combo multiplier
    if (gameMode === GAME_MODES.RUSH) {
      console.log('💥 Rush Mode: Fast-paced gameplay activated');
      setRushComboMultiplier(1);
    }
    // CRITICAL FIX: Only run once on mount to prevent excessive re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  // Dynamic difficulty with exponential scaling and console logging
  useEffect(() => {
    const newDifficulty = calculateDifficulty(score, gameMode);
    if (newDifficulty !== difficulty && score > 0) {
      setDifficulty(newDifficulty);
      const multiplier = getDifficultyMultiplier(newDifficulty, playerLevel);
      const spawnInterval = getSpawnInterval(newDifficulty, gameMode, playerLevel);
      console.log(
        `⚡ Level ${newDifficulty} → Difficulty ${multiplier.toFixed(2)}x | ` +
        `Spawn: ${spawnInterval}ms | Score: ${score} | Mode: ${gameMode}`
      );
    }
  }, [score, difficulty, gameMode, playerLevel]);

  useEffect(() => {
    if (!gameActive || screenDimensions.width === 0) return;
    if (gameMode === GAME_MODES.SPEED_TEST) return;

    const spawnInterval = getSpawnInterval(difficulty, gameMode, playerLevel);
    const maxTargets = require('../utils/GameLogic').getMaxSimultaneousTargets(difficulty, playerLevel, gameMode);
    
    spawnTimerRef.current = setInterval(() => {
      setTargets(prev => {
        const currentActiveTargets = prev.length;
        const targetsToSpawn = Math.min(1, maxTargets - currentActiveTargets);
        
        if (targetsToSpawn <= 0) {
          return prev;
        }
        
        const newTargets = [];
        for (let i = 0; i < targetsToSpawn; i++) {
          const newTarget = generateTarget(gameAreaWidth, gameAreaHeight, difficulty, gameMode, currentTheme, playerLevel, activeBallEmoji);
          
          if (newTarget.isDanger) {
            const dangerChance = Math.min(
              DANGER_CONFIG.BASE_CHANCE + (playerLevel - DANGER_CONFIG.MIN_LEVEL) * DANGER_CONFIG.CHANCE_PER_LEVEL,
              DANGER_CONFIG.MAX_CHANCE
            ) * 100;
            console.log(`⚠️ Danger point spawned (${dangerChance.toFixed(1)}% chance at level ${playerLevel})`);
          }
          
          newTargets.push(newTarget);
        }
        
        return [...prev, ...newTargets];
      });
    }, spawnInterval);

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [gameActive, gameAreaWidth, gameAreaHeight, difficulty, screenDimensions.width, gameMode, playerLevel, currentTheme, activeBallEmoji]);

  useEffect(() => {
    if (gameMode !== GAME_MODES.SPEED_TEST || !gameActive || screenDimensions.width === 0) return;

    if (speedTestTrials >= GAME_CONSTANTS.SPEED_TEST_TRIALS) {
      setGameActive(false);
      return;
    }

    const spawnSpeedTestTarget = () => {
      setSpeedTestWaiting(false);
      const target = generateTarget(gameAreaWidth, gameAreaHeight, 1, gameMode, currentTheme, playerLevel, activeBallEmoji);
      target.speedTestTarget = true;
      setTargets([target]);
      setSpeedTestTargetTime(Date.now());
    };

    setTargets([]);
    setSpeedTestWaiting(true);
    const delay = GAME_CONSTANTS.SPEED_TEST_MIN_DELAY + 
                  Math.random() * (GAME_CONSTANTS.SPEED_TEST_MAX_DELAY - GAME_CONSTANTS.SPEED_TEST_MIN_DELAY);
    
    const timer = setTimeout(spawnSpeedTestTarget, delay);

    return () => clearTimeout(timer);
  }, [speedTestTrials, gameActive, gameMode, gameAreaWidth, gameAreaHeight, currentTheme, playerLevel, activeBallEmoji, screenDimensions.width]);

  // Cleanup expired targets with mode-specific lifetime
  useEffect(() => {
    if (!gameActive) return;

    const targetLifetime = getTargetLifetime(gameMode);

    targetCleanupRef.current = setInterval(() => {
      const now = Date.now();
      setTargets(prev => {
        const remaining = prev.filter(t => now - t.createdAt < targetLifetime);
        const expired = prev.length - remaining.length;
        
        if (expired > 0 && gameMode !== GAME_MODES.ZEN) {
          // CRITICAL FIX: Only deduct health for expired normal targets, not danger points
          const expiredNormalTargets = prev.filter(t => {
            const isExpired = now - t.createdAt >= targetLifetime;
            const isNormalTarget = !t.isDanger; // Don't penalize for expired danger points
            return isExpired && isNormalTarget;
          }).length;
          
          if (expiredNormalTargets > 0) {
            setHealth(h => {
              const newHealth = Math.max(0, h - expiredNormalTargets);
              console.log(`⏰ Expired targets: ${expiredNormalTargets}, Health: ${h} → ${newHealth}`);
              return newHealth;
            });
            setCombo(0);
            musicManager.resetSpeed(); // ULTIMATE: Reset music speed on combo break
            soundManager.play('miss'); // Fire and forget - no await in setInterval
            triggerHaptic('error');
          }
        }
        
        return remaining;
      });
    }, 100);

    return () => {
      if (targetCleanupRef.current) clearInterval(targetCleanupRef.current);
    };
  }, [gameActive, gameMode]);

  // Game timer with mode-specific duration
  useEffect(() => {
    if (!gameActive) return;

    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [gameActive]);

  // Power Bar active timer
  useEffect(() => {
    if (powerBarActive) {
      powerBarActiveTimerRef.current = setTimeout(() => {
        setPowerBarActive(false);
        setPowerBar(0);
      }, GAME_CONSTANTS.POWER_BAR_DURATION);
    }

    return () => {
      if (powerBarActiveTimerRef.current) clearTimeout(powerBarActiveTimerRef.current);
    };
  }, [powerBarActive]);

  // Health check - offer revive
  useEffect(() => {
    if (health <= 0 && gameActive && !hasRevived) {
      setGameActive(false);
      setShowReviveOption(true);
    } else if (health <= 0 && hasRevived) {
      setGameActive(false);
    }
  }, [health, gameActive, hasRevived]);

  // Game over
  useEffect(() => {
    if (!gameActive && !gameOver && !showReviveOption) {
      handleGameOver();
    }
  }, [gameActive, gameOver, showReviveOption]);

  const handleGameOver = async () => {
    setGameOver(true);
    await soundManager.play('gameOver');
    
    // CRITICAL FIX: Only award XP/Coins if player achieved meaningful score
    // If score is 0 or very low (< 50), player failed → no rewards
    const didSucceed = score >= 50; // Minimum 50 points to earn rewards
    
    let xp = 0;
    let coins = 0;
    
    if (didSucceed) {
      // Calculate XP with Power Bar multiplier
      let xpMultiplier = 1.0;
      if (powerBarActive) {
        xpMultiplier = GAME_CONSTANTS.POWER_BAR_XP_MULTIPLIER;
      }
      
      // CRITICAL FIX: Improved XP/Coin economy for better progression
      // XP: score/8 (increased from score/10 for easier leveling)
      // Coins: score/40 + combo/6 (slightly increased for better economy)
      const baseXP = Math.floor(score / 8);
      xp = Math.floor(baseXP * xpMultiplier);
      coins = Math.floor(score / 40) + Math.floor(maxCombo / 6);
      
      console.log(`✅ Game completed successfully: ${score} points → +${xp} XP, +${coins} coins`);
    } else {
      console.log(`❌ Game failed: ${score} points (minimum 50 required) → no rewards`);
    }
    
    setEarnedXP(xp);
    setEarnedCoins(coins);
    
    analytics.logGameOver(score, maxCombo, coins, xp);
    
    // ULTIMATE: Record session for progress tracking
    await progressTracker.recordGameSession({
      score,
      maxCombo,
      accuracy: maxCombo > 0 ? (score / (maxCombo * 10)) * 100 : 0,
      xpEarned: xp,
      coinsEarned: coins,
      mode: gameMode,
      reactionTimes: [], // TODO: Track individual tap times
      duration: getGameDuration(gameMode) - timeLeft,
      level: getLevelFromXP(playerData.xp),
    });
    
    setShowDoubleReward(true);
  };

  const handleRevive = async () => {
    const result = await adService.showRewardedAd('revive');
    if (result.success) {
      setShowReviveOption(false);
      setHealth(2);
      setGameActive(true);
      setHasRevived(true);
      analytics.logRewardClaim('revive', 2);
    }
  };

  const handleShare = async () => {
    try {
      const modeText = gameMode === GAME_MODES.CLASSIC ? 'Classic' : 
                       gameMode === GAME_MODES.RUSH ? 'Rush' : 'Zen';
      const message = `🎮 I scored ${score} points in Reflexion ${modeText} Mode with a ${maxCombo}x combo! Can you beat that? 🔥`;
      
      await Share.share({
        message,
        title: 'Reflexion Score',
      });
      
      soundManager.play('success');
      console.log('✅ Score shared successfully');
    } catch (error) {
      console.error('❌ Error sharing score:', error);
    }
  };

  /**
   * Save player progress after game over
   * Updates XP, coins, high score, and achievements
   */
  const saveProgress = useCallback(async (xp, coins) => {
    const comboBonus = calculateComboBonusXP(maxCombo, xp);
    const totalXP = xp + comboBonus;
    
    if (comboBonus > 0) {
      console.log(`⚡ XP earned: ${xp} + ${comboBonus} combo bonus = ${totalXP} (Max Combo: ${maxCombo}x)`);
    } else {
      console.log(`⚡ XP earned: ${totalXP}`);
    }
    
    const oldLevel = getLevelFromXP(playerData.xp);
    
    await addXP(totalXP);
    await addCoins(coins);
    
    const newLevel = getLevelFromXP(playerData.xp + totalXP);
    
    if (newLevel > oldLevel) {
      await soundManager.play('levelUp');
      console.log(`🎉 Level up! ${oldLevel} → ${newLevel}`);
      analytics.logLevelUp(newLevel, playerData.xp + totalXP);
    }
    
    await updatePlayerData({
      highScore: Math.max(playerData.highScore || 0, score),
      maxCombo: Math.max(playerData.maxCombo || 0, maxCombo),
      gamesPlayed: (playerData.gamesPlayed || 0) + 1,
    });
    
    console.log(`✅ Progress saved: +${totalXP} XP, +${coins} coins`);
  }, [playerData, score, maxCombo, addXP, addCoins, updatePlayerData]);

  /**
   * Handle double reward ad watch
   * Doubles XP and coins earned
   */
  const handleDoubleReward = async () => {
    const result = await adService.showRewardedAd('double_reward');
    if (result.success) {
      const finalXP = earnedXP * 2;
      const finalCoins = earnedCoins * 2;
      setEarnedXP(finalXP);
      setEarnedCoins(finalCoins);
      setShowDoubleReward(false);
      saveProgress(finalXP, finalCoins);
      analytics.logRewardClaim('double_reward', finalCoins);
    }
  };

  /**
   * Handle skip double reward ad
   * Immediately shows Play Again / Main Menu buttons
   * Saves progress with normal rewards (no doubling)
   */
  const handleSkipAd = useCallback(() => {
    setShowDoubleReward(false);
    // Save progress immediately when skipping
    saveProgress(earnedXP, earnedCoins);
  }, [earnedXP, earnedCoins, saveProgress]);

  const handlePlayAgain = () => {
    // Reset game state
    setGameOver(false);
    setShowDoubleReward(false);
    setTargets([]);
    setParticles([]);
    setFloatingTexts([]);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setHealth(GAME_CONSTANTS.MAX_HEALTH);
    setTimeLeft(getGameDuration(gameMode));
    setGameActive(true);
    setHasRevived(false);
    setDifficulty(1);
    
    // ULTIMATE: Start gameplay music
    musicManager.playGameplayMusic();
    setEarnedXP(0);
    setEarnedCoins(0);
    setPowerBar(0);
    setPowerBarActive(false);
    setRushComboMultiplier(1);
    
    // Clear any existing timers
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (targetCleanupRef.current) clearInterval(targetCleanupRef.current);
    if (powerBarTimerRef.current) clearTimeout(powerBarTimerRef.current);
    if (powerBarActiveTimerRef.current) clearTimeout(powerBarActiveTimerRef.current);
  };

  /**
   * Navigate to main menu with COMPLETE state reset
   * REFLEXION FIX: Clear ALL timers, stop audio, reset ALL state
   */
  const handleMainMenu = useCallback(() => {
    // Stop all audio immediately
    try {
      const { soundManager } = require('../services/SoundManager');
      soundManager.stopAll();
    } catch (e) {
      // Fail silently if soundManager not available
    }

    // Clear ALL timers (critical bug fix)
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    if (targetCleanupRef.current) {
      clearInterval(targetCleanupRef.current);
      targetCleanupRef.current = null;
    }
    if (powerBarTimerRef.current) {
      clearTimeout(powerBarTimerRef.current);
      powerBarTimerRef.current = null;
    }
    if (powerBarActiveTimerRef.current) {
      clearTimeout(powerBarActiveTimerRef.current);
      powerBarActiveTimerRef.current = null;
    }

    // Reset ALL game state variables
    setGameOver(false);
    setShowDoubleReward(false);
    setShowReviveOption(false);
    setGameActive(false);
    setTargets([]);
    setParticles([]);
    setFloatingTexts([]);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setHealth(GAME_CONSTANTS.MAX_HEALTH);
    setTimeLeft(getGameDuration(gameMode));
    setDifficulty(1);
    setEarnedXP(0);
    setEarnedCoins(0);
    setPowerBar(0);
    setPowerBarActive(false);
    setRushComboMultiplier(1);
    setHasRevived(false);
    setShowThemeUnlock(false);
    setUnlockedTheme(null);
    
    // Reset navigation stack to prevent modal re-appearance
    navigation.reset({
      index: 0,
      routes: [{ name: 'Menu' }],
    });
  }, [navigation, gameMode]);

  // Camera shake animation for perfect combos
  // ✅ FIX: Safe haptic feedback calls
  const triggerHaptic = useCallback((type = 'light') => {
    try {
      // Safe check before calling getHapticsEnabled
      const hapticsEnabled = settingsService && typeof settingsService.getHapticsEnabled === 'function' 
        ? settingsService.getHapticsEnabled() 
        : true;
      
      if (!hapticsEnabled) return;
      
      if (type === 'light') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (type === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (type === 'heavy') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (type === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.warn('⚠️ Haptic feedback failed:', error);
    }
  }, []);

  const triggerCameraShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shakeAnim]);

  const handleTap = useCallback(async (target) => {
    setTargets(prev => prev.filter(t => t.id !== target.id));

    if (gameMode === GAME_MODES.SPEED_TEST) {
      const reactionTime = Date.now() - speedTestTargetTime;
      setSpeedTestTimes(prev => [...prev, reactionTime]);
      setSpeedTestTrials(prev => prev + 1);
      
      const newParticles = Array.from({ length: 10 }, (_, i) => ({
        id: `particle-${Date.now()}-${i}`,
        x: target.x + target.size / 2,
        y: target.y + target.size / 2,
        color: currentTheme.particleColors[i % currentTheme.particleColors.length] || target.color,
      }));
      setParticles(prev => [...prev, ...newParticles]);
      
      await soundManager.play('tap');
      console.log(`⏱️ Speed Test: Trial ${speedTestTrials + 1}, Reaction: ${reactionTime}ms`);
      return;
    }

    if (gameMode === GAME_MODES.ZEN) {
      // Zen mode: Simple visual + audio feedback only
      const particleCount = 15;
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: `particle-${Date.now()}-${i}`,
        x: target.x + target.size / 2,
        y: target.y + target.size / 2,
        color: currentTheme.particleColors[i % currentTheme.particleColors.length] || target.color,
      }));
      setParticles(prev => [...prev, ...newParticles]);
      
      // CRITICAL FIX: Always play tap sound in Zen mode
      await soundManager.play('tap', combo + 1);
      console.log(`🧠 Zen mode: tap sound played (combo: ${combo + 1}x)`);
      
      // Update combo for visual feedback (no scoring)
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      
      return; // Zen mode is purely visual + audio, no scoring/danger/powerup
    }

    // ⚠️ DANGER POINT LOGIC - Player tapped a red warning target!
    if (target.isDanger) {
      console.log('❤️ Player lost 1 life (red danger target)');
      
      // CRITICAL FIX: Ensure we only lose 1 life, not reset to 0
      setHealth(prevHealth => {
        const newHealth = Math.max(0, prevHealth - 1);
        console.log(`💔 Health: ${prevHealth} → ${newHealth}`);
        return newHealth;
      });
      
      setCombo(0); // Reset combo on danger tap
      
      // Play miss sound and error haptic
      await soundManager.play('miss');
      console.log('🎵 Sound test: miss played successfully (danger tap)');
      
      triggerHaptic('error');
      
      // Create red particles for danger tap
      const particleCount = 15;
      const redParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: `particle-${Date.now()}-${i}`,
        x: target.x + target.size / 2,
        y: target.y + target.size / 2,
        color: DANGER_CONFIG.COLOR,
      }));
      setParticles(prev => [...prev, ...redParticles]);
      
      // Show -1 life floating text
      const floatingText = {
        id: `float-${Date.now()}`,
        x: target.x + target.size / 2 - 20,
        y: target.y,
        text: '-1 ❤️',
        color: '#FF0000',
      };
      setFloatingTexts(prev => [...prev, floatingText]);
      
      return; // Exit early - no score for danger taps
    }

    // ELITE v3.0: 💎 POWER-UP LOGIC - Player tapped a gold bonus target!
    if (target.isPowerUp) {
      console.log('💎 Power-up collected! 3x score, +50 XP, +10 coins');
      
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      
      // Power-up bonuses
      const bonusScore = POWERUP_CONFIG.SCORE_MULTIPLIER * 50; // 3x multiplier
      const bonusCoins = POWERUP_CONFIG.COIN_BONUS;
      const bonusXP = POWERUP_CONFIG.XP_BONUS;
      
      setScore(s => s + bonusScore);
      setEarnedCoins(prev => prev + bonusCoins);
      setEarnedXP(prev => prev + bonusXP);
      
      // Play luckyTap sound + success haptic
      await soundManager.play('luckyTap');
      console.log('🎵 Sound test: luckyTap played successfully (power-up)');
      
      triggerHaptic('success');
      
      // Create GOLD particles for power-up
      const goldParticleCount = 20; // More particles for celebration
      const goldParticles = Array.from({ length: goldParticleCount }, (_, i) => ({
        id: `particle-${Date.now()}-${i}`,
        x: target.x + target.size / 2,
        y: target.y + target.size / 2,
        color: POWERUP_CONFIG.COLOR, // Gold
      }));
      setParticles(prev => [...prev, ...goldParticles]);
      
      // Show power-up bonus text
      const floatingText = {
        id: `float-${Date.now()}`,
        x: target.x + target.size / 2 - 30,
        y: target.y,
        text: `💎 +${bonusScore} +${bonusXP}XP`,
        color: POWERUP_CONFIG.COLOR,
      };
      setFloatingTexts(prev => [...prev, floatingText]);
      
      // Continue with normal combo logic (power bar, etc.)
      if (newCombo > 0) {
        const newPower = Math.min(100, powerBar + GAME_CONSTANTS.POWER_BAR_FILL_PER_TAP * 2); // 2x power bar fill
        setPowerBar(newPower);
        
        if (newPower >= 100 && !powerBarActive) {
          setPowerBarActive(true);
          console.log('⚡ ReflexXP Power Bar ACTIVATED! 2× XP for 10s');
        }
      }
      
      return; // Exit early - power-up fully handled
    }

    // Create particles with theme colors (normal taps)
    const particleCount = 10; // Zen mode handled earlier
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: `particle-${Date.now()}-${i}`,
      x: target.x + target.size / 2,
      y: target.y + target.size / 2,
      color: currentTheme.particleColors[i % currentTheme.particleColors.length] || target.color,
    }));
    setParticles(prev => [...prev, ...newParticles]);

    // Score calculation with mode support
    const newCombo = combo + 1;
    let points = 10;
    let coinsEarned = 0;
    let bonusText = null;
    
    // ULTIMATE: Update music speed based on combo
    musicManager.updateComboSpeed(newCombo);
    
    // Rush mode: combo multiplier increases every 5 taps
    if (gameMode === GAME_MODES.RUSH && newCombo % 5 === 0) {
      const newMultiplier = rushComboMultiplier + 0.2;
      setRushComboMultiplier(newMultiplier);
      console.log(`💥 Rush Combo Multiplier: ${newMultiplier.toFixed(1)}x`);
    }
    
    // Lucky tap bonus
    if (target.isLucky) {
      const multiplier = getLuckyBonus();
      coinsEarned = multiplier * 5;
      bonusText = `+${coinsEarned} 🪙`;
      await soundManager.play('luckyTap');
      setEarnedCoins(prev => prev + coinsEarned);
      triggerHaptic('success');
    } else {
      points = calculateScore(points, newCombo, gameMode, rushComboMultiplier);
      await soundManager.play('tap', newCombo);
      console.log(`🎵 Sound test: tap played successfully (combo: ${newCombo}x)`);
      
      // Haptic feedback only for perfect hits (combo > 0)
      if (newCombo > 0) {
        triggerHaptic('light');
      }
    }
    
    // Log combo milestones
    if (newCombo > 0 && newCombo % 10 === 0) {
      console.log(`🔥 Combo milestone: ${newCombo}x`);
    }
    
    // Power Bar: fill with perfect taps
    if (newCombo > 0) {
      const newPower = Math.min(100, powerBar + GAME_CONSTANTS.POWER_BAR_FILL_PER_TAP);
      setPowerBar(newPower);
      
      // Activate power bar when full
      if (newPower >= 100 && !powerBarActive) {
        setPowerBarActive(true);
        console.log('⚡ ReflexXP Power Bar ACTIVATED! 2× XP for 10s');
      }
    }
    
    // Floating score text with theme colors
    const floatingText = {
      id: `float-${Date.now()}`,
      x: target.x + target.size / 2 - 20,
      y: target.y,
      text: bonusText || `+${points}`,
      color: bonusText ? '#FFD93D' : currentTheme.primaryColor || target.color,
    };
    setFloatingTexts(prev => [...prev, floatingText]);

    // Update score (Zen mode has no scoring)
    if (gameMode !== GAME_MODES.ZEN) {
      setScore(s => s + points);
    }
    setCombo(newCombo);
    setMaxCombo(m => Math.max(m, newCombo));
    
    // Combo milestone: camera shake and effects for perfect combos
    if (newCombo % 5 === 0) {
      await soundManager.play('combo', newCombo);
      triggerCameraShake(); // Camera shake for combos > 5
      
      triggerHaptic('success');
    }
  }, [combo, gameMode, rushComboMultiplier, powerBar, powerBarActive, currentTheme, triggerCameraShake, triggerHaptic]);

  const handleMiss = () => {
    // Don't reset combo in Zen mode
    if (gameMode !== GAME_MODES.ZEN) {
      setCombo(0);
      // Reset power bar progress on miss
      setPowerBar(0);
    }
  };

  const removeParticle = useCallback((particleId) => {
    setParticles(prev => prev.filter(p => p.id !== particleId));
  }, []);

  const removeFloatingText = useCallback((textId) => {
    setFloatingTexts(prev => prev.filter(t => t.id !== textId));
  }, []);

  if (screenDimensions.width === 0) {
    return <View style={styles.container} />;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateX: shakeAnim,
            },
          ],
        },
      ]}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
        {/* Combo Bar with theme colors */}
        <ComboBar combo={combo} maxCombo={50} theme={currentTheme} />

        {/* Power Bar */}
        {gameMode !== GAME_MODES.ZEN && (
          <PowerBar power={powerBar} isActive={powerBarActive} theme={currentTheme} />
        )}

        {/* HUD */}
        <View style={styles.hud}>
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>
              {gameMode === GAME_MODES.SPEED_TEST ? 'Trial' : 'Score'}
            </Text>
            <Text style={[styles.hudValue, { color: currentTheme.primaryColor }]}>
              {gameMode === GAME_MODES.SPEED_TEST ? `${speedTestTrials}/${GAME_CONSTANTS.SPEED_TEST_TRIALS}` :
               gameMode === GAME_MODES.ZEN ? '—' : score}
            </Text>
          </View>
          {gameMode !== GAME_MODES.SPEED_TEST && (
            <View style={styles.hudItem}>
              <Text style={styles.hudLabel}>Time</Text>
              <Text
                style={[
                  styles.hudValue,
                  { color: currentTheme.primaryColor },
                  timeLeft <= 10 && styles.hudValueWarning,
                ]}
              >
                {timeLeft}s
              </Text>
            </View>
          )}
          {gameMode === GAME_MODES.RUSH && (
            <View style={styles.hudItem}>
              <Text style={styles.hudLabel}>Multiplier</Text>
              <Text style={[styles.hudValue, { color: '#FF6B9D' }]}>
                {rushComboMultiplier.toFixed(1)}×
              </Text>
            </View>
          )}
        </View>

      {/* Health Bar */}
      <View style={styles.healthBar}>
        {Array.from({ length: GAME_CONSTANTS.MAX_HEALTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.healthHeart,
              i < health ? styles.healthHeartActive : styles.healthHeartInactive,
            ]}
          />
        ))}
      </View>

        {/* Game Area with theme background */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleMiss}
          style={[
            styles.gameArea,
            {
              width: gameAreaWidth,
              height: gameAreaHeight,
              backgroundColor: currentTheme.gradientColors[0] || 'rgba(26, 26, 46, 0.5)',
              borderColor: currentTheme.primaryColor || '#4ECDC4',
            },
          ]}
        >
        {targets.map(target => (
          <NeonTarget
            key={target.id}
            target={target}
            onTap={handleTap}
            combo={combo}
          />
        ))}
        {particles.map(particle => (
          <Particle
            key={particle.id}
            {...particle}
            onComplete={() => removeParticle(particle.id)}
          />
        ))}
        {floatingTexts.map(text => (
          <FloatingScore
            key={text.id}
            {...text}
            onComplete={() => removeFloatingText(text.id)}
          />
        ))}
        </TouchableOpacity>

        {/* Theme Unlock Popup */}
        {showThemeUnlock && unlockedTheme && (
          <Modal visible={showThemeUnlock} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={[styles.modalTitle, { color: unlockedTheme.primaryColor }]}>
                  🎨 Theme Unlocked!
                </Text>
                <Text style={styles.modalText}>{unlockedTheme.name}</Text>
                <Text style={styles.modalText}>{unlockedTheme.description}</Text>
              </View>
            </View>
          </Modal>
        )}

        {/* Revive Modal */}
        <Modal visible={showReviveOption} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>💚 Continue?</Text>
              <Text style={styles.modalText}>Watch an ad to revive with 2 lives!</Text>
              <Text style={styles.modalScore}>
                Score: {score} | Combo: {maxCombo}x
              </Text>
              <TouchableOpacity style={styles.adButton} onPress={handleRevive}>
                <Text style={styles.adButtonText}>📺 Watch Ad & Revive</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                  setShowReviveOption(false);
                  handleGameOver();
                }}
              >
                <Text style={styles.skipButtonText}>No Thanks</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Game Over Modal */}
        <Modal visible={gameOver} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {gameMode === GAME_MODES.SPEED_TEST ? (
                <>
                  <Text style={styles.modalTitle}>⚡ Speed Test Results</Text>
                  <View style={styles.statsContainer}>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Trials Completed:</Text>
                      <Text style={styles.statValue}>{speedTestTimes.length}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Average:</Text>
                      <Text style={[styles.statValue, { color: '#FFD93D' }]}>
                        {speedTestTimes.length > 0 ? Math.round(speedTestTimes.reduce((a, b) => a + b, 0) / speedTestTimes.length) : 0}ms
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Best:</Text>
                      <Text style={[styles.statValue, { color: '#00E5FF' }]}>
                        {speedTestTimes.length > 0 ? Math.min(...speedTestTimes) : 0}ms
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Slowest:</Text>
                      <Text style={[styles.statValue, { color: '#FF6B9D' }]}>
                        {speedTestTimes.length > 0 ? Math.max(...speedTestTimes) : 0}ms
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.modalTitle}>🎮 Game Over!</Text>
                  <View style={styles.statsContainer}>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Final Score:</Text>
                      <Text style={styles.statValue}>{score}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Best Combo:</Text>
                      <Text style={styles.statValue}>x{maxCombo}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>XP Earned:</Text>
                      <Text style={[styles.statValue, styles.xpValue]}>
                        +{earnedXP} {showDoubleReward && `→ ${earnedXP * 2}`}
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Coins Earned:</Text>
                      <Text style={[styles.statValue, styles.coinsValue]}>
                        +{earnedCoins} {showDoubleReward && `→ ${earnedCoins * 2}`}
                      </Text>
                    </View>
                  </View>
                </>
              )}
              
              {gameMode !== GAME_MODES.SPEED_TEST && showDoubleReward ? (
                <>
                  <TouchableOpacity style={styles.adButton} onPress={handleDoubleReward}>
                    <Text style={styles.adButtonText}>📺 Watch Ad → 2× Rewards!</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.skipButton} onPress={handleSkipAd}>
                    <Text style={styles.skipButtonText}>Skip</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShare}
                  >
                    <Text style={styles.shareButtonText}>📤 Share Score</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.playAgainButton}
                    onPress={handlePlayAgain}
                  >
                    <Text style={styles.playAgainButtonText}>Play Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={handleMainMenu}
                  >
                    <Text style={styles.menuButtonText}>Main Menu</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Share Card Modal */}
        <Modal visible={showShareCard} transparent animationType="fade">
          <View style={styles.shareModalContainer}>
            <ShareCard
              score={score}
              combo={maxCombo}
              rank={null}
              reactionTime={avgReactionTime || 0}
              onShare={() => setShowShareCard(false)}
              onClose={() => setShowShareCard(false)}
            />
          </View>
        </Modal>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  hudItem: {
    alignItems: 'center',
  },
  hudLabel: {
    color: '#BDC3C7',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  hudValue: {
    color: '#4ECDC4',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: '#4ECDC4',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  hudValueWarning: {
    color: '#FF6B6B',
    textShadowColor: '#FF6B6B',
  },
  healthBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  healthHeart: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  healthHeartActive: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  healthHeartInactive: {
    backgroundColor: '#2C3E50',
  },
  gameArea: {
    backgroundColor: 'rgba(26, 26, 46, 0.5)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(78, 205, 196, 0.3)',
    overflow: 'hidden',
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
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
  modalScore: {
    color: '#FFD93D',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  statsContainer: {
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statLabel: {
    color: '#BDC3C7',
    fontSize: 16,
  },
  statValue: {
    color: '#ECF0F1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  xpValue: {
    color: '#4ECDC4',
  },
  coinsValue: {
    color: '#FFD93D',
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
  shareButton: {
    backgroundColor: '#00E5FF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  shareButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  playAgainButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  playAgainButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    backgroundColor: '#95A5A6',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  menuButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
