# 🚀 Neon Tap - Production Build Guide

## Complete Guide for App Store & Play Store Release

---

## 📋 Pre-Build Checklist

### 1. Assets Ready ✓
- [ ] App icon generated (1024x1024px) → `assets/icon.png`
- [ ] Adaptive icon created (Android) → `assets/adaptive-icon.png`
- [ ] Splash screen designed → `assets/splash.png`
- [ ] All sound files in place (7 .wav files in `assets/sounds/`)

### 2. Configuration Complete ✓
- [ ] `app.json` updated with correct bundle IDs
- [ ] Version number set (e.g., "1.0.0")
- [ ] Orientation locked to portrait
- [ ] Permissions declared

### 3. Code Quality ✓
- [ ] No console errors
- [ ] No linter warnings
- [ ] All imports resolved
- [ ] Performance optimized (React.memo, useCallback)

### 4. Testing Complete ✓
- [ ] Tested on iOS simulator
- [ ] Tested on Android emulator
- [ ] Tested all game mechanics
- [ ] Tested sound system
- [ ] Tested haptic feedback
- [ ] Tested settings modal
- [ ] Tested achievements
- [ ] Tested shop purchases
- [ ] Tested game over flow

---

## 🔧 Step 1: Install EAS CLI

```bash
# Install Expo Application Services CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure your project
eas build:configure
```

---

## 🎯 Step 2: Update app.json

Ensure your `app.json` has these critical settings:

```json
{
  "expo": {
    "name": "Neon Tap",
    "slug": "neon-tap",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourstudio.neontap",
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.yourstudio.neontap",
      "versionCode": 1
    }
  }
}
```

**Important:** Replace `com.yourstudio.neontap` with your actual bundle ID.

---

## 📦 Step 3: Build for Production

### iOS Build

```bash
# Create production build for App Store
eas build --platform ios --profile production

# For internal testing (TestFlight)
eas build --platform ios --profile preview
```

### Android Build

```bash
# Create production AAB for Play Store
eas build --platform android --profile production

# For internal testing (APK)
eas build --platform android --profile preview
```

### Build Both Platforms

```bash
# Build for both iOS and Android
eas build --platform all --profile production
```

---

## ⚙️ Step 4: Create EAS Build Configuration

Create `eas.json` in your project root:

```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 🍎 Step 5: iOS App Store Submission

### Prerequisites
- Apple Developer Account ($99/year)
- App Store Connect access
- Valid provisioning profiles

### Steps

1. **Build the app:**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Wait for build to complete** (check status at expo.dev)

3. **Download the .ipa file** from expo.dev/builds

4. **Upload to App Store Connect:**
   ```bash
   eas submit --platform ios
   ```

5. **Fill out App Store metadata:**
   - App name: "Neon Tap"
   - Subtitle: "Ultimate Reflex Challenge"
   - Description: (See template below)
   - Keywords: tap, reflex, arcade, neon, combo, casual
   - Screenshots: 5-10 screenshots per device size
   - Age rating: 4+ (no objectionable content)
   - Privacy policy URL (required)

6. **Submit for review**

### App Store Description Template

```
🎯 NEON TAP - The Ultimate Reflex Challenge

Test your reflexes in this addictive neon arcade game! Tap glowing targets before they disappear and build massive combos for the ultimate high score.

⚡ FEATURES:
• Fast-paced tap gameplay
• Dynamic combo system
• Stunning neon visual effects
• 7 unlockable color themes
• Achievement system
• Haptic feedback
• Smooth animations
• Offline play

🎮 HOW TO PLAY:
Tap glowing circles before they vanish (2 seconds each). Build combos by tapping consecutively without missing. Avoid missing targets or you'll lose health!

🏆 COMPETE & PROGRESS:
• Earn XP to level up
• Collect coins to unlock themes
• Complete achievements
• Beat your high score
• Master 50x combo streaks

Perfect for quick gaming sessions or extended play. No ads interrupting gameplay - just pure, addictive fun!

Download now and become a Neon Tap master! ⚡
```

---

## 🤖 Step 6: Google Play Store Submission

### Prerequisites
- Google Play Console account ($25 one-time fee)
- Developer account verified

### Steps

1. **Build the app:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Wait for build** (generates .aab file)

3. **Submit to Play Store:**
   ```bash
   eas submit --platform android
   ```

4. **Create Play Store listing:**
   - App name: "Neon Tap"
   - Short description: (50 chars) "Fast-paced neon arcade reflex game"
   - Full description: (See template above)
   - Category: Casual / Arcade
   - Content rating: Everyone
   - Screenshots: 2-8 screenshots
   - Feature graphic: 1024x500px banner
   - Privacy policy URL (required)

5. **Set up app pricing & distribution:**
   - Free app
   - Available countries: Select all or specific
   - No ads (unless implementing AdMob)

6. **Submit for review**

---

## 🎨 Step 7: Store Assets

### Screenshots (Required)

**iOS Sizes:**
- 6.7" (iPhone 14 Pro Max): 1290x2796px
- 6.5" (iPhone 11 Pro Max): 1242x2688px
- 5.5" (iPhone 8 Plus): 1242x2208px
- iPad Pro (12.9"): 2048x2732px

**Android Sizes:**
- Phone: 1080x1920px (minimum)
- 7" Tablet: 1024x600px
- 10" Tablet: 1280x800px

**Capture Screenshots:**
```bash
# Run on device/simulator
npx expo start --ios  # or --android

