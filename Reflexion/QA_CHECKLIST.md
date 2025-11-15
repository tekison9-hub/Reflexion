# 🧪 ReflexXP QA Testing Checklist

**Version**: 1.0  
**Last Updated**: November 10, 2025

---

## Pre-Test Setup

- [ ] Device: iOS/Android physical device OR simulator/emulator
- [ ] Expo Go app installed (for development testing)
- [ ] Metro bundler running (`npx expo start --clear`)
- [ ] Clear app data before major test runs
- [ ] Test with sound ON and haptics ON

---

## 1️⃣ App Launch & Initialization

### First Launch (Fresh Install)
- [ ] App loads without crash
- [ ] Splash screen displays correctly
- [ ] Loading screen shows "Loading ReflexXP..."
- [ ] Menu screen appears within 5 seconds
- [ ] No red error screens

### Subsequent Launches
- [ ] App remembers player data (XP, coins, level)
- [ ] Settings persist (sound/haptics toggles)
- [ ] High score is preserved
- [ ] Max combo is preserved

### Console Logs (Check Metro bundler)
- [ ] ✅ "Audio mode configured"
- [ ] ✅ "Sound loaded: tap.wav" (x7 sounds)
- [ ] ✅ "SoundManager fully initialized: 7/7 sounds loaded"
- [ ] ✅ "Settings initialized"
- [ ] No errors or warnings

---

## 2️⃣ Menu Screen Navigation

### Layout & UI
- [ ] Title "ReflexXP" visible and centered
- [ ] Title has glow/pulse animation
- [ ] Settings icon (⚙️) visible top-right, no overlap
- [ ] Three main buttons visible: Play ⚡, Zen 🧠, Rush 💥
- [ ] Three secondary buttons visible: Shop 🛒, Achievements 🏆, How to Play 📖
- [ ] Bottom stats bar shows: Coins, Level, XP progress
- [ ] All text is readable (good contrast)

### Button Interactions
- [ ] **Play button**: Opens mode selector modal
- [ ] **Zen Mode**: Navigates to game (Zen mode)
- [ ] **Rush Mode**: Navigates to game (Rush mode)
- [ ] **Shop**: Navigates to Shop screen
- [ ] **Achievements**: Navigates to Achievements screen
- [ ] **How to Play**: Navigates to Instructions screen
- [ ] **Settings icon**: Opens Settings modal
- [ ] All buttons have press feedback (scale animation)
- [ ] No accidental double-taps cause issues

### Mode Selector Modal
- [ ] Modal appears when "Play" pressed
- [ ] Shows Classic, Rush, Zen modes
- [ ] Shows unlock status (Rush @ Level 10, Zen @ Level 20)
- [ ] Selecting a mode starts game
- [ ] Close button dismisses modal
- [ ] Modal doesn't leave ghost overlay

---

## 3️⃣ Game Screen - Classic Mode

### Game Start
- [ ] Game screen loads within 1 second
- [ ] HUD visible: Score, Combo, Health, Timer
- [ ] Targets start spawning immediately
- [ ] Background matches theme (based on level)
- [ ] Pause button visible and functional

### Core Gameplay
- [ ] Tapping target increases score
- [ ] Tapping plays "tap" sound
- [ ] Haptic feedback on perfect hits (light impact)
- [ ] Combo counter increases with consecutive taps
- [ ] Missing target decreases health
- [ ] Missing plays "miss" sound
- [ ] Combo resets to 0 on miss
- [ ] Floating "+X" score text appears on hit
- [ ] Particles burst from tapped target

### Sound & Feedback
- [ ] **Tap sound**: Clear, audible, pitch increases with combo
- [ ] **Miss sound**: Distinct, negative tone
- [ ] **Combo sound**: Plays at milestones (5x, 10x, 15x, etc.)
- [ ] **Coin sound**: Plays when collecting lucky targets
- [ ] **Level Up sound**: Plays when leveling up
- [ ] **Game Over sound**: Plays when game ends
- [ ] **Lucky Tap sound**: Plays for ⭐ lucky targets

