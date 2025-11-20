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
  
  // ✅ TASK 1: Speed Test (Time-Attack Mode) Constants
  SPEED_TOTAL_TARGETS: 50, // Default total targets (can be overridden)
  SPEED_TEST_RESULTS_FREEZE_MS: 400, // UI freeze duration after completion
  SPEED_TEST_TARGET_COUNTS: [20, 30, 40, 50], // Available target counts
  SPEED_TEST_UNLOCK_LEVELS: {
    20: 1,  // Level 1: Unlock 20 targets
    30: 5,  // Level 5: Unlock 30 targets
    40: 10, // Level 10: Unlock 40 targets
    50: 15, // Level 15: Unlock 50 targets
  },
};

/**
 * REFLEXION AAA - PROGRESSIVE XP SYSTEM
 * Mobile game industry standard progression curve
 * 
 * Level Tiers:
 * 1-5:   Beginner    (100 XP/level)  - Hızlı ilerleme, oyuncuyu tutar
 * 6-10:  Casual      (200 XP/level)  - Orta hız, mekanikler öğrenilir
 * 11-20: Dedicated   (400 XP/level)  - Ciddi oyuncular için challenge
 * 21-30: Hardcore    (800 XP/level)  - Uzun vadeli hedef
 * 31+:   Legendary   (1200 XP/level) - Sonsuz ilerleme
 */

// XP Tier Sistemini Tanımla
const XP_TIERS = {
  BEGINNER: { start: 1, end: 5, xpPerLevel: 100 },
  CASUAL: { start: 6, end: 10, xpPerLevel: 200 },
  DEDICATED: { start: 11, end: 20, xpPerLevel: 400 },
  HARDCORE: { start: 21, end: 30, xpPerLevel: 800 },
  LEGENDARY: { start: 31, end: Infinity, xpPerLevel: 1200 },
};

/**
 * Belirli bir level için hangi tier'da olduğunu bul
 */
function getTierForLevel(level) {
  if (level <= XP_TIERS.BEGINNER.end) return XP_TIERS.BEGINNER;
  if (level <= XP_TIERS.CASUAL.end) return XP_TIERS.CASUAL;
  if (level <= XP_TIERS.DEDICATED.end) return XP_TIERS.DEDICATED;
  if (level <= XP_TIERS.HARDCORE.end) return XP_TIERS.HARDCORE;
  return XP_TIERS.LEGENDARY;
}

/**
 * Bir level'a ulaşmak için gereken toplam XP'yi hesapla
 * @param {number} targetLevel - Hedef level (1-indexed)
 * @returns {number} Toplam gereken XP
 */
export function calculateXPNeeded(targetLevel) {
  if (targetLevel <= 1) return 0;
  
  let totalXP = 0;
  
  // Her level için kümülatif XP hesapla
  for (let level = 1; level < targetLevel; level++) {
    const tier = getTierForLevel(level);
    totalXP += tier.xpPerLevel;
  }
  
  return totalXP;
}

/**
 * Mevcut level'dan bir sonraki level'a gereken XP
 * @param {number} currentLevel - Şu anki level
 * @returns {number} Bir sonraki level için gereken XP
 */
export function getXPForNextLevel(currentLevel) {
  if (currentLevel < 1) return 100;
  const tier = getTierForLevel(currentLevel);
  return tier.xpPerLevel;
}

// Pre-calculate first 50 levels for performance
export const LEVEL_THRESHOLDS = Array.from({ length: 51 }, (_, i) => 
  calculateXPNeeded(i + 1)
);

/**
 * Toplam XP'den level hesapla
 * @param {number} totalXP - Toplam kazanılmış XP
 * @returns {number} Mevcut level
 */
