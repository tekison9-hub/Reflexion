/**
 * Safe StyleSheet utility that handles cases where React Native
 * might not be fully initialized when styles are created
 */

let RNStyleSheet = null;

/**
 * Lazy load StyleSheet to avoid issues if React Native isn't ready
 */
const getStyleSheet = () => {
  if (!RNStyleSheet) {
    try {
      // Try to get StyleSheet from react-native
      const RN = require('react-native');
      if (RN && RN.StyleSheet && typeof RN.StyleSheet.create === 'function') {
        RNStyleSheet = RN.StyleSheet;
      } else {
        console.warn('⚠️ StyleSheet not available in react-native');
        return null;
      }
    } catch (error) {
      console.warn('⚠️ Could not load StyleSheet from react-native:', error.message);
      return null;
    }
  }
  return RNStyleSheet;
};

/**
 * Safe StyleSheet.create() wrapper
 * Ensures StyleSheet is available before creating styles
 */
export const createSafeStyleSheet = (styleDefinitions) => {
  try {
    const StyleSheet = getStyleSheet();
    
    // Check if StyleSheet is available
    if (!StyleSheet || typeof StyleSheet.create !== 'function') {
      console.warn('⚠️ [runtime not ready]: StyleSheet not available, using fallback');
      // Return empty styles object with same keys
      const emptyStyles = {};
      Object.keys(styleDefinitions).forEach(key => {
        emptyStyles[key] = {};
      });
      return emptyStyles;
    }
    
    return StyleSheet.create(styleDefinitions);
  } catch (error) {
    console.error('❌ [runtime not ready]: StyleSheet.create() failed:', error);
    // Return empty styles object with same keys as fallback
    const emptyStyles = {};
    Object.keys(styleDefinitions).forEach(key => {
      emptyStyles[key] = {};
    });
    return emptyStyles;
  }
};

// Export StyleSheet getter for direct use (when we know it's safe)
export const StyleSheet = {
  get create() {
    const SS = getStyleSheet();
    return SS ? SS.create.bind(SS) : () => ({});
  },
  get flatten() {
    const SS = getStyleSheet();
    return SS ? SS.flatten.bind(SS) : (style) => style;
  },
  get compose() {
    const SS = getStyleSheet();
    return SS ? SS.compose.bind(SS) : (...styles) => ({});
  },
};

