using System;
using System.Threading.Tasks;
using UnityEngine;

namespace Reflexion.DailyRewards
{
    /// <summary>
    /// Handles server-side validation for daily rewards to prevent client-side manipulation.
    /// Integrates with Firebase Functions or custom backend.
    /// </summary>
    public static class DailyRewardServerValidator
    {
        #region Configuration
        private const string FIREBASE_FUNCTION_URL = "https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net";
        private const string VALIDATE_CLAIM_ENDPOINT = "/validateDailyRewardClaim";
        private const string SYNC_DATA_ENDPOINT = "/syncDailyRewardData";
        #endregion

        #region Public Methods
        /// <summary>
        /// Validates a claim attempt with the server.
        /// </summary>
        /// <param name="day">Day number being claimed.</param>
        /// <param name="saveData">Current save data.</param>
        /// <returns>True if server approves the claim.</returns>
        public static async Task<bool> ValidateClaim(int day, DailyRewardSaveData saveData)
        {
            #if FIREBASE
            return await ValidateClaimWithFirebase(day, saveData);
            #elif CUSTOM_BACKEND
            return await ValidateClaimWithCustomBackend(day, saveData);
            #else
            // No server validation configured - allow claim
            await Task.Delay(100); // Simulate network delay
            return true;
            #endif
        }

        /// <summary>
        /// Syncs save data with the server.
        /// </summary>
        /// <param name="saveData">Current save data to sync.</param>
        /// <returns>True if sync successful.</returns>
        public static async Task<bool> SyncData(DailyRewardSaveData saveData)
        {
            #if FIREBASE
            return await SyncDataWithFirebase(saveData);
            #elif CUSTOM_BACKEND
            return await SyncDataWithCustomBackend(saveData);
            #else
            // No server sync configured
            await Task.Delay(100);
            return true;
            #endif
        }
        #endregion

        #region Firebase Implementation
        #if FIREBASE
        /// <summary>
        /// Validates claim with Firebase Functions.
        /// </summary>
        private static async Task<bool> ValidateClaimWithFirebase(int day, DailyRewardSaveData saveData)
        {
            try
            {
                // Get user ID
                string userId = Firebase.Auth.FirebaseAuth.DefaultInstance.CurrentUser?.UserId;
                if (string.IsNullOrEmpty(userId))
                {
                    Debug.LogWarning("[ServerValidator] No authenticated user");
                    return false;
                }

                // Prepare request data
                var requestData = new
                {
                    userId = userId,
                    dayNumber = day,
                    currentStreak = saveData.currentStreak,
                    lastClaimTimestamp = saveData.lastClaimTimestamp,
                    serverTimestamp = ServerTimeManager.Instance.GetServerTimestamp()
                };

                // Call Firebase Function
                var callable = Firebase.Functions.FirebaseFunctions.DefaultInstance
                    .GetHttpsCallable("validateDailyRewardClaim");
                
                var result = await callable.CallAsync(requestData);
                
                // Parse response
                var response = result.Data as System.Collections.IDictionary;
                if (response != null && response.Contains("valid"))
                {
                    return (bool)response["valid"];
                }

                return false;
            }
            catch (Exception e)
            {
                Debug.LogError($"[ServerValidator] Firebase validation failed: {e.Message}");
                // On error, allow claim (don't punish user for server issues)
                return true;
            }
        }

        /// <summary>
        /// Syncs data with Firebase Firestore.
        /// </summary>
        private static async Task<bool> SyncDataWithFirebase(DailyRewardSaveData saveData)
        {
            try
            {
                string userId = Firebase.Auth.FirebaseAuth.DefaultInstance.CurrentUser?.UserId;
                if (string.IsNullOrEmpty(userId))
                {
                    return false;
                }

                var db = Firebase.Firestore.FirebaseFirestore.DefaultInstance;
                var docRef = db.Collection("dailyRewards").Document(userId);

                var data = new System.Collections.Generic.Dictionary<string, object>
                {
                    { "currentDay", saveData.currentDay },
                    { "currentStreak", saveData.currentStreak },
                    { "lastClaimDate", saveData.lastClaimDate },
                    { "lastClaimTimestamp", saveData.lastClaimTimestamp },
                    { "totalClaimCount", saveData.totalClaimCount },
                    { "lastUpdated", Firebase.Firestore.FieldValue.ServerTimestamp }
                };

                await docRef.SetAsync(data, Firebase.Firestore.SetOptions.MergeAll);
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"[ServerValidator] Firebase sync failed: {e.Message}");
                return false;
            }
        }
        #endif
        #endregion

