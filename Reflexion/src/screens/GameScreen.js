import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  Share,
} from 'react-native';
import AnimatedReanimated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  withRepeat,
  Easing 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { createSafeStyleSheet } from '../utils/safeStyleSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import soundManager from '../services/SoundManager.js';
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
  // ✅ TASK 1: Speed Test helpers
  getSpeedTestSpawnCount,
  calculateSpeedTestRank,
  formatTime,
} from '../utils/GameLogic';
import NeonTarget from '../components/NeonTarget';
import Particle from '../components/Particle';
import FloatingScore from '../components/FloatingScore';
import ComboBar from '../components/ComboBar';
import PowerBar from '../components/PowerBar';
import { ShareCard } from '../components/ShareCard';
import themeService from '../services/ThemeService';
import { COMBO_ANIMATION_CONFIG, ANIMATION_EASING } from '../utils/animationConstants';
import leaderboardManager from '../services/LeaderboardManager';
import { debugEvents } from '../utils/debugLog';
import { useTheme } from '../contexts/ThemeContext';
import { useFocusEffect } from '../hooks/useFocusEffect';
import { ESPORTS_DARK_BACKGROUNDS } from '../utils/themeTokens';

export default function GameScreen({ navigation, route, playerData: propPlayerData, onUpdateData }) {
  // Helper function for safe sound playback (fire-and-forget)
  const playSound = (soundName) => {
    soundManager.play(soundName).catch(err => {
      console.warn(`⚠️ Sound play failed: ${soundName}`, err);
    });
  };
  // 🔴 SAFE_EMOJI_PATCH: Applied safe emoji access pattern throughout
  console.log("SAFE_EMOJI_PATCH_APPLIED");
  
  const { playerData: globalPlayerData, updatePlayerData, addCoins, addXP, refreshPlayerData } = useGlobalState();
  const { themeData: globalThemeData } = useTheme(); // CRITICAL FIX: Use global theme
  const playerData = globalPlayerData || propPlayerData;
  // Get game mode from route params (default to Classic)
  const gameMode = route?.params?.mode || GAME_MODES.CLASSIC;
  // Get Speed Test target count from route params (default to 50)
  const speedTestTargetCount = route?.params?.targetCount || GAME_CONSTANTS.SPEED_TOTAL_TARGETS;
  
  // Get player level using new XP system
  // CRITICAL FIX: Add optional chaining to prevent error if playerData is undefined or missing totalXp
  const playerLevel = getLevelFromXP(playerData?.xp ?? playerData?.totalXp ?? 0);
  
  // 🔴 BUG #1 FIX: Use global theme from ThemeContext, fallback to level-based theme
  // Defensive: Ensure we always have a valid theme object
  const getDefaultTheme = useCallback(() => {
    try {
      return getThemeForLevel(playerLevel);
    } catch (error) {
      console.warn('⚠️ Failed to get default theme, using fallback');
      return THEMES.NEON_CITY || {
        name: 'Neon City',
        primaryColor: '#4ECDC4',
        secondaryColor: '#C56CF0',
        backgroundColor: '#0a0a1a',
        gradientColors: ['#1a1a2e', '#16213e'],
        particleColors: ['#4ECDC4', '#00D9FF', '#00FFE5'],
      };
    }
  }, [playerLevel]);

  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      // 🔴 CRITICAL FIX: Check for accentColor OR primaryColor (premium tokens use accentColor)
      if (globalThemeData && globalThemeData.name && (globalThemeData.accentColor || globalThemeData.primaryColor)) {
        console.log('🎨 GameScreen - Initial theme from globalThemeData:', globalThemeData.name);
        return globalThemeData;
      }
      const defaultTheme = getDefaultTheme();
      console.log('🎨 GameScreen - Using default theme:', defaultTheme.name);
      return defaultTheme;
    } catch (error) {
      console.warn('⚠️ Error initializing theme, using default');
      return getDefaultTheme();
    }
  });
  const [activeBallEmoji, setActiveBallEmoji] = useState('⚪');
  const [activeParticleEmoji, setActiveParticleEmoji] = useState(null); // 🔴 PARTICLE FIX: Store active particle emoji
  
  // 🔴 CRITICAL FIX: Update theme when globalThemeData changes (when theme is selected in shop)
  // CRITICAL: This must run whenever globalThemeData changes to ensure visuals update
  // Single source of truth: globalThemeData from ThemeContext takes priority
  useEffect(() => {
    try {
      // 🔴 CRITICAL FIX: Check for accentColor OR primaryColor (premium tokens use accentColor)
      if (globalThemeData && globalThemeData.name && (globalThemeData.accentColor || globalThemeData.primaryColor)) {
        console.log('🎨 PREMIUM THEME - globalThemeData changed:', globalThemeData.name);
        console.log('   Theme ID:', globalThemeData.id);
        console.log('   Accent Color:', globalThemeData.accentColor || globalThemeData.primaryColor);
        console.log('   Background:', globalThemeData.backgroundColor);
        console.log('   Gradient Colors:', globalThemeData.gradientColors);
        console.log('   Particle Colors:', globalThemeData.particleColors);
        
        // 🔴 CRITICAL FIX: Always create a NEW object reference to force React re-render
        // This ensures React detects the state change and triggers a re-render
        // 🎨 PREMIUM ESPORTS: Preserve all premium token properties
        const updatedTheme = {
          ...globalThemeData, // Preserve all premium token properties
          id: globalThemeData.id || 'theme_default',
          name: globalThemeData.name || 'Classic Dark',
          // Support both new token structure and legacy
          accentColor: globalThemeData.accentColor || globalThemeData.primaryColor || '#00E5FF',
          primaryColor: globalThemeData.accentColor || globalThemeData.primaryColor || '#00E5FF', // Legacy support
          secondaryAccent: globalThemeData.secondaryAccent || globalThemeData.secondaryColor || '#FF6B9D',
          secondaryColor: globalThemeData.secondaryAccent || globalThemeData.secondaryColor || '#FF6B9D', // Legacy support
          backgroundColor: globalThemeData.backgroundColor || '#05070D',
          gradientColors: Array.isArray(globalThemeData.gradientColors) && globalThemeData.gradientColors.length > 0
            ? [...globalThemeData.gradientColors] // Create new array reference
            : ['#0A0F1A', '#1a1a2e'],
          particleColors: Array.isArray(globalThemeData.particleColors) && globalThemeData.particleColors.length > 0
            ? [...globalThemeData.particleColors] // Create new array reference
            : ['#00E5FF', '#4ECDC4', '#00D9FF'],
        };
        
        // 🔴 CRITICAL FIX: Always update state with new object reference (forces re-render)
        setCurrentTheme(updatedTheme);
        console.log('✅ PREMIUM THEME - GameScreen currentTheme updated:', updatedTheme.name);
        console.log('   Applied colors - Accent:', updatedTheme.accentColor, 'Background:', updatedTheme.backgroundColor);
        console.log('   Gradient:', updatedTheme.gradientColors);
      } else {
        // 🔴 CRITICAL FIX: Log why theme update was skipped
        if (!globalThemeData) {
          console.warn('⚠️ Theme update skipped: globalThemeData is null/undefined');
        } else if (!globalThemeData.name) {
          console.warn('⚠️ Theme update skipped: globalThemeData.name is missing');
        } else if (!globalThemeData.accentColor && !globalThemeData.primaryColor) {
          console.warn('⚠️ Theme update skipped: No accentColor or primaryColor found');
        }
        
        // Only fallback if currentTheme is also invalid
        if (!currentTheme || (!currentTheme.name && !currentTheme.accentColor && !currentTheme.primaryColor)) {
          console.warn('⚠️ Invalid theme data, using default');
          setCurrentTheme(getDefaultTheme());
        }
      }
    } catch (error) {
      console.error('❌ Error updating theme from globalThemeData:', error);
      setCurrentTheme(getDefaultTheme());
    }
  }, [
    globalThemeData?.id, // 🔴 CRITICAL: Use id to detect theme changes
    globalThemeData?.name, 
    globalThemeData?.accentColor || globalThemeData?.primaryColor, 
    globalThemeData?.backgroundColor, 
    globalThemeData?.gradientColors?.join(','), // Use join to detect array changes
    globalThemeData?.particleColors?.join(','), // Use join to detect array changes
    getDefaultTheme
  ]);
  
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
  // Speed Test mode doesn't use health system
  const [health, setHealth] = useState(
    route?.params?.mode === GAME_MODES.SPEED_TEST 
      ? GAME_CONSTANTS.MAX_HEALTH // Keep at max, but never displayed/used
      : GAME_CONSTANTS.MAX_HEALTH
  );
  const [timeLeft, setTimeLeft] = useState(getGameDuration(gameMode));
  // CRITICAL FIX: Speed Test countdown - don't start game immediately
  const [countdown, setCountdown] = useState(gameMode === GAME_MODES.SPEED_TEST ? 3 : null);
  const [gameActive, setGameActive] = useState(gameMode !== GAME_MODES.SPEED_TEST); // Don't start active for Speed Test until countdown
  
  // CRITICAL FIX: Initialize countdown when entering Speed Test mode from menu
  // This only runs when route params change (navigation from menu)
  useEffect(() => {
    if (gameMode === GAME_MODES.SPEED_TEST && !speedTestInitializedRef.current) {
      console.log('✅ Speed Test mode detected - initializing countdown to 3');
      setCountdown(3);
      setGameActive(false);
      setSpeedTestStartTime(0);
      setSpeedTestElapsedTime(0);
      setSpeedTestTargetsHit(0);
      setSpeedTestCompleted(false);
      speedTestInitializedRef.current = true;
    } else if (gameMode !== GAME_MODES.SPEED_TEST) {
      speedTestInitializedRef.current = false;
    }
  }, [route?.params?.mode, route?.params?.targetCount, gameMode]);
  
  const [gameOver, setGameOver] = useState(false);
  
  // 🔴 RUSH MODE FIX: Sync gameOverRef with gameOver state
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // CRITICAL FIX: Sync refs with state to prevent stale values in handleGameOver
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    healthRef.current = health;
  }, [health]);

  useEffect(() => {
    maxComboRef.current = maxCombo;
  }, [maxCombo]);
  const [gameWon, setGameWon] = useState(false); // Track win/lose state
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
  
  // CRITICAL FIX: Track if Speed Test has been initialized (prevents re-initialization loops)
  const speedTestInitializedRef = useRef(false);
  const [avgReactionTime, setAvgReactionTime] = useState(0);
  const [unlockedTheme, setUnlockedTheme] = useState(null);
  // === AAA GAME JUICE: Reanimated Screen Shake ===
  // Old Animated.Value kept for countdown compatibility
  const [shakeAnim] = useState(new Animated.Value(0));
  
  // New Reanimated shake for gameplay events (better performance)
  const shakeOffset = useSharedValue(0);
  
  const animatedShakeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeOffset.value }]
    };
  });
  
  // AAA Game Juice: Enhanced shake trigger for danger/miss events
  const triggerShake = useCallback(() => {
    'worklet';
    shakeOffset.value = withSequence(
      withTiming(10, { duration: 50, easing: Easing.out(Easing.quad) }),
      withTiming(-10, { duration: 50, easing: Easing.inOut(Easing.quad) }),
      withTiming(10, { duration: 50, easing: Easing.inOut(Easing.quad) }),
      withTiming(-10, { duration: 50, easing: Easing.inOut(Easing.quad) }),
      withTiming(0, { duration: 50, easing: Easing.in(Easing.quad) })
    );
  }, [shakeOffset]);
  
  // ✅ TASK 1: Speed Test (Time-Attack Mode) State
  const [speedTestStartTime, setSpeedTestStartTime] = useState(0);
  const [speedTestElapsedTime, setSpeedTestElapsedTime] = useState(0);
  const [speedTestTargetsHit, setSpeedTestTargetsHit] = useState(0);
  const [speedTestTargetsMissed, setSpeedTestTargetsMissed] = useState(0);
  const [speedTestCompleted, setSpeedTestCompleted] = useState(false);
  const [speedTestResultsVisible, setSpeedTestResultsVisible] = useState(false);
  const [speedTestCanRestart, setSpeedTestCanRestart] = useState(false);
  const speedTestTimerRef = useRef(null);
  const speedTestSpawnTimerRef = useRef(null); // 🔴 SPEED TEST FIX: Spawn timer ref
  const speedTestStartTimeRef = useRef(null); // 🔴 SPEED TEST FIX: Store start time in ref to avoid stale closures
  const speedTestCompletedRef = useRef(false); // 🔴 SPEED TEST FIX: Store completion flag in ref to avoid stale closures
  const speedTestTargetsLengthRef = useRef(0); // 🔴 SPEED TEST FIX: Store targets length in ref
  // CRITICAL FIX: Use refs to prevent flicker and ensure state consistency
  const speedTestHitCountRef = useRef(0);
  const speedTestElapsedTimeRef = useRef(0); // Store timer value in ref to reduce re-renders
  const speedTestTargetCountRef = useRef(speedTestTargetCount); // Capture target count in ref
  const zenSpawnTimerRef = useRef(null);
  // CRITICAL FIX: Use refs to capture score/health/maxCombo at game over (prevents stale state)
  const scoreRef = useRef(0);
  const healthRef = useRef(GAME_CONSTANTS.MAX_HEALTH);
  const maxComboRef = useRef(0);
  // 🔴 TAP PIPELINE: Prevent overlapping async tap processing
  const isProcessingTapRef = useRef(false);
  // 🔴 CLEANUP: Guard against state updates after unmount
  const isMountedRef = useRef(true);

  const spawnTimerRef = useRef(null);
  const gameTimerRef = useRef(null);
  const targetCleanupRef = useRef(null);
  const powerBarTimerRef = useRef(null);
  const powerBarActiveTimerRef = useRef(null);
  
  // 🔴 BUG #2 FIX: RunId system to prevent stale callbacks
  const runIdRef = useRef(0);
  // CRITICAL FIX: Store handleGameOver in ref so it can be called from useEffect that runs before it's defined
  const handleGameOverRef = useRef(null);
  
  // 🔴 RUSH MODE FIX: Game over ref to prevent stale closures
  const gameOverRef = useRef(false);
  
  // 🔴 BUG #2 FIX: Revive protection window to prevent old targets from instantly killing player
  const REVIVE_PROTECTION_DURATION_MS = 1000; // 1 second grace period after revive
  const reviveProtectionUntilRef = useRef(null);
  
  // CRITICAL FIX: Prevent game start spam (100+ logs)
  const gameStartLoggedRef = useRef(false);
  
  // 🔴 RUSH MODE FIX: Centralized safe health update function
  // This ensures health is NEVER modified when it shouldn't be
  const updateHealthSafe = useCallback((delta, reason = 'unknown', runId = null) => {
    // 🔴 BUG #2 FIX: Use actual game mode for logging, not hardcoded [RUSH]
    const modeTag = gameMode ? `[${gameMode.toUpperCase().replace('_', ' ')}]` : '[GAME]';
    
    // Guard 1: Check if game is over
    if (gameOverRef.current) {
      console.log(`${modeTag} Blocked health update: gameOver=true, reason=${reason}`);
      return false;
    }
    
    // Guard 2: Check if game is active
    if (!gameActive) {
      console.log(`${modeTag} Blocked health update: gameActive=false, reason=${reason}`);
      return false;
    }
    
    // Guard 3: Check runId if provided (for stale callback prevention)
    if (runId !== null && runId !== runIdRef.current) {
      console.log(`${modeTag} Blocked stale health update: runId mismatch (${runId} !== ${runIdRef.current}), reason=${reason}`);
      return false;
    }
    
    // Guard 4: Check revive protection window
    const now = Date.now();
    if (reviveProtectionUntilRef.current && now < reviveProtectionUntilRef.current) {
      console.log(`${modeTag} Blocked health update: in revive protection window, reason=${reason}`);
      return false;
    }
    
    // Guard 5: Don't reduce health if already at 0
    setHealth(prevHealth => {
      if (prevHealth <= 0 && delta < 0) {
        console.log(`${modeTag} Blocked health update: already at 0, reason=${reason}`);
        return prevHealth;
      }
      
      const newHealth = Math.max(0, Math.min(GAME_CONSTANTS.MAX_HEALTH, prevHealth + delta));
      console.log(`${modeTag} Health update: ${prevHealth} → ${newHealth} (delta=${delta}, reason=${reason}, runId=${runIdRef.current})`);
      return newHealth;
    });
    
    return true;
  }, [gameActive]);

  const gameAreaWidth = screenDimensions.width - 40;
  const gameAreaHeight = screenDimensions.height * 0.6;

  // 🔴 BUG #1 FIX: Load active theme, particles, and balls from shop selection
  useEffect(() => {
    const loadActiveCosmetics = async () => {
      try {
        // 🔴 CRITICAL FIX: If globalThemeData exists, use it directly (from ThemeContext)
        // This ensures that when theme changes in shop, it's immediately reflected
        // Check for accentColor OR primaryColor (premium tokens use accentColor)
        if (globalThemeData && globalThemeData.name && (globalThemeData.accentColor || globalThemeData.primaryColor)) {
          console.log('🎮 GameScreen - Using globalThemeData from ThemeContext:', globalThemeData.name);
          // Load particles and balls, but use globalThemeData for theme
        const activeItemsData = await AsyncStorage.getItem('@active_items');
          let activeParticleId = null;
          let activeBallId = null;
          
        if (activeItemsData) {
            try {
          const activeItems = JSON.parse(activeItemsData);
              activeParticleId = activeItems.particles;
              activeBallId = activeItems.balls;
              console.log('🎮 GameScreen - Active items loaded:', { 
                particle: activeParticleId, 
                ball: activeBallId 
              });
            } catch (parseError) {
              console.warn('⚠️ Failed to parse active items:', parseError);
            }
          }
          
          // 🔴 CRITICAL FIX: Use globalThemeData directly, but create new object reference
          // This ensures React detects the change and triggers re-render
          // Support both accentColor (premium) and primaryColor (legacy)
          setCurrentTheme({
            id: globalThemeData.id || 'theme_default',
            name: globalThemeData.name,
            accentColor: globalThemeData.accentColor || globalThemeData.primaryColor,
            primaryColor: globalThemeData.accentColor || globalThemeData.primaryColor, // Legacy support
            secondaryAccent: globalThemeData.secondaryAccent || globalThemeData.secondaryColor,
            secondaryColor: globalThemeData.secondaryAccent || globalThemeData.secondaryColor, // Legacy support
            backgroundColor: globalThemeData.backgroundColor || '#05070D',
            gradientColors: Array.isArray(globalThemeData.gradientColors) && globalThemeData.gradientColors.length > 0
              ? [...globalThemeData.gradientColors]
              : ['#0A0F1A', '#1a1a2e'],
            particleColors: Array.isArray(globalThemeData.particleColors) && globalThemeData.particleColors.length > 0
              ? [...globalThemeData.particleColors]
              : ['#00E5FF', '#4ECDC4', '#00D9FF'],
          });
          
          // 🔴 PARTICLE FIX: Load active particle emoji
          if (activeParticleId) {
            try {
              const { getItemById } = require('../data/ShopItems');
              const particleItem = getItemById(activeParticleId);
              if (particleItem) {
                // 🔴 SAFE_EMOJI_PATCH: Never directly access emoji, always use safe fallback
                const safeEmoji = particleItem?.emoji ?? particleItem?.icon ?? particleItem?.character ?? null;
                setActiveParticleEmoji(safeEmoji);
                console.log(`✨ GameScreen - Active particle: ${particleItem.name} (${safeEmoji || 'none'})`);
              } else {
                setActiveParticleEmoji(null);
              }
            } catch (error) {
              console.warn('⚠️ Failed to load particle item:', error);
              setActiveParticleEmoji(null);
            }
          } else {
            setActiveParticleEmoji(null);
          }
          
          if (activeBallId) {
            try {
              const { getItemById } = require('../data/ShopItems');
            const ballItem = getItemById(activeBallId);
              if (ballItem) {
                // 🔴 SAFE_EMOJI_PATCH: Never directly access emoji, always use safe fallback
                const safeEmoji = ballItem?.emoji ?? ballItem?.icon ?? ballItem?.character ?? '⚪';
                setActiveBallEmoji(safeEmoji);
              }
            } catch (error) {
              console.warn('⚠️ Failed to load ball item:', error);
            }
          }
          return; // Exit early - globalThemeData is the source of truth
        }
        
        // Fallback: Load from ThemeService if globalThemeData not available
        const activeThemeId = await themeService.getActiveTheme();
        console.log('🎮 GameScreen - Loading active theme from ThemeService:', activeThemeId);
        
        // Use getThemeData to properly map theme IDs (handles 'theme_neon_city' format)
        const { getThemeData } = require('../utils/GameLogic');
        const themeObj = getThemeData(activeThemeId);
        
          if (themeObj) {
          // Load active particles and balls from @active_items
          const activeItemsData = await AsyncStorage.getItem('@active_items');
          let activeParticleId = null;
          let activeBallId = null;
          
          if (activeItemsData) {
            try {
              const activeItems = JSON.parse(activeItemsData);
              activeParticleId = activeItems.particles;
              activeBallId = activeItems.balls;
              console.log('🎮 GameScreen - Active items:', { 
                particle: activeParticleId, 
                ball: activeBallId 
              });
            } catch (parseError) {
              console.warn('⚠️ Failed to parse active items:', parseError);
            }
          }
          
          // 🔴 PARTICLE FIX: Load particle item to get emoji and colors
          let particleColors = themeObj.particleColors; // Default to theme colors
          if (activeParticleId) {
            try {
              const { getItemById } = require('../data/ShopItems');
              const particleItem = getItemById(activeParticleId);
              if (particleItem) {
                // 🔴 SAFE_EMOJI_PATCH: Never directly access emoji, always use safe fallback
                const safeEmoji = particleItem?.emoji ?? particleItem?.icon ?? particleItem?.character ?? null;
                setActiveParticleEmoji(safeEmoji);
                console.log(`✨ GameScreen - Using active particle in gameplay: ${particleItem.name} (${safeEmoji || 'none'})`);
                // TODO: Future enhancement - apply particle-specific colors if needed
              } else {
                setActiveParticleEmoji(null);
              }
            } catch (error) {
              console.warn('⚠️ Failed to load particle item:', error);
              setActiveParticleEmoji(null);
            }
          } else {
            setActiveParticleEmoji(null);
          }
          
          // 🔴 BUG FIX: Apply theme with particle colors, create new object reference
          const finalTheme = {
            id: themeObj.id || activeThemeId,
              name: themeObj.name,
              primaryColor: themeObj.primaryColor,
              secondaryColor: themeObj.secondaryColor,
            particleColors: Array.isArray(particleColors) ? [...particleColors] : (Array.isArray(themeObj.particleColors) ? [...themeObj.particleColors] : ['#4ECDC4', '#00D9FF', '#00FFE5']),
              backgroundColor: themeObj.backgroundColor,
            gradientColors: Array.isArray(themeObj.gradientColors) ? [...themeObj.gradientColors] : ['#1a1a2e', '#16213e'],
          };
          
          setCurrentTheme(finalTheme);
          console.log(`✅ GameScreen - Theme applied: ${finalTheme.name}`);
          console.log(`   Colors: Primary=${finalTheme.primaryColor}, Secondary=${finalTheme.secondaryColor}`);
          console.log(`   Particle Colors:`, finalTheme.particleColors);
          
          // Load active ball emoji
          if (activeBallId) {
            try {
              const { getItemById } = require('../data/ShopItems');
              const ballItem = getItemById(activeBallId);
              if (ballItem) {
                // 🔴 SAFE_EMOJI_PATCH: Never directly access emoji, always use safe fallback
                const safeEmoji = ballItem?.emoji ?? ballItem?.icon ?? ballItem?.character ?? '⚪';
                setActiveBallEmoji(safeEmoji);
                console.log(`⚽ Active ball: ${ballItem.name} (${safeEmoji})`);
              }
            } catch (error) {
              console.warn('⚠️ Failed to load ball item:', error);
            }
          }
        } else {
          // Fallback to level-based theme
          console.warn('⚠️ Theme not found, using level-based theme');
          setCurrentTheme(getThemeForLevel(playerLevel));
        }
      } catch (error) {
        console.error('❌ Failed to load active cosmetics:', error);
        // Fallback to level-based theme
        setCurrentTheme(getThemeForLevel(playerLevel));
      }
    };
    
    // 🔴 BUG FIX: Only load cosmetics if globalThemeData is not available
    // If globalThemeData exists, the primary effect (line 104) will handle theme updates
    if (!globalThemeData || !globalThemeData.name) {
      loadActiveCosmetics();
    }
    
    // Subscribe to theme changes for real-time updates (fallback if ThemeContext not working)
    const unsubscribe = themeService.subscribe((themeId) => {
      console.log(`🔄 ThemeService: Theme changed to ${themeId}`);
      // Only reload if globalThemeData is not available (ThemeContext should handle it)
      if (!globalThemeData || !globalThemeData.name) {
        loadActiveCosmetics();
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [playerLevel]); // 🔴 BUG FIX: Remove globalThemeData dependency - primary effect handles it

  // 🔴 PARTICLE FIX: Reload active particle when screen is focused (e.g., returning from Shop)
  useFocusEffect(
    useCallback(() => {
      const reloadActiveParticle = async () => {
        try {
          const activeItemsData = await AsyncStorage.getItem('@active_items');
          if (activeItemsData) {
            const activeItems = JSON.parse(activeItemsData);
            const activeParticleId = activeItems.particles;
            
            if (activeParticleId) {
              try {
                const { getItemById } = require('../data/ShopItems');
                const particleItem = getItemById(activeParticleId);
                if (particleItem) {
                  // 🔴 SAFE_EMOJI_PATCH: Never directly access emoji, always use safe fallback
                  const safeEmoji = particleItem?.emoji ?? particleItem?.icon ?? particleItem?.character ?? null;
                  setActiveParticleEmoji(safeEmoji);
                  console.log(`✨ GameScreen - Reloaded active particle on focus: ${particleItem.name} (${safeEmoji || 'none'})`);
                } else {
                  setActiveParticleEmoji(null);
                }
              } catch (error) {
                console.warn('⚠️ Failed to reload particle item:', error);
                setActiveParticleEmoji(null);
              }
            } else {
              setActiveParticleEmoji(null);
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to reload active particle:', error);
        }
      };
      
      reloadActiveParticle();
    }, [])
  );

  // 🔴 BUG #2 FIX: Initialize runId when game starts
  useEffect(() => {
    if (gameActive && runIdRef.current === 0) {
      // First time game becomes active - initialize runId
      runIdRef.current = 1;
      console.log(`🔄 BUG #2 FIX: Game started - initialized runId=${runIdRef.current}`);
    }
  }, [gameActive]);

  useEffect(() => {
    const initMusic = async () => {
      if (!soundManager.isInitialized()) {
        return;
      }
      if (musicManager.currentTrack !== 'game' || !musicManager.isPlaying) {
        if (musicManager.currentTrack === 'menu' && musicManager.isPlaying) {
          musicManager.stopMenuMusic().catch(() => {});
        }
        await musicManager.playGameplayMusic();
      }
    };
    
    initMusic();
    runIdRef.current = 0;
    
    return () => {
      runIdRef.current = 0;
      
      const cleanup = async () => {
        try {
          const stopResult = soundManager.stopAll();
          if (stopResult && typeof stopResult.catch === 'function') {
            stopResult.catch(err => {
              console.warn('⚠️ Error stopping sounds on unmount:', err);
            });
          }
        } catch (err) {
          console.warn('⚠️ Error stopping sounds on unmount:', err);
        }
        
        try {
          await musicManager.stopAll();
          if (soundManager.isInitialized()) {
            await musicManager.playMenuMusic();
          }
        } catch (err) {
          console.warn('⚠️ Error stopping music on unmount:', err);
        }
      };
      
      cleanup();
      
      // 🔴 KRİTİK DÜZELTME: Comprehensive cleanup - tüm timer'ları ve state'leri temizle
      try {
        // Clear all interval timers
        if (spawnTimerRef.current) {
          clearInterval(spawnTimerRef.current);
          spawnTimerRef.current = null;
        }
        if (zenSpawnTimerRef.current) {
          clearInterval(zenSpawnTimerRef.current);
          zenSpawnTimerRef.current = null;
        }
        if (gameTimerRef.current) {
          clearInterval(gameTimerRef.current);
          gameTimerRef.current = null;
        }
        if (targetCleanupRef.current) {
          clearInterval(targetCleanupRef.current);
          targetCleanupRef.current = null;
        }
        if (speedTestTimerRef.current) {
          clearInterval(speedTestTimerRef.current);
          speedTestTimerRef.current = null;
        }
        if (speedTestSpawnTimerRef.current) {
          clearInterval(speedTestSpawnTimerRef.current);
          speedTestSpawnTimerRef.current = null;
        }
        
        // 🔴 CRITICAL FIX: Reset Speed Test refs on unmount
        speedTestTargetsLengthRef.current = 0;
        speedTestStartTimeRef.current = null;
        speedTestCompletedRef.current = false;
        
        // Clear all timeout timers
        if (powerBarTimerRef.current) {
          clearTimeout(powerBarTimerRef.current);
          powerBarTimerRef.current = null;
        }
        if (powerBarActiveTimerRef.current) {
          clearTimeout(powerBarActiveTimerRef.current);
          powerBarActiveTimerRef.current = null;
        }
        
        // 🔴 CLEANUP: Mark as unmounted to prevent state updates
      isMountedRef.current = false;
      isProcessingTapRef.current = false;
      
      // 🔴 MEMORY LEAK ÖNLEMİ: State'leri resetle (only if mounted)
      if (isMountedRef.current) {
        setTargets([]);
        setIsGameOver(true);
        setIsPaused(true);
        setGameActive(false);
      }
      } catch (error) {
        console.warn('⚠️ Error during cleanup:', error);
      }
      
      console.log('✅ GameScreen cleanup complete');
    };
  }, []); // Empty deps - only run on mount/unmount

  // CRITICAL FIX: Speed Test countdown timer
  useEffect(() => {
    // Only run if Speed Test mode and countdown is active
    if (gameMode !== GAME_MODES.SPEED_TEST || countdown === null || countdown <= 0) {
      return;
    }
    
    console.log(`⏱️ Speed Test countdown started: ${countdown}`);
    
    // Animate countdown text immediately
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    // 🔴 TAP SOUND FIX: Use playTap() for countdown
    playSound('tap');
    
    // Start countdown interval
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(countdownInterval);
          return null;
        }
        
        if (prev <= 1) {
          // Countdown complete - start the game IMMEDIATELY
          console.log('✅ Countdown complete - starting game');
          clearInterval(countdownInterval);
          setGameActive(true);
          // 🔴 TAP SOUND FIX: Use playSound helper
          playSound('tap');
          return null;
        }
        
        // Continue countdown
        console.log(`⏱️ Countdown: ${prev - 1}`);
        // 🔴 TAP SOUND FIX: Use playSound helper
        playSound('tap');
        // Animate for each count
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(countdownInterval);
    };
  }, [gameMode, countdown, shakeAnim]);

  // CRITICAL FIX: Update ref when target count changes
  useEffect(() => {
    speedTestTargetCountRef.current = speedTestTargetCount;
  }, [speedTestTargetCount]);

  useEffect(() => {
    // CRITICAL FIX: Prevent game start spam with ref guard
    if (gameStartLoggedRef.current) {
      console.log('⚠️ Game start already logged, skipping duplicate');
      return;
    }
    
    // CRITICAL FIX: Wait for countdown to complete before logging game start for Speed Test
    if (gameMode === GAME_MODES.SPEED_TEST && countdown !== null) {
      return;
    }
    
    gameStartLoggedRef.current = true;
    
    // CRITICAL FIX: Log game start only once when component mounts (after countdown for Speed Test)
    console.log(`🎮 Game started - Mode: ${gameMode}, Level: ${playerLevel}, Theme: ${currentTheme.name}`);
    analytics.logGameStart();
    
    // CRITICAL FIX: Only show theme unlock if it's a NEW unlock
    // Track unlocked themes to prevent showing animation every game start
    const themeUnlock = getThemeUnlock(playerLevel);
    if (themeUnlock) {
      // Check if this theme was already unlocked before
      // Calculate what level player was before (using XP - 1 to simulate previous state)
      // CRITICAL FIX: Add optional chaining for safe access
      const currentXP = playerData?.xp ?? playerData?.totalXp ?? 0;
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

  // ✅ CRITICAL FIX: Zen Mode spawning - Relaxing, continuous spawns
  useEffect(() => {
    if (!gameActive || screenDimensions.width === 0) return;
    if (gameMode !== GAME_MODES.ZEN) return;
    
    // Zen mode: Slower, relaxing spawn rate (1500ms interval)
    const zenSpawnInterval = GAME_CONSTANTS.ZEN_SPAWN_INTERVAL;
    const maxZenTargets = 2; // Max 2 targets at once for relaxed gameplay
    
    if (zenSpawnTimerRef.current) {
      clearInterval(zenSpawnTimerRef.current);
      zenSpawnTimerRef.current = null;
    }
    
    zenSpawnTimerRef.current = setInterval(() => {
      setTargets(prev => {
        if (prev.length >= maxZenTargets) {
          return prev; // At max capacity
        }
        
        // CRITICAL FIX: Pass existing targets to prevent overlap
        const newTarget = generateTarget(gameAreaWidth, gameAreaHeight, 1, gameMode, currentTheme, playerLevel, activeBallEmoji, prev);
        return [...prev, newTarget];
      });
    }, zenSpawnInterval);
    
    return () => {
      if (zenSpawnTimerRef.current) {
        clearInterval(zenSpawnTimerRef.current);
        zenSpawnTimerRef.current = null;
      }
    };
  }, [gameActive, gameAreaWidth, gameAreaHeight, screenDimensions.width, gameMode, currentTheme, playerLevel, activeBallEmoji]);
  
  // ✅ TASK 4: Multi-Spawn Rhythm Fix - Proper batch spawning for Classic & Rush
  useEffect(() => {
    if (!gameActive || screenDimensions.width === 0) return;
    if (gameMode === GAME_MODES.SPEED_TEST || gameMode === GAME_MODES.ZEN) return;

    const spawnInterval = getSpawnInterval(difficulty, gameMode, playerLevel);
    const maxTargets = require('../utils/GameLogic').getMaxSimultaneousTargets(difficulty, playerLevel, gameMode);
    
    // ✅ TASK 4: Cancel any pending spawn timers when difficulty/level changes
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }
    
    // ✅ TASK 4: Spawn batch logic - spawn multiple targets per interval based on mode
    spawnTimerRef.current = setInterval(() => {
      setTargets(prev => {
        const currentActiveTargets = prev.length;
        const availableSlots = maxTargets - currentActiveTargets;
        
        if (availableSlots <= 0) {
          return prev; // At max capacity
        }
        
        // ✅ TASK 4: Calculate batch size based on mode and difficulty
        let batchSize = 1; // Default: spawn 1 at a time
        
        if (gameMode === GAME_MODES.RUSH) {
          // Rush: spawn 2-4 targets per interval at higher levels
          if (playerLevel >= 8) {
            batchSize = Math.min(4, Math.floor(Math.random() * 3) + 2); // 2-4 targets
          } else if (playerLevel >= 5) {
            batchSize = Math.min(3, Math.floor(Math.random() * 2) + 2); // 2-3 targets
          } else {
            batchSize = Math.min(2, Math.floor(Math.random() * 2) + 1); // 1-2 targets
          }
        } else if (gameMode === GAME_MODES.CLASSIC) {
          // Classic: gradually increase to 3 targets
          if (playerLevel >= 8) {
            batchSize = Math.min(3, Math.floor(Math.random() * 2) + 2); // 2-3 targets
          } else if (playerLevel >= 5) {
            batchSize = Math.min(2, Math.floor(Math.random() * 2) + 1); // 1-2 targets
          } else {
            batchSize = 1; // 1 target at low levels
          }
        }
        
        // Don't exceed available slots or max targets
        const targetsToSpawn = Math.min(batchSize, availableSlots);
        
        if (targetsToSpawn <= 0) {
          return prev;
        }
        
        const newTargets = [];
        for (let i = 0; i < targetsToSpawn; i++) {
          // CRITICAL FIX: Pass existing targets to prevent overlap
          const newTarget = generateTarget(gameAreaWidth, gameAreaHeight, difficulty, gameMode, currentTheme, playerLevel, activeBallEmoji, [...prev, ...newTargets]);
          
          if (newTarget.isDanger) {
            debugEvents.spawnEvent('danger', { x: newTarget.x, y: newTarget.y });
            const dangerChance = Math.min(
              DANGER_CONFIG.BASE_CHANCE + (playerLevel - DANGER_CONFIG.MIN_LEVEL) * DANGER_CONFIG.CHANCE_PER_LEVEL,
              DANGER_CONFIG.MAX_CHANCE
            ) * 100;
            console.log(`⚠️ Danger point spawned (${dangerChance.toFixed(1)}% chance at level ${playerLevel})`);
          }
          
          newTargets.push(newTarget);
        }
        
        // ✅ TASK 4: Debug log (dev-only, remove in production)
        if (__DEV__ && newTargets.length > 1) {
          console.log(`🎯 TASK 4: Spawned batch of ${newTargets.length} targets (Level ${playerLevel}, Mode: ${gameMode}, Max: ${maxTargets})`);
        }
        
        return [...prev, ...newTargets];
      });
    }, spawnInterval);

    return () => {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
    };
  }, [gameActive, gameAreaWidth, gameAreaHeight, difficulty, screenDimensions.width, gameMode, playerLevel, currentTheme, activeBallEmoji]);

  // ✅ TASK 1: Speed Test Timer - OPTIMIZED (NO STALE CLOSURES)
  useEffect(() => {
    // Sync ref with state
    speedTestCompletedRef.current = speedTestCompleted;
  }, [speedTestCompleted]);

  useEffect(() => {
    // Clear any existing timer first
    if (speedTestTimerRef.current) {
      clearInterval(speedTestTimerRef.current);
      speedTestTimerRef.current = null;
    }

    // Only run in Speed Test mode, when active, after countdown
    if (gameMode !== GAME_MODES.SPEED_TEST || !gameActive || countdown !== null) {
      return;
    }

    // Start timer when game becomes active
    if (speedTestStartTime === 0) {
      const startTime = Date.now();
      setSpeedTestStartTime(startTime);
      speedTestStartTimeRef.current = startTime;
      speedTestElapsedTimeRef.current = 0;
    } else {
      speedTestStartTimeRef.current = speedTestStartTime;
    }

    // OPTIMIZED: Update every 16ms (~60fps) instead of 10ms
    let lastUpdate = 0;
    speedTestTimerRef.current = setInterval(() => {
      const currentStartTime = speedTestStartTimeRef.current;
      const currentCompleted = speedTestCompletedRef.current;
      
      if (currentStartTime > 0 && !currentCompleted) {
        const elapsed = Date.now() - currentStartTime;
        speedTestElapsedTimeRef.current = elapsed;
        
        // Update state every 50ms to reduce re-renders
        const now = Date.now();
        if (now - lastUpdate >= 50) {
          if (isMountedRef.current) {
            setSpeedTestElapsedTime(elapsed);
          }
          lastUpdate = now;
          // REDUCED LOGGING: Only log every 500ms
          if (elapsed % 500 < 50) {
            console.log(`[TIMER_ST] ${(elapsed / 1000).toFixed(1)}s`);
          }
        }
      } else if (currentCompleted) {
        if (speedTestTimerRef.current) {
          clearInterval(speedTestTimerRef.current);
          speedTestTimerRef.current = null;
        }
      }
    }, 16); // 60fps update rate

    return () => {
      if (speedTestTimerRef.current) {
        clearInterval(speedTestTimerRef.current);
        speedTestTimerRef.current = null;
      }
    };
  }, [gameMode, gameActive, countdown]);

  // ✅ TASK 1: Speed Test (Time-Attack Mode) - Spawn Logic
  // 🔴 SPEED TEST STABILITY: Controlled interval, ref-based, immediate spawn after countdown
  const speedTestRemainingTargetsRef = useRef(0);
  
  useEffect(() => {
    // Clear existing spawn timer
    if (speedTestSpawnTimerRef.current) {
      clearInterval(speedTestSpawnTimerRef.current);
      speedTestSpawnTimerRef.current = null;
    }

    // Only run in Speed Test mode, when active, after countdown
    if (gameMode !== GAME_MODES.SPEED_TEST || !gameActive || screenDimensions.width === 0 || countdown !== null) {
      return;
    }

    const spawnTargets = () => {
      if (!isMountedRef.current || speedTestCompletedRef.current) {
        return;
      }
      
      // Calculate remaining using refs
      const currentHitCount = speedTestHitCountRef.current;
      const currentTargetLimit = speedTestTargetCountRef.current || speedTestTargetCount;
      const remaining = currentTargetLimit - currentHitCount;
      speedTestRemainingTargetsRef.current = remaining;
      
      // Check completion
      if (remaining <= 0) {
        if (!speedTestCompletedRef.current) {
          speedTestCompletedRef.current = true;
          
          // Clear timers
          if (speedTestTimerRef.current) {
            clearInterval(speedTestTimerRef.current);
            speedTestTimerRef.current = null;
          }
          if (speedTestSpawnTimerRef.current) {
            clearInterval(speedTestSpawnTimerRef.current);
            speedTestSpawnTimerRef.current = null;
          }
          
          // Play finish sound
          playSound('speedFinish');
          
          // Update UI
          if (isMountedRef.current) {
            setSpeedTestCompleted(true);
            setGameActive(false);
            setSpeedTestElapsedTime(speedTestElapsedTimeRef.current);
            setTimeout(() => {
              if (isMountedRef.current) {
                setSpeedTestResultsVisible(true);
                setSpeedTestCanRestart(true);
              }
            }, GAME_CONSTANTS.SPEED_TEST_RESULTS_FREEZE_MS);
          }
        }
        return;
      }
      
      // Spawn if no targets exist
      setTargets(prev => {
        if (prev.length > 0 || remaining <= 0) {
          return prev;
        }
        
        // OPTIMIZED: Spawn 1-3 targets based on remaining
        const spawnCount = remaining > 30 ? 1 : remaining > 15 ? 2 : 3;
        const targetsToSpawn = Math.min(spawnCount, remaining);
        if (targetsToSpawn > 0 && gameAreaWidth > 0 && gameAreaHeight > 0) {
          const newTargets = [];
          for (let i = 0; i < targetsToSpawn; i++) {
            const target = generateTarget(
              gameAreaWidth, 
              gameAreaHeight, 
              1, 
              gameMode, 
              currentTheme, 
              playerLevel, 
              activeBallEmoji, 
              [...prev, ...newTargets]
            );
            target.speedTestTarget = true;
            newTargets.push(target);
          }
          return [...prev, ...newTargets];
        }
        return prev;
      });
    };

    // Immediate first spawn
    spawnTargets();
    // OPTIMIZED: Check every 150ms instead of 200ms (faster response)
    speedTestSpawnTimerRef.current = setInterval(() => {
      if (speedTestRemainingTargetsRef.current > 0) {
        spawnTargets();
      }
    }, 150);

    return () => {
      if (speedTestSpawnTimerRef.current) {
        clearInterval(speedTestSpawnTimerRef.current);
        speedTestSpawnTimerRef.current = null;
      }
    };
  }, [gameMode, gameActive, countdown, screenDimensions.width, gameAreaWidth, gameAreaHeight, currentTheme, playerLevel, activeBallEmoji, speedTestTargetCount]);

  // Cleanup expired targets with mode-specific lifetime
  useEffect(() => {
    if (!gameActive) {
      // 🔴 BUG #2 FIX: Clear interval when game becomes inactive
      if (targetCleanupRef.current) {
        clearInterval(targetCleanupRef.current);
        targetCleanupRef.current = null;
      }
      return;
    }

    const targetLifetime = getTargetLifetime(gameMode, playerLevel);
    
    // 🔴 BUG #2 FIX: Capture runId at interval creation time
    const localRunId = runIdRef.current;
    
    // 🔴 BUG #2 FIX: Clear any existing interval before creating new one
    if (targetCleanupRef.current) {
      clearInterval(targetCleanupRef.current);
      targetCleanupRef.current = null;
    }

    targetCleanupRef.current = setInterval(() => {
      try {
        // 🔴 BUG #2 FIX: CRITICAL - Guard against stale callbacks from previous runs
        if (localRunId !== runIdRef.current) {
          console.warn(`⚠️ BUG #2 FIX: Stale target cleanup callback ignored (runId mismatch: ${localRunId} !== ${runIdRef.current})`);
          return;
        }
        
        // 🔴 RUSH MODE FIX: Additional guards - don't process if game is not active or is over
        // Use ref to avoid stale closure issues
        // 🔴 BUG #2 FIX: Use actual game mode for logging
        const modeTag = gameMode ? `[${gameMode.toUpperCase().replace('_', ' ')}]` : '[GAME]';
        if (!gameActive || gameOverRef.current) {
          console.log(`${modeTag} Target cleanup blocked: gameActive=${gameActive}, gameOver=${gameOverRef.current}`);
          return;
        }

      const now = Date.now();
      setTargets(prev => {
          // 🔴 BUG #2 FIX: Guard against stale state updates
          if (localRunId !== runIdRef.current) {
            console.warn(`⚠️ BUG #2 FIX: Stale setTargets callback ignored (runId mismatch)`);
            return prev; // Return previous state unchanged
          }
          
          // 🔴 BUG #2 FIX: Guard - if targets array is empty or invalid, skip processing
          if (!Array.isArray(prev) || prev.length === 0) {
            return prev;
          }
          
          const remaining = prev.filter(t => {
            // Defensive: Ensure target has required properties
            if (!t || typeof t.createdAt !== 'number') {
              return false;
            }
            return now - t.createdAt < targetLifetime;
          });
        const expired = prev.length - remaining.length;
        
        // ✅ TASK 1: Speed Test - Track misses for accuracy calculation
        if (expired > 0 && gameMode === GAME_MODES.SPEED_TEST && !speedTestCompleted) {
            setSpeedTestTargetsMissed(prevMissed => {
              // Guard against stale updates
              if (localRunId !== runIdRef.current) return prevMissed;
              return prevMissed + expired;
            });
            // 🔴 FIX: Safe call with helper function
            playSound('miss');
        }
        
        if (expired > 0 && gameMode !== GAME_MODES.ZEN && gameMode !== GAME_MODES.SPEED_TEST) {
            // 🔴 BUG #2 FIX: Only deduct health for expired normal targets, not danger points
          const expiredNormalTargets = prev.filter(t => {
              if (!t || typeof t.createdAt !== 'number') return false;
            const isExpired = now - t.createdAt >= targetLifetime;
            const isNormalTarget = !t.isDanger; // Don't penalize for expired danger points
            return isExpired && isNormalTarget;
          }).length;
          
          if (expiredNormalTargets > 0) {
              // 🔴 BUG #2 FIX: Check revive protection window - ignore expired targets during grace period
              // Use the same 'now' variable from outer scope (captured at interval callback start)
              const inReviveProtectionWindow = reviveProtectionUntilRef.current && now < reviveProtectionUntilRef.current;
              
              if (inReviveProtectionWindow) {
                // During revive protection window, ignore expired targets from old run
                console.log(`🛡️ REVIVE DEBUG - Ignoring ${expiredNormalTargets} expired targets during revive protection window`);
                // Still remove expired targets from array, but don't reduce health
                // (The return remaining below will handle removing them)
              } else {
                // 🔴 RUSH MODE FIX: Normal gameplay - expired targets reduce health using safe update
                // 🔴 BUG #2 FIX: Use actual game mode for logging
                const modeTag = gameMode ? `[${gameMode.toUpperCase().replace('_', ' ')}]` : '[GAME]';
                const healthUpdated = updateHealthSafe(-expiredNormalTargets, `expired_targets_${expiredNormalTargets}`, localRunId);
                if (healthUpdated) {
                  console.log(`${modeTag} Target expired, health--, expiredCount=${expiredNormalTargets}, runId=${localRunId}`);
            setCombo(0);
                  // 🔴 FIX: Safe call - resetSpeed might not return a Promise
                  try {
                    const resetResult = musicManager.resetSpeed();
                    if (resetResult && typeof resetResult.catch === 'function') {
                      resetResult.catch(() => {});
                    }
                  } catch (err) {
                    console.warn('⚠️ Error resetting music speed:', err);
                  }
                  // 🔴 FIX: Safe call with helper function
                  playSound('miss');
            triggerHaptic('error');
                } else {
                  // 🔴 BUG #2 FIX: Use actual game mode for logging
                  const modeTag = gameMode ? `[${gameMode.toUpperCase().replace('_', ' ')}]` : '[GAME]';
                  console.log(`${modeTag} Blocked stale callback (old run) - expiredCount=${expiredNormalTargets}, localRunId=${localRunId}, currentRunId=${runIdRef.current}`);
                }
              }
          }
        }
        
        return remaining;
      });
      } catch (error) {
        console.error('❌ BUG #2 FIX: Error in target cleanup interval:', error);
        // Don't throw - just log and continue
      }
    }, 100);

    return () => {
      try {
        if (targetCleanupRef.current) {
          clearInterval(targetCleanupRef.current);
          targetCleanupRef.current = null;
        }
      } catch (error) {
        console.warn('⚠️ Error clearing target cleanup interval:', error);
      }
    };
  }, [gameActive, gameMode, speedTestCompleted, gameOver]);

  // Game timer with mode-specific duration
  // CRITICAL FIX: Speed Test has NO time limit - exclude from timer
  useEffect(() => {
    if (!gameActive) return;
    // CRITICAL FIX: Speed Test mode has no time limit - timer only for Classic/Rush/Zen
    if (gameMode === GAME_MODES.SPEED_TEST) return;

    // ✅ FIX #1: Timer ONLY ticks - no game over logic here
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [gameActive, gameMode]);

  // ✅ FIX #1: NEW useEffect - Watch timeLeft to trigger Game Over with FRESH state
  useEffect(() => {
    if (gameMode !== GAME_MODES.SPEED_TEST && gameActive && timeLeft <= 0) {
      console.log('⏰ TIME UP! Triggering Game Over with Score:', score);
      
      // Check if player won (has health) or lost (no health)
      setHealth(currentHealth => {
        if (currentHealth > 0) {
          setGameWon(true); // Player won - survived until time ran out
        } else {
          setGameWon(false); // Player lost - no health left
        }
        return currentHealth; // Don't change health, just read it
      });
      
      setGameActive(false);
      // CRITICAL FIX: Directly call handleGameOver for time-up scenarios
      // The effect at line 1440 only handles health-based game over (losses)
      // We must call handleGameOver directly here for victories (time runs out with health > 0)
      if (!gameOverRef.current && !gameOver) {
        // Use ref to call handleGameOver (it's defined later, so we use ref pattern)
        if (handleGameOverRef.current) {
          handleGameOverRef.current();
        } else {
          // If ref not set yet, use setTimeout to call it on next tick
          setTimeout(() => {
            if (handleGameOverRef.current && !gameOverRef.current) {
              handleGameOverRef.current();
            }
          }, 0);
        }
      }
    }
  }, [timeLeft, gameActive, gameMode, score, gameOver]); // ✅ Added gameOver to deps

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

  // 🔴 BUG #2 FIX: Health check - offer revive (disabled for Speed Test mode)
  useEffect(() => {
    // Speed Test mode has no health system
    if (gameMode === GAME_MODES.SPEED_TEST) return;
    
    // 🔴 BUG #2 FIX: Only check for game over if game is active and health is actually 0
    // Don't check if revive option is already showing (prevents duplicate triggers)
    if (health <= 0 && gameActive && !hasRevived && !showReviveOption) {
      console.log('💔 HEALTH CHECK - Health depleted, showing revive option');
      console.log('  Health:', health);
      console.log('  Game Active:', gameActive);
      console.log('  Has Revived:', hasRevived);
      setGameWon(false); // Player lost - health depleted
      setGameActive(false);
      setShowReviveOption(true);
    } else if (health <= 0 && hasRevived && gameActive && !showReviveOption) {
      // 🔴 BUG #2 FIX: Only trigger game over if player has already revived and health is 0 again
      // This means player used their 2 revive lives and died again
      // BUT: Check if we're in revive protection window - if so, ignore this
      const inReviveProtectionWindow = reviveProtectionUntilRef.current && Date.now() < reviveProtectionUntilRef.current;
      if (!inReviveProtectionWindow) {
        console.log('💔 HEALTH CHECK - Health depleted after revive, final game over');
      setGameWon(false); // Player lost after revive
      setGameActive(false);
      } else {
        console.log('🛡️ HEALTH CHECK - Ignoring health=0 during revive protection window');
      }
    } else if (health > 0 && hasRevived && !gameActive && showReviveOption) {
      // 🔴 BUG #2 FIX: If health is restored (revived) but game is not active, clear the revive option
      // This happens when revive succeeds and we're waiting to resume
      console.log('✅ HEALTH CHECK - Health restored after revive, clearing revive option');
      setShowReviveOption(false);
    }
  }, [health, gameActive, hasRevived, gameMode, showReviveOption]);

  // 🔴 RUSH MODE FIX: Game over - don't trigger if revive is in progress
  useEffect(() => {
    // 🔴 KRİTİK DÜZELTME: Speed Test only triggers game over when COMPLETED, not when inactive
    // Countdown bitince gameActive=false olabilir ama oyun henüz başlamamıştır
    // Sadece speedTestCompleted=true olduğunda (30 hedef vurulduğunda) game over olmalı
    if (gameMode === GAME_MODES.SPEED_TEST && speedTestCompleted && !gameOverRef.current) {
      handleGameOver();
      return;
    }
    
    // 🔴 RUSH MODE FIX: If gameOver is already true, don't process again
    if (gameOverRef.current || gameOver) {
      return;
    }
    
    // 🔴 RUSH MODE FIX: Don't trigger game over if:
    // 1. Revive option is showing (player deciding to revive)
    // 2. Player just revived (hasRevived=true) and health > 0 (revive successful, waiting to resume)
    // 3. In revive protection window (grace period after revive)
    // 4. Game is still active (health might be 0 but game hasn't stopped yet)
    const inReviveProtectionWindow = reviveProtectionUntilRef.current && Date.now() < reviveProtectionUntilRef.current;
    const justRevived = hasRevived && health > 0;
    
    // 🔴 RUSH MODE FIX: Only trigger game over if ALL conditions are met
    // For Rush Mode: health must be 0, game must be inactive, and no revive in progress
    // 🔴 BUG #2 FIX: Use actual game mode for logging
    const modeTag = gameMode ? `[${gameMode.toUpperCase().replace('_', ' ')}]` : '[GAME]';
    if (health <= 0 && !gameActive && !showReviveOption && !justRevived && !inReviveProtectionWindow) {
      console.log(`${modeTag} Game Over triggered - health=${health}, gameActive=${gameActive}, hasRevived=${hasRevived}, showReviveOption=${showReviveOption}, inProtectionWindow=${inReviveProtectionWindow}`);
      handleGameOver();
    } else if (health <= 0 && gameActive) {
      // Health is 0 but game is still active - this should trigger revive option, not game over
      console.log(`${modeTag} Health is 0 but game is active - waiting for revive option logic`);
    } else if (health <= 0 && !gameActive) {
      // Log why game over was blocked
      console.log(`${modeTag} Game Over blocked - health=${health}, gameActive=${gameActive}, showReviveOption=${showReviveOption}, justRevived=${justRevived}, inProtectionWindow=${inReviveProtectionWindow}`);
    }
  }, [gameActive, gameOver, showReviveOption, hasRevived, health, gameMode, timeLeft, speedTestCompleted]); // 🔴 FIX: Added speedTestCompleted to deps

  // ✅ B1: finalizeRun - Single function for XP/coin/stats processing
  const hasFinalizedRef = useRef(false);
  
  const finalizeRun = useCallback(
    async ({ xpEarned, coinsEarned, gameStats }) => {
      if (hasFinalizedRef.current) {
        console.log('⏭️ finalizeRun already called, skipping');
        return;
      }
      hasFinalizedRef.current = true;

      try {
        // Get old level for level up sound
        const oldTotalXp = playerData?.totalXp || 0;
        const oldLevel = getLevelFromXP(oldTotalXp);

        // 1) XP → ONLY Classic and Rush modes (NEVER write to AsyncStorage directly)
        // CRITICAL FIX: XP only in Classic/Rush (not Zen, not Speed Test)
        const isXpMode = gameMode === GAME_MODES.CLASSIC || gameMode === GAME_MODES.RUSH;
        
        if (isXpMode && xpEarned > 0 && typeof addXP === 'function') {
          const success = await addXP(xpEarned);
          if (success) {
            console.log(`✅ XP added: ${xpEarned}`);
            
            // Check for level up after XP is added
            const newTotalXp = oldTotalXp + xpEarned;
            const newLevel = getLevelFromXP(newTotalXp);
            if (newLevel > oldLevel) {
              playSound('levelUp');
              console.log(`🎉 Level Up! ${oldLevel} → ${newLevel}`);
            }
          } else {
            console.error(`❌ Failed to add XP: ${xpEarned}`);
          }
        }

        // 2) Coins
        if (coinsEarned > 0 && typeof addCoins === 'function') {
          await addCoins(coinsEarned);
          console.log(`✅ Coins added: ${coinsEarned}`);
        }

        // 3) Global playerData istatistik patch'i
        // CRITICAL FIX: Only update stats, never touch totalXp/currentXp/level
        // These are managed exclusively by addXP/addCoins
        const patch = {
          gamesPlayed: (playerData?.gamesPlayed || 0) + 1,
          lastUpdated: Date.now(),
        };

        if (gameMode === GAME_MODES.CLASSIC) {
          patch.gamesPlayedClassic = (playerData?.gamesPlayedClassic || 0) + 1;
        } else if (gameMode === GAME_MODES.RUSH) {
          patch.gamesPlayedRush = (playerData?.gamesPlayedRush || 0) + 1;
        } else if (gameMode === GAME_MODES.ZEN) {
          patch.gamesPlayedZen = (playerData?.gamesPlayedZen || 0) + 1;
        } else if (gameMode === GAME_MODES.SPEED_TEST) {
          patch.gamesPlayedSpeedTest = (playerData?.gamesPlayedSpeedTest || 0) + 1;
        }

        // CRITICAL FIX: Update stats AFTER XP/coins are saved
        // This ensures XP is already persisted before stats update
        if (typeof updatePlayerData === 'function') {
          await updatePlayerData(patch);
        }
        
        // Refresh context to update UI AFTER all saves are complete
        if (refreshPlayerData && typeof refreshPlayerData === 'function') {
          await refreshPlayerData();
        }

        // 4) ProgressTracker için oturum kaydı
        try {
          if (progressTracker && typeof progressTracker.recordGameSession === 'function') {
            progressTracker.recordGameSession({
              mode: gameMode,
              score,
              maxCombo,
              xpEarned: isXpMode ? xpEarned : 0,
              coinsEarned: coinsEarned,
            });
          }
        } catch (trackerError) {
          console.warn('[ProgressTracker] recordGameSession failed', trackerError);
        }
      } catch (err) {
        console.error('❌ finalizeRun failed', err);
      }
    },
    [gameMode, playerData, addXP, addCoins, updatePlayerData, refreshPlayerData, score, maxCombo]
  );

  const handleGameOver = useCallback(async () => {
    // Prevent duplicate calls
    if (gameOverRef.current || gameOver) return;

    // CRITICAL FIX: Use refs to get latest values (prevents stale state issues)
    const finalScore = scoreRef.current;
    const finalHealth = healthRef.current;
    const finalMaxCombo = maxComboRef.current;

    console.log(`🏁 GAME OVER: ${gameMode} | Score: ${finalScore} | Health: ${finalHealth} | Combo: ${finalMaxCombo}`);
    gameOverRef.current = true;
    setGameOver(true);
    hasFinalizedRef.current = false; // ✅ B1: Reset finalization flag for new game

    playSound('gameOver');
    
    // --- 1. CALCULATE REWARDS ---
    // Win Condition: Speed Test Completed OR Health > 0 (Classic/Rush)
    const isVictory = (gameMode === GAME_MODES.SPEED_TEST && speedTestCompleted) || finalHealth > 0;

    // AAA XP SYSTEM: Score-based rewards with win/loss modifiers
    // CRITICAL FIX: XP only in Classic and Rush modes (not Zen, not Speed Test)
    let xpEarned = 0;
    let coinsEarned = 0;

    if (gameMode === GAME_MODES.SPEED_TEST) {
      // Speed Test: NO XP/Coins (leaderboard only)
      xpEarned = 0;
      coinsEarned = 0;
    } else if (gameMode === GAME_MODES.CLASSIC || gameMode === GAME_MODES.RUSH) {
      // Base XP from score (1 XP per 10 points)
      const baseXP = Math.floor(finalScore / 10);
      
      // Combo bonus (up to +50% XP)
      const comboBonus = Math.min(finalMaxCombo * 0.5, baseXP * 0.5);
      
      // Victory/Loss modifier
      if (isVictory) {
        // WIN: Full XP + 50% victory bonus (all XP earned)
        xpEarned = Math.floor(baseXP + comboBonus + (baseXP * 0.5));
        // Ensure minimum XP for wins (at least 1 XP per point if score > 0)
        if (finalScore > 0 && xpEarned === 0) {
          xpEarned = Math.max(1, Math.floor(finalScore / 10));
        }
        coinsEarned = Math.floor(finalScore / 50) + Math.floor(finalMaxCombo / 5);
      } else {
        // LOSS: Small consolation XP (20% of base, minimum 10)
        xpEarned = Math.max(10, Math.floor(baseXP * 0.2));
        coinsEarned = 0;
      }
    }
    // Zen mode: NO XP (as per user requirement - XP only in Classic/Rush)

    console.log(`💎 XP CALCULATION: score=${finalScore}, combo=${finalMaxCombo}, health=${finalHealth}, win=${isVictory}, xp=${xpEarned}, coins=${coinsEarned}`);

    setEarnedXP(xpEarned);
    setEarnedCoins(coinsEarned);

    // --- 2. FINALIZE RUN (XP/Coins/Stats) ---
    // CRITICAL FIX: Only finalize immediately if NOT showing double reward screen
    // If victory with rewards, wait for user to choose Skip or Watch Ad
    const shouldShowDoubleReward = isVictory && (xpEarned > 0 || coinsEarned > 0) && (gameMode === GAME_MODES.CLASSIC || gameMode === GAME_MODES.RUSH);
    
    if (!shouldShowDoubleReward) {
      // Loss or no rewards: Finalize immediately (no double reward option)
      await finalizeRun({ 
        xpEarned, 
        coinsEarned, 
        gameStats: { score: finalScore, maxCombo: finalMaxCombo, isVictory } 
      });
    }
    // If shouldShowDoubleReward is true, finalizeRun will be called in handleSkipAd or handleDoubleReward

    // --- 3. UPDATE DETAILED STATS (AsyncStorage @player_stats) ---
    try {
      const statsKey = '@player_stats';
      const statsJson = await AsyncStorage.getItem(statsKey);
      const stats = statsJson ? JSON.parse(statsJson) : {};

      // ✅ FIX #5: Increment Total Games
      stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;

      // ✅ FIX #5: Increment MODE SPECIFIC Games (CRITICAL FIX)
      if (gameMode === GAME_MODES.CLASSIC) stats.gamesPlayedClassic = (stats.gamesPlayedClassic || 0) + 1;
      else if (gameMode === GAME_MODES.RUSH) stats.gamesPlayedRush = (stats.gamesPlayedRush || 0) + 1;
      else if (gameMode === GAME_MODES.ZEN) stats.gamesPlayedZen = (stats.gamesPlayedZen || 0) + 1;
      else if (gameMode === GAME_MODES.SPEED_TEST) stats.gamesPlayedSpeedTest = (stats.gamesPlayedSpeedTest || 0) + 1;

      // Update High Scores
      if (gameMode === GAME_MODES.CLASSIC) stats.highScoreClassic = Math.max(stats.highScoreClassic || 0, score);
      if (gameMode === GAME_MODES.RUSH) stats.highScoreRush = Math.max(stats.highScoreRush || 0, score);
      if (gameMode === GAME_MODES.ZEN) stats.highScoreZen = Math.max(stats.highScoreZen || 0, score);

      // Update Totals
      stats.totalPlaytime = (stats.totalPlaytime || 0) + (getGameDuration(gameMode) - timeLeft);
      stats.maxCombo = Math.max(stats.maxCombo || 0, maxCombo);

      await AsyncStorage.setItem(statsKey, JSON.stringify(stats));
      console.log('📊 STATS UPDATED:', stats);
    } catch (err) {
      console.error('Stats Update Failed:', err);
    }

    // --- 4. UPDATE LEADERBOARD (Fixes "Speed Test Missing" bug) ---
    try {
        if (gameMode === GAME_MODES.SPEED_TEST && isVictory) {
            // 🔴 BUG #2 FIX: Include targetCount and time in Speed Test leaderboard entry
            const targetCount = speedTestTargetCountRef.current || speedTestTargetCount;
            const timeInSeconds = speedTestElapsedTimeRef.current / 1000; // Convert MS to seconds
            await leaderboardManager.addScore(GAME_MODES.SPEED_TEST, {
                score: 0, // Not used for Speed Test
                time: timeInSeconds, // Time in seconds (lower is better)
                targetCount: targetCount, // Store actual target count
                combo: 0,
                timestamp: Date.now(),
                playerName: 'Player' // Or fetch real name
            });
            console.log(`🏆 SPEED TEST SCORE SUBMITTED: ${timeInSeconds.toFixed(3)}s (${targetCount} targets)`);
        } else if (score > 0 && (gameMode === GAME_MODES.CLASSIC || gameMode === GAME_MODES.RUSH)) {
            await leaderboardManager.addScore(gameMode, {
                score: score,
                combo: maxCombo,
                timestamp: Date.now(),
                playerName: 'Player'
            });
        }
    } catch (err) {
        console.error('Leaderboard Submit Failed:', err);
    }

    // --- 5. SHOW RESULTS ---
    if (gameMode === GAME_MODES.SPEED_TEST) {
        // Speed test has its own result modal logic driven by useEffect
    } else {
        // Show standard double reward / game over modal
        // CRITICAL FIX: Use same condition as shouldShowDoubleReward to ensure consistency
        if (shouldShowDoubleReward) {
            setShowDoubleReward(true);
        } else if (!showReviveOption && !hasRevived) {
            // Only show revive if we haven't used it
             setShowReviveOption(true);
        }
    }
  }, [gameMode, speedTestCompleted, finalizeRun, showReviveOption, hasRevived, gameOver]);

  // CRITICAL FIX: Sync handleGameOver to ref so it can be called from useEffect that runs before it's defined
  useEffect(() => {
    handleGameOverRef.current = handleGameOver;
  }, [handleGameOver]);

  // 🔴 BUG #2 FIX: Safe function to start a new game run with runId isolation
  const startNewRun = useCallback((initialHealth) => {
    try {
      // Increment runId to invalidate all previous callbacks
      runIdRef.current = (runIdRef.current || 0) + 1;
      const newRunId = runIdRef.current;
      console.log(`🔄 BUG #2 FIX: Starting new run with runId=${newRunId}, health=${initialHealth}`);
      
      // Safely clear all timers with null checks
      try {
        if (targetCleanupRef.current) {
          clearInterval(targetCleanupRef.current);
          targetCleanupRef.current = null;
        }
        if (spawnTimerRef.current) {
          clearInterval(spawnTimerRef.current);
          spawnTimerRef.current = null;
        }
        if (zenSpawnTimerRef.current) {
          clearInterval(zenSpawnTimerRef.current);
          zenSpawnTimerRef.current = null;
        }
        if (gameTimerRef.current) {
          clearInterval(gameTimerRef.current);
          gameTimerRef.current = null;
        }
        if (powerBarTimerRef.current) {
          clearInterval(powerBarTimerRef.current);
          powerBarTimerRef.current = null;
        }
        if (powerBarActiveTimerRef.current) {
          clearTimeout(powerBarActiveTimerRef.current);
          powerBarActiveTimerRef.current = null;
        }
      } catch (timerError) {
        console.warn('⚠️ Error clearing timers during revive:', timerError);
      }
      
      // Clear all existing targets - they belong to the old run
      setTargets([]);
      
      // 🔴 BUG #2 FIX: Do NOT clear protection window here - it's set in handleRevive and should persist
      // Only clear it if this is a fresh game start (not a revive)
      if (initialHealth !== 2) {
        reviveProtectionUntilRef.current = null;
      }
      
      // Reset game state
      gameOverRef.current = false; // 🔴 RUSH MODE FIX: Reset ref
      setGameOver(false);
      setShowReviveOption(false);
      setHealth(initialHealth);
      setHasRevived(true);
      
      console.log(`✅ BUG #2 FIX: New run ${newRunId} initialized - timers cleared, targets cleared, health=${initialHealth}`);
      return newRunId;
    } catch (error) {
      console.error('❌ BUG #2 FIX: Error in startNewRun:', error);
      // Still increment runId even on error to prevent stale callbacks
      runIdRef.current = (runIdRef.current || 0) + 1;
      return runIdRef.current;
    }
  }, []);

  // 🔴 BUG #2 FIX: Rush mode revive - properly restore 2 lives and resume gameplay
  const handleRevive = async () => {
    try {
      console.log('🔄 REVIVE - Starting revive process...');
      console.log('  Current health:', health);
      console.log('  Current gameActive:', gameActive);
      console.log('  Current gameOver:', gameOver);
      console.log('  Current showReviveOption:', showReviveOption);
      console.log('  Current hasRevived:', hasRevived);
      console.log('  Current targets on screen:', targets.length);
      console.log('  Current runId:', runIdRef.current);
      
    const result = await adService.showRewardedAd('revive');
      if (result && result.success) {
        console.log('✅ REVIVE - Ad watched successfully, granting 2 lives');
        
        // 🔴 BUG #2 FIX: Set revive protection window FIRST, before any state changes
        // This ensures the protection window is active before game over effect can trigger
        const protectionEndTime = Date.now() + REVIVE_PROTECTION_DURATION_MS;
        reviveProtectionUntilRef.current = protectionEndTime;
        console.log('🛡️ REVIVE DEBUG - Protection window set until', new Date(protectionEndTime).toISOString());
        
        // 🔴 BUG #2 FIX: Ensure gameOver is false BEFORE starting new run (defensive)
        setGameOver(false);
        
        // 🔴 BUG #2 FIX: Start new run with runId isolation
        const newRunId = startNewRun(2);
        
        // 🔴 BUG #2 FIX: Extended delay to ensure ALL pending callbacks are cleared
        // This prevents race conditions where old expired-target callbacks might still fire
        setTimeout(() => {
          // Guard: Verify runId hasn't changed (another revive happened)
          if (runIdRef.current === newRunId) {
            // 🔴 BUG #2 FIX: Double-check that target cleanup interval is still cleared
            if (targetCleanupRef.current) {
              clearInterval(targetCleanupRef.current);
              targetCleanupRef.current = null;
            }
            
            // 🔴 RUSH MODE FIX: Ensure gameOver is false before resuming (defensive check)
            gameOverRef.current = false;
            setGameOver(false);
            
            // 🔴 BUG #2 FIX: Set gameActive to true to resume gameplay
      setGameActive(true);
            
            // 🔴 CRITICAL FIX: Restart game timer for Rush/Classic modes after revive
            if (gameMode === GAME_MODES.RUSH || gameMode === GAME_MODES.CLASSIC || gameMode === GAME_MODES.ZEN) {
              // Clear any existing timer
              if (gameTimerRef.current) {
                clearInterval(gameTimerRef.current);
                gameTimerRef.current = null;
              }
              
              // Restart timer if time is remaining
              if (timeLeft > 0) {
                gameTimerRef.current = setInterval(() => {
                  setTimeLeft(prev => {
                    if (prev <= 1) {
                      // Time ran out - check if player won (has health) or lost (no health)
                      setHealth(currentHealth => {
                        if (currentHealth > 0) {
                          setGameWon(true);
                        } else {
                          setGameWon(false);
                        }
                        return currentHealth;
                      });
                      setGameActive(false);
                      gameOverRef.current = true;
                      setGameOver(true);
                      return 0;
                    }
                    return prev - 1;
                  });
                }, 1000);
                console.log('✅ REVIVE - Game timer restarted, time remaining:', timeLeft);
              }
            }
            
            // 🔴 BUG FIX: Immediately spawn first batch of targets after revive
            // Don't wait for the spawn interval - spawn targets right away
            setTimeout(() => {
              if (runIdRef.current === newRunId) {
                try {
                  const { getSpawnInterval, getMaxSimultaneousTargets } = require('../utils/GameLogic');
                  const spawnInterval = getSpawnInterval(difficulty, gameMode, playerLevel);
                  const maxTargets = getMaxSimultaneousTargets(difficulty, playerLevel, gameMode);
                  
                  setTargets(prev => {
                    const currentActiveTargets = prev.length;
                    const availableSlots = maxTargets - currentActiveTargets;
                    
                    if (availableSlots <= 0) {
                      return prev;
                    }
                    
                    // Spawn initial batch after revive
                    let batchSize = 1;
                    if (gameMode === GAME_MODES.RUSH) {
                      batchSize = Math.min(2, availableSlots);
                    }
                    
                    const newTargets = [];
                    for (let i = 0; i < Math.min(batchSize, availableSlots); i++) {
                      const newTarget = generateTarget(
                        gameAreaWidth,
                        gameAreaHeight,
                        difficulty,
                        gameMode,
                        currentTheme,
                        playerLevel,
                        activeBallEmoji,
                        [...prev, ...newTargets]
                      );
                      newTargets.push(newTarget);
                    }
                    
                    if (newTargets.length > 0) {
                      console.log(`🎯 REVIVE - Spawned ${newTargets.length} targets immediately after revive`);
                    }
                    return [...prev, ...newTargets];
                  });
                } catch (error) {
                  console.warn('⚠️ Error spawning targets after revive:', error);
                }
              }
            }, 100); // Small delay to ensure gameActive state is set and spawn effect is ready
            
            console.log(`✅ REVIVE - Game resumed with 2 lives (runId=${newRunId})`);
            console.log('  New health:', 2);
            console.log('  New gameActive:', true);
            console.log('  New gameOver:', false);
            console.log('  Targets cleared, interval cleared - ready for fresh gameplay');
            console.log('  Protection window active until:', new Date(reviveProtectionUntilRef.current).toISOString());
          } else {
            console.warn(`⚠️ REVIVE - RunId changed during revive (${newRunId} → ${runIdRef.current}), skipping resume`);
          }
        }, 250); // 🔴 BUG #2 FIX: Increased delay to 250ms to ensure all state updates and effects complete
        
      analytics.logRewardClaim('revive', 2);
      } else {
        console.log('❌ REVIVE - Ad not watched, revive cancelled');
      }
    } catch (error) {
      console.error('❌ REVIVE - Error during revive process:', error);
      // Still increment runId to prevent stale callbacks
      runIdRef.current = (runIdRef.current || 0) + 1;
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
      
      playSound('success');
      console.log('✅ Score shared successfully');
    } catch (error) {
      console.error('❌ Error sharing score:', error);
    }
  };

  // ✅ B1: saveProgress REMOVED - Use finalizeRun instead
  // XP and level updates should ONLY go through addXP/addCoins (GlobalStateContext)
  // NEVER write directly to AsyncStorage for player data

  /**
   * Handle double reward ad watch
   * Doubles XP and coins earned
   */
  const handleDoubleReward = async () => {
    // ✅ FIX: Sadece Classic/Rush için double reward göster
    if (gameMode !== GAME_MODES.CLASSIC && gameMode !== GAME_MODES.RUSH) {
      console.warn('[XP] Double reward blocked: not Classic/Rush mode');
      setShowDoubleReward(false);
      return;
    }

    const result = await adService.showRewardedAd('double_reward');
    if (result.success) {
      const finalXP = earnedXP * 2;
      const finalCoins = earnedCoins * 2;
      setEarnedXP(finalXP);
      setEarnedCoins(finalCoins);
      setShowDoubleReward(false);
      // CRITICAL FIX: Only finalize if not already finalized (prevent double processing)
      if (gameMode === GAME_MODES.CLASSIC || gameMode === GAME_MODES.RUSH) {
        if (!hasFinalizedRef.current) {
          await finalizeRun({ 
            xpEarned: finalXP, 
            coinsEarned: finalCoins, 
            gameStats: { score, maxCombo, isVictory: true } 
          });
          analytics.logRewardClaim('double_reward', finalCoins);
        } else {
          console.warn('⚠️ Double reward: Already finalized, skipping duplicate call');
        }
      }
    }
  };

  /**
   * Handle skip double reward ad
   * Immediately shows Play Again / Main Menu buttons
   * Saves progress with normal rewards (no doubling)
   */
  const handleSkipAd = useCallback(() => {
    setShowDoubleReward(false);
    // CRITICAL FIX: Only finalize if not already finalized (prevent double processing)
    if (gameMode === GAME_MODES.CLASSIC || gameMode === GAME_MODES.RUSH) {
      if (!hasFinalizedRef.current) {
        finalizeRun({ 
          xpEarned: earnedXP, 
          coinsEarned: earnedCoins, 
          gameStats: { score, maxCombo, isVictory: true } 
        });
      } else {
        console.warn('⚠️ Skip ad: Already finalized, skipping duplicate call');
      }
    }
  }, [earnedXP, earnedCoins, finalizeRun, gameMode, score, maxCombo]);

  const handlePlayAgain = () => {
    // 🔴 RUSH MODE FIX: Reset game over ref
    gameOverRef.current = false;
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
    setGameWon(false);
    setHasRevived(false);
    setDifficulty(1);
    
    // ✅ TASK 1: Reset Speed Test state
    if (gameMode === GAME_MODES.SPEED_TEST) {
      setSpeedTestStartTime(0);
      setSpeedTestElapsedTime(0);
      setSpeedTestTargetsHit(0);
      setSpeedTestTargetsMissed(0);
      setSpeedTestCompleted(false);
      setSpeedTestResultsVisible(false);
      setSpeedTestCanRestart(false);
      speedTestHitCountRef.current = 0;
      speedTestElapsedTimeRef.current = 0;
      speedTestTargetsLengthRef.current = 0; // 🔴 CRITICAL FIX: Reset targets length ref
      speedTestCompletedRef.current = false; // 🔴 CRITICAL FIX: Reset completion ref
      speedTestStartTimeRef.current = null; // 🔴 CRITICAL FIX: Reset start time ref
      // CRITICAL FIX: Reset countdown for Speed Test (allow re-initialization)
      speedTestInitializedRef.current = false;
      setCountdown(3);
      setGameActive(false); // Don't start until countdown completes
      console.log('✅ Speed Test: Play Again - Countdown reset to 3, all refs cleared');
    } else {
      setGameActive(true);
    }
    
    if (musicManager.currentTrack !== 'game' || !musicManager.isPlaying) {
      musicManager.playGameplayMusic().catch(() => {});
    }
    setEarnedXP(0);
    setEarnedCoins(0);
    setPowerBar(0);
    setPowerBarActive(false);
    setRushComboMultiplier(1);
    
    // 🔴 CRITICAL FIX: Clear any existing timers (already done above, but ensure cleanup)
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (zenSpawnTimerRef.current) clearInterval(zenSpawnTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (targetCleanupRef.current) clearInterval(targetCleanupRef.current);
    if (powerBarTimerRef.current) clearTimeout(powerBarTimerRef.current);
    if (powerBarActiveTimerRef.current) clearTimeout(powerBarActiveTimerRef.current);
    if (speedTestTimerRef.current) clearInterval(speedTestTimerRef.current);
    if (speedTestSpawnTimerRef.current) clearInterval(speedTestSpawnTimerRef.current);
  };

  /**
   * Navigate to main menu with COMPLETE state reset
   * REFLEXION FIX: Clear ALL timers, stop audio, reset ALL state
   */
  const handleMainMenu = useCallback(async () => {
    try {
      const { soundManager } = require('../services/SoundManager');
      soundManager.stopAll();
      await musicManager.stopAll();
      if (soundManager.isInitialized()) {
        await musicManager.playMenuMusic();
      }
    } catch (e) {
    }

    // Clear ALL timers (critical bug fix)
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }
    if (zenSpawnTimerRef.current) {
      clearInterval(zenSpawnTimerRef.current);
      zenSpawnTimerRef.current = null;
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
    if (speedTestTimerRef.current) {
      clearInterval(speedTestTimerRef.current);
      speedTestTimerRef.current = null;
    }
    if (speedTestSpawnTimerRef.current) {
      clearInterval(speedTestSpawnTimerRef.current);
      speedTestSpawnTimerRef.current = null;
    }
    
    // 🔴 CRITICAL FIX: Reset Speed Test refs
    speedTestTargetsLengthRef.current = 0;
    speedTestStartTimeRef.current = null;
    speedTestCompletedRef.current = false;
    speedTestHitCountRef.current = 0;
    speedTestElapsedTimeRef.current = 0;

    // Reset ALL game state variables
    gameOverRef.current = false; // 🔴 RUSH MODE FIX: Reset ref
    setGameOver(false);
    setGameWon(false);
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
  // === HAPTIC PATCH START ===
  // ✅ FIX: Safe haptic feedback calls with proper intensity mapping
  const triggerHaptic = useCallback((type = 'medium') => {
    try {
      // Safe check before calling getHapticsEnabled
      const hapticsEnabled = settingsService && typeof settingsService.getHapticsEnabled === 'function' 
        ? settingsService.getHapticsEnabled() 
        : true;
      
      if (!hapticsEnabled) {
        console.log(`[HAPTIC] trigger blocked - vibration disabled, type=${type}`);
        return;
      }
      
      // Fire-and-forget: never block tap performance with await
      (async () => {
        try {
      if (type === 'light') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            console.log(`[HAPTIC] trigger light`);
      } else if (type === 'medium') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            console.log(`[HAPTIC] trigger medium`);
      } else if (type === 'heavy') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            console.log(`[HAPTIC] trigger heavy`);
      } else if (type === 'error') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.log(`[HAPTIC] trigger error`);
      } else if (type === 'success') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            console.log(`[HAPTIC] trigger success`);
      }
    } catch (error) {
      console.warn('⚠️ Haptic feedback failed:', error);
        }
      })();
    } catch (error) {
      console.warn('⚠️ Haptic feedback setup failed:', error);
    }
  }, []);
  // === HAPTIC PATCH END ===

  const triggerCameraShake = useCallback(() => {
    const intensity = COMBO_ANIMATION_CONFIG.CAMERA_SHAKE_INTENSITY;
    const segmentDuration = COMBO_ANIMATION_CONFIG.CAMERA_SHAKE_DURATION / 4;
    
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: intensity,
        duration: segmentDuration,
        easing: ANIMATION_EASING.EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -intensity,
        duration: segmentDuration,
        easing: ANIMATION_EASING.EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: intensity,
        duration: segmentDuration,
        easing: ANIMATION_EASING.EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: segmentDuration,
        easing: ANIMATION_EASING.EASE_IN,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shakeAnim]);

  /**
   * Merkezi hit registration - TÜM başarılı tap'lar buradan geçer
   * @param {Object} target - Vurulan target
   * @param {Object} hitConfig - Hit yapılandırması (ses, animasyon, progress)
   */
  const registerHit = useCallback((target, hitConfig = {}) => {
    const {
      playSound = true,
      soundType = 'tap',
      createParticles = true,
      particleCount = 10,
      particleColor = null,
      particleEmoji = activeParticleEmoji,
      updateProgress = true,
      progressDelta = 1,
      updateScore = true,
      scoreDelta = 10,
      updateCombo = true,
      showFloatingText = true,
      floatingTextValue = null,
      floatingTextColor = null,
    } = hitConfig;

    console.log(`[HIT] Registered hit for target ${target.id}`, hitConfig);

    // 1️⃣ SES: Her zaman çal (playSound=true ise)
    if (playSound) {
      try {
        if (soundType === 'tap') {
          playSound('tap');
        } else if (soundType === 'lucky') {
          playSound('luckyTap');
        } else if (soundType === 'miss') {
          playSound('miss');
        } else {
          playSound(soundType);
        }
        console.log(`[HIT] Sound played: ${soundType}`);
      } catch (error) {
        console.warn('⚠️ Sound playback failed:', error);
      }
    }

    // 2️⃣ VFX/ANIMASYON: Particle'lar oluştur
    if (createParticles && isMountedRef.current) {
      const particles = Array.from({ length: particleCount }, (_, i) => ({
        id: `particle-${Date.now()}-${i}`,
        x: target.x + target.size / 2,
        y: target.y + target.size / 2,
        color: particleColor || currentTheme.particleColors[i % currentTheme.particleColors.length] || target.color,
        emoji: particleEmoji || null,
      }));
      setParticles(prev => [...prev, ...particles]);
      console.log(`[HIT] Particles created: ${particleCount}`);
    }

    // 3️⃣ FLOATING TEXT: Skor/bonus göster
    if (showFloatingText && isMountedRef.current) {
      const floatingText = {
        id: `float-${Date.now()}`,
        x: target.x + target.size / 2 - 20,
        y: target.y,
        text: floatingTextValue || `+${scoreDelta}`,
        color: floatingTextColor || currentTheme?.primaryColor || '#4ECDC4',
        isBonus: floatingTextValue !== null,
      };
      setFloatingTexts(prev => [...prev, floatingText]);
      console.log(`[HIT] Floating text created: ${floatingText.text}`);
    }

    // 4️⃣ PROGRESS: Mode-specific progress güncelle
    if (updateProgress && isMountedRef.current) {
    if (gameMode === GAME_MODES.SPEED_TEST) {
      setSpeedTestTargetsHit(prev => {
          const newCount = prev + progressDelta;
          speedTestHitCountRef.current = newCount;
          console.log(`[HIT] Speed Test progress: ${newCount}/${speedTestTargetCountRef.current}`);
        return newCount;
      });
      }
    }

    // 5️⃣ SCORE: Skor güncelle (Zen hariç)
    if (updateScore && gameMode !== GAME_MODES.ZEN && isMountedRef.current) {
      setScore(s => {
        const newScore = s + scoreDelta;
        console.log(`[HIT] Score updated: ${s} → ${newScore}`);
        return newScore;
      });
    }

    // 6️⃣ COMBO: Combo güncelle
    if (updateCombo && isMountedRef.current) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) {
        setMaxCombo(newCombo);
      }
      console.log(`[HIT] Combo updated: ${combo} → ${newCombo}`);
      
      // Power bar güncelle (Zen hariç)
      if (gameMode !== GAME_MODES.ZEN && newCombo > 0) {
        const newPower = Math.min(100, powerBar + GAME_CONSTANTS.POWER_BAR_FILL_PER_TAP);
        setPowerBar(newPower);
        if (newPower >= 100 && !powerBarActive) {
          setPowerBarActive(true);
          console.log('⚡ ReflexXP Power Bar ACTIVATED!');
        }
      }
    }

    // 7️⃣ HAPTIC: Dokunsal feedback
    if (updateCombo) {
      triggerHaptic('light');
    }

    console.log(`[HIT] Registration complete for target ${target.id}`);
  }, [
    activeParticleEmoji,
    currentTheme,
    combo,
    maxCombo,
    powerBar,
    powerBarActive,
    gameMode,
    triggerHaptic,
    speedTestTargetCountRef,
    isMountedRef,
  ]);

  // ====================================================
  // 🔴 UNIFIED HIT HANDLER - SINGLE SOURCE OF TRUTH
  // ====================================================
  // This function ALWAYS handles ALL aspects of a successful hit:
  // 1. Sound (appropriate for hit type)
  // 2. Visual feedback (particles, floating text)
  // 3. Progress updates (combo, score, power bar, speed test counters)
  // 4. Haptics and camera shake
  // ====================================================
  const handleSuccessfulHit = useCallback(async (target, hitContext) => {
    const {
      hitType = 'normal', // 'normal' | 'danger' | 'powerup' | 'lucky' | 'speedtest' | 'zen'
      newCombo = 0,
      points = 0,
      coinsEarned = 0,
      bonusXP = 0,
      bonusScore = 0,
      shouldUpdateCombo = true,
      shouldUpdateScore = true,
      shouldUpdatePowerBar = true,
      shouldUpdateSpeedTest = false,
      powerBarMultiplier = 1, // For power-ups (2x)
    } = hitContext;

    console.log(`[DEBUG HIT] handleSuccessfulHit called: targetId=${target.id}, hitType=${hitType}, newCombo=${newCombo}, willPlaySound=true, willAnimate=true, willUpdateProgress=true`);

    // ====================================================
    // 1. SOUND - ALWAYS PLAY APPROPRIATE SOUND
    // ====================================================
    try {
      if (hitType === 'danger') {
        // Danger: play miss sound (error feedback)
        playSound('miss');
        console.log('[DEBUG HIT] sound+FX triggered for targetId=' + target.id + ', mode=danger (miss sound)');
      } else if (hitType === 'powerup') {
        // Power-up: play luckyTap sound
        playSound('luckyTap');
        console.log('[DEBUG HIT] sound+FX triggered for targetId=' + target.id + ', mode=powerup (luckyTap sound)');
      } else if (hitType === 'lucky') {
        // Lucky target: play luckyTap sound
        playSound('luckyTap');
        console.log('[DEBUG HIT] sound+FX triggered for targetId=' + target.id + ', mode=lucky (luckyTap sound)');
      } else {
        // Normal/Speed Test/Zen: play tap sound
        playSound('tap');
        console.log('[DEBUG HIT] sound+FX triggered for targetId=' + target.id + ', mode=' + hitType + ' (tap sound)');
        
        // Combo milestone: play combo sound in addition to tap
        if (newCombo > 0 && newCombo % 5 === 0) {
          playSound('combo');
          console.log('[DEBUG HIT] combo milestone sound triggered for combo=' + newCombo);
        }
      }
    } catch (error) {
      console.warn('[DEBUG HIT] Sound error (non-critical):', error);
    }

    // ====================================================
    // 2. VISUAL FEEDBACK - PARTICLES
    // ====================================================
    // Android optimization: Reduced particle count to prevent lag
    const particleCount = hitType === 'powerup' ? 12 : hitType === 'danger' ? 8 : hitType === 'zen' ? 8 : 6;
    const particleColor = hitType === 'danger' 
      ? DANGER_CONFIG.COLOR 
      : hitType === 'powerup' 
        ? POWERUP_CONFIG.COLOR 
        : currentTheme.particleColors[0] || target.color;
    
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: `particle-${Date.now()}-${i}`,
      x: target.x + target.size / 2,
      y: target.y + target.size / 2,
      color: hitType === 'danger' || hitType === 'powerup'
        ? particleColor
        : currentTheme.particleColors[i % currentTheme.particleColors.length] || target.color,
      emoji: (hitType === 'danger' || hitType === 'powerup') ? null : (activeParticleEmoji || null),
    }));
    if (isMountedRef.current) {
      setParticles(prev => [...prev, ...newParticles]);
    }

    // ====================================================
    // 3. VISUAL FEEDBACK - FLOATING TEXT
    // ====================================================
    let floatingText = null;
    if (hitType === 'danger') {
      floatingText = {
        id: `float-${Date.now()}`,
        x: target.x + target.size / 2 - 20,
        y: target.y,
        text: '-1 ❤️',
        color: '#FF0000',
      };
    } else if (hitType === 'powerup') {
      floatingText = {
        id: `float-${Date.now()}`,
        x: target.x + target.size / 2 - 30,
        y: target.y,
        text: `💎 +${bonusScore} +${bonusXP}XP`,
        color: POWERUP_CONFIG.COLOR,
        isBonus: true,
        isCombo: false,
      };
    } else if (hitType === 'lucky') {
      floatingText = {
        id: `float-${Date.now()}`,
        x: target.x + target.size / 2 - 20,
        y: target.y,
        text: `+${coinsEarned} 🪙`,
        color: '#FFD93D',
        isBonus: true,
        isCombo: false,
      };
    } else {
      // Normal/Speed Test/Zen
      const isComboMilestone = newCombo > 0 && newCombo % 5 === 0;
      floatingText = {
        id: `float-${Date.now()}`,
        x: target.x + target.size / 2 - 20,
        y: target.y,
        text: `+${points}`,
        color: currentTheme?.primaryColor || target.color || '#4ECDC4',
        isCombo: isComboMilestone,
        isBonus: false,
      };
    }
    
    if (floatingText && isMountedRef.current) {
      setFloatingTexts(prev => [...prev, floatingText]);
    }

    // ====================================================
    // 4. PROGRESS UPDATES - COMBO
    // ====================================================
    if (shouldUpdateCombo && isMountedRef.current) {
      if (hitType === 'danger') {
        setCombo(0);
      } else {
        setCombo(newCombo);
        if (newCombo > maxCombo) {
          setMaxCombo(newCombo);
        }
      }
    }

    // ====================================================
    // 5. PROGRESS UPDATES - SCORE & COINS & XP
    // ====================================================
    if (shouldUpdateScore && gameMode !== GAME_MODES.ZEN && isMountedRef.current) {
      if (hitType === 'powerup') {
        setScore(s => s + bonusScore);
        setEarnedCoins(prev => prev + coinsEarned);
        setEarnedXP(prev => prev + bonusXP);
      } else if (hitType === 'lucky') {
        setEarnedCoins(prev => prev + coinsEarned);
      } else if (hitType !== 'danger' && hitType !== 'speedtest' && hitType !== 'zen') {
        setScore(s => s + points);
      }
    }

    // ====================================================
    // 6. PROGRESS UPDATES - POWER BAR
    // ====================================================
    if (shouldUpdatePowerBar && newCombo > 0 && hitType !== 'danger' && isMountedRef.current) {
      const powerFill = GAME_CONSTANTS.POWER_BAR_FILL_PER_TAP * powerBarMultiplier;
      const newPower = Math.min(100, powerBar + powerFill);
        setPowerBar(newPower);
        
        if (newPower >= 100 && !powerBarActive) {
          setPowerBarActive(true);
          console.log('⚡ ReflexXP Power Bar ACTIVATED! 2× XP for 10s');
        }
      }
      
    // ====================================================
    // 7. PROGRESS UPDATES - SPEED TEST COUNTERS
    // ====================================================
    if (shouldUpdateSpeedTest && gameMode === GAME_MODES.SPEED_TEST && isMountedRef.current) {
      setSpeedTestTargetsHit(prev => {
        const newCount = prev + 1;
        const targetCount = speedTestTargetCountRef.current || speedTestTargetCount;
        speedTestHitCountRef.current = newCount;
        return newCount;
      });
    }

    // ====================================================
    // 8. HAPTIC FEEDBACK - AAA GAME JUICE
    // === AAA GAME JUICE: Enhanced haptics with specific patterns ===
    // ====================================================
    if (hitType === 'danger') {
      // AAA: Danger hit = Heavy haptic + Screen shake
      triggerShake(); // VISUAL IMPACT
      triggerHaptic('heavy'); // Heavy thud for damage
    } else if (hitType === 'powerup' || hitType === 'lucky') {
      triggerHaptic('success'); // Success notification for special hits
    } else if (newCombo > 0) {
      triggerHaptic('light'); // AAA: Light impact for crisp tap feel
    } else {
      // Normal hit without combo
      triggerHaptic('light'); // AAA: Light impact for crisp tap feel
    }

    // ====================================================
    // 9. CAMERA SHAKE FOR COMBO MILESTONES
    // ====================================================
    if (newCombo > 0 && newCombo % 5 === 0 && hitType !== 'danger') {
      triggerCameraShake(); // Keep old shake for combo milestones
      if (hitType !== 'powerup' && hitType !== 'lucky') {
        // Already played combo sound above for normal hits
        triggerHaptic('success');
      }
    }

    // ====================================================
    // 10. MODE-SPECIFIC LOGIC
    // ====================================================
    // Update music speed based on combo
    if (hitType !== 'danger') {
    musicManager.updateComboSpeed(newCombo);
    }
    
    // Rush mode: combo multiplier increases every 5 taps
    if (gameMode === GAME_MODES.RUSH && newCombo > 0 && newCombo % 5 === 0 && hitType !== 'danger' && isMountedRef.current) {
      setRushComboMultiplier(prev => {
        const newMultiplier = prev + 0.2;
      console.log(`💥 Rush Combo Multiplier: ${newMultiplier.toFixed(1)}x`);
        return newMultiplier;
      });
    }

    console.log(`[DEBUG HIT] handleSuccessfulHit completed: targetId=${target.id}, hitType=${hitType}, all feedback triggered`);
  }, [combo, maxCombo, powerBar, powerBarActive, currentTheme, activeParticleEmoji, gameMode, speedTestTargetCount, triggerHaptic, triggerCameraShake, triggerShake, isMountedRef]);

  const handleTap = useCallback(async (target) => {
    console.log(
      `[DEBUG TAP] tap handler called, mode=${gameMode}, targetId=${target?.id}, gameActive=${gameActive}, gameOver=${gameOverRef.current}, runId=${runIdRef.current}`
    );

    // 1) Block taps during Speed Test countdown
    if (gameMode === GAME_MODES.SPEED_TEST && countdown !== null && countdown > 0) {
      console.log('[DEBUG TAP] Tap blocked: Speed Test countdown active');
      return;
    }

    // 2) Block taps when game not active or already over
    if (gameOverRef.current || !gameActive) {
      console.log(
        `[DEBUG TAP] Tap blocked: gameOver=${gameOverRef.current}, gameActive=${gameActive}`
      );
      return;
    }

    // 3) Validate target object
    if (!target || !target.id) {
      console.warn('[DEBUG TAP] Tap blocked: invalid target object', target);
      return;
    }

    // 🚨 KEY CHANGE:
    // From this point on, we TRUST the target passed from NeonTarget.
    // We DO NOT depend on the current targets array to "find" it.
    const targetToProcess = target;

    // 4) Remove target from state AFTER we decide to process it
    //    This removal is only for visual/state cleanup, not for validation.
    setTargets(prev => prev.filter(t => t && t.id !== target.id));

    console.log(
      `[DEBUG TAP] Tap validated and processing - targetId=${target.id}, type=${
        targetToProcess.isDanger
          ? 'danger'
          : targetToProcess.isPowerUp
          ? 'powerup'
          : targetToProcess.isLucky
          ? 'lucky'
          : 'normal'
      }`
    );

    // 5) Mode-specific handling using handleSuccessfulHit as SINGLE source of feedback

    // 5.a) SPEED TEST MODE
    if (gameMode === GAME_MODES.SPEED_TEST) {
      if (speedTestCompleted || !gameActive) {
        console.log('[DEBUG TAP] Speed Test: Tap blocked - completed or inactive');
        return;
      }

      const newCombo = combo + 1;

      await handleSuccessfulHit(targetToProcess, {
        hitType: 'speedtest',
        newCombo,
        points: 0,
        coinsEarned: 0,
        bonusXP: 0,
        bonusScore: 0,
        shouldUpdateCombo: true,
        shouldUpdateScore: false,      // Speed Test uses time, not score
        shouldUpdatePowerBar: false,
        shouldUpdateSpeedTest: true,   // let handleSuccessfulHit increment speedTestTargetsHit etc.
        powerBarMultiplier: 1,
      });

      return;
    }

    // 5.b) ZEN MODE
    if (gameMode === GAME_MODES.ZEN) {
      const newCombo = combo + 1;

      await handleSuccessfulHit(targetToProcess, {
        hitType: 'zen',
        newCombo,
        points: 0,
        coinsEarned: 0,
        bonusXP: 0,
        bonusScore: 0,
        shouldUpdateCombo: true,
        shouldUpdateScore: false,
        shouldUpdatePowerBar: false,
        shouldUpdateSpeedTest: false,
        powerBarMultiplier: 1,
      });

      return;
    }

    // 5.c) CLASSIC / RUSH MODES – reuse existing hitType logic
    const isDanger = !!targetToProcess.isDanger;
    const isPowerUp = !!targetToProcess.isPowerUp;
    const isLucky = !!targetToProcess.isLucky;

    let hitType = 'normal';
    if (isDanger) hitType = 'danger';
    else if (isPowerUp) hitType = 'powerup';
    else if (isLucky) hitType = 'lucky';

    // Reuse existing scoring logic (points, coins, bonusXP, powerBarMultiplier etc.)
    // but pipe it through handleSuccessfulHit.

    let points = 10;
    let coinsEarned = 0;
    let bonusXP = 0;
    let bonusScore = 0;
    let powerBarMultiplier = 1;

    if (hitType === 'danger') {
      // let handleSuccessfulHit handle danger feedback (sound, health, particles)
      await handleSuccessfulHit(targetToProcess, {
        hitType,
        newCombo: 0,
        points: 0,
        coinsEarned: 0,
        bonusXP: 0,
        bonusScore: 0,
        shouldUpdateCombo: true,
        shouldUpdateScore: false,
        shouldUpdatePowerBar: false,
        shouldUpdateSpeedTest: false,
        powerBarMultiplier: 1,
      });

      // Danger-specific logic
      const healthUpdated = updateHealthSafe(-1, 'danger_tap', runIdRef.current);
      if (!healthUpdated) {
        console.log(`[DANGER] Health update blocked`);
      }

      return;
    }

    if (hitType === 'powerup') {
      // use existing power-up bonus logic
      bonusScore = POWERUP_CONFIG.SCORE_MULTIPLIER * 50;
      const bonusCoins = POWERUP_CONFIG.COIN_BONUS;
      bonusXP = POWERUP_CONFIG.XP_BONUS;
      powerBarMultiplier = 2; // 2x power bar fill for power-ups

      const newCombo = combo + 1;
      await handleSuccessfulHit(targetToProcess, {
        hitType,
        newCombo,
        points: 0,
        coinsEarned: bonusCoins,
        bonusXP,
        bonusScore,
        shouldUpdateCombo: true,
        shouldUpdateScore: true,
        shouldUpdatePowerBar: true,
        shouldUpdateSpeedTest: false,
        powerBarMultiplier,
      });

      return;
    }

    if (hitType === 'lucky') {
      // use existing lucky bonus logic
      const multiplier = getLuckyBonus();
      coinsEarned = multiplier * 5;

      const newCombo = combo + 1;
      await handleSuccessfulHit(targetToProcess, {
        hitType,
        newCombo,
        points: 10,
        coinsEarned,
        bonusXP: 0,
        bonusScore: 0,
        shouldUpdateCombo: true,
        shouldUpdateScore: false, // Lucky doesn't give score, only coins
        shouldUpdatePowerBar: true,
        shouldUpdateSpeedTest: false,
        powerBarMultiplier: 1,
      });

      return;
    }

    // NORMAL HIT (Classic / Rush)
    {
      const newCombo = combo + 1;

      // Rush mode: combo multiplier
      if (gameMode === GAME_MODES.RUSH) {
    if (newCombo % 5 === 0) {
          const newMultiplier = rushComboMultiplier + 0.2;
          setRushComboMultiplier(newMultiplier);
          console.log(`💥 Rush Combo Multiplier: ${newMultiplier.toFixed(1)}x`);
        }
        points = calculateScore(points, newCombo, gameMode, rushComboMultiplier);
      } else {
        points = calculateScore(points, newCombo, gameMode, 1.0);
      }

      await handleSuccessfulHit(targetToProcess, {
        hitType: 'normal',
        newCombo,
        points,
        coinsEarned: 0,
        bonusXP: 0,
        bonusScore: 0,
        shouldUpdateCombo: true,
        shouldUpdateScore: true,
        shouldUpdatePowerBar: true,
        shouldUpdateSpeedTest: false,
        powerBarMultiplier: 1,
      });
    }
  }, [
    gameMode,
    countdown,
    gameActive,
    combo,
    maxCombo,
    speedTestCompleted,
    runIdRef,
    gameOverRef,
    rushComboMultiplier,
    handleSuccessfulHit,
    updateHealthSafe,
    getLuckyBonus,
    calculateScore,
    setRushComboMultiplier,
    setTargets,
  ]);

  const handleMiss = () => {
    // === AAA GAME JUICE: Screen shake + haptics for miss ===
    triggerShake(); // VISUAL IMPACT
    triggerHaptic('error'); // Error haptic for miss feedback
    
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

  // 🎨 PREMIUM ESPORTS: Ensure currentTheme is always valid before rendering
  // CRITICAL: Use currentTheme (which is updated by the effect when globalThemeData changes)
  // This ensures React detects state changes and triggers re-renders
  // Single source of truth: currentTheme is synced with globalThemeData via the effect
  const resolvedTheme = (currentTheme && (currentTheme.accentColor || currentTheme.primaryColor)) 
    ? currentTheme 
    : (globalThemeData && globalThemeData.name && (globalThemeData.accentColor || globalThemeData.primaryColor))
      ? globalThemeData
      : getDefaultTheme();
  
  // === THEME SANITIZATION FIX START ===
  // CRITICAL: Sanitize theme object to ensure ALL values are primitives (strings/numbers/booleans)
  // React Native Fabric crashes if objects are passed to native props
  const sanitizeTheme = (theme) => {
    if (!theme || typeof theme !== 'object') {
      return {
        id: 'theme_default',
        name: 'Classic Dark',
        accentColor: '#00E5FF',
        primaryColor: '#00E5FF',
        backgroundColor: '#05070D',
        gradientColors: ['#0A0F1A', '#1a1a2e'],
        particleColors: ['#00E5FF', '#4ECDC4', '#00D9FF'],
      };
    }
    
    // Extract and validate all color values as strings
    const safeAccentColor = typeof theme.accentColor === 'string' ? theme.accentColor : 
                           (typeof theme.primaryColor === 'string' ? theme.primaryColor : '#00E5FF');
    const safePrimaryColor = typeof theme.primaryColor === 'string' ? theme.primaryColor : safeAccentColor;
    const safeSecondaryColor = typeof theme.secondaryAccent === 'string' ? theme.secondaryAccent :
                              (typeof theme.secondaryColor === 'string' ? theme.secondaryColor : '#FF6B9D');
    const safeBackgroundColor = typeof theme.backgroundColor === 'string' ? theme.backgroundColor : '#05070D';
    
    // Extract and validate glowColor as string (never object)
    // CRITICAL: glowColor must always be a string, never an object
    let safeGlowColor = null;
    if (typeof theme.glowColor === 'string' && theme.glowColor.length > 0) {
      safeGlowColor = theme.glowColor;
    } else {
      // Create rgba string from accentColor with opacity (fallback)
      safeGlowColor = `${safeAccentColor}8C`; // Default opacity suffix
    }
    
    // Extract and validate numeric values
    const safeGlowRadius = typeof theme.glowRadius === 'number' ? theme.glowRadius : 12;
    const safeGlowOpacity = typeof theme.glowOpacity === 'number' ? theme.glowOpacity : 0.55;
    
    // Extract and validate arrays (ensure all elements are strings)
    const safeGradientColors = Array.isArray(theme.gradientColors) && theme.gradientColors.length > 0
      ? theme.gradientColors.filter(c => typeof c === 'string')
      : [ESPORTS_DARK_BACKGROUNDS.SECONDARY, '#1a1a2e'];
    
    const safeParticleColors = Array.isArray(theme.particleColors) && theme.particleColors.length > 0
      ? theme.particleColors.filter(c => typeof c === 'string')
      : ['#00E5FF', '#4ECDC4', '#00D9FF'];
    
    // Return sanitized theme with ONLY primitive values
    return {
      id: typeof theme.id === 'string' ? theme.id : 'theme_default',
      name: typeof theme.name === 'string' ? theme.name : 'Classic Dark',
      accentColor: safeAccentColor,
      primaryColor: safePrimaryColor,
      secondaryAccent: safeSecondaryColor,
      secondaryColor: safeSecondaryColor,
      backgroundColor: safeBackgroundColor,
      glowColor: safeGlowColor,
      glowRadius: safeGlowRadius,
      glowOpacity: safeGlowOpacity,
      gradientColors: safeGradientColors,
      particleColors: safeParticleColors,
      // Only include text colors if they are strings
      textPrimary: typeof theme.textPrimary === 'string' ? theme.textPrimary : undefined,
      textSecondary: typeof theme.textSecondary === 'string' ? theme.textSecondary : undefined,
    };
  };
  
  const safeTheme = sanitizeTheme(resolvedTheme);
  // === THEME SANITIZATION FIX END ===
  
  // 🎨 PREMIUM ESPORTS: Always use esports dark background for global screen (never theme-dependent)
  const safeBackgroundColor = ESPORTS_DARK_BACKGROUNDS.PRIMARY;
  // Support both new token structure (accentColor) and legacy (primaryColor)
  const safePrimaryColor = safeTheme.accentColor || safeTheme.primaryColor || '#00E5FF';
  const safeSecondaryColor = safeTheme.secondaryAccent || safeTheme.secondaryColor || '#FF6B9D';
  // 🎨 PREMIUM ESPORTS: Theme gradient applies ONLY to board area
  const safeGradientColors = safeTheme.gradientColors;
  
  // 🔴 CRITICAL FIX: Log resolved theme for debugging - FINAL VERIFICATION
  useEffect(() => {
    console.log('🎨 FINAL THEME APPLIED IN GAMEPLAY:', {
      id: safeTheme?.id,
      name: safeTheme?.name,
      accentColor: safeTheme?.accentColor || safeTheme?.primaryColor,
      primaryColor: safeTheme?.primaryColor,
      backgroundColor: safeTheme?.backgroundColor,
      gradientColors: safeTheme?.gradientColors,
      particleColors: safeTheme?.particleColors,
    });
    console.log('✨ ACTIVE PARTICLE EMOJI:', activeParticleEmoji || 'none');
  }, [
    safeTheme?.id, 
    safeTheme?.name, 
    safeTheme?.accentColor || safeTheme?.primaryColor, 
    safeTheme?.backgroundColor, 
    safeTheme?.gradientColors?.join(','), 
    safeTheme?.particleColors?.join(','),
    activeParticleEmoji
  ]);

  if (screenDimensions.width === 0) {
    return <View style={styles.container} />;
  }

  return (
    <AnimatedReanimated.View
      style={[
        styles.container,
        {
          backgroundColor: safeBackgroundColor, // 🎨 PREMIUM ESPORTS: Premium dark background
        },
        animatedShakeStyle, // === AAA GAME JUICE: Reanimated screen shake ===
      ]}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: safeBackgroundColor }]}>
        {/* Combo Bar with theme colors */}
        <ComboBar combo={combo} maxCombo={50} theme={safeTheme} />

        {/* Power Bar */}
        {gameMode !== GAME_MODES.ZEN && (
          <PowerBar power={powerBar} isActive={powerBarActive} theme={safeTheme} />
        )}

        {/* HUD */}
        <View style={styles.hud}>
          <View style={styles.hudItem}>
            <Text style={[styles.hudLabel, { color: safeTheme.textSecondary || '#BDC3C7' }]}>
              {gameMode === GAME_MODES.SPEED_TEST ? 'Time' : 'Score'}
            </Text>
            <Text style={[styles.hudValue, { color: safePrimaryColor }]}>
              {gameMode === GAME_MODES.SPEED_TEST ? formatTime(speedTestElapsedTimeRef.current || speedTestElapsedTime) :
               gameMode === GAME_MODES.ZEN ? '—' : score}
            </Text>
          </View>
          {gameMode === GAME_MODES.SPEED_TEST ? (
            <View style={styles.hudItem}>
              <Text style={[styles.hudLabel, { color: safeTheme.textSecondary || '#BDC3C7' }]}>Progress</Text>
              <Text style={[styles.hudValue, { color: safePrimaryColor }]}>
                {speedTestHitCountRef.current || speedTestTargetsHit}/{speedTestTargetCountRef.current || speedTestTargetCount}
              </Text>
            </View>
          ) : (
            <View style={styles.hudItem}>
              <Text style={[styles.hudLabel, { color: safeTheme.textSecondary || '#BDC3C7' }]}>Time</Text>
              <Text
                style={[
                  styles.hudValue,
                  { color: safePrimaryColor },
                  timeLeft <= 10 && styles.hudValueWarning,
                ]}
              >
                {timeLeft}s
              </Text>
            </View>
          )}
          {gameMode === GAME_MODES.RUSH && (
            <View style={styles.hudItem}>
              <Text style={[styles.hudLabel, { color: safeTheme.textSecondary || '#BDC3C7' }]}>Multiplier</Text>
              <Text style={[styles.hudValue, { color: safeSecondaryColor }]}>
                {rushComboMultiplier.toFixed(1)}×
              </Text>
            </View>
          )}
        </View>

      {/* Health Bar - Hidden in Speed Test and Zen modes */}
      {/* === AAA ZEN MODE FIX: Hide lives indicator in Zen mode === */}
      {gameMode !== GAME_MODES.SPEED_TEST && gameMode !== GAME_MODES.ZEN && (
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
      )}

        {/* CRITICAL FIX: Speed Test Countdown Overlay */}
        {gameMode === GAME_MODES.SPEED_TEST && countdown !== null && countdown > 0 && (
          <View style={styles.countdownOverlay}>
            <Animated.Text style={[styles.countdownText, {
              color: safePrimaryColor,
              transform: [{ scale: shakeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.5],
              })}]
            }]}>
              {countdown}
            </Animated.Text>
            <Text style={styles.countdownSubtext}>Get Ready!</Text>
          </View>
        )}

        {/* Game Area with theme background gradient */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleMiss}
          disabled={gameMode === GAME_MODES.SPEED_TEST && countdown !== null && countdown > 0}
          style={[
            styles.gameArea,
            {
              width: gameAreaWidth,
              height: gameAreaHeight,
              borderColor: (typeof safeTheme.glowColor === 'string' ? safeTheme.glowColor : `${safePrimaryColor}4D`), // 🎨 PREMIUM ESPORTS: Use theme glow color with reduced opacity
              opacity: (gameMode === GAME_MODES.SPEED_TEST && countdown !== null && countdown > 0) ? 0.3 : 1,
              overflow: 'hidden', // 🔴 BUG #1 FIX: Ensure gradient doesn't overflow
            },
          ]}
        >
          {/* 🔴 BUG #1 FIX: Use LinearGradient for theme background */}
          <LinearGradient
            colors={safeGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          />
          {/* Game content rendered on top of gradient */}
          <View style={{ position: 'relative', width: '100%', height: '100%' }}>
        {targets.map(target => (
          <NeonTarget
            key={target.id}
            target={target}
            onTap={handleTap}
            combo={combo}
                theme={safeTheme}
          />
        ))}
        {particles.map(particle => (
          <Particle
            key={particle.id}
                x={particle.x}
                y={particle.y}
                color={particle.color}
                emoji={particle?.emoji ?? particle?.icon ?? particle?.character ?? null} // 🔴 SAFE_EMOJI_PATCH: Safe fallback
            onComplete={() => removeParticle(particle.id)}
                theme={safeTheme}
          />
        ))}
        {floatingTexts.map(text => (
          <FloatingScore
            key={text.id}
            {...text}
            onComplete={() => removeFloatingText(text.id)}
          />
        ))}
          </View>
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

        {/* Revive Modal - CRITICAL FIX: Never show for Speed Test */}
        <Modal visible={showReviveOption && gameMode !== GAME_MODES.SPEED_TEST} transparent animationType="fade">
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

        {/* ✅ TASK 1: Speed Test (Time-Attack Mode) Results Modal */}
        <Modal visible={speedTestResultsVisible && speedTestCompleted} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>⚡ Speed Test Results</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Final Time:</Text>
                  <Text style={[styles.statValue, { color: '#00E5FF', fontSize: 24, fontWeight: 'bold' }]}>
                    {formatTime(speedTestElapsedTime)}s
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Avg Reaction:</Text>
                  <Text style={[styles.statValue, { color: '#FFD93D' }]}>
                    {speedTestTargetsHit > 0 ? formatTime(speedTestElapsedTime / speedTestTargetsHit) : '0.000'}s
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Accuracy:</Text>
                  <Text style={[styles.statValue, { color: '#39FF14' }]}>
                    {speedTestTargetsHit + speedTestTargetsMissed > 0 
                      ? Math.round((speedTestTargetsHit / (speedTestTargetsHit + speedTestTargetsMissed)) * 100) 
                      : 100}%
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Rank:</Text>
                  <Text style={[styles.statValue, { 
                    color: calculateSpeedTestRank(speedTestElapsedTime) === 'S' ? '#FFD93D' :
                           calculateSpeedTestRank(speedTestElapsedTime) === 'A' ? '#00E5FF' :
                           calculateSpeedTestRank(speedTestElapsedTime) === 'B' ? '#39FF14' : '#FF6B9D',
                    fontSize: 32,
                    fontWeight: 'bold'
                  }]}>
                    {calculateSpeedTestRank(speedTestElapsedTime)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.playAgainButton, !speedTestCanRestart && styles.buttonDisabled]} 
                onPress={() => {
                  if (!speedTestCanRestart) return;
                  setSpeedTestResultsVisible(false);
                  handlePlayAgain();
                }}
                disabled={!speedTestCanRestart}
              >
                <Text style={styles.playAgainButtonText}>Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.mainMenuButton} 
                onPress={() => {
                  if (!speedTestCanRestart) return;
                  setSpeedTestResultsVisible(false);
                  navigation.goBack();
                }}
                disabled={!speedTestCanRestart}
              >
                <Text style={styles.mainMenuButtonText}>Main Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Game Over Modal */}
        <Modal visible={gameOver && gameMode !== GAME_MODES.SPEED_TEST} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {gameMode !== GAME_MODES.SPEED_TEST && (
                <>
                  <Text style={styles.modalTitle}>
                    {gameWon ? '🎉 Victory!' : '💔 Game Over!'}
                  </Text>
                  {gameWon && (
                    <Text style={styles.victorySubtitle}>
                      You survived until time ran out!
                    </Text>
                  )}
                  {!gameWon && (
                    <Text style={styles.defeatSubtitle}>
                      You ran out of lives!
                    </Text>
                  )}
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
                  
                  {showDoubleReward ? (
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
                      {/* CRITICAL FIX: Professional button order - Primary action first */}
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
                      <TouchableOpacity
                        style={styles.shareButton}
                        onPress={handleShare}
                      >
                        <Text style={styles.shareButtonText}>📤 Share Score</Text>
                      </TouchableOpacity>
                    </>
                  )}
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
              theme={safeTheme}
            />
          </View>
        </Modal>
      </SafeAreaView>
    </AnimatedReanimated.View>
  );
}

