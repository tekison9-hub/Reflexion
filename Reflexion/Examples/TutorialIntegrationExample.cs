using UnityEngine;
using UnityEngine.UI;
using Reflexion.Tutorial;
using System.Collections;

namespace Reflexion.Examples
{
    /// <summary>
    /// Example implementation showing how to integrate the tutorial system
    /// with your game's target spawning and interaction logic.
    /// </summary>
    public class TutorialIntegrationExample : MonoBehaviour
    {
        #region Serialized Fields
        [Header("Game References")]
        [SerializeField] private GameObject targetPrefab;
        [SerializeField] private Transform spawnArea;
        [SerializeField] private Canvas gameCanvas;
        
        [Header("UI References")]
        [SerializeField] private GameObject comboMeter;
        [SerializeField] private GameObject livesDisplay;
        [SerializeField] private TutorialUIController tutorialUI;
        
        [Header("Tutorial Settings")]
        [SerializeField] private bool startTutorialOnFirstLaunch = true;
        #endregion

        #region Private Fields
        private GameObject _currentTarget;
        private int _targetsHitInCurrentStep = 0;
        private int _currentCombo = 0;
        private int _remainingLives = 3;
        private bool _isTutorialMode = false;
        #endregion

        #region Unity Lifecycle
        private void Start()
        {
            InitializeGame();
            CheckAndStartTutorial();
        }

        private void OnEnable()
        {
            SubscribeToTutorialEvents();
        }

        private void OnDisable()
        {
            UnsubscribeFromTutorialEvents();
        }
        #endregion

        #region Initialization
        /// <summary>
        /// Initializes game systems.
        /// </summary>
        private void InitializeGame()
        {
            // Hide tutorial-specific UI initially
            if (comboMeter != null)
                comboMeter.SetActive(false);
            
            if (livesDisplay != null)
                livesDisplay.SetActive(false);
        }

        /// <summary>
        /// Checks if tutorial is needed and starts it.
        /// </summary>
        private void CheckAndStartTutorial()
        {
            if (startTutorialOnFirstLaunch && !TutorialManager.Instance.IsTutorialCompleted)
            {
                StartTutorial();
            }
            else
            {
                StartNormalGame();
            }
        }
        #endregion

        #region Tutorial Events
        /// <summary>
        /// Subscribes to tutorial manager events.
        /// </summary>
        private void SubscribeToTutorialEvents()
        {
            if (TutorialManager.Instance != null)
            {
                TutorialManager.Instance.OnStateChanged.AddListener(OnTutorialStateChanged);
                TutorialManager.Instance.OnStepCompleted.AddListener(OnTutorialStepCompleted);
                TutorialManager.Instance.OnTutorialCompleted.AddListener(OnTutorialCompleted);
                TutorialManager.Instance.OnTutorialSkipped.AddListener(OnTutorialSkipped);
            }
        }

        /// <summary>
        /// Unsubscribes from tutorial manager events.
        /// </summary>
        private void UnsubscribeFromTutorialEvents()
        {
            if (TutorialManager.Instance != null)
            {
                TutorialManager.Instance.OnStateChanged.RemoveListener(OnTutorialStateChanged);
                TutorialManager.Instance.OnStepCompleted.RemoveListener(OnTutorialStepCompleted);
                TutorialManager.Instance.OnTutorialCompleted.RemoveListener(OnTutorialCompleted);
                TutorialManager.Instance.OnTutorialSkipped.RemoveListener(OnTutorialSkipped);
            }
        }

        /// <summary>
        /// Called when tutorial state changes.
        /// </summary>
        private void OnTutorialStateChanged(TutorialState newState)
        {
            _isTutorialMode = (newState == TutorialState.InProgress);
            
            Debug.Log($"[Tutorial] State changed to: {newState}");

            switch (newState)
            {
                case TutorialState.InProgress:
                    StartTutorialStep();
                    break;
                
                case TutorialState.Completed:
                    Debug.Log("[Tutorial] Tutorial completed!");
                    break;
                
                case TutorialState.NotStarted:
                    // Tutorial ended, return to normal game
                    break;
            }
        }

