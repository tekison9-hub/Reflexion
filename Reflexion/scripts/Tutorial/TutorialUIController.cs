using System.Collections;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace Reflexion.Tutorial
{
    /// <summary>
    /// Controls all UI elements related to the tutorial overlay.
    /// Manages animations, transitions, and visual feedback.
    /// </summary>
    public class TutorialUIController : MonoBehaviour
    {
        #region Serialized Fields
        [Header("Overlay Components")]
        [SerializeField] private CanvasGroup overlayCanvasGroup;
        [SerializeField] private Image dimBackground;
        [SerializeField] private Image spotlightMask;
        
        [Header("Instruction Panel")]
        [SerializeField] private GameObject instructionPanel;
        [SerializeField] private TextMeshProUGUI instructionText;
        [SerializeField] private CanvasGroup instructionCanvasGroup;
        
        [Header("Hand Pointer")]
        [SerializeField] private HandPointerAnimator handPointer;
        
        [Header("Skip UI")]
        [SerializeField] private GameObject skipHoldIndicator;
        [SerializeField] private Image skipProgressBar;
        [SerializeField] private GameObject skipConfirmationPanel;
        [SerializeField] private Button skipConfirmButton;
        [SerializeField] private Button skipCancelButton;
        
        [Header("Completion UI")]
        [SerializeField] private GameObject completionModal;
        [SerializeField] private TextMeshProUGUI rewardCoinsText;
        [SerializeField] private TextMeshProUGUI completionMessageText;
        [SerializeField] private Button completionContinueButton;
        
        [Header("Animation Settings")]
        [SerializeField] private float fadeInDuration = 0.5f;
        [SerializeField] private float fadeOutDuration = 0.3f;
        [SerializeField] private float spotlightTransitionDuration = 0.5f;
        
        [Header("Colors")]
        [SerializeField] private Color normalDimColor = new Color(0, 0, 0, 0.7f);
        [SerializeField] private Color highContrastDimColor = new Color(0, 0, 0, 0.9f);
        [SerializeField] private Color normalTextColor = Color.white;
        [SerializeField] private Color highContrastTextColor = Color.yellow;
        #endregion

        #region Private Fields
        private Vector3 _currentSpotlightPosition;
        private float _currentSpotlightSize;
        private bool _isHighContrastMode;
        private Coroutine _spotlightAnimationCoroutine;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            InitializeUI();
        }

        private void Start()
        {
            HideTutorialOverlay();
        }
        #endregion

        #region Initialization
        /// <summary>
        /// Initializes UI components and sets up button listeners.
        /// </summary>
        private void InitializeUI()
        {
            if (overlayCanvasGroup == null)
            {
                overlayCanvasGroup = GetComponent<CanvasGroup>();
            }

            if (skipConfirmButton != null)
            {
                skipConfirmButton.onClick.AddListener(() => _skipConfirmCallback?.Invoke());
            }

            if (skipCancelButton != null)
            {
                skipCancelButton.onClick.AddListener(() => _skipCancelCallback?.Invoke());
            }

            if (completionContinueButton != null)
            {
                completionContinueButton.onClick.AddListener(OnCompletionContinue);
            }

            HideAllPanels();
        }

        /// <summary>
        /// Hides all UI panels.
        /// </summary>
        private void HideAllPanels()
        {
            if (instructionPanel != null)
                instructionPanel.SetActive(false);
            
            if (skipHoldIndicator != null)
                skipHoldIndicator.SetActive(false);
            
            if (skipConfirmationPanel != null)
                skipConfirmationPanel.SetActive(false);
            
            if (completionModal != null)
                completionModal.SetActive(false);
        }
        #endregion

        #region Public Methods - Overlay Control
        /// <summary>
        /// Shows the tutorial overlay with fade-in animation.
        /// </summary>
        public async Task ShowTutorialOverlay()
        {
            gameObject.SetActive(true);
            await FadeCanvasGroup(overlayCanvasGroup, 0f, 1f, fadeInDuration);
        }

        /// <summary>
        /// Hides the tutorial overlay with fade-out animation.
        /// </summary>
        public async void HideTutorialOverlay()
        {
            await FadeCanvasGroup(overlayCanvasGroup, 1f, 0f, fadeOutDuration);
            gameObject.SetActive(false);
        }
        #endregion

        #region Public Methods - Step UI
        /// <summary>
        /// Shows step instruction text with fade-in animation.
        /// </summary>
        /// <param name="instruction">The instruction text to display.</param>
        public async Task ShowStepInstruction(string instruction)
        {
            if (instructionPanel != null)
            {
                instructionPanel.SetActive(true);
            }

            if (instructionText != null)
            {
                instructionText.text = instruction;
            }

            if (instructionCanvasGroup != null)
            {
                await FadeCanvasGroup(instructionCanvasGroup, 0f, 1f, fadeInDuration);
            }

            await Task.Delay(500); // Brief pause for readability
        }

        /// <summary>
        /// Sets up UI elements for the current tutorial step.
        /// </summary>
        /// <param name="step">The tutorial step data.</param>
        public async Task SetupStepUI(TutorialStep step)
        {
            // Update spotlight size based on hit area multiplier
            float spotlightSize = 100f * step.hitAreaMultiplier;
            
            // Show hand pointer animation
            if (handPointer != null)
            {
                handPointer.gameObject.SetActive(true);
                handPointer.StartTapAnimation();
            }

            await Task.CompletedTask;
        }

        /// <summary>
        /// Moves the spotlight to highlight a specific target.
        /// </summary>
        /// <param name="worldPosition">World position of the target.</param>
        /// <param name="size">Size of the spotlight.</param>
        public void MoveSpotlight(Vector3 worldPosition, float size)
        {
            if (_spotlightAnimationCoroutine != null)
            {
                StopCoroutine(_spotlightAnimationCoroutine);
            }

            _spotlightAnimationCoroutine = StartCoroutine(AnimateSpotlight(worldPosition, size));
        }

        /// <summary>
        /// Moves the hand pointer to a specific position.
        /// </summary>
        /// <param name="screenPosition">Screen position for the hand pointer.</param>
        public void MoveHandPointer(Vector2 screenPosition)
        {
            if (handPointer != null)
            {
                handPointer.MoveToPosition(screenPosition);
            }
        }

        /// <summary>
        /// Plays the hand tap animation at current position.
        /// </summary>
        public void PlayHandTapAnimation()
        {
            if (handPointer != null)
            {
                handPointer.PlayTapAnimation();
            }
        }
        #endregion

        #region Public Methods - Skip UI
        /// <summary>
        /// Shows or hides the skip hold indicator.
        /// </summary>
        /// <param name="show">Whether to show the indicator.</param>
        public void ShowSkipHoldIndicator(bool show)
        {
            if (skipHoldIndicator != null)
            {
                skipHoldIndicator.SetActive(show);
            }
        }

        /// <summary>
        /// Updates the skip hold progress bar.
        /// </summary>
        /// <param name="progress">Progress value between 0 and 1.</param>
        public void UpdateSkipHoldProgress(float progress)
        {
            if (skipProgressBar != null)
            {
                skipProgressBar.fillAmount = progress;
            }
        }

        private System.Action _skipConfirmCallback;
        private System.Action _skipCancelCallback;

        /// <summary>
        /// Shows the skip confirmation dialog.
        /// </summary>
        /// <param name="onConfirm">Callback when skip is confirmed.</param>
        /// <param name="onCancel">Callback when skip is cancelled.</param>
        public void ShowSkipConfirmation(System.Action onConfirm, System.Action onCancel)
        {
            _skipConfirmCallback = onConfirm;
            _skipCancelCallback = onCancel;

            if (skipConfirmationPanel != null)
            {
                skipConfirmationPanel.SetActive(true);
            }
        }

        /// <summary>
        /// Hides the skip confirmation dialog.
        /// </summary>
        public void HideSkipConfirmation()
        {
            if (skipConfirmationPanel != null)
            {
                skipConfirmationPanel.SetActive(false);
            }
        }
        #endregion

        #region Public Methods - Completion UI
        /// <summary>
        /// Shows the completion reward modal.
        /// </summary>
        /// <param name="coinReward">Number of coins rewarded.</param>
        /// <param name="message">Completion message.</param>
        public async Task ShowCompletionReward(int coinReward, string message)
        {
            if (completionModal != null)
            {
                completionModal.SetActive(true);
            }

            if (rewardCoinsText != null)
            {
                rewardCoinsText.text = $"+{coinReward} Coins";
            }

            if (completionMessageText != null)
            {
                completionMessageText.text = message;
            }

            // Animate coin count
            if (rewardCoinsText != null)
            {
                await AnimateCoinCount(0, coinReward);
            }

            await Task.CompletedTask;
        }

        /// <summary>
        /// Called when the completion continue button is pressed.
        /// </summary>
        private void OnCompletionContinue()
        {
            if (completionModal != null)
            {
                completionModal.SetActive(false);
            }
        }
        #endregion

        #region Public Methods - Accessibility
        /// <summary>
        /// Applies high contrast mode to UI elements.
        /// </summary>
        /// <param name="enabled">Whether high contrast is enabled.</param>
        public void ApplyHighContrastMode(bool enabled)
        {
            _isHighContrastMode = enabled;

            if (dimBackground != null)
            {
                dimBackground.color = enabled ? highContrastDimColor : normalDimColor;
            }

            if (instructionText != null)
            {
                instructionText.color = enabled ? highContrastTextColor : normalTextColor;
            }
        }
        #endregion

        #region Private Methods - Animations
        /// <summary>
        /// Fades a CanvasGroup from one alpha to another.
        /// </summary>
        /// <param name="canvasGroup">The canvas group to fade.</param>
        /// <param name="fromAlpha">Starting alpha value.</param>
        /// <param name="toAlpha">Target alpha value.</param>
        /// <param name="duration">Animation duration in seconds.</param>
        private async Task FadeCanvasGroup(CanvasGroup canvasGroup, float fromAlpha, float toAlpha, float duration)
        {
            if (canvasGroup == null)
            {
                return;
            }

            float elapsed = 0f;
            canvasGroup.alpha = fromAlpha;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                canvasGroup.alpha = Mathf.Lerp(fromAlpha, toAlpha, t);
                await Task.Yield();
            }

            canvasGroup.alpha = toAlpha;
        }

        /// <summary>
        /// Animates the spotlight to a new position and size.
        /// </summary>
        /// <param name="targetPosition">Target world position.</param>
        /// <param name="targetSize">Target spotlight size.</param>
        private IEnumerator AnimateSpotlight(Vector3 targetPosition, float targetSize)
        {
            if (spotlightMask == null)
            {
                yield break;
            }

            Vector3 startPosition = _currentSpotlightPosition;
            float startSize = _currentSpotlightSize;
            float elapsed = 0f;

            while (elapsed < spotlightTransitionDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / spotlightTransitionDuration;
                t = Mathf.SmoothStep(0f, 1f, t); // Smooth easing

                _currentSpotlightPosition = Vector3.Lerp(startPosition, targetPosition, t);
                _currentSpotlightSize = Mathf.Lerp(startSize, targetSize, t);

                UpdateSpotlightVisuals();

                yield return null;
            }

            _currentSpotlightPosition = targetPosition;
            _currentSpotlightSize = targetSize;
            UpdateSpotlightVisuals();
        }

        /// <summary>
        /// Updates the visual appearance of the spotlight.
        /// </summary>
        private void UpdateSpotlightVisuals()
        {
            if (spotlightMask != null)
            {
                spotlightMask.transform.position = _currentSpotlightPosition;
                spotlightMask.transform.localScale = Vector3.one * _currentSpotlightSize;
            }
        }

        /// <summary>
        /// Animates the coin count incrementally.
        /// </summary>
        /// <param name="from">Starting coin count.</param>
        /// <param name="to">Target coin count.</param>
        private async Task AnimateCoinCount(int from, int to)
        {
            float duration = 1f;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                int currentValue = Mathf.RoundToInt(Mathf.Lerp(from, to, t));
                
                if (rewardCoinsText != null)
                {
                    rewardCoinsText.text = $"+{currentValue} Coins";
                }

                await Task.Yield();
            }

            if (rewardCoinsText != null)
            {
                rewardCoinsText.text = $"+{to} Coins";
            }
        }
        #endregion

        #region Public Utility Methods
        /// <summary>
        /// Converts world position to screen position for UI elements.
        /// </summary>
        /// <param name="worldPosition">World position to convert.</param>
        /// <returns>Screen position.</returns>
        public Vector2 WorldToScreenPosition(Vector3 worldPosition)
        {
            Camera mainCamera = Camera.main;
            if (mainCamera != null)
            {
                return mainCamera.WorldToScreenPoint(worldPosition);
            }
            return Vector2.zero;
        }
        #endregion
    }
}

