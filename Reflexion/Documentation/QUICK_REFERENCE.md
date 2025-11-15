# Tutorial System - Quick Reference

Quick reference guide for common operations with the Reflexion Tutorial System.

## Common Operations

### Check Tutorial Completion

```csharp
if (TutorialManager.Instance.IsTutorialCompleted)
{
    // Tutorial already done
}
```

### Start Tutorial

```csharp
TutorialManager.Instance.StartTutorial();
```

### Complete Current Step

```csharp
int currentStep = TutorialManager.Instance.CurrentStepIndex;
TutorialManager.Instance.CompleteStep(currentStep);
```

### Get Current Step Info

```csharp
TutorialStep step = TutorialManager.Instance.GetCurrentStep();
Debug.Log($"Step: {step.stepName}");
Debug.Log($"Targets needed: {step.targetCount}");
```

### Reset Tutorial (Testing)

```csharp
TutorialManager.Instance.ResetTutorial();
PlayerPrefs.DeleteAll(); // Clear all save data
```

## UI Operations

### Show Instruction

```csharp
await tutorialUI.ShowStepInstruction("Tap the target!");
```

### Move Spotlight

```csharp
Vector3 worldPos = target.transform.position;
tutorialUI.MoveSpotlight(worldPos, spotlightSize: 150f);
```

### Move Hand Pointer

```csharp
Vector2 screenPos = Camera.main.WorldToScreenPoint(targetPos);
tutorialUI.MoveHandPointer(screenPos);
```

### Play Tap Animation

```csharp
tutorialUI.PlayHandTapAnimation();
```

## Event Subscription

### Subscribe to Events

```csharp
private void OnEnable()
{
    TutorialManager.Instance.OnTutorialCompleted.AddListener(OnCompleted);
    TutorialManager.Instance.OnStepCompleted.AddListener(OnStepDone);
}

private void OnDisable()
{
    TutorialManager.Instance.OnTutorialCompleted.RemoveListener(OnCompleted);
    TutorialManager.Instance.OnStepCompleted.RemoveListener(OnStepDone);
}

private void OnCompleted()
{
    Debug.Log("Tutorial finished!");
}

private void OnStepDone(int stepIndex)
{
    Debug.Log($"Step {stepIndex} complete!");
}
```

## Analytics

### Manual Event Logging

```csharp
using Reflexion.Tutorial;

TutorialAnalytics.LogTutorialStarted();
TutorialAnalytics.LogTutorialStepCompleted(stepIndex, "Step Name");
TutorialAnalytics.LogTutorialCompleted(totalSteps);
TutorialAnalytics.LogTutorialAbandoned(lastStepIndex);
```

## Accessibility

### Enable High Contrast

```csharp
AccessibilityManager.Instance.IsHighContrastEnabled = true;
```

### Announce to Screen Reader

```csharp
AccessibilityManager.Instance.Announce("Tutorial started!");
```

### Adjust Font Size

```csharp
AccessibilityManager.Instance.FontScaleMultiplier = 1.3f;
// Or use helper methods:
AccessibilityManager.Instance.IncreaseFontSize();
AccessibilityManager.Instance.DecreaseFontSize();
```

## Cloud Save

### Force Sync

```csharp
await CloudSaveManager.Instance.ForceSyncNow();
```

### Check Cloud Save Status

```csharp
bool isReady = CloudSaveManager.Instance.IsCloudSaveReady();
```

### Subscribe to Sync Events

```csharp
CloudSaveManager.Instance.OnCloudSyncCompleted += (success) =>
{
    Debug.Log($"Sync {(success ? "succeeded" : "failed")}");
};
```

## Tutorial Step Configuration

### Define Custom Steps (Inspector)

```yaml
Step Configuration:
  Step Name: "My Custom Step"
  Instruction: "Complete the action"
  Target Count: 5
  Target Speed: 1.5
  Hit Area Multiplier: 1.0
  Show Combo Meter: true
  Show Lives System: true
```

### Define Steps in Code

```csharp
TutorialStep customStep = new TutorialStep
{
    stepName = "Custom Step",
    instruction = "Do something",
    targetCount = 3,
    targetSpeed = 1.0f,
    hitAreaMultiplier = 1.2f,
    showComboMeter = true,
    showLivesSystem = false
};
```

## Testing Helpers

### Enable Debug Mode

```csharp
// In TutorialManager Inspector:
// Add debug logging by checking console
```

### Clear Save Data

```csharp
PlayerPrefs.DeleteKey("TutorialSaveData");
PlayerPrefs.Save();
```

### Simulate Different States

```csharp
// Simulate completed tutorial
TutorialSaveData data = new TutorialSaveData
{
    isCompleted = true,
    lastCompletedStep = 2
};
string json = JsonUtility.ToJson(data);
PlayerPrefs.SetString("TutorialSaveData", json);
PlayerPrefs.Save();
```

## Mobile Input

### Using New Input System

Tutorial system uses Unity's new Input System for skip detection:

```csharp
// ESC key on keyboard (desktop testing)
// Back button on Android
// Handled automatically by TutorialManager
```

### Custom Skip Trigger

```csharp
// If you want custom skip trigger:
TutorialManager.Instance.RequestSkipTutorial();
```

## Common Patterns

### Wait for Tutorial Before Starting Game

