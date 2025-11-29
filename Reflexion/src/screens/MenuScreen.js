import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated, ActivityIndicator, StyleSheet, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '../hooks/useFocusEffect';
import { useGlobalState } from '../contexts/GlobalStateContext';
import musicManager from '../services/MusicManager';
import soundManager from '../services/SoundManager.js';
import { GAME_MODES, GAME_CONSTANTS, getPlayerProgress, getLevelTierInfo } from '../utils/GameLogic';
import SettingsModal from '../components/SettingsModal';
import { Modal } from 'react-native';

const ICONS = { play: '▶️', speed: '⏱️', rush: '🔥', shop: '🛒', stats: '📊', leader: '🏆' };

const MenuScreen = ({ navigation, route }) => {
  const { isInitialized, playerData, loadPlayerData } = useGlobalState();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showSettings, setShowSettings] = useState(false);
  const [showSpeedTargetSelection, setShowSpeedTargetSelection] = useState(false); // 🔴 BUG #3 FIX: Target selection state
  useFocusEffect(
    React.useCallback(() => {
      const initMusic = async () => {
        if (!soundManager.isInitialized()) {
          return;
        }
        
        // 🔴 MUSIC FIX: Check current music track to determine if coming from gameplay
        // If currentTrack is 'game', we're returning from gameplay
        // If currentTrack is 'menu' or null, we're coming from a menu section
        const isReturningFromGame = musicManager.currentTrack === 'game';
        
        // 🔴 MUSIC FIX: Only restart music if returning from gameplay
        if (isReturningFromGame) {
          // Stop gameplay music and restart menu music
          await musicManager.stopAll();
          await musicManager.stopGameplayMusic();
          await new Promise(resolve => setTimeout(resolve, 100));
          await musicManager.playMenuMusic();
        } else {
          // 🔴 MUSIC FIX: Coming from menu section - just ensure menu music is playing
          // Stop gameplay music if it's playing (shouldn't be, but just in case)
          await musicManager.stopGameplayMusic();
          
          // Only start menu music if it's not already playing
          // If menu music is already playing, don't restart it - let it continue
          if (!musicManager.currentTrack || musicManager.currentTrack !== 'menu' || !musicManager.isPlaying) {
            await musicManager.playMenuMusic();
          }
        }
      };
      
      initMusic();
      loadPlayerData();
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, [])
  );

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!isInitialized) return <View style={styles.center}><ActivityIndicator size="large" color="#4ECDC4"/></View>;

  const progress = getPlayerProgress(playerData?.totalXp || 0);
  const tier = getLevelTierInfo(progress.level);
  const xpPercent = (progress.currentXp / progress.xpToNextLevel) * 100;

  const handlePlay = (mode, params = {}) => {
    soundManager.play('tap');
    // 🔴 BUG #2 FIX: Stop menu music when starting game
    if (musicManager.currentTrack === 'menu' && musicManager.isPlaying) {
      musicManager.stopMenuMusic();
    }
    navigation.navigate('Game', { mode, ...params });
  };

  // 🔴 BUG #3 FIX: Handle Speed Mode button click - show target selection
  const handleSpeedModeClick = () => {
    soundManager.play('tap');
    setShowSpeedTargetSelection(true);
  };

  // 🔴 BUG #3 FIX: Handle target count selection and start game
  const handleTargetCountSelect = (targetCount) => {
    soundManager.play('tap');
    setShowSpeedTargetSelection(false);
    handlePlay(GAME_MODES.SPEED_TEST, { targetCount });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.content}>
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
            showsVerticalScrollIndicator={false}
          >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Reflexion</Text>
          <Text style={styles.subtitle}>MASTER YOUR REFLEXES</Text>
          <TouchableOpacity 
            style={styles.settingsBtn} 
            onPress={() => { 
              soundManager.play('tap');
              setShowSettings(true);
            }}
          >
            <Text style={{fontSize: 24}}>⚙️</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <View style={styles.row}>
            <View style={styles.badge}><Text style={styles.badgeText}>{progress.level}</Text></View>
            <View style={styles.info}>
              <Text style={[styles.tier, { color: tier.color }]}>{tier.name}</Text>
              <View style={styles.barBg}><View style={[styles.barFill, { width: `${xpPercent}%`, backgroundColor: tier.color }]} /></View>
              <Text style={styles.xp}>{progress.currentXp} / {progress.xpToNextLevel} XP</Text>
            </View>
            <View style={styles.coin}><Text>🪙 {playerData?.coins || 0}</Text></View>
          </View>
        </Animated.View>

        <View style={styles.actions}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={styles.playBtn} onPress={() => handlePlay(GAME_MODES.CLASSIC)} activeOpacity={0.9}>
              <LinearGradient colors={['rgba(78, 205, 196, 0.8)', 'rgba(78, 205, 196, 0.4)']} style={styles.gradBtn}>
                <Text style={styles.playIcon}>{ICONS.play}</Text>
                <Text style={styles.playText}>CLASSIC</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.subRow}>
            <TouchableOpacity style={[styles.subBtn, { borderColor: '#FF6B6B' }]} onPress={() => handlePlay(GAME_MODES.RUSH)}>
               <Text style={styles.subIcon}>{ICONS.rush}</Text><Text style={styles.subText}>RUSH</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.subBtn, { borderColor: '#C56CF0' }]} onPress={() => handlePlay(GAME_MODES.ZEN)}>
               <Text style={styles.subIcon}>🧘</Text><Text style={styles.subText}>ZEN</Text>
            </TouchableOpacity>
            {/* 🔴 BUG #3 FIX: Show target selection instead of starting game directly */}
            <TouchableOpacity style={[styles.subBtn, { borderColor: '#4ECDC4' }]} onPress={handleSpeedModeClick}>
               <Text style={styles.subIcon}>{ICONS.speed}</Text><Text style={styles.subText}>SPEED</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.nav}>
          {[
            { icon: ICONS.shop, text: 'Shop', nav: 'Shop' },
            { icon: ICONS.stats, text: 'Stats', nav: 'Stats' },
            { icon: ICONS.leader, text: 'Rank', nav: 'Leaderboard' },
            { icon: '🏅', text: 'Achievements', nav: 'Achievements' },
            { icon: '📖', text: 'How To Play', nav: 'Instructions' }
          ].map((item, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.navItem} 
              onPress={() => {
                soundManager.play('tap');
                if (item.params) {
                  navigation.navigate(item.nav, item.params);
                } else {
                  navigation.navigate(item.nav);
                }
              }}
            >
              <Text style={styles.navIcon}>{item.icon}</Text><Text style={styles.navText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
      
      {/* Settings Modal */}
      <SettingsModal 
        visible={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      {/* 🔴 BUG #3 FIX: Speed Mode Target Selection Modal */}
      <Modal
        visible={showSpeedTargetSelection}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSpeedTargetSelection(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.targetSelectionModal}>
            <Text style={styles.targetSelectionTitle}>Select Target Count</Text>
            <Text style={styles.targetSelectionSubtitle}>Choose how many targets to hit</Text>
            
            <View style={styles.targetCountGrid}>
              {GAME_CONSTANTS.SPEED_TEST_TARGET_COUNTS.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={styles.targetCountButton}
                  onPress={() => handleTargetCountSelect(count)}
                >
                  <Text style={styles.targetCountButtonText}>{count}</Text>
                  <Text style={styles.targetCountButtonLabel}>targets</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.targetSelectionCancel}
              onPress={() => {
                soundManager.play('tap');
                setShowSpeedTargetSelection(false);
              }}
            >
              <Text style={styles.targetSelectionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  content: { flex: 1, padding: 20, justifyContent: 'space-between' },
  header: { alignItems: 'center', marginTop: 10 },
  title: { 
    fontSize: 42, 
    fontWeight: '800', 
    color: '#fff', 
    letterSpacing: 2, 
    textShadowColor: '#4ECDC4', 
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 2 }
  },
  subtitle: { fontSize: 12, color: '#aaa', letterSpacing: 4, marginTop: 5 },
  settingsBtn: { 
    position: 'absolute', 
    right: 0, 
    top: 0, 
    padding: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4
      },
      android: {
        elevation: 5,
        shadowColor: '#000'
      }
    })
  },
  card: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 20, 
    padding: 15, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8
      },
      android: {
        elevation: 4,
        shadowColor: '#000'
      }
    })
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#4ECDC4', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  badgeText: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  info: { flex: 1 },
  tier: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  barBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 3, marginBottom: 5 },
  barFill: { height: '100%', borderRadius: 3 },
  xp: { fontSize: 10, color: '#aaa' },
  coin: { padding: 8, backgroundColor: 'rgba(255,215,0,0.2)', borderRadius: 12 },
  actions: { flex: 1, justifyContent: 'center', gap: 20 },
  playBtn: { 
    height: 100, 
    borderRadius: 25, 
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 15
      },
      android: {
        elevation: 10,
        shadowColor: '#4ECDC4'
      }
    })
  },
  gradBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 25 },
  playIcon: { fontSize: 40, marginRight: 15 },
  playText: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: '#fff', 
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5
  },
  subRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  subBtn: { 
    flex: 1, 
    height: 70, 
    borderRadius: 18, 
    borderWidth: 2, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    flexDirection: 'row',
    minWidth: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4
      },
      android: {
        elevation: 5,
        shadowColor: '#000'
      }
    })
  },
  subIcon: { fontSize: 24, marginRight: 8 },
  subText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  },
  nav: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'space-around', 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    borderRadius: 20, 
    padding: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6
      },
      android: {
        elevation: 3,
        shadowColor: '#000'
      }
    })
  },
  navItem: { 
    alignItems: 'center',
    width: '30%',
    marginBottom: 10
  },
  navIcon: { fontSize: 24, marginBottom: 5 },
  navText: { color: '#aaa', fontSize: 11 },
  // 🔴 BUG #3 FIX: Target selection modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetSelectionModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  targetSelectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  targetSelectionSubtitle: {
    fontSize: 14,
    color: '#BDC3C7',
    marginBottom: 25,
  },
  targetCountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 25,
  },
  targetCountButton: {
    width: 80,
    height: 80,
    borderRadius: 15,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  targetCountButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  targetCountButtonLabel: {
    fontSize: 10,
    color: '#1a1a2e',
    marginTop: 2,
  },
  targetSelectionCancel: {
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  targetSelectionCancelText: {
    fontSize: 16,
    color: '#BDC3C7',
    fontWeight: '600',
  },
});

export default MenuScreen;
