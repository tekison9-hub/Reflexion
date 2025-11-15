/**
 * Core game constants for ReflexXP/Reflexion
 * Defines balanced difficulty, gameplay mechanics, themes, and game modes
 * CRITICAL FIXES APPLIED: Increased target sizes, balanced difficulty curve
 */

// Game Modes - REFLEXION v5.0
export const GAME_MODES = {
  CLASSIC: 'classic',
  RUSH: 'rush',
  ZEN: 'zen',
  SPEED_TEST: 'speed_test',
};

// Theme Definitions - REFLEXION v5.0 EXPANDED
export const THEMES = {
  NEON_CITY: {
    id: 'neon_city',
    name: 'Neon City',
    levels: [1],
    cost: 0,
    backgroundColor: '#0a0a1a',
    gradientColors: ['#1a1a2e', '#16213e'],
    primaryColor: '#4ECDC4',
    secondaryColor: '#C56CF0',
    particleColors: ['#4ECDC4', '#00D9FF', '#00FFE5'],
    description: 'Classic neon city vibes',
    category: 'starter',
  },
  HYPER_LANE: {
    id: 'hyper_lane',
    name: 'Hyper Lane',
    levels: [6],
    cost: 500,
    backgroundColor: '#1a0a2e',
    gradientColors: ['#2d1b4e', '#1a0a2e'],
    primaryColor: '#C56CF0',
    secondaryColor: '#FF6B9D',
    particleColors: ['#C56CF0', '#E056FD', '#FF6B9D'],
    description: 'High-speed purple energy',
    category: 'premium',
  },
  CYBER_TUNNEL: {
    id: 'cyber_tunnel',
    name: 'Cyber Tunnel',
    levels: [11],
    cost: 1000,
    backgroundColor: '#0a1a2a',
    gradientColors: ['#1a2a3a', '#0a1a2a'],
    primaryColor: '#00D9FF',
    secondaryColor: '#4ECDC4',
    particleColors: ['#00D9FF', '#0099CC', '#0066FF'],
    description: 'Futuristic blue waves',
    category: 'premium',
  },
  PULSE_CORE: {
    id: 'pulse_core',
    name: 'Pulse Core',
    levels: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    backgroundColor: '#2a0a1a',
    gradientColors: ['#3a1a2a', '#2a0a1a'],
    primaryColor: '#FF6B9D',
    secondaryColor: '#FFD93D',
    particleColors: ['#FF6B9D', '#FF1493', '#FF69B4'],
    description: 'Pulsing pink neon core',
  },
  QUANTUM_STORM: {
    id: 'quantum_storm',
    name: 'Quantum Storm',
    levels: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
    backgroundColor: '#0a0a0a',
    gradientColors: ['#1a1a2a', '#2a1a3a', '#1a2a3a'],
    primaryColor: '#C56CF0',
    secondaryColor: '#4ECDC4',
    particleColors: ['#C56CF0', '#4ECDC4', '#FF6B9D', '#FFD93D', '#00D9FF'],
    description: 'Dynamic quantum energy storm',
  },
};

