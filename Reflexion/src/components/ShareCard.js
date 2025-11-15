/**
 * REFLEXION v5.0 - VIRAL SHARE CARD
 * Screenshot-ready score card for social sharing
 * Generates beautiful branded images to drive app downloads
 */

import React, { useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export const ShareCard = ({ score, combo, rank, reactionTime, onShare, onClose }) => {
  const viewShotRef = useRef();

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your Reflexion score!',
        });
        
        if (onShare) onShare();
      } else {
        Alert.alert('Sharing not available on this device');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error sharing image');
    }
  };

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.card}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>⚡ REFLEXION ⚡</Text>
            <Text style={styles.tagline}>Test Your Reflexes</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.mainStat}>
              <Text style={styles.mainStatLabel}>SCORE</Text>
              <Text style={styles.mainStatValue}>{score.toLocaleString()}</Text>
            </View>

            <View style={styles.miniStats}>
              <StatItem icon="🔥" label="COMBO" value={`${combo}x`} />
              <StatItem icon="⚡" label="TIME" value={`${reactionTime}ms`} />
              {rank && <StatItem icon="🏆" label="RANK" value={`#${rank}`} />}
            </View>
          </View>

          {/* Challenge */}
          <View style={styles.challenge}>
            <Text style={styles.challengeText}>Can you beat me?</Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Download Reflexion</Text>
            <Text style={styles.footerSubtext}>Available on iOS & Android</Text>
          </View>
        </LinearGradient>
      </ViewShot>

      {/* Share Button */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>📸 Share to Social Media</Text>
      </TouchableOpacity>

      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const StatItem = ({ icon, label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 350,
    padding: 30,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00E5FF',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00E5FF',
    letterSpacing: 2,
    textShadowColor: '#00E5FF',
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 12,
    color: '#8B8B8B',
    marginTop: 4,
  },
  statsContainer: {
    marginBottom: 30,
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainStatLabel: {
    fontSize: 14,
    color: '#8B8B8B',
    marginBottom: 8,
  },
  mainStatValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#00E5FF',
    textShadowColor: '#00E5FF',
    textShadowRadius: 15,
  },
  miniStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#8B8B8B',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  challenge: {
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#00E5FF30',
    marginBottom: 20,
  },
  challengeText: {
    fontSize: 18,
    color: '#FF6B9D',
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#8B8B8B',
    marginTop: 4,
  },
  shareButton: {
    backgroundColor: '#00E5FF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  shareButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingVertical: 12,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#8B8B8B',
    fontSize: 14,
  },
});