# Take screenshots of:
1. Main menu with player stats
2. Active gameplay with targets
3. High combo moment (10x+)
4. Game over screen with rewards
5. Shop with themes
6. Achievements page
```

### Feature Graphic (Android Only)
- Size: 1024x500px
- Format: PNG or JPEG
- Content: Game logo + key visual elements
- No text that's critical to understanding

---

## 🔒 Step 8: Privacy Policy

**Required for both stores.**

### Quick Privacy Policy Template

Create a page on your website or use a generator:

```
Privacy Policy for Neon Tap

Last updated: [DATE]

This privacy policy describes how Neon Tap collects, uses, and shares information.

1. Information We Collect:
- Device information (OS version, device model)
- Game progress data (stored locally)
- Analytics data (game events, session duration)

2. How We Use Information:
- To provide and improve the game
- To analyze game performance
- To fix bugs and issues

3. Data Storage:
- All game data stored locally on your device
- No personal information collected
- No data sold to third parties

4. Third-Party Services:
- Expo (app infrastructure)
- Google Analytics (optional, anonymized)

5. Children's Privacy:
- No data collected from children under 13

6. Your Rights:
- Delete app to remove all data
- No account required

Contact: support@yourdomain.com
```

Use these free generators:
- https://www.freeprivacypolicy.com/
- https://www.privacypolicygenerator.info/

---

## 🧪 Step 9: Testing Before Submission

### iOS TestFlight
```bash
# Build for testing
eas build --platform ios --profile preview

# Invite testers via App Store Connect
# Get feedback before official release
```

### Android Internal Testing
```bash
# Build APK
eas build --platform android --profile preview

# Upload to Play Console Internal Testing
# Share with up to 100 testers
```

---

## 📊 Step 10: Post-Launch Monitoring

### Analytics to Track
- Daily Active Users (DAU)
- Average session length
- Retention rate (Day 1, Day 7, Day 30)
- Most popular features
- Crash rate
- Average score
- Combo achievements

### App Store Optimization (ASO)
- Monitor keyword rankings
- A/B test screenshots
- Update description based on user feedback
- Respond to reviews promptly
- Update regularly with new features

---

## 🔄 Step 11: Updates & Maintenance

### Regular Updates
```bash
# Increment version in app.json
{
  "version": "1.0.1",
  "ios": { "buildNumber": "1.0.1" },
  "android": { "versionCode": 2 }
}

# Build and submit
eas build --platform all --profile production
eas submit --platform all
```

### OTA Updates (Over-The-Air)
```bash
# For minor updates (JS changes only)
eas update --branch production --message "Bug fixes and improvements"
```

---

## 🚨 Common Issues & Solutions

### Issue: Build Fails
**Solution:**
```bash
# Clear cache and retry
eas build:configure
eas build --clear-cache --platform [ios/android]
```

### Issue: App Rejected
**Common reasons:**
- Missing privacy policy
- Incomplete metadata
- Crashes during review
- Performance issues

**Solution:** Fix the specific issue mentioned in rejection notice and resubmit.

### Issue: Slow Build Times
**Solution:**
- Use `eas build:list` to check queue
- Upgrade to EAS paid plan for priority builds
- Build during off-peak hours

---

## 💰 Cost Breakdown

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer | $99 | Yearly |
| Google Play Console | $25 | One-time |
| EAS Build (Optional) | $29/mo | Monthly |
| Domain for privacy policy | $10-15 | Yearly |
| **Total Year 1** | ~$163-178 | - |
| **Total Year 2+** | ~$109-124 | - |

**Free Alternative:** Use EAS free tier (limited builds/month)

---

## ✅ Final Checklist Before Submission

- [ ] All features working perfectly
- [ ] No crashes or major bugs
- [ ] Sound system functional
- [ ] Haptic feedback working
- [ ] Settings save and load correctly
- [ ] Game Over flow works
- [ ] Achievements track properly
- [ ] Shop purchases persist
- [ ] App icon looks great
- [ ] Screenshots are high-quality
- [ ] Privacy policy published
- [ ] Bundle IDs are correct
- [ ] Version numbers set
- [ ] App metadata completed
- [ ] Age rating appropriate
- [ ] Keywords optimized
- [ ] Description compelling
- [ ] Support email provided

---

## 🎉 Launch Day

1. **Submit to both stores**
2. **Announce on social media**
3. **Share with friends/family**
4. **Post on Reddit** (r/androidapps, r/iosgaming)
5. **Monitor initial reviews**
6. **Respond to feedback**
7. **Plan first update**

---

## 📞 Support

**Expo Documentation:**
- https://docs.expo.dev/build/introduction/
- https://docs.expo.dev/submit/introduction/

**App Store Connect:**
- https://appstoreconnect.apple.com/

**Google Play Console:**
- https://play.google.com/console/

**Questions?**
- Expo Forums: https://forums.expo.dev/
- Stack Overflow: Tag `expo` or `react-native`

---

**Good luck with your launch! 🚀⚡**

*Remember: The first submission is the hardest. After that, updates are much easier!*