export const GAME_CONSTANTS = {
  // Classic Mode - BALANCED FOR BETTER UX
  CLASSIC_DURATION: 30,
  CLASSIC_SPAWN_INTERVAL: 1000, // Slightly slower for better timing
  CLASSIC_TARGET_LIFETIME: 2500, // Increased from 2000ms for better tap window
  
  // Rush Mode
  RUSH_DURATION: 30,
  RUSH_SPAWN_INTERVAL: 700, // Faster spawning
  RUSH_TARGET_LIFETIME: 1800, // Slightly longer for fairness
  RUSH_COMBO_BOOST_INTERVAL: 5,
  
  // Zen Mode
  ZEN_DURATION: 60,
  ZEN_SPAWN_INTERVAL: 1500,
  ZEN_TARGET_LIFETIME: 3500, // More forgiving
  
  // Common - IMPROVED SIZES FOR MOBILE
  MAX_HEALTH: 5,
  COMBO_MULTIPLIER: 0.15,
  LUCKY_TAP_CHANCE: 0.1,
  LUCKY_TAP_MULTIPLIER: [2, 3, 5, 10],
  
  // Difficulty scaling - SMOOTHER CURVE
  DIFFICULTY_SCORE_THRESHOLD: 250, // Increased from 200
  DIFFICULTY_MAX_LEVEL: 10,
  DIFFICULTY_SPEED_INCREASE: 0.06, // Reduced from 0.08 for gentler ramp
  DIFFICULTY_SPAWN_DECREASE: 80, // Reduced from 100
  DIFFICULTY_SIZE_DECREASE: 2, // Reduced from 3
  MIN_SPAWN_INTERVAL: 500, // Increased from 400 (max difficulty limit)
  
  // Target sizing - INCREASED FOR BETTER MOBILE UX
  TARGET_BASE_SIZE: 70, // Increased from 60 (44pt minimum for touch targets)
  TARGET_MIN_SIZE: 50, // Increased from 40
  TARGET_MAX_SIZE: 90, // Increased from 80
  
  // Power Bar (Classic/Rush)
  POWER_BAR_FILL_PER_TAP: 10,
  POWER_BAR_DURATION: 10000,
  POWER_BAR_XP_MULTIPLIER: 2.0,
  
  // Theme unlocks (level-based)
  THEME_UNLOCK_LEVELS: {
    NEON_CITY: 1,
    HYPER_LANE: 6,
    CYBER_TUNNEL: 11,
    PULSE_CORE: 21,
    QUANTUM_STORM: 31,
  },
  
  MODE_UNLOCK_LEVELS: {
    CLASSIC: 1,
    RUSH: 1,
    ZEN: 1,
    SPEED_TEST: 1,
  },
  
  SPEED_TEST_TRIALS: 25,
  SPEED_TEST_MIN_DELAY: 800,
  SPEED_TEST_MAX_DELAY: 1800,
};

/**
 * REFLEXION v5.0 PROFESSIONAL EDITION - XP Progression System
 * 
 * Linear progression system requiring meaningful time investment:
 * - Level 1 → 2: 1000 XP (baseline)
 * - Level 2 → 3: 1500 XP
 * - Level 3 → 4: 2000 XP
 * - Increases by +500 XP per level
 * 
 * Goal: 5-6 full games per level (balanced long-term progression)
 */

// CRITICAL FIX: Easy first levels, exponential after level 5
// Base XP for first few levels (easy progression)
const BASE_XP_EASY = 300; // Level 1 → 2
const XP_LEVEL_2_TO_3 = 500;
const XP_LEVEL_3_TO_4 = 800;
const XP_LEVEL_4_TO_5 = 1200;
const XP_LEVEL_5_TO_6 = 1500;
const XP_EXPONENTIAL_BASE = 1500; // Base for exponential after level 5
const XP_EXPONENTIAL_MULTIPLIER = 1.15; // 15% increase per level after level 5

/**
 * Calculate cumulative XP needed to reach a specific level
 * CRITICAL FIX: Easy first levels, exponential after level 5
 * @param {number} level - Target level (1-indexed)
 * @returns {number} Total XP required to reach this level
 */
export function calculateXPNeeded(level) {
  if (level <= 1) return 0;
  
  // Easy progression for first 5 levels
  if (level === 2) return BASE_XP_EASY; // 300 XP
  if (level === 3) return BASE_XP_EASY + XP_LEVEL_2_TO_3; // 800 XP total
  if (level === 4) return BASE_XP_EASY + XP_LEVEL_2_TO_3 + XP_LEVEL_3_TO_4; // 1600 XP total
  if (level === 5) return BASE_XP_EASY + XP_LEVEL_2_TO_3 + XP_LEVEL_3_TO_4 + XP_LEVEL_4_TO_5; // 2800 XP total
  if (level === 6) return BASE_XP_EASY + XP_LEVEL_2_TO_3 + XP_LEVEL_3_TO_4 + XP_LEVEL_4_TO_5 + XP_LEVEL_5_TO_6; // 4300 XP total
  
  // Exponential progression after level 5
  let totalXP = BASE_XP_EASY + XP_LEVEL_2_TO_3 + XP_LEVEL_3_TO_4 + XP_LEVEL_4_TO_5 + XP_LEVEL_5_TO_6;
  
  for (let i = 6; i < level; i++) {
    const levelIndex = i - 5; // Level 6 = index 1, Level 7 = index 2, etc.
    const xpForLevel = XP_EXPONENTIAL_BASE * Math.pow(XP_EXPONENTIAL_MULTIPLIER, levelIndex);
    totalXP += Math.floor(xpForLevel);
  }
  
  return totalXP;
}

