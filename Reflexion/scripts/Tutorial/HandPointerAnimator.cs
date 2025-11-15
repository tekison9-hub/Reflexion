using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace Reflexion.Tutorial
{
    /// <summary>
    /// Animates a hand pointer for tutorial guidance.
    /// Provides tap animations and smooth movement transitions.
    /// </summary>
    [RequireComponent(typeof(RectTransform))]
    public class HandPointerAnimator : MonoBehaviour
    {
        #region Serialized Fields
        [Header("Animation Settings")]
        [SerializeField] private float tapAnimationDuration = 0.3f;
        [SerializeField] private float tapScaleMultiplier = 0.8f;
        [SerializeField] private float idleBounceDuration = 1f;
        [SerializeField] private float idleBounceAmount = 10f;
        
        [Header("Movement Settings")]
        [SerializeField] private float movementSpeed = 500f;
        [SerializeField] private AnimationCurve movementCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);
        
        [Header("Visual Settings")]
        [SerializeField] private CanvasGroup canvasGroup;
        [SerializeField] private Image handImage;
        [SerializeField] private float fadeInDuration = 0.3f;
        #endregion

        #region Private Fields
        private RectTransform _rectTransform;
        private Vector2 _targetPosition;
        private Vector3 _originalScale;
        private Coroutine _tapAnimationCoroutine;
        private Coroutine _movementCoroutine;
        private Coroutine _idleAnimationCoroutine;
        private bool _isAnimating;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            _rectTransform = GetComponent<RectTransform>();
            
            if (canvasGroup == null)
            {
                canvasGroup = GetComponent<CanvasGroup>();
                if (canvasGroup == null)
                {
                    canvasGroup = gameObject.AddComponent<CanvasGroup>();
                }
            }

            _originalScale = transform.localScale;
            _targetPosition = _rectTransform.anchoredPosition;
        }

        private void OnEnable()
        {
            StartCoroutine(FadeIn());
        }

        private void OnDisable()
        {
            StopAllCoroutines();
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// Moves the hand pointer to a specific screen position.
        /// </summary>
        /// <param name="screenPosition">Target screen position.</param>
        public void MoveToPosition(Vector2 screenPosition)
        {
            _targetPosition = screenPosition;

            if (_movementCoroutine != null)
            {
                StopCoroutine(_movementCoroutine);
            }

            _movementCoroutine = StartCoroutine(MoveToPositionCoroutine(screenPosition));
        }

        /// <summary>
        /// Plays a single tap animation at the current position.
        /// </summary>
        public void PlayTapAnimation()
        {
            if (_tapAnimationCoroutine != null)
            {
                StopCoroutine(_tapAnimationCoroutine);
            }

            _tapAnimationCoroutine = StartCoroutine(TapAnimationCoroutine());
        }

        /// <summary>
        /// Starts the continuous tap animation loop.
        /// </summary>
        public void StartTapAnimation()
        {
            StartCoroutine(ContinuousTapAnimation());
        }

        /// <summary>
        /// Stops all animations.
        /// </summary>
        public void StopAnimations()
        {
            _isAnimating = false;
            StopAllCoroutines();
        }

        /// <summary>
        /// Shows the hand pointer with fade-in effect.
        /// </summary>
        public void Show()
        {
            gameObject.SetActive(true);
            StartCoroutine(FadeIn());
        }

        /// <summary>
        /// Hides the hand pointer with fade-out effect.
        /// </summary>
        public async void Hide()
        {
            await FadeOut();
            gameObject.SetActive(false);
        }
        #endregion

        #region Private Methods - Animations
        /// <summary>
        /// Fades in the hand pointer.
        /// </summary>
        private IEnumerator FadeIn()
        {
            float elapsed = 0f;
            canvasGroup.alpha = 0f;

            while (elapsed < fadeInDuration)
            {
                elapsed += Time.deltaTime;
                canvasGroup.alpha = Mathf.Lerp(0f, 1f, elapsed / fadeInDuration);
                yield return null;
            }

            canvasGroup.alpha = 1f;
        }

        /// <summary>
        /// Fades out the hand pointer.
        /// </summary>
        private async System.Threading.Tasks.Task FadeOut()
        {
            float elapsed = 0f;
            float duration = fadeInDuration;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                canvasGroup.alpha = Mathf.Lerp(1f, 0f, elapsed / duration);
                await System.Threading.Tasks.Task.Yield();
            }

            canvasGroup.alpha = 0f;
        }

        /// <summary>
        /// Animates movement to target position.
        /// </summary>
        /// <param name="targetPosition">Target position.</param>
        private IEnumerator MoveToPositionCoroutine(Vector2 targetPosition)
        {
            Vector2 startPosition = _rectTransform.anchoredPosition;
            float distance = Vector2.Distance(startPosition, targetPosition);
            float duration = distance / movementSpeed;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = movementCurve.Evaluate(elapsed / duration);
                _rectTransform.anchoredPosition = Vector2.Lerp(startPosition, targetPosition, t);
                yield return null;
            }

            _rectTransform.anchoredPosition = targetPosition;
            
            // Start idle animation after reaching position
            StartIdleAnimation();
        }

        /// <summary>
        /// Performs a single tap animation (scale down and up).
        /// </summary>
        private IEnumerator TapAnimationCoroutine()
        {
            float elapsed = 0f;
            float halfDuration = tapAnimationDuration / 2f;

            // Scale down
            while (elapsed < halfDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / halfDuration;
                transform.localScale = Vector3.Lerp(_originalScale, _originalScale * tapScaleMultiplier, t);
                yield return null;
            }

            // Scale up
            elapsed = 0f;
            while (elapsed < halfDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / halfDuration;
                transform.localScale = Vector3.Lerp(_originalScale * tapScaleMultiplier, _originalScale, t);
                yield return null;
            }

            transform.localScale = _originalScale;
        }

        /// <summary>
        /// Continuous tap animation that loops.
        /// </summary>
        private IEnumerator ContinuousTapAnimation()
        {
            _isAnimating = true;

            while (_isAnimating && gameObject.activeInHierarchy)
            {
                yield return TapAnimationCoroutine();
                yield return new WaitForSeconds(0.5f); // Pause between taps
            }
        }

        /// <summary>
        /// Starts subtle idle bounce animation.
        /// </summary>
        private void StartIdleAnimation()
        {
            if (_idleAnimationCoroutine != null)
            {
                StopCoroutine(_idleAnimationCoroutine);
            }

            _idleAnimationCoroutine = StartCoroutine(IdleBouncingAnimation());
        }

        /// <summary>
        /// Idle bouncing animation when hand is stationary.
        /// </summary>
        private IEnumerator IdleBouncingAnimation()
        {
            Vector2 basePosition = _rectTransform.anchoredPosition;
            float elapsed = 0f;

            while (gameObject.activeInHierarchy)
            {
                elapsed += Time.deltaTime;
                float bounce = Mathf.Sin(elapsed / idleBounceDuration * Mathf.PI * 2f) * idleBounceAmount;
                _rectTransform.anchoredPosition = basePosition + new Vector2(0, bounce);
                yield return null;
            }
        }
        #endregion

        #region Public Utility Methods
        /// <summary>
        /// Sets the hand pointer sprite.
        /// </summary>
        /// <param name="sprite">The sprite to set.</param>
        public void SetHandSprite(Sprite sprite)
        {
            if (handImage != null)
            {
                handImage.sprite = sprite;
            }
        }

        /// <summary>
        /// Sets the hand pointer color.
        /// </summary>
        /// <param name="color">The color to set.</param>
        public void SetHandColor(Color color)
        {
            if (handImage != null)
            {
                handImage.color = color;
            }
        }
        #endregion
    }
}

