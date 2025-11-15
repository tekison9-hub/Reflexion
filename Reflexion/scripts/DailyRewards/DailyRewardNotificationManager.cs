using System;
using UnityEngine;

#if UNITY_IOS
using Unity.Notifications.iOS;
#endif

#if UNITY_ANDROID
using Unity.Notifications.Android;
#endif

namespace Reflexion.DailyRewards
{
    /// <summary>
    /// Manages push notifications for daily rewards.
    /// Schedules daily reminders at user's preferred time.
    /// </summary>
    public class DailyRewardNotificationManager : MonoBehaviour
    {
        #region Singleton
        private static DailyRewardNotificationManager _instance;

        public static DailyRewardNotificationManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    GameObject go = new GameObject("DailyRewardNotificationManager");
                    _instance = go.AddComponent<DailyRewardNotificationManager>();
                    DontDestroyOnLoad(go);
                }
                return _instance;
            }
        }
        #endregion

        #region Configuration
        [SerializeField] private bool enableNotifications = true;
        [SerializeField] private int defaultNotificationHour = 9; // 9 AM
        [SerializeField] private int defaultNotificationMinute = 0;
        
        private const string NOTIFICATION_CHANNEL_ID = "daily_rewards";
        private const string NOTIFICATION_CHANNEL_NAME = "Daily Rewards";
        private const string NOTIFICATION_CHANNEL_DESC = "Reminders for daily reward claims";
        #endregion

        #region Private Fields
        private bool _isInitialized = false;
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
        }

        private void Start()
        {
            InitializeNotifications();
        }
        #endregion

        #region Initialization
        /// <summary>
        /// Initializes notification system for the current platform.
        /// </summary>
        private void InitializeNotifications()
        {
            if (!enableNotifications)
            {
                Debug.Log("[Notifications] Notifications disabled");
                return;
            }

            #if UNITY_ANDROID
            InitializeAndroid();
            #elif UNITY_IOS
            InitializeIOS();
            #else
            Debug.LogWarning("[Notifications] Platform not supported for notifications");
            #endif

            _isInitialized = true;
        }

        #if UNITY_ANDROID
        /// <summary>
        /// Initializes Android notification channel.
        /// </summary>
        private void InitializeAndroid()
        {
            var channel = new AndroidNotificationChannel
            {
                Id = NOTIFICATION_CHANNEL_ID,
                Name = NOTIFICATION_CHANNEL_NAME,
                Importance = Importance.Default,
                Description = NOTIFICATION_CHANNEL_DESC
            };

            AndroidNotificationCenter.RegisterNotificationChannel(channel);
            Debug.Log("[Notifications] Android channel registered");
        }
        #endif

        #if UNITY_IOS
        /// <summary>
        /// Initializes iOS notification authorization.
        /// </summary>
        private async void InitializeIOS()
        {
            var authorizationOption = AuthorizationOption.Alert | AuthorizationOption.Badge;
            
            using (var req = new AuthorizationRequest(authorizationOption, true))
            {
                while (!req.IsFinished)
                {
                    await System.Threading.Tasks.Task.Yield();
                }

                if (req.Granted)
                {
                    Debug.Log("[Notifications] iOS authorization granted");
                }
                else
                {
                    Debug.Log("[Notifications] iOS authorization denied");
                }
            }
        }
        #endif
        #endregion

        #region Public Methods
        /// <summary>
        /// Schedules a daily reward reminder notification.
        /// </summary>
        /// <param name="hour">Hour of day (0-23).</param>
        /// <param name="minute">Minute of hour (0-59).</param>
        public void ScheduleDailyReminder(int hour = -1, int minute = -1)
        {
            if (!_isInitialized || !enableNotifications)
            {
                return;
            }

            // Use default time if not specified
            if (hour < 0) hour = defaultNotificationHour;
            if (minute < 0) minute = defaultNotificationMinute;

            // Cancel existing notifications
            CancelAllNotifications();

            // Calculate next notification time
            DateTime now = DateTime.Now;
            DateTime nextNotification = new DateTime(now.Year, now.Month, now.Day, hour, minute, 0);

            // If time has passed today, schedule for tomorrow
            if (nextNotification <= now)
            {
                nextNotification = nextNotification.AddDays(1);
            }

            TimeSpan timeUntilNotification = nextNotification - now;

            #if UNITY_ANDROID
            ScheduleAndroidNotification(timeUntilNotification);
            #elif UNITY_IOS
            ScheduleIOSNotification(timeUntilNotification);
            #endif

            SaveNotificationPreferences(hour, minute);

            Debug.Log($"[Notifications] Scheduled daily reminder for {nextNotification:HH:mm}");
        }

        /// <summary>
        /// Cancels all scheduled notifications.
        /// </summary>
        public void CancelAllNotifications()
        {
            #if UNITY_ANDROID
            AndroidNotificationCenter.CancelAllScheduledNotifications();
            AndroidNotificationCenter.CancelAllDisplayedNotifications();
            #elif UNITY_IOS
            iOSNotificationCenter.RemoveAllScheduledNotifications();
            iOSNotificationCenter.RemoveAllDeliveredNotifications();
            #endif

            Debug.Log("[Notifications] All notifications cancelled");
        }

        /// <summary>
        /// Enables or disables notifications.
        /// </summary>
        public void SetNotificationsEnabled(bool enabled)
        {
            enableNotifications = enabled;
            PlayerPrefs.SetInt("NotificationsEnabled", enabled ? 1 : 0);
            PlayerPrefs.Save();

            if (!enabled)
            {
                CancelAllNotifications();
            }
            else if (_isInitialized)
            {
                ScheduleDailyReminder();
            }
        }
        #endregion

        #region Platform-Specific Scheduling
        #if UNITY_ANDROID
        /// <summary>
        /// Schedules notification on Android.
        /// </summary>
        private void ScheduleAndroidNotification(TimeSpan delay)
        {
            var notification = new AndroidNotification
            {
                Title = "Daily Reward Available! 🎁",
                Text = "Claim your daily reward and keep your streak going!",
                SmallIcon = "icon_small",
                LargeIcon = "icon_large",
                FireTime = DateTime.Now.Add(delay),
                RepeatInterval = new TimeSpan(24, 0, 0) // Repeat daily
            };

            AndroidNotificationCenter.SendNotificationWithExplicitID(notification, 
                NOTIFICATION_CHANNEL_ID, 1001);
        }
        #endif

        #if UNITY_IOS
        /// <summary>
        /// Schedules notification on iOS.
        /// </summary>
        private void ScheduleIOSNotification(TimeSpan delay)
        {
            var timeTrigger = new iOSNotificationTimeIntervalTrigger
            {
                TimeInterval = delay,
                Repeats = true
            };

            var notification = new iOSNotification
            {
                Identifier = "daily_reward_reminder",
                Title = "Daily Reward Available! 🎁",
                Body = "Claim your daily reward and keep your streak going!",
                Subtitle = "Reflexion",
                ShowInForeground = true,
                ForegroundPresentationOption = 
                    PresentationOption.Alert | PresentationOption.Sound,
                CategoryIdentifier = "daily_rewards",
                ThreadIdentifier = "daily_rewards",
                Trigger = timeTrigger
            };

            iOSNotificationCenter.ScheduleNotification(notification);
        }
        #endif
        #endregion

        #region Preferences
        /// <summary>
        /// Saves notification preferences.
        /// </summary>
        private void SaveNotificationPreferences(int hour, int minute)
        {
            PlayerPrefs.SetInt("NotificationHour", hour);
            PlayerPrefs.SetInt("NotificationMinute", minute);
            PlayerPrefs.Save();
        }

        /// <summary>
        /// Loads notification preferences.
        /// </summary>
        public void LoadNotificationPreferences()
        {
            bool enabled = PlayerPrefs.GetInt("NotificationsEnabled", 1) == 1;
            int hour = PlayerPrefs.GetInt("NotificationHour", defaultNotificationHour);
            int minute = PlayerPrefs.GetInt("NotificationMinute", defaultNotificationMinute);

            enableNotifications = enabled;

            if (enabled && _isInitialized)
            {
                ScheduleDailyReminder(hour, minute);
            }
        }
        #endregion

        #region Public API
        /// <summary>
        /// Gets whether notifications are enabled.
        /// </summary>
        public bool AreNotificationsEnabled()
        {
            return enableNotifications;
        }

        /// <summary>
        /// Gets the scheduled notification time.
        /// </summary>
        public (int hour, int minute) GetScheduledTime()
        {
            int hour = PlayerPrefs.GetInt("NotificationHour", defaultNotificationHour);
            int minute = PlayerPrefs.GetInt("NotificationMinute", defaultNotificationMinute);
            return (hour, minute);
        }
        #endregion
    }
}

