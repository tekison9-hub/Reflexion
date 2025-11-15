

# Daily Rewards System - Integration Guide

Complete guide for integrating the robust Daily Rewards system into Reflexion.

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Scene Setup](#scene-setup)
4. [Server Setup (Firebase)](#server-setup-firebase)
5. [Push Notifications](#push-notifications)
6. [Monetization Integration](#monetization-integration)
7. [Analytics Setup](#analytics-setup)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Daily Rewards system provides:
- **7-Day Calendar** with progressive rewards
- **Streak Tracking** with grace period (24h + 2h tolerance)
- **Server Validation** to prevent cheating
- **Push Notifications** for daily reminders
- **Monetization** (ad doubling, IAP week claim)
- **Comeback Bonus** for returning users

### Reward Schedule
```
Day 1: 100 coins
Day 2: 150 coins
Day 3: 200 coins + 24h theme trial
Day 4: 250 coins
Day 5: 300 coins + random booster
Day 6: 350 coins
Day 7: 500 coins + exclusive theme + 100 gems
Day 8+: Repeats Day 7 rewards
```

---

## Quick Start

### 1. Import Scripts
```
Copy Scripts/DailyRewards/ to your project
```

### 2. Add Required Packages
```
- TextMeshPro
- Unity Mobile Notifications (com.unity.mobile.notifications)
```

### 3. Create Manager GameObjects
```csharp
// In your game's initialization scene
GameObject dailyRewardsManager = new GameObject("DailyRewardManager");
dailyRewardsManager.AddComponent<DailyRewardManager>();

// These will be auto-created if needed:
// - ServerTimeManager
// - DailyRewardNotificationManager
```

### 4. Basic Integration
```csharp
using Reflexion.DailyRewards;

void Start()
{
    // Check if reward is available
    if (DailyRewardManager.Instance.CanClaimToday)
    {
        ShowDailyRewardUI();
    }
}

async void ClaimReward()
{
    var result = await DailyRewardManager.Instance.ClaimDailyReward();
    
    if (result.success)
    {
        Debug.Log($"Claimed: {result.rewards}");
    }
}
```

---

## Scene Setup

### Create Daily Reward UI

#### 1. Calendar Container

```
Canvas
└── DailyRewardPanel
    ├── HeaderPanel
    │   ├── StreakText (TMP)  "🔥 5 Day Streak!"
    │   └── NextRewardText (TMP) "Tomorrow: 300 coins"
    ├── CalendarGrid (Horizontal Layout Group)
    │   └── DayItem Prefab (x7)
    ├── ClaimButton
    │   ├── ClaimText (TMP) "CLAIM"
    │   └── GlowEffect
    ├── DoubleRewardPanel
    │   └── WatchAdButton
    └── CompletionModal (initially hidden)
```

#### 2. Day Item Prefab

```
DayItemPrefab
├── Background (Image)
├── DayNumber (TMP) "Day 1"
├── RewardText (TMP) "100\nCoins"
├── CheckmarkIcon (initially hidden)
└── GlowEffect (initially hidden)
```

#### 3. Assign Components

Select `DailyRewardPanel`, add `DailyRewardUI` component:
```
Calendar:
  - Calendar Container: CalendarGrid
  - Calendar Day Prefab: DayItemPrefab
  - Display Days: 7

Header:
  - Streak Text: StreakText
  - Next Reward Preview Text: NextRewardText

Claim Button:
  - Claim Button: ClaimButton
  - Claim Button Text: ClaimText
  - Claim Button Glow: GlowEffect

Double Reward:
  - Double Reward Button: WatchAdButton
  - Double Reward Panel: DoubleRewardPanel
```

---

## Server Setup (Firebase)

### Firebase Configuration

#### 1. Install Firebase SDK
```
Unity Package Manager → Add from git URL:
https://github.com/firebase/firebase-unity-sdk.git?path=/FirebaseFirestore/package.json
https://github.com/firebase/firebase-unity-sdk.git?path=/FirebaseFunctions/package.json
```

#### 2. Add Scripting Define Symbol
```
Player Settings → Other Settings → Scripting Define Symbols
Add: FIREBASE
```

#### 3. Firebase Functions (Server-Side Validation)

Create `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Validate daily reward claim
exports.validateDailyRewardClaim = functions.https.onCall(async (data, context) => {
  // Verify authenticated user
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const dayNumber = data.dayNumber;
  const currentStreak = data.currentStreak;
  const lastClaimTimestamp = data.lastClaimTimestamp;
  const serverTimestamp = Math.floor(Date.now() / 1000);

  try {
    // Get user's daily reward data from Firestore
    const docRef = admin.firestore().collection('dailyRewards').doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      // First-time user - allow claim
      await docRef.set({
        currentDay: 1,
        currentStreak: 0,
        lastClaimTimestamp: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { valid: true, message: 'First-time claim approved' };
    }

    const userData = doc.data();
    const hoursSinceLastClaim = (serverTimestamp - userData.lastClaimTimestamp) / 3600;

    // Check if already claimed today
    const lastClaimDate = new Date(userData.lastClaimTimestamp * 1000).toISOString().split('T')[0];
    const currentDate = new Date(serverTimestamp * 1000).toISOString().split('T')[0];

    if (lastClaimDate === currentDate) {
      return { valid: false, message: 'Already claimed today' };
    }

    // Check if within valid claim window (24-26 hours)
    if (hoursSinceLastClaim < 24) {
      return { valid: false, message: 'Too soon to claim' };
    }

    // Validate streak continuity
    if (hoursSinceLastClaim > 26) {
      // Streak broken - reset to day 1
      return { valid: true, streakBroken: true, resetToDay: 1 };
    }

    // All checks passed
    return { valid: true, message: 'Claim approved' };

  } catch (error) {
    console.error('Validation error:', error);
    throw new functions.https.HttpsError('internal', 'Validation failed');
  }
});

// Sync daily reward data
exports.syncDailyRewardData = functions.firestore
  .document('dailyRewards/{userId}')
  .onWrite(async (change, context) => {
    // Log syncs for analytics
    console.log(`Daily reward synced for user: ${context.params.userId}`);
    return null;
  });
```

#### 4. Deploy Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

#### 5. Update URLs in Code

In `DailyRewardServerValidator.cs`:
```csharp
private const string FIREBASE_FUNCTION_URL = 
    "https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net";
```

---

## Push Notifications

### Unity Mobile Notifications Setup

#### 1. Install Package
```
Window → Package Manager → Unity Mobile Notifications
```

#### 2. Configure Android

Create `Assets/Plugins/Android/AndroidManifest.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
        <meta-data android:name="com.google.firebase.messaging.default_notification_icon"
                   android:resource="@drawable/notification_icon" />
        <meta-data android:name="com.google.firebase.messaging.default_notification_color"
                   android:resource="@color/notification_color" />
    </application>
</manifest>
```

#### 3. Configure iOS

Add to `Info.plist`:
```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

#### 4. Schedule Notification
```csharp
using Reflexion.DailyRewards;

void Start()
{
    // Schedule daily reminder at 9 AM
    DailyRewardNotificationManager.Instance.ScheduleDailyReminder(hour: 9, minute: 0);
}

// Allow user to customize time
void SetNotificationTime(int hour, int minute)
{
    DailyRewardNotificationManager.Instance.ScheduleDailyReminder(hour, minute);
}
```

---

## Monetization Integration

### Ad Integration (Unity Ads Example)

#### 1. Install Unity Ads SDK
```
Window → Package Manager → Advertisement Legacy
```

#### 2. Configure in Services Window
```
Window → Services → Ads
- Enable Ads
- Select game platform
- Enable test mode for development
```

#### 3. Implement in AdManager

Update `SupportingManagers.cs`:
```csharp
#if UNITY_ADS
using UnityEngine.Advertisements;

public async Task<bool> ShowRewardedAd(string placementId)
{
    if (!Advertisement.isInitialized)
    {
        Advertisement.Initialize("YOUR_GAME_ID", testMode: true);
    }

    if (!Advertisement.IsReady(placementId))
    {
        return false;
    }

    bool adCompleted = false;
    bool adFailed = false;

    Advertisement.Show(placementId, new ShowOptions
    {
        resultCallback = (result) =>
        {
            if (result == ShowResult.Finished)
            {
                adCompleted = true;
            }
            else
            {
                adFailed = true;
            }
        }
    });

    // Wait for ad to complete
    while (!adCompleted && !adFailed)
    {
        await Task.Yield();
    }

    return adCompleted;
}
#endif
```

### IAP Integration (Unity IAP)

#### 1. Install Unity IAP
```
Window → Package Manager → In-App Purchasing
```

#### 2. Configure Products
```csharp
// In IAPManager.cs
public void InitializeIAP()
{
    var builder = ConfigurationBuilder.Instance(StandardPurchasingModule.Instance());
    
    builder.AddProduct("claim_all_week", ProductType.Consumable, 
        new IDs
        {
            { "com.yourcompany.reflexion.claimweek", AppleAppStore.Name },
            { "claim_all_week", GooglePlay.Name }
        });
    
    UnityPurchasing.Initialize(this, builder);
}
```

#### 3. Handle Purchase
```csharp
public PurchaseProcessingResult ProcessPurchase(PurchaseEventArgs args)
{
    if (args.purchasedProduct.definition.id == "claim_all_week")
    {
        // Trigger claim all week
        _ = DailyRewardManager.Instance.ClaimAllWeek();
    }
    
    return PurchaseProcessingResult.Complete;
}
```

---

## Analytics Setup

### Firebase Analytics

#### 1. Add Scripting Define
```
Player Settings → FIREBASE_ANALYTICS
```

#### 2. Events Are Logged Automatically
```
- daily_reward_claimed
- daily_reward_doubled
- streak_broken
- comeback_bonus_claimed
```

#### 3. View in Firebase Console
```
Firebase Console → Analytics → Events
```

### Custom Analytics

Implement `AnalyticsManager` in your project:
```csharp
public class AnalyticsManager : MonoBehaviour
{
    public void LogEvent(string eventName, Dictionary<string, object> parameters)
    {
        // Send to your analytics service
        YourAnalyticsService.Track(eventName, parameters);
    }
}
```

---

## Testing

### Local Testing

#### 1. Test Reward Claims
```csharp
// Force reset for testing
DailyRewardManager.Instance.ResetDailyRewards();

// Test claim
var result = await DailyRewardManager.Instance.ClaimDailyReward();
Assert.IsTrue(result.success);
```

#### 2. Test Streak Logic
```csharp
// Simulate time travel (requires modifying save data)
var saveData = new DailyRewardSaveData
{
    currentDay = 3,
    currentStreak = 2,
    lastClaimTimestamp = DateTimeOffset.UtcNow.AddDays(-1).ToUnixTimeSeconds()
};

// Save and reload
string json = JsonUtility.ToJson(saveData);
PlayerPrefs.SetString("DailyRewardSaveData", json);
PlayerPrefs.Save();
```

#### 3. Run Unit Tests
```
Window → General → Test Runner
Select EditMode → Run All
```

### Device Testing

#### Test Notifications
1. Build to device
2. Close app completely
3. Wait for scheduled notification time
4. Verify notification appears

#### Test Server Validation
1. Enable server validation in Inspector
2. Deploy Firebase Functions
3. Test claim with valid/invalid conditions
4. Check Firebase logs

---

## Troubleshooting

### Reward Not Claimable

**Problem**: Button is grayed out even though it's a new day

**Solutions**:
1. Check system time is correct (UTC based)
2. Verify grace period hasn't expired
3. Clear PlayerPrefs and retry: `PlayerPrefs.DeleteAll()`
4. Check server time sync status

### Streak Reset Unexpectedly

**Problem**: Streak resets even though user claimed yesterday

**Solutions**:
1. Check grace period (26 hours)
2. Verify timezone handling (should use UTC)
3. Check server time vs local time desync
4. Review Firebase logs for validation results

### Notifications Not Appearing

**Problem**: Push notifications don't show up

**Solutions**:
1. Verify permissions granted on device
2. Check notification settings in device Settings app
3. Confirm channel is registered (Android)
4. Test with foreground notifications first
5. Review platform-specific requirements

### Server Validation Failing

**Problem**: Claims always fail with "Server validation failed"

**Solutions**:
1. Check Firebase Functions are deployed
2. Verify function URL in code matches deployed URL
3. Check Firebase authentication is working
4. Review Cloud Functions logs in Firebase Console
5. Test with server validation disabled temporarily

### Multiple Claims Same Day

**Problem**: User can claim multiple times in one day

**Solutions**:
1. Ensure server validation is enabled
2. Check date comparison logic (UTC dates)
3. Verify save data is persisting correctly
4. Check for timezone manipulation attempts

---

## Best Practices

### Security
1. Always use server validation in production
2. Store sensitive data server-side only
3. Use UTC timestamps to prevent timezone exploits
4. Validate all claims server-side before granting rewards

### User Experience
1. Show clear feedback for failed claims
2. Explain grace period to users
3. Don't punish users for server issues
4. Provide comeback bonus for retention

### Performance
1. Cache server time (don't request every frame)
2. Use async/await for network operations
3. Preload UI assets
4. Optimize calendar rendering

### Analytics
1. Track claim rates by day
2. Monitor streak break reasons
3. Analyze ad watch rates
4. Track IAP conversion

---

## Advanced Configuration

### Custom Reward Schedule

```csharp
// In Inspector or code:
_manager.rewardCalendar = new DailyRewardConfig[]
{
    new DailyRewardConfig { 
        day = 1, 
        rewards = new RewardData { coins = 200 } // Custom Day 1
    },
    // ... more days
};
```

### Adjust Grace Period

```csharp
// In DailyRewardManager Inspector:
Grace Hours: 28  // 24h + 4h tolerance instead of default 26h
```

### Custom Comeback Bonus

```csharp
_manager.comebackBonus = new RewardData 
{ 
    coins = 500,  // Instead of default 200
    gems = 50 
};

_manager.comebackDaysThreshold = 14;  // Instead of default 7
```

---

## Migration Guide

### From Existing Daily Reward System

```csharp
// Map your existing save data:
var oldData = YourOldSystem.GetSaveData();

var newData = new DailyRewardSaveData
{
    currentDay = oldData.dayNumber,
    currentStreak = oldData.streak,
    lastClaimTimestamp = oldData.lastClaim,
    totalClaimCount = oldData.totalClaims
};

// Save to new system:
string json = JsonUtility.ToJson(newData);
PlayerPrefs.SetString("DailyRewardSaveData", json);
```

---

## Support

For issues or questions:
- Check unit tests for usage examples
- Review Firebase Console logs
- See example integration in `Examples/`

---

**Version**: 1.0.0
**Last Updated**: November 2025
**Minimum Unity Version**: 2021.3+

