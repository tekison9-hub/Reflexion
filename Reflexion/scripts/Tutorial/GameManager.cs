using UnityEngine;

namespace Reflexion.Tutorial
{
    /// <summary>
    /// Main game manager for Reflexion game.
    /// This is a stub - integrate with your existing GameManager.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        #region Singleton
        private static GameManager _instance;

        /// <summary>
        /// Gets the singleton instance of GameManager.
        /// </summary>
        public static GameManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindObjectOfType<GameManager>();
                }
                return _instance;
            }
        }
        #endregion

        #region Private Fields
        private int _playerCoins = 0;
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
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// Adds coins to the player's balance.
        /// </summary>
        /// <param name="amount">Amount of coins to add.</param>
        public void AddCoins(int amount)
        {
            _playerCoins += amount;
            Debug.Log($"[GameManager] Added {amount} coins. Total: {_playerCoins}");
        }

        /// <summary>
        /// Starts the main game.
        /// </summary>
        public void StartGame()
        {
            Debug.Log("[GameManager] Starting game...");
            // Implement your game start logic here
        }
        #endregion
    }
}

