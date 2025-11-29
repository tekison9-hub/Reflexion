/**
 * REFLEXION v3.0 - LOCAL WEEKLY LEADERBOARD SCREEN
 * Display top 10 scores for Classic and Rush modes
 * Resets weekly, fully local (no backend required)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '../hooks/useFocusEffect';
import { createSafeStyleSheet } from '../utils/safeStyleSheet';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import leaderboardManager from '../services/LeaderboardManager';
import { GAME_MODES } from '../utils/GameLogic';
import soundManager from '../services/SoundManager.js';
import theme from '../styles/theme';

const { TYPOGRAPHY } = theme;

export default function LeaderboardScreen({ navigation }) {
  const [activeMode, setActiveMode] = useState(GAME_MODES.CLASSIC);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  // ✅ FIX: Speed Test için target count seçimi
  const [selectedTargetCount, setSelectedTargetCount] = useState(50);

  const loadLeaderboard = useCallback(async () => {
    try {
      let data;
      if (activeMode === GAME_MODES.SPEED_TEST) {
        data = await leaderboardManager.getLeaderboard(activeMode, selectedTargetCount);
      } else {
        data = await leaderboardManager.getLeaderboard(activeMode);
      }
      setLeaderboard(data);
    } catch (error) {
      console.error('❌ Failed to load leaderboard:', error);
    }
  }, [activeMode, selectedTargetCount]);

  const updateResetTimer = useCallback(() => {
    const formatted = leaderboardManager.getTimeUntilResetFormatted();
    setTimeUntilReset(formatted);
  }, []);

  // FIX: Load leaderboard when screen focuses (for fresh data after game)
  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
      updateResetTimer();
    }, [loadLeaderboard, updateResetTimer])
  );

  useEffect(() => {
    loadLeaderboard();
    updateResetTimer();

    const interval = setInterval(updateResetTimer, 60000);
    return () => clearInterval(interval);
  }, [loadLeaderboard, updateResetTimer]);

  const handleModeSwitch = (mode) => {
    soundManager.play('tap');
    setActiveMode(mode);
  };

  const handleBack = () => {
    soundManager.play('tap');
    navigation.goBack();
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#4ECDC4';
  };

  const getRankMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
            🏆 Leaderboard
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Reset Timer */}
        <View style={styles.resetTimer}>
          <Ionicons name="time-outline" size={16} color="#FFD93D" />
          <Text style={styles.resetTimerText}>Resets in {timeUntilReset}</Text>
        </View>

        {/* Mode Tabs */}
        {/* === AAA LEADERBOARD: Added Speed Test tab === */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeMode === GAME_MODES.CLASSIC && styles.tabActive]}
            onPress={() => handleModeSwitch(GAME_MODES.CLASSIC)}
          >
            <Text
              style={[
                styles.tabText,
                activeMode === GAME_MODES.CLASSIC && styles.tabTextActive,
                { fontFamily: TYPOGRAPHY?.bold || 'System' },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              ⚡ Classic
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeMode === GAME_MODES.RUSH && styles.tabActive]}
            onPress={() => handleModeSwitch(GAME_MODES.RUSH)}
          >
            <Text
              style={[
                styles.tabText,
                activeMode === GAME_MODES.RUSH && styles.tabTextActive,
                { fontFamily: TYPOGRAPHY?.bold || 'System' },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              💥 Rush
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeMode === GAME_MODES.SPEED_TEST && styles.tabActive]}
            onPress={() => handleModeSwitch(GAME_MODES.SPEED_TEST)}
          >
            <Text
              style={[
                styles.tabText,
                activeMode === GAME_MODES.SPEED_TEST && styles.tabTextActive,
                { fontFamily: TYPOGRAPHY?.bold || 'System' },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              ⏱️ Speed Test
            </Text>
          </TouchableOpacity>
        </View>

        {/* ✅ FIX: Speed Test için target count seçici */}
        {activeMode === GAME_MODES.SPEED_TEST && (
          <View style={styles.targetCountSelector}>
            {[20, 30, 40, 50].map(count => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.targetCountButton,
                  selectedTargetCount === count && styles.targetCountButtonActive
                ]}
                onPress={() => {
                  setSelectedTargetCount(count);
                  loadLeaderboard();
                }}
              >
                <Text style={styles.targetCountText}>{count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Leaderboard List */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {leaderboard.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>No scores yet this week!</Text>
              <Text style={styles.emptySubtext}>
                Play {activeMode === GAME_MODES.CLASSIC ? 'Classic' : activeMode === GAME_MODES.RUSH ? 'Rush' : 'Speed Test'} mode to set a record
              </Text>
            </View>
          ) : (
            leaderboard.map((entry, index) => {
              // === AAA LEADERBOARD: Speed Test ranks by TIME (lowest is best) ===
              const isSpeedTest = activeMode === GAME_MODES.SPEED_TEST;
              const displayValue = isSpeedTest 
                ? (entry.time ? `${entry.time.toFixed(3)}s` : entry.score) // ✅ FIX #3: Show precise time (3 decimals)
                : entry.score; // Show score for Classic/Rush
              const displayLabel = isSpeedTest ? 'Time' : 'Score';
              
              return (
                <LinearGradient
                  key={`${entry.timestamp}-${index}`}
                  colors={
                    index < 3
                      ? ['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']
                      : ['rgba(78, 205, 196, 0.1)', 'rgba(78, 205, 196, 0.05)']
                  }
                  style={styles.entryCard}
                >
                  <View
                    style={[
                      styles.rankBadge,
                      { backgroundColor: getRankColor(index + 1) + '20' },
                    ]}
                  >
                    <Text style={[styles.rankText, { color: getRankColor(index + 1) }]}>
                      {getRankMedal(index + 1)}
                    </Text>
                  </View>

                  <View style={styles.entryInfo}>
                    <Text style={[styles.entryName, { fontFamily: TYPOGRAPHY?.bold || 'System' }]}>
                      {entry.playerName || 'Player'}
                    </Text>
                    <Text style={styles.entryDate}>{formatDate(entry.timestamp)}</Text>
                  </View>

                  <View style={styles.entryStats}>
                    <View style={styles.statItem}>
                      <Text
                        style={[
                          styles.statValue,
                          { fontFamily: TYPOGRAPHY?.bold || 'System' },
                        ]}
                      >
                        {displayValue}
                      </Text>
                      <Text style={styles.statLabel}>{displayLabel}</Text>
                      {/* 🔴 BUG #2 FIX: Display actual target count for Speed Test */}
                      {isSpeedTest && entry.targetCount && (
                        <Text style={styles.statSubLabel}>{entry.targetCount} targets</Text>
                      )}
                    </View>
                    {!isSpeedTest && (
                      <>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                          <Text
                            style={[
                              styles.statValue,
                              {
                                color: '#FF6B9D',
                                fontFamily: TYPOGRAPHY?.bold || 'System',
                              },
                            ]}
                          >
                            {entry.combo}x
                          </Text>
                          <Text style={styles.statLabel}>Combo</Text>
                        </View>
                      </>
                    )}
                  </View>
                </LinearGradient>
              );
            })
          )}

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
  resetTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  resetTimerText: {
    fontSize: 14,
    color: '#FFD93D',
    marginLeft: 6,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4, // FIX: Reduced padding to prevent text wrap
    borderRadius: 12,
    backgroundColor: 'rgba(26, 26, 46, 0.5)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#4ECDC4',
  },
  tabText: {
    fontSize: 13, // FIX: Reduced from 16 to 13 to prevent text wrap
    fontWeight: 'bold',
    color: '#8B8B8B',
  },
  tabTextActive: {
    color: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BDC3C7',
    textAlign: 'center',
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  rankBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    color: '#BDC3C7',
  },
  entryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#BDC3C7',
  },
  statSubLabel: {
    fontSize: 9,
    color: '#7F8C8D',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  targetCountSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  targetCountButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
  },
  targetCountButtonActive: {
    backgroundColor: '#4ECDC4',
  },
  targetCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
});


