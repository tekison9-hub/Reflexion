/**
 * REFLEXION v3.0 - STATS & PROFILE SCREEN
 * Comprehensive player statistics and achievements
 * Major value-add feature for market sale ($2,000-$3,000)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '../hooks/useFocusEffect';
import { createSafeStyleSheet } from '../utils/safeStyleSheet';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLevelFromXP } from '../utils/GameLogic';
import soundManager from '../services/SoundManager.js';
import theme from '../styles/theme';
import { useGlobalState } from '../contexts/GlobalStateContext';

const { TYPOGRAPHY } = theme;

export default function StatsScreen({ navigation }) {
  // 🔴 FIX #2: Use GlobalStateContext for player data
  const { playerData, loadPlayerData, refreshPlayerData, isInitialized } = useGlobalState();
  
  // ✅ B3: Don't render until GlobalState is initialized
  if (!isInitialized) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a1a' }}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={{ color: '#4ECDC4', marginTop: 16 }}>Loading...</Text>
      </SafeAreaView>
    );
  }
  
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    highScoreClassic: 0,
    highScoreRush: 0,
    highScoreZen: 0,
    totalXP: 0,
    fastestReaction: 0,
    totalPlaytime: 0,
    averageAccuracy: 0,
    totalCoins: 0,
    maxCombo: 0,
    perfectGames: 0,
    totalTaps: 0,
    // === AAA STATS: Per-mode games played ===
    gamesPlayedClassic: 0,
    gamesPlayedRush: 0,
    gamesPlayedZen: 0,
    gamesPlayedSpeedTest: 0,
  });
  const [loading, setLoading] = useState(true);

  const isLoadingRef = useRef(false); // ✅ Loading guard

  // AAA FIX: Reactively update stats when playerData changes
  useEffect(() => {
    if (!isInitialized || !playerData) return;
    
    // Recalculate stats when playerData changes
    const updateStats = async () => {
      try {
        const statsData = await AsyncStorage.getItem('@player_stats');
        const parsedStats = statsData ? JSON.parse(statsData) : {};
        
        setStats(prevStats => ({
          ...prevStats,
          gamesPlayed: playerData.gamesPlayed || 0,
          totalXP: playerData.totalXp || 0,
          totalCoins: playerData.coins || 0,
          maxCombo: parsedStats.maxCombo || playerData.maxCombo || prevStats.maxCombo,
        }));
      } catch (error) {
        console.warn('⚠️ Stats reactive update error:', error);
      }
    };
    
    updateStats();
  }, [playerData?.totalXp, playerData?.coins, playerData?.gamesPlayed, isInitialized]);

  // ✅ BUG #5 FIX: useFocusEffect with proper dependency management
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      
      const loadStats = async () => {
        // Guard: Already loading
        if (isLoadingRef.current) {
          console.log('⏸️ Stats already loading, skipping...');
          return;
        }
        
        isLoadingRef.current = true;
        
        try {
          if (!isMounted) return;
          setLoading(true);
          
          // 1. Refresh context ONCE
          if (refreshPlayerData && typeof refreshPlayerData === 'function') {
            await refreshPlayerData();
          }
          
          // 2. Get current player data (from context)
          const currentData = playerData || {};
          
          // 3. Load stats from AsyncStorage with fallback
          let parsedStats = {};
          try {
            const statsData = await AsyncStorage.getItem('@player_stats');
            parsedStats = statsData ? JSON.parse(statsData) : {};
          } catch (storageError) {
            console.warn('⚠️ Stats storage read error:', storageError);
            parsedStats = {};
          }
          
          if (!isMounted) return;
          
          // 4. Update state with fallback defaults
          setStats({
            gamesPlayed: currentData.gamesPlayed || 0,
            totalXP: currentData.totalXp || 0,
            totalCoins: currentData.coins || 0,
            maxCombo: parsedStats.maxCombo || currentData.maxCombo || 0,
            highScoreClassic: parsedStats.highScoreClassic || 0,
            highScoreRush: parsedStats.highScoreRush || 0,
            highScoreZen: parsedStats.highScoreZen || 0,
            fastestReaction: parsedStats.fastestReaction || 0,
            totalPlaytime: parsedStats.totalPlaytime || 0,
            averageAccuracy: parsedStats.averageAccuracy || 0,
            perfectGames: parsedStats.perfectGames || 0,
            totalTaps: parsedStats.totalTaps || 0,
            // FIX: Ensure per-mode stats are loaded
            gamesPlayedClassic: parsedStats.gamesPlayedClassic || 0,
            gamesPlayedRush: parsedStats.gamesPlayedRush || 0,
            gamesPlayedZen: parsedStats.gamesPlayedZen || 0,
            gamesPlayedSpeedTest: parsedStats.gamesPlayedSpeedTest || 0,
          });
          
          console.log('✅ Stats loaded:', {
            totalXP: currentData.totalXp,
            level: getLevelFromXP(currentData.totalXp || 0),
            gamesPlayed: currentData.gamesPlayed,
          });
          
        } catch (error) {
          console.error('❌ Stats load error:', error);
          // Set default stats on error
          if (isMounted) {
            setStats({
              gamesPlayed: 0,
              totalXP: 0,
              totalCoins: 0,
              maxCombo: 0,
              highScoreClassic: 0,
              highScoreRush: 0,
              highScoreZen: 0,
              fastestReaction: 0,
              totalPlaytime: 0,
              averageAccuracy: 0,
              perfectGames: 0,
              totalTaps: 0,
              gamesPlayedClassic: 0,
              gamesPlayedRush: 0,
              gamesPlayedZen: 0,
              gamesPlayedSpeedTest: 0,
            });
          }
        } finally {
          // ALWAYS set loading to false
          if (isMounted) {
            setLoading(false);
          }
          isLoadingRef.current = false;
        }
      };
      
      loadStats();
      
      // Cleanup
      return () => {
        isMounted = false;
        isLoadingRef.current = false;
      };
    }, [refreshPlayerData, playerData?.totalXp, playerData?.gamesPlayed]) // CRITICAL: Add deps
  );

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatReactionTime = (ms) => {
    if (ms === 0) return 'N/A';
    return `${ms}ms`;
  };

  const level = getLevelFromXP(stats.totalXP);

  // === AAA STATS: StatCard with optional subtitle ===
  const StatCard = ({ icon, label, value, color = '#4ECDC4', large = false, subtitle = null }) => (
    <View style={[styles.statCard, large && styles.statCardLarge]}>
      <Text style={[styles.statIcon, large && styles.statIconLarge]}>{icon}</Text>
      <Text style={[styles.statValue, { color }, large && styles.statValueLarge]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, large && styles.statLabelLarge]}>{label}</Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, large && styles.statSubtitleLarge]}>{subtitle}</Text>
      )}
    </View>
  );

  const handleBack = () => {
    soundManager.play('tap');
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.background}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>
              📊 Player Stats
            </Text>
            <View style={styles.placeholder} />
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4ECDC4" />
            <Text style={{ color: '#FFF', fontSize: 16, marginTop: 10 }}>Loading Stats...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.background}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>
            📊 Player Stats
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Player Profile Card */}
          <LinearGradient
            colors={['rgba(78, 205, 196, 0.2)', 'rgba(197, 108, 240, 0.2)']}
            style={styles.profileCard}
          >
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#4ECDC4', '#C56CF0']}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {level}
                  </Text>
                </LinearGradient>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>
                  Player
                </Text>
                <Text style={styles.profileLevel}>Level {level}</Text>
                <Text style={styles.profileXP}>{stats.totalXP.toLocaleString()} XP</Text>
              </View>
            </View>

            <View style={styles.coinsRow}>
              <Ionicons name="logo-bitcoin" size={20} color="#FFD700" />
              <Text style={styles.coinsText}>{stats.totalCoins.toLocaleString()} Coins</Text>
            </View>
          </LinearGradient>

          {/* Main Stats Grid */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>
              🎮 Game Statistics
            </Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="🎯"
                label="Games Played"
                value={stats.gamesPlayed}
                large
              />
              <StatCard
                icon="🔥"
                label="Max Combo"
                value={`${stats.maxCombo}x`}
                color="#FF6B9D"
                large
              />
            </View>
          </View>

          {/* High Scores */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>
              🏆 High Scores
            </Text>
            <View style={styles.statsGrid} pointerEvents="box-none">
              <StatCard
                icon="⚡"
                label="Classic Mode"
                value={stats.highScoreClassic}
                color="#4ECDC4"
                subtitle={`${stats.gamesPlayedClassic} Games`}
              />
              {/* 🔴 BUG #4 FIX: Remove TouchableOpacity wrapper - stats should be read-only */}
              <StatCard
                icon="💥"
                label="Rush Mode"
                value={stats.highScoreRush}
                color="#FF6B9D"
                subtitle={`${stats.gamesPlayedRush} Games`}
              />
              <StatCard
                icon="🧠"
                label="Zen Mode"
                value={stats.highScoreZen}
                color="#C56CF0"
                subtitle={`${stats.gamesPlayedZen} Games`}
              />
            </View>
          </View>

          {/* Performance Stats */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>
              ⚡ Performance
            </Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="⏱️"
                label="Fastest Reaction"
                value={formatReactionTime(stats.fastestReaction)}
                color="#FFD93D"
              />
              <StatCard
                icon="🎯"
                label="Accuracy"
                value={`${stats.averageAccuracy.toFixed(1)}%`}
                color="#4ECDC4"
              />
              <StatCard
                icon="⏳"
                label="Total Playtime"
                value={formatTime(stats.totalPlaytime)}
                color="#C56CF0"
              />
              <StatCard
                icon="👆"
                label="Total Taps"
                value={stats.totalTaps.toLocaleString()}
                color="#FF6B9D"
              />
            </View>
          </View>

          {/* Achievements Preview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>
                🏅 Achievements
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Achievements')}>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.achievementPreview}>
              <View style={styles.achievementBadge}>
                <Text style={styles.achievementIcon}>🎖️</Text>
                <Text style={styles.achievementText}>Perfect Games: {stats.perfectGames}</Text>
              </View>
              <View style={styles.achievementBadge}>
                <Text style={styles.achievementIcon}>💎</Text>
                <Text style={styles.achievementText}>Level Unlocked: {level}</Text>
              </View>
            </View>
          </View>

          {/* Footer Spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = createSafeStyleSheet({
  container: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  profileLevel: {
    fontSize: 16,
    color: '#4ECDC4',
    marginBottom: 2,
  },
  profileXP: {
    fontSize: 14,
    color: '#BDC3C7',
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  coinsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 8,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%', // sabit yüzde, Dimensions yok
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
  },
  statCardLarge: {
    paddingVertical: 20,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statIconLarge: {
    fontSize: 40,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statValueLarge: {
    fontSize: 32,
  },
  statLabel: {
    fontSize: 12,
    color: '#BDC3C7',
    textAlign: 'center',
  },
  statLabelLarge: {
    fontSize: 14,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 4,
  },
  statSubtitleLarge: {
    fontSize: 11,
  },
  achievementPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  achievementBadge: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementText: {
    fontSize: 12,
    color: '#BDC3C7',
    textAlign: 'center',
  },
});