/**
 * Get XP needed for next level from current level
 * CRITICAL FIX: Easy first levels, exponential after level 5
 * @param {number} currentLevel - Current player level
 * @returns {number} XP needed to reach next level
 */
export function getXPForNextLevel(currentLevel) {
  if (currentLevel < 1) return BASE_XP_EASY;
  
  // Easy progression for first 5 levels
  if (currentLevel === 1) return BASE_XP_EASY; // 300 XP
  if (currentLevel === 2) return XP_LEVEL_2_TO_3; // 500 XP
  if (currentLevel === 3) return XP_LEVEL_3_TO_4; // 800 XP
  if (currentLevel === 4) return XP_LEVEL_4_TO_5; // 1200 XP
  if (currentLevel === 5) return XP_LEVEL_5_TO_6; // 1500 XP
  
  // Exponential progression after level 5
  const levelIndex = currentLevel - 5; // Level 6 = index 1, Level 7 = index 2, etc.
  const xpForLevel = XP_EXPONENTIAL_BASE * Math.pow(XP_EXPONENTIAL_MULTIPLIER, levelIndex);
  return Math.floor(xpForLevel);
}

// Pre-calculate thresholds for first 100 levels for performance
export const LEVEL_THRESHOLDS = Array.from({ length: 101 }, (_, i) => 
  calculateXPNeeded(i + 1)
);

// Log progression curve for debugging
console.log('📊 Reflexion v5.0 XP Curve:', {
  'Level 2': calculateXPNeeded(2) + ' XP (need ' + getXPForNextLevel(1) + ')',
  'Level 3': calculateXPNeeded(3) + ' XP (need ' + getXPForNextLevel(2) + ')',
  'Level 5': calculateXPNeeded(5) + ' XP (need ' + getXPForNextLevel(4) + ')',
  'Level 10': calculateXPNeeded(10) + ' XP (need ' + getXPForNextLevel(9) + ')',
  'Level 20': calculateXPNeeded(20) + ' XP (need ' + getXPForNextLevel(19) + ')',
});

// ELITE v3.0: Danger Point System Configuration
export const DANGER_CONFIG = {
  MIN_LEVEL: 5, // Start spawning danger points at level 5
  BASE_CHANCE: 0.03, // 3% base spawn rate
  CHANCE_PER_LEVEL: 0.005, // +0.5% per level
  MAX_CHANCE: 0.25, // Cap at 25%
  LIFETIME_MULTIPLIER: 0.7, // Danger points disappear 30% faster
  COLOR: '#FF3B3B', // Vibrant red
  GLOW_COLOR: '#FF0000', // Pure red glow
};

// ELITE v3.0: Power-Up Target System Configuration
export const POWERUP_CONFIG = {
  MIN_LEVEL: 3, // Start spawning power-ups at level 3
  BASE_CHANCE: 0.05, // 5% base spawn rate
  CHANCE_PER_LEVEL: 0.002, // +0.2% per level
  MAX_CHANCE: 0.15, // Cap at 15%
  LIFETIME_MULTIPLIER: 1.5, // Power-ups last 50% longer
  COLOR: '#FFD700', // Gold
  GLOW_COLOR: '#FFA500', // Orange glow
  SCORE_MULTIPLIER: 3, // 3x score
  XP_BONUS: 50, // +50 XP
  COIN_BONUS: 10, // +10 coins
};

/**
 * Determine if a danger point should spawn
 * @param {number} playerLevel - Current player level
 * @param {string} gameMode - Current game mode
 * @returns {boolean} - Should spawn danger point
 */
export function shouldSpawnDangerPoint(playerLevel, gameMode) {
  // Only in Rush mode and after level 5
  if (gameMode !== GAME_MODES.RUSH || playerLevel < DANGER_CONFIG.MIN_LEVEL) {
    return false;
  }
  
  // Calculate spawn chance based on level
  const chance = Math.min(
    DANGER_CONFIG.BASE_CHANCE + (playerLevel - DANGER_CONFIG.MIN_LEVEL) * DANGER_CONFIG.CHANCE_PER_LEVEL,
    DANGER_CONFIG.MAX_CHANCE
  );
  
  return Math.random() < chance;
}