const styles = createSafeStyleSheet({
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
    color: '#BDC3C7', // 🎨 PREMIUM ESPORTS: Clean esports text color
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5, // Sharp esports look
    marginBottom: 5,
  },
  hudValue: {
    color: '#FFFFFF', // 🎨 PREMIUM ESPORTS: High contrast for readability (color set dynamically)
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5, // Sharp esports look
    textShadowColor: 'rgba(0, 0, 0, 0.5)', // Subtle shadow for depth
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    marginBottom: 10,
    textShadowColor: '#4ECDC4',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  victorySubtitle: {
    color: '#39FF14',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  defeatSubtitle: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
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
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: '#7F8C8D',
  },
  mainMenuButton: {
    backgroundColor: '#7F8C8D',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  mainMenuButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  playAgainButton: {
    backgroundColor: '#4ECDC4', // Primary - strongest color
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#00E5FF',
  },
  playAgainButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    backgroundColor: '#7F8C8D', // Secondary - medium color
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#95A5A6',
  },
  menuButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: '#34495E', // Tertiary - subtle color
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    opacity: 0.8,
  },
  shareButtonText: {
    color: '#BDC3C7',
    fontSize: 16,
    fontWeight: '600',
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 1000,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  countdownSubtext: {
    fontSize: 24,
    color: '#FFF',
    marginTop: 20,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
});
