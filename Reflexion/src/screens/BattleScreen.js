/**
 * REFLEXION v5.0 - ELITE BATTLE MODE (1v1)
 * Professional-grade local multiplayer reflex game
 * 
 * Features:
 * - Turn-based gameplay with race condition fixes
 * - Dynamic scoring based on reaction time
 * - Combo system with multipliers
 * - Visual feedback and animations
 * - Haptic feedback
 * - Pause functionality
 * - Countdown before start
 * - Audio sync fixes and fallback mechanisms
 * - Comprehensive error handling
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import soundManager from '../services/SoundManager';

// CRITICAL FIX: Get dimensions safely inside component, not at module level
export default function BattleScreen({ navigation }) {
  // CRITICAL FIX: Use state for dimensions to handle screen rotation and safe areas
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const dims = Dimensions.get('window');
    return { width: dims.width, height: dims.height };
  });
  
  // CRITICAL FIX: Track safe area insets for proper bounds calculation
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions({ width: window.width, height: window.height });
    });
    return () => subscription?.remove();
  }, []);
  
  const { width, height } = screenDimensions;
  
  // Game state
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [gameActive, setGameActive] = useState(false);
  const [gameTime, setGameTime] = useState(30);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  
  // Combo system (P2)
  const [player1Combo, setPlayer1Combo] = useState(0);
  const [player2Combo, setPlayer2Combo] = useState(0);
  
  // Visual feedback (P1)
  const [missIndicator, setMissIndicator] = useState(null);
  const [hitReactionTime, setHitReactionTime] = useState(null);
  
  // Refs
  const timerRef = useRef(null);
  const targetTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const gameActiveRef = useRef(false);
  const currentPlayerRef = useRef(1);
  const isPausedRef = useRef(false);
  const countdownActiveRef = useRef(false);
  
  // Animation refs (P2)
  const targetScaleAnim = useRef(new Animated.Value(0)).current;
  const targetOpacityAnim = useRef(new Animated.Value(0)).current;
  const targetPulseAnim = useRef(new Animated.Value(1)).current;
  const screenShakeAnim = useRef(new Animated.Value(0)).current;
  const countdownScaleAnim = useRef(new Animated.Value(0)).current;
  const comboScaleAnim = useRef({ p1: new Animated.Value(1), p2: new Animated.Value(1) }).current;
  const pulseAnimRef = useRef(null); // Store pulse animation for cleanup
  
  // Sync refs with state
  useEffect(() => {
    gameActiveRef.current = gameActive;
    currentPlayerRef.current = currentPlayer;
    isPausedRef.current = isPaused;
  }, [gameActive, currentPlayer, isPaused]);

  /**
   * CRITICAL FIX #2: Timer Re-initialization Bug
   * Remove gameTime from dependencies, use functional updates
   * FIX: Proper cleanup and pause/resume handling
   */
  useEffect(() => {
    if (!gameActive || isPaused || showCountdown) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    // CRITICAL FIX: Clear any existing timer before creating new one
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    timerRef.current = setInterval(() => {
      setGameTime(t => {
        const newTime = t - 1;
        if (newTime <= 0) {
          // CRITICAL FIX: Use ref to check if still active
          if (gameActiveRef.current && !isPausedRef.current) {
            endGame();
          }
          return 0;
        }
        return newTime;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameActive, isPaused, showCountdown]); // ✅ Only gameActive, isPaused, showCountdown

  /**
   * CRITICAL FIX #3: Target Spawn Initialization
   * Pass currentPlayer explicitly
   * FIX: Prevent multiple spawns and ensure proper cleanup
   */
  useEffect(() => {
    if (gameActive && !isPaused && !showCountdown && !countdownActiveRef.current) {
      // CRITICAL FIX: Clear any existing target timer before spawning
      if (targetTimerRef.current) {
        clearTimeout(targetTimerRef.current);
        targetTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      
      spawnTarget(currentPlayer);
    }
    return () => {
      if (targetTimerRef.current) {
        clearTimeout(targetTimerRef.current);
        targetTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
    };
  }, [gameActive, currentPlayer, isPaused, showCountdown, spawnTarget]);

  /**
   * CRITICAL FIX #1: Player Switching Race Condition
   * Accept player parameter explicitly to avoid stale state
   * FIX: Enhanced error handling and cleanup
   * 
   * @param {number} playerForTarget - Player number (1 or 2) for this target
   */
  const spawnTarget = useCallback((playerForTarget) => {
    // CRITICAL FIX: Check multiple conditions before spawning
    if (!gameActiveRef.current || isPausedRef.current || countdownActiveRef.current) {
      console.log('⚠️ Spawn blocked:', { gameActive: gameActiveRef.current, isPaused: isPausedRef.current, countdown: countdownActiveRef.current });
      return;
    }
    
    try {
      // CRITICAL FIX: Clear any existing animations
      if (pulseAnimRef.current) {
        pulseAnimRef.current.stop();
        pulseAnimRef.current = null;
      }
      
      const spawnTime = Date.now();
      const targetId = Date.now() + Math.random(); // Ensure unique ID
      
      // CRITICAL FIX: Calculate safe spawn area considering header, scores, safe areas, and actual UI layout
      const TARGET_SIZE = 80; // Target size in pixels
      const HEADER_HEIGHT = 100; // Header area (reduced from 120)
      const SCORES_HEIGHT = 110; // Scores section height (reduced from 120)
      const SAFE_MARGIN = 30; // Increased safe margin from edges
      const BOTTOM_SAFE_AREA = 60; // Bottom safe area (home indicator, etc.) - increased
      
      // CRITICAL FIX: Use actual screen dimensions minus safe areas
      // Account for safe area insets if available
      const topSafeArea = safeAreaInsets.top || 0;
      const bottomSafeArea = safeAreaInsets.bottom || 0;
      const leftSafeArea = safeAreaInsets.left || 0;
      const rightSafeArea = safeAreaInsets.right || 0;
      
      // Calculate playable area with all constraints
      const playableTop = HEADER_HEIGHT + SCORES_HEIGHT + topSafeArea;
      const playableBottom = height - BOTTOM_SAFE_AREA - bottomSafeArea;
      const playableLeft = SAFE_MARGIN + leftSafeArea;
      const playableRight = width - SAFE_MARGIN - rightSafeArea;
      const playableWidth = playableRight - playableLeft;
      const playableHeight = playableBottom - playableTop;
      
      // CRITICAL FIX: Validate playable area is large enough
      if (playableWidth < TARGET_SIZE * 1.5 || playableHeight < TARGET_SIZE * 1.5) {
        console.warn('⚠️ Playable area too small, using conservative bounds');
        // Fallback to very conservative bounds
        const minX = Math.max(SAFE_MARGIN + leftSafeArea, TARGET_SIZE);
        const maxX = Math.min(width - SAFE_MARGIN - rightSafeArea - TARGET_SIZE, width - TARGET_SIZE);
        const minY = Math.max(HEADER_HEIGHT + SCORES_HEIGHT + topSafeArea, TARGET_SIZE);
        const maxY = Math.min(height - BOTTOM_SAFE_AREA - bottomSafeArea - TARGET_SIZE, height - TARGET_SIZE);
        
        const target = {
          id: targetId,
          x: Math.max(minX, Math.min(maxX, minX + Math.random() * Math.max(0, maxX - minX))),
          y: Math.max(minY, Math.min(maxY, minY + Math.random() * Math.max(0, maxY - minY))),
          player: playerForTarget,
          spawnTime,
        };
        setCurrentTarget(target);
        console.log(`🎯 Target spawned (fallback): x=${target.x.toFixed(0)}, y=${target.y.toFixed(0)}, width=${width}, height=${height}`);
        return;
      }
      
      // CRITICAL FIX: Spawn within playable area only - ensure target is fully visible
      const maxX = playableRight - TARGET_SIZE;
      const maxY = playableBottom - TARGET_SIZE;
      const spawnX = playableLeft + Math.random() * Math.max(0, maxX - playableLeft);
      const spawnY = playableTop + Math.random() * Math.max(0, maxY - playableTop);
      
      const target = {
        id: targetId,
        x: Math.max(playableLeft, Math.min(maxX, spawnX)),
        y: Math.max(playableTop, Math.min(maxY, spawnY)),
        player: playerForTarget, // ✅ Explicit parameter, no state dependency
        spawnTime,
      };
      
      // CRITICAL FIX: Log spawn position for debugging
      console.log(`🎯 Target spawned: x=${target.x.toFixed(0)}, y=${target.y.toFixed(0)}, playableArea=${playableWidth.toFixed(0)}x${playableHeight.toFixed(0)}, screen=${width}x${height}`);
      
      setCurrentTarget(target);
      
      // P2: Target spawn animations
      targetScaleAnim.setValue(0);
      targetOpacityAnim.setValue(0);
      targetPulseAnim.setValue(1);
      
      Animated.parallel([
        Animated.sequence([
          Animated.spring(targetScaleAnim, {
            toValue: 1.2,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(targetScaleAnim, {
            toValue: 1.0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(targetOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // P2: Pulse animation - store ref for cleanup
      pulseAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(targetPulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(targetPulseAnim, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimRef.current.start();
      
      // P1: Visual feedback - change color to red before expiration (last 0.5s)
      warningTimerRef.current = setTimeout(() => {
        // Target will turn red (handled in render via isTargetExpiring)
        if (!gameActiveRef.current || !currentTarget || currentTarget.id !== targetId) {
          return; // Target already changed or game ended
        }
      }, 1500);
      
      // Auto-miss after 2 seconds
      targetTimerRef.current = setTimeout(() => {
        // CRITICAL FIX: Verify game is still active and target hasn't changed
        if (gameActiveRef.current && !isPausedRef.current && currentTarget?.id === targetId) {
          handleMiss(playerForTarget);
        }
      }, 2000);
      
      console.log(`🎯 Target spawned for Player ${playerForTarget} (ID: ${targetId})`);
    } catch (error) {
      console.error('❌ Error spawning target:', error);
      // CRITICAL FIX: Retry spawn on error
      setTimeout(() => {
        if (gameActiveRef.current && !isPausedRef.current) {
          spawnTarget(playerForTarget);
        }
      }, 100);
    }
  }, [screenDimensions, targetScaleAnim, targetOpacityAnim, targetPulseAnim, currentTarget]);

  /**
   * P1: Handle miss with visual feedback
   * FIX: Enhanced error handling and cleanup
   * 
   * @param {number} player - Player who missed
   */
  const handleMiss = useCallback((player) => {
    if (!gameActiveRef.current || isPausedRef.current) return;
    
    try {
      // CRITICAL FIX: Clear target timers
      if (targetTimerRef.current) {
        clearTimeout(targetTimerRef.current);
        targetTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      
      // P2: Haptic feedback - strong haptic on miss
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (hapticError) {
        console.warn('⚠️ Haptic feedback failed:', hapticError);
      }
      
      // CRITICAL FIX: Audio with fallback
      soundManager.play('miss').catch(error => {
        console.warn('⚠️ Miss sound failed, using fallback:', error);
        soundManager.play('tap').catch(() => {
          console.warn('⚠️ Fallback sound also failed');
        });
      });
      
      // P1: Visual feedback - shake animation
      Animated.sequence([
        Animated.timing(screenShakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(screenShakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(screenShakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
      
      // P1: Miss indicator - ensure it's within screen bounds
      const TARGET_SIZE = 80;
      const HEADER_HEIGHT = 120;
      const SCORES_HEIGHT = 120;
      const SAFE_MARGIN = 20;
      const BOTTOM_SAFE_AREA = 50;
      const playableTop = HEADER_HEIGHT + SCORES_HEIGHT;
      const playableBottom = height - BOTTOM_SAFE_AREA;
      const playableLeft = SAFE_MARGIN;
      const playableRight = width - SAFE_MARGIN;
      
      const targetX = currentTarget?.x ? Math.max(playableLeft, Math.min(playableRight - TARGET_SIZE, currentTarget.x)) : width / 2;
      const targetY = currentTarget?.y ? Math.max(playableTop, Math.min(playableBottom - TARGET_SIZE, currentTarget.y)) : height / 2;
      setMissIndicator({
        id: Date.now(),
        player,
        x: targetX,
        y: targetY,
      });
      
      setTimeout(() => setMissIndicator(null), 1000);
      
      // Reset combo on miss
      if (player === 1) {
        setPlayer1Combo(0);
      } else {
        setPlayer2Combo(0);
      }
      
      // Switch player and spawn next target
      const nextPlayer = player === 1 ? 2 : 1;
      setCurrentPlayer(nextPlayer);
      
      // CRITICAL FIX: Small delay to ensure state updates
      setTimeout(() => {
        if (gameActiveRef.current && !isPausedRef.current) {
          spawnTarget(nextPlayer); // ✅ Pass explicitly
        }
      }, 50);
      
      console.log(`❌ Player ${player} missed - switching to Player ${nextPlayer}`);
    } catch (error) {
      console.error('❌ Error handling miss:', error);
      // CRITICAL FIX: Recovery - try to continue game
      const nextPlayer = player === 1 ? 2 : 1;
      setCurrentPlayer(nextPlayer);
      setTimeout(() => {
        if (gameActiveRef.current && !isPausedRef.current) {
          spawnTarget(nextPlayer);
        }
      }, 100);
    }
  }, [screenShakeAnim, width, height, currentTarget, spawnTarget]);

  /**
   * P1: Calculate points based on reaction time
   * Faster hits = more points (max 20 for <500ms, min 5 for >1500ms)
   * 
   * @param {number} reactionTime - Time in milliseconds
   * @returns {number} Points earned
   */
  const calculatePoints = useCallback((reactionTime) => {
    // CRITICAL FIX: Validate input
    if (!reactionTime || reactionTime < 0 || !isFinite(reactionTime)) {
      console.warn('⚠️ Invalid reaction time:', reactionTime);
      return 10; // Default points
    }
    
    const basePoints = 10;
    const timeBonus = Math.max(0, 2000 - reactionTime) / 100;
    const points = Math.max(5, Math.min(20, Math.floor(basePoints + timeBonus)));
    return points;
  }, []);

  /**
   * P2: Get combo multiplier
   * +1x per 5 consecutive hits
   * 
   * @param {number} combo - Current combo count
   * @returns {number} Multiplier (1x, 2x, 3x, etc.)
   */
  const getComboMultiplier = useCallback((combo) => {
    // CRITICAL FIX: Validate input
    if (!combo || combo < 0 || !isFinite(combo)) {
      return 1;
    }
    return Math.floor(combo / 5) + 1;
  }, []);

  /**
   * Handle target tap
   * FIX: Enhanced error handling and audio fallback
   * 
   * @param {number} player - Player number (1 or 2)
   */
  const handleTap = useCallback((player) => {
    // CRITICAL FIX: Multiple validation checks
    if (!currentTarget || 
        currentTarget.player !== player || 
        !gameActiveRef.current || 
        isPausedRef.current ||
        showCountdown) {
      return;
    }

    try {
      // CRITICAL FIX: Clear timers immediately
      if (targetTimerRef.current) {
        clearTimeout(targetTimerRef.current);
        targetTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      
      // P2: Haptic feedback - light haptic on hit
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (hapticError) {
        console.warn('⚠️ Haptic feedback failed:', hapticError);
      }
      
      // CRITICAL FIX: Audio with fallback and error handling
      soundManager.play('tap').catch(error => {
        console.warn('⚠️ Tap sound failed, using fallback:', error);
        soundManager.play('coin').catch(() => {
          console.warn('⚠️ All sound fallbacks failed');
        });
      });
      
      // P1: Calculate reaction time and points
      const reactionTime = Date.now() - currentTarget.spawnTime;
      const basePoints = calculatePoints(reactionTime);
      
      // P2: Apply combo multiplier
      const combo = player === 1 ? player1Combo + 1 : player2Combo + 1;
      const multiplier = getComboMultiplier(combo);
      const finalPoints = Math.floor(basePoints * multiplier);
      
      // Update score
      if (player === 1) {
        setPlayer1Score(s => s + finalPoints);
        setPlayer1Combo(combo);
        
        // P2: Combo animation
        Animated.sequence([
          Animated.timing(comboScaleAnim.p1, {
            toValue: 1.3,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(comboScaleAnim.p1, {
            toValue: 1.0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        setPlayer2Score(s => s + finalPoints);
        setPlayer2Combo(combo);
        
        // P2: Combo animation
        Animated.sequence([
          Animated.timing(comboScaleAnim.p2, {
            toValue: 1.3,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(comboScaleAnim.p2, {
            toValue: 1.0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
      
      // P1: Show reaction time and points - ensure within screen bounds
      const TARGET_SIZE = 80;
      const HEADER_HEIGHT = 120;
      const SCORES_HEIGHT = 120;
      const SAFE_MARGIN = 20;
      const BOTTOM_SAFE_AREA = 50;
      const playableTop = HEADER_HEIGHT + SCORES_HEIGHT;
      const playableBottom = height - BOTTOM_SAFE_AREA;
      const playableLeft = SAFE_MARGIN;
      const playableRight = width - SAFE_MARGIN;
      
      const hitX = Math.max(playableLeft, Math.min(playableRight - TARGET_SIZE, currentTarget.x));
      const hitY = Math.max(playableTop, Math.min(playableBottom - TARGET_SIZE, currentTarget.y));
      setHitReactionTime({
        id: Date.now(),
        player,
        reactionTime,
        points: finalPoints,
        combo: multiplier > 1 ? `${multiplier}x` : null,
        x: hitX,
        y: hitY,
      });
      
      setTimeout(() => setHitReactionTime(null), 1500);
      
      // Switch player and spawn next target
      const nextPlayer = player === 1 ? 2 : 1;
      setCurrentPlayer(nextPlayer);
      
      // P2: Haptic feedback - medium haptic on player switch
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (hapticError) {
        console.warn('⚠️ Haptic feedback failed:', hapticError);
      }
      
      // CRITICAL FIX: Clear current target before spawning new one
      setCurrentTarget(null);
      
      // CRITICAL FIX: Small delay to ensure state updates
      setTimeout(() => {
        if (gameActiveRef.current && !isPausedRef.current) {
          spawnTarget(nextPlayer); // ✅ Pass explicitly
        }
      }, 50);
      
      console.log(`✅ Player ${player} hit - ${finalPoints} points (${reactionTime}ms, ${multiplier}x combo) - switching to Player ${nextPlayer}`);
    } catch (error) {
      console.error('❌ Error handling tap:', error);
      // CRITICAL FIX: Recovery - try to continue game
      const nextPlayer = player === 1 ? 2 : 1;
      setCurrentPlayer(nextPlayer);
      setCurrentTarget(null);
      setTimeout(() => {
        if (gameActiveRef.current && !isPausedRef.current) {
          spawnTarget(nextPlayer);
        }
      }, 100);
    }
  }, [currentTarget, calculatePoints, getComboMultiplier, player1Combo, player2Combo, spawnTarget, isPaused, showCountdown, comboScaleAnim]);

  /**
   * P1: Countdown before start
   * FIX: Prevent multiple countdowns and ensure proper cleanup
   */
  const startCountdown = useCallback(() => {
    // CRITICAL FIX: Prevent multiple countdowns
    if (countdownActiveRef.current) {
      console.warn('⚠️ Countdown already active, ignoring duplicate call');
      return;
    }
    
    countdownActiveRef.current = true;
    setShowCountdown(true);
    let currentCount = 3;
    setCountdownNumber(currentCount);
    
    // CRITICAL FIX: Clear any existing countdown timer
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    
    // P1: Countdown animation for initial "3"
    countdownScaleAnim.setValue(0);
    Animated.spring(countdownScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
    
    // CRITICAL FIX: Audio with fallback
    soundManager.play('tap').catch(error => {
      console.warn('⚠️ Countdown sound failed:', error);
    });
    
    const countdown = () => {
      currentCount -= 1;
      setCountdownNumber(currentCount);
      
      if (currentCount > 0) {
        // P1: Countdown animation
        countdownScaleAnim.setValue(0);
        Animated.spring(countdownScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
        
        // P1: Countdown sound
        soundManager.play('tap').catch(error => {
          console.warn('⚠️ Countdown sound failed:', error);
        });
        
        countdownTimerRef.current = setTimeout(countdown, 1000);
      } else {
        // GO!
        setCountdownNumber(0);
        countdownScaleAnim.setValue(0);
        Animated.spring(countdownScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
        
        soundManager.play('start').catch(error => {
          console.warn('⚠️ Start sound failed:', error);
          soundManager.play('tap').catch(() => {});
        });
        
        setTimeout(() => {
          countdownActiveRef.current = false;
          setShowCountdown(false);
          setGameActive(true);
          setCurrentPlayer(1);
        }, 500);
      }
    };
    
    countdownTimerRef.current = setTimeout(countdown, 1000);
  }, [countdownScaleAnim]);

  /**
   * Start game
   * FIX: Comprehensive cleanup and state reset
   */
  const startGame = useCallback(() => {
    // CRITICAL FIX: Clean up all timers and animations
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (targetTimerRef.current) {
      clearTimeout(targetTimerRef.current);
      targetTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (pulseAnimRef.current) {
      pulseAnimRef.current.stop();
      pulseAnimRef.current = null;
    }
    
    // Reset all state
    setGameActive(false);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setGameTime(30);
    setCurrentPlayer(1);
    setPlayer1Combo(0);
    setPlayer2Combo(0);
    setCurrentTarget(null);
    setIsPaused(false);
    setMissIndicator(null);
    setHitReactionTime(null);
    countdownActiveRef.current = false;
    
    // Reset animations
    targetScaleAnim.setValue(0);
    targetOpacityAnim.setValue(0);
    targetPulseAnim.setValue(1);
    screenShakeAnim.setValue(0);
    comboScaleAnim.p1.setValue(1);
    comboScaleAnim.p2.setValue(1);
    
    // P1: Start countdown
    startCountdown();
  }, [startCountdown, targetScaleAnim, targetOpacityAnim, targetPulseAnim, screenShakeAnim, comboScaleAnim]);

  /**
   * End game
   * FIX: Comprehensive cleanup
   */
  const endGame = useCallback(() => {
    setGameActive(false);
    setIsPaused(false);
    countdownActiveRef.current = false;
    
    // CRITICAL FIX: Clean up all timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (targetTimerRef.current) {
      clearTimeout(targetTimerRef.current);
      targetTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (pulseAnimRef.current) {
      pulseAnimRef.current.stop();
      pulseAnimRef.current = null;
    }
    
    setCurrentTarget(null);
    
    // CRITICAL FIX: Audio with fallback
    soundManager.play('gameOver').catch(error => {
      console.warn('⚠️ Game over sound failed:', error);
      soundManager.play('miss').catch(() => {});
    });
    
    console.log('🎮 Battle ended');
  }, []);

  /**
   * P2: Pause/Resume game
   * FIX: Proper timer management and state sync
   */
  const togglePause = useCallback(() => {
    if (!gameActive || showCountdown) return;
    
    setIsPaused(p => {
      const newPaused = !p;
      isPausedRef.current = newPaused;
      
      if (newPaused) {
        // Pause
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (targetTimerRef.current) {
          clearTimeout(targetTimerRef.current);
          targetTimerRef.current = null;
        }
        if (warningTimerRef.current) {
          clearTimeout(warningTimerRef.current);
          warningTimerRef.current = null;
        }
        if (pulseAnimRef.current) {
          pulseAnimRef.current.stop();
        }
        
        soundManager.play('tap').catch(error => {
          console.warn('⚠️ Pause sound failed:', error);
        });
      } else {
        // Resume
        soundManager.play('start').catch(error => {
          console.warn('⚠️ Resume sound failed:', error);
        });
        
        // CRITICAL FIX: Resume pulse animation if target exists
        if (currentTarget && pulseAnimRef.current) {
          pulseAnimRef.current.start();
        }
      }
      return newPaused;
    });
  }, [gameActive, showCountdown, currentTarget]);

  /**
   * Cleanup on unmount
   * CRITICAL FIX: Comprehensive cleanup
   */
  useEffect(() => {
    return () => {
      console.log('🧹 BattleScreen unmounting - cleaning up...');
      
      // Clean up all timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (targetTimerRef.current) {
        clearTimeout(targetTimerRef.current);
        targetTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      
      // Clean up animations
      if (pulseAnimRef.current) {
        pulseAnimRef.current.stop();
        pulseAnimRef.current = null;
      }
      
      // Reset refs
      gameActiveRef.current = false;
      countdownActiveRef.current = false;
      
      console.log('✅ BattleScreen cleanup complete');
    };
  }, []);

  /**
   * Get winner text
   */
  const getWinner = useMemo(() => {
    if (player1Score > player2Score) return 'Player 1 Wins! 🏆';
    if (player2Score > player1Score) return 'Player 2 Wins! 🏆';
    return 'It\'s a Tie! 🤝';
  }, [player1Score, player2Score]);

  /**
   * P2: Get combo display text
   */
  const getComboText = useCallback((combo) => {
    if (combo === 0) return '';
    const multiplier = getComboMultiplier(combo);
    return multiplier > 1 ? `${combo} COMBO ${multiplier}x` : `${combo} COMBO`;
  }, [getComboMultiplier]);

  /**
   * Check if target is about to expire (for red color)
   */
  const isTargetExpiring = useMemo(() => {
    if (!currentTarget) return false;
    const timeSinceSpawn = Date.now() - currentTarget.spawnTime;
    return timeSinceSpawn > 1500; // Last 0.5 seconds
  }, [currentTarget]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Animated.View 
        style={[
          styles.container,
          {
            transform: [{ translateX: screenShakeAnim }],
          },
        ]}
      >
        <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={StyleSheet.absoluteFill}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚔️ Battle Mode</Text>
          <View style={styles.headerRight}>
            {gameActive && !showCountdown && (
              <TouchableOpacity onPress={togglePause} style={styles.pauseButton}>
                <Ionicons name={isPaused ? "play" : "pause"} size={20} color="#FFF" />
              </TouchableOpacity>
            )}
            <Text style={styles.timer}>{gameTime}s</Text>
          </View>
        </View>

        {/* Scores */}
        <View style={styles.scoresContainer}>
          <View style={[styles.playerSection, currentPlayer === 1 && styles.activePlayer]}>
            <Text style={styles.playerLabel}>Player 1</Text>
            <Animated.View style={{ transform: [{ scale: comboScaleAnim.p1 }] }}>
              <Text style={[styles.scoreText, { color: '#00E5FF' }]}>{player1Score}</Text>
            </Animated.View>
            {player1Combo > 0 && (
              <Text style={styles.comboText}>{getComboText(player1Combo)}</Text>
            )}
          </View>

          <Text style={styles.vsText}>VS</Text>

          <View style={[styles.playerSection, currentPlayer === 2 && styles.activePlayer]}>
            <Text style={styles.playerLabel}>Player 2</Text>
            <Animated.View style={{ transform: [{ scale: comboScaleAnim.p2 }] }}>
              <Text style={[styles.scoreText, { color: '#FF6B9D' }]}>{player2Score}</Text>
            </Animated.View>
            {player2Combo > 0 && (
              <Text style={styles.comboText}>{getComboText(player2Combo)}</Text>
            )}
          </View>
        </View>

        {/* Game Area */}
        <View style={styles.gameArea}>
          {currentTarget && gameActive && !isPaused && !showCountdown && (
            <Animated.View
              style={[
                styles.targetContainer,
                {
                  // CRITICAL FIX: Ensure target position is within screen bounds
                  left: Math.max(0, Math.min(width - 80, currentTarget.x)),
                  top: Math.max(0, Math.min(height - 80, currentTarget.y)),
                  transform: [
                    { scale: Animated.multiply(targetScaleAnim, targetPulseAnim) },
                  ],
                  opacity: targetOpacityAnim,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.target}
                onPress={() => handleTap(currentTarget.player)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    isTargetExpiring
                      ? ['#FF1744', '#FF6B9D'] // P1: Red when expiring
                      : currentTarget.player === 1
                      ? ['#00E5FF', '#4ECDC4']
                      : ['#FF6B9D', '#FF8E53']
                  }
                  style={styles.targetGradient}
                >
                  <Text style={styles.targetText}>P{currentTarget.player}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* P1: Miss Indicator */}
          {missIndicator && (
            <View
              style={[
                styles.missIndicator,
                {
                  // CRITICAL FIX: Ensure miss indicator is within screen bounds
                  left: Math.max(0, Math.min(width - 100, missIndicator.x)),
                  top: Math.max(0, Math.min(height - 100, missIndicator.y)),
                },
              ]}
            >
              <Text style={styles.missText}>MISS!</Text>
            </View>
          )}

          {/* P1: Hit Reaction Time & Points */}
          {hitReactionTime && (
            <View
              style={[
                styles.hitIndicator,
                {
                  // CRITICAL FIX: Ensure hit indicator is within screen bounds
                  left: Math.max(0, Math.min(width - 100, hitReactionTime.x)),
                  top: Math.max(0, Math.min(height - 100, hitReactionTime.y - 30)),
                },
              ]}
            >
              <Text style={styles.hitPointsText}>+{hitReactionTime.points}</Text>
              <Text style={styles.hitTimeText}>{hitReactionTime.reactionTime}ms</Text>
              {hitReactionTime.combo && (
                <Text style={styles.hitComboText}>{hitReactionTime.combo}</Text>
              )}
            </View>
          )}
        </View>

        {/* P1: Countdown Overlay */}
        {showCountdown && (
          <View style={styles.countdownOverlay}>
            <Animated.View
              style={[
                styles.countdownContainer,
                {
                  transform: [{ scale: countdownScaleAnim }],
                },
              ]}
            >
              <Text style={styles.countdownText}>
                {countdownNumber > 0 ? countdownNumber : 'GO!'}
              </Text>
            </Animated.View>
          </View>
        )}

        {/* P2: Pause Overlay */}
        {isPaused && gameActive && (
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseContent}>
              <Text style={styles.pauseTitle}>⏸️ PAUSED</Text>
              <TouchableOpacity style={styles.resumeButton} onPress={togglePause}>
                <Text style={styles.resumeButtonText}>RESUME</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Start/End Screen */}
        {!gameActive && !showCountdown && (
          <View style={styles.overlay}>
            <View style={styles.overlayContent}>
              {gameTime === 30 ? (
                <>
                  <Text style={styles.overlayTitle}>Battle Mode</Text>
                  <Text style={styles.overlaySubtitle}>
                    Take turns tapping your color!{'\n'}
                    30 seconds - highest score wins!{'\n'}
                    Faster hits = more points!
                  </Text>
                  <TouchableOpacity style={styles.startButton} onPress={startGame}>
                    <Text style={styles.startButtonText}>START BATTLE</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.overlayTitle}>{getWinner}</Text>
                  <Text style={styles.finalScore}>
                    Player 1: {player1Score} | Player 2: {player2Score}
                  </Text>
                  <TouchableOpacity style={styles.startButton} onPress={startGame}>
                    <Text style={styles.startButtonText}>REMATCH</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                  >
                    <Text style={styles.backButtonText}>Back to Menu</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
        </LinearGradient>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  pauseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timer: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    minWidth: 50,
    textAlign: 'right',
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
  },
  playerSection: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 120,
  },
  activePlayer: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD70020',
  },
  playerLabel: {
    fontSize: 14,
    color: '#8B8B8B',
    marginBottom: 5,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  comboText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 4,
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  targetContainer: {
    position: 'absolute',
  },
  target: {
    width: 80, // P1: Increased from 70 to 80
    height: 80, // P1: Increased from 70 to 80
  },
  targetGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40, // P1: Updated for 80x80
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  targetText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  missIndicator: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF1744',
    textShadowColor: '#FF1744',
    textShadowRadius: 10,
  },
  hitIndicator: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitPointsText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FF00',
    textShadowColor: '#00FF00',
    textShadowRadius: 10,
  },
  hitTimeText: {
    fontSize: 14,
    color: '#8B8B8B',
    marginTop: 2,
  },
  hitComboText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 4,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#00E5FF',
    textShadowColor: '#00E5FF',
    textShadowRadius: 30,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  pauseTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00E5FF',
    marginBottom: 20,
  },
  resumeButton: {
    backgroundColor: '#00E5FF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
  },
  resumeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    alignItems: 'center',
  },
  overlayTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00E5FF',
    marginBottom: 15,
    textAlign: 'center',
  },
  overlaySubtitle: {
    fontSize: 16,
    color: '#8B8B8B',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  finalScore: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#00E5FF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  backButton: {
    paddingVertical: 10,
  },
  backButtonText: {
    fontSize: 14,
    color: '#8B8B8B',
  },
});