export function getLevelFromXP(totalXP) {
  if (totalXP <= 0) return 1;
  
  let level = 1;
  let accumulatedXP = 0;
  
  // XP yeterli olduğu sürece level'i artır
  while (accumulatedXP + getXPForNextLevel(level) <= totalXP) {
    accumulatedXP += getXPForNextLevel(level);
    level++;
    
    // Sonsuz döngü koruması
    if (level > 1000) {
      console.warn('⚠️ Level calculation exceeded 1000, capping');
      break;
    }
  }
  
  return level;
}

/**
 * Player progression objesi (single source of truth)
 * @param {number} totalXP - Toplam XP
 * @returns {object} { level, currentXp, xpToNextLevel, totalXp }
 */
export function getPlayerProgress(totalXP) {
  const safeTotalXP = typeof totalXP === 'number' && !isNaN(totalXP) ? Math.max(0, Math.floor(totalXP)) : 0;
  
  const level = getLevelFromXP(safeTotalXP);
  const xpForCurrentLevel = calculateXPNeeded(level);
  const xpToNextLevel = getXPForNextLevel(level);
  const currentXp = safeTotalXP - xpForCurrentLevel;
  
  return {
    level: Math.max(1, level),
    currentXp: Math.max(0, Math.floor(currentXp)),
    xpToNextLevel: Math.max(100, xpToNextLevel),
    totalXp: safeTotalXP,
  };
}

/**
 * XP progress yüzdesi (0-100)
 * @param {number} totalXP - Toplam XP
 * @returns {number} Progress (0-100)
 */
export function getXPProgress(totalXP) {
  const progress = getPlayerProgress(totalXP);
  if (progress.xpToNextLevel <= 0) return 0;
  return Math.min(100, Math.max(0, (progress.currentXp / progress.xpToNextLevel) * 100));
}

/**
 * Level tier bilgisi (UI için)
 * @param {number} level - Level
 * @returns {object} { name, color, icon }
 */
export function getLevelTierInfo(level) {
  if (level <= 5) return { name: 'Beginner', color: '#4ECDC4', icon: '🌟' };
  if (level <= 10) return { name: 'Casual', color: '#00D9FF', icon: '⚡' };
  if (level <= 20) return { name: 'Dedicated', color: '#C56CF0', icon: '🔥' };
  if (level <= 30) return { name: 'Hardcore', color: '#FF6B9D', icon: '💎' };
  return { name: 'Legendary', color: '#FFD93D', icon: '👑' };
}

// Debug log - Progression curve
console.log('🎮 AAA XP Progression Curve:');
console.log('Level 2:', calculateXPNeeded(2), 'XP (need', getXPForNextLevel(1), ')');
console.log('Level 5:', calculateXPNeeded(5), 'XP (need', getXPForNextLevel(4), ')');
console.log('Level 6:', calculateXPNeeded(6), 'XP (need', getXPForNextLevel(5), ')');
console.log('Level 10:', calculateXPNeeded(10), 'XP (need', getXPForNextLevel(9), ')');
console.log('Level 11:', calculateXPNeeded(11), 'XP (need', getXPForNextLevel(10), ')');
console.log('Level 20:', calculateXPNeeded(20), 'XP (need', getXPForNextLevel(19), ')');
console.log('Level 21:', calculateXPNeeded(21), 'XP (need', getXPForNextLevel(20), ')');
console.log('Level 30:', calculateXPNeeded(30), 'XP (need', getXPForNextLevel(29), ')');
console.log('Level 31:', calculateXPNeeded(31), 'XP (need', getXPForNextLevel(30), ')');

