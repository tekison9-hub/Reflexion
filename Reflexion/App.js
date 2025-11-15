import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Orbitron_400Regular, Orbitron_700Bold, Orbitron_900Black } from '@expo-google-fonts/orbitron';

// ============================================================================
// SUPPRESS EXPO-AV DEPRECATION WARNING (SDK54 SAFE UNTIL EXPO-AUDIO STABLE)
// ============================================================================
LogBox.ignoreLogs([
  'Expo AV has been deprecated',
  'ExpoAV',
  'expo-av',
]);

// ✅ CRITICAL FIX: Import and initialize services BEFORE anything else
import { settingsService } from './src/services/SettingsService';
import soundManager from './src/services/SoundManager';
import musicManager from './src/services/MusicManager';
import { storageService } from './src/services/StorageService';
import { adService } from './src/services/AdService';
import progressTracker from './src/services/ProgressTracker';
import leaderboardService from './src/services/LeaderboardService';

import ErrorBoundary from './src/components/ErrorBoundary';
import { GlobalStateProvider } from './src/contexts/GlobalStateContext';
import MenuScreen from './src/screens/MenuScreen';
import GameScreen from './src/screens/GameScreen';
import ShopScreen from './src/screens/ShopScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import InstructionsScreen from './src/screens/InstructionsScreen';
import BattleScreen from './src/screens/BattleScreen';
import StatsScreen from './src/screens/StatsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import dailyChallengeService from './src/services/DailyChallengeService';

import { COLORS } from './src/styles/theme';
import { areFontsReady, getNavigationFonts } from './src/utils/fonts';

