using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace Reflexion.Tutorial
{
    /// <summary>
    /// Manages accessibility features including screen reader support and high-contrast mode.
    /// Ensures the tutorial is accessible to players with disabilities.
    /// </summary>
    public class AccessibilityManager : MonoBehaviour
    {
        #region Singleton
        private static AccessibilityManager _instance;

        /// <summary>
        /// Gets the singleton instance of AccessibilityManager.
        /// </summary>
        public static AccessibilityManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindObjectOfType<AccessibilityManager>();
                    if (_instance == null)
                    {
                        GameObject go = new GameObject("AccessibilityManager");
                        _instance = go.AddComponent<AccessibilityManager>();
                        DontDestroyOnLoad(go);
                    }
                }
                return _instance;
            }
        }
        #endregion

        #region Serialized Fields
        [Header("Screen Reader Settings")]
        [SerializeField] private bool screenReaderEnabled = true;
        [SerializeField] private float announcementDelay = 0.5f;
        [SerializeField] private bool verboseMode = false;
        
        [Header("High Contrast Settings")]
        [SerializeField] private bool highContrastEnabled = false;
        [SerializeField] private Color highContrastTextColor = Color.yellow;
        [SerializeField] private Color highContrastBackgroundColor = Color.black;
        [SerializeField] private Color highContrastButtonColor = new Color(1f, 0.5f, 0f);
        
        [Header("Font Scaling")]
        [SerializeField] private bool allowFontScaling = true;
        [SerializeField] private float fontScaleMultiplier = 1.0f;
        [SerializeField] private float minFontScale = 0.8f;
        [SerializeField] private float maxFontScale = 1.5f;
        #endregion

        #region Private Fields
        private Queue<string> _announcementQueue = new Queue<string>();
        private bool _isAnnouncing = false;
        private Coroutine _announcementCoroutine;
        private List<AccessibleUIElement> _registeredUIElements = new List<AccessibleUIElement>();
        #endregion

        #region Events
        public event System.Action<string> OnAnnouncement;
        public event System.Action<bool> OnHighContrastChanged;
        public event System.Action<float> OnFontScaleChanged;
        #endregion

        #region Properties
        /// <summary>
        /// Gets or sets whether screen reader is enabled.
        /// </summary>
        public bool IsScreenReaderEnabled
        {
            get => screenReaderEnabled;
            set
            {
                screenReaderEnabled = value;
                PlayerPrefs.SetInt("ScreenReaderEnabled", value ? 1 : 0);
                PlayerPrefs.Save();
            }
        }

        /// <summary>
        /// Gets or sets whether high contrast mode is enabled.
        /// </summary>
        public bool IsHighContrastEnabled
        {
            get => highContrastEnabled;
            set
            {
                highContrastEnabled = value;
                PlayerPrefs.SetInt("HighContrastEnabled", value ? 1 : 0);
                PlayerPrefs.Save();
                ApplyHighContrastMode(value);
                OnHighContrastChanged?.Invoke(value);
            }
        }

        /// <summary>
        /// Gets or sets the font scale multiplier.
        /// </summary>
        public float FontScaleMultiplier
        {
            get => fontScaleMultiplier;
            set
            {
                fontScaleMultiplier = Mathf.Clamp(value, minFontScale, maxFontScale);
                PlayerPrefs.SetFloat("FontScaleMultiplier", fontScaleMultiplier);
                PlayerPrefs.Save();
                ApplyFontScaling();
                OnFontScaleChanged?.Invoke(fontScaleMultiplier);
            }
        }
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

            LoadAccessibilitySettings();
        }

        private void Start()
        {
            ApplyAccessibilitySettings();
        }
        #endregion

        #region Initialization
        /// <summary>
        /// Loads saved accessibility settings from PlayerPrefs.
        /// </summary>
        private void LoadAccessibilitySettings()
        {
            screenReaderEnabled = PlayerPrefs.GetInt("ScreenReaderEnabled", 1) == 1;
            highContrastEnabled = PlayerPrefs.GetInt("HighContrastEnabled", 0) == 1;
            fontScaleMultiplier = PlayerPrefs.GetFloat("FontScaleMultiplier", 1.0f);
            fontScaleMultiplier = Mathf.Clamp(fontScaleMultiplier, minFontScale, maxFontScale);
        }

        /// <summary>
        /// Applies all accessibility settings.
        /// </summary>
        private void ApplyAccessibilitySettings()
        {
            if (highContrastEnabled)
            {
                ApplyHighContrastMode(true);
            }

            if (allowFontScaling && fontScaleMultiplier != 1.0f)
            {
                ApplyFontScaling();
            }
        }
        #endregion

        #region Screen Reader Methods
        /// <summary>
        /// Announces text to screen reader with optional delay.
        /// </summary>
        /// <param name="text">Text to announce.</param>
        /// <param name="immediate">If true, announce immediately without queueing.</param>
        public void Announce(string text, bool immediate = false)
        {
            if (!screenReaderEnabled || string.IsNullOrEmpty(text))
            {
                return;
            }

            if (immediate)
            {
                AnnounceImmediate(text);
            }
            else
            {
                _announcementQueue.Enqueue(text);
                
                if (!_isAnnouncing)
                {
                    _announcementCoroutine = StartCoroutine(ProcessAnnouncementQueue());
                }
            }
        }

        /// <summary>
        /// Announces text immediately, interrupting any current announcement.
        /// </summary>
        /// <param name="text">Text to announce.</param>
        public void AnnounceImmediate(string text)
        {
            if (!screenReaderEnabled || string.IsNullOrEmpty(text))
            {
                return;
            }

            // Clear queue and stop current announcement
            _announcementQueue.Clear();
            if (_announcementCoroutine != null)
            {
                StopCoroutine(_announcementCoroutine);
            }

            SendToScreenReader(text);
            OnAnnouncement?.Invoke(text);

            if (verboseMode)
            {
                Debug.Log($"[Screen Reader] {text}");
            }
        }

        /// <summary>
        /// Processes the announcement queue.
        /// </summary>
        private IEnumerator ProcessAnnouncementQueue()
        {
            _isAnnouncing = true;

            while (_announcementQueue.Count > 0)
            {
                string text = _announcementQueue.Dequeue();
                SendToScreenReader(text);
                OnAnnouncement?.Invoke(text);

                if (verboseMode)
                {
                    Debug.Log($"[Screen Reader] {text}");
                }

                yield return new WaitForSeconds(announcementDelay);
            }

            _isAnnouncing = false;
        }

        /// <summary>
        /// Sends text to the platform's native screen reader.
        /// </summary>
        /// <param name="text">Text to send.</param>
        private void SendToScreenReader(string text)
        {
            #if UNITY_IOS && !UNITY_EDITOR
            // iOS VoiceOver
            SendToVoiceOver(text);
            #elif UNITY_ANDROID && !UNITY_EDITOR
            // Android TalkBack
            SendToTalkBack(text);
            #elif UNITY_STANDALONE_WIN && !UNITY_EDITOR
            // Windows Narrator
            SendToNarrator(text);
            #else
            // Editor or unsupported platform - log to console
            Debug.Log($"[Screen Reader Simulation] {text}");
            #endif
        }

        #if UNITY_IOS && !UNITY_EDITOR
        /// <summary>
        /// Sends announcement to iOS VoiceOver.
        /// </summary>
        [System.Runtime.InteropServices.DllImport("__Internal")]
        private static extern void _AnnounceToVoiceOver(string text);
        
        private void SendToVoiceOver(string text)
        {
            _AnnounceToVoiceOver(text);
        }
        #endif

        #if UNITY_ANDROID && !UNITY_EDITOR
        /// <summary>
        /// Sends announcement to Android TalkBack.
        /// </summary>
        private void SendToTalkBack(string text)
        {
            using (AndroidJavaClass unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
            {
                AndroidJavaObject activity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity");
                activity.Call("runOnUiThread", new AndroidJavaRunnable(() =>
                {
                    using (AndroidJavaObject view = activity.Call<AndroidJavaObject>("findViewById", 
                        Android.R.Id.Content))
                    {
                        view.Call("announceForAccessibility", text);
                    }
                }));
            }
        }
        #endif

        #if UNITY_STANDALONE_WIN && !UNITY_EDITOR
        /// <summary>
        /// Sends announcement to Windows Narrator.
        /// </summary>
        [System.Runtime.InteropServices.DllImport("user32.dll", CharSet = System.Runtime.InteropServices.CharSet.Auto)]
        private static extern int SendMessage(int hWnd, int msg, int wParam, string lParam);
        
        private void SendToNarrator(string text)
        {
            const int HWND_BROADCAST = 0xFFFF;
            const int WM_SETTEXT = 0x000C;
            SendMessage(HWND_BROADCAST, WM_SETTEXT, 0, text);
        }
        #endif

        /// <summary>
        /// Clears the announcement queue.
        /// </summary>
        public void ClearAnnouncementQueue()
        {
            _announcementQueue.Clear();
            
            if (_announcementCoroutine != null)
            {
                StopCoroutine(_announcementCoroutine);
                _isAnnouncing = false;
            }
        }
        #endregion

        #region High Contrast Methods
        /// <summary>
        /// Applies or removes high contrast mode.
        /// </summary>
        /// <param name="enabled">Whether to enable high contrast.</param>
        private void ApplyHighContrastMode(bool enabled)
        {
            foreach (var element in _registeredUIElements)
            {
                if (element != null)
                {
                    element.ApplyHighContrast(enabled);
                }
            }

            // Apply to all Text components
            UpdateTextComponents(enabled);
            
            // Apply to all Image components
            UpdateImageComponents(enabled);
        }

        /// <summary>
        /// Updates all Text components for high contrast.
        /// </summary>
        /// <param name="highContrast">Whether high contrast is enabled.</param>
        private void UpdateTextComponents(bool highContrast)
        {
            TMPro.TextMeshProUGUI[] textComponents = FindObjectsOfType<TMPro.TextMeshProUGUI>();
            
            foreach (var text in textComponents)
            {
                if (highContrast)
                {
                    text.color = highContrastTextColor;
                    text.fontStyle = TMPro.FontStyles.Bold;
                }
                else
                {
                    // Reset to default (you may want to store original colors)
                    text.fontStyle = TMPro.FontStyles.Normal;
                }
            }
        }

        /// <summary>
        /// Updates all Image components for high contrast.
        /// </summary>
        /// <param name="highContrast">Whether high contrast is enabled.</param>
        private void UpdateImageComponents(bool highContrast)
        {
            Button[] buttons = FindObjectsOfType<Button>();
            
            foreach (var button in buttons)
            {
                Image image = button.GetComponent<Image>();
                if (image != null && highContrast)
                {
                    image.color = highContrastButtonColor;
                }
            }
        }
        #endregion

        #region Font Scaling Methods
        /// <summary>
        /// Applies font scaling to all registered UI elements.
        /// </summary>
        private void ApplyFontScaling()
        {
            if (!allowFontScaling)
            {
                return;
            }

            TMPro.TextMeshProUGUI[] textComponents = FindObjectsOfType<TMPro.TextMeshProUGUI>();
            
            foreach (var text in textComponents)
            {
                if (text.CompareTag("ScalableText")) // Only scale tagged text
                {
                    float originalSize = text.fontSize;
                    text.fontSize = originalSize * fontScaleMultiplier;
                }
            }
        }

        /// <summary>
        /// Increases font size.
        /// </summary>
        public void IncreaseFontSize()
        {
            FontScaleMultiplier += 0.1f;
        }

        /// <summary>
        /// Decreases font size.
        /// </summary>
        public void DecreaseFontSize()
        {
            FontScaleMultiplier -= 0.1f;
        }

        /// <summary>
        /// Resets font size to default.
        /// </summary>
        public void ResetFontSize()
        {
            FontScaleMultiplier = 1.0f;
        }
        #endregion

        #region UI Element Registration
        /// <summary>
        /// Registers a UI element for accessibility updates.
        /// </summary>
        /// <param name="element">The UI element to register.</param>
        public void RegisterUIElement(AccessibleUIElement element)
        {
            if (element != null && !_registeredUIElements.Contains(element))
            {
                _registeredUIElements.Add(element);
            }
        }

        /// <summary>
        /// Unregisters a UI element.
        /// </summary>
        /// <param name="element">The UI element to unregister.</param>
        public void UnregisterUIElement(AccessibleUIElement element)
        {
            if (element != null && _registeredUIElements.Contains(element))
            {
                _registeredUIElements.Remove(element);
            }
        }
        #endregion

        #region Public Utility Methods
        /// <summary>
        /// Detects if a screen reader is currently running on the device.
        /// </summary>
        /// <returns>True if a screen reader is detected.</returns>
        public bool IsScreenReaderActive()
        {
            #if UNITY_IOS && !UNITY_EDITOR
            return UnityEngine.iOS.Device.isVoiceOverRunning;
            #elif UNITY_ANDROID && !UNITY_EDITOR
            return IsAndroidTalkBackEnabled();
            #else
            return false;
            #endif
        }

        #if UNITY_ANDROID && !UNITY_EDITOR
        /// <summary>
        /// Checks if Android TalkBack is enabled.
        /// </summary>
        private bool IsAndroidTalkBackEnabled()
        {
            using (AndroidJavaClass unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
            {
                AndroidJavaObject activity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity");
                AndroidJavaObject context = activity.Call<AndroidJavaObject>("getApplicationContext");
                AndroidJavaObject accessibilityManager = context.Call<AndroidJavaObject>("getSystemService", 
                    "accessibility");
                return accessibilityManager.Call<bool>("isEnabled");
            }
        }
        #endif
        #endregion
    }

    /// <summary>
    /// Interface for UI elements that support accessibility features.
    /// </summary>
    public abstract class AccessibleUIElement : MonoBehaviour
    {
        /// <summary>
        /// Called when high contrast mode changes.
        /// </summary>
        /// <param name="enabled">Whether high contrast is enabled.</param>
        public abstract void ApplyHighContrast(bool enabled);

        protected virtual void OnEnable()
        {
            AccessibilityManager.Instance?.RegisterUIElement(this);
        }

        protected virtual void OnDisable()
        {
            AccessibilityManager.Instance?.UnregisterUIElement(this);
        }
    }
}