        #region Custom Backend Implementation
        #if CUSTOM_BACKEND
        /// <summary>
        /// Validates claim with custom backend.
        /// </summary>
        private static async Task<bool> ValidateClaimWithCustomBackend(int day, DailyRewardSaveData saveData)
        {
            try
            {
                // Implement your custom backend validation
                string endpoint = $"{YOUR_BACKEND_URL}/api/daily-rewards/validate";
                
                // Create JSON request
                string jsonData = JsonUtility.ToJson(new
                {
                    userId = GetUserId(),
                    dayNumber = day,
                    saveData = saveData
                });

                // Send HTTP request
                using (UnityEngine.Networking.UnityWebRequest request = 
                    new UnityEngine.Networking.UnityWebRequest(endpoint, "POST"))
                {
                    byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
                    request.uploadHandler = new UnityEngine.Networking.UploadHandlerRaw(bodyRaw);
                    request.downloadHandler = new UnityEngine.Networking.DownloadHandlerBuffer();
                    request.SetRequestHeader("Content-Type", "application/json");

                    var operation = request.SendWebRequest();
                    
                    while (!operation.isDone)
                    {
                        await Task.Yield();
                    }

                    if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                    {
                        string responseText = request.downloadHandler.text;
                        var response = JsonUtility.FromJson<ValidationResponse>(responseText);
                        return response.valid;
                    }

                    return false;
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[ServerValidator] Custom backend validation failed: {e.Message}");
                return true; // Allow on error
            }
        }

        /// <summary>
        /// Syncs data with custom backend.
        /// </summary>
        private static async Task<bool> SyncDataWithCustomBackend(DailyRewardSaveData saveData)
        {
            // Implement your custom backend sync
            await Task.Delay(100);
            return true;
        }

        [Serializable]
        private class ValidationResponse
        {
            public bool valid;
            public string message;
        }
        #endif
        #endregion

        #region Helper Methods
        /// <summary>
        /// Gets the current user's ID.
        /// </summary>
        private static string GetUserId()
        {
            // Integrate with your authentication system
            return SystemInfo.deviceUniqueIdentifier;
        }
        #endregion
    }

    /// <summary>
    /// Manages server time to prevent timezone exploits.
    /// </summary>
    public class ServerTimeManager : MonoBehaviour
    {
        private static ServerTimeManager _instance;
        public static ServerTimeManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    GameObject go = new GameObject("ServerTimeManager");
                    _instance = go.AddComponent<ServerTimeManager>();
                    DontDestroyOnLoad(go);
                }
                return _instance;
            }
        }

        private DateTime _serverTime;
        private DateTime _lastSyncTime;
        private bool _isTimeSynced = false;

        /// <summary>
        /// Gets the current server time (UTC).
        /// </summary>
        public async Task<DateTime> GetServerTime()
        {
            if (!_isTimeSynced || (DateTime.UtcNow - _lastSyncTime).TotalHours > 1)
            {
                await SyncServerTime();
            }

            // Calculate current time based on last sync + elapsed time
            TimeSpan elapsed = DateTime.UtcNow - _lastSyncTime;
            return _serverTime.Add(elapsed);
        }

        /// <summary>
        /// Gets the current server timestamp in seconds.
        /// </summary>
        public long GetServerTimestamp()
        {
            DateTime serverTime = GetServerTime().Result;
            return new DateTimeOffset(serverTime).ToUnixTimeSeconds();
        }

        /// <summary>
        /// Syncs time with server.
        /// </summary>
        private async Task SyncServerTime()
        {
            try
            {
                #if FIREBASE
                // Use Firebase server timestamp
                var db = Firebase.Firestore.FirebaseFirestore.DefaultInstance;
                var docRef = db.Collection("system").Document("time");
                var snapshot = await docRef.GetSnapshotAsync();
                
                if (snapshot.Exists && snapshot.ContainsField("serverTime"))
                {
                    var timestamp = snapshot.GetValue<Firebase.Firestore.Timestamp>("serverTime");
                    _serverTime = timestamp.ToDateTime();
                    _lastSyncTime = DateTime.UtcNow;
                    _isTimeSynced = true;
                    return;
                }
                #endif

                // Fallback: Use worldtimeapi.org
                await SyncWithWorldTimeAPI();
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[ServerTime] Sync failed: {e.Message}. Using local time.");
                _serverTime = DateTime.UtcNow;
                _lastSyncTime = DateTime.UtcNow;
                _isTimeSynced = false;
            }
        }

        /// <summary>
        /// Syncs with worldtimeapi.org as fallback.
        /// </summary>
        private async Task SyncWithWorldTimeAPI()
        {
            using (UnityEngine.Networking.UnityWebRequest request =
                UnityEngine.Networking.UnityWebRequest.Get("https://worldtimeapi.org/api/timezone/Etc/UTC"))
            {
                var operation = request.SendWebRequest();

                while (!operation.isDone)
                {
                    await Task.Yield();
                }

                if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    string json = request.downloadHandler.text;
                    var response = JsonUtility.FromJson<WorldTimeResponse>(json);
                    
                    if (DateTime.TryParse(response.utc_datetime, out DateTime serverTime))
                    {
                        _serverTime = serverTime;
                        _lastSyncTime = DateTime.UtcNow;
                        _isTimeSynced = true;
                    }
                }
            }
        }

        [Serializable]
        private class WorldTimeResponse
        {
            public string utc_datetime;
        }
    }
}