/**
 * ELITE v3.0: Determine if a power-up should spawn
 * @param {number} playerLevel - Current player level
 * @param {string} gameMode - Current game mode
 * @returns {boolean} - Should spawn power-up
 */
export function shouldSpawnPowerUp(playerLevel, gameMode) {
  // Available in all modes after level 3
  if (playerLevel < POWERUP_CONFIG.MIN_LEVEL) {
    return false;
  }
  
  // Higher spawn rate in Zen mode for dopamine rewards
  const modeMultiplier = gameMode === GAME_MODES.ZEN ? 1.5 : 1.0;
  
  // Calculate spawn chance based on level
  const chance = Math.min(
    POWERUP_CONFIG.BASE_CHANCE + (playerLevel - POWERUP_CONFIG.MIN_LEVEL) * POWERUP_CONFIG.CHANCE_PER_LEVEL,
    POWERUP_CONFIG.MAX_CHANCE
  ) * modeMultiplier;
  
  return Math.random() < chance;
}

/**
 * Calculate difficulty level based on score
 * IMPROVED: Smoother progression, less punishing
 */
export function calculateDifficulty(score, gameMode = GAME_MODES.CLASSIC) {
  if (gameMode === GAME_MODES.ZEN) return 1; // Zen mode = no difficulty scaling
  
  const threshold = GAME_CONSTANTS.DIFFICULTY_SCORE_THRESHOLD;
  const level = Math.floor(score / threshold) + 1;
  return Math.min(level, GAME_CONSTANTS.DIFFICULTY_MAX_LEVEL);
}

/**
 * Get difficulty multiplier for XP/Coins
 */
export function getDifficultyMultiplier(difficulty, playerLevel) {
  const baseMultiplier = 1.0 + (difficulty - 1) * GAME_CONSTANTS.DIFFICULTY_SPEED_INCREASE;
  const levelBonus = 1.0 + (playerLevel - 1) * 0.02; // +2% per player level
  return baseMultiplier * levelBonus;
}

/**
 * Calculate spawn interval based on difficulty
 * CRITICAL FIX: Smooth, gradual decrease for better gameplay
 */
export function getSpawnInterval(difficulty, gameMode, playerLevel) {
  let baseInterval;
  
  switch (gameMode) {
    case GAME_MODES.RUSH:
      baseInterval = GAME_CONSTANTS.RUSH_SPAWN_INTERVAL;
      break;
    case GAME_MODES.ZEN:
      baseInterval = GAME_CONSTANTS.ZEN_SPAWN_INTERVAL;
      break;
    default:
      baseInterval = GAME_CONSTANTS.CLASSIC_SPAWN_INTERVAL;
  }
  
  // CRITICAL FIX: Smooth scaling - reduce interval gradually
  // Difficulty: -40ms per level (smoother than before)
  const difficultyReduction = (difficulty - 1) * 40;
  
  // Player level: -5ms per level (smooth progression)
  const levelReduction = (playerLevel - 1) * 5;
  
  const finalInterval = Math.max(
    GAME_CONSTANTS.MIN_SPAWN_INTERVAL,
    baseInterval - difficultyReduction - levelReduction
  );
  
  return finalInterval;
}

/**
 * CRITICAL FIX: Calculate how many targets should spawn simultaneously
 * REFINED: Specific level ranges as requested
 * Levels 1–2 → 1 target
 * Levels 3–4 → 2 targets
 * Levels 5–7 → 3 targets
 * Levels 8–12 → 3-4 targets
 * Levels 12+ → 4-5 targets (Rush only)
 */
export function getMaxSimultaneousTargets(difficulty, playerLevel, gameMode) {
  // Rush mode gets extra targets at high levels
  const isRush = gameMode === GAME_MODES.RUSH;
  
  if (playerLevel >= 12 && isRush) {
    return difficulty >= 10 ? 5 : 4; // Rush 12+: 4-5 targets
  } else if (playerLevel >= 12) {
    return 4; // Other modes 12+: 4 targets
  } else if (playerLevel >= 8) {
    return Math.min(4, 3 + Math.floor((playerLevel - 8) / 2)); // 8-12: 3-4 targets
  } else if (playerLevel >= 5) {
    return 3; // 5-7: 3 targets
  } else if (playerLevel >= 3) {
    return 2; // 3-4: 2 targets
  } else {
    return 1; // 1-2: 1 target
  }
}