// ELITE v3.0: Danger Point System Configuration
export const DANGER_CONFIG = {
  MIN_LEVEL: 1, // CRITICAL FIX: Start spawning danger points at level 1
  BASE_CHANCE: 0.05, // 5% base spawn rate
  CHANCE_PER_LEVEL: 0.01, // +1% per level (was 0.5%)
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
  // BUG #7 FIX: Only in Rush mode (NOT in Zen or Speed Test)
  if (gameMode !== GAME_MODES.RUSH || gameMode === GAME_MODES.ZEN || gameMode === GAME_MODES.SPEED_TEST || playerLevel < DANGER_CONFIG.MIN_LEVEL) {
    return false;
  }
  
  // BUG #7 FIX: Spawn probability: baseChance = 10% + (level * 5%)
  // Level 1: 10% + (1 * 5%) = 15%
  // Level 5: 10% + (5 * 5%) = 35%
  // Level 10: 10% + (10 * 5%) = 60% (capped at 40%)
  const baseChance = 0.10; // BUG #7 FIX: 10% base (was 5%)
  const chancePerLevel = 0.05; // BUG #7 FIX: 5% per level (was 1%)
  const chance = Math.min(
    baseChance + (playerLevel * chancePerLevel),
    0.40 // BUG #7 FIX: Cap at 40% (was 25%)
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
 * Get target lifetime by mode and player level
 * IMPROVED: Dynamic lifetime decreases as level increases (faster pacing)
 * Minimum lifetime: 350ms (prevents impossible gameplay)
 * @param {string} gameMode - Current game mode
 * @param {number} playerLevel - Current player level (default: 1)
 * @returns {number} Target lifetime in milliseconds
 */
export function getTargetLifetime(gameMode, playerLevel = 1) {
  // Base lifetime by mode
  let baseLifetime;
  switch (gameMode) {
    case GAME_MODES.RUSH:
      baseLifetime = GAME_CONSTANTS.RUSH_TARGET_LIFETIME;
      break;
    case GAME_MODES.ZEN:
      baseLifetime = GAME_CONSTANTS.ZEN_TARGET_LIFETIME;
      break;
    case GAME_MODES.SPEED_TEST:
      baseLifetime = 2000; // Speed Test uses fixed lifetime
      return baseLifetime;
    default:
      baseLifetime = GAME_CONSTANTS.CLASSIC_TARGET_LIFETIME;
  }
  
  // CRITICAL FIX: Decrease lifetime as level increases
  // Formula: baseLifetime - (level - 1) * reductionPerLevel
  // Level 1: 100% of base lifetime
  // Level 10: ~70% of base lifetime
  // Level 20: ~50% of base lifetime
  const reductionPerLevel = baseLifetime * 0.015; // 1.5% reduction per level
  const lifetimeReduction = (playerLevel - 1) * reductionPerLevel;
  const adjustedLifetime = baseLifetime - lifetimeReduction;
  
  // Enforce minimum lifetime (350ms)
  const MIN_LIFETIME = 350;
  return Math.max(MIN_LIFETIME, Math.floor(adjustedLifetime));
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
/**
 * Check if a position overlaps with existing targets
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} size - Target size
 * @param {Array} existingTargets - Array of existing target objects
 * @param {number} minDistance - Minimum distance between targets (default: 1.5x size)
 * @returns {boolean} - True if position overlaps
 */
function isPositionOverlapping(x, y, size, existingTargets, minDistance = 1.5) {
  const minDist = size * minDistance;
  for (const target of existingTargets) {
    const dx = x - target.x;
    const dy = y - target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < minDist) {
      return true;
    }
  }
  return false;
}

export function generateTarget(width, height, difficulty, gameMode, theme, playerLevel = 1, ballEmoji = '⚪', existingTargets = []) {
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
  
  // CRITICAL FIX: Prevent target overlap in Rush mode (and other modes)
  // Try up to 20 times to find a non-overlapping position
  let x, y;
  let attempts = 0;
  const maxAttempts = 20;
  
  do {
    x = padding + Math.random() * (width - size - padding * 2);
    y = padding + Math.random() * (height - size - padding * 2);
    attempts++;
    
    // If we've tried too many times, use the position anyway (prevents infinite loop)
    if (attempts >= maxAttempts) {
      break;
    }
  } while (isPositionOverlapping(x, y, size, existingTargets, gameMode === GAME_MODES.RUSH ? 1.5 : 1.2));
  
  let color;
  if (isDanger) {
    color = DANGER_CONFIG.COLOR;
  } else if (isPowerUp) {
    color = POWERUP_CONFIG.COLOR;
  } else {
    const colors = theme?.particleColors || ['#4ECDC4', '#C56CF0', '#FF6B9D'];
    color = colors[Math.floor(Math.random() * colors.length)];
  }
  
  // 🔴 EMOJI FIX: Assign emoji based on target type with safe fallbacks
  let emoji;
  if (isDanger) {
    emoji = '⚠️'; // Warning emoji for danger targets
  } else if (isPowerUp) {
    emoji = '💎'; // Diamond emoji for reward targets
  } else if (isLucky) {
    emoji = '⭐'; // Star emoji for lucky targets
  } else {
    // 🔴 SAFE_EMOJI_PATCH: Use safe fallback for ball emoji
    emoji = ballEmoji ?? '⭕'; // Use ball emoji if provided, otherwise default circle
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
    emoji, // 🔴 EMOJI FIX: Always include emoji property
    createdAt: Date.now(),
    isProcessing: false, // 🔴 KRİTİK DÜZELTME: İşleniyor bayrağı - tap ses ve animasyon için
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
 * CRITICAL FIX: Get theme data by theme ID (for ThemeContext)
 * @param {string} themeId - Theme ID (e.g., 'theme_default', 'neon_city', etc.)
 * @returns {object} Theme object
 */
export function getThemeData(themeId) {
  if (!themeId) return THEMES.NEON_CITY;
  
  // 🔴 BUG #1 FIX: Complete theme ID mapping (handles both 'theme_neon_city' and 'neon_city' formats)
  // Map shop theme IDs (with 'theme_' prefix) to GameLogic THEMES
  const themeMap = {
    'theme_default': THEMES.NEON_CITY,
    'theme_neon_city': THEMES.NEON_CITY,
    'theme_hyper_lane': THEMES.HYPER_LANE,
    'theme_cyber_tunnel': THEMES.CYBER_TUNNEL,
    'theme_pulse_core': THEMES.PULSE_CORE,
    'theme_quantum_storm': THEMES.QUANTUM_STORM,
    // Also support without prefix (for backward compatibility)
    'neon_city': THEMES.NEON_CITY,
    'hyper_lane': THEMES.HYPER_LANE,
    'cyber_tunnel': THEMES.CYBER_TUNNEL,
    'pulse_core': THEMES.PULSE_CORE,
    'quantum_storm': THEMES.QUANTUM_STORM,
    // Map shop theme IDs that don't exist in THEMES to closest match
    'theme_ocean': THEMES.CYBER_TUNNEL, // Ocean -> Cyber Tunnel (blue theme)
    'theme_sunset': THEMES.PULSE_CORE, // Sunset -> Pulse Core (warm colors)
    'theme_forest': THEMES.HYPER_LANE, // Forest -> Hyper Lane (green/purple)
    'theme_space': THEMES.QUANTUM_STORM, // Space -> Quantum Storm (dark/cosmic)
    'theme_volcano': THEMES.PULSE_CORE, // Volcano -> Pulse Core (red/pink)
    'theme_ice': THEMES.CYBER_TUNNEL, // Ice -> Cyber Tunnel (blue/cyan)
    'theme_matrix': THEMES.QUANTUM_STORM, // Matrix -> Quantum Storm (dark/green)
    'theme_galaxy': THEMES.QUANTUM_STORM, // Galaxy -> Quantum Storm
    'theme_gold': THEMES.PULSE_CORE, // Gold -> Pulse Core (yellow/gold)
  };
  
  // Check if themeId matches any theme's id property
  for (const themeKey in THEMES) {
    if (THEMES[themeKey].id === themeId) {
      return THEMES[themeKey];
    }
  }
  
  // Fallback to mapped theme or default
  const mappedTheme = themeMap[themeId];
  if (mappedTheme) {
    console.log(`🎨 Theme mapped: ${themeId} → ${mappedTheme.name}`);
    return mappedTheme;
  }
  
  console.warn(`⚠️ Unknown theme ID: ${themeId}, using default`);
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
  return calculateXPNeeded(level);
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

// Removed duplicate getXPProgress - using AAA version above (line 268)

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
  getPlayerProgress,
  getThemeData,
  shouldSpawnDangerPoint,
  shouldSpawnPowerUp, // ELITE v3.0
  calculateComboBonusXP,
  // ✅ TASK 1: Speed Test (Time-Attack Mode) Helpers
  getSpeedTestSpawnCount,
  calculateSpeedTestRank,
  formatTime,
  isSpeedTestTargetCountUnlocked,
  getSpeedTestTargetCountUnlockLevel,
  getAvailableSpeedTestTargetCounts,
};

/**
 * ✅ TASK 1: Speed Test (Time-Attack Mode) Helper Functions
 * Modular helpers for professional time-attack gameplay
 */

/**
 * Check if a Speed Test target count is unlocked for the player
 * @param {number} targetCount - Target count to check (20, 30, 40, or 50)
 * @param {number} playerLevel - Current player level
 * @returns {boolean} Whether the target count is unlocked
 */
export function isSpeedTestTargetCountUnlocked(targetCount, playerLevel) {
  const unlockLevel = GAME_CONSTANTS.SPEED_TEST_UNLOCK_LEVELS[targetCount];
  return unlockLevel !== undefined && playerLevel >= unlockLevel;
}

/**
 * Get unlock level for a Speed Test target count
 * @param {number} targetCount - Target count (20, 30, 40, or 50)
 * @returns {number} Required level to unlock, or null if invalid
 */
export function getSpeedTestTargetCountUnlockLevel(targetCount) {
  return GAME_CONSTANTS.SPEED_TEST_UNLOCK_LEVELS[targetCount] || null;
}

/**
 * Get available Speed Test target counts for the player
 * @param {number} playerLevel - Current player level
 * @returns {Array<number>} Array of unlocked target counts
 */
export function getAvailableSpeedTestTargetCounts(playerLevel) {
  return GAME_CONSTANTS.SPEED_TEST_TARGET_COUNTS.filter(count => 
    isSpeedTestTargetCountUnlocked(count, playerLevel)
  );
}

/**
 * Calculate how many targets should spawn simultaneously based on remaining targets
 * @param {number} remaining - Number of targets remaining to complete
 * @returns {number} Number of targets to spawn (1-5)
 */
export function getSpeedTestSpawnCount(remaining) {
  if (remaining > 35) return Math.floor(Math.random() * 2) + 1; // 1-2 targets
  if (remaining > 20) return Math.floor(Math.random() * 2) + 2; // 2-3 targets
  if (remaining > 10) return Math.floor(Math.random() * 2) + 3; // 3-4 targets
  return Math.floor(Math.random() * 2) + 4; // 4-5 targets
}

/**
 * Calculate rank tier based on completion time
 * @param {number} finalTimeMs - Total time in milliseconds
 * @returns {string} Rank tier (S/A/B/C)
 */
export function calculateSpeedTestRank(finalTimeMs) {
  const timeSeconds = finalTimeMs / 1000;
  if (timeSeconds < 15) return 'S'; // Elite: < 15s
  if (timeSeconds < 20) return 'A'; // Excellent: < 20s
  if (timeSeconds < 30) return 'B'; // Good: < 30s
  return 'C'; // Average: >= 30s
}

/**
 * Format time in milliseconds to readable string (3 decimals)
 * @param {number} timeMs - Time in milliseconds
 * @returns {string} Formatted time string (e.g., "12.345")
 */
export function formatTime(timeMs) {
  return (timeMs / 1000).toFixed(3);
}
