using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

namespace Reflexion.Tutorial
{
    /// <summary>
    /// Singleton manager that controls the tutorial flow and state machine.
    /// Handles tutorial progression, persistence, and integration with game systems.
    /// </summary>
    public class TutorialManager : MonoBehaviour
    {
        #region Singleton
        private static TutorialManager _instance;
        
        /// <summary>
        /// Gets the singleton instance of TutorialManager.
        /// </summary>
        public static TutorialManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindObjectOfType<TutorialManager>();
                    if (_instance == null)
                    {
                        GameObject go = new GameObject("TutorialManager");
                        _instance = go.AddComponent<TutorialManager>();
                        DontDestroyOnLoad(go);
                    }
                }
                return _instance;
            }
        }
        #endregion

        #region Serialized Fields
        [Header("Tutorial Configuration")]
        [SerializeField] private TutorialStep[] tutorialSteps;
        [SerializeField] private float skipHoldDuration = 2f;
        
        [Header("UI References")]
        [SerializeField] private TutorialUIController uiController;
        [SerializeField] private GameObject tutorialCanvas;
        
        [Header("Rewards")]
        [SerializeField] private int completionRewardCoins = 100;
        [SerializeField] private string completionMessage = "You're ready!";
        
        [Header("Accessibility")]
        [SerializeField] private bool enableScreenReader = true;
        [SerializeField] private bool highContrastMode = false;
        #endregion

        #region Private Fields
        private TutorialState _currentState = TutorialState.NotStarted;
        private int _currentStepIndex = 0;
        private float _skipHoldTime = 0f;
        private bool _isSkipping = false;
        private TutorialSaveData _saveData;
        private Coroutine _currentStepCoroutine;
        #endregion

        #region Events
        /// <summary>
        /// Invoked when tutorial state changes.
        /// </summary>
        public UnityEvent<TutorialState> OnStateChanged;
        
        /// <summary>
        /// Invoked when a tutorial step is completed.
        /// </summary>
        public UnityEvent<int> OnStepCompleted;
        
        /// <summary>
        /// Invoked when the entire tutorial is completed.
        /// </summary>
        public UnityEvent OnTutorialCompleted;
        
        /// <summary>
        /// Invoked when tutorial is skipped.
        /// </summary>
        public UnityEvent OnTutorialSkipped;
        #endregion

        #region Properties
        /// <summary>
        /// Gets the current tutorial state.
        /// </summary>
        public TutorialState CurrentState => _currentState;
        
        /// <summary>
        /// Gets the current step index.
        /// </summary>
        public int CurrentStepIndex => _currentStepIndex;
        
        /// <summary>
        /// Gets whether the tutorial has been completed.
        /// </summary>
        public bool IsTutorialCompleted => _saveData != null && _saveData.isCompleted;
        
        /// <summary>
        /// Gets whether the tutorial is currently active.
        /// </summary>
        public bool IsTutorialActive => _currentState == TutorialState.InProgress;
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
            
            InitializeTutorial();
        }

        private void Update()
        {
            if (_currentState == TutorialState.InProgress && !IsFirstTimePlaying())
            {
                HandleSkipInput();
            }
        }

        private void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus && _currentState == TutorialState.InProgress)
            {
                // Save current progress when app is paused
                SaveTutorialProgress();
            }
        }

        private void OnApplicationQuit()
        {
            if (_currentState == TutorialState.InProgress)
            {
                SaveTutorialProgress();
            }
        }
        #endregion

        #region Initialization
        /// <summary>
        /// Initializes the tutorial system and loads saved progress.
        /// </summary>
        private void InitializeTutorial()
        {
            LoadTutorialProgress();
            
            if (tutorialSteps == null || tutorialSteps.Length == 0)
            {
                InitializeDefaultSteps();
            }
            
            if (uiController == null)
            {
                uiController = FindObjectOfType<TutorialUIController>();
            }
            
            OnStateChanged ??= new UnityEvent<TutorialState>();
            OnStepCompleted ??= new UnityEvent<int>();
            OnTutorialCompleted ??= new UnityEvent();
            OnTutorialSkipped ??= new UnityEvent();
        }

        /// <summary>
        /// Initializes default tutorial steps if none are configured.
        /// </summary>
        private void InitializeDefaultSteps()
        {
            tutorialSteps = new TutorialStep[]
            {
                new TutorialStep
                {
                    stepName = "Step 1: First Tap",
                    instruction = "Tap the glowing target",
                    targetCount = 1,
                    targetSpeed = 0.5f,
                    hitAreaMultiplier = 1.5f,
                    showComboMeter = false,
                    showLivesSystem = false
                },
                new TutorialStep
                {
                    stepName = "Step 2: Build Combo",
                    instruction = "Keep tapping to build combo",
                    targetCount = 3,
                    targetSpeed = 1f,
                    hitAreaMultiplier = 1.2f,
                    showComboMeter = true,
                    showLivesSystem = false
                },
                new TutorialStep
                {
                    stepName = "Step 3: Life System",
                    instruction = "Don't miss or you lose a life!",
                    targetCount = 5,
                    targetSpeed = 1.2f,
                    hitAreaMultiplier = 1f,
                    showComboMeter = true,
                    showLivesSystem = true
                }
            };
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// Starts the tutorial from the beginning or resumes from saved progress.
        /// </summary>
        public async void StartTutorial()
        {
            if (IsTutorialCompleted && !IsFirstTimePlaying())
            {
                Debug.Log("Tutorial already completed. Skipping.");
                return;
            }

            SetState(TutorialState.InProgress);
            TutorialAnalytics.LogTutorialStarted();
            
            if (tutorialCanvas != null)
            {
                tutorialCanvas.SetActive(true);
            }

            if (uiController != null)
            {
                await uiController.ShowTutorialOverlay();
            }

            // Resume from saved step if available
            if (_saveData != null && _saveData.lastCompletedStep >= 0)
            {
                _currentStepIndex = _saveData.lastCompletedStep + 1;
            }
            else
            {
                _currentStepIndex = 0;
            }

            StartCurrentStep();
        }

        /// <summary>
        /// Advances to the next tutorial step.
        /// </summary>
        public void NextStep()
        {
            if (_currentStepCoroutine != null)
            {
                StopCoroutine(_currentStepCoroutine);
            }

            _currentStepIndex++;
            
            if (_currentStepIndex >= tutorialSteps.Length)
            {
                CompleteTutorial();
            }
            else
            {
                StartCurrentStep();
            }
        }

        /// <summary>
        /// Marks the current step as completed and advances.
        /// </summary>
        /// <param name="stepIndex">The index of the completed step.</param>
        public void CompleteStep(int stepIndex)
        {
            if (stepIndex != _currentStepIndex)
            {
                Debug.LogWarning($"Step index mismatch: Expected {_currentStepIndex}, got {stepIndex}");
                return;
            }

            TutorialAnalytics.LogTutorialStepCompleted(stepIndex, tutorialSteps[stepIndex].stepName);
            OnStepCompleted?.Invoke(stepIndex);
            
            SaveTutorialProgress();
            NextStep();
        }

        /// <summary>
        /// Completes the tutorial and shows reward screen.
        /// </summary>
        public async void CompleteTutorial()
        {
            SetState(TutorialState.Completed);
            
            _saveData.isCompleted = true;
            _saveData.completionDate = DateTime.Now.ToString("o");
            SaveTutorialProgress();
            
            TutorialAnalytics.LogTutorialCompleted(tutorialSteps.Length);
            
            if (uiController != null)
            {
                await uiController.ShowCompletionReward(completionRewardCoins, completionMessage);
            }
            
            OnTutorialCompleted?.Invoke();
            
            // Award coins to player
            GameManager.Instance?.AddCoins(completionRewardCoins);
            
            EndTutorial();
        }

        /// <summary>
        /// Requests to skip the tutorial (requires confirmation).
        /// </summary>
        public void RequestSkipTutorial()
        {
            if (IsFirstTimePlaying())
            {
                Debug.Log("Cannot skip tutorial on first playthrough.");
                return;
            }

            if (uiController != null)
            {
                uiController.ShowSkipConfirmation(ConfirmSkipTutorial, CancelSkipTutorial);
            }
        }

        /// <summary>
        /// Resets tutorial progress (for testing or settings reset).
        /// </summary>
        public void ResetTutorial()
        {
            _saveData = new TutorialSaveData
            {
                isCompleted = false,
                lastCompletedStep = -1
            };
            
            SaveTutorialProgress();
            SetState(TutorialState.NotStarted);
            _currentStepIndex = 0;
            
            Debug.Log("Tutorial progress reset.");
        }

        /// <summary>
        /// Gets the current tutorial step data.
        /// </summary>
        /// <returns>Current TutorialStep or null if invalid.</returns>
        public TutorialStep GetCurrentStep()
        {
            if (_currentStepIndex >= 0 && _currentStepIndex < tutorialSteps.Length)
            {
                return tutorialSteps[_currentStepIndex];
            }
            return null;
        }
        #endregion

        #region Private Methods
        /// <summary>
        /// Starts the current tutorial step.
        /// </summary>
        private void StartCurrentStep()
        {
            if (_currentStepIndex >= tutorialSteps.Length)
            {
                CompleteTutorial();
                return;
            }

            TutorialStep step = tutorialSteps[_currentStepIndex];
            _currentStepCoroutine = StartCoroutine(ExecuteStep(step));
        }

        /// <summary>
        /// Executes a tutorial step coroutine.
        /// </summary>
        /// <param name="step">The step to execute.</param>
        private IEnumerator ExecuteStep(TutorialStep step)
        {
            if (uiController != null)
            {
                yield return uiController.ShowStepInstruction(step.instruction);
                yield return uiController.SetupStepUI(step);
            }

            // Announce for screen readers
            if (enableScreenReader)
            {
                AccessibilityManager.Instance?.Announce(step.instruction);
            }

            // Wait for step completion (handled by game logic calling CompleteStep)
            yield return null;
        }

        /// <summary>
        /// Handles skip input (hold for 2 seconds).
        /// </summary>
        private void HandleSkipInput()
        {
            // Using Unity's new Input System
            if (UnityEngine.InputSystem.Keyboard.current != null && 
                UnityEngine.InputSystem.Keyboard.current.escapeKey.isPressed)
            {
                _skipHoldTime += Time.deltaTime;
                
                if (!_isSkipping)
                {
                    _isSkipping = true;
                    uiController?.ShowSkipHoldIndicator(true);
                }

                if (uiController != null)
                {
                    uiController.UpdateSkipHoldProgress(_skipHoldTime / skipHoldDuration);
                }

                if (_skipHoldTime >= skipHoldDuration)
                {
                    RequestSkipTutorial();
                    _skipHoldTime = 0f;
                    _isSkipping = false;
                }
            }
            else if (_isSkipping)
            {
                // Reset if button released
                _skipHoldTime = 0f;
                _isSkipping = false;
                uiController?.ShowSkipHoldIndicator(false);
            }
        }

        /// <summary>
        /// Confirms skipping the tutorial.
        /// </summary>
        private void ConfirmSkipTutorial()
        {
            TutorialAnalytics.LogTutorialAbandoned(_currentStepIndex);
            OnTutorialSkipped?.Invoke();
            
            // Mark as completed to prevent showing again
            _saveData.isCompleted = true;
            _saveData.wasSkipped = true;
            SaveTutorialProgress();
            
            EndTutorial();
        }

        /// <summary>
        /// Cancels the skip request.
        /// </summary>
        private void CancelSkipTutorial()
        {
            Debug.Log("Skip cancelled, continuing tutorial.");
        }

        /// <summary>
        /// Ends the tutorial and returns to game.
        /// </summary>
        private void EndTutorial()
        {
            SetState(TutorialState.NotStarted);
            
            if (_currentStepCoroutine != null)
            {
                StopCoroutine(_currentStepCoroutine);
                _currentStepCoroutine = null;
            }

            if (uiController != null)
            {
                uiController.HideTutorialOverlay();
            }

            if (tutorialCanvas != null)
            {
                tutorialCanvas.SetActive(false);
            }

            // Transition to main game
            GameManager.Instance?.StartGame();
        }

        /// <summary>
        /// Sets the tutorial state and invokes state change event.
        /// </summary>
        /// <param name="newState">The new state.</param>
        private void SetState(TutorialState newState)
        {
            if (_currentState != newState)
            {
                _currentState = newState;
                OnStateChanged?.Invoke(newState);
            }
        }

        /// <summary>
        /// Checks if this is the player's first time playing.
        /// </summary>
        /// <returns>True if first time, false otherwise.</returns>
        private bool IsFirstTimePlaying()
        {
            return _saveData == null || (!_saveData.isCompleted && _saveData.lastCompletedStep < 0);
        }
        #endregion

        #region Persistence
        /// <summary>
        /// Saves tutorial progress to PlayerPrefs and cloud if available.
        /// </summary>
        private void SaveTutorialProgress()
        {
            if (_saveData == null)
            {
                _saveData = new TutorialSaveData();
            }

            _saveData.lastCompletedStep = _currentStepIndex - 1;
            _saveData.lastPlayedDate = DateTime.Now.ToString("o");

            string json = JsonUtility.ToJson(_saveData);
            PlayerPrefs.SetString("TutorialSaveData", json);
            PlayerPrefs.Save();

            // Sync to cloud if available
            CloudSaveManager.Instance?.SaveTutorialData(_saveData);
        }

        /// <summary>
        /// Loads tutorial progress from PlayerPrefs or cloud.
        /// </summary>
        private void LoadTutorialProgress()
        {
            // Try cloud first
            if (CloudSaveManager.Instance != null)
            {
                _saveData = CloudSaveManager.Instance.LoadTutorialData();
            }

            // Fall back to local if cloud unavailable
            if (_saveData == null && PlayerPrefs.HasKey("TutorialSaveData"))
            {
                string json = PlayerPrefs.GetString("TutorialSaveData");
                _saveData = JsonUtility.FromJson<TutorialSaveData>(json);
            }

            // Initialize if no data found
            if (_saveData == null)
            {
                _saveData = new TutorialSaveData
                {
                    isCompleted = false,
                    lastCompletedStep = -1
                };
            }
        }
        #endregion

        #region Accessibility
        /// <summary>
        /// Toggles high contrast mode for accessibility.
        /// </summary>
        /// <param name="enabled">Whether to enable high contrast.</param>
        public void SetHighContrastMode(bool enabled)
        {
            highContrastMode = enabled;
            uiController?.ApplyHighContrastMode(enabled);
        }

        /// <summary>
        /// Toggles screen reader support.
        /// </summary>
        /// <param name="enabled">Whether to enable screen reader.</param>
        public void SetScreenReaderEnabled(bool enabled)
        {
            enableScreenReader = enabled;
        }
        #endregion
    }

    #region Enums
    /// <summary>
    /// Represents the current state of the tutorial.
    /// </summary>
    public enum TutorialState
    {
        NotStarted,
        InProgress,
        Completed
    }
    #endregion

    #region Data Classes
    /// <summary>
    /// Represents a single tutorial step configuration.
    /// </summary>
    [Serializable]
    public class TutorialStep
    {
        public string stepName;
        public string instruction;
        public int targetCount;
        public float targetSpeed;
        public float hitAreaMultiplier;
        public bool showComboMeter;
        public bool showLivesSystem;
    }

    /// <summary>
    /// Save data for tutorial progress persistence.
    /// </summary>
    [Serializable]
    public class TutorialSaveData
    {
        public bool isCompleted;
        public int lastCompletedStep;
        public string lastPlayedDate;
        public string completionDate;
        public bool wasSkipped;
    }
    #endregion
}

