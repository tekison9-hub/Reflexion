import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { createSafeStyleSheet } from '../utils/safeStyleSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalState } from '../contexts/GlobalStateContext';

export default function AchievementsScreen({ navigation, playerData: propPlayerData }) {
  // ✅ TASK 2 FIX: Safe playerData with null checks and AsyncStorage fallback
  const { playerData: globalPlayerData } = useGlobalState();
  const [localPlayerData, setLocalPlayerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use prop data if available, otherwise use global context, otherwise load from storage
  const playerData = propPlayerData || globalPlayerData || localPlayerData || {
    gamesPlayed: 0,
    maxCombo: 0,
    highScore: 0,
    xp: 0,
    coins: 0,
  };
  
  // SAFE DIMENSIONS PATTERN
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const update = () => setScreenDimensions(Dimensions.get('window'));
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove?.();
  }, []);

  // ✅ TASK 2 FIX: Load player data from AsyncStorage if not available
  useEffect(() => {
    const loadPlayerData = async () => {
      try {
        if (propPlayerData || globalPlayerData) {
          setIsLoading(false);
          return;
        }
        
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const data = await AsyncStorage.getItem('@reflexion_player_data');
        if (data) {
          const parsed = JSON.parse(data);
          setLocalPlayerData(parsed);
        }
      } catch (error) {
        console.warn('⚠️ AchievementsScreen: Could not load player data:', error);
        // Use safe defaults
        setLocalPlayerData({
          gamesPlayed: 0,
          maxCombo: 0,
          highScore: 0,
          xp: 0,
          coins: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPlayerData();
  }, [propPlayerData, globalPlayerData]);

  // === AAA ACHIEVEMENTS: Expanded tiered system (20+ achievements) ===
  const totalXP = playerData?.totalXp ?? playerData?.xp ?? 0;
  const level = Math.floor(totalXP / 100) + 1; // Simple level calculation
  
  const achievements = [
    // Games Played Tiers
    { id: 'first_win', name: 'First Victory', desc: 'Complete your first game', unlocked: (playerData?.gamesPlayed || 0) >= 1 },
    { id: 'games_10', name: 'Novice', desc: 'Play 10 games', unlocked: (playerData?.gamesPlayed || 0) >= 10 },
    { id: 'games_25', name: 'Regular', desc: 'Play 25 games', unlocked: (playerData?.gamesPlayed || 0) >= 25 },
    { id: 'games_50', name: 'Dedicated', desc: 'Play 50 games', unlocked: (playerData?.gamesPlayed || 0) >= 50 },
    { id: 'games_100', name: 'Veteran', desc: 'Play 100 games', unlocked: (playerData?.gamesPlayed || 0) >= 100 },
    { id: 'games_250', name: 'Master', desc: 'Play 250 games', unlocked: (playerData?.gamesPlayed || 0) >= 250 },
    
    // Score Tiers
    { id: 'score_100', name: 'Speedster I', desc: 'Score 100 points', unlocked: (playerData?.highScore || 0) >= 100 },
    { id: 'score_250', name: 'Speedster II', desc: 'Score 250 points', unlocked: (playerData?.highScore || 0) >= 250 },
    { id: 'score_500', name: 'High Scorer', desc: 'Score 500 points', unlocked: (playerData?.highScore || 0) >= 500 },
    { id: 'score_1000', name: 'Elite Player', desc: 'Score 1000 points', unlocked: (playerData?.highScore || 0) >= 1000 },
    { id: 'score_2000', name: 'God Mode', desc: 'Score 2000 points', unlocked: (playerData?.highScore || 0) >= 2000 },
    
    // Combo Tiers
    { id: 'combo_5', name: 'Combo Starter', desc: 'Reach 5x combo', unlocked: (playerData?.maxCombo || 0) >= 5 },
    { id: 'combo_10', name: 'Combo Master', desc: 'Reach 10x combo', unlocked: (playerData?.maxCombo || 0) >= 10 },
    { id: 'combo_20', name: 'Combo Legend', desc: 'Reach 20x combo', unlocked: (playerData?.maxCombo || 0) >= 20 },
    { id: 'combo_30', name: 'Combo God', desc: 'Reach 30x combo', unlocked: (playerData?.maxCombo || 0) >= 30 },
    { id: 'combo_50', name: 'Combo Deity', desc: 'Reach 50x combo', unlocked: (playerData?.maxCombo || 0) >= 50 },
    
    // Level Tiers
    { id: 'level_5', name: 'Rising Star', desc: 'Reach level 5', unlocked: level >= 5 },
    { id: 'level_10', name: 'Pro Tapper', desc: 'Reach level 10', unlocked: level >= 10 },
    { id: 'level_20', name: 'Expert', desc: 'Reach level 20', unlocked: level >= 20 },
    { id: 'level_30', name: 'Elite', desc: 'Reach level 30', unlocked: level >= 30 },
    
    // Coins Tiers
    { id: 'coins_100', name: 'Collector', desc: 'Collect 100 total coins', unlocked: (playerData?.coins || 0) >= 100 },
    { id: 'coins_500', name: 'Wealthy', desc: 'Collect 500 total coins', unlocked: (playerData?.coins || 0) >= 500 },
    { id: 'coins_1000', name: 'Rich', desc: 'Collect 1000 total coins', unlocked: (playerData?.coins || 0) >= 1000 },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progress = (unlockedCount / totalCount) * 100;

  // ✅ TASK 2 FIX: Show loading state while data loads
  if (isLoading || screenDimensions.width === 0) {
    return <View style={styles.container} />;
  }
  
  // ✅ TASK 2 FIX: Graceful return if navigation missing
  if (!navigation) {
    console.warn('⚠️ AchievementsScreen: Navigation not available');
    return <View style={styles.container}><Text style={styles.title}>Achievements</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏅 Achievements</Text>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {unlockedCount} / {totalCount} Unlocked
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {achievements.map(ach => (
          <View
            key={ach.id}
            style={[
              styles.achievementCard,
              ach.unlocked && styles.achievementCardUnlocked,
            ]}
          >
            <View style={styles.achievementIcon}>
              <Text style={styles.achievementIconText}>
                {ach.unlocked ? '✅' : '🔒'}
              </Text>
            </View>
            <View style={styles.achievementInfo}>
              <Text style={[styles.achievementName, !ach.unlocked && styles.achievementLocked]}>
                {ach.name}
              </Text>
              <Text style={styles.achievementDesc}>{ach.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = createSafeStyleSheet({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#4ECDC4',
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    color: '#4ECDC4',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: '#4ECDC4',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
  },
  progressText: {
    color: '#BDC3C7',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#2C3E50',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  achievementCard: {
    backgroundColor: 'rgba(44, 62, 80, 0.5)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2C3E50',
  },
  achievementCardUnlocked: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  achievementIconText: {
    fontSize: 32,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    color: '#4ECDC4',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementLocked: {
    color: '#7F8C8D',
  },
  achievementDesc: {
    color: '#BDC3C7',
    fontSize: 14,
  },
});
