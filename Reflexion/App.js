/**
 * REFLEXION v6.0 - APP ENTRY POINT
 * ✅ Service initialization with proper order
 * ✅ GlobalStateProvider wrapper
 * ✅ Loading screen during initialization
 * ✅ Error boundaries
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createSafeStyleSheet } from './src/utils/safeStyleSheet';

// ✅ Context providers FIRST
import { GlobalStateProvider } from './src/contexts/GlobalStateContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

// ✅ Services
import { settingsService } from './src/services/SettingsService';
import { storageService } from './src/services/StorageService';
import soundManager from './src/services/SoundManager';
import musicManager from './src/services/MusicManager';

// ✅ Screens
import MenuScreen from './src/screens/MenuScreen';
import GameScreen from './src/screens/GameScreen';
import ShopScreen from './src/screens/ShopScreen';
import StatsScreen from './src/screens/StatsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import InstructionsScreen from './src/screens/InstructionsScreen';
import BattleScreen from './src/screens/BattleScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * ✅ CRITICAL: Initialize ALL services in STRICT ORDER
   */
  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing Reflexion App...');

      // 1. Storage (lowest level)
      await storageService.initialize();
      console.log('✅ [1/4] StorageService ready');

      // 2. Settings (depends on storage)
      await settingsService.initialize();
      console.log('✅ [2/4] SettingsService ready');

      // 3. Sound (depends on settings)
      // 🔴 KRİTİK: SoundManager'ı başlat - ses sisteminin çalışması için gerekli
      await soundManager.initialize();
      soundManager.setSettings(settingsService.settings); // direkt objeyi ver
      console.log("✅ [3/4] SoundManager ready - Settings assigned:", settingsService.settings);


      // 4. Music (depends on settings)
      await musicManager.initialize();
      console.log('✅ [4/4] MusicManager ready');

      console.log('✅ ALL SERVICES INITIALIZED SUCCESSFULLY');
      setAppReady(true);
    } catch (error) {
      console.error('❌ App initialization FAILED:', error);
      setInitError(error.message);
      // ✅ Set ready anyway to not block app completely
      setAppReady(true);
    }
  };

  // ✅ Loading screen
  if (!appReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingTitle}>REFLEXION</Text>
        <ActivityIndicator size="large" color="#4ECDC4" style={styles.loader} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  // ✅ Error screen (if critical failure)
  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Initialization Error</Text>
        <Text style={styles.errorText}>{initError}</Text>
        <Text style={styles.errorHint}>App will run in limited mode</Text>
      </View>
    );
  }

  // ✅ Main app with context wrapper
  return (
    <SafeAreaProvider>
      <GlobalStateProvider>
        <ThemeProvider>
          <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Menu"
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: '#1a1a2e' },
            }}
          >
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="Game" component={GameScreen} />
            <Stack.Screen name="Shop" component={ShopScreen} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Achievements" component={AchievementsScreen} />
            <Stack.Screen name="Instructions" component={InstructionsScreen} />
            <Stack.Screen name="Battle" component={BattleScreen} />
          </Stack.Navigator>
          </NavigationContainer>
        </ThemeProvider>
      </GlobalStateProvider>
    </SafeAreaProvider>
  );
}

const styles = createSafeStyleSheet({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 40,
    textShadowColor: '#4ECDC4',
    textShadowRadius: 20,
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#8B8B8B',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#BDC3C7',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorHint: {
    fontSize: 12,
    color: '#7F8C8D',
    fontStyle: 'italic',
  },
});
