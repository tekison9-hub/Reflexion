import React, { memo } from 'react';
import { View, Text, Animated } from 'react-native';
import { createSafeStyleSheet } from '../utils/safeStyleSheet';
import { getComboTier } from '../utils/GameLogic';

/**
 * ComboBar Component (Memoized for performance)
 * Displays current combo streak with tier indicators
 */
const ComboBar = memo(function ComboBar({ combo, maxCombo, theme }) {
  // 🎨 PREMIUM ESPORTS: Support both new token structure and legacy
  const themeForTier = theme ? {
    ...theme,
    primaryColor: theme.accentColor || theme.primaryColor,
    secondaryColor: theme.secondaryAccent || theme.secondaryColor,
  } : theme;
  const currentTier = getComboTier(combo, themeForTier);
  const progress = Math.min(100, (combo / maxCombo) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.label, { color: currentTier.color }]}>
          {combo > 0 ? `${combo}x COMBO` : 'NO COMBO'}
        </Text>
        {currentTier.label && (
          <Text style={[styles.tier, { color: currentTier.color }]}>
            {currentTier.label}
          </Text>
        )}
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${progress}%`,
              backgroundColor: currentTier.color,
              shadowColor: currentTier.color,
            },
          ]}
        />
      </View>
    </View>
  );
});

export default ComboBar;

const styles = createSafeStyleSheet({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tier: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#2C3E50',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});
// ============================================================================