/**
 * Get game duration by mode
 */
export function getGameDuration(gameMode) {
  switch (gameMode) {
    case GAME_MODES.RUSH:
      return GAME_CONSTANTS.RUSH_DURATION;
    case GAME_MODES.ZEN:
      return GAME_CONSTANTS.ZEN_DURATION;
    default:
      return GAME_CONSTANTS.CLASSIC_DURATION;
  }
}

/**
 * Get target lifetime by mode
 * IMPROVED: Longer lifetimes for better tap windows
 */
export function getTargetLifetime(gameMode) {
  switch (gameMode) {
    case GAME_MODES.RUSH:
      return GAME_CONSTANTS.RUSH_TARGET_LIFETIME;
    case GAME_MODES.ZEN:
      return GAME_CONSTANTS.ZEN_TARGET_LIFETIME;
    default:
      return GAME_CONSTANTS.CLASSIC_TARGET_LIFETIME;
  }
}

/**
 * ELITE v3.0: Generate a new target with support for danger points and power-ups
 * @param {number} width - Game area width
 * @param {number} height - Game area height
 * @param {number} difficulty - Current difficulty level
 * @param {string} gameMode - Current game mode
 * @param {object} theme - Current theme
 * @param {number} playerLevel - Player level for special target spawning
 * @returns {object} Target object with all properties
 */
export function generateTarget(width, height, difficulty, gameMode, theme, playerLevel = 1, ballEmoji = '⚪') {
  const sizeReduction = (difficulty - 1) * GAME_CONSTANTS.DIFFICULTY_SIZE_DECREASE;
  const baseSize = GAME_CONSTANTS.TARGET_BASE_SIZE;
  const size = Math.max(
    baseSize - sizeReduction,
    GAME_CONSTANTS.TARGET_MIN_SIZE
  );
  
  const isDanger = shouldSpawnDangerPoint(playerLevel, gameMode);
  const isPowerUp = !isDanger && shouldSpawnPowerUp(playerLevel, gameMode);
  const isLucky = !isDanger && !isPowerUp && Math.random() < GAME_CONSTANTS.LUCKY_TAP_CHANCE;
  
  const padding = size / 2 + 10;
  const x = padding + Math.random() * (width - size - padding * 2);
  const y = padding + Math.random() * (height - size - padding * 2);
  
  let color;
  if (isDanger) {
    color = DANGER_CONFIG.COLOR;
  } else if (isPowerUp) {
    color = POWERUP_CONFIG.COLOR;
  } else {
    const colors = theme?.particleColors || ['#4ECDC4', '#C56CF0', '#FF6B9D'];
    color = colors[Math.floor(Math.random() * colors.length)];
  }
  
  return {
    id: `target-${Date.now()}-${Math.random()}`,
    x,
    y,
    size,
    color,
    isLucky,
    isDanger,
    isPowerUp,
    ballEmoji,
    createdAt: Date.now(),
  };
}

/**
 * Calculate score with combo multiplier and game mode bonuses
 * IMPROVED v2.0: Enhanced combo scaling
 */
export function calculateScore(basePoints, combo, gameMode, rushMultiplier = 1) {
  let points = basePoints;
  
  // Enhanced combo bonus: score += baseScore * (1 + comboLevel * 0.05)
  if (combo > 0) {
    const comboMultiplier = 1 + (combo * 0.05);
    points = Math.floor(basePoints * comboMultiplier);
  }
  
  // Rush mode multiplier
  if (gameMode === GAME_MODES.RUSH) {
    points = Math.floor(points * rushMultiplier);
  }
  
  return points;
}

/**
 * Get random lucky bonus multiplier
 */
export function getLuckyBonus() {
  const multipliers = GAME_CONSTANTS.LUCKY_TAP_MULTIPLIER;
  return multipliers[Math.floor(Math.random() * multipliers.length)];
}

