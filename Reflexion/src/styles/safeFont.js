/**
 * Safe Font Utilities
 * Provides guaranteed font values with system fallbacks
 * Use these exports directly in StyleSheet definitions for maximum safety
 */

import theme from './theme';
import { systemFallback } from './typographyFallback';

// Safe font exports with automatic fallback
export const fontRegular = theme.TYPOGRAPHY?.regular ?? systemFallback;
export const fontBold = theme.TYPOGRAPHY?.bold ?? systemFallback;
export const fontBlack = theme.TYPOGRAPHY?.black ?? systemFallback;
export const fontPrimary = theme.TYPOGRAPHY?.primary ?? systemFallback;
export const fontSecondary = theme.TYPOGRAPHY?.secondary ?? systemFallback;

// Helper function for dynamic font selection
export const getSafeFont = (fontKey = 'regular') => {
  return theme.TYPOGRAPHY?.[fontKey] ?? systemFallback;
};

export default {
  fontRegular,
  fontBold,
  fontBlack,
  fontPrimary,
  fontSecondary,
  getSafeFont,
  systemFallback,
};


