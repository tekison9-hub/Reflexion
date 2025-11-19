/**
 * PREMIUM ESPORTS THEME TOKENS
 * Standardized theme structure for premium neon aesthetics with esports clarity
 */

// Premium esports dark backgrounds (never overridden by themes)
export const ESPORTS_DARK_BACKGROUNDS = {
  PRIMARY: '#05070D',    // Deepest dark
  SECONDARY: '#0A0F1A',  // Medium dark
  TERTIARY: '#101828',   // Lighter dark
};

// VISUAL UPGRADE: Brand color and mode-based accent colors
export const BRAND_COLORS = {
  PRIMARY: '#4ECDC4',        // Turquoise (brand color)
  SECONDARY: '#00E5FF',      // Bright cyan
};

// VISUAL UPGRADE: Mode-based accent colors for clarity
export const MODE_COLORS = {
  CLASSIC: '#4ECDC4',        // Turquoise
  RUSH: '#FF6B35',           // Energy Neon Red/Orange
  ZEN: '#C56CF0',            // Soft Lavender
  SPEED_TEST: '#6B9BD1',     // Ice-Blue / Steel gray
};

/**
 * Soften a color by reducing saturation and adjusting brightness
 * @param {string} hexColor - Hex color string
 * @param {number} saturationFactor - 0-1, lower = less saturated
 * @param {number} brightnessFactor - 0-1, lower = darker
 * @returns {string} Softened hex color
 */
function softenColor(hexColor, saturationFactor = 0.7, brightnessFactor = 0.85) {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Convert to HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
      case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
      case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
    }
  }

  // Apply softening
  s = Math.max(0, Math.min(1, s * saturationFactor));
  l = Math.max(0, Math.min(1, l * brightnessFactor));

  // Convert back to RGB
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;
  let rNew, gNew, bNew;

  if (h < 1/6) {
    rNew = c; gNew = x; bNew = 0;
  } else if (h < 2/6) {
    rNew = x; gNew = c; bNew = 0;
  } else if (h < 3/6) {
    rNew = 0; gNew = c; bNew = x;
  } else if (h < 4/6) {
    rNew = 0; gNew = x; bNew = c;
  } else if (h < 5/6) {
    rNew = x; gNew = 0; bNew = c;
  } else {
    rNew = c; gNew = 0; bNew = x;
  }

  rNew = Math.round((rNew + m) * 255);
  gNew = Math.round((gNew + m) * 255);
  bNew = Math.round((bNew + m) * 255);

  return `#${[rNew, gNew, bNew].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
}

/**
 * Create premium theme token from raw theme data
 * @param {object} themeData - Raw theme data from GameLogic or ShopItems
 * @param {object} shopItem - Optional ShopItems data for enhanced colors
 * @returns {object} Premium theme token
 */
export function createPremiumThemeToken(themeData, shopItem = null, originalThemeId = null) {
  // 🔴 CRITICAL FIX: Use original theme ID from shop, not mapped GameLogic ID
  // This ensures theme-specific logic (like sunset gradient) works correctly
  const themeId = originalThemeId || shopItem?.id || themeData.id || 'theme_default';
  
  // Use ShopItems colors if available, otherwise GameLogic
  const accentColor = shopItem?.colors?.primary || themeData.primaryColor || '#4ECDC4';
  const secondaryAccent = shopItem?.colors?.secondary || themeData.secondaryColor || '#C56CF0';
  
  // Soften accent colors for premium look (not eye-burning)
  const softenedAccent = softenColor(accentColor, 0.75, 0.9);
  const softenedSecondary = softenColor(secondaryAccent, 0.75, 0.9);
  
  // Create premium gradient (dark base + softened accent)
  const gradientBase = ESPORTS_DARK_BACKGROUNDS.SECONDARY;
  const gradientAccent = shopItem?.colors?.background?.[1] 
    ? softenColor(shopItem.colors.background[1], 0.6, 0.7)
    : softenedAccent;
  
  // 🔴 CRITICAL FIX: Check original theme ID, not mapped themeData.id
  // For Sunset Dreams specifically, create premium orange gradient
  let gradientColors;
  if (themeId === 'theme_sunset' || shopItem?.name?.toLowerCase().includes('sunset') || themeData.name?.toLowerCase().includes('sunset')) {
    gradientColors = [
      ESPORTS_DARK_BACKGROUNDS.SECONDARY,
      softenColor('#FF6B35', 0.65, 0.6), // Premium dark orange
      softenColor('#F7931E', 0.6, 0.55), // Premium orange accent
    ];
    console.log('🎨 PREMIUM THEME - Applying Sunset Dreams gradient');
  } else if (shopItem?.colors?.background && Array.isArray(shopItem.colors.background) && shopItem.colors.background.length > 0) {
    // Use shop item background colors (softened) for gradient
    gradientColors = [gradientBase, ...shopItem.colors.background.map(c => softenColor(c, 0.6, 0.7))];
    console.log('🎨 PREMIUM THEME - Using shop item gradient colors');
  } else if (Array.isArray(themeData.gradientColors) && themeData.gradientColors.length > 0) {
    // Fallback to GameLogic theme gradient colors
    gradientColors = [gradientBase, ...themeData.gradientColors.map(c => softenColor(c, 0.6, 0.7))];
    console.log('🎨 PREMIUM THEME - Using GameLogic gradient colors');
  } else {
    // Default gradient
    gradientColors = [gradientBase, softenColor(accentColor, 0.5, 0.6)];
    console.log('🎨 PREMIUM THEME - Using default gradient');
  }
  
  // Premium glow color (accent with reduced opacity)
  const glowColor = `${softenedAccent}8C`; // ~55% opacity in hex
  
  // Particle colors (softened)
  const particleColors = Array.isArray(themeData.particleColors) && themeData.particleColors.length > 0
    ? themeData.particleColors.map(c => softenColor(c, 0.8, 0.95))
    : [softenedAccent, softenedSecondary];
  
  // Particle icon (from shop item or default)
  const particleIcon = shopItem?.particleIcon || themeData.particleIcon || null;
  
  // Particle glow (matches theme glow)
  const particleGlow = glowColor;
  
  return {
    id: themeId, // 🔴 CRITICAL FIX: Use original theme ID
    name: shopItem?.name || themeData.name || 'Classic Dark',
    // Premium esports dark background (never overridden)
    backgroundColor: ESPORTS_DARK_BACKGROUNDS.PRIMARY,
    // Softened accent colors
    accentColor: softenedAccent,
    secondaryAccent: softenedSecondary,
    // Premium gradient for board only
    gradientColors,
    // Premium glow
    glowColor,
    glowOpacity: 0.55, // Max opacity for premium look
    glowRadius: 12, // Soft radius
    // Particle system
    particleColors,
    particleIcon, // Icon/emoji for particles
    particleGlow, // Glow color for particles
    // Text colors for readability
    textColor: '#FFFFFF',
    textSecondary: '#BDC3C7',
    textMuted: '#7F8C8D',
    // HUD colors
    hudAccent: softenedAccent,
    hudBackground: `${ESPORTS_DARK_BACKGROUNDS.SECONDARY}E6`, // ~90% opacity
  };
}

/**
 * Get default premium theme token
 */
export function getDefaultPremiumTheme() {
  return createPremiumThemeToken({
    id: 'theme_default',
    name: 'Classic Dark',
    primaryColor: '#00E5FF',
    secondaryColor: '#FF6B9D',
    gradientColors: ['#1a1a2e', '#16213e'],
    particleColors: ['#00E5FF', '#4ECDC4', '#00D9FF'],
  });
}

