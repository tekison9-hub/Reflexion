# 🎮 REFLEXION v6.0 - Installation Guide

## Quick Start (2 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the App
```bash
npm start
```

That's it! The app will run in local mode with all features working.

---

## Optional: Firebase Cloud Features (2 Minutes)

If you want cloud leaderboards and player sync:

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add Project"
3. Name it "Reflexion" → Continue
4. Enable Google Analytics (optional) → Create Project

### Step 2: Add Web App
1. Click the **Web** icon (</>) on project homepage
2. Register app nickname: "Reflexion Web"
3. Click "Register app"
4. **Copy the config object**

### Step 3: Update Firebase Config
Open `src/config/firebase.js` and replace the `FIREBASE_CONFIG` object:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};
```

### Step 4: Enable Firebase Services
1. **Realtime Database:**
   - Click "Realtime Database" in left menu
   - Click "Create Database"
   - Start in **test mode** → Enable
   
2. **Authentication:**
   - Click "Authentication" in left menu
   - Click "Get Started"
   - Enable "Anonymous" sign-in method

3. **Analytics** (optional):
   - Already enabled if you chose it during project creation

### Step 5: Restart App
```bash
npm start
```

You should now see:
```
✅ Firebase initialized successfully
```

---

## Troubleshooting

### "expo-audio not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Music Not Playing
- Check if `assets/music/` folder exists
- Music files are optional - app works without them
- Toggle music in Settings screen

### Firebase Errors
- Verify you copied the config correctly
- Check Firebase console shows services are enabled
- App works fine in local mode without Firebase

---

## Build for Production

### Android APK
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build
eas build --platform android --profile production
```

### iOS IPA
```bash
eas build --platform ios --profile production
```

---

## Features Included

✅ 4 Game Modes (Classic, Rush, Zen, Speed Test)  
✅ Theme Shop with cosmetics  
✅ Stats & Leaderboards (local)  
✅ XP & Leveling System  
✅ Coin Economy  
✅ Settings (Music, SFX, Haptics)  
✅ Share Score functionality  
✅ Firebase ready (optional cloud features)  
✅ SDK54 compatible  
✅ Zero warnings, Zero errors  

---

## Support

- **Local Mode:** Works offline, no setup required
- **Cloud Mode:** Optional Firebase for leaderboards and sync
- **Documentation:** See `SDK54_MIGRATION_COMPLETE.md` for full details

**Ready to launch!** 🚀

