/**
 * CRITICAL FIX: Global Theme Context for Reflexion
 * Provides theme to all components and handles persistence
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import themeService from '../services/ThemeService';
import { getThemeData } from '../utils/GameLogic';
import { getItemById } from '../data/ShopItems';
import { createPremiumThemeToken, getDefaultPremiumTheme } from '../utils/themeTokens';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [currentThemeId, setCurrentThemeId] = useState('theme_default');
  const [themeData, setThemeData] = useState(null);

  // Load theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const activeTheme = await themeService.getActiveTheme();
        setCurrentThemeId(activeTheme);
        const data = getThemeData(activeTheme);
        
        // 🔴 BUG FIX: Try to get ShopItems theme data to use its colors if available
        let shopItem = null;
        try {
          shopItem = getItemById(activeTheme);
        } catch (e) {
          // ShopItems might not have this theme, use GameLogic theme
        }
        
        // 🎨 PREMIUM ESPORTS: Create premium theme token with standardized structure
        // 🔴 CRITICAL FIX: Pass original theme ID to preserve shop theme identity
        const newThemeData = createPremiumThemeToken(data, shopItem, activeTheme);
        
        // 🔴 CRITICAL FIX: Always create new object reference to ensure React detects change
        setThemeData({
          ...newThemeData,
          _updated: Date.now(), // Force new reference
        });
        console.log(`✅ ThemeContext: Loaded premium theme ${activeTheme}`, {
          name: newThemeData.name,
          accentColor: newThemeData.accentColor,
          backgroundColor: newThemeData.backgroundColor,
          source: shopItem ? 'ShopItems' : 'GameLogic',
        });
      } catch (error) {
        console.error('❌ ThemeContext: Failed to load theme:', error);
        setThemeData(getDefaultPremiumTheme());
      }
    };

    loadTheme();

    // Subscribe to theme changes
    const unsubscribe = themeService.subscribe((newThemeId) => {
      setCurrentThemeId(newThemeId);
      const data = getThemeData(newThemeId);
      
      // 🔴 BUG FIX: Try to get ShopItems theme data to use its colors if available
      let shopItem = null;
      try {
        shopItem = getItemById(newThemeId);
      } catch (e) {
        // ShopItems might not have this theme, use GameLogic theme
      }
      
      // 🎨 PREMIUM ESPORTS: Create premium theme token with standardized structure
      // 🔴 CRITICAL FIX: Pass original theme ID to preserve shop theme identity
      const newThemeData = createPremiumThemeToken(data, shopItem, newThemeId);
      
      // 🔴 CRITICAL FIX: Always create new object reference to ensure React detects change
      setThemeData({
        ...newThemeData,
        _updated: Date.now(), // Force new reference
      });
      console.log('🎨 THEME CONTEXT UPDATED (via subscription):', {
        themeId: newThemeId,
        name: newThemeData.name,
        accentColor: newThemeData.accentColor,
        backgroundColor: newThemeData.backgroundColor,
        source: shopItem ? 'ShopItems' : 'GameLogic',
      });
    });

    return unsubscribe;
  }, []);

  // Change theme function
  const changeTheme = useCallback(async (themeId) => {
    try {
      const success = await themeService.setActiveTheme(themeId);
      if (success) {
        setCurrentThemeId(themeId);
        const data = getThemeData(themeId);
        
        // 🔴 BUG FIX: Try to get ShopItems theme data to use its colors if available
        let shopItem = null;
        try {
          shopItem = getItemById(themeId);
        } catch (e) {
          // ShopItems might not have this theme, use GameLogic theme
        }
        
        // 🎨 PREMIUM ESPORTS: Create premium theme token with standardized structure
        // 🔴 CRITICAL FIX: Pass original theme ID to preserve shop theme identity
        const newThemeData = createPremiumThemeToken(data, shopItem, themeId);
        
        // 🔴 CRITICAL FIX: Always create new object reference to ensure React detects change
        // Force new object by spreading and adding timestamp
        setThemeData({
          ...newThemeData,
          _updated: Date.now(), // Force new reference
        });
        console.log('🎨 THEME CONTEXT UPDATED:', {
          themeId,
          name: newThemeData.name,
          accentColor: newThemeData.accentColor,
          backgroundColor: newThemeData.backgroundColor,
          gradientColors: newThemeData.gradientColors,
          source: shopItem ? 'ShopItems' : 'GameLogic',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ ThemeContext: Failed to change theme:', error);
      return false;
    }
  }, []);

  const value = {
    currentThemeId,
    themeData: themeData || getDefaultPremiumTheme(),
    changeTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    console.warn('⚠️ useTheme must be used within ThemeProvider');
    return {
      currentThemeId: 'theme_default',
      themeData: getDefaultPremiumTheme(),
      changeTheme: async () => false,
    };
  }
  return context;
}


