# 🚀 Run and Build Guide - ReflexXP

**Purpose**: Step-by-step instructions for running development server and building production apps.

---

## Prerequisites

### Required Software
- **Node.js**: v18.x or v20.x
- **npm**: v9.x or v10.x (comes with Node)
- **Expo CLI**: Will be installed via npx (no global install needed)
- **Git**: For version control

### Required Accounts (for building)
- **Expo Account**: Sign up at [expo.dev](https://expo.dev)
- **Apple Developer Account**: For iOS builds ($99/year)
- **Google Play Developer Account**: For Android builds ($25 one-time)

### Development Devices
- **Physical Device**: iOS or Android with Expo Go app
- **Simulator**: Xcode (Mac) or Android Studio (any OS)

---

## Quick Start (Development)

### 1. Install Dependencies
```bash
cd NeonTap  # Or your project directory
npm install
```

**Expected Output**:
```
added 667 packages, and audited 668 packages in 15s
found 0 vulnerabilities
```

### 2. Start Development Server
```bash
npx expo start --clear
```

**Options**:
- `--clear`: Clears Metro bundler cache (recommended for first run)
- `--android`: Opens directly on Android device/emulator
- `--ios`: Opens directly on iOS simulator (Mac only)
- `--web`: Opens in web browser (experimental)

**Expected Output**:
```
Starting Metro Bundler
Metro waiting on exp://192.168.1.xxx:8081

› Press a │ open Android
› Press i │ open iOS simulator  
› Press w │ open web
› Press r │ reload app
› Press m │ toggle menu
```

### 3. Open on Device

#### Option A: Physical Device (Recommended)
1. Install **Expo Go** app from App Store or Play Store
2. Scan the QR code displayed in terminal
3. App will load on your device

#### Option B: iOS Simulator (Mac Only)
```bash
# Press 'i' in Metro terminal OR
npx expo start --ios
```

#### Option C: Android Emulator
```bash
# Make sure Android Studio emulator is running, then:
# Press 'a' in Metro terminal OR
npx expo start --android
```

---

## Verify Installation

### Check Project Health
```bash
npx expo-doctor
```

**Expected Output**:
```
Running 17 checks on your project...
15/17 checks passed.

✖ Check Expo config (app.json/ app.config.js) schema
  Field: icon - cannot access file at './assets/icon.png'.
  (Non-blocking: App works without icon in development)
```

### Check Package Versions
```bash
npm list --depth=0
```

**Expected Key Packages**:
```
expo@54.0.0
react@19.1.0
react-native@0.81.5
expo-av@16.0.7
expo-haptics@15.0.7
@react-navigation/native@7.0.10
react-native-reanimated@4.1.1
```

---

## Development Workflow

### File Watching (Hot Reload)
- Metro bundler watches for file changes
- Save any file → App reloads automatically
- Fast Refresh preserves React state

### Manual Reload
- Shake device → Reload
- Or press `r` in Metro terminal

### Debug Menu
- Shake device → "Debug Remote JS" (opens Chrome DevTools)
- Or press `m` in Metro terminal

### Console Logs
All `console.log()` statements appear in:
- Metro bundler terminal
- Expo Go app (shake → "Show Performance Monitor")
- Chrome DevTools (if remote debugging enabled)

---

## Common Development Commands

### Clear Everything and Restart
```bash
npx expo start --clear
```

### Reset Metro Cache
```bash
npx expo start --reset-cache
```

### Full Clean Restart
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

### Check TypeScript Errors (if using TS)
```bash
npx tsc --noEmit
```

### Run Linter
```bash
npx eslint . --ext .js,.jsx
```

---

## Building for Production

### Setup EAS CLI

#### 1. Install EAS CLI Globally
```bash
npm install -g eas-cli
```

#### 2. Login to Expo
```bash
eas login
```

Enter your Expo account credentials.

#### 3. Configure Project
```bash
eas build:configure
```

This creates `eas.json` (already exists in ReflexXP).

### Verify `eas.json` Configuration

**File**: `eas.json`
```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true },
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": { "simulator": false }
    }
  }
}
```

---

## Build Commands

### Android APK (Testing)
```bash
eas build --platform android --profile preview
```

**Output**: APK file you can install directly on Android device  
**Use Case**: Testing, internal distribution, beta testers

### Android App Bundle (Production)
```bash
eas build --platform android --profile production
```

**Output**: AAB file for Google Play Store  
**Use Case**: Publishing to Play Store

### iOS Simulator Build (Testing - Mac Only)
```bash
eas build --platform ios --profile development
```

**Output**: `.tar.gz` file with `.app` for iOS Simulator  
**Use Case**: Testing on Mac without device

### iOS App Store Build (Production)
```bash
eas build --platform ios --profile production
```

**Output**: `.ipa` file for App Store  
**Use Case**: Publishing to App Store

### Build Both Platforms
```bash
eas build --platform all --profile production
```

---

## Build Process Explained

### 1. Start Build
```bash
eas build --platform android --profile production
```

### 2. EAS Prepares Build
- Uploads your code to Expo servers
- Sets up build environment
- Installs dependencies

### 3. Build Runs (10-30 minutes)
- Compiles native code
- Bundles JavaScript
- Signs app with credentials

### 4. Build Completes
```
✔ Build finished successfully
Build ID: abc123-def456
Download: https://expo.dev/artifacts/abc123.apk
```

### 5. Download & Test
```bash
# Download URL is provided
# Or view in dashboard: expo.dev/accounts/[username]/projects/reflexxp/builds
```

---

## Credentials Management

### Android Keystore

#### Option A: EAS Manages (Recommended)
```bash
eas build --platform android
# EAS will prompt: "Would you like us to handle this?"
# Answer: Yes
```

EAS will generate and store keystore for you.

#### Option B: Provide Your Own
```bash
eas credentials
# Select Android → Production → Keystore
# Upload your .jks file
```

### iOS Provisioning & Certificates

#### Option A: EAS Manages (Recommended)
```bash
eas build --platform ios
# EAS will prompt for Apple ID
# EAS will generate certificates
```

#### Option B: Manual
1. Create App ID in Apple Developer Portal
2. Create Distribution Certificate
3. Create Provisioning Profile
4. Upload to EAS:
```bash
eas credentials
# Select iOS → Production → Upload
```

---

## Submitting to Stores

### Submit to Google Play
```bash
eas submit --platform android --latest
```

**Prerequisites**:
- Google Play Developer account ($25)
- App created in Play Console
- Service account JSON key

**First Time Setup**:
```bash
eas submit --platform android
# Follow prompts to configure
```

### Submit to App Store
```bash
eas submit --platform ios --latest
```

**Prerequisites**:
- Apple Developer account ($99/year)
- App created in App Store Connect
- Apple ID credentials

**First Time Setup**:
```bash
eas submit --platform ios
# Follow prompts to configure
```

---

## Build Profiles Explained

### Development Profile
- **Purpose**: Internal testing, development builds
- **Signing**: Development certificate
- **Distribution**: Internal (TestFlight, email, direct install)
- **Size**: Larger (includes debug symbols)

### Preview Profile
- **Purpose**: Beta testing, stakeholder review
- **Signing**: Ad Hoc (iOS) or Debug (Android)
- **Distribution**: Internal (limited devices)
- **Size**: Medium

### Production Profile
- **Purpose**: App Store / Play Store release
- **Signing**: Distribution certificate
- **Distribution**: Public (via stores)
- **Size**: Optimized, smallest

---

## Environment Variables

### Define Variables in `app.config.js`

**Create**: `app.config.js` (instead of `app.json`)
```javascript
export default {
  expo: {
    name: "ReflexXP",
    slug: "reflexxp",
    version: "1.0.0",
    extra: {
      apiUrl: process.env.API_URL || "https://api.reflexxp.com",
      analyticsKey: process.env.ANALYTICS_KEY,
    },
    // ... rest of config
  }
};
```

### Access in Code
```javascript
import Constants from 'expo-constants';

const apiUrl = Constants.expoConfig.extra.apiUrl;
```

### Set for Builds
```bash
# In eas.json, add:
"production": {
  "env": {
    "API_URL": "https://api.reflexxp.com",
    "ANALYTICS_KEY": "prod_key_12345"
  }
}
```

---

## Troubleshooting Builds

### Build Failed - Dependency Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Try build again
eas build --platform android --clear-cache
```

### Build Failed - Native Modules
```
Error: Unable to resolve module react-native-reanimated
```

**Fix**:
1. Check `babel.config.js` includes reanimated plugin (last):
```javascript
plugins: [
  'react-native-reanimated/plugin',
],
```

2. Clear cache and rebuild:
```bash
npx expo start --clear
```

### Build Failed - Credentials
```
Error: No valid iOS Distribution certificate
```

**Fix**:
```bash
eas credentials
# Revoke old certificates
# Generate new ones
```

### Build Timeout
```
Error: Build timed out after 30 minutes
```

**Causes**:
- Large dependencies
- Slow Expo servers

**Fix**:
- Retry build (often succeeds second time)
- Use `--clear-cache` flag

---

## Over-the-Air (OTA) Updates

### What are OTA Updates?
- Update JavaScript code without new build
- Users get updates instantly (no store approval)
- Cannot update native code (use for bug fixes, UI changes)

### Setup (Already Configured)
In `app.json`:
```json
{
  "expo": {
    "runtimeVersion": {
      "policy": "sdkVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/your-project-id"
    }
  }
}
```

### Publish Update
```bash
eas update --branch production --message "Fix: Game over button"
```

### View Updates
```bash
eas update:list
```

---

## Testing Builds

### Test Android APK
```bash
# Download APK from EAS
# Install on device:
adb install path/to/reflexxp.apk

# Or email APK to testers
```

### Test iOS IPA
```bash
# Use TestFlight (recommended)
eas submit --platform ios --latest

# Or use Xcode to install directly:
# Devices & Simulators → Add to device
```

---

## Build Checklist

Before building for production:

- [ ] Update version in `app.json` (e.g., `1.0.1` → `1.0.2`)
- [ ] Test thoroughly on physical devices
- [ ] Run `npx expo-doctor` (no blocking issues)
- [ ] Check all sounds/assets are included
- [ ] Verify app icon and splash screen exist
- [ ] Update `CHANGELOG.md` with changes
- [ ] Commit all changes to Git
- [ ] Tag release: `git tag v1.0.2`
- [ ] Run build command
- [ ] Test downloaded build before submitting
- [ ] Submit to stores
- [ ] Monitor crash reports and user feedback

---

## Continuous Integration (Optional)

### GitHub Actions Example
**File**: `.github/workflows/build.yml`
```yaml
name: EAS Build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npx eas-cli build --platform android --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## Performance Optimization

### Enable Hermes Engine (Already Enabled)
In `app.json`:
```json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

### Production Build Size
- **Android**: ~30-50 MB (AAB compressed)
- **iOS**: ~40-60 MB (IPA compressed)

### Reduce Size
- Remove unused assets
- Compress images
- Use WebP instead of PNG
- Remove unused dependencies

---

## Resources

### Official Documentation
- [Expo Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [EAS Update Docs](https://docs.expo.dev/eas-update/introduction/)

### Community
- [Expo Forums](https://forums.expo.dev/)
- [Discord](https://chat.expo.dev/)
- [GitHub Issues](https://github.com/expo/expo/issues)

### Tools
- [Expo Dashboard](https://expo.dev/accounts/[username]/projects)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com/)

---

**Last Updated**: November 10, 2025  
**Version**: 1.0  
**Maintainer**: Senior DevOps / Tech Lead


