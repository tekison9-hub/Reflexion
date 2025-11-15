# 🚀 REFLEXION v5.0 — INSTALLATION GUIDE

**Quick Setup:** 5 minutes  
**Target:** Buyers, Developers, New Contributors

---

## 📋 PREREQUISITES

- **Node.js:** v20.15.1+ (tested) or v20.19.4+ (recommended)
- **npm:** v10.7.0+
- **Expo CLI:** Latest (auto-installed with dependencies)
- **Platform:** Windows, macOS, or Linux

---

## 🛠️ STEP 1: INSTALL DEPENDENCIES

### Option A: Fresh Install (Recommended)
```bash
# Navigate to project directory
cd Reflexion

# Install all dependencies
npm install

# Install expo-av explicitly (SDK54 compatible)
npx expo install expo-av

# Verify installation
npm list expo-av
```

**Expected Output:**
```
reflexion@2.0.0 C:\Users\...\Reflexion
└── expo-av@14.0.7
```

### Option B: Clean Install (If Issues)
```bash
# Remove old dependencies
rm -rf node_modules package-lock.json

# Fresh install
npm install
npx expo install expo-av

# Verify
npm list expo-av
```

---

## 🔥 STEP 2: FIREBASE SETUP (OPTIONAL, 2 MINUTES)

### Skip Firebase?
If you don't configure Firebase, the app will work in **local-only mode**:
- ✅ All game modes work
- ✅ Local leaderboard works
- ❌ Cloud leaderboard disabled
- ❌ Analytics disabled

**For local testing, skip to Step 3.**

---

### Configure Firebase (Cloud Sync)

#### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project** → Name it "Reflexion" (or any name)
3. Disable Google Analytics (optional, can enable later)
4. Click **Create Project**

#### 2. Add Web App
1. In Firebase Console → Click **Web** icon (`</>`)
2. Register app: Name it "Reflexion Web"
3. Copy the `firebaseConfig` object

#### 3. Enable Services
**Realtime Database:**
- Go to **Realtime Database** → Create Database
- Choose location (e.g., us-central1)
- Start in **Test Mode** (for development)
- **Security Rules:**
  ```json
  {
    "rules": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
  ```

**Authentication:**
- Go to **Authentication** → Get Started
- Enable **Anonymous** sign-in

**Analytics (Optional):**
- Go to **Analytics** → Enable (auto-enabled for web)

