using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

namespace Reflexion.DailyRewards
{
    /// <summary>
    /// Manages daily reward system including streak tracking, reward claiming,
    /// and server synchronization. Handles timezone-safe date calculations.
    /// </summary>
    public class DailyRewardManager : MonoBehaviour
    {
        #region Singleton
        private static DailyRewardManager _instance;

        /// <summary>
        /// Gets the singleton instance of DailyRewardManager.
        /// </summary>
        public static DailyRewardManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindObjectOfType<DailyRewardManager>();
                    if (_instance == null)
                    {
                        GameObject go = new GameObject("DailyRewardManager");
                        _instance = go.AddComponent<DailyRewardManager>();
                        DontDestroyOnLoad(go);
                    }
                }
                return _instance;
            }
        }
        #endregion

        #region Serialized Fields
        [Header("Reward Configuration")]
        [SerializeField] private DailyRewardConfig[] rewardCalendar;
        [SerializeField] private int maxCalendarDays = 7;
        [SerializeField] private bool repeatDay7AfterCompletion = true;
        
        [Header("Streak Settings")]
        [SerializeField] private int graceHours = 26; // 24 hours + 2 hours tolerance
        [SerializeField] private int comebackDaysThreshold = 7;
        [SerializeField] private RewardData comebackBonus;
        
        [Header("Monetization")]
        [SerializeField] private bool enableDoubleReward = true;
        [SerializeField] private float claimAllWeekPrice = 4.99f;
        [SerializeField] private bool premiumUsersGetDouble = true;
        
        [Header("Server Sync")]
        [SerializeField] private bool enableServerValidation = true;
        [SerializeField] private float serverSyncTimeout = 10f;
        #endregion

        #region Private Fields
        private DailyRewardSaveData _saveData;
        private DateTime _currentServerTime;
        private bool _isInitialized = false;
        private bool _isSyncing = false;
        private bool _hasClaimedToday = false;
        #endregion

        #region Events
        /// <summary>
        /// Fired when a reward is successfully claimed.
        /// </summary>
        public UnityEvent<DailyRewardResult> OnRewardClaimed;

        /// <summary>
        /// Fired when streak is broken.
        /// </summary>
        public UnityEvent<int> OnStreakBroken;

        /// <summary>
        /// Fired when comeback bonus is available.
        /// </summary>
        public UnityEvent<RewardData> OnComebackBonusAvailable;

        /// <summary>
        /// Fired when data is synced with server.
        /// </summary>
        public UnityEvent<bool> OnServerSyncCompleted;
        #endregion

        #region Properties
        /// <summary>
        /// Gets the current streak count.
        /// </summary>
        public int CurrentStreak => _saveData?.currentStreak ?? 0;

        /// <summary>
        /// Gets the current day in the calendar (1-7+).
        /// </summary>
        public int CurrentDay => _saveData?.currentDay ?? 1;

        /// <summary>
        /// Gets whether reward can be claimed today.
        /// </summary>
        public bool CanClaimToday => !_hasClaimedToday && IsWithinGracePeriod();

        /// <summary>
        /// Gets whether comeback bonus is available.
        /// </summary>
        public bool HasComebackBonus => CheckComebackBonusEligibility();

        /// <summary>
        /// Gets the next reward in the calendar.
        /// </summary>
        public DailyRewardConfig NextReward => GetRewardForDay(CurrentDay);

        /// <summary>
        /// Gets whether user is premium.
        /// </summary>
        public bool IsPremiumUser => CheckPremiumStatus();
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }

            _instance = this;
            DontDestroyOnLoad(gameObject);

            InitializeEvents();
        }

        private async void Start()
        {
            await InitializeAsync();
        }

        private void OnApplicationPause(bool pauseStatus)
        {
            if (!pauseStatus && _isInitialized)
            {
                // App resumed - check if new day
                _ = CheckAndUpdateStreak();
            }
        }
        #endregion

        #region Initialization
        /// <summary>
        /// Initializes event handlers.
        /// </summary>
        private void InitializeEvents()
        {
            OnRewardClaimed ??= new UnityEvent<DailyRewardResult>();
            OnStreakBroken ??= new UnityEvent<int>();
            OnComebackBonusAvailable ??= new UnityEvent<RewardData>();
            OnServerSyncCompleted ??= new UnityEvent<bool>();
        }

        /// <summary>
        /// Initializes the daily reward system asynchronously.
        /// </summary>
        private async System.Threading.Tasks.Task InitializeAsync()
        {
            // Initialize default calendar if not configured
            if (rewardCalendar == null || rewardCalendar.Length == 0)
            {
                InitializeDefaultCalendar();
            }

            // Load local save data
            LoadLocalSaveData();

            // Sync with server
            if (enableServerValidation)
            {
                await SyncWithServer();
            }
            else
            {
                _currentServerTime = DateTime.UtcNow;
            }

            // Check and update streak
            await CheckAndUpdateStreak();

            // Check comeback bonus
            if (HasComebackBonus)
            {
                OnComebackBonusAvailable?.Invoke(comebackBonus);
            }

            _isInitialized = true;
            Debug.Log($"[DailyRewards] Initialized. Streak: {CurrentStreak}, Day: {CurrentDay}");
        }

        /// <summary>
        /// Initializes default reward calendar.
        /// </summary>
        private void InitializeDefaultCalendar()
        {
            rewardCalendar = new DailyRewardConfig[]
            {
                new DailyRewardConfig
                {
                    day = 1,
                    rewards = new RewardData { coins = 100 }
                },
                new DailyRewardConfig
                {
                    day = 2,
                    rewards = new RewardData { coins = 150 }
                },
                new DailyRewardConfig
                {
                    day = 3,
                    rewards = new RewardData { coins = 200, themeTrialHours = 24 }
                },
                new DailyRewardConfig
                {
                    day = 4,
                    rewards = new RewardData { coins = 250 }
                },
                new DailyRewardConfig
                {
                    day = 5,
                    rewards = new RewardData { coins = 300, randomBooster = true }
                },
                new DailyRewardConfig
                {
                    day = 6,
                    rewards = new RewardData { coins = 350 }
                },
                new DailyRewardConfig
                {
                    day = 7,
                    rewards = new RewardData { coins = 500, exclusiveTheme = "GoldenStreak", gems = 100 }
                }
            };

            comebackBonus = new RewardData { coins = 200 };
        }
        #endregion

        #region Public Methods - Claiming
        /// <summary>
        /// Claims today's daily reward.
        /// </summary>
        /// <param name="doubleReward">Whether to double the reward (via ad or premium).</param>
        /// <returns>Result of the claim attempt.</returns>
        public async System.Threading.Tasks.Task<DailyRewardResult> ClaimDailyReward(bool doubleReward = false)
        {
            if (!_isInitialized)
            {
                return new DailyRewardResult
                {
                    success = false,
                    errorMessage = "System not initialized"
                };
            }

            if (_hasClaimedToday)
            {
                return new DailyRewardResult
                {
                    success = false,
                    errorMessage = "Already claimed today. Come back tomorrow!"
                };
            }

            if (!CanClaimToday)
            {
                return new DailyRewardResult
                {
                    success = false,
                    errorMessage = "Reward not available yet"
                };
            }

            // Get reward for current day
            DailyRewardConfig rewardConfig = GetRewardForDay(CurrentDay);
            if (rewardConfig == null)
            {
                return new DailyRewardResult
                {
                    success = false,
                    errorMessage = "Invalid reward configuration"
                };
            }

            // Server validation
            if (enableServerValidation)
            {
                bool serverValid = await ValidateClaimWithServer(CurrentDay);
                if (!serverValid)
                {
                    return new DailyRewardResult
                    {
                        success = false,
                        errorMessage = "Server validation failed. Please check your connection."
                    };
                }
            }

            // Calculate final rewards
            RewardData finalReward = CalculateFinalReward(rewardConfig.rewards, doubleReward);

            // Grant rewards
            GrantRewards(finalReward);

            // Update save data
            _saveData.lastClaimDate = GetCurrentDateString();
            _saveData.lastClaimTimestamp = GetCurrentTimestamp();
            _saveData.currentStreak++;
            _saveData.currentDay = GetNextDay(CurrentDay);
            _saveData.totalClaimCount++;
            _hasClaimedToday = true;

            // Save locally and to server
            SaveLocalData();
            if (enableServerValidation)
            {
                _ = SyncWithServer();
            }

            // Create result
            DailyRewardResult result = new DailyRewardResult
            {
                success = true,
                dayNumber = CurrentDay,
                rewards = finalReward,
                streakCount = CurrentStreak,
                wasDoubled = doubleReward
            };

            // Fire event
            OnRewardClaimed?.Invoke(result);

            // Analytics
            DailyRewardAnalytics.LogRewardClaimed(result.dayNumber, finalReward, result.streakCount);
            if (doubleReward)
            {
                DailyRewardAnalytics.LogRewardDoubled(IsPremiumUser);
            }

            Debug.Log($"[DailyRewards] Claimed Day {result.dayNumber}: {finalReward}");

            return result;
        }

        /// <summary>
        /// Claims comeback bonus if eligible.
        /// </summary>
        /// <returns>Result of comeback bonus claim.</returns>
        public DailyRewardResult ClaimComebackBonus()
        {
            if (!HasComebackBonus)
            {
                return new DailyRewardResult
                {
                    success = false,
                    errorMessage = "No comeback bonus available"
                };
            }

            // Grant comeback rewards
            GrantRewards(comebackBonus);

            // Reset to Day 1
            _saveData.currentDay = 1;
            _saveData.currentStreak = 0;

            SaveLocalData();

            DailyRewardAnalytics.LogComebackBonusClaimed();

            return new DailyRewardResult
            {
                success = true,
                dayNumber = 0,
                rewards = comebackBonus,
                streakCount = 0,
                isComebackBonus = true
            };
        }

        /// <summary>
        /// Claims all rewards for the week (IAP feature).
        /// </summary>
        /// <returns>Combined rewards from all days.</returns>
        public async System.Threading.Tasks.Task<DailyRewardResult> ClaimAllWeek()
        {
            // Verify IAP purchase (integrate with your IAP system)
            bool purchaseSuccessful = await VerifyClaimAllWeekPurchase();

            if (!purchaseSuccessful)
            {
                return new DailyRewardResult
                {
                    success = false,
                    errorMessage = "Purchase failed or not verified"
                };
            }

            // Calculate combined rewards for remaining days
            RewardData combinedRewards = new RewardData();
            int daysToSkip = Mathf.Min(maxCalendarDays - CurrentDay + 1, maxCalendarDays);

            for (int i = 0; i < daysToSkip; i++)
            {
                int day = CurrentDay + i;
                DailyRewardConfig config = GetRewardForDay(day);
                if (config != null)
                {
                    combinedRewards.Add(config.rewards);
                }
            }

            // Grant all rewards
            GrantRewards(combinedRewards);

            // Update to Day 7 (or max day)
            _saveData.currentDay = repeatDay7AfterCompletion ? maxCalendarDays : maxCalendarDays;
            _saveData.currentStreak += daysToSkip;
            _saveData.lastClaimDate = GetCurrentDateString();
            _saveData.lastClaimTimestamp = GetCurrentTimestamp();
            _hasClaimedToday = true;

            SaveLocalData();

            return new DailyRewardResult
            {
                success = true,
                dayNumber = maxCalendarDays,
                rewards = combinedRewards,
                streakCount = CurrentStreak,
                wasClaimAllWeek = true
            };
        }
        #endregion

        #region Streak Management
        /// <summary>
        /// Checks and updates streak based on last claim time.
        /// </summary>
        private async System.Threading.Tasks.Task CheckAndUpdateStreak()
        {
            if (_saveData == null || string.IsNullOrEmpty(_saveData.lastClaimDate))
            {
                // First time user - no streak to check
                _hasClaimedToday = false;
                return;
            }

            long lastClaimTimestamp = _saveData.lastClaimTimestamp;
            long currentTimestamp = GetCurrentTimestamp();
            long hoursSinceLastClaim = (currentTimestamp - lastClaimTimestamp) / 3600;

            // Check if already claimed today
            string lastClaimDate = _saveData.lastClaimDate;
            string currentDate = GetCurrentDateString();

            if (lastClaimDate == currentDate)
            {
                _hasClaimedToday = true;
                return;
            }

            // Check if within grace period
            if (hoursSinceLastClaim <= graceHours)
            {
                // Within grace period - streak continues
                _hasClaimedToday = false;
            }
            else
            {
                // Streak broken
                int previousStreak = _saveData.currentStreak;
                _saveData.currentStreak = 0;
                _saveData.currentDay = 1;
                _hasClaimedToday = false;

                SaveLocalData();

                OnStreakBroken?.Invoke(previousStreak);
                DailyRewardAnalytics.LogStreakBroken(previousStreak);

                Debug.Log($"[DailyRewards] Streak broken. Previous streak: {previousStreak}");
            }

            await System.Threading.Tasks.Task.CompletedTask;
        }

        /// <summary>
        /// Checks if current time is within grace period from last claim.
        /// </summary>
        private bool IsWithinGracePeriod()
        {
            if (_saveData == null || _saveData.lastClaimTimestamp == 0)
            {
                return true; // First time user
            }

            long currentTimestamp = GetCurrentTimestamp();
            long hoursSinceLastClaim = (currentTimestamp - _saveData.lastClaimTimestamp) / 3600;

            return hoursSinceLastClaim >= 24; // Can claim after 24 hours
        }

        /// <summary>
        /// Checks if user is eligible for comeback bonus.
        /// </summary>
        private bool CheckComebackBonusEligibility()
        {
            if (_saveData == null || _saveData.lastClaimTimestamp == 0)
            {
                return false; // First time user
            }

            long currentTimestamp = GetCurrentTimestamp();
            long daysSinceLastClaim = (currentTimestamp - _saveData.lastClaimTimestamp) / 86400;

            return daysSinceLastClaim >= comebackDaysThreshold;
        }
        #endregion

        #region Reward Calculation
        /// <summary>
        /// Calculates final reward with multipliers applied.
        /// </summary>
        private RewardData CalculateFinalReward(RewardData baseReward, bool doubleReward)
        {
            RewardData finalReward = baseReward.Clone();

            // Apply premium multiplier
            if (IsPremiumUser && premiumUsersGetDouble)
            {
                finalReward.Multiply(2);
            }
            // Or apply ad double
            else if (doubleReward)
            {
                finalReward.Multiply(2);
            }

            return finalReward;
        }

        /// <summary>
        /// Gets reward configuration for a specific day.
        /// </summary>
        private DailyRewardConfig GetRewardForDay(int day)
        {
            // Handle day 8+ (repeat day 7)
            if (day > maxCalendarDays && repeatDay7AfterCompletion)
            {
                day = maxCalendarDays;
            }

            // Find in calendar
            foreach (var config in rewardCalendar)
            {
                if (config.day == day)
                {
                    return config;
                }
            }

            return null;
        }

        /// <summary>
        /// Gets the next day number in the calendar.
        /// </summary>
        private int GetNextDay(int currentDay)
        {
            if (currentDay >= maxCalendarDays && repeatDay7AfterCompletion)
            {
                return maxCalendarDays; // Stay on day 7
            }

            return currentDay + 1;
        }
        #endregion

        #region Reward Granting
        /// <summary>
        /// Grants rewards to the player.
        /// </summary>
        private void GrantRewards(RewardData rewards)
        {
            // Integrate with your game's economy system
            if (rewards.coins > 0)
            {
                GameEconomyManager.Instance?.AddCoins(rewards.coins);
            }

            if (rewards.gems > 0)
            {
                GameEconomyManager.Instance?.AddGems(rewards.gems);
            }

            if (!string.IsNullOrEmpty(rewards.exclusiveTheme))
            {
                ThemeManager.Instance?.UnlockTheme(rewards.exclusiveTheme);
            }

            if (rewards.themeTrialHours > 0)
            {
                ThemeManager.Instance?.GrantThemeTrial(rewards.themeTrialHours);
            }

            if (rewards.randomBooster)
            {
                BoosterManager.Instance?.GrantRandomBooster();
            }

            Debug.Log($"[DailyRewards] Granted: {rewards}");
        }
        #endregion

        #region Persistence
        /// <summary>
        /// Loads save data from local storage.
        /// </summary>
        private void LoadLocalSaveData()
        {
            if (PlayerPrefs.HasKey("DailyRewardSaveData"))
            {
                string json = PlayerPrefs.GetString("DailyRewardSaveData");
                _saveData = JsonUtility.FromJson<DailyRewardSaveData>(json);
            }
            else
            {
                _saveData = new DailyRewardSaveData
                {
                    currentDay = 1,
                    currentStreak = 0,
                    lastClaimDate = "",
                    lastClaimTimestamp = 0,
                    totalClaimCount = 0
                };
            }
        }

        /// <summary>
        /// Saves data to local storage.
        /// </summary>
        private void SaveLocalData()
        {
            string json = JsonUtility.ToJson(_saveData);
            PlayerPrefs.SetString("DailyRewardSaveData", json);
            PlayerPrefs.Save();
        }
        #endregion

        #region Server Sync
        /// <summary>
        /// Syncs data with server.
        /// </summary>
        private async System.Threading.Tasks.Task<bool> SyncWithServer()
        {
            if (_isSyncing)
            {
                return false;
            }

            _isSyncing = true;

            try
            {
                // Get server time
                _currentServerTime = await ServerTimeManager.Instance.GetServerTime();

                // Sync save data
                bool success = await DailyRewardServerValidator.SyncData(_saveData);

                OnServerSyncCompleted?.Invoke(success);
                return success;
            }
            catch (Exception e)
            {
                Debug.LogError($"[DailyRewards] Server sync failed: {e.Message}");
                _currentServerTime = DateTime.UtcNow; // Fallback to local time
                OnServerSyncCompleted?.Invoke(false);
                return false;
            }
            finally
            {
                _isSyncing = false;
            }
        }

        /// <summary>
        /// Validates claim attempt with server.
        /// </summary>
        private async System.Threading.Tasks.Task<bool> ValidateClaimWithServer(int day)
        {
            try
            {
                return await DailyRewardServerValidator.ValidateClaim(day, _saveData);
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[DailyRewards] Server validation failed: {e.Message}");
                // Allow claim if server unavailable (don't punish user)
                return true;
            }
        }
        #endregion

        #region Helper Methods
        /// <summary>
        /// Gets current UTC timestamp in seconds.
        /// </summary>
        private long GetCurrentTimestamp()
        {
            DateTime utcNow = enableServerValidation ? _currentServerTime : DateTime.UtcNow;
            return new DateTimeOffset(utcNow).ToUnixTimeSeconds();
        }

        /// <summary>
        /// Gets current date string (YYYY-MM-DD) in UTC.
        /// </summary>
        private string GetCurrentDateString()
        {
            DateTime utcNow = enableServerValidation ? _currentServerTime : DateTime.UtcNow;
            return utcNow.ToString("yyyy-MM-dd");
        }

        /// <summary>
        /// Checks if user has premium status.
        /// </summary>
        private bool CheckPremiumStatus()
        {
            // Integrate with your IAP/premium system
            return PremiumManager.Instance?.IsPremium ?? false;
        }

        /// <summary>
        /// Verifies "Claim All Week" IAP purchase.
        /// </summary>
        private async System.Threading.Tasks.Task<bool> VerifyClaimAllWeekPurchase()
        {
            // Integrate with your IAP system
            return await IAPManager.Instance?.VerifyPurchase("claim_all_week");
        }
        #endregion

        #region Public API
        /// <summary>
        /// Gets all reward configs for the calendar view.
        /// </summary>
        public DailyRewardConfig[] GetCalendarRewards()
        {
            return rewardCalendar;
        }

        /// <summary>
        /// Gets the status of a specific day.
        /// </summary>
        public DayStatus GetDayStatus(int day)
        {
            if (day < CurrentDay || (day == CurrentDay && _hasClaimedToday))
            {
                return DayStatus.Completed;
            }
            else if (day == CurrentDay && !_hasClaimedToday)
            {
                return DayStatus.Available;
            }
            else
            {
                return DayStatus.Locked;
            }
        }

        /// <summary>
        /// Resets daily rewards (for testing).
        /// </summary>
        public void ResetDailyRewards()
        {
            _saveData = new DailyRewardSaveData
            {
                currentDay = 1,
                currentStreak = 0,
                lastClaimDate = "",
                lastClaimTimestamp = 0,
                totalClaimCount = 0
            };

            _hasClaimedToday = false;
            SaveLocalData();

            Debug.Log("[DailyRewards] Reset complete");
        }
        #endregion
    }

    #region Enums
    /// <summary>
    /// Status of a calendar day.
    /// </summary>
    public enum DayStatus
    {
        Completed,
        Available,
        Locked
    }
    #endregion

    #region Data Classes
    /// <summary>
    /// Configuration for a single day's reward.
    /// </summary>
    [Serializable]
    public class DailyRewardConfig
    {
        public int day;
        public RewardData rewards;
    }

    /// <summary>
    /// Reward data containing all possible reward types.
    /// </summary>
    [Serializable]
    public class RewardData
    {
        public int coins;
        public int gems;
        public string exclusiveTheme;
        public int themeTrialHours;
        public bool randomBooster;

        public RewardData Clone()
        {
            return new RewardData
            {
                coins = this.coins,
                gems = this.gems,
                exclusiveTheme = this.exclusiveTheme,
                themeTrialHours = this.themeTrialHours,
                randomBooster = this.randomBooster
            };
        }

        public void Multiply(int multiplier)
        {
            coins *= multiplier;
            gems *= multiplier;
            // Don't multiply boolean/string rewards
        }

        public void Add(RewardData other)
        {
            coins += other.coins;
            gems += other.gems;
            if (!string.IsNullOrEmpty(other.exclusiveTheme))
                exclusiveTheme = other.exclusiveTheme;
            themeTrialHours += other.themeTrialHours;
            randomBooster = randomBooster || other.randomBooster;
        }

        public override string ToString()
        {
            List<string> parts = new List<string>();
            if (coins > 0) parts.Add($"{coins} coins");
            if (gems > 0) parts.Add($"{gems} gems");
            if (!string.IsNullOrEmpty(exclusiveTheme)) parts.Add($"Theme: {exclusiveTheme}");
            if (themeTrialHours > 0) parts.Add($"{themeTrialHours}h theme trial");
            if (randomBooster) parts.Add("Random booster");
            return string.Join(", ", parts);
        }
    }

    /// <summary>
    /// Save data for daily rewards persistence.
    /// </summary>
    [Serializable]
    public class DailyRewardSaveData
    {
        public int currentDay;
        public int currentStreak;
        public string lastClaimDate;
        public long lastClaimTimestamp;
        public int totalClaimCount;
    }

    /// <summary>
    /// Result of a reward claim attempt.
    /// </summary>
    [Serializable]
    public class DailyRewardResult
    {
        public bool success;
        public string errorMessage;
        public int dayNumber;
        public RewardData rewards;
        public int streakCount;
        public bool wasDoubled;
        public bool isComebackBonus;
        public bool wasClaimAllWeek;
    }
    #endregion
}