        /// <summary>
        /// Called when a tutorial step is completed.
        /// </summary>
        private void OnTutorialStepCompleted(int stepIndex)
        {
            Debug.Log($"[Tutorial] Step {stepIndex} completed!");
            
            // Reset for next step
            _targetsHitInCurrentStep = 0;
            
            // Show UI elements based on step
            switch (stepIndex)
            {
                case 0:
                    // After step 1, prepare for step 2 (combo introduction)
                    if (comboMeter != null)
                        comboMeter.SetActive(true);
                    break;
                
                case 1:
                    // After step 2, prepare for step 3 (lives introduction)
                    if (livesDisplay != null)
                        livesDisplay.SetActive(true);
                    break;
                
                case 2:
                    // All steps complete
                    break;
            }
        }

        /// <summary>
        /// Called when entire tutorial is completed.
        /// </summary>
        private void OnTutorialCompleted()
        {
            Debug.Log("[Tutorial] Tutorial fully completed! Starting game...");
            StartNormalGame();
        }

        /// <summary>
        /// Called when tutorial is skipped.
        /// </summary>
        private void OnTutorialSkipped()
        {
            Debug.Log("[Tutorial] Tutorial skipped. Starting game...");
            
            // Ensure all UI is visible
            if (comboMeter != null)
                comboMeter.SetActive(true);
            
            if (livesDisplay != null)
                livesDisplay.SetActive(true);
            
            StartNormalGame();
        }
        #endregion

        #region Tutorial Flow
        /// <summary>
        /// Starts the tutorial.
        /// </summary>
        private void StartTutorial()
        {
            Debug.Log("[Tutorial] Starting tutorial...");
            TutorialManager.Instance.StartTutorial();
        }

        /// <summary>
        /// Starts the current tutorial step.
        /// </summary>
        private void StartTutorialStep()
        {
            TutorialStep currentStep = TutorialManager.Instance.GetCurrentStep();
            
            if (currentStep == null)
            {
                Debug.LogWarning("[Tutorial] No current step found!");
                return;
            }

            Debug.Log($"[Tutorial] Starting step: {currentStep.stepName}");
            
            // Show/hide UI based on step settings
            if (comboMeter != null)
                comboMeter.SetActive(currentStep.showComboMeter);
            
            if (livesDisplay != null)
                livesDisplay.SetActive(currentStep.showLivesSystem);
            
            // Spawn first target for this step
            StartCoroutine(SpawnTutorialTarget(currentStep));
        }

        /// <summary>
        /// Spawns a tutorial target with appropriate settings.
        /// </summary>
        private IEnumerator SpawnTutorialTarget(TutorialStep step)
        {
            // Small delay for readability
            yield return new WaitForSeconds(0.5f);

            // Clean up previous target
            if (_currentTarget != null)
            {
                Destroy(_currentTarget);
            }

            // Spawn new target
            Vector3 spawnPosition = GetRandomSpawnPosition();
            _currentTarget = Instantiate(targetPrefab, spawnPosition, Quaternion.identity, spawnArea);

            // Configure target for tutorial
            TutorialTarget targetScript = _currentTarget.AddComponent<TutorialTarget>();
            targetScript.Initialize(step, this);

            // Update tutorial UI
            UpdateTutorialUI(spawnPosition, step);
        }

        /// <summary>
        /// Updates tutorial UI (spotlight and hand pointer).
        /// </summary>
        private void UpdateTutorialUI(Vector3 targetWorldPosition, TutorialStep step)
        {
            if (tutorialUI == null)
                return;

            // Move spotlight to target
            float spotlightSize = 150f * step.hitAreaMultiplier;
            tutorialUI.MoveSpotlight(targetWorldPosition, spotlightSize);

            // Move hand pointer to target
            Vector2 screenPosition = tutorialUI.WorldToScreenPosition(targetWorldPosition);
            tutorialUI.MoveHandPointer(screenPosition);

            // Start hand tap animation
            tutorialUI.PlayHandTapAnimation();
        }

        /// <summary>
        /// Called when a target is successfully hit during tutorial.
        /// </summary>
        public void OnTutorialTargetHit()
        {
            _targetsHitInCurrentStep++;
            _currentCombo++;

            // Play feedback
            tutorialUI?.PlayHandTapAnimation();
            
            // Update combo display
            UpdateComboDisplay();

            // Check if step is complete
            TutorialStep currentStep = TutorialManager.Instance.GetCurrentStep();
            if (currentStep != null && _targetsHitInCurrentStep >= currentStep.targetCount)
            {
                // Step complete!
                TutorialManager.Instance.CompleteStep(TutorialManager.Instance.CurrentStepIndex);
            }
            else
            {
                // Spawn next target
                StartCoroutine(SpawnTutorialTarget(currentStep));
            }
        }

