import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AchievementsScreen({ navigation, playerData }) {
  // SAFE DIMENSIONS PATTERN
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const update = () => setScreenDimensions(Dimensions.get('window'));
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove?.();
  }, []);

  const achievements = [
    { id: 'first_win', name: 'First Victory', desc: 'Complete your first game', unlocked: playerData.gamesPlayed >= 1 },
    { id: 'combo_5', name: 'Combo Starter', desc: 'Reach 5x combo', unlocked: (playerData.maxCombo || 0) >= 5 },
    { id: 'combo_10', name: 'Combo Master', desc: 'Reach 10x combo', unlocked: (playerData.maxCombo || 0) >= 10 },
    { id: 'combo_20', name: 'Combo Legend', desc: 'Reach 20x combo', unlocked: (playerData.maxCombo || 0) >= 20 },
    { id: 'score_100', name: 'Century', desc: 'Score 100 points', unlocked: (playerData.highScore || 0) >= 100 },
    { id: 'score_500', name: 'High Scorer', desc: 'Score 500 points', unlocked: (playerData.highScore || 0) >= 500 },
    { id: 'score_1000', name: 'Elite Player', desc: 'Score 1000 points', unlocked: (playerData.highScore || 0) >= 1000 },
    { id: 'level_5', name: 'Rising Star', desc: 'Reach level 5', unlocked: Math.floor(playerData.xp / 100) + 1 >= 5 },
    { id: 'level_10', name: 'Pro Tapper', desc: 'Reach level 10', unlocked: Math.floor(playerData.xp / 100) + 1 >= 10 },
    { id: 'games_10', name: 'Dedicated', desc: 'Play 10 games', unlocked: (playerData.gamesPlayed || 0) >= 10 },
    { id: 'games_50', name: 'Addicted', desc: 'Play 50 games', unlocked: (playerData.gamesPlayed || 0) >= 50 },
    { id: 'coins_500', name: 'Wealthy', desc: 'Collect 500 total coins', unlocked: (playerData.coins || 0) >= 500 },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progress = (unlockedCount / totalCount) * 100;

  if (screenDimensions.width === 0) {
    return <View style={styles.container} />;
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

const styles = StyleSheet.create({
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
