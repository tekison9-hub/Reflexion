/**
 * ✅ REFLEXION WRAPPER - Layout Component
 * 
 * Replaces all ScrollView and main container components with a unified,
 * optimized wrapper that prevents bounce/overscroll issues.
 * 
 * Features:
 * - flexGrow: 1 for proper flex layout
 * - bounces={false} on iOS
 * - overScrollMode="never" on Android
 * - Prevents nested ScrollView issues
 */

import React, { ReactNode } from 'react';
import { ScrollView, Platform, StyleSheet, ViewStyle } from 'react-native';

interface ReflexionWrapperProps {
  children: ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
}

/**
 * ReflexionWrapper Component
 * 
 * A unified ScrollView wrapper that ensures consistent behavior
 * across iOS and Android platforms.
 * 
 * @param children - Child components to render
 * @param style - Style for the ScrollView container
 * @param contentContainerStyle - Style for the content container (uses flexGrow: 1)
 * @param showsVerticalScrollIndicator - Show vertical scroll indicator (default: false)
 * @param showsHorizontalScrollIndicator - Show horizontal scroll indicator (default: false)
 * @param keyboardShouldPersistTaps - Keyboard behavior (default: 'handled')
 */
const ReflexionWrapper: React.FC<ReflexionWrapperProps> = ({
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
}) => {
  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={[
        styles.contentContainer,
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      // ✅ iOS: Disable bounce effect
      bounces={false}
      // ✅ Android: Disable overscroll glow
      overScrollMode="never"
      // ✅ Performance: Remove scroll animations
      scrollEventThrottle={16}
      // ✅ Accessibility
      accessibilityRole="none"
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    // ✅ Critical: flexGrow ensures content fills available space
    // This prevents layout issues when content is smaller than screen
    flexGrow: 1,
  },
});

export default ReflexionWrapper;







