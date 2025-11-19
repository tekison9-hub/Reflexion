/**
 * REFLEXION v6.0 - GLOBAL STATE CONTEXT
 * ✅ Safe provider with loading state
 * ✅ Default fallbacks for all methods
 * ✅ AsyncStorage integration
 * ✅ Error handling
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GlobalStateContext = createContext(null);

const STORAGE_KEY = '@reflexion_player_data';

// CRITICAL FIX: Default player data with full progression model
// Level 1, 0 XP = level 1, 0 currentXp, 100 xpToNextLevel, 0 totalXp
const DEFAULT_PLAYER_DATA = {
  coins: 0,
  xp: 0, // Source of truth
  level: 1,
  currentXp: 0,
  xpToNextLevel: 100, // BASE_XP = 100 for level 1 → 2
  totalXp: 0,
  highScore: 0,
  maxCombo: 0,
  gamesPlayed: 0,
  unlockedThemes: ['theme_default'],
  activeTheme: 'theme_default',
  activeBall: 'ball_default',
  activeParticle: 'particle_default',
  achievements: [],
  dailyStreak: 0,
  lastLoginDate: null,
};

/**
 * CRITICAL FIX: Normalize player data to ensure all progression fields exist
 * This function MUST be called immediately after loading data from storage
 * @param {object} data - Raw player data (may be incomplete)
 * @returns {object} Normalized player data with all required fields
 */