        /// <summary>
        /// Called when a target is missed during tutorial.
        /// </summary>
        public void OnTutorialTargetMissed()
        {
            _currentCombo = 0;
            
            if (TutorialManager.Instance.GetCurrentStep().showLivesSystem)
            {
                _remainingLives--;
                UpdateLivesDisplay();
                
                if (_remainingLives <= 0)
                {
                    // Restart current step
                    _remainingLives = 3;
                    _targetsHitInCurrentStep = 0;
                    StartTutorialStep();
                }
            }
            
            // Update UI
            UpdateComboDisplay();
        }
        #endregion

        #region Normal Game Flow
        /// <summary>
        /// Starts normal game (post-tutorial).
        /// </summary>
        private void StartNormalGame()
        {
            Debug.Log("[Game] Starting normal game mode...");
            
            // Ensure all UI is visible
            if (comboMeter != null)
                comboMeter.SetActive(true);
            
            if (livesDisplay != null)
                livesDisplay.SetActive(true);
            
            // Start your normal game logic here
            StartCoroutine(GameLoop());
        }

        /// <summary>
        /// Normal game loop.
        /// </summary>
        private IEnumerator GameLoop()
        {
            while (true)
            {
                // Your normal game spawning logic
                yield return new WaitForSeconds(2f);
                
                // Spawn targets, handle game logic, etc.
            }
        }
        #endregion

        #region UI Updates
        /// <summary>
        /// Updates the combo meter display.
        /// </summary>
        private void UpdateComboDisplay()
        {
            if (comboMeter != null)
            {
                Text comboText = comboMeter.GetComponentInChildren<Text>();
                if (comboText != null)
                {
                    comboText.text = $"Combo: x{_currentCombo}";
                }
            }
        }

        /// <summary>
        /// Updates the lives display.
        /// </summary>
        private void UpdateLivesDisplay()
        {
            if (livesDisplay != null)
            {
                Text livesText = livesDisplay.GetComponentInChildren<Text>();
                if (livesText != null)
                {
                    livesText.text = $"Lives: {_remainingLives}";
                }
            }
        }
        #endregion

        #region Helper Methods
        /// <summary>
        /// Gets a random spawn position within the spawn area.
        /// </summary>
        private Vector3 GetRandomSpawnPosition()
        {
            if (spawnArea != null)
            {
                // Example: Random position within bounds
                float x = Random.Range(-5f, 5f);
                float y = Random.Range(-8f, 8f);
                return new Vector3(x, y, 0);
            }
            
            return Vector3.zero;
        }
        #endregion

        #region Public API
        /// <summary>
        /// Manually triggers tutorial reset (for testing/settings).
        /// </summary>
        public void ResetTutorial()
        {
            TutorialManager.Instance.ResetTutorial();
            CheckAndStartTutorial();
        }

        /// <summary>
        /// Checks if tutorial is currently active.
        /// </summary>
        public bool IsTutorialActive()
        {
            return _isTutorialMode;
        }
        #endregion
    }

    /// <summary>
    /// Simple target script for tutorial integration example.
    /// </summary>
    public class TutorialTarget : MonoBehaviour
    {
        private TutorialStep _step;
        private TutorialIntegrationExample _game;
        private float _lifetime = 0f;
        private float _maxLifetime = 3f;

        public void Initialize(TutorialStep step, TutorialIntegrationExample game)
        {
            _step = step;
            _game = game;
            _maxLifetime = 1f / step.targetSpeed * 3f; // Adjust lifetime based on speed
        }

        private void Update()
        {
            _lifetime += Time.deltaTime;
            
            if (_lifetime >= _maxLifetime)
            {
                // Target expired without being hit
                _game.OnTutorialTargetMissed();
                Destroy(gameObject);
            }
        }

        private void OnMouseDown()
        {
            // Target was tapped/clicked
            _game.OnTutorialTargetHit();
            Destroy(gameObject);
        }
    }
}

