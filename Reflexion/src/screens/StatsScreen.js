/**
 * REFLEXION v3.0 - STATS & PROFILE SCREEN
 * Comprehensive player statistics and achievements
 * Major value-add feature for market sale ($2,000-$3,000)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLevelFromXP } from '../utils/GameLogic';
import soundManager from '../services/SoundManager';
import theme from '../styles/theme';

const { TYPOGRAPHY } = theme;
const { width } = Dimensions.get('window');

export default function StatsScreen({ navigation, playerData }) {
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
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load comprehensive stats from AsyncStorage
      const statsData = await AsyncStorage.getItem('@player_stats');
      const parsedStats = statsData ? JSON.parse(statsData) : {};

      // Merge with playerData for real-time updates
      setStats({
        gamesPlayed: playerData?.gamesPlayed || parsedStats.gamesPlayed || 0,
        highScoreClassic: parsedStats.highScoreClassic || 0,
        highScoreRush: parsedStats.highScoreRush || 0,
        highScoreZen: parsedStats.highScoreZen || 0,
        totalXP: playerData?.xp || 0,
        fastestReaction: parsedStats.fastestReaction || 0,
        totalPlaytime: parsedStats.totalPlaytime || 0,
        averageAccuracy: parsedStats.averageAccuracy || 0,
        totalCoins: playerData?.coins || 0,
        maxCombo: playerData?.maxCombo || parsedStats.maxCombo || 0,
        perfectGames: parsedStats.perfectGames || 0,
        totalTaps: parsedStats.totalTaps || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

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

  const StatCard = ({ icon, label, value, color = '#4ECDC4', large = false }) => (
    <View style={[styles.statCard, large && styles.statCardLarge]}>
      <Text style={[styles.statIcon, large && styles.statIconLarge]}>{icon}</Text>
      <Text style={[styles.statValue, { color }, large && styles.statValueLarge]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, large && styles.statLabelLarge]}>{label}</Text>
    </View>
  );

  const handleBack = () => {
    soundManager.play('tap');
    navigation.goBack();
  };

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
            <View style={styles.statsGrid}>
              <StatCard
                icon="⚡"
                label="Classic Mode"
                value={stats.highScoreClassic}
                color="#4ECDC4"
              />
              <StatCard
                icon="💥"
                label="Rush Mode"
                value={stats.highScoreRush}
                color="#FF6B9D"
              />
              <StatCard
                icon="🧠"
                label="Zen Mode"
                value={stats.highScoreZen}
                color="#C56CF0"
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

const styles = StyleSheet.create({
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
    width: (width - 60) / 2,
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

