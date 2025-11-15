/**
 * Typography Fallback Utilities
 * Provides safe system font fallbacks for all platforms
 */

import { Platform } from 'react-native';

export const systemFallback = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});