function normalizePlayerData(data) {
  try {
    // CRITICAL: Always start with a copy of defaults to ensure totalXp exists
    const normalized = { ...DEFAULT_PLAYER_DATA };
    
    // If no data provided, return defaults
    if (!data || typeof data !== 'object') {
      return normalized;
    }

    // CRITICAL: Merge data, but skip undefined/null values that would overwrite defaults
    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        normalized[key] = data[key];
      }
    }

    // CRITICAL: Safely require GameLogic (wrap in try-catch)
    let getPlayerProgress;
    try {
      const gameLogic = require('../utils/GameLogic');
      getPlayerProgress = gameLogic.getPlayerProgress;
    } catch (requireError) {
      console.error('❌ Failed to require GameLogic:', requireError);
      // Return defaults if require fails
      return normalized;
    }
    
    // CRITICAL: Determine totalXp (source of truth)
    // Priority: data.totalXp > data.xp > 0
    // CRITICAL FIX: Use safe access pattern to prevent ReferenceError
    let totalXp = 0;
    
    // Check if totalXp exists and is valid (safe access)
    try {
      const totalXpValue = normalized?.totalXp;
      if (typeof totalXpValue === 'number' && !isNaN(totalXpValue)) {
        totalXp = Math.max(0, Math.floor(totalXpValue));
      } else {
        // Fallback to xp property (safe access)
        const xpValue = normalized?.xp;
        if (typeof xpValue === 'number' && !isNaN(xpValue)) {
          totalXp = Math.max(0, Math.floor(xpValue));
        } else {
          totalXp = 0;
        }
      }
    } catch (accessError) {
      console.error('❌ CRITICAL: Error accessing totalXp/xp:', accessError);
      totalXp = 0;
    }
    
    // Calculate all progression fields from totalXp
    // CRITICAL FIX: Ensure totalXp is a valid number before calling getPlayerProgress
    let progress;
    try {
      // CRITICAL FIX: Validate totalXp is a number before passing to getPlayerProgress
      const validTotalXp = typeof totalXp === 'number' && !isNaN(totalXp) ? Math.max(0, totalXp) : 0;
      progress = getPlayerProgress(validTotalXp);
      
      // CRITICAL FIX: Verify progress object has all required fields
      if (!progress || typeof progress !== 'object' || progress === null) {
        throw new Error('getPlayerProgress returned invalid result');
      }
      
      // Ensure progress has totalXp
      if (progress.totalXp === undefined || progress.totalXp === null || isNaN(progress.totalXp)) {
        progress.totalXp = validTotalXp;
      }
    } catch (progressError) {
      console.error('❌ Failed to get player progress:', progressError);
      // Use defaults if calculation fails
      const safeTotalXp = typeof totalXp === 'number' && !isNaN(totalXp) ? Math.max(0, totalXp) : 0;
      progress = {
        level: 1,
        currentXp: 0,
        xpToNextLevel: 100,
        totalXp: safeTotalXp,
      };
    }
    
    // CRITICAL: Ensure all four fields are integers (no undefined, null, NaN)
    normalized.xp = totalXp; // Source of truth
    normalized.level = Math.max(1, Math.floor(progress.level || 1));
    normalized.currentXp = Math.max(0, Math.floor(progress.currentXp || 0));
    normalized.xpToNextLevel = Math.max(100, Math.floor(progress.xpToNextLevel || 100));
    normalized.totalXp = totalXp; // CRITICAL: Always set totalXp
    
    // Validate all numeric fields
    normalized.coins = typeof normalized.coins === 'number' && !isNaN(normalized.coins) ? Math.max(0, Math.floor(normalized.coins)) : 0;
    normalized.highScore = typeof normalized.highScore === 'number' && !isNaN(normalized.highScore) ? Math.max(0, Math.floor(normalized.highScore)) : 0;
    normalized.maxCombo = typeof normalized.maxCombo === 'number' && !isNaN(normalized.maxCombo) ? Math.max(0, Math.floor(normalized.maxCombo)) : 0;
    normalized.gamesPlayed = typeof normalized.gamesPlayed === 'number' && !isNaN(normalized.gamesPlayed) ? Math.max(0, Math.floor(normalized.gamesPlayed)) : 0;
    normalized.dailyStreak = typeof normalized.dailyStreak === 'number' && !isNaN(normalized.dailyStreak) ? Math.max(0, Math.floor(normalized.dailyStreak)) : 0;
    
    // CRITICAL: Final verification - ensure totalXp exists (safe access)
    try {
      if (normalized?.totalXp === undefined || normalized?.totalXp === null || isNaN(normalized?.totalXp)) {
        normalized.totalXp = 0;
      }
    } catch (verifyError) {
      console.error('❌ CRITICAL: Error verifying totalXp:', verifyError);
      normalized.totalXp = 0;
    }
    
    return normalized;
  } catch (error) {
    console.error('❌ CRITICAL: normalizePlayerData failed:', error);
    // Return safe defaults on any error
    return { ...DEFAULT_PLAYER_DATA };
  }
}

