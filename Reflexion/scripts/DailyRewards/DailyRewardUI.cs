using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace Reflexion.DailyRewards
{
    /// <summary>
    /// Controls the daily reward calendar UI including day items,
    /// streak counter, and claim buttons.
    /// </summary>
    public class DailyRewardUI : MonoBehaviour
    {
        #region Serialized Fields
        [Header("Calendar")]
        [SerializeField] private Transform calendarContainer;
        [SerializeField] private GameObject calendarDayPrefab;
        [SerializeField] private int displayDays = 7;
        
        [Header("Header")]
        [SerializeField] private TextMeshProUGUI streakText;
        [SerializeField] private GameObject streakFlameIcon;
        [SerializeField] private TextMeshProUGUI nextRewardPreviewText;
        
        [Header("Claim Button")]
        [SerializeField] private Button claimButton;
        [SerializeField] private TextMeshProUGUI claimButtonText;
        [SerializeField] private GameObject claimButtonGlow;
        
        [Header("Double Reward")]
        [SerializeField] private Button doubleRewardButton;
        [SerializeField] private GameObject doubleRewardPanel;
        [SerializeField] private TextMeshProUGUI doubleRewardText;
        
        [Header("Claim All Week")]
        [SerializeField] private Button claimAllWeekButton;
        [SerializeField] private TextMeshProUGUI claimAllWeekPriceText;
        
        [Header("Comeback Bonus")]
        [SerializeField] private GameObject comebackBonusPanel;
        [SerializeField] private TextMeshProUGUI comebackBonusText;
        [SerializeField] private Button claimComebackButton;
        
        [Header("Reward Display")]
        [SerializeField] private GameObject rewardDisplayPanel;
        [SerializeField] private TextMeshProUGUI rewardDisplayText;
        [SerializeField] private ParticleSystem celebrationParticles;
        
        [Header("Animation")]
        [SerializeField] private float claimAnimationDuration = 1f;
        [SerializeField] private AnimationCurve claimAnimationCurve;
        #endregion

        #region Private Fields
        private List<DailyRewardCalendarItem> _calendarItems = new List<DailyRewardCalendarItem>();
        private bool _isAnimating = false;
        #endregion

        #region Unity Lifecycle
        private void Start()
        {
            InitializeUI();
            SubscribeToEvents();
            RefreshUI();
        }

        private void OnEnable()
        {
            RefreshUI();
        }

        private void OnDestroy()
        {
            UnsubscribeFromEvents();
        }
        #endregion

        #region Initialization
        /// <summary>
        /// Initializes UI components and button listeners.
        /// </summary>
        private void InitializeUI()
        {
            // Setup claim button
            if (claimButton != null)
            {
                claimButton.onClick.AddListener(OnClaimButtonClicked);
            }

            // Setup double reward button
            if (doubleRewardButton != null)
            {
                doubleRewardButton.onClick.AddListener(OnDoubleRewardButtonClicked);
            }

            // Setup claim all week button
            if (claimAllWeekButton != null)
            {
                claimAllWeekButton.onClick.AddListener(OnClaimAllWeekButtonClicked);
            }

            // Setup comeback bonus button
            if (claimComebackButton != null)
            {
                claimComebackButton.onClick.AddListener(OnClaimComebackButtonClicked);
            }

            // Create calendar day items
            CreateCalendarItems();

            // Hide reward display initially
            if (rewardDisplayPanel != null)
            {
                rewardDisplayPanel.SetActive(false);
            }
        }

        /// <summary>
        /// Creates calendar day item UI elements.
        /// </summary>
        private void CreateCalendarItems()
        {
            if (calendarContainer == null || calendarDayPrefab == null)
            {
                Debug.LogError("[DailyRewardUI] Calendar container or prefab not assigned!");
                return;
            }

            // Clear existing items
            foreach (Transform child in calendarContainer)
            {
                Destroy(child.gameObject);
            }
            _calendarItems.Clear();

            // Create day items
            DailyRewardConfig[] rewards = DailyRewardManager.Instance.GetCalendarRewards();
            for (int i = 0; i < displayDays && i < rewards.Length; i++)
            {
                GameObject dayObject = Instantiate(calendarDayPrefab, calendarContainer);
                DailyRewardCalendarItem dayItem = dayObject.GetComponent<DailyRewardCalendarItem>();
                
                if (dayItem != null)
                {
                    dayItem.Initialize(rewards[i], i + 1);
                    _calendarItems.Add(dayItem);
                }
            }
        }
        #endregion

        #region Event Subscription
        /// <summary>
        /// Subscribes to DailyRewardManager events.
        /// </summary>
        private void SubscribeToEvents()
        {
            if (DailyRewardManager.Instance != null)
            {
                DailyRewardManager.Instance.OnRewardClaimed.AddListener(OnRewardClaimed);
                DailyRewardManager.Instance.OnStreakBroken.AddListener(OnStreakBroken);
                DailyRewardManager.Instance.OnComebackBonusAvailable.AddListener(OnComebackBonusAvailable);
            }
        }

        /// <summary>
        /// Unsubscribes from DailyRewardManager events.
        /// </summary>
        private void UnsubscribeFromEvents()
        {
            if (DailyRewardManager.Instance != null)
            {
                DailyRewardManager.Instance.OnRewardClaimed.RemoveListener(OnRewardClaimed);
                DailyRewardManager.Instance.OnStreakBroken.RemoveListener(OnStreakBroken);
                DailyRewardManager.Instance.OnComebackBonusAvailable.RemoveListener(OnComebackBonusAvailable);
            }
        }
        #endregion

        #region UI Update
        /// <summary>
        /// Refreshes all UI elements.
        /// </summary>
        public void RefreshUI()
        {
            if (DailyRewardManager.Instance == null)
            {
                return;
            }

            UpdateStreakDisplay();
            UpdateNextRewardPreview();
            UpdateCalendarItems();
            UpdateClaimButton();
            UpdateDoubleRewardButton();
            UpdateComebackBonusPanel();
        }

        /// <summary>
        /// Updates the streak counter display.
        /// </summary>
        private void UpdateStreakDisplay()
        {
            int streak = DailyRewardManager.Instance.CurrentStreak;
            
            if (streakText != null)
            {
                if (streak > 0)
                {
                    streakText.text = $"🔥 {streak} Day Streak!";
                    streakText.gameObject.SetActive(true);
                }
                else
                {
                    streakText.gameObject.SetActive(false);
                }
            }

            if (streakFlameIcon != null)
            {
                streakFlameIcon.SetActive(streak > 0);
            }
        }

        /// <summary>
        /// Updates the next reward preview text.
        /// </summary>
        private void UpdateNextRewardPreview()
        {
            if (nextRewardPreviewText == null)
            {
                return;
            }

            int nextDay = DailyRewardManager.Instance.CurrentDay + 1;
            DailyRewardConfig nextReward = DailyRewardManager.Instance.NextReward;

            if (nextReward != null && nextDay <= displayDays)
            {
                nextRewardPreviewText.text = $"Tomorrow: {FormatRewardPreview(nextReward.rewards)}";
                nextRewardPreviewText.gameObject.SetActive(true);
            }
            else
            {
                nextRewardPreviewText.gameObject.SetActive(false);
            }
        }

        /// <summary>
        /// Updates all calendar day items.
        /// </summary>
        private void UpdateCalendarItems()
        {
            int currentDay = DailyRewardManager.Instance.CurrentDay;

            for (int i = 0; i < _calendarItems.Count; i++)
            {
                int day = i + 1;
                DayStatus status = DailyRewardManager.Instance.GetDayStatus(day);
                _calendarItems[i].UpdateStatus(status, day == currentDay);
            }
        }

        /// <summary>
        /// Updates the claim button state.
        /// </summary>
        private void UpdateClaimButton()
        {
            bool canClaim = DailyRewardManager.Instance.CanClaimToday;

            if (claimButton != null)
            {
                claimButton.interactable = canClaim && !_isAnimating;
            }

            if (claimButtonText != null)
            {
                claimButtonText.text = canClaim ? "CLAIM" : "CLAIMED";
            }

            if (claimButtonGlow != null)
            {
                claimButtonGlow.SetActive(canClaim);
            }
        }

        /// <summary>
        /// Updates the double reward button.
        /// </summary>
        private void UpdateDoubleRewardButton()
        {
            bool canClaim = DailyRewardManager.Instance.CanClaimToday;
            bool isPremium = DailyRewardManager.Instance.IsPremiumUser;

            if (doubleRewardPanel != null)
            {
                doubleRewardPanel.SetActive(canClaim && !isPremium);
            }

            if (doubleRewardText != null)
            {
                doubleRewardText.text = "Watch Ad for 2x Rewards!";
            }
        }

        /// <summary>
        /// Updates the comeback bonus panel.
        /// </summary>
        private void UpdateComebackBonusPanel()
        {
            bool hasComeback = DailyRewardManager.Instance.HasComebackBonus;

            if (comebackBonusPanel != null)
            {
                comebackBonusPanel.SetActive(hasComeback);
            }
        }
        #endregion

        #region Button Handlers
        /// <summary>
        /// Handles claim button click.
        /// </summary>
        private async void OnClaimButtonClicked()
        {
            if (_isAnimating)
            {
                return;
            }

            bool isPremium = DailyRewardManager.Instance.IsPremiumUser;
            DailyRewardResult result = await DailyRewardManager.Instance.ClaimDailyReward(isPremium);

            if (result.success)
            {
                await PlayClaimAnimation(result);
                RefreshUI();
            }
            else
            {
                ShowError(result.errorMessage);
            }
        }

        /// <summary>
        /// Handles double reward button click (ad watching).
        /// </summary>
        private async void OnDoubleRewardButtonClicked()
        {
            if (_isAnimating)
            {
                return;
            }

            // Show rewarded ad
            bool adWatched = await AdManager.Instance.ShowRewardedAd("daily_reward_double");

            if (adWatched)
            {
                DailyRewardResult result = await DailyRewardManager.Instance.ClaimDailyReward(doubleReward: true);

                if (result.success)
                {
                    await PlayClaimAnimation(result);
                    RefreshUI();
                }
            }
            else
            {
                ShowError("Ad not available. Try again later.");
            }
        }

        /// <summary>
        /// Handles claim all week button click (IAP).
        /// </summary>
        private async void OnClaimAllWeekButtonClicked()
        {
            if (_isAnimating)
            {
                return;
            }

            // Show purchase confirmation
            bool confirmed = await ShowPurchaseConfirmation("Claim all remaining rewards?", "$4.99");

            if (confirmed)
            {
                DailyRewardResult result = await DailyRewardManager.Instance.ClaimAllWeek();

                if (result.success)
                {
                    await PlayClaimAnimation(result);
                    RefreshUI();
                }
                else
                {
                    ShowError(result.errorMessage);
                }
            }
        }

        /// <summary>
        /// Handles comeback bonus button click.
        /// </summary>
        private void OnClaimComebackButtonClicked()
        {
            DailyRewardResult result = DailyRewardManager.Instance.ClaimComebackBonus();

            if (result.success)
            {
                ShowRewardDisplay(result.rewards, "Welcome Back!");
                RefreshUI();
            }
        }
        #endregion

        #region Animations
        /// <summary>
        /// Plays claim animation and shows rewards.
        /// </summary>
        private async System.Threading.Tasks.Task PlayClaimAnimation(DailyRewardResult result)
        {
            _isAnimating = true;

            // Find current day calendar item
            if (result.dayNumber > 0 && result.dayNumber <= _calendarItems.Count)
            {
                DailyRewardCalendarItem dayItem = _calendarItems[result.dayNumber - 1];
                await dayItem.PlayClaimAnimation();
            }

            // Show reward display
            string title = result.wasDoubled ? "2X REWARDS!" : "DAILY REWARD!";
            if (result.wasClaimAllWeek)
            {
                title = "WEEK CLAIMED!";
            }

            ShowRewardDisplay(result.rewards, title);

            // Play particles
            if (celebrationParticles != null)
            {
                celebrationParticles.Play();
            }

            // Wait for animation
            await System.Threading.Tasks.Task.Delay((int)(claimAnimationDuration * 1000));

            _isAnimating = false;
        }

        /// <summary>
        /// Shows reward display panel.
        /// </summary>
        private void ShowRewardDisplay(RewardData rewards, string title)
        {
            if (rewardDisplayPanel == null)
            {
                return;
            }

            rewardDisplayPanel.SetActive(true);

            if (rewardDisplayText != null)
            {
                string rewardText = $"{title}\n\n{FormatRewardDisplay(rewards)}";
                rewardDisplayText.text = rewardText;
            }

            // Auto-hide after delay
            StartCoroutine(HideRewardDisplayAfterDelay(3f));
        }

        /// <summary>
        /// Hides reward display after delay.
        /// </summary>
        private IEnumerator HideRewardDisplayAfterDelay(float delay)
        {
            yield return new WaitForSeconds(delay);

            if (rewardDisplayPanel != null)
            {
                rewardDisplayPanel.SetActive(false);
            }
        }
        #endregion

        #region Event Handlers
        /// <summary>
        /// Called when a reward is claimed.
        /// </summary>
        private void OnRewardClaimed(DailyRewardResult result)
        {
            Debug.Log($"[DailyRewardUI] Reward claimed: {result.rewards}");
        }

        /// <summary>
        /// Called when streak is broken.
        /// </summary>
        private void OnStreakBroken(int previousStreak)
        {
            ShowError($"Streak broken! You had a {previousStreak}-day streak.");
        }

        /// <summary>
        /// Called when comeback bonus becomes available.
        /// </summary>
        private void OnComebackBonusAvailable(RewardData bonus)
        {
            if (comebackBonusText != null)
            {
                comebackBonusText.text = $"Welcome Back!\nClaim {bonus.coins} Coins!";
            }
        }
        #endregion

        #region Helper Methods
        /// <summary>
        /// Formats reward data for preview display.
        /// </summary>
        private string FormatRewardPreview(RewardData rewards)
        {
            if (rewards.coins > 0 && rewards.randomBooster)
            {
                return $"{rewards.coins} coins + booster";
            }
            else if (rewards.coins > 0 && rewards.gems > 0)
            {
                return $"{rewards.coins} coins + {rewards.gems} gems";
            }
            else if (rewards.coins > 0)
            {
                return $"{rewards.coins} coins";
            }

            return "Special reward";
        }

        /// <summary>
        /// Formats reward data for full display.
        /// </summary>
        private string FormatRewardDisplay(RewardData rewards)
        {
            List<string> parts = new List<string>();

            if (rewards.coins > 0)
            {
                parts.Add($"💰 {rewards.coins} Coins");
            }

            if (rewards.gems > 0)
            {
                parts.Add($"💎 {rewards.gems} Gems");
            }

            if (!string.IsNullOrEmpty(rewards.exclusiveTheme))
            {
                parts.Add($"🎨 Exclusive Theme: {rewards.exclusiveTheme}");
            }

            if (rewards.themeTrialHours > 0)
            {
                parts.Add($"⏰ {rewards.themeTrialHours}h Theme Trial");
            }

            if (rewards.randomBooster)
            {
                parts.Add($"🚀 Random Booster");
            }

            return string.Join("\n", parts);
        }

        /// <summary>
        /// Shows an error message to the user.
        /// </summary>
        private void ShowError(string message)
        {
            // Integrate with your error display system
            Debug.LogWarning($"[DailyRewardUI] {message}");
            // Example: ErrorPopup.Show(message);
        }

        /// <summary>
        /// Shows a purchase confirmation dialog.
        /// </summary>
        private async System.Threading.Tasks.Task<bool> ShowPurchaseConfirmation(string message, string price)
        {
            // Integrate with your confirmation dialog system
            // For now, return true (auto-confirm for testing)
            await System.Threading.Tasks.Task.Delay(100);
            return true;
        }
        #endregion
    }
}

