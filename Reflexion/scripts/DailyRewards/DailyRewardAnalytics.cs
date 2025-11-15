using System.Collections.Generic;
using UnityEngine;

namespace Reflexion.DailyRewards
{
    /// <summary>
    /// Static analytics handler for daily reward events.
    /// Logs events to configured analytics services.
    /// </summary>
    public static class DailyRewardAnalytics
    {
        #region Event Names
        private const string EVENT_REWARD_CLAIMED = "daily_reward_claimed";
        private const string EVENT_REWARD_DOUBLED = "daily_reward_doubled";
        private const string EVENT_STREAK_BROKEN = "streak_broken";
        private const string EVENT_COMEBACK_BONUS_CLAIMED = "comeback_bonus_claimed";
        private const string EVENT_CLAIM_ALL_WEEK_PURCHASED = "claim_all_week_purchased";
        #endregion

        #region Public Methods
        /// <summary>
        /// Logs when a daily reward is claimed.
        /// </summary>
        /// <param name="dayNumber">The day number claimed.</param>
        /// <param name="rewards">The rewards received.</param>
        /// <param name="streakCount">Current streak count.</param>
        public static void LogRewardClaimed(int dayNumber, RewardData rewards, int streakCount)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>
            {
                { "day_number", dayNumber },
                { "reward_type", GetRewardType(rewards) },
                { "streak_count", streakCount },
                { "coins_earned", rewards.coins },
                { "gems_earned", rewards.gems },
                { "timestamp", System.DateTime.Now.ToString("o") }
            };

            LogEvent(EVENT_REWARD_CLAIMED, parameters);
            Debug.Log($"[Analytics] Reward Claimed - Day {dayNumber}, Streak: {streakCount}");
        }

        /// <summary>
        /// Logs when a reward is doubled (via ad or premium).
        /// </summary>
        /// <param name="viaAd">True if doubled via ad, false if premium.</param>
        public static void LogRewardDoubled(bool viaAd)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>
            {
                { "via_ad", viaAd },
                { "timestamp", System.DateTime.Now.ToString("o") }
            };

