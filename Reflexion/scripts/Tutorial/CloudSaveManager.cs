using System;
using System.Threading.Tasks;
using UnityEngine;

namespace Reflexion.Tutorial
{
    /// <summary>
    /// Manages cloud synchronization of tutorial and game data.
    /// Handles multi-device tutorial completion syncing.
    /// </summary>
    public class CloudSaveManager : MonoBehaviour
    {
        #region Singleton
        private static CloudSaveManager _instance;

        /// <summary>
        /// Gets the singleton instance of CloudSaveManager.
        /// </summary>
        public static CloudSaveManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindObjectOfType<CloudSaveManager>();
                }
                return _instance;
            }
        }
        #endregion

        #region Serialized Fields
        [Header("Cloud Save Settings")]
        [SerializeField] private bool enableCloudSave = true;
        [SerializeField] private float autoSaveInterval = 300f; // 5 minutes
        [SerializeField] private bool syncOnApplicationStart = true;
        #endregion

        #region Private Fields
        private float _timeSinceLastSave = 0f;
        private bool _isInitialized = false;
        private bool _isSyncing = false;
        #endregion

        #region Events
        public event Action<bool> OnCloudSyncCompleted;
        public event Action<string> OnCloudSyncFailed;
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

            InitializeCloudSave();
        }

        private void Update()
        {
            if (!enableCloudSave || !_isInitialized)
                return;

            _timeSinceLastSave += Time.deltaTime;

            if (_timeSinceLastSave >= autoSaveInterval)
            {
                _timeSinceLastSave = 0f;
                _ = AutoSaveToCloud();
            }
        }

        private async void Start()
        {
            if (syncOnApplicationStart)
            {
                await SyncFromCloud();
            }
        }
        #endregion

        #region Initialization
        /// <summary>
        /// Initializes cloud save services.
        /// </summary>
        private async void InitializeCloudSave()
        {
            if (!enableCloudSave)
            {
                Debug.Log("[CloudSave] Cloud save disabled.");
                return;
            }

            try
            {
                // Initialize PlayFab (if using PlayFab)
                #if PLAYFAB
                await InitializePlayFab();
                #endif

                // Initialize Firebase (if using Firebase)
                #if FIREBASE
                await InitializeFirebase();
                #endif

                // Initialize Unity Cloud Save (if using Unity Gaming Services)
                #if UNITY_CLOUD_SAVE
                await InitializeUnityCloudSave();
                #endif

                _isInitialized = true;
                Debug.Log("[CloudSave] Cloud save initialized successfully.");
            }
            catch (Exception e)
            {
                Debug.LogError($"[CloudSave] Failed to initialize: {e.Message}");
                _isInitialized = false;
            }
        }

        #if PLAYFAB
        /// <summary>
        /// Initializes PlayFab services.
        /// </summary>
        private async Task InitializePlayFab()
        {
            // PlayFab initialization code
            await Task.CompletedTask;
        }
        #endif

        #if FIREBASE
        /// <summary>
        /// Initializes Firebase services.
        /// </summary>
        private async Task InitializeFirebase()
        {
            // Firebase initialization code
            await Task.CompletedTask;
        }
        #endif

        #if UNITY_CLOUD_SAVE
        /// <summary>
        /// Initializes Unity Cloud Save services.
        /// </summary>
        private async Task InitializeUnityCloudSave()
        {
            // Unity Cloud Save initialization code
            await Task.CompletedTask;
        }
        #endif
        #endregion

        #region Public Methods - Tutorial Data
        /// <summary>
        /// Saves tutorial data to cloud storage.
        /// </summary>
        /// <param name="tutorialData">Tutorial save data to upload.</param>
        public async Task<bool> SaveTutorialData(TutorialSaveData tutorialData)
        {
            if (!enableCloudSave || !_isInitialized || _isSyncing)
            {
                return false;
            }

            _isSyncing = true;

            try
            {
                string json = JsonUtility.ToJson(tutorialData);
                bool success = await SaveToCloud("TutorialData", json);
                
                if (success)
                {
                    Debug.Log("[CloudSave] Tutorial data saved successfully.");
                    OnCloudSyncCompleted?.Invoke(true);
                }

                return success;
            }
            catch (Exception e)
            {
                Debug.LogError($"[CloudSave] Failed to save tutorial data: {e.Message}");
                OnCloudSyncFailed?.Invoke(e.Message);
                return false;
            }
            finally
            {
                _isSyncing = false;
            }
        }

        /// <summary>
        /// Loads tutorial data from cloud storage.
        /// </summary>
        /// <returns>Tutorial save data or null if not found.</returns>
        public TutorialSaveData LoadTutorialData()
        {
            if (!enableCloudSave || !_isInitialized)
            {
                return null;
            }

            try
            {
                string json = LoadFromCloud("TutorialData");
                
                if (string.IsNullOrEmpty(json))
                {
                    return null;
                }

                TutorialSaveData data = JsonUtility.FromJson<TutorialSaveData>(json);
                Debug.Log("[CloudSave] Tutorial data loaded successfully.");
                return data;
            }
            catch (Exception e)
            {
                Debug.LogError($"[CloudSave] Failed to load tutorial data: {e.Message}");
                return null;
            }
        }
        #endregion

        #region Private Methods - Cloud Operations
        /// <summary>
        /// Saves data to cloud with specified key.
        /// </summary>
        /// <param name="key">Storage key.</param>
        /// <param name="data">JSON data to save.</param>
        /// <returns>True if successful.</returns>
        private async Task<bool> SaveToCloud(string key, string data)
        {
            // Default implementation using PlayerPrefs as fallback
            // Replace with actual cloud save implementation
            
            #if PLAYFAB
            return await SaveToPlayFab(key, data);
            #elif FIREBASE
            return await SaveToFirebase(key, data);
            #elif UNITY_CLOUD_SAVE
            return await SaveToUnityCloudSave(key, data);
            #else
            // Fallback to PlayerPrefs
            PlayerPrefs.SetString($"Cloud_{key}", data);
            PlayerPrefs.Save();
            await Task.CompletedTask;
            return true;
            #endif
        }

        /// <summary>
        /// Loads data from cloud with specified key.
        /// </summary>
        /// <param name="key">Storage key.</param>
        /// <returns>JSON data or null.</returns>
        private string LoadFromCloud(string key)
        {
            #if PLAYFAB
            return LoadFromPlayFab(key);
            #elif FIREBASE
            return LoadFromFirebase(key);
            #elif UNITY_CLOUD_SAVE
            return LoadFromUnityCloudSave(key);
            #else
            // Fallback to PlayerPrefs
            return PlayerPrefs.GetString($"Cloud_{key}", null);
            #endif
        }

        #if PLAYFAB
        /// <summary>
        /// Saves data to PlayFab.
        /// </summary>
        private async Task<bool> SaveToPlayFab(string key, string data)
        {
            // PlayFab save implementation
            await Task.CompletedTask;
            return true;
        }

        /// <summary>
        /// Loads data from PlayFab.
        /// </summary>
        private string LoadFromPlayFab(string key)
        {
            // PlayFab load implementation
            return null;
        }
        #endif

        #if FIREBASE
        /// <summary>
        /// Saves data to Firebase.
        /// </summary>
        private async Task<bool> SaveToFirebase(string key, string data)
        {
            // Firebase save implementation
            await Task.CompletedTask;
            return true;
        }

        /// <summary>
        /// Loads data from Firebase.
        /// </summary>
        private string LoadFromFirebase(string key)
        {
            // Firebase load implementation
            return null;
        }
        #endif

        #if UNITY_CLOUD_SAVE
        /// <summary>
        /// Saves data to Unity Cloud Save.
        /// </summary>
        private async Task<bool> SaveToUnityCloudSave(string key, string data)
        {
            // Unity Cloud Save implementation
            await Task.CompletedTask;
            return true;
        }

        /// <summary>
        /// Loads data from Unity Cloud Save.
        /// </summary>
        private string LoadFromUnityCloudSave(string key)
        {
            // Unity Cloud Save load implementation
            return null;
        }
        #endif

        /// <summary>
        /// Automatically saves current game state to cloud.
        /// </summary>
        private async Task AutoSaveToCloud()
        {
            if (_isSyncing)
                return;

            try
            {
                // Save tutorial data if tutorial manager exists
                if (TutorialManager.Instance != null)
                {
                    var saveData = new TutorialSaveData
                    {
                        isCompleted = TutorialManager.Instance.IsTutorialCompleted,
                        lastCompletedStep = TutorialManager.Instance.CurrentStepIndex - 1
                    };

                    await SaveTutorialData(saveData);
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[CloudSave] Auto-save failed: {e.Message}");
            }
        }

        /// <summary>
        /// Syncs data from cloud to local storage.
        /// </summary>
        private async Task SyncFromCloud()
        {
            if (!enableCloudSave || !_isInitialized || _isSyncing)
            {
                return;
            }

            _isSyncing = true;

            try
            {
                Debug.Log("[CloudSave] Syncing from cloud...");
                
                // Load tutorial data
                TutorialSaveData cloudData = LoadTutorialData();
                
                if (cloudData != null)
                {
                    // Compare with local data and use most recent
                    string localJson = PlayerPrefs.GetString("TutorialSaveData", null);
                    
                    if (!string.IsNullOrEmpty(localJson))
                    {
                        TutorialSaveData localData = JsonUtility.FromJson<TutorialSaveData>(localJson);
                        
                        // Use cloud data if it's more recent or more complete
                        if (ShouldUseCloudData(localData, cloudData))
                        {
                            string json = JsonUtility.ToJson(cloudData);
                            PlayerPrefs.SetString("TutorialSaveData", json);
                            PlayerPrefs.Save();
                            Debug.Log("[CloudSave] Local data updated from cloud.");
                        }
                    }
                    else
                    {
                        // No local data, use cloud data
                        string json = JsonUtility.ToJson(cloudData);
                        PlayerPrefs.SetString("TutorialSaveData", json);
                        PlayerPrefs.Save();
                        Debug.Log("[CloudSave] Local data created from cloud.");
                    }
                }

                OnCloudSyncCompleted?.Invoke(true);
            }
            catch (Exception e)
            {
                Debug.LogError($"[CloudSave] Sync failed: {e.Message}");
                OnCloudSyncFailed?.Invoke(e.Message);
            }
            finally
            {
                _isSyncing = false;
            }

            await Task.CompletedTask;
        }

        /// <summary>
        /// Determines whether to use cloud data over local data.
        /// </summary>
        /// <param name="localData">Local save data.</param>
        /// <param name="cloudData">Cloud save data.</param>
        /// <returns>True if cloud data should be used.</returns>
        private bool ShouldUseCloudData(TutorialSaveData localData, TutorialSaveData cloudData)
        {
            // Use cloud data if it's completed and local isn't
            if (cloudData.isCompleted && !localData.isCompleted)
            {
                return true;
            }

            // Use cloud data if it has more progress
            if (cloudData.lastCompletedStep > localData.lastCompletedStep)
            {
                return true;
            }

            // Use cloud data if it's more recent
            if (!string.IsNullOrEmpty(cloudData.lastPlayedDate) && 
                !string.IsNullOrEmpty(localData.lastPlayedDate))
            {
                DateTime cloudDate = DateTime.Parse(cloudData.lastPlayedDate);
                DateTime localDate = DateTime.Parse(localData.lastPlayedDate);
                
                return cloudDate > localDate;
            }

            return false;
        }
        #endregion

        #region Public Utility Methods
        /// <summary>
        /// Forces an immediate sync with cloud.
        /// </summary>
        public async Task<bool> ForceSyncNow()
        {
            await SyncFromCloud();
            return _isInitialized;
        }

        /// <summary>
        /// Checks if cloud save is available and initialized.
        /// </summary>
        /// <returns>True if cloud save is ready.</returns>
        public bool IsCloudSaveReady()
        {
            return enableCloudSave && _isInitialized;
        }
        #endregion
    }
}

