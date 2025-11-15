# 🚀 ReflexXP - Installation Guide

**Quick Start Guide for ReflexXP Game**

---

## 📦 Step 1: Install Dependencies

```bash
# Navigate to project directory
cd C:\Users\elifn\Desktop\NeonTapSetup\NeonTap

# Install all dependencies (including new expo-asset)
npm install
```

**New Dependency Added:**
- `expo-asset@~11.0.1` - Required for Asset.fromModule support in Expo Go

---

## 🎮 Step 2: Start Development Server

```bash
# Start Expo development server with cleared cache
npx expo start --clear
```

---

## 📱 Step 3: Test in Expo Go

1. **Install Expo Go** on your device (iOS/Android)
2. **Scan QR code** from the terminal
3. **Test all features**:
   - ✅ Menu with glowing "ReflexXP" title
   - ✅ Three game mode buttons
   - ✅ Classic Mode gameplay
   - ✅ Rush Mode (unlocks at Level 10)
   - ✅ Zen Mode (unlocks at Level 20)
   - ✅ Theme changes with level
   - ✅ Power Bar activation
   - ✅ Camera shake on combos
   - ✅ Sound playback
   - ✅ Game Over flow

---

## 🧪 Step 4: Verify Console Logs

Watch the console for:
```
✅ Sound loaded: tap.wav
✅ Sound loaded: miss.wav
✅ Sound loaded: combo.wav
⚡ Level 2 → Difficulty 1.08x | Spawn: 800ms | Score: 210 | Mode: classic
⚡ ReflexXP Power Bar ACTIVATED! 2× XP for 10s
💥 Rush Combo Multiplier: 1.2×
🧠 Zen Mode: Relaxing gameplay activated
🎨 Theme Unlocked! Hyper Lane
```

---

## 🏗️ Step 5: Build for Production

```bash
# Install EAS CLI (if not installed)
npm install -g eas-cli

# Login to Expo
eas login

# Build for both platforms
eas build --platform all --profile production
```

---

## ⚠️ Troubleshooting

### Issue: "Cannot find module expo-asset"
**Solution**: Run `npm install` to install the new dependency

### Issue: Sounds not playing in Expo Go
**Solution**: 
1. Ensure `expo-asset` is installed
2. Check console for sound loading logs
3. Verify sound files exist in `assets/sounds/`

### Issue: Theme not changing
**Solution**: 
1. Level up to unlock new themes
2. Check console for theme unlock logs
3. Verify player level calculation

### Issue: Game modes not unlocking
**Solution**:
1. Rush Mode unlocks at Level 10
2. Zen Mode unlocks at Level 20
3. Check player level in menu stats

---

## 📚 Documentation

- **CHANGELOG.md** - Complete transformation documentation
- **REFLEXXP_TRANSFORMATION_COMPLETE.md** - Transformation summary
- **This Guide** - Installation and setup

---

## ✅ Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Development server starts (`npx expo start --clear`)
- [ ] App loads in Expo Go
- [ ] Menu displays correctly
- [ ] Sounds play correctly
- [ ] Game modes work
- [ ] Themes change with level
- [ ] Power Bar activates
- [ ] Camera shake works
- [ ] Game Over flow works
- [ ] No console errors

---

## 🎉 Ready to Play!

Your ReflexXP game is ready to test and play!

**Next Steps:**
1. Test all features in Expo Go
2. Generate app icon (1024x1024 PNG)
3. Create splash screen
4. Build for production
5. Submit to App Store/Play Store

---

**Built with ❤️ for dopamine-driven gaming excellence**

**Expo SDK 54 | React 19.1 | React Native 0.81.5**


