/**
 * REFLEXION v6.0 - GLOBAL STATE CONTEXT (FIXED)
 * ✅ Sonsuz döngü düzeltildi
 * ✅ XP hesaplama mantığı düzeltildi
 * ✅ Classic/Rush XP artışı çalışıyor
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPlayerProgress } from '../utils/GameLogic';

const GlobalStateContext = createContext(null);
const STORAGE_KEY = '@reflexion_player_data';

const DEFAULT_PLAYER_DATA = {
  coins: 0,
  totalXp: 0, // ✅ KAYNAK: totalXp (tek source of truth)
  level: 1,
  currentXp: 0,
  xpToNextLevel: 100,
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

// ✅ FIX: Normalizasyon sadece ilk yüklemede, kaydetmeden
function normalizePlayerData(data) {
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_PLAYER_DATA };
  }

  // ✅ totalXp'yi belirle (öncelik sırası: data.totalXp > data.xp > 0)
  const totalXp = typeof data.totalXp === 'number' ? data.totalXp : 
                  typeof data.xp === 'number' ? data.xp : 0;

  // ✅ GameLogic'den progression hesapla
  const progress = getPlayerProgress(totalXp);

  return {
    ...DEFAULT_PLAYER_DATA,
    ...data,
    totalXp: progress.totalXp,
    level: progress.level,
    currentXp: progress.currentXp,
    xpToNextLevel: progress.xpToNextLevel,
    xp: progress.totalXp, // Backward compat
  };
}

export const GlobalStateProvider = ({ children }) => {
  const [playerData, setPlayerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false); // ✅ B3: Add isInitialized flag

  // ✅ İlk yükleme (sadece 1 kez)
  useEffect(() => {
    loadPlayerData();
  }, []);

  const loadPlayerData = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (data) {
        const parsed = JSON.parse(data);
        const normalized = normalizePlayerData(parsed);
        setPlayerData(normalized);
        console.log('✅ Player data loaded:', {
          level: normalized.level,
          totalXp: normalized.totalXp,
          currentXp: normalized.currentXp
        });
      } else {
        // İlk kez - default kaydet
        const initial = { ...DEFAULT_PLAYER_DATA };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        setPlayerData(initial);
        console.log('✅ Initial data created');
      }
    } catch (error) {
      console.error('❌ Load error:', error);
      setPlayerData({ ...DEFAULT_PLAYER_DATA });
    } finally {
      setIsLoading(false);
      setIsInitialized(true); // ✅ B3: Mark as initialized after load completes
    }
  };

  // ✅ Refresh fonksiyonu (ekranlarda kullanılacak)
  const refreshPlayerData = useCallback(async () => {
    await loadPlayerData();
  }, []);

  // ✅ Save fonksiyonu - direkt kaydet, normalize etme
  const savePlayerData = useCallback(async (updates) => {
    try {
      // CRITICAL FIX: Always read from storage first to get latest data (prevents race conditions)
      let current = DEFAULT_PLAYER_DATA;
      
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          current = JSON.parse(stored);
        } else {
          // Fallback to state if storage is empty
          current = playerData || DEFAULT_PLAYER_DATA;
        }
      } catch (e) {
        console.warn('⚠️ Could not read from storage, using state:', e);
        current = playerData || DEFAULT_PLAYER_DATA;
      }
      
      // Merge updates
      const merged = { ...current, ...updates };
      
      // Calculate progression if totalXp exists
      if (typeof merged.totalXp === 'number') {
        const progress = getPlayerProgress(merged.totalXp);
        merged.level = progress.level;
        merged.currentXp = progress.currentXp;
        merged.xpToNextLevel = progress.xpToNextLevel;
        merged.xp = progress.totalXp;
      }
      
      // CRITICAL FIX: Await the save operation to ensure it completes before returning
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      
      // Update state after successful save
      setPlayerData(merged);
      console.log('✅ Data saved:', {
        level: merged.level,
        totalXp: merged.totalXp,
        currentXp: merged.currentXp
      });
      
      return true;
    } catch (error) {
      console.error('❌ Save error:', error);
      return false;
    }
  }, [playerData]);

  const addXP = useCallback(async (amount) => {
    if (typeof amount !== 'number' || amount <= 0) {
      console.warn('⚠️ Invalid XP amount:', amount);
      return false;
    }
    
    // CRITICAL FIX: Read from storage directly to get latest XP (prevents race conditions)
    let currentTotalXp = 0;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        currentTotalXp = parsed.totalXp || parsed.xp || 0;
      } else {
        // Fallback to state if storage is empty
        currentTotalXp = (playerData?.totalXp || playerData?.xp || 0);
      }
    } catch (e) {
      console.warn('⚠️ Could not read XP from storage, using state:', e);
      currentTotalXp = (playerData?.totalXp || playerData?.xp || 0);
    }
    
    const newTotalXp = currentTotalXp + amount;
    
    console.log(`💎 Adding ${amount} XP: ${currentTotalXp} → ${newTotalXp}`);
    
    // CRITICAL FIX: Await the save to ensure it completes
    const success = await savePlayerData({ totalXp: newTotalXp });
    
    if (success) {
      console.log(`✅ XP successfully added. New total: ${newTotalXp}`);
    } else {
      console.error(`❌ Failed to save XP. Amount: ${amount}, Current: ${currentTotalXp}`);
    }
    
    return success;
  }, [playerData, savePlayerData]);

  const addCoins = useCallback(async (amount) => {
    if (typeof amount !== 'number' || amount <= 0) return false;
    const current = playerData || DEFAULT_PLAYER_DATA;
    return await savePlayerData({ coins: (current.coins || 0) + amount });
  }, [playerData, savePlayerData]);

  const updatePlayerData = useCallback(async (updates) => {
    return await savePlayerData(updates);
  }, [savePlayerData]);

  const resetProgress = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    const reset = { ...DEFAULT_PLAYER_DATA };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
    setPlayerData(reset);
    console.log('✅ Progress reset');
    return true;
  }, []);

  // CRITICAL FIX: Don't return null - always render provider to prevent black screen
  // The children (MainApp) will handle showing loading screen if needed
  return (
    <GlobalStateContext.Provider value={{
      playerData: playerData || DEFAULT_PLAYER_DATA,
      savePlayerData,
      loadPlayerData,
      refreshPlayerData,
      addXP,
      addCoins,
      updatePlayerData,
      resetProgress,
      isLoading,
      isInitialized, // ✅ B3: Export isInitialized flag
    }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    return {
      playerData: { ...DEFAULT_PLAYER_DATA },
      savePlayerData: async () => false,
      loadPlayerData: async () => {},
      refreshPlayerData: async () => {},
      addXP: async () => false,
      addCoins: async () => false,
      updatePlayerData: async () => false,
      resetProgress: async () => false,
      isLoading: false,
      isInitialized: false, // ✅ B3: Default to false if context not available
    };
  }
  return context;
};

export default GlobalStateContext;
