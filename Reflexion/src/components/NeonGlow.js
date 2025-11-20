import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, BlurMask, Group } from "@shopify/react-native-skia";
import Animated, { useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

/**
 * NeonGlow Component - Optimized AAA Visual
 * Tighter, cleaner glow effect to prevent "dirty/muddy" look when targets overlap
 * 
 * @param {number} size - Diameter of the target circle
 * @param {string} color - Hex color for the glow (e.g., '#4ECDC4')
 * @param {number} intensity - Glow intensity multiplier (optional, for compatibility)
 * @param {boolean} pulseEnabled - Whether to enable pulse animation (optional, for compatibility)
 */
const NeonGlow = ({ size, color, intensity = 1.0, pulseEnabled = false }) => {
  const radius = size / 2;
  // Reduced extra space to keep the effect tight (was +60, now +30)
  const canvasSize = size + 30; 
  const center = canvasSize / 2;
  
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (pulseEnabled) {
      pulse.value = withRepeat(
        withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1, 
        true
      );
    }
  }, [pulseEnabled]);

  // Apply intensity multiplier to radius for dynamic scaling
  const effectiveRadius = radius * intensity;

  return (
    <View 
      style={{ 
        width: canvasSize, 
        height: canvasSize, 
        alignItems: 'center', 
        justifyContent: 'center', 
        position: 'absolute',
        top: -15, // Offset to center the reduced canvas (was -30)
        left: -15,
        pointerEvents: 'none', // Allow touches to pass through
        zIndex: 0, // Behind all content
      }}
    >
      <Canvas style={{ width: canvasSize, height: canvasSize }}>
        <Group>
          {/* LAYER 1: Outer Atmosphere (Subtle & Tight) - Reduced blur for cleaner look */}
          <Circle cx={center} cy={center} r={effectiveRadius} color={color} opacity={0.35}>
             <BlurMask blur={10} style="normal" />
          </Circle>

          {/* LAYER 2: Main Body (Solid Color) */}
          <Circle cx={center} cy={center} r={effectiveRadius * 0.9} color={color} />
          
          {/* LAYER 3: Inner Brightness (The "Tube" Effect) */}
          <Circle cx={center} cy={center} r={effectiveRadius * 0.6} color="white" opacity={0.5}>
            <BlurMask blur={3} style="normal" />
          </Circle>
          
          {/* LAYER 4: Core Hotspot (The LED source) */}
          <Circle cx={center} cy={center} r={effectiveRadius * 0.3} color="white" opacity={0.8} />
        </Group>
      </Canvas>
    </View>
  );
};

export default NeonGlow;
