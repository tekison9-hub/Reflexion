using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace Reflexion.DailyRewards
{
    /// <summary>
    /// Represents a single day in the daily reward calendar.
    /// Handles visual state changes and animations.
    /// </summary>
    public class DailyRewardCalendarItem : MonoBehaviour
    {
        #region Serialized Fields
        [Header("UI Elements")]
        [SerializeField] private TextMeshProUGUI dayNumberText;
        [SerializeField] private TextMeshProUGUI rewardText;
        [SerializeField] private Image backgroundImage;
        [SerializeField] private GameObject checkmarkIcon;
        [SerializeField] private GameObject glowEffect;
        [SerializeField] private CanvasGroup canvasGroup;
        
        [Header("Colors")]
        [SerializeField] private Color completedColor = new Color(0.2f, 0.8f, 0.3f);
        [SerializeField] private Color availableColor = new Color(1f, 0.8f, 0f);
        [SerializeField] private Color lockedColor = new Color(0.4f, 0.4f, 0.4f);
        
        [Header("Animation")]
        [SerializeField] private float claimScaleDuration = 0.5f;
        [SerializeField] private float claimScaleAmount = 1.2f;
        [SerializeField] private AnimationCurve claimScaleCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);
        #endregion

        #region Private Fields
        private DailyRewardConfig _config;
        private int _dayNumber;
        private DayStatus _currentStatus;
        private Vector3 _originalScale;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            _originalScale = transform.localScale;
        }
        #endregion

        #region Initialization
        /// <summary>
        /// Initializes the calendar item with reward data.
        /// </summary>
        /// <param name="config">Reward configuration for this day.</param>
        /// <param name="dayNumber">Day number (1-7).</param>
        public void Initialize(DailyRewardConfig config, int dayNumber)
        {
            _config = config;
            _dayNumber = dayNumber;

            UpdateDayNumber();
            UpdateRewardDisplay();
        }

        /// <summary>
        /// Updates the day number display.
        /// </summary>
        private void UpdateDayNumber()
        {
            if (dayNumberText != null)
            {
                dayNumberText.text = $"Day {_dayNumber}";
            }
        }

        /// <summary>
        /// Updates the reward display text.
        /// </summary>
        private void UpdateRewardDisplay()
        {
            if (rewardText == null || _config == null)
            {
                return;
            }

            RewardData rewards = _config.rewards;
            string displayText = FormatRewardText(rewards);
            rewardText.text = displayText;
        }

        /// <summary>
        /// Formats reward data into display text.
        /// </summary>
        private string FormatRewardText(RewardData rewards)
        {
            // Primary reward (coins)
            string primary = rewards.coins > 0 ? $"{rewards.coins}\nCoins" : "";

            // Secondary rewards
            List<string> extras = new List<string>();
            
            if (rewards.gems > 0)
            {
                extras.Add($"+{rewards.gems} gems");
            }

            if (!string.IsNullOrEmpty(rewards.exclusiveTheme))
            {
                extras.Add("+Theme");
            }

            if (rewards.themeTrialHours > 0)
            {
                extras.Add($"+{rewards.themeTrialHours}h Trial");
            }

            if (rewards.randomBooster)
            {
                extras.Add("+Booster");
            }

            // Combine
            if (extras.Count > 0)
            {
                return $"{primary}\n<size=70%>{string.Join("\n", extras)}</size>";
            }

            return primary;
        }
        #endregion

        #region Status Update
        /// <summary>
        /// Updates the visual status of this calendar item.
        /// </summary>
        /// <param name="status">Current day status.</param>
        /// <param name="isCurrent">Whether this is the current claimable day.</param>
        public void UpdateStatus(DayStatus status, bool isCurrent)
        {
            _currentStatus = status;

            UpdateBackgroundColor(status, isCurrent);
            UpdateCheckmark(status);
            UpdateGlow(status, isCurrent);
            UpdateAlpha(status);
        }

        /// <summary>
        /// Updates background color based on status.
        /// </summary>
        private void UpdateBackgroundColor(DayStatus status, bool isCurrent)
        {
            if (backgroundImage == null)
            {
                return;
            }

            Color targetColor = status switch
            {
                DayStatus.Completed => completedColor,
                DayStatus.Available => isCurrent ? availableColor : lockedColor,
                DayStatus.Locked => lockedColor,
                _ => lockedColor
            };

            backgroundImage.color = targetColor;
        }

        /// <summary>
        /// Updates checkmark visibility based on status.
        /// </summary>
        private void UpdateCheckmark(DayStatus status)
        {
            if (checkmarkIcon != null)
            {
                checkmarkIcon.SetActive(status == DayStatus.Completed);
            }
        }

        /// <summary>
        /// Updates glow effect based on status.
        /// </summary>
        private void UpdateGlow(DayStatus status, bool isCurrent)
        {
            if (glowEffect != null)
            {
                glowEffect.SetActive(status == DayStatus.Available && isCurrent);
            }
        }

        /// <summary>
        /// Updates alpha transparency based on status.
        /// </summary>
        private void UpdateAlpha(DayStatus status)
        {
            if (canvasGroup == null)
            {
                return;
            }

            float targetAlpha = status switch
            {
                DayStatus.Completed => 1f,
                DayStatus.Available => 1f,
                DayStatus.Locked => 0.5f,
                _ => 0.5f
            };

            canvasGroup.alpha = targetAlpha;
        }
        #endregion

        #region Animation
        /// <summary>
        /// Plays the claim animation (scale up and down).
        /// </summary>
        public async System.Threading.Tasks.Task PlayClaimAnimation()
        {
            // Scale up
            float elapsed = 0f;
            while (elapsed < claimScaleDuration / 2f)
            {
                elapsed += Time.deltaTime;
                float t = claimScaleCurve.Evaluate(elapsed / (claimScaleDuration / 2f));
                transform.localScale = Vector3.Lerp(_originalScale, _originalScale * claimScaleAmount, t);
                await System.Threading.Tasks.Task.Yield();
            }

            // Scale down
            elapsed = 0f;
            while (elapsed < claimScaleDuration / 2f)
            {
                elapsed += Time.deltaTime;
                float t = claimScaleCurve.Evaluate(elapsed / (claimScaleDuration / 2f));
                transform.localScale = Vector3.Lerp(_originalScale * claimScaleAmount, _originalScale, t);
                await System.Threading.Tasks.Task.Yield();
            }

            transform.localScale = _originalScale;
        }

        /// <summary>
        /// Plays a pulsing glow animation (for current day).
        /// </summary>
        public void StartPulseAnimation()
        {
            if (glowEffect != null)
            {
                StartCoroutine(PulseGlowCoroutine());
            }
        }

        /// <summary>
        /// Coroutine for pulsing glow effect.
        /// </summary>
        private IEnumerator PulseGlowCoroutine()
        {
            if (glowEffect == null)
            {
                yield break;
            }

            CanvasGroup glowCanvas = glowEffect.GetComponent<CanvasGroup>();
            if (glowCanvas == null)
            {
                glowCanvas = glowEffect.AddComponent<CanvasGroup>();
            }

            while (glowEffect.activeInHierarchy)
            {
                // Fade in
                float elapsed = 0f;
                float duration = 0.8f;

                while (elapsed < duration)
                {
                    elapsed += Time.deltaTime;
                    glowCanvas.alpha = Mathf.Lerp(0.3f, 1f, elapsed / duration);
                    yield return null;
                }

                // Fade out
                elapsed = 0f;
                while (elapsed < duration)
                {
                    elapsed += Time.deltaTime;
                    glowCanvas.alpha = Mathf.Lerp(1f, 0.3f, elapsed / duration);
                    yield return null;
                }
            }
        }
        #endregion

        #region Public API
        /// <summary>
        /// Gets the day number for this item.
        /// </summary>
        public int GetDayNumber()
        {
            return _dayNumber;
        }

        /// <summary>
        /// Gets the reward configuration for this item.
        /// </summary>
        public DailyRewardConfig GetRewardConfig()
        {
            return _config;
        }
        #endregion
    }
}