            LogEvent(EVENT_REWARD_DOUBLED, parameters);
            Debug.Log($"[Analytics] Reward Doubled - Via Ad: {viaAd}");
        }

        /// <summary>
        /// Logs when a streak is broken.
        /// </summary>
        /// <param name="lastStreakLength">The length of the broken streak.</param>
        public static void LogStreakBroken(int lastStreakLength)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>
            {
                { "last_streak_length", lastStreakLength },
                { "timestamp", System.DateTime.Now.ToString("o") }
            };

            LogEvent(EVENT_STREAK_BROKEN, parameters);
            Debug.Log($"[Analytics] Streak Broken - Length: {lastStreakLength}");
        }

        /// <summary>
        /// Logs when comeback bonus is claimed.
        /// </summary>
        public static void LogComebackBonusClaimed()
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>
            {
                { "timestamp", System.DateTime.Now.ToString("o") }
            };

            LogEvent(EVENT_COMEBACK_BONUS_CLAIMED, parameters);
            Debug.Log("[Analytics] Comeback Bonus Claimed");
        }

        /// <summary>
        /// Logs when "Claim All Week" IAP is purchased.
        /// </summary>
        /// <param name="price">Price paid.</param>
        /// <param name="daysSkipped">Number of days claimed.</param>
        public static void LogClaimAllWeekPurchased(float price, int daysSkipped)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>
            {
                { "price", price },
                { "days_skipped", daysSkipped },
                { "timestamp", System.DateTime.Now.ToString("o") }
            };

            LogEvent(EVENT_CLAIM_ALL_WEEK_PURCHASED, parameters);
            Debug.Log($"[Analytics] Claim All Week Purchased - ${price}");
        }
        #endregion

        #region Private Methods
        /// <summary>
        /// Logs an event to all configured analytics services.
        /// </summary>
        private static void LogEvent(string eventName, Dictionary<string, object> parameters)
        {
            // Unity Analytics
            #if UNITY_ANALYTICS
            try
            {
                UnityEngine.Analytics.Analytics.CustomEvent(eventName, parameters);
            }
            catch (System.Exception e)
            {
                Debug.LogWarning($"Failed to log to Unity Analytics: {e.Message}");
            }
            #endif

            // Firebase Analytics
            #if FIREBASE_ANALYTICS
            try
            {
                Firebase.Analytics.FirebaseAnalytics.LogEvent(eventName,
                    ConvertToFirebaseParameters(parameters));
            }
            catch (System.Exception e)
            {
                Debug.LogWarning($"Failed to log to Firebase Analytics: {e.Message}");
            }
            #endif

            // GameAnalytics
            #if GAMEANALYTICS
            try
            {
                GameAnalyticsSDK.GameAnalytics.NewDesignEvent(eventName,
                    ConvertParametersToFloat(parameters));
            }
            catch (System.Exception e)
            {
                Debug.LogWarning($"Failed to log to GameAnalytics: {e.Message}");
            }
            #endif

            // Custom analytics (if available)
            AnalyticsManager.Instance?.LogEvent(eventName, parameters);
        }

        /// <summary>
        /// Determines the reward type string from reward data.
        /// </summary>
        private static string GetRewardType(RewardData rewards)
        {
            if (!string.IsNullOrEmpty(rewards.exclusiveTheme))
            {
                return "exclusive_theme";
            }
            else if (rewards.randomBooster)
            {
                return "booster";
            }
            else if (rewards.themeTrialHours > 0)
            {
                return "theme_trial";
            }
            else if (rewards.gems > 0)
            {
                return "coins_and_gems";
            }
            else
            {
                return "coins_only";
            }
        }

        #if FIREBASE_ANALYTICS
        /// <summary>
        /// Converts parameters to Firebase format.
        /// </summary>
        private static Firebase.Analytics.Parameter[] ConvertToFirebaseParameters(
            Dictionary<string, object> parameters)
        {
            List<Firebase.Analytics.Parameter> firebaseParams =
                new List<Firebase.Analytics.Parameter>();

            foreach (var kvp in parameters)
            {
                if (kvp.Value is string strValue)
                {
                    firebaseParams.Add(new Firebase.Analytics.Parameter(kvp.Key, strValue));
                }
                else if (kvp.Value is int intValue)
                {
                    firebaseParams.Add(new Firebase.Analytics.Parameter(kvp.Key, intValue));
                }
                else if (kvp.Value is long longValue)
                {
                    firebaseParams.Add(new Firebase.Analytics.Parameter(kvp.Key, longValue));
                }
                else if (kvp.Value is double doubleValue)
                {
                    firebaseParams.Add(new Firebase.Analytics.Parameter(kvp.Key, doubleValue));
                }
                else if (kvp.Value is bool boolValue)
                {
                    firebaseParams.Add(new Firebase.Analytics.Parameter(kvp.Key, boolValue ? 1 : 0));
                }
            }

            return firebaseParams.ToArray();
        }
        #endif

        /// <summary>
        /// Converts parameters to a float value for GameAnalytics.
        /// </summary>
        private static float ConvertParametersToFloat(Dictionary<string, object> parameters)
        {
            // For GameAnalytics, use the first numeric parameter
            foreach (var kvp in parameters.Values)
            {
                if (kvp is int intValue)
                    return intValue;
                if (kvp is float floatValue)
                    return floatValue;
                if (kvp is double doubleValue)
                    return (float)doubleValue;
            }
            return 0f;
        }
        #endregion
    }

    /// <summary>
    /// Custom analytics manager interface (if needed).
    /// </summary>
    public class AnalyticsManager : MonoBehaviour
    {
        private static AnalyticsManager _instance;
        public static AnalyticsManager Instance => _instance;

        private void Awake()
        {
            if (_instance == null)
            {
                _instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        public void LogEvent(string eventName, Dictionary<string, object> parameters)
        {
            // Implement your custom analytics logging here
            Debug.Log($"[Custom Analytics] {eventName}: {string.Join(", ", parameters)}");
        }
    }
}