### Difficulty Scaling
- [ ] Targets spawn faster as score increases
- [ ] Noticeable difficulty increase every 100 points
- [ ] Console logs show difficulty changes:
  ```
  ⚡ Level 2 → Difficulty 1.10x | Spawn: 1500ms | Score: 100
  ```

### Power Bar (ReflexXP Power Bar)
- [ ] Power bar visible below HUD
- [ ] Fills up with perfect taps
- [ ] Activates at 100% with "2× XP ACTIVE!" text
- [ ] Bar glows/pulses when active
- [ ] Stays active for 10 seconds
- [ ] XP multiplier applies at game over

### Combo Feedback
- [ ] **5x Combo**: "GOOD!" callout
- [ ] **10x Combo**: Camera shake, particle burst
- [ ] **20x Combo**: Camera shake, particle burst
- [ ] **30x+ Combo**: Camera shake, particle burst
- [ ] Pitch of tap sound increases (1.0x → 2.0x max)

---

## 4️⃣ Game Screen - Rush Mode

### Rush Mode Specific
- [ ] Game duration: 30 seconds (not 60s)
- [ ] Targets spawn faster than Classic
- [ ] Combo multiplier increases every 5 taps
- [ ] Multiplier displayed on HUD (e.g., "Multiplier: 3x")
- [ ] No health bar (can't die early)
- [ ] Score accumulates faster

### Rush Mode UI
- [ ] Timer counts down from 30
- [ ] "RUSH MODE" indicator visible
- [ ] Multiplier text updates correctly

---

## 5️⃣ Game Screen - Zen Mode

### Zen Mode Specific
- [ ] No score display
- [ ] No combo counter
- [ ] No health bar
- [ ] No timer (infinite play)
- [ ] Soothing colors/theme
- [ ] Slower target spawn rate
- [ ] NO haptic feedback (disabled)
- [ ] Sounds still play (tap only)
- [ ] Can only exit via pause menu

### Zen Mode UI
- [ ] "ZEN MODE" indicator visible
- [ ] Minimalist HUD
- [ ] Back/Pause button works

---

## 6️⃣ Game Over Flow

### Game Over Trigger
- [ ] Classic: Health reaches 0 OR timer reaches 0
- [ ] Rush: Timer reaches 0
- [ ] Zen: Manual exit only (no game over)

### Game Over Screen
- [ ] Modal appears with score, XP, coins earned
- [ ] "Watch Ad to Double Rewards" button visible
- [ ] "Skip" button visible
- [ ] High score indicator if new record
- [ ] Animations/confetti for high score

### Ad Flow
- [ ] **Watch Ad button**: Plays simulated ad
- [ ] After ad: XP and coins doubled
- [ ] After ad: "Play Again" and "Main Menu" buttons appear
- [ ] **Skip button**: Immediately shows "Play Again" and "Main Menu"
- [ ] No ghost modals left behind

### Play Again Flow
- [ ] **Play Again button**: Resets all state
  - [ ] Score = 0
  - [ ] Combo = 0
  - [ ] Health = 3
  - [ ] Timer reset to mode duration
  - [ ] Power Bar = 0
  - [ ] Difficulty = 1
  - [ ] Targets cleared
  - [ ] Particles cleared
- [ ] Game starts immediately
- [ ] No memory leaks (test 10+ rounds)

### Main Menu Flow
- [ ] **Main Menu button**: Returns to menu
- [ ] All game timers cleared
- [ ] No ghost targets remain
- [ ] Menu screen loads cleanly
- [ ] Player data updated (XP, coins, high score)
- [ ] Can start new game without issues

---

## 7️⃣ Shop Screen

### Layout
- [ ] Title "Shop" visible
- [ ] Back button works
- [ ] Theme cards displayed
- [ ] Current coins displayed
- [ ] Locked/unlocked status correct

### Theme Purchase
- [ ] Tapping theme shows details
- [ ] Purchase button enabled if enough coins
- [ ] Purchase deducts coins
- [ ] Theme unlocked successfully
- [ ] "Purchased" indicator appears
- [ ] Theme applies to next game

---

## 8️⃣ Achievements Screen

### Layout
- [ ] Title "Achievements" visible
- [ ] Back button works
- [ ] Achievement list displayed
- [ ] Progress percentage shown (e.g., "8/12")

### Achievement States
- [ ] **Unlocked**: Shows with checkmark ✅
- [ ] **Locked**: Grayed out with lock icon 🔒
- [ ] Achievement names and descriptions clear
- [ ] Progress updates in real-time

### Achievement Triggers (Test Each)
- [ ] "First Victory": Complete 1 game
- [ ] "Combo Starter": Reach 5x combo
- [ ] "Combo Master": Reach 10x combo
- [ ] "Combo Legend": Reach 20x combo
- [ ] "Century": Score 100 points
- [ ] "High Scorer": Score 500 points
- [ ] "Elite Player": Score 1000 points
- [ ] "Rising Star": Reach level 5
- [ ] "Pro Tapper": Reach level 10
- [ ] "Dedicated": Play 10 games
- [ ] "Addicted": Play 50 games
- [ ] "Wealthy": Collect 500 coins

---

## 9️⃣ Instructions Screen (How to Play)

### Layout
- [ ] Title "📖 How to Play" visible
- [ ] Back button works
- [ ] Instructions scrollable
- [ ] All sections visible

### Content
- [ ] **Tap Targets Fast**: Explanation clear
- [ ] **Build Your Combo**: Explanation clear
- [ ] **Lucky Targets**: ⭐ explained
- [ ] **Game Modes**: Classic, Rush, Zen explained
- [ ] **Power Bar**: ReflexXP Power Bar explained
- [ ] **Level Up**: XP and unlocks explained

---

## 🔟 Settings Modal

### Layout
- [ ] Modal appears when ⚙️ tapped
- [ ] Title "Settings" visible
- [ ] Close button (X) works

### Toggles
- [ ] **Sound toggle**: ON/OFF switch visible
- [ ] **Haptics toggle**: ON/OFF switch visible
- [ ] Toggles respond to taps
- [ ] Current state displayed correctly

### Sound Toggle
- [ ] Turning OFF silences all sounds
- [ ] Turning ON re-enables sounds
- [ ] Test sound button plays sample (if implemented)
- [ ] Setting persists after app restart

### Haptics Toggle
- [ ] Turning OFF disables all haptics
- [ ] Turning ON re-enables haptics
- [ ] Test haptic button triggers vibration (if implemented)
- [ ] Setting persists after app restart

### Audio Diagnostic (if implemented)
- [ ] Shows "✅ 7/7 sounds loaded" or similar
- [ ] Shows warnings if sounds failed to load

---

## 1️⃣1️⃣ Level Progression & Themes

### Theme Evolution
- [ ] **Levels 1-5**: Neon City theme (cyan glow)
- [ ] **Levels 6-10**: Hyper Lane theme (purple)
- [ ] **Levels 11-20**: Cyber Tunnel theme (blue waves)
- [ ] **Levels 21-30**: Pulse Core theme (pink neon)
- [ ] **Levels 31+**: Quantum Storm theme (dynamic colors)

### Theme Unlock Notifications
- [ ] Notification appears when unlocking new theme
- [ ] Theme name and level requirement shown
- [ ] Notification auto-dismisses after 3 seconds
- [ ] Can start game with new theme immediately

### Level Up
- [ ] Level up sound plays
- [ ] XP bar resets to 0%
- [ ] Level number increments
- [ ] Console log: "🎉 Level Up! Now level X"

---

## 1️⃣2️⃣ Performance & Stability

### Frame Rate
- [ ] Game runs at 60 FPS (smooth animations)
- [ ] No stuttering or lag during gameplay
- [ ] Particle effects don't cause slowdown
- [ ] Animations are fluid (no jank)

### Memory & Battery
- [ ] No memory leaks (test 10+ game sessions)
- [ ] App doesn't overheat device
- [ ] Battery drain is reasonable
- [ ] App doesn't crash after extended use (30+ minutes)

### Edge Cases
- [ ] Rapidly tapping doesn't crash
- [ ] Spam-tapping targets works correctly
- [ ] Rotating device (if not locked) handles gracefully
- [ ] Background/foreground transitions work
- [ ] Receiving notification doesn't crash game

### Error Handling
- [ ] ErrorBoundary catches any crashes
- [ ] In DEV: Shows detailed error info
- [ ] In PROD: Shows user-friendly message
- [ ] Reset button works in error screen

---

## 1️⃣3️⃣ Cross-Platform Testing

### iOS Specific
- [ ] Notch/Dynamic Island handled correctly
- [ ] Safe area insets respected
- [ ] Haptics work (Taptic Engine)
- [ ] Sounds play in silent mode

### Android Specific
- [ ] Notch/punch-hole handled correctly
- [ ] Navigation bar insets respected
- [ ] Haptics work (Vibration API)
- [ ] Sounds play correctly

### Both Platforms
- [ ] Animations perform equally well
- [ ] Touch targets are appropriately sized
- [ ] Text is readable on all screen sizes
- [ ] No platform-specific crashes

---

## 1️⃣4️⃣ Regression Testing (After Each Update)

- [ ] All critical flows work (Menu → Game → Game Over → Menu)
- [ ] No new crashes introduced
- [ ] No new linter errors
- [ ] All sounds still play
- [ ] All haptics still work
- [ ] Settings still persist
- [ ] Data migration (if applicable) works

---

## 🐛 Bug Reporting Template

When filing a bug, include:

```markdown
**Title**: Brief description of the bug

**Severity**: Critical / High / Medium / Low

**Platform**: iOS 16.4 / Android 13 / Simulator

**Steps to Reproduce**:
1. Open app
2. Navigate to...
3. Tap on...
4. Observe...

**Expected Behavior**:
What should happen

**Actual Behavior**:
What actually happens

**Screenshots/Video**: (if applicable)

**Console Logs**: (copy relevant errors)

**Additional Context**:
Any other relevant information
```

---

## ✅ Test Pass Criteria

For a release to be approved, the following MUST pass:

### Critical (100% Required)
- [ ] App launches without crashes
- [ ] All navigation routes work
- [ ] Game Over → Main Menu cleans up state
- [ ] Settings persist after restart
- [ ] No memory leaks
- [ ] ErrorBoundary never shows during normal play

### High Priority (95%+ Required)
- [ ] Sounds play correctly
- [ ] Haptics work correctly
- [ ] Game Over flow works (Skip → Play Again/Menu)
- [ ] Difficulty scaling noticeable
- [ ] Power Bar mechanic works
- [ ] All three game modes function

### Nice to Have (80%+ Recommended)
- [ ] Animations are smooth
- [ ] Theme unlocks work
- [ ] Achievements trigger correctly
- [ ] Shop purchases work

---

## 📊 Testing Summary Report Template

```markdown
# Test Run Summary

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Platform**: iOS / Android / Both
**Build**: [Version]

## Results
- ✅ Passed: X/Y tests
- ⚠️ Minor Issues: Z
- ❌ Blocking Issues: 0

## Blocking Issues
None

## Minor Issues
1. [Issue description]
2. [Issue description]

## Notes
[Any additional observations]

## Recommendation
- [ ] ✅ Approved for release
- [ ] ⚠️ Approved with minor issues
- [ ] ❌ Not approved (blocking issues found)
```

---

**Last Updated**: November 10, 2025  
**Version**: 1.0  
**Maintainer**: Senior QA / Tech Lead