#### 4. Update Config File
Open `src/config/firebase.js` and replace the config:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC...",                              // ← Paste your key
  authDomain: "reflexion-xxxxx.firebaseapp.com",     // ← Paste your domain
  databaseURL: "https://reflexion-xxxxx-default-rtdb.firebaseio.com", // ← Paste URL
  projectId: "reflexion-xxxxx",                       // ← Paste project ID
  storageBucket: "reflexion-xxxxx.appspot.com",      // ← Paste bucket
  messagingSenderId: "123456789",                     // ← Paste sender ID
  appId: "1:123456789:web:abcdef",                   // ← Paste app ID
  measurementId: "G-XXXXXXXXXX"                       // ← Optional (Analytics)
};
```

**Save the file.** Firebase is now configured! ✅

---

## 🚀 STEP 3: RUN THE APP

### Development Mode (Expo Go)
```bash
npx expo start
```

**Options:**
- Press `a` → Open in Android emulator
- Press `i` → Open in iOS simulator
- Press `w` → Open in web browser (limited features)
- Scan QR code with **Expo Go** app (iOS/Android)

**Expected Output:**
```
🔄 Initializing services...
✅ StorageService ready
✅ SettingsService ready
✅ SoundManager ready
✅ MusicManager ready
✅ ProgressTracker ready
✅ LeaderboardService ready
✅ AdService ready
✅ DailyChallengeService ready
🎮 Reflexion initialized successfully
```

**If you see this, the app is running correctly!** ✅

---

## 🧪 STEP 4: VERIFY INSTALLATION

### Test Checklist
1. ✅ App launches without crashes
2. ✅ Menu screen loads with buttons (Play, Shop, Stats, etc.)
3. ✅ Press "Play" → Game starts correctly
4. ✅ Tap targets → Hit detection works
5. ✅ Press "Shop" → Theme Shop loads
6. ✅ Press "Stats" → Stats screen displays
7. ✅ Press "Settings" → Music/SFX toggles work

### Check Console for Warnings
Open Expo Dev Tools console and verify:
- ✅ No "expo-av deprecated" warnings (LogBox suppressed)
- ✅ No "Cannot read property 'get' of undefined" errors
- ✅ Music initializes correctly

**If all tests pass, installation is complete!** 🎉

---

## 🐛 TROUBLESHOOTING

### Issue 1: "expo-audio is not installed"
**Fix:**
```bash
npm uninstall expo-audio expo-video
npx expo install expo-av
npm install
```

---

### Issue 2: "Cannot read property 'get' of undefined"
**Status:** ✅ FIXED in v5.0

**If you still see this:**
1. Clear cache: `npx expo start --clear`
2. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

### Issue 3: Font Loading Error
**Symptom:** "Font 'Orbitron' not loaded"

**Fix:**
```bash
npx expo install @expo-google-fonts/orbitron
npx expo start --clear
```

---

### Issue 4: Firebase Not Working
**Symptom:** "Firebase not configured" warning

**Fix:**
1. Check `src/config/firebase.js` → Ensure your config is pasted correctly
2. Verify Firebase services are enabled (Realtime DB, Auth)
3. Check internet connection
4. Fallback: App will work in local-only mode (no cloud features)

---

### Issue 5: Music Not Playing
**Symptom:** No sound when game starts

**Fix:**
1. Check Settings → Ensure "Music" is ON
2. Check device volume (not muted)
3. iOS: Ensure device is not in silent mode
4. Check console for errors:
   - "Menu music file not found" → Audio files missing (check `assets/music/`)

---

### Issue 6: Node Version Warning
**Symptom:** "Unsupported engine" warnings

**Status:** ⚠️ Non-critical (app works fine)

**Optional Fix:**
```bash
# Install Node v20.19.4+ (optional)
nvm install 20.19.4
nvm use 20.19.4
npm install
```

**Note:** Node v20.15.1 works fine for development.

---

## 📦 STEP 5: BUILD FOR PRODUCTION

### Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Configure Project
```bash
eas build:configure
```

### Build Android APK (Testing)
```bash
eas build --platform android --profile preview
```

### Build Android AAB (Google Play)
```bash
eas build --platform android --profile production
```

### Build iOS IPA (App Store)
```bash
eas build --platform ios --profile production
```

**Build Time:** 10-20 minutes (first build may take longer)

---

## 🎨 STEP 6: RESKIN (OPTIONAL)

### Quick Reskin (Under 1 hour)

**1. Change Colors**
Edit `src/styles/theme.js`:
```javascript
export const COLORS = {
  neonCyan: '#YOUR_COLOR',      // Primary accent
  neonMagenta: '#YOUR_COLOR',   // Secondary accent
  background: '#YOUR_COLOR',    // Dark background
};
```

**2. Replace Music/SFX**
Replace files in `assets/music/` and `assets/sounds/`:
- `menu_ambient.mp3`
- `gameplay_energetic.mp3`
- `zen_calm.mp3`
- `tap.mp3`, `combo.mp3`, `level_up.mp3`

**3. Change App Name & Icon**
- **Name:** Edit `app.json` → `"name": "YourAppName"`
- **Icon:** Replace `assets/icon.png` (1024×1024 PNG)
- **Splash:** Replace `assets/splash.png` (1284×2778 PNG)

**Full Guide:** See `HOW_TO_RESKIN.md`

---

## 📚 ADDITIONAL RESOURCES

- **Detailed Fix Documentation:** `REFLEXION_V5_EXPO_AV_FIX.md`
- **Test Log:** `PRODUCTION_READY_TEST_LOG.md`
- **Reskin Guide:** `HOW_TO_RESKIN.md`
- **Main README:** `README.md`

---

## ✅ INSTALLATION COMPLETE!

**What's Next?**
1. ✅ Run `npx expo start` → Test the app
2. ✅ Configure Firebase (optional, 2 minutes)
3. ✅ Customize theme/colors (optional, 1 hour)
4. ✅ Build APK/IPA for production

**Need Help?**
- Check `PRODUCTION_READY_TEST_LOG.md` for common issues
- Review `REFLEXION_V5_EXPO_AV_FIX.md` for technical details

---

**🎉 WELCOME TO REFLEXION v5.0! 🎉**

**Status:** ✅ PRODUCTION READY  
**Last Updated:** November 14, 2025