/**
 * Get theme for player level
 */
export function getThemeForLevel(level) {
  if (level >= 31) return THEMES.QUANTUM_STORM;
  if (level >= 21) return THEMES.PULSE_CORE;
  if (level >= 11) return THEMES.CYBER_TUNNEL;
  if (level >= 6) return THEMES.HYPER_LANE;
  return THEMES.NEON_CITY;
}

/**
 * Check if level unlocks a new theme
 */
export function getThemeUnlock(level) {
  const unlocks = GAME_CONSTANTS.THEME_UNLOCK_LEVELS;
  
  if (level === unlocks.HYPER_LANE) return THEMES.HYPER_LANE;
  if (level === unlocks.CYBER_TUNNEL) return THEMES.CYBER_TUNNEL;
  if (level === unlocks.PULSE_CORE) return THEMES.PULSE_CORE;
  if (level === unlocks.QUANTUM_STORM) return THEMES.QUANTUM_STORM;
  
  return null;
}

/**
 * Check if a game mode is unlocked for the player
 * @param {string} mode - Game mode (GAME_MODES.CLASSIC, RUSH, ZEN)
 * @param {number} playerLevel - Current player level
 * @returns {boolean} - Whether the mode is unlocked
 * 
 * REFLEXION FIX: This function was missing, causing TypeError in ModeSelectorModal
 */
export function isModeUnlocked(mode, playerLevel) {
  // Validate inputs
  if (!mode || typeof playerLevel !== 'number') {
    console.warn('⚠️ isModeUnlocked: Invalid inputs', { mode, playerLevel });
    return false;
  }
  
  // Get unlock level for this mode
  const unlockLevel = GAME_CONSTANTS.MODE_UNLOCK_LEVELS[mode.toUpperCase()];
  
  // If mode not found, default to locked
  if (unlockLevel === undefined) {
    console.warn(`⚠️ isModeUnlocked: Unknown mode "${mode}"`);
    return false;
  }
  
  // Check if player level meets requirement
  return playerLevel >= unlockLevel;
}

/**
 * Get unlock level for a specific mode
 * @param {string} mode - Game mode
 * @returns {number} - Level required to unlock this mode
 */
export function getModeUnlockLevel(mode) {
  return GAME_CONSTANTS.MODE_UNLOCK_LEVELS[mode.toUpperCase()] || 1;
}

/**
 * Get XP required for a specific level
 * @param {number} level - Target level
 * @returns {number} - Total XP required to reach that level
 */
export function getXPRequired(level) {
  if (level <= 0) return 0;
  if (level <= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[level - 1];
  }
  // Beyond level 30: +1500 XP per level
  const lastThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const levelsAbove = level - LEVEL_THRESHOLDS.length;
  return lastThreshold + (levelsAbove * 1500);
}

// Removed duplicate - using v5.0 implementation at line 186

/**
 * Calculate level from total XP
 * @param {number} totalXP - Total accumulated XP
 * @returns {number} - Current level
 */
export function getLevelFromXP(totalXP) {
  // Find the highest level where XP >= threshold
  for (let level = LEVEL_THRESHOLDS.length; level >= 1; level--) {
    if (totalXP >= getXPRequired(level)) {
      return level;
    }
  }
  return 1; // Minimum level
}

/**
 * Add XP and calculate level progression
 * @param {number} currentXP - Current total XP
 * @param {number} currentLevel - Current level
 * @param {number} xpGain - XP to add
 * @returns {object} - { newXP, newLevel, leveledUp }
 */
export function addXP(currentXP, currentLevel, xpGain) {
  const newXP = currentXP + xpGain;
  const newLevel = getLevelFromXP(newXP);
  const leveledUp = newLevel > currentLevel;
  
  return {
    newXP,
    newLevel,
    leveledUp,
    levelsGained: newLevel - currentLevel,
  };
}

/**
 * Get progress percentage to next level
 * @param {number} currentXP - Current total XP
 * @param {number} currentLevel - Current level
 * @returns {number} - Progress percentage (0-100)
 */
