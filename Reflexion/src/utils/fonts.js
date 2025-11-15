/**
 * FONT USAGE CHECKLIST:
 * ✓ Never access fonts object directly without null check
 * ✓ Always use optional chaining: fonts?.regular
 * ✓ Provide fallback fonts: fonts?.regular || 'System'
 * ✓ Check fontsLoaded state before rendering font-dependent components
 * ✓ Use centralized font utility functions
 */

import { Platform } from 'react-native';

/**
 * Font Family Names - Must match exactly what's loaded in App.js
 */
export const FONT_FAMILIES = {
  regular: 'Orbitron_400Regular',
  bold: 'Orbitron_700Bold',
  black: 'Orbitron_900Black',
};

/**
 * System font fallback (always available)
 */
export const SYSTEM_FONT = Platform.OS === 'ios' ? 'System' : 'Roboto';

/**
 * Safe font getter with automatic fallback
 * @param {string} weight - Font weight: 'regular', 'bold', 'black'
 * @param {boolean} fontsLoaded - Whether custom fonts are loaded
 * @returns {string} Font family name with safe fallback
 */
export const getFontFamily = (weight = 'regular', fontsLoaded = true) => {
  try {
    if (!fontsLoaded) {
      return SYSTEM_FONT;
    }
    return FONT_FAMILIES[weight] || FONT_FAMILIES.regular || SYSTEM_FONT;
  } catch (error) {
    console.warn('[Fonts] Error accessing font:', error);
    return SYSTEM_FONT;
  }
};

/**
 * Get safe font with explicit null checking
 * Usage: fontFamily: getSafeFont(TYPOGRAPHY?.regular)
 */
export const getSafeFont = (fontName) => {
  return fontName || SYSTEM_FONT;
};

/**
 * Check if fonts are loaded safely
 */
export const areFontsReady = (fontsLoaded, fontError) => {
  if (fontError) {
    console.error('❌ Font loading failed:', fontError);
    return true; // Proceed with system fonts
  }
  return fontsLoaded === true;
};

/**
 * Font weights for React Navigation
 */
export const getNavigationFonts = (fontsLoaded = false) => {
  if (!fontsLoaded) {
    return {
      regular: {
        fontFamily: SYSTEM_FONT,
        fontWeight: 'normal',
      },
      medium: {
        fontFamily: SYSTEM_FONT,
        fontWeight: '500',
      },
      bold: {
        fontFamily: SYSTEM_FONT,
        fontWeight: 'bold',
      },
      heavy: {
        fontFamily: SYSTEM_FONT,
        fontWeight: '900',
      },
    };
  }

  return {
    regular: {
      fontFamily: FONT_FAMILIES.regular,
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: FONT_FAMILIES.bold,
      fontWeight: '500',
    },
    bold: {
      fontFamily: FONT_FAMILIES.bold,
      fontWeight: 'bold',
    },
    heavy: {
      fontFamily: FONT_FAMILIES.black,
      fontWeight: '900',
    },
  };
};

export default {
  getFontFamily,
  getSafeFont,
  areFontsReady,
  getNavigationFonts,
  FONT_FAMILIES,
  SYSTEM_FONT,
};


