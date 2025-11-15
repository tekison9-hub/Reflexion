# 🔊 Audio Troubleshooting Guide - ReflexXP

**Purpose**: Diagnose and fix audio playback issues in development and production.

---

## Quick Audio Check

### ✅ Expected Behavior
When you launch ReflexXP, you should see these logs in Metro bundler:

```
🔊 Audio mode configured
✅ Sound loaded: tap.wav
✅ Sound loaded: miss.wav
✅ Sound loaded: combo.wav
✅ Sound loaded: coin.wav
✅ Sound loaded: levelUp.wav
✅ Sound loaded: gameOver.wav
✅ Sound loaded: luckyTap.wav
✅ SoundManager fully initialized: 7/7 sounds loaded
```

If you see this, audio should work! If not, continue reading.

---

## Common Issues & Solutions

### 1️⃣ No Sound Logs Appear

**Symptoms**:
- Metro bundler shows no "Sound loaded" messages
- App works but no audio plays

**Possible Causes & Fixes**:

#### Cause A: Sound Files Missing
```bash
# Check if sound files exist
ls -la assets/sounds/
```

**Expected files**:
- `tap.wav`
- `miss.wav`
- `combo.wav`
- `coin.wav`
- `levelup.wav`
- `gameover.wav`
- `lucky.wav`

**Fix**: If missing, re-download sound pack or create placeholder sounds:
```bash
cd assets/sounds
# Use the provided script to generate silent WAV files
node ../../scripts/generate-silent-wavs.js
```

#### Cause B: expo-av Not Installed
```bash
# Check package.json
grep "expo-av" package.json
```

**Expected**: `"expo-av": "~16.0.7"`

**Fix**: Install expo-av:
```bash
npm install expo-av@~16.0.7
npx expo start --clear
```

---

### 2️⃣ Partial Sound Loading

**Symptoms**:
```
⚠️ SoundManager partially initialized: 5/7 sounds loaded
❌ Failed sounds: levelUp, gameOver
```

**Diagnosis**:
```javascript
// In Settings or console, check:
import { soundManager } from './src/services/SoundManager';
console.log(soundManager.getAudioStatus());
```

**Output Example**:
```json
{
  "isInitialized": true,
  "isEnabled": true,
  "totalSounds": 7,
  "loadedSounds": 5,
  "failedSounds": ["levelUp", "gameOver"],
  "healthPercent": 71
}
```

**Possible Fixes**:

#### Fix A: Corrupted Sound Files
- Re-download the failed sound files
- Ensure they are valid WAV format (16-bit PCM recommended)
- Size should be reasonable (< 1 MB each)

#### Fix B: File Path Issues
Check `src/services/SoundManager.js` line 36-44:
```javascript
const soundFiles = {
  tap: require('../../assets/sounds/tap.wav'),
  miss: require('../../assets/sounds/miss.wav'),
  combo: require('../../assets/sounds/combo.wav'),
  coin: require('../../assets/sounds/coin.wav'),
  levelUp: require('../../assets/sounds/levelup.wav'), // ← Check spelling
  gameOver: require('../../assets/sounds/gameover.wav'), // ← Check spelling
  luckyTap: require('../../assets/sounds/lucky.wav'),
};
```

**Common Mistakes**:
- `levelup.wav` vs `levelUp.wav` (case sensitive!)
- `gameover.wav` vs `gameOver.wav`
- Wrong path (`../../assets` vs `../assets`)

---

### 3️⃣ Sounds Don't Play During Gameplay

**Symptoms**:
- Initialization logs look good
- But tapping targets makes no sound

**Diagnosis Steps**:

#### Step 1: Check if Sound is Enabled in Settings
```javascript
import { settingsService } from './src/services/SettingsService';
console.log('Sound enabled?', settingsService.getSoundEnabled());
```

**Fix**: If `false`, go to Settings (⚙️) and toggle Sound ON.

#### Step 2: Check Device Volume
- **iOS**: Check physical volume buttons + ringer switch
- **Android**: Check media volume (not ringer volume)
- **Simulator**: Check host computer's volume

#### Step 3: Check Audio Mode Configuration
In `src/services/SoundManager.js` line 25-31:
```javascript
await Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  playsInSilentModeIOS: true, // ← Should be true
  staysActiveInBackground: false,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
});
```

