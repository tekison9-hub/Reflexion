import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoadingScreen() {
  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e']}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <ActivityIndicator size="large" color="#4ECDC4" />
      <Text style={{ color: '#FFF', fontSize: 18, marginTop: 20 }}>
        Loading Reflexion...
      </Text>
    </LinearGradient>
  );
}