// CRITICAL: Prevent auto-hide until fonts loaded
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [servicesReady, setServicesReady] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [playerData, setPlayerData] = useState({
    xp: 0,
    coins: 0,
    highScore: 0,
    maxCombo: 0,
    gamesPlayed: 0,
    streak: 0,
  });

  // ELITE v3.0: ROBUST FONT LOADING with comprehensive error handling
  const [fontsLoaded, fontError] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Orbitron_900Black,
  });

  // ✅ CRITICAL FIX: Initialize all services on app startup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing Reflexion App...');
        
        // ✅ Initialize in strict order
        await storageService.initialize();
        console.log('✅ StorageService ready');
        
        await settingsService.initialize();
        console.log('✅ SettingsService ready');
        
        const settings = settingsService.get();
        soundManager.setSettings(settings);
        
        await soundManager.initialize();
        console.log('✅ SoundManager ready');
        
        await musicManager.initialize();
        console.log('✅ MusicManager ready');
        
        setServicesReady(true);
        console.log('✅ All services initialized successfully');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        setServicesReady(true); // Continue anyway
      }
    };

    initializeApp();
  }, []);

  // Hide splash screen when fonts ready (loaded or error)
  useEffect(() => {
    const hideSplash = async () => {
      try {
        if (fontsLoaded || fontError) {
          await SplashScreen.hideAsync();
          console.log('✅ Splash screen hidden');
        }
      } catch (error) {
        console.warn('⚠️ Splash screen hide error (non-critical):', error);
      }
    };
    hideSplash();
  }, [fontsLoaded, fontError]);

  // Initialize services ONLY after fonts are ready
  useEffect(() => {
    async function prepare() {
      // DEFENSIVE: Wait for fonts before proceeding
      if (!areFontsReady(fontsLoaded, fontError)) {
        console.log('⏳ Waiting for fonts...');
        return;
      }

      if (fontError) {
        console.error('❌ Font loading failed, using system fonts:', fontError);
      } else {
        console.log('✅ Fonts loaded successfully');
      }

      try {
        // Wait for services to be ready
        if (!servicesReady) {
          console.log('⏳ Waiting for services...');
          return;
        }

        // Initialize remaining services
        console.log('🔄 Initializing remaining services...');
        
        await progressTracker.initialize();
        console.log('✅ ProgressTracker ready');
        
        await leaderboardService.initialize();
        console.log('✅ LeaderboardService ready');
        
        await adService.initialize();
        console.log('✅ AdService ready');
        
        await dailyChallengeService.initialize();
        console.log('✅ DailyChallengeService ready');

        // Subscribe to settings changes for SoundManager
        try {
          if (settingsService && typeof settingsService.subscribe === 'function') {
            settingsService.subscribe((settings) => {
              if (soundManager && typeof soundManager.setSettings === 'function') {
                soundManager.setSettings(settings);
              }
            });
            console.log('✅ Settings subscription wired to SoundManager');
          }
        } catch (settingsError) {
          console.error('❌ Failed to wire settings subscription:', settingsError);
          // Don't block app startup if settings wiring fails
        }

        // Load player data
        try {
          const savedData = await storageService.getItem('playerData');
          if (savedData) {
            setPlayerData(savedData);
            console.log('✅ Player data loaded');
          }
        } catch (dataError) {
          console.warn('⚠️ Failed to load player data:', dataError);
        }

        console.log('🎮 Reflexion initialized successfully');
      } catch (e) {
        console.error('❌ App initialization error:', e);
        console.error('Error stack:', e.stack);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, [fontsLoaded, fontError, servicesReady]);

  // REFLEXION FIX: Enhanced sound system health monitoring with auto-recovery
  useEffect(() => {
    if (!isReady) return;

    console.log('🔊 Starting enhanced sound system health monitor...');
    
    const checkSoundHealth = async () => {
      try {
        const healthy = await soundManager.isHealthy();
        
        if (!healthy) {
          console.warn('⚠️ Sound system unhealthy - initiating recovery...');
          const status = soundManager.getAudioStatus();
          console.warn('Status:', {
            initialized: status.isInitialized,
            loaded: status.loadedSounds,
            failed: status.failedSounds,
            health: `${status.healthPercent}%`,
          });
          
          // Auto-recover if sound system is broken
          if (!soundManager.isInitializing) {
            await soundManager.reinitialize();
            
            const recoveredHealthy = await soundManager.isHealthy();
            if (recoveredHealthy) {
              console.info('✅ Sound system recovered successfully');
            } else {
              console.error('❌ Sound system recovery failed');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error during sound health check:', error);
      }
    };

    // Check health every 10 seconds
    const healthCheckInterval = setInterval(checkSoundHealth, 10000);
    
    // Run initial health check after 2 seconds
    const initialCheck = setTimeout(checkSoundHealth, 2000);

    return () => {
      console.log('🛑 Stopping sound health monitor');
      clearInterval(healthCheckInterval);
      clearTimeout(initialCheck);
    };
  }, [isReady]);

  const updatePlayerData = useCallback((newData) => {
    setPlayerData(newData);
  }, []);

  // CRITICAL: Block rendering until fonts ready
  if (!fontsLoaded && !fontError) {
    return null; // Show nothing until fonts load or fail
  }

  // ✅ Show loading screen while services initialize
  if (!servicesReady || !isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.neonCyan} />
        <Text style={styles.loadingText}>Loading Reflexion...</Text>
        <Text style={styles.loadingSubtext}>
          {!servicesReady ? 'Initializing services...' : fontError ? 'Using system fonts' : 'Custom fonts loaded'}
        </Text>
      </View>
    );
  }

  // SAFE: Navigation theme with font fallback
  const navigationTheme = {
    dark: true,
    colors: {
      primary: COLORS.neonCyan,
      background: COLORS.background,
      card: COLORS.cardBackground,
      text: COLORS.textPrimary,
      border: COLORS.cardBorder,
      notification: COLORS.neonMagenta,
    },
    fonts: getNavigationFonts(fontsLoaded && !fontError),
  };

  return (
    <ErrorBoundary>
      <GlobalStateProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: COLORS.background },
            }}
          >
            <Stack.Screen name="Menu">
              {(props) => (
                <MenuScreen {...props} playerData={playerData} onUpdateData={updatePlayerData} />
              )}
            </Stack.Screen>
            <Stack.Screen name="Game">
              {(props) => (
                <GameScreen {...props} playerData={playerData} onUpdateData={updatePlayerData} />
              )}
            </Stack.Screen>
            <Stack.Screen name="Shop">
              {(props) => (
                <ShopScreen {...props} playerData={playerData} onUpdateData={updatePlayerData} />
              )}
            </Stack.Screen>
            <Stack.Screen name="Achievements">
              {(props) => <AchievementsScreen {...props} playerData={playerData} />}
            </Stack.Screen>
            <Stack.Screen name="Stats">
              {(props) => <StatsScreen {...props} playerData={playerData} />}
            </Stack.Screen>
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Instructions" component={InstructionsScreen} />
            <Stack.Screen name="Battle">
              {(props) => <BattleScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="DailyChallenge">
              {(props) => (
                <GameScreen {...props} playerData={playerData} onUpdateData={updatePlayerData} route={{ params: { mode: 'DAILY_CHALLENGE' } }} />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </GlobalStateProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.neonCyan,
    fontSize: 24,
    marginTop: 20,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  loadingSubtext: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 2,
  },
});