**Fix**: If `playsInSilentModeIOS` is `false`, change to `true` and restart.

---

### 4️⃣ Sounds Play on Simulator But Not on Real Device

**Symptoms**:
- Works perfectly in Expo Go on computer
- No sound on iPhone/Android device

**Possible Causes**:

#### Cause A: Device Silent Mode (iOS)
- Check the physical ringer switch on iPhone
- If orange is showing, device is in silent mode
- **Fix**: Even with `playsInSilentModeIOS: true`, some iOS versions still block sounds

**Test**:
1. Flip ringer switch to not-silent
2. Test again

#### Cause B: Do Not Disturb (iOS/Android)
- Check if Do Not Disturb is enabled
- **Fix**: Disable DND or add app exception

#### Cause C: App Permissions
- **Android**: Check if app has permission to play audio
- **Fix**: Settings → Apps → ReflexXP → Permissions → ensure nothing is blocked

---

### 5️⃣ Sounds Cut Off or Don't Replay

**Symptoms**:
- First tap plays sound
- Rapid subsequent taps don't play sound

**Root Cause**: Sound is still playing from previous tap

**Fix**: Already implemented in `src/services/SoundManager.js` (lines 98-110):
```javascript
async play(name, comboLevel = 1) {
  // ...
  const status = await sound.getStatusAsync();
  
  // Stop if currently playing
  if (status.isLoaded && status.isPlaying) {
    await sound.stopAsync();
  }
  
  // Reset position
  if (status.isLoaded) {
    await sound.setPositionAsync(0);
  }
  // ...
}
```

If still happening, check if `sound.stopAsync()` is throwing errors (add try-catch).

---

### 6️⃣ Sounds Lag or Delayed

**Symptoms**:
- Tap target → sound plays 100-500ms later

**Causes**:

#### Cause A: Sounds Not Preloaded
- Sounds should load at app start, not on-demand
- **Check**: Look for initialization logs when app launches

#### Cause B: Large Sound Files
- WAV files should be < 500 KB each for instant playback
- **Fix**: Use shorter sounds or compress

#### Cause C: Device Performance
- Older devices may struggle with too many sounds at once
- **Fix**: Limit concurrent sound playback

---

### 7️⃣ Pitch Scaling Doesn't Work

**Symptoms**:
- Combo increases but tap sound stays same pitch

**Expected Behavior**:
- Combo 1: Normal pitch (1.0x)
- Combo 10: Higher pitch (1.5x)
- Combo 20+: Highest pitch (2.0x)

**Fix Check** (`src/services/SoundManager.js` lines 113-119):
```javascript
if ((name === 'tap' || name === 'combo') && comboLevel > 1) {
  const pitch = Math.min(1.0 + (comboLevel - 1) * 0.05, 2.0);
  await sound.setRateAsync(pitch, true); // ← Second param must be true
}
```

**Test**:
```javascript
// In game, log pitch value
console.log(`Combo ${combo} → Pitch ${pitch.toFixed(2)}x`);
```

---

## Testing Audio System

### Manual Test Script

1. **Launch app** and check Metro logs:
```bash
npx expo start --clear
# Open Expo Go and scan QR
# Check logs for sound initialization
```

2. **Open Settings** (⚙️) and toggle Sound OFF/ON:
```
Expected: Console shows "🔊 Sounds disabled" / "🔊 Sounds enabled"
```

3. **Start a game** (Classic mode):
```
Expected sounds:
- Tap target → tap.wav
- Miss target → miss.wav
- Hit 5 targets → combo.wav
- Hit lucky target (⭐) → lucky.wav
```

4. **Test pitch scaling**:
```
- Build combo to 10x
- Notice tap sound pitch increasing
- Should be clearly higher than 1x
```

5. **Test all sounds**:
```
- tap.wav: Tap any target
- miss.wav: Let target expire
- combo.wav: Reach 5x combo
- coin.wav: Collect coins (or lucky target)
- levelup.wav: Gain enough XP to level up
- gameover.wav: End game (health = 0 or time up)
- lucky.wav: Hit ⭐ lucky target
```

---

## Diagnostic Commands

