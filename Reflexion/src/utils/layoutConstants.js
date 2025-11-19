/**
 * Centralized Layout Constants
 * Ensures consistent spacing, sizing, and layout across all screens
 * Based on Apple HIG and Material Design guidelines
 */

import { Dimensions, Platform } from 'react-native';

/**
 * Standard Spacing Scale (8pt grid system)
 * Based on Material Design spacing guidelines
 */
export const SPACING = {
  // Micro spacing
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
  
  // Semantic spacing
  SCREEN_PADDING: 20,           // Standard screen edge padding
  CARD_PADDING: 16,              // Standard card internal padding
  SECTION_SPACING: 32,           // Space between major sections
  ELEMENT_SPACING: 12,           // Space between related elements
  GROUP_SPACING: 8,              // Space within element groups
  
  // Component-specific
  BUTTON_HEIGHT: 56,              // Standard button height (Material Design)
  BUTTON_HEIGHT_COMPACT: 44,      // Compact button height (iOS HIG minimum)
  INPUT_HEIGHT: 48,               // Standard input height
  TAB_BAR_HEIGHT: 56,             // Tab bar height
  
  // Safe area handling
  SAFE_AREA_TOP: Platform.OS === 'ios' ? 44 : 24,
  SAFE_AREA_BOTTOM: Platform.OS === 'ios' ? 34 : 0,
};

/**
 * Border Radius Scale
 */
export const BORDER_RADIUS = {
  NONE: 0,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  ROUND: 9999,
  
  // Component-specific
  BUTTON: 12,
  CARD: 16,
  MODAL: 20,
  TARGET: 9999,  // Circular targets
};

/**
 * Touch Target Sizes
 * Minimum sizes per platform guidelines
 */
export const TOUCH_TARGET = {
  MINIMUM: Platform.select({
    ios: 44,      // iOS HIG minimum
    android: 48,  // Material Design minimum
    default: 44,
  }),
  COMFORTABLE: 56,  // Comfortable touch target
  LARGE: 64,        // Large touch target for important actions
};

/**
 * Typography Scale
 */
export const TYPOGRAPHY = {
  // Font sizes
  TINY: 10,
  SMALL: 12,
  CAPTION: 14,
  BODY: 16,
  SUBHEADING: 20,
  HEADING: 24,
  TITLE: 32,
  LARGE_TITLE: 48,
  
  // Line heights (as multiplier)
  LINE_HEIGHT_TIGHT: 1.2,
  LINE_HEIGHT_NORMAL: 1.5,
  LINE_HEIGHT_RELAXED: 1.8,
  
  // Letter spacing
  LETTER_SPACING_TIGHT: -0.5,
  LETTER_SPACING_NORMAL: 0,
  LETTER_SPACING_WIDE: 2,
  LETTER_SPACING_EXTRA_WIDE: 4,
};

/**
 * Screen Dimensions Helpers
 */
export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

export const getScreenWidth = () => Dimensions.get('window').width;
export const getScreenHeight = () => Dimensions.get('window').height;

/**
 * Responsive Breakpoints
 */
export const BREAKPOINTS = {
  SMALL: 375,
  MEDIUM: 414,
  LARGE: 768,
  XLARGE: 1024,
};

/**
 * Component Size Constants
 */
export const COMPONENT_SIZES = {
  // Targets
  TARGET_BASE: 70,
  TARGET_MIN: 50,
  TARGET_MAX: 90,
  
  // Icons
  ICON_SMALL: 20,
  ICON_MEDIUM: 24,
  ICON_LARGE: 32,
  ICON_XLARGE: 48,
  
  // Avatars
  AVATAR_SMALL: 32,
  AVATAR_MEDIUM: 48,
  AVATAR_LARGE: 64,
  
  // Badges
  BADGE_HEIGHT: 20,
  BADGE_PADDING_H: 8,
  BADGE_PADDING_V: 4,
};

/**
 * Z-Index Layers
 * Ensures proper stacking order
 */
export const Z_INDEX = {
  BACKGROUND: 0,
  CONTENT: 1,
  OVERLAY: 10,
  MODAL: 20,
  TOAST: 30,
  LOADING: 40,
};

/**
 * Shadow Presets
 */
export const SHADOWS = {
  SMALL: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  MEDIUM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  LARGE: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

/**
 * Helper: Calculate responsive size
 */
export function responsiveSize(baseSize, scale = 1) {
  const { width } = getScreenDimensions();
  if (width < BREAKPOINTS.SMALL) {
    return baseSize * 0.9 * scale;
  } else if (width > BREAKPOINTS.LARGE) {
    return baseSize * 1.1 * scale;
  }
  return baseSize * scale;
}

/**
 * Helper: Ensure minimum touch target size
 */
export function ensureTouchTarget(size) {
  return Math.max(size, TOUCH_TARGET.MINIMUM);
}

export default {
  SPACING,
  BORDER_RADIUS,
  TOUCH_TARGET,
  TYPOGRAPHY,
  BREAKPOINTS,
  COMPONENT_SIZES,
  Z_INDEX,
  SHADOWS,
  getScreenDimensions,
  getScreenWidth,
  getScreenHeight,
  responsiveSize,
  ensureTouchTarget,
};

