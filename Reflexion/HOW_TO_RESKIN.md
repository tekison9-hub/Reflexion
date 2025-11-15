# 🎨 HOW TO RESKIN REFLEXION v3.0

**Complete step-by-step guide to customize and rebrand Reflexion for your own product**

---

## 📋 TABLE OF CONTENTS

1. [Quick Overview](#quick-overview)
2. [Change App Name & Identity](#change-app-name--identity)
3. [Change Colors & Theme](#change-colors--theme)
4. [Replace Assets (Icons, Splash)](#replace-assets-icons-splash)
5. [Customize Shop Items](#customize-shop-items)
6. [Modify Game Constants](#modify-game-constants)
7. [Add/Remove Features](#addremove-features)
8. [Testing Your Reskin](#testing-your-reskin)

---

## 🎯 QUICK OVERVIEW

Reflexion is built with modularity in mind. You can reskin it in **30 minutes to 2 hours** depending on depth of customization.

### What You Can Easily Change:
- ✅ App name and branding
- ✅ All colors and themes
- ✅ Icons and splash screen
- ✅ Shop items (themes, particles, balls)
- ✅ Game difficulty and constants
- ✅ UI text and copy

### What Requires More Work:
- ⚠️ Adding new game modes (moderate)
- ⚠️ Changing core gameplay mechanics (advanced)
- ⚠️ Adding multiplayer (advanced)

---

## 1️⃣ CHANGE APP NAME & IDENTITY

### Step 1: Update app.json
```json
// File: app.json
{
  "expo": {
    "name": "YourGameName",        // ← Change this
    "slug": "your-game-name",      // ← Change this
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourgame"  // ← Change this
    },
    "android": {
      "package": "com.yourcompany.yourgame"           // ← Change this
    }
  }
}
```

### Step 2: Update package.json
```json
// File: package.json
{
  "name": "your-game-name",        // ← Change this
  "version": "1.0.0"
}
```

### Step 3: Update Title in Menu Screen
```javascript
// File: src/screens/MenuScreen.js
// Line ~249
<Text style={[styles.title, { fontFamily: TYPOGRAPHY?.black || 'System' }]}>
  YourGameName  {/* ← Change this */}
</Text>
```

### Step 4: Update Documentation Files
- Find/replace "Reflexion" with "YourGameName" in all .md files
- Update README.md with your game description

---

## 2️⃣ CHANGE COLORS & THEME

### Option A: Change Main Color Scheme

#### File: `src/styles/theme.js`
```javascript
export default {
  COLORS: {
    PRIMARY: '#FF6B9D',     // ← Change main accent color
    SECONDARY: '#4ECDC4',   // ← Change secondary accent
    BACKGROUND: '#0a0a1a',  // ← Change background
    TEXT: '#FFFFFF',        // ← Change text color
    // ... more colors
  },
  // ...
};
```

#### Quick Color Swaps:
```javascript
// Neon Blue Theme
PRIMARY: '#00E5FF',
SECONDARY: '#0099FF',
BACKGROUND: '#001a2e',

// Warm Orange Theme
PRIMARY: '#FF6B35',
SECONDARY: '#FFD93D',
BACKGROUND: '#1a0a00',

// Purple Dreams Theme
PRIMARY: '#C56CF0',
SECONDARY: '#FF6B9D',
BACKGROUND: '#1a0a2e',
```

### Option B: Change Individual Theme Colors

#### File: `src/data/ShopItems.js`
```javascript
export const SHOP_ITEMS = {
  themes: [
    {
      id: 'theme_default',
      name: 'Your Theme Name',       // ← Change name
      description: 'Your description', // ← Change description
      price: 0,
      colors: {
        background: ['#1a1a2e', '#16213e', '#0f3460'],  // ← Change colors
        primary: '#00E5FF',                             // ← Change primary
        secondary: '#FF6B9D',                           // ← Change secondary
      }
    },
    // ... more themes
  ]
};
```

### Option C: Add New Theme
```javascript
{
  id: 'theme_your_custom',
  name: 'Custom Theme',
  description: 'Your custom theme',
  price: 1000,
  unlocked: false,
  level: 15,
  colors: {
    background: ['#hexcolor1', '#hexcolor2'],
    primary: '#hexcolor3',
    secondary: '#hexcolor4',
  }
}
```

---

## 3️⃣ REPLACE ASSETS (ICONS, SPLASH)

### App Icon

#### Step 1: Create Icon (1024x1024 PNG)
- **Requirement**: 1024x1024px, PNG, transparent background
- **Tools**: Figma, Photoshop, Canva, or online icon generators

#### Step 2: Replace Icon
```bash
# Replace this file:
assets/icon.png

# With your 1024x1024 PNG icon
```

#### Step 3: Generate Adaptive Icon (Android)
```bash
# Replace this file:
assets/adaptive-icon.png

# With your 1024x1024 PNG (with safe zone for Android)
```

### Splash Screen

#### Step 1: Create Splash (1284x2778 PNG for iOS)
```bash
# Replace this file:
assets/splash.png

# With your splash screen image
```

#### Step 2: Update Splash in app.json
```json
// File: app.json
{
  "expo": {
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0a0a1a"  // ← Change background color
    }
  }
}
```

### Favicon (Web Version)
```bash
# Replace this file:
assets/favicon.png

# With your 16x16 or 32x32 favicon
```

### Using Asset Generator Script
```bash
# We included a helper script:
node generate-icon.js

# Follow prompts to auto-generate all sizes
```

---

## 4️⃣ CUSTOMIZE SHOP ITEMS

### Add New Particle Effect

```javascript
// File: src/data/ShopItems.js
// In particles array:
{
  id: 'particle_your_custom',
  name: 'Your Particle',
  description: 'Your particle effect',
  price: 600,
  unlocked: false,
  level: 15,
  emoji: '✨',  // ← Change emoji
}
```

### Add New Ball Style

```javascript
// File: src/data/ShopItems.js
// In balls array:
{
  id: 'ball_your_custom',
  name: 'Your Ball',
  description: 'Your ball style',
  price: 500,
  unlocked: false,
  level: 12,
  emoji: '🎾',     // ← Change emoji
  color: '#00FF00', // ← Change color
}
```

### Change Prices
```javascript
// File: src/data/ShopItems.js
// Simply change the price field:
price: 1500,  // ← Make more expensive
// or
price: 100,   // ← Make cheaper
```

### Change Level Requirements
```javascript
// File: src/data/ShopItems.js
level: 20,  // ← Unlock at level 20
```

---

## 5️⃣ MODIFY GAME CONSTANTS

### File: `src/utils/GameLogic.js`

#### Change Game Duration
```javascript
export const GAME_CONSTANTS = {
  CLASSIC_DURATION: 30,  // ← Change to 60 for longer games
  RUSH_DURATION: 30,
  ZEN_DURATION: 60,
  // ...
};
```

#### Change Spawn Speed
```javascript
export const GAME_CONSTANTS = {
  CLASSIC_SPAWN_INTERVAL: 1000,  // ← Lower = faster spawns (e.g., 800)
  RUSH_SPAWN_INTERVAL: 700,
  ZEN_SPAWN_INTERVAL: 1500,
  // ...
};
```

#### Change Target Sizes
```javascript
export const GAME_CONSTANTS = {
  TARGET_BASE_SIZE: 70,   // ← Bigger = easier (e.g., 90)
  TARGET_MIN_SIZE: 50,    // ← Smaller = harder (e.g., 40)
  TARGET_MAX_SIZE: 90,
  // ...
};
```

#### Change Health
```javascript
export const GAME_CONSTANTS = {
  MAX_HEALTH: 5,  // ← Change to 3 for harder, 10 for easier
  // ...
};
```

#### Change XP Progression
```javascript
// File: src/utils/GameLogic.js
// Lines 156-191

const BASE_XP_EASY = 300;            // ← Level 1→2 XP (lower = faster leveling)
const XP_EXPONENTIAL_MULTIPLIER = 1.15;  // ← Higher = slower progression
```

---

## 6️⃣ ADD/REMOVE FEATURES

### Remove Stats Screen
```javascript
// File: src/screens/MenuScreen.js
// Comment out or remove:
<Pressable
  onPress={() => navigation.navigate('Stats')}
>
  {/* ... */}
</Pressable>
```

### Remove Leaderboard
```javascript
// File: src/screens/MenuScreen.js
// Comment out or remove:
<Pressable
  onPress={() => navigation.navigate('Leaderboard')}
>
  {/* ... */}
</Pressable>
```

### Add New Game Mode

#### Step 1: Define Mode
```javascript
// File: src/utils/GameLogic.js
export const GAME_MODES = {
  CLASSIC: 'classic',
  RUSH: 'rush',
  ZEN: 'zen',
  YOUR_MODE: 'your_mode',  // ← Add new mode
};
```

#### Step 2: Add Constants
```javascript
export const GAME_CONSTANTS = {
  // ... existing constants
  YOUR_MODE_DURATION: 45,
  YOUR_MODE_SPAWN_INTERVAL: 900,
  YOUR_MODE_TARGET_LIFETIME: 2000,
};
```

#### Step 3: Add Menu Button
```javascript
// File: src/screens/MenuScreen.js
<Pressable
  onPress={() => navigation.navigate('Game', { mode: GAME_MODES.YOUR_MODE })}
>
  <Text>Your Mode</Text>
</Pressable>
```

#### Step 4: Update GameScreen Logic
```javascript
// File: src/screens/GameScreen.js
// Add mode-specific logic in useEffect hooks and handleTap
```

---

## 7️⃣ CUSTOMIZE UI TEXT & COPY

### Menu Screen
```javascript
// File: src/screens/MenuScreen.js

// Change button labels:
<Text style={styles.buttonText}>Play Now</Text>     // ← Change "Play"
<Text style={styles.buttonText}>Relax Mode</Text>   // ← Change "Zen Mode"
<Text style={styles.buttonText}>Speed Mode</Text>   // ← Change "Rush Mode"
```

### Settings
```javascript
// File: src/components/SettingsModal.js

// Change labels:
<Text style={styles.settingLabel}>🎵 Music</Text>      // ← Simplify
<Text style={styles.settingLabel}>🔊 SFX</Text>        // ← Shorten
```

### Shop
```javascript
// File: src/screens/ShopScreen.js

// Change header:
<Text style={styles.headerTitle}>🏪 Store</Text>  // ← Change "Theme Shop"
```

---

## 8️⃣ TESTING YOUR RESKIN

### Checklist

#### Visual Testing
- [ ] App icon loads correctly (iOS & Android)
- [ ] Splash screen displays your branding
- [ ] Menu shows new name/colors
- [ ] Shop items show new themes/particles
- [ ] Gameplay uses new color scheme
- [ ] Settings screen functional

#### Functional Testing
- [ ] All buttons navigate correctly
- [ ] Theme selection works
- [ ] Shop purchases work
- [ ] Stats track correctly
- [ ] Leaderboard saves scores
- [ ] Music/sound toggles work
- [ ] Game modes play correctly

#### Build Testing
```bash
# Test on iOS simulator
npm run ios

# Test on Android emulator
npm run android

# Test web version
npm run web
```

---

## 🎨 DESIGN TIPS

### Color Palette Generators
- **Coolors.co** - Generate harmonious palettes
- **Adobe Color** - Advanced color tools
- **Material Design Colors** - Pre-made palettes

### Icon Generators
- **AppIcon.co** - Generate all sizes from one image
- **MakeAppIcon.com** - Free app icon generator
- **Figma** - Professional design tool (free tier)

### Asset Requirements

| Asset | Size | Format | Notes |
|-------|------|--------|-------|
| App Icon | 1024x1024 | PNG | Transparent background |
| Adaptive Icon | 1024x1024 | PNG | Safe zone for Android |
| Splash Screen | 1284x2778 | PNG | iOS max resolution |
| Favicon | 32x32 | PNG/ICO | For web version |

---

## 🚀 QUICK RESKIN (15 MINUTES)

If you want to do a **minimal rebrand** quickly:

```bash
# 1. Change app name (2 minutes)
- Edit app.json: name, slug
- Edit package.json: name
- Edit MenuScreen.js: title text

# 2. Change colors (5 minutes)
- Edit theme.js: PRIMARY, SECONDARY colors
- Edit app.json: splash.backgroundColor

# 3. Replace icon (3 minutes)
- Replace assets/icon.png with your 1024x1024 icon
- Replace assets/splash.png with your splash

# 4. Test (5 minutes)
- npm start
- Verify everything looks correct
```

---

## 🎯 ADVANCED CUSTOMIZATION

### Change Font
```javascript
// File: src/styles/theme.js
import * as Font from 'expo-font';

export const loadFonts = () => {
  return Font.loadAsync({
    'YourFont-Bold': require('../assets/fonts/YourFont-Bold.ttf'),
    'YourFont-Regular': require('../assets/fonts/YourFont-Regular.ttf'),
  });
};

// Then update TYPOGRAPHY
export const TYPOGRAPHY = {
  bold: 'YourFont-Bold',
  regular: 'YourFont-Regular',
  // ...
};
```

### Add Sound Effects
```bash
# 1. Add your .wav files to:
assets/sounds/your_sound.wav

# 2. Load in SoundManager:
// File: src/services/SoundManager.js
const SOUNDS = {
  tap: require('../../assets/sounds/your_tap.wav'),
  // ... more sounds
};
```

### Customize Particles
```javascript
// File: src/components/Particle.js
// Modify animation, size, behavior
```

---

## 📦 BEFORE YOU PUBLISH

### Final Checklist
- [ ] Changed all "Reflexion" references
- [ ] Updated app name in app.json
- [ ] Replaced all assets (icon, splash)
- [ ] Tested on real devices (iOS & Android)
- [ ] Verified shop works
- [ ] Verified stats/leaderboard work
- [ ] Verified music/sound toggles
- [ ] Removed any test data
- [ ] Updated privacy policy (if needed)
- [ ] Created App Store screenshots
- [ ] Written app description

### Build for Production
```bash
# iOS (requires Mac)
eas build --platform ios

# Android
eas build --platform android

# Or use Expo's build service:
expo build:android
expo build:ios
```

---

## 🆘 TROUBLESHOOTING

### "App won't start after reskin"
- Check app.json for syntax errors
- Verify bundleIdentifier/package names are valid
- Run `npm install` again
- Clear cache: `expo start --clear`

### "Colors didn't change"
- Make sure you edited `src/styles/theme.js`
- Check if components use theme values
- Restart the app completely

### "Icon didn't update"
- Clear Expo cache: `expo start --clear`
- Delete app from device and reinstall
- Ensure icon.png is exactly 1024x1024

---

## 💡 PRO TIPS

1. **Test on Real Devices**: Simulators don't show true colors/performance
2. **Keep Backups**: Save original files before major changes
3. **Use Version Control**: Git commit before each change
4. **Document Changes**: Keep notes on what you modified
5. **Test Incrementally**: Change one thing, test, then move on

---

## 🎉 YOU'RE READY!

Your reskinned game is ready to publish. Remember:
- ✅ All core features remain functional
- ✅ Code quality is maintained
- ✅ Performance is optimized
- ✅ Documentation is complete

**Good luck with your launch!** 🚀

---

*For technical details, see REFLEXION_V3_UPGRADE_REPORT.md*  
*For feature documentation, see NEW_FEATURES_GUIDE.md*

---

**Reflexion v3.0** - Built for easy customization  
**Time to Reskin**: 15 minutes - 2 hours  
**Difficulty**: Beginner-friendly  

---

*End of Reskin Guide*