### Check Audio Status (Add to Settings UI or Console)
```javascript
import { soundManager } from './src/services/SoundManager';

// Get full status
const status = soundManager.getAudioStatus();
console.log('Audio System Status:', status);
```

**Example Output**:
```json
{
  "isInitialized": true,
  "isEnabled": true,
  "totalSounds": 7,
  "loadedSounds": 7,
  "failedSounds": [],
  "loadedSoundNames": ["tap", "miss", "combo", "coin", "levelUp", "gameOver", "luckyTap"],
  "healthPercent": 100
}
```

### Force Sound Test
```javascript
// In Settings modal, add test buttons
<TouchableOpacity onPress={() => soundManager.play('tap')}>
  <Text>🔊 Test Tap Sound</Text>
</TouchableOpacity>
```

---

## Platform-Specific Notes

### iOS
- **Silent Mode**: Use physical ringer switch
- **Haptics**: Works via Taptic Engine (requires physical device)
- **Background Audio**: Not implemented (sounds stop when app backgrounds)

### Android
- **Volume**: Media volume (not ringer)
- **Haptics**: Works via Vibration API
- **Permissions**: Usually no special permission needed for audio playback

### Expo Go vs Standalone Build
- **Expo Go**: Audio works identically
- **Standalone**: No differences expected
- **EAS Build**: Test on production builds to verify

---

## Advanced Debugging

### Enable Verbose Audio Logs

In `src/services/SoundManager.js`, add more logging:

```javascript
async play(name, comboLevel = 1) {
  console.log(`🎵 Playing ${name} (combo: ${comboLevel})`); // Add this
  
  if (!this.isInitialized || !this.isEnabled || !settingsService.getSoundEnabled()) {
    console.log(`⚠️ Audio blocked: init=${this.isInitialized}, enabled=${this.isEnabled}, settings=${settingsService.getSoundEnabled()}`); // Add this
    return;
  }
  // ... rest of code
}
```

### Catch Silent Failures

Wrap playback in more detailed error handling:

```javascript
try {
  await sound.playAsync();
  console.log(`✅ ${name} played successfully`);
} catch (error) {
  console.error(`❌ Playback failed for ${name}:`, error.message);
  console.error('Error code:', error.code);
  console.error('Error stack:', error.stack);
}
```

---

## Known Issues & Workarounds

### Issue: Sounds Don't Play First Time (Cold Start)
**Workaround**: 
- Preload sounds on app launch (already done)
- Add small delay before first game starts

### Issue: Pitch Scaling Resets Mid-Combo
**Workaround**:
- Ensure `setRateAsync` uses `pitchCorrectionQuality: true`

### Issue: Sounds Overlap and Cause Crackling
**Workaround**:
- Stop sound before replaying (already implemented)
- Limit max concurrent sounds to 3-5

---

## Reporting Audio Bugs

When reporting audio issues, include:

```markdown
**Issue**: Brief description

**Platform**: iOS 16.4 / Android 13 / Simulator

**Device**: iPhone 14 Pro / Pixel 7 / etc.

**Metro Logs**: 
[Paste relevant logs, especially SoundManager initialization]

**Audio Status**:
[Paste output of soundManager.getAudioStatus()]

**Steps to Reproduce**:
1. Launch app
2. Go to Settings → check Sound toggle
3. Start game
4. Tap target
5. Observe: No sound plays

**Expected**: Sound plays

**Actual**: Silence

**Additional Context**:
- Device volume: 80%
- Silent mode: OFF
- Other apps' audio works fine
```

---

## Resources

### Official Documentation
- [expo-av Docs](https://docs.expo.dev/versions/latest/sdk/audio/)
- [React Native Audio Guide](https://reactnative.dev/docs/audio)

### Sound File Specs
- **Format**: WAV (recommended) or MP3
- **Sample Rate**: 44.1 kHz
- **Bit Depth**: 16-bit PCM
- **Channels**: Mono (smaller) or Stereo
- **Duration**: < 2 seconds for game sounds
- **File Size**: < 500 KB each

### Tools
- **Audacity**: Free audio editor (export to WAV)
- **ffmpeg**: Command-line audio converter
- **Online WAV Converter**: convertio.co

---

**Last Updated**: November 10, 2025  
**Version**: 1.0  
**Maintainer**: Senior Audio Engineer / Tech Lead


