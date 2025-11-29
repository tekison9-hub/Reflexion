/**
 * REFLEXION - ULTIMATE VERSION (SDK 52)
 * ✅ State-Based Navigation: All screens integrated
 * ✅ Global State & Theme Providers
 * ✅ Full game functionality restored
 */

import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, Platform, UIManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Providers
import { GlobalStateProvider } from './src/contexts/GlobalStateContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

// Services
import soundManager from './src/services/SoundManager.js';
import musicManager from './src/services/MusicManager';
import { settingsService } from './src/services/SettingsService';

// Screens
import MenuScreen from './src/screens/MenuScreen';
import GameScreen from './src/screens/GameScreen';
import StatsScreen from './src/screens/StatsScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import ShopScreen from './src/screens/ShopScreen';
import InstructionsScreen from './src/screens/InstructionsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import BattleScreen from './src/screens/BattleScreen';
import LoadingScreen from './src/screens/LoadingScreen';

// Error Boundary
import ErrorBoundary from './src/components/ErrorBoundary';

// Enable native driver for all animations (Android optimization)
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Disable console logs in production
if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

// Main App Component with State-Based Navigation
function MainApp() {
  const [currentScreen, setCurrentScreen] = useState('MENU');
  const [routeParams, setRouteParams] = useState({});
  const [navigationHistory, setNavigationHistory] = useState(['MENU']);
  const [isReady, setIsReady] = useState(false);

  // Initialize services on mount - strict audio lifecycle
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // 1. Initialize settings service FIRST
        if (settingsService?.init) {
          await settingsService.init();
        }
        
        // 2. Initialize SoundManager audio mode
        await soundManager.init();
        
        // 3. Load all sounds AFTER init completes
        await soundManager.loadAllSounds();
        
        // 4. Initialize MusicManager (does NOT play music)
        await musicManager.init();
        
        // 5. NOW play menu music (after all initialization is complete)
        await musicManager.playMenuMusic();
        
        setIsReady(true);
      } catch (error) {
        console.warn('⚠️ Service initialization warning:', error);
        setIsReady(true); // Show app anyway
      }
    };

    initializeServices();
  }, []);

  // CRITICAL FIX: All hooks must be called before any conditional returns
  // Create navigation object for screens
  const navigateCallback = useCallback((screenName, params = {}) => {
    setNavigationHistory(prev => [...prev, currentScreen]);
    setRouteParams(params);
    setCurrentScreen(screenName);
  }, [currentScreen]);
  
  const goBackCallback = useCallback(() => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Remove current screen
      const previousScreen = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      setCurrentScreen(previousScreen);
      setRouteParams({});
    } else {
      // If no history, go to menu
      setNavigationHistory(['MENU']);
      setCurrentScreen('MENU');
      setRouteParams({});
    }
  }, [navigationHistory]);
  
  const resetCallback = useCallback(() => {
    setNavigationHistory(['MENU']);
    setCurrentScreen('MENU');
    setRouteParams({});
  }, []);

  // Now create navigation object (after all hooks)
  const navigation = {
    navigate: navigateCallback,
    goBack: goBackCallback,
    reset: resetCallback,
  };

  // Conditional return AFTER all hooks
  if (!isReady) {
    return <LoadingScreen />;
  }

  // Create route object for screens
  const route = {
    params: routeParams,
  };

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'MENU':
        return <MenuScreen navigation={navigation} route={route} />;
      
      case 'Game':
        return (
          <GameScreen
            navigation={navigation}
            route={route}
          />
        );
      
      case 'Stats':
        return <StatsScreen navigation={navigation} route={route} />;
      
      case 'Achievements':
        return <AchievementsScreen navigation={navigation} route={route} />;
      
      case 'Shop':
        return <ShopScreen navigation={navigation} route={route} />;
      
      case 'Instructions':
        return <InstructionsScreen navigation={navigation} route={route} />;
      
      case 'Leaderboard':
        return <LeaderboardScreen navigation={navigation} route={route} />;
      
      case 'Battle':
        return <BattleScreen navigation={navigation} route={route} />;
      
      case 'DailyChallenge':
        // DailyChallenge can be handled by MenuScreen or a separate screen
        // For now, navigate to Game with a special mode
        return (
          <GameScreen
            navigation={navigation}
            route={{ params: { mode: 'daily' } }}
          />
        );
      
      default:
        return <MenuScreen navigation={navigation} route={route} />;
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      {renderScreen()}
    </>
  );
}

// Root App Component with Providers
export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GlobalStateProvider>
          <ThemeProvider>
            <MainApp />
          </ThemeProvider>
        </GlobalStateProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
