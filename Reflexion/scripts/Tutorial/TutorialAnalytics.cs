using System.Collections.Generic;
using UnityEngine;

namespace Reflexion.Tutorial
{
    /// <summary>
    /// Static analytics handler for tutorial events.
    /// Logs tutorial-related analytics to configured analytics services.
    /// </summary>
    public static class TutorialAnalytics
    {
        #region Event Names
        private const string EVENT_TUTORIAL_STARTED = "tutorial_started";
        private const string EVENT_TUTORIAL_STEP_COMPLETED = "tutorial_step_completed";
        private const string EVENT_TUTORIAL_COMPLETED = "tutorial_completed";
        private const string EVENT_TUTORIAL_ABANDONED = "tutorial_abandoned";
        #endregion

        #region Public Methods
        /// <summary>
        /// Logs when the tutorial is started.
        /// </summary>
        public static void LogTutorialStarted()
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>
            {
                { "timestamp", System.DateTime.Now.ToString("o") },
                { "device_type", SystemInfo.deviceType.ToString() },
                { "platform", Application.platform.ToString() }
            };

            LogEvent(EVENT_TUTORIAL_STARTED, parameters);
            Debug.Log("[Analytics] Tutorial Started");
        }

        /// <summary>
        /// Logs when a tutorial step is completed.
        /// </summary>
        /// <param name="stepIndex">The index of the completed step.</param>
        /// <param name="stepName">The name of the completed step.</param>
        public static void LogTutorialStepCompleted(int stepIndex, string stepName)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>
            {
                { "step_index", stepIndex },
                { "step_name", stepName },
                { "timestamp", System.DateTime.Now.ToString("o") }
            };

            LogEvent(EVENT_TUTORIAL_STEP_COMPLETED, parameters);
            Debug.Log($"[Analytics] Tutorial Step Completed: {stepIndex} - {stepName}");
        }

        /// <summary>
        /// Logs when the entire tutorial is completed.
        /// </summary>
        /// <param name="totalSteps">Total number of steps completed.</param>
        public static void LogTutorialCompleted(int totalSteps)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>
            {
                { "total_steps", totalSteps },
                { "completion_time", System.DateTime.Now.ToString("o") }
            };

            LogEvent(EVENT_TUTORIAL_COMPLETED, parameters);
            Debug.Log($"[Analytics] Tutorial Completed: {totalSteps} steps");
        }

        /// <summary>
        /// Logs when the tutorial is abandoned or skipped.
        /// </summary>
        /// <param name="lastStepIndex">The last step reached before abandoning.</param>
        public static void LogTutorialAbandoned(int lastStepIndex)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>
            {
                { "last_step_index", lastStepIndex },
                { "abandon_time", System.DateTime.Now.ToString("o") }
            };

            LogEvent(EVENT_TUTORIAL_ABANDONED, parameters);
            Debug.Log($"[Analytics] Tutorial Abandoned at step: {lastStepIndex}");
        }
        #endregion

        #region Private Methods
        /// <summary>
        /// Logs an event to all configured analytics services.
        /// </summary>
        /// <param name="eventName">The name of the event.</param>
        /// <param name="parameters">Event parameters.</param>
        private static void LogEvent(string eventName, Dictionary<string, object> parameters)
        {
            // Unity Analytics (if available)
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

            // Firebase Analytics (if available)
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

            // GameAnalytics (if available)
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

            // Custom analytics service
            AnalyticsManager.Instance?.LogEvent(eventName, parameters);
        }

        /// <summary>
        /// Converts parameters dictionary to Firebase format.
        /// </summary>
        /// <param name="parameters">Parameters to convert.</param>
        /// <returns>Firebase parameters array.</returns>
        #if FIREBASE_ANALYTICS
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
            }

            return firebaseParams.ToArray();
        }
        #endif

        /// <summary>
        /// Converts parameters to a float value for GameAnalytics.
        /// </summary>
        /// <param name="parameters">Parameters to convert.</param>
        /// <returns>Float value.</returns>
        private static float ConvertParametersToFloat(Dictionary<string, object> parameters)
        {
            // For GameAnalytics, we'll use the first numeric parameter
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
    /// Optional custom analytics manager interface.
    /// Implement this to integrate with custom analytics services.
    /// </summary>
    public class AnalyticsManager : MonoBehaviour
    {
        private static AnalyticsManager _instance;

        /// <summary>
        /// Gets the singleton instance.
        /// </summary>
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

        /// <summary>
        /// Logs an event to custom analytics service.
        /// </summary>
        /// <param name="eventName">Event name.</param>
        /// <param name="parameters">Event parameters.</param>
        public void LogEvent(string eventName, Dictionary<string, object> parameters)
        {
            // Implement your custom analytics logging here
            Debug.Log($"[Custom Analytics] {eventName}: {string.Join(", ", parameters)}");
        }
    }
}

