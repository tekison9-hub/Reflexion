# ⚡ REFLEXION v5.0 — QUICK START COMMANDS

**Copy-paste these commands to get started in 2 minutes:**

---

## 🚀 INSTALLATION (2 MINUTES)

```bash
# Navigate to project
cd Reflexion

# Install dependencies
npm install

# Install expo-av (SDK54 compatible)
npx expo install expo-av

# Verify
npm list expo-av
# ✅ Expected: expo-av@16.0.7
```

---

## 🎮 RUN THE APP

```bash
# Start development server
npx expo start

# Then press:
# - 'a' for Android emulator
# - 'i' for iOS simulator
# - 'w' for web browser
# - Or scan QR code with Expo Go app
```

---

## 🔥 FIREBASE SETUP (OPTIONAL, 2 MINUTES)

1. Go to: https://console.firebase.google.com/
2. Create new project → "Reflexion"
3. Add Web App → Copy config
4. Edit `src/config/firebase.js` → Paste your config
5. Enable:
   - Realtime Database (Rules: authenticated users)
   - Anonymous Authentication

**Skip this if you want local-only mode** (no cloud features)

---

## 🧹 CLEAN INSTALL (IF ISSUES)

```bash
# Remove old files
rm -rf node_modules package-lock.json

# Fresh install
npm install
npx expo install expo-av

# Clear cache and start
npx expo start --clear
```

---

## 🔧 TROUBLESHOOTING

### "expo-audio is not installed" Error
```bash
npm uninstall expo-audio expo-video
npx expo install expo-av
npm install
```

### Font Loading Error
```bash
npx expo install @expo-google-fonts/orbitron
npx expo start --clear
```

### "Cannot read property 'get' of undefined"
```bash
npx expo start --clear
```
**Status:** ✅ Fixed in v5.0

---

## 📦 BUILD FOR PRODUCTION

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build Android APK (testing)
eas build --platform android --profile preview

# Build Android AAB (Google Play)
eas build --platform android --profile production

# Build iOS (App Store)
eas build --platform ios --profile production
```

---

## 🎨 QUICK RESKIN

### Change Colors
Edit `src/styles/theme.js`:
```javascript
export const COLORS = {
  neonCyan: '#YOUR_COLOR',
  neonMagenta: '#YOUR_COLOR',
  background: '#YOUR_COLOR',
};
```

### Change App Name
Edit `app.json`:
```json
{
  "name": "YourAppName",
  "displayName": "YourAppName"
}
```

### Replace Icon & Splash
- `assets/icon.png` (1024×1024)
- `assets/splash.png` (1284×2778)

---

## 📚 DOCUMENTATION

| File | Purpose |
|------|---------|
| `README.md` | Main documentation |
| `INSTALL_GUIDE_V5.md` | Step-by-step setup |
| `REFLEXION_V5_EXPO_AV_FIX.md` | Technical details |
| `PRODUCTION_READY_TEST_LOG.md` | Test results |
| `REFLEXION_V5_DELIVERY_SUMMARY.md` | Delivery report |

---

## ✅ VERIFICATION CHECKLIST

After installation, verify:
- ✅ App launches without crashes
- ✅ No "expo-av deprecated" warnings (LogBox suppressed)
- ✅ Music plays in menu (if files exist)
- ✅ Game starts correctly
- ✅ Shop loads
- ✅ Stats screen displays
- ✅ Settings toggles work

---

## 🆘 NEED HELP?

1. Check `INSTALL_GUIDE_V5.md` for detailed setup
2. Check `PRODUCTION_READY_TEST_LOG.md` for common issues
3. Check `REFLEXION_V5_EXPO_AV_FIX.md` for technical details

---

**🚀 READY TO LAUNCH! 🚀**

**Version:** 5.0.0  
**Status:** ✅ PRODUCTION READY  
**Last Updated:** November 14, 2025

