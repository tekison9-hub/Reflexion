# Reflexion Tutorial System - Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Scene Setup](#scene-setup)
4. [Prefab Configuration](#prefab-configuration)
5. [Integration with Game Flow](#integration-with-game-flow)
6. [Analytics Configuration](#analytics-configuration)
7. [Cloud Save Setup](#cloud-save-setup)
8. [Accessibility Features](#accessibility-features)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Reflexion Tutorial System is a comprehensive onboarding solution that provides:
- **Interactive 3-step tutorial** with progressive difficulty
- **Visual guidance** (animated hand pointer, spotlights, text overlays)
- **State persistence** with cloud sync support
- **Analytics integration** for tracking user behavior
- **Accessibility support** (screen readers, high-contrast mode)
- **Mobile-optimized** performance

### Architecture

```
TutorialManager (Singleton)
├── TutorialUIController
│   ├── HandPointerAnimator
│   ├── Instruction Panels
│   ├── Skip UI
│   └── Completion Modal
├── TutorialAnalytics
├── CloudSaveManager
└── AccessibilityManager
```

---

## Quick Start

### Prerequisites
- Unity 2021.3 or later
- TextMeshPro package
- Unity's new Input System package

### Installation Steps

1. **Import Scripts**
   ```
   Copy the Scripts/Tutorial/ folder to your project's Scripts directory
   ```

2. **Create Tutorial Canvas**
   - Right-click in Hierarchy → UI → Canvas
   - Name it "TutorialCanvas"
   - Set Canvas Scaler to Scale With Screen Size (1080x1920 for mobile)

3. **Add TutorialManager**
   - Create empty GameObject named "TutorialManager"
   - Add `TutorialManager.cs` component
   - Mark as DontDestroyOnLoad (done automatically)

4. **Run Initial Test**
   ```csharp
   // In your game's start script
   void Start()
   {
       if (!TutorialManager.Instance.IsTutorialCompleted)
       {
           TutorialManager.Instance.StartTutorial();
       }
   }
   ```

---

## Scene Setup

### 1. Tutorial Canvas Hierarchy

Create the following hierarchy in your TutorialCanvas:

```
TutorialCanvas
├── OverlayBackground (Image - dim overlay)
├── SpotlightMask (Image - circular spotlight effect)
├── InstructionPanel
│   ├── Background (Panel)
│   └── InstructionText (TextMeshPro)
├── HandPointer
│   ├── HandImage (Image)
│   └── TapAnimation (Animator - optional)
├── SkipUI
│   ├── SkipHoldIndicator
│   ├── SkipProgressBar (Image with Fill)
│   └── SkipConfirmationPanel
│       ├── ConfirmButton
│       └── CancelButton
└── CompletionModal
    ├── Background
    ├── RewardCoinsText (TextMeshPro)
    ├── CompletionMessageText (TextMeshPro)
    └── ContinueButton
```

### 2. Component Assignment

**TutorialCanvas GameObject:**
- Add `TutorialUIController.cs`
- Assign all UI references in the Inspector

**HandPointer GameObject:**
- Add `HandPointerAnimator.cs`
- Assign hand image sprite (pointing finger icon)
- Configure animation settings

### 3. Camera Setup

Ensure your main camera is tagged as "MainCamera" for world-to-screen position conversions.

---

## Prefab Configuration

### Creating Tutorial Prefabs

#### 1. TutorialManager Prefab

```yaml
GameObject: TutorialManager
Components:
  - TutorialManager
    Tutorial Steps: 
      - Step 1: First Tap
        Target Count: 1
        Target Speed: 0.5
        Hit Area Multiplier: 1.5
      - Step 2: Build Combo
        Target Count: 3
        Target Speed: 1.0
        Hit Area Multiplier: 1.2
      - Step 3: Life System
        Target Count: 5
        Target Speed: 1.2
        Hit Area Multiplier: 1.0
    Skip Hold Duration: 2.0
    Completion Reward Coins: 100
    Completion Message: "You're ready!"
```

#### 2. TutorialUI Prefab

Create a prefab from your configured TutorialCanvas with all UI elements set up.

**Overlay Settings:**
- Dim Background: Color (0, 0, 0, 0.7), Full Screen
- Spotlight Mask: White circle with radial gradient, Additive blend

**Instruction Panel:**
- Font: Roboto or similar sans-serif
- Size: 32pt (mobile-optimized)
- Color: White (#FFFFFF)
- Shadow for readability

**Hand Pointer:**
- Size: 128x128 pixels
- Animated with bouncing motion
- Tap animation: Scale from 1.0 to 0.8 and back

---

## Integration with Game Flow

### Basic Integration

```csharp
using Reflexion.Tutorial;

public class GameFlowManager : MonoBehaviour
{
    private void Start()
    {
        // Check if tutorial is needed
        if (!TutorialManager.Instance.IsTutorialCompleted)
        {
            StartTutorial();
        }
        else
        {
            StartNormalGame();
        }
    }

    private void StartTutorial()
    {
        // Subscribe to tutorial events
        TutorialManager.Instance.OnTutorialCompleted.AddListener(OnTutorialFinished);
        TutorialManager.Instance.OnTutorialSkipped.AddListener(OnTutorialSkipped);
        
        // Start the tutorial
        TutorialManager.Instance.StartTutorial();
    }

    private void OnTutorialFinished()
    {
        Debug.Log("Tutorial completed! Starting game...");
        StartNormalGame();
    }

    private void OnTutorialSkipped()
    {
        Debug.Log("Tutorial skipped. Starting game...");
        StartNormalGame();
    }

    private void StartNormalGame()
    {
        // Your game start logic
        GameManager.Instance.StartGame();
    }
}
```

### Advanced Integration: Custom Tutorial Steps

```csharp
using Reflexion.Tutorial;

public class CustomTutorialIntegration : MonoBehaviour
{
    [SerializeField] private GameObject targetPrefab;
    private GameObject currentTarget;

    private void OnEnable()
    {
        TutorialManager.Instance.OnStepCompleted.AddListener(OnStepCompleted);
    }

    private void OnDisable()
    {
        TutorialManager.Instance.OnStepCompleted.RemoveListener(OnStepCompleted);
    }

    private void OnStepCompleted(int stepIndex)
    {
        // Handle custom logic for each step
        switch (stepIndex)
        {
            case 0:
                Debug.Log("Player completed first tap!");
                break;
            case 1:
                Debug.Log("Player learned combo system!");
                EnableComboMeter();
                break;
            case 2:
                Debug.Log("Player learned life system!");
                EnableLivesDisplay();
                break;
        }
    }

    // Called by your target spawn system
    public void OnTargetSpawned(GameObject target)
    {
        currentTarget = target;
        
        // Move tutorial spotlight and hand pointer
        Vector2 screenPos = TutorialUIController.Instance.WorldToScreenPosition(target.transform.position);
        TutorialUIController.Instance.MoveSpotlight(target.transform.position, 150f);
        TutorialUIController.Instance.MoveHandPointer(screenPos);
    }

    // Called when player taps a target
    public void OnTargetTapped()
    {
        if (TutorialManager.Instance.IsTutorialActive)
        {
            TutorialUIController.Instance.PlayHandTapAnimation();
            
            // Check if step is complete based on your game logic
            TutorialStep currentStep = TutorialManager.Instance.GetCurrentStep();
            if (/* step completion condition */)
            {
                TutorialManager.Instance.CompleteStep(TutorialManager.Instance.CurrentStepIndex);
            }
        }
    }

    private void EnableComboMeter()
    {
        // Your combo meter enable logic
    }

    private void EnableLivesDisplay()
    {
        // Your lives display enable logic
    }
}
```

### Handling App Pause/Resume

The tutorial automatically saves progress when the app is paused or closed:

```csharp
// This is handled automatically in TutorialManager
// OnApplicationPause() and OnApplicationQuit() save current state
```

---

## Analytics Configuration

### Built-in Events

The tutorial system logs the following events:
- `tutorial_started`
- `tutorial_step_completed` (with step_index and step_name)
- `tutorial_completed` (with total_steps)
- `tutorial_abandoned` (with last_step_index)

### Unity Analytics

No additional configuration needed if Unity Analytics is enabled.

### Firebase Analytics

1. Import Firebase SDK
2. Enable Firebase Analytics in your project
3. Define `FIREBASE_ANALYTICS` in Player Settings → Scripting Define Symbols

```
Player Settings → Other Settings → Scripting Define Symbols
Add: FIREBASE_ANALYTICS
```

### GameAnalytics

1. Import GameAnalytics SDK
2. Configure GameAnalytics settings
3. Define `GAMEANALYTICS` in Scripting Define Symbols

### Custom Analytics

Implement the `AnalyticsManager.LogEvent` method:

```csharp
public class AnalyticsManager : MonoBehaviour
{
    public void LogEvent(string eventName, Dictionary<string, object> parameters)
    {
        // Your custom analytics implementation
        MyAnalyticsService.TrackEvent(eventName, parameters);
    }
}
```

---

## Cloud Save Setup

### PlayFab Integration

1. Import PlayFab SDK
2. Configure PlayFab settings
3. Define `PLAYFAB` in Scripting Define Symbols
4. Implement cloud save methods in `CloudSaveManager.cs`

```csharp
#if PLAYFAB
private async Task<bool> SaveToPlayFab(string key, string data)
{
    var request = new UpdateUserDataRequest
    {
        Data = new Dictionary<string, string>
        {
            { key, data }
        }
    };

    var result = await PlayFabClientAPI.UpdateUserDataAsync(request);
    return result.Error == null;
}
#endif
```

### Firebase Integration

1. Import Firebase SDK
2. Enable Cloud Firestore
3. Define `FIREBASE` in Scripting Define Symbols

### Unity Cloud Save

1. Enable Unity Gaming Services
2. Configure Cloud Save service
3. Define `UNITY_CLOUD_SAVE` in Scripting Define Symbols

### Testing Without Cloud Save

Cloud save gracefully falls back to local PlayerPrefs if no cloud service is configured.

---

## Accessibility Features

### Screen Reader Support

**Automatic Announcements:**
The tutorial automatically announces text to screen readers when:
- Tutorial starts
- New step begins
- Important events occur

**Manual Announcements:**
```csharp
AccessibilityManager.Instance.Announce("Custom message for screen reader");
```

**Platform Support:**
- iOS: VoiceOver
- Android: TalkBack
- Windows: Narrator

### High Contrast Mode

**Enable in Settings:**
```csharp
AccessibilityManager.Instance.IsHighContrastEnabled = true;
```

**UI Elements:**
- Text becomes yellow on black background
- Buttons use high-contrast orange
- Increased border thickness

### Font Scaling

**Allow users to adjust text size:**
```csharp
// Increase font size
AccessibilityManager.Instance.IncreaseFontSize();

// Decrease font size
AccessibilityManager.Instance.DecreaseFontSize();

// Reset to default
AccessibilityManager.Instance.ResetFontSize();
```

**Tag scalable text elements:**
```csharp
// In Unity Editor, tag TextMeshPro components with "ScalableText"
```

---

## Testing

### Running Unit Tests

1. Open Unity Test Runner (Window → General → Test Runner)
2. Select EditMode tab
3. Click "Run All" to run tutorial tests

**Test Coverage:**
- State management (initialization, progression, completion)
- Persistence (save/load, resume functionality)
- Multi-device sync logic
- Edge cases (invalid inputs, multiple completions)

### Manual Testing Checklist

- [ ] Tutorial starts on first launch
- [ ] Tutorial does not show on subsequent launches
- [ ] Progress saves when app is closed mid-tutorial
- [ ] Tutorial resumes from correct step after app restart
- [ ] Skip button appears for returning users (if enabled)
- [ ] Skip requires 2-second hold
- [ ] Skip confirmation dialog works
- [ ] All 3 tutorial steps complete successfully
- [ ] Completion modal shows correct reward amount
- [ ] Coins are awarded on completion
- [ ] Analytics events are logged (check console)
- [ ] Hand pointer animates smoothly
- [ ] Spotlight follows targets correctly
- [ ] High contrast mode works
- [ ] Screen reader announces text (test on device)

### Performance Testing

**Mobile Performance Targets:**
- Frame rate: 60 FPS maintained during tutorial
- Memory: < 50 MB additional memory usage
- Draw calls: Minimal increase (< 10 additional draw calls)

**Profiling:**
```csharp
// Enable deep profiling for tutorial scenes
Unity Profiler → Deep Profile → Record
```

---

## Troubleshooting

### Common Issues

#### Tutorial Doesn't Start

**Problem:** Tutorial doesn't appear on first launch.

**Solution:**
1. Verify `TutorialManager.Instance.StartTutorial()` is called
2. Check that TutorialCanvas is enabled in hierarchy
3. Ensure Canvas camera is set correctly (Overlay or Camera)

#### Tutorial Repeats Every Launch

**Problem:** Tutorial shows even after completion.

**Solution:**
1. Check PlayerPrefs data: `PlayerPrefs.GetString("TutorialSaveData")`
2. Verify `IsTutorialCompleted` returns true after completion
3. Clear PlayerPrefs during testing: `PlayerPrefs.DeleteAll()`

#### Hand Pointer Not Visible

**Problem:** Hand pointer doesn't appear or is off-screen.

**Solution:**
1. Check Canvas Render Mode (should be Screen Space - Overlay or Camera)
2. Verify HandPointer is child of TutorialCanvas
3. Check CanvasGroup alpha is set to 1
4. Verify sorting order is higher than game elements

#### Spotlight Not Working

**Problem:** Spotlight doesn't highlight targets correctly.

**Solution:**
1. Ensure Camera.main is set
2. Check world-to-screen conversion in `TutorialUIController.WorldToScreenPosition()`
3. Verify spotlight mask image has proper settings (should use mask shader or blend mode)

#### Analytics Not Logging

**Problem:** Analytics events don't appear in dashboard.

**Solution:**
1. Verify scripting define symbols are set correctly
2. Check analytics SDK initialization
3. Enable verbose logging in `TutorialAnalytics.cs`
4. Check console for analytics warnings

#### Cloud Save Not Syncing

**Problem:** Tutorial progress doesn't sync between devices.

**Solution:**
1. Verify cloud save service is initialized
2. Check network connectivity
3. Review CloudSaveManager logs
4. Test with cloud save provider's debug tools

### Reset Tutorial for Testing

```csharp
// In Unity Editor or debug menu
TutorialManager.Instance.ResetTutorial();
PlayerPrefs.DeleteAll();
PlayerPrefs.Save();
```

### Debug Mode

Enable verbose logging:

```csharp
// In TutorialManager.cs, add:
[SerializeField] private bool debugMode = true;

private void Log(string message)
{
    if (debugMode)
    {
        Debug.Log($"[Tutorial] {message}");
    }
}
```

---

## Best Practices

### Performance Optimization

1. **Disable Tutorial Canvas When Not Active**
   ```csharp
   tutorialCanvas.SetActive(false); // Done automatically
   ```

2. **Use Object Pooling for Targets**
   ```csharp
   // Pool tutorial targets instead of instantiating each time
   ```

3. **Async/Await for Delays**
   ```csharp
   // Use async/await instead of Update loops
   await Task.Delay(milliseconds);
   ```

4. **Optimize UI Elements**
   - Use TextMeshPro instead of Unity Text
   - Minimize Canvas rebuilds
   - Use sprite atlases

### User Experience

1. **Keep Instructions Concise**
   - Maximum 6-8 words per instruction
   - Use active voice
   - Test with non-native speakers

2. **Progressive Difficulty**
   - Step 1: Very easy (impossible to fail)
   - Step 2: Introduce one new concept
   - Step 3: Combine concepts

3. **Visual Feedback**
   - Show immediate feedback for actions
   - Use sound effects (if available)
   - Celebrate small wins

4. **Skip Option Considerations**
   - Only offer skip to returning users
   - Require intentional action (2-second hold)
   - Confirm before skipping

### Localization

Prepare for localization:

```csharp
// Use localization keys instead of hardcoded strings
instructionText.text = LocalizationManager.GetString("tutorial_step1");
```

---

## Support

For questions or issues:
- Check documentation in `/Documentation/`
- Review unit tests in `/Tests/Editor/`
- See example implementation in `/Examples/` (if provided)

---

## Version History

**v1.0.0** (Initial Release)
- Complete tutorial system implementation
- 3-step progressive tutorial
- Analytics integration
- Cloud save support
- Accessibility features
- Comprehensive unit tests

---

## License

[Your License Here]

---

**End of Integration Guide**

