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
import { SPACING, BORDER_RADIUS } from '../utils/layoutConstants';

export default function InstructionsScreen({ navigation }) {
  // SAFE DIMENSIONS PATTERN
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const update = () => setScreenDimensions(Dimensions.get('window'));
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove?.();
  }, []);

  if (screenDimensions.width === 0) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📖 How to Play</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.instructionBlock}>
          <Text style={styles.icon}>👆</Text>
          <Text style={styles.instructionTitle}>Tap Targets Fast</Text>
          <Text style={styles.instructionText}>
            Tap glowing neon circles before they disappear (2 seconds each)
          </Text>
        </View>

        <View style={styles.instructionBlock}>
          <Text style={styles.icon}>⚡</Text>
          <Text style={styles.instructionTitle}>Build Your Combo</Text>
          <Text style={styles.instructionText}>
            Consecutive taps multiply your score. Don't miss to keep it going!
          </Text>
        </View>

        <View style={styles.instructionBlock}>
          <Text style={styles.icon}>⭐</Text>
          <Text style={styles.instructionTitle}>Lucky Targets</Text>
          <Text style={styles.instructionText}>
            Gold-bordered targets give 2-10x coin bonuses. Chase them!
          </Text>
        </View>

        <View style={styles.instructionBlock}>
          <Text style={styles.icon}>❤️</Text>
          <Text style={styles.instructionTitle}>Watch Your Health</Text>
          <Text style={styles.instructionText}>
            Missing targets drains health. Game ends at 0 HP or 30 seconds.
          </Text>
        </View>

        <View style={styles.instructionBlock}>
          <Text style={styles.icon}>🪙</Text>
          <Text style={styles.instructionTitle}>Progress & Rewards</Text>
          <Text style={styles.instructionText}>
            Earn XP to level up and coins to unlock themes. Watch ads for bonuses!
          </Text>
        </View>

        <View style={styles.instructionBlock}>
          <Text style={styles.icon}>🔥</Text>
          <Text style={styles.instructionTitle}>Combo Tiers</Text>
          <Text style={styles.instructionText}>
            3x = Nice! • 5x = Great! • 10x = Amazing! • 20x = Legendary!
          </Text>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('Game')}
        >
          <Text style={styles.startButtonText}>Start Playing!</Text>
        </TouchableOpacity>
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
    paddingHorizontal: SPACING.SCREEN_PADDING,
    paddingVertical: SPACING.MD,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.SCREEN_PADDING,
    paddingBottom: SPACING.LG,
  },
  instructionBlock: {
    backgroundColor: 'rgba(44, 62, 80, 0.6)',
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(78, 205, 196, 0.2)',
  },
  icon: {
    fontSize: 48,
    marginBottom: 10,
  },
  instructionTitle: {
    color: '#4ECDC4',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    color: '#BDC3C7',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: SPACING.LG + SPACING.XS,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
