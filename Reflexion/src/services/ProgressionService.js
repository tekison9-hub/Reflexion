/**
 * REFLEXXP ULTIMATE - PROGRESSION SERVICE
 * Advanced XP and level progression system
 * 
 * Features:
 * - Exponential XP curve with soft cap at level 50
 * - Combo, accuracy, and speed bonuses
 * - Level-up animations and rewards
 * - Achievement tracking
 */

const BASE_XP_ULTIMATE = 100;
const XP_EXPONENT = 1.4;
const SOFT_CAP_LEVEL = 50;

/**
 * Calculate cumulative XP needed to reach a specific level
 * Exponential growth before level 50, linear after
 */
export function calculateXPNeeded(level) {
  if (level <= 1) return 0;
  
  let totalXP = 0;
  
  for (let i = 1; i < level; i++) {
    if (i < SOFT_CAP_LEVEL) {
      // Exponential growth: 100 * i^1.4
      totalXP += Math.floor(BASE_XP_ULTIMATE * Math.pow(i, XP_EXPONENT));
    } else {
      // Linear growth after soft cap
      const softCapXP = Math.floor(BASE_XP_ULTIMATE * Math.pow(SOFT_CAP_LEVEL, XP_EXPONENT));
      const levelsAboveCap = i - SOFT_CAP_LEVEL;
      totalXP += softCapXP + (levelsAboveCap * 500);
    }
  }
  
  return Math.floor(totalXP);
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(currentLevel) {
  if (currentLevel < SOFT_CAP_LEVEL) {
    return Math.floor(BASE_XP_ULTIMATE * Math.pow(currentLevel, XP_EXPONENT));
  } else {
    const softCapXP = Math.floor(BASE_XP_ULTIMATE * Math.pow(SOFT_CAP_LEVEL, XP_EXPONENT));
    const levelsAboveCap = currentLevel - SOFT_CAP_LEVEL;
    return softCapXP + (levelsAboveCap * 500);
  }
}

/**
 * Get level from total XP
 */
export function getLevelFromXP(totalXP) {
  if (totalXP <= 0) return 1;
  
  // Binary search for efficiency
  let low = 1;
  let high = 200;
  
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (calculateXPNeeded(mid) <= totalXP) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  
  return low;
}

/**
 * Calculate XP earned with bonuses
 * Factors: accuracy, combo, speed, difficulty
 */
export function calculateXPEarned(gameStats) {
  const {
    baseXP = 100,
    accuracy = 100,
    maxCombo = 0,
    completionTime,
    targetTime,
    difficulty = 1,
  } = gameStats;

  let totalXP = baseXP;

  // Accuracy bonus (up to +50%)
  if (accuracy >= 100) {
    totalXP += baseXP * 0.5;
  } else if (accuracy >= 90) {
    totalXP += baseXP * 0.3;
  } else if (accuracy >= 80) {
    totalXP += baseXP * 0.1;
  }

  // Combo bonus (up to +30%)
  const comboBonus = Math.min(maxCombo / 100, 0.3);
  totalXP += baseXP * comboBonus;

  // Speed bonus (up to +20%)
  if (completionTime && targetTime && completionTime < targetTime) {
    const speedRatio = 1 - (completionTime / targetTime);
    const speedBonus = Math.min(speedRatio * 0.4, 0.2);
    totalXP += baseXP * speedBonus;
  }

  // Difficulty multiplier
  totalXP *= (1 + (difficulty - 1) * 0.1);

  return Math.floor(totalXP);
}

/**
 * Pre-calculated level thresholds for performance
 */
export const LEVEL_THRESHOLDS = Array.from({ length: 101 }, (_, i) => 
  calculateXPNeeded(i + 1)
);

// Log progression curve
console.log('📊 ReflexXP ULTIMATE XP Curve:', {
  'Level 2': `${calculateXPNeeded(2)} XP (need ${getXPForNextLevel(1)})`,
  'Level 3': `${calculateXPNeeded(3)} XP (need ${getXPForNextLevel(2)})`,
  'Level 5': `${calculateXPNeeded(5)} XP (need ${getXPForNextLevel(4)})`,
  'Level 10': `${calculateXPNeeded(10)} XP (need ${getXPForNextLevel(9)})`,
  'Level 20': `${calculateXPNeeded(20)} XP (need ${getXPForNextLevel(19)})`,
  'Level 50': `${calculateXPNeeded(50)} XP (soft cap)`,
  'Level 100': `${calculateXPNeeded(100)} XP`,
});

export default {
  calculateXPNeeded,
  getXPForNextLevel,
  getLevelFromXP,
  calculateXPEarned,
  LEVEL_THRESHOLDS,
  BASE_XP_ULTIMATE,
  XP_EXPONENT,
  SOFT_CAP_LEVEL,
};

































