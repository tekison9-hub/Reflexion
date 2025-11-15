import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GlobalStateContext = createContext(null);

const DEFAULT_PLAYER_DATA = {
  coins: 0,
  xp: 0,
  level: 1,
  highScore: 0,
  maxCombo: 0,
  gamesPlayed: 0,
};

export const GlobalStateProvider = ({ children }) => {
  const [playerData, setPlayerData] = useState(DEFAULT_PLAYER_DATA);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Load player data on mount
  useEffect(() => {
    loadPlayerData();
  }, []);

  const loadPlayerData = async () => {
    try {
      const data = await AsyncStorage.getItem('@player_data');
      if (data) {
        const parsed = JSON.parse(data);
        setPlayerData({ ...DEFAULT_PLAYER_DATA, ...parsed });
      }
      console.log('✅ Player data loaded');
    } catch (error) {
      console.error('❌ Failed to load player data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePlayerData = async (newData) => {
    try {
      const updated = { ...playerData, ...newData };
      await AsyncStorage.setItem('@player_data', JSON.stringify(updated));
      setPlayerData(updated);
    } catch (error) {
      console.error('❌ Failed to save player data:', error);
    }
  };

  const updatePlayerData = async (updates) => {
    await savePlayerData(updates);
  };

  const addCoins = async (amount) => {
    await savePlayerData({ coins: playerData.coins + amount });
  };

  const spendCoins = async (amount) => {
    if (playerData.coins >= amount) {
      await savePlayerData({ coins: playerData.coins - amount });
      return true;
    }
    return false;
  };

  const addXP = async (amount) => {
    await savePlayerData({ xp: playerData.xp + amount });
  };

  const value = {
    playerData,
    updatePlayerData,
    addCoins,
    spendCoins,
    addXP,
    isLoading,
  };

  // ✅ Don't render children until data is loaded
  if (isLoading) {
    return null; // or a loading screen
  }

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
};

/**
 * ✅ CRITICAL FIX: Safe hook with proper error handling
 */
export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  
  if (!context) {
    // ✅ Return safe defaults instead of throwing
    console.warn('⚠️ useGlobalState used outside GlobalStateProvider, returning defaults');
    return {
      playerData: DEFAULT_PLAYER_DATA,
      updatePlayerData: async () => {},
      addCoins: async () => {},
      spendCoins: async () => false,
      addXP: async () => {},
      isLoading: false,
    };
  }
  
  return context;
};

export default GlobalStateContext;
