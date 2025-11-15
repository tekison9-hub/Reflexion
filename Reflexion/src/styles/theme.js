/**
 * Reflexion - Cyberpunk Neon Theme System
 * Single source of truth for all styling
 */

import { Platform } from 'react-native';

export const COLORS = {
  background: '#0A0E1A',
  backgroundGradientStart: '#0A0E1A',
  backgroundGradientEnd: '#1a1f35',
  
  neonCyan: '#00F5FF',
  neonMagenta: '#FF00FF',
  neonPink: '#FF1493',
  neonPurple: '#9D00FF',
  neonBlue: '#00D9FF',
  neonGreen: '#39FF14',
  
  cardBackground: 'rgba(20, 25, 45, 0.8)',
  cardBorder: 'rgba(0, 245, 255, 0.3)',
  glassBackground: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B8D4',
  textTertiary: '#6B7599',
  textGlow: '#00F5FF',
  
  success: '#39FF14',
  warning: '#FFD700',
  error: '#FF3366',
  info: '#00D9FF',
  
  overlay: 'rgba(0, 0, 0, 0.85)',
  modalBackground: 'rgba(10, 14, 26, 0.95)',
};

export const GRADIENTS = {
  primary: ['#00F5FF', '#9D00FF'],
  secondary: ['#FF00FF', '#FF1493'],
  success: ['#39FF14', '#00F5FF'],
  danger: ['#FF3366', '#FF00FF'],
  background: ['#0A0E1A', '#1a1f35', '#2a2f45'],
  button: ['rgba(0, 245, 255, 0.2)', 'rgba(157, 0, 255, 0.2)'],
};

export const SHADOWS = {
  neonCyan: {
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  neonMagenta: {
    shadowColor: COLORS.neonMagenta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  neonPurple: {
    shadowColor: COLORS.neonPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const TYPOGRAPHY = {
  regular: 'Orbitron_400Regular',
  bold: 'Orbitron_700Bold',
  black: 'Orbitron_900Black',
  primary: 'Orbitron_900Black',
  secondary: 'Orbitron_700Bold',
  
  systemBold: Platform.OS === 'ios' ? 'System' : 'Roboto',
  systemRegular: Platform.OS === 'ios' ? 'System' : 'Roboto',
  system: Platform.OS === 'ios' ? 'System' : 'Roboto',
  
  title: 48,
  heading: 32,
  subheading: 24,
  body: 16,
  caption: 14,
  small: 12,
  tiny: 10,
  
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.8,
  
  letterSpacingTight: -0.5,
  letterSpacingNormal: 0,
  letterSpacingWide: 2,
  letterSpacingExtraWide: 4,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const ANIMATION = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

export const GAME_THEMES = {
  neonCity: {
    id: 'neonCity',
    name: 'Neon City',
    primaryColor: COLORS.neonCyan,
    secondaryColor: COLORS.neonPurple,
    particleColors: [COLORS.neonCyan, COLORS.neonBlue, COLORS.neonPurple],
    backgroundColor: COLORS.backgroundGradientStart,
    gradientColors: ['#0A0E1A', '#1a2a3a', '#2a3a4a'],
  },
  hyperLane: {
    id: 'hyperLane',
    name: 'Hyper Lane',
    primaryColor: COLORS.neonMagenta,
    secondaryColor: COLORS.neonPink,
    particleColors: [COLORS.neonMagenta, COLORS.neonPink, COLORS.neonPurple],
    backgroundColor: '#1a0a2a',
    gradientColors: ['#1a0a2a', '#2a1a3a', '#3a2a4a'],
  },
  cyberTunnel: {
    id: 'cyberTunnel',
    name: 'Cyber Tunnel',
    primaryColor: COLORS.neonBlue,
    secondaryColor: COLORS.neonCyan,
    particleColors: [COLORS.neonBlue, COLORS.neonCyan, COLORS.neonPurple],
    backgroundColor: '#0a1a2a',
    gradientColors: ['#0a1a2a', '#1a2a3a', '#2a3a5a'],
  },
  pulseCore: {
    id: 'pulseCore',
    name: 'Pulse Core',
    primaryColor: COLORS.neonPink,
    secondaryColor: COLORS.neonMagenta,
    particleColors: [COLORS.neonPink, COLORS.neonMagenta, COLORS.neonCyan],
    backgroundColor: '#2a0a1a',
    gradientColors: ['#2a0a1a', '#3a1a2a', '#4a2a3a'],
  },
  quantumStorm: {
    id: 'quantumStorm',
    name: 'Quantum Storm',
    primaryColor: COLORS.neonGreen,
    secondaryColor: COLORS.neonCyan,
    particleColors: [COLORS.neonGreen, COLORS.neonCyan, COLORS.neonMagenta, COLORS.neonPink],
    backgroundColor: '#1a2a0a',
    gradientColors: ['#1a2a0a', '#2a3a1a', '#3a4a2a'],
  },
};

export const DOPAMINE_ANIMATIONS = {
  glowPulse: {
    toValue: 1.15,
    duration: 800,
    loop: true,
  },
  scorePopup: {
    scale: [0, 1.2, 1],
    opacity: [0, 1, 0],
    duration: 1000,
  },
  particleBurst: {
    count: 20,
    spread: 100,
    duration: 600,
  },
  rewardReveal: {
    scale: [0, 1.3, 1],
    rotation: [0, 10, -10, 0],
    duration: 800,
  },
};

export const FALLBACKS = {
  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
};

export default {
  COLORS,
  GRADIENTS,
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  ANIMATION,
  GAME_THEMES,
  DOPAMINE_ANIMATIONS,
  FALLBACKS,
};