```csharp
void Start()
{
    if (!TutorialManager.Instance.IsTutorialCompleted)
    {
        TutorialManager.Instance.OnTutorialCompleted.AddListener(StartGame);
        TutorialManager.Instance.StartTutorial();
    }
    else
    {
        StartGame();
    }
}
```

### Progressive UI Reveal

```csharp
void OnStepCompleted(int stepIndex)
{
    switch (stepIndex)
    {
        case 0:
            comboMeter.SetActive(true);
            break;
        case 1:
            livesDisplay.SetActive(true);
            break;
    }
}
```

### Conditional Tutorial Elements

```csharp
TutorialStep step = TutorialManager.Instance.GetCurrentStep();

if (step.showComboMeter)
{
    EnableComboMeter();
}

if (step.showLivesSystem)
{
    EnableLivesDisplay();
}
```

## Prefab Configuration

### TutorialManager Setup

```
GameObject: TutorialManager
├── TutorialManager (script)
    ├── Tutorial Steps: Array of TutorialStep
    ├── Skip Hold Duration: 2.0
    ├── UI Controller: Reference to TutorialUIController
    ├── Tutorial Canvas: Reference to Canvas
    ├── Completion Reward Coins: 100
    └── Completion Message: "You're ready!"
```

### TutorialUIController Setup

```
GameObject: TutorialCanvas
├── TutorialUIController (script)
    ├── Overlay Components:
    │   ├── Overlay Canvas Group
    │   ├── Dim Background
    │   └── Spotlight Mask
    ├── Instruction Panel:
    │   ├── Instruction Panel
    │   ├── Instruction Text
    │   └── Instruction Canvas Group
    ├── Hand Pointer
    ├── Skip UI Components
    └── Completion UI Components
```

## Scripting Define Symbols

Add in **Player Settings → Other Settings → Scripting Define Symbols**:

| Symbol | Purpose |
|--------|---------|
| `FIREBASE_ANALYTICS` | Enable Firebase Analytics |
| `GAMEANALYTICS` | Enable GameAnalytics |
| `UNITY_ANALYTICS` | Enable Unity Analytics (default) |
| `PLAYFAB` | Enable PlayFab cloud save |
| `FIREBASE` | Enable Firebase cloud save |
| `UNITY_CLOUD_SAVE` | Enable Unity Cloud Save |

## File Locations

```
Project/
├── Scripts/Tutorial/
│   ├── TutorialManager.cs
│   ├── TutorialUIController.cs
│   ├── HandPointerAnimator.cs
│   ├── TutorialAnalytics.cs
│   ├── CloudSaveManager.cs
│   ├── AccessibilityManager.cs
│   └── GameManager.cs
├── Tests/Editor/
│   ├── TutorialManagerTests.cs
│   └── TutorialPersistenceTests.cs
├── Documentation/
│   ├── TUTORIAL_INTEGRATION_GUIDE.md
│   ├── UI_PREFAB_SETUP_GUIDE.md
│   └── QUICK_REFERENCE.md (this file)
├── Examples/
│   └── TutorialIntegrationExample.cs
├── Prefabs/
│   └── TutorialCanvas.prefab (you create this)
└── README.md
```

## Performance Tips

```csharp
// ✓ Good: Use async/await
await Task.Delay(1000);

// ✗ Avoid: Busy-wait in Update
void Update() {
    _timer += Time.deltaTime;
    if (_timer > 1f) { /* do something */ }
}

// ✓ Good: Disable canvas when not in use
tutorialCanvas.SetActive(false);

// ✓ Good: Pool frequently used objects
ObjectPool<GameObject>.Get();

// ✓ Good: Use TextMeshPro
TextMeshProUGUI text;

// ✗ Avoid: Unity's legacy Text
Text legacyText;
```

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Tutorial repeats every time | `TutorialManager.Instance.ResetTutorial()` then check `IsTutorialCompleted` |
| UI not visible | Check Canvas sort order and CanvasGroup alpha |
| Hand pointer off-screen | Verify Camera.main is set and WorldToScreenPosition works |
| Events not firing | Check event subscriptions in OnEnable/OnDisable |
| Save data not persisting | Verify PlayerPrefs.Save() is called |
| Analytics not logging | Check scripting define symbols |

## Keyboard Shortcuts (Editor Testing)

| Key | Action |
|-----|--------|
| ESC (hold 2s) | Skip tutorial |
| Space | Simulate target tap (if implemented) |

## Best Practices

✓ Always check `IsTutorialCompleted` before starting
✓ Subscribe/unsubscribe in OnEnable/OnDisable
✓ Use async/await for delays
✓ Call PlayerPrefs.Save() after writes
✓ Test on multiple resolutions
✓ Test with accessibility features enabled
✓ Clear PlayerPrefs between test runs
✓ Use Unity Test Runner for automated tests

## Support Resources

- **Integration Guide**: `Documentation/TUTORIAL_INTEGRATION_GUIDE.md`
- **UI Setup**: `Documentation/UI_PREFAB_SETUP_GUIDE.md`
- **Example Code**: `Examples/TutorialIntegrationExample.cs`
- **Unit Tests**: `Tests/Editor/TutorialManagerTests.cs`

---

**Last Updated**: November 2025
**Version**: 1.0.0