export function getXPProgress(currentXP, currentLevel) {
  // CRITICAL FIX: Add safety checks to prevent NaN
  if (!currentXP || currentXP < 0 || !currentLevel || currentLevel < 1) {
    return 0;
  }
  
  const currentThreshold = getXPRequired(currentLevel);
  const nextThreshold = getXPRequired(currentLevel + 1);
  
  // CRITICAL FIX: Validate thresholds to prevent division by zero or NaN
  if (isNaN(currentThreshold) || isNaN(nextThreshold) || currentThreshold < 0 || nextThreshold < 0) {
    console.warn(`⚠️ getXPProgress: Invalid thresholds for level ${currentLevel}`, { currentThreshold, nextThreshold });
    return 0;
  }
  
  const xpIntoLevel = currentXP - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  
  // CRITICAL FIX: Prevent division by zero
  if (xpNeeded <= 0) {
    console.warn(`⚠️ getXPProgress: Zero or negative XP needed for level ${currentLevel}`, { xpNeeded });
    return 100; // If no XP needed, consider it 100% complete
  }
  
  const progress = (xpIntoLevel / xpNeeded) * 100;
  
  // CRITICAL FIX: Validate result and clamp to 0-100
  if (isNaN(progress) || !isFinite(progress)) {
    console.warn(`⚠️ getXPProgress: Invalid progress calculation`, { currentXP, currentLevel, xpIntoLevel, xpNeeded, progress });
    return 0;
  }
  
  return Math.min(100, Math.max(0, progress));
}

/**
 * Calculate combo bonus XP
 * Adds small random bonus for high combo streaks
 * @param {number} maxCombo - Maximum combo achieved
 * @param {number} baseXP - Base XP earned
 * @returns {number} - Bonus XP to add
 */
export function calculateComboBonusXP(maxCombo, baseXP) {
  if (maxCombo < 10) return 0;
  
  // 5-15% bonus for combos 10+
  const bonusPercent = 0.05 + (Math.random() * 0.1);
  const comboMultiplier = Math.min(maxCombo / 10, 3); // Cap at 3x
  
  return Math.floor(baseXP * bonusPercent * comboMultiplier);
}

/**
 * Get combo tier for visual feedback
 * Returns color and label based on combo level
 * @param {number} combo - Current combo count
 * @param {object} theme - Current theme object (optional)
 * @returns {object} - { color, label }
 * 
 * REFLEXION FIX: This function was missing, causing TypeError in ComboBar
 */
export function getComboTier(combo, theme) {
  // Default colors if no theme provided
  const defaultColors = {
    primary: '#4ECDC4',
    secondary: '#C56CF0',
    tertiary: '#FF6B9D',
    legendary: '#FFD93D',
  };
  
  const colors = {
    primary: theme?.primaryColor || defaultColors.primary,
    secondary: theme?.secondaryColor || defaultColors.secondary,
    tertiary: theme?.particleColors?.[2] || defaultColors.tertiary,
    legendary: defaultColors.legendary,
  };
  
  if (combo >= 50) {
    return { color: colors.legendary, label: '🔥 LEGENDARY!' };
  } else if (combo >= 30) {
    return { color: colors.tertiary, label: '⚡ INSANE!' };
  } else if (combo >= 15) {
    return { color: colors.secondary, label: '💥 MEGA!' };
  } else if (combo >= 5) {
    return { color: colors.primary, label: '✨ GREAT!' };
  } else if (combo > 0) {
    return { color: colors.primary, label: '' };
  } else {
    return { color: '#7F8C8D', label: '' };
  }
}

export default {
  GAME_MODES,
  THEMES,
  GAME_CONSTANTS,
  LEVEL_THRESHOLDS,
  DANGER_CONFIG,
  POWERUP_CONFIG, // ELITE v3.0
  calculateDifficulty,
  getDifficultyMultiplier,
  getSpawnInterval,
  getGameDuration,
  getTargetLifetime,
  generateTarget,
  calculateScore,
  getLuckyBonus,
  getThemeForLevel,
  getThemeUnlock,
  isModeUnlocked,
  getModeUnlockLevel,
  getComboTier,
  getXPRequired,
  getXPForNextLevel,
  getLevelFromXP,
  addXP,
  getXPProgress,
  calculateXPNeeded,
  shouldSpawnDangerPoint,
  shouldSpawnPowerUp, // ELITE v3.0
  calculateComboBonusXP,
};