export const GlobalStateProvider = ({ children }) => {
  // CRITICAL FIX: Initialize with normalized data
  const [playerData, setPlayerData] = useState(() => normalizePlayerData(DEFAULT_PLAYER_DATA));
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ Load player data on mount
  useEffect(() => {
    loadPlayerData();
  }, []);

  const loadPlayerData = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const { debugLog } = require('../utils/debugLog');
      
      let normalizedData;
      
      if (data) {
        try {
          const parsed = JSON.parse(data);
          // CRITICAL FIX: Normalize IMMEDIATELY after parsing
          normalizedData = normalizePlayerData(parsed);
        } catch (parseError) {
          console.error('❌ Failed to parse player data:', parseError);
          normalizedData = normalizePlayerData(null);
        }
      } else {
        console.log('ℹ️ No saved data, using defaults');
        normalizedData = normalizePlayerData(null);
      }
      
      // CRITICAL FIX: Save normalized data back to storage BEFORE setting state
      // This ensures persistence even if app crashes before next save
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedData));
      } catch (saveError) {
        console.warn('⚠️ Failed to save normalized data:', saveError);
      }
      
      // CRITICAL FIX: Final verification before setting state (safe access)
      if (!normalizedData || typeof normalizedData !== 'object' || normalizedData === null || 
          (normalizedData?.totalXp === undefined && !('totalXp' in normalizedData))) {
        console.error('❌ CRITICAL: Normalized data missing totalXp, using defaults');
        normalizedData = normalizePlayerData(DEFAULT_PLAYER_DATA);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedData));
      }
      
      // CRITICAL FIX: Set state AFTER normalization and persistence
      const wasInitialized = isInitialized;
      setPlayerData(normalizedData);
      
      // CRITICAL FIX PRIORITY 3: Disable excessive debug logging
      // Only log on initial load, not on every reload
      if (!wasInitialized) {
        debugLog('Normalized Player Data', {
          xp: normalizedData.xp,
          level: normalizedData.level,
          currentXp: normalizedData.currentXp,
          xpToNextLevel: normalizedData.xpToNextLevel,
          totalXp: normalizedData.totalXp,
        });
        
        console.log('✅ Player data loaded and normalized:', {
          xp: normalizedData.xp,
          level: normalizedData.level,
          currentXp: normalizedData.currentXp,
          xpToNextLevel: normalizedData.xpToNextLevel,
          totalXp: normalizedData.totalXp,
        });
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Failed to load player data:', error);
      // CRITICAL FIX: Use normalized defaults on error
      const normalizedDefaults = normalizePlayerData(null);
      setPlayerData(normalizedDefaults);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  const savePlayerData = useCallback(async (newData) => {
    try {
      // CRITICAL FIX: Ensure current playerData is normalized first
      const currentNormalized = normalizePlayerData(playerData);
      
      // CRITICAL FIX: Merge data first, then normalize to ensure all fields exist
      const merged = { ...currentNormalized, ...newData };
      
      // CRITICAL FIX: Always normalize before saving (runtime guard)
      const normalized = normalizePlayerData(merged);
      
      // CRITICAL FIX: Final verification before saving (safe access)
      if (!normalized || typeof normalized !== 'object' || normalized === null || 
          (normalized?.totalXp === undefined && !('totalXp' in normalized))) {
        console.error('❌ CRITICAL: Normalized data missing totalXp, using defaults');
        const fallback = normalizePlayerData(DEFAULT_PLAYER_DATA);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
        setPlayerData(fallback);
        return false;
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      setPlayerData(normalized);
      return true;
    } catch (error) {
      console.error('❌ Failed to save player data:', error);
      // CRITICAL FIX: Auto-repair on save failure
      try {
        const repaired = normalizePlayerData(playerData || DEFAULT_PLAYER_DATA);
        // CRITICAL FIX: Safe access check
        if (repaired && typeof repaired === 'object' && repaired !== null && 
            (repaired?.totalXp !== undefined || 'totalXp' in repaired)) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(repaired));
          setPlayerData(repaired);
        } else {
          const fallback = normalizePlayerData(DEFAULT_PLAYER_DATA);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
          setPlayerData(fallback);
        }
      } catch (repairError) {
        console.error('❌ Failed to repair player data:', repairError);
        // Last resort: set defaults
        const fallback = normalizePlayerData(DEFAULT_PLAYER_DATA);
        setPlayerData(fallback);
      }
      return false;
    }
  }, [playerData]);

  const updatePlayerData = useCallback(async (updates) => {
    return await savePlayerData(updates);
  }, [savePlayerData]);

  const addCoins = useCallback(async (amount) => {
    if (typeof amount !== 'number' || amount < 0) {
      console.warn('⚠️ Invalid coin amount:', amount);
      return false;
    }
    // CRITICAL FIX: Normalize before accessing coins
    const normalized = normalizePlayerData(playerData);
    return await savePlayerData({ coins: (normalized.coins || 0) + amount });
  }, [playerData, savePlayerData]);

  const spendCoins = useCallback(async (amount) => {
    if (typeof amount !== 'number' || amount < 0) {
      console.warn('⚠️ Invalid coin amount:', amount);
      return false;
    }
    // CRITICAL FIX: Normalize before accessing coins
    const normalized = normalizePlayerData(playerData);
    const currentCoins = normalized.coins || 0;
    if (currentCoins >= amount) {
      return await savePlayerData({ coins: currentCoins - amount });
    }
    console.warn('⚠️ Insufficient coins');
    return false;
  }, [playerData, savePlayerData]);

  const addXP = useCallback(async (amount) => {
    if (typeof amount !== 'number' || amount < 0) {
      console.warn('⚠️ Invalid XP amount:', amount);
      return false;
    }
    
    // CRITICAL FIX: Ensure playerData is normalized before accessing
    const normalized = normalizePlayerData(playerData);
    const { getPlayerProgress } = require('../utils/GameLogic');
    
    // CRITICAL FIX: Use normalized xp/totalXp as source of truth (safe access)
    const currentXp = normalized?.totalXp ?? normalized?.xp ?? 0;
    const newXP = currentXp + amount;
    const progress = getPlayerProgress(newXP);
    
    // CRITICAL FIX: Update all four fields via savePlayerData (which normalizes)
    return await savePlayerData({
      xp: progress.totalXp, // Source of truth
      level: progress.level,
      currentXp: progress.currentXp,
      xpToNextLevel: progress.xpToNextLevel,
      totalXp: progress.totalXp,
    });
  }, [playerData, savePlayerData]);

  const resetProgress = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      // CRITICAL FIX: Use normalized defaults
      const resetData = normalizePlayerData(DEFAULT_PLAYER_DATA);
      setPlayerData(resetData);
      // Save normalized reset data
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(resetData));
      console.log('✅ Progress reset:', resetData);
      return true;
    } catch (error) {
      console.error('❌ Failed to reset progress:', error);
      return false;
    }
  }, []);

  // CRITICAL FIX: Ensure playerData always has totalXp before exposing it
  let safePlayerData;
  try {
    // CRITICAL FIX: Use safe access pattern
    const hasTotalXp = playerData && typeof playerData === 'object' && playerData !== null && 
                       ('totalXp' in playerData || playerData?.totalXp !== undefined);
    
    if (hasTotalXp) {
      // Verify totalXp is actually valid (safe access)
      const totalXpValue = playerData?.totalXp;
      if (typeof totalXpValue === 'number' && !isNaN(totalXpValue)) {
        safePlayerData = playerData;
      } else {
        safePlayerData = normalizePlayerData(playerData);
      }
    } else {
      safePlayerData = normalizePlayerData(playerData);
    }
  } catch (safetyError) {
    console.error('❌ CRITICAL: Error in safePlayerData check:', safetyError);
    safePlayerData = normalizePlayerData(DEFAULT_PLAYER_DATA);
  }

  const value = {
    playerData: safePlayerData,
    savePlayerData,
    loadPlayerData,
    updatePlayerData,
    addCoins,
    spendCoins,
    addXP,
    resetProgress,
    isLoading,
    isInitialized,
  };

  // ✅ Show loading indicator while data loads
  if (isLoading) {
    return null; // App.js handles loading screen
  }

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
};

/**
 * ✅ SAFE HOOK: Returns defaults if context not available
 */
export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);

  if (!context) {
    console.warn('⚠️ useGlobalState used outside GlobalStateProvider');
    // ✅ Return safe defaults instead of crashing
    // CRITICAL FIX: Use normalized defaults
    return {
      playerData: normalizePlayerData(DEFAULT_PLAYER_DATA),
      savePlayerData: async () => false,
      loadPlayerData: async () => {},
      updatePlayerData: async () => false,
      addCoins: async () => false,
      spendCoins: async () => false,
      addXP: async () => false,
      resetProgress: async () => false,
      isLoading: false,
      isInitialized: false,
    };
  }

  return context;
};

export default GlobalStateContext;
