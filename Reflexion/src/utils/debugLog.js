/**
 * CRITICAL FIX: Debug Logging Helper (DEV mode only)
 * Logs game events for debugging and analytics
 */

const __DEV__ = process.env.NODE_ENV !== 'production';

export function debugLog(event, data = {}) {
  if (!__DEV__) return; // Only log in development

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    data,
  };

  // Console log with emoji for easy filtering
  const emoji = getEventEmoji(event);
  console.log(`${emoji} [DEBUG] ${event}:`, data);

  // TODO: In production, send to analytics service
  // analytics.track(event, data);
}

function getEventEmoji(event) {
  const emojiMap = {
    GameStart: '🎮',
    GameEnd: '🏁',
    ThemeChange: '🎨',
    SettingsChange: '⚙️',
    SpawnEvent: '✨',
    ErrorEvent: '❌',
    LevelUp: '🎉',
    Purchase: '💰',
    Achievement: '🏆',
    DataMigration: '🔄',
  };
  return emojiMap[event] || '📝';
}

// Convenience functions for common events
export const debugEvents = {
  gameStart: (mode, level) => debugLog('GameStart', { mode, level }),
  gameEnd: (score, accuracy, combo, xpGain) => debugLog('GameEnd', { score, accuracy, combo, xpGain }),
  themeChange: (newTheme) => debugLog('ThemeChange', { newTheme }),
  settingsChange: (sfx, vibration) => debugLog('SettingsChange', { sfx, vibration }),
  spawnEvent: (targetType, pos) => debugLog('SpawnEvent', { targetType, pos }),
  errorEvent: (error) => debugLog('ErrorEvent', { 
    message: error?.message || 'Unknown error',
    stack: error?.stack || 'No stack trace',
  }),
  levelUp: (level, xp) => debugLog('LevelUp', { level, xp }),
  purchase: (item, cost) => debugLog('Purchase', { item, cost }),
  achievement: (achievementId) => debugLog('Achievement', { achievementId }),
};

