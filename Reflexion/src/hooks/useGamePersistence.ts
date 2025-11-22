/**
 * ✅ USE GAME PERSISTENCE - Debounced Persistence Hook
 * 
 * Manages game state persistence with debounced disk writes.
 * UI updates immediately, disk writes happen after 1 second delay.
 * 
 * Features:
 * - Instant UI updates (optimistic updates)
 * - Debounced disk writes (1 second delay)
 * - Type-safe state management
 * - Automatic cleanup on unmount
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Type definitions
interface PersistenceConfig<T> {
  key: string;
  initialValue: T;
  debounceMs?: number; // Default: 1000ms
}

/**
 * useGamePersistence Hook
 * 
 * Provides debounced persistence for game state.
 * State updates are immediate in UI, but disk writes are debounced.
 * 
 * @param config - Configuration object with key, initialValue, and optional debounceMs
 * @returns [state, setState, isSaving] - State value, setter function, and saving status
 * 
 * @example
 * ```tsx
 * const [xp, setXP, isSaving] = useGamePersistence({
 *   key: '@reflexion_xp',
 *   initialValue: 0,
 *   debounceMs: 1000,
 * });
 * 
 * // Update XP - UI updates immediately
 * setXP(100);
 * // Disk write happens 1 second later
 * ```
 */
export function useGamePersistence<T>(
  config: PersistenceConfig<T>
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const { key, initialValue, debounceMs = 1000 } = config;

  // ✅ State management
  const [state, setState] = useState<T>(initialValue);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // ✅ Refs for debounce management
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<T | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // ✅ Load initial value from storage
  useEffect(() => {
    let isCancelled = false;

    const loadInitialValue = async () => {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored !== null && !isCancelled) {
          const parsed = JSON.parse(stored) as T;
          setState(parsed);
          console.log(`✅ Loaded ${key} from storage:`, parsed);
        }
      } catch (error: any) {
        console.warn(`⚠️ Failed to load ${key} from storage:`, error.message);
        // Use initialValue if loading fails
      }
    };

    loadInitialValue();

    return () => {
      isCancelled = true;
    };
  }, [key]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // ✅ Save pending value before unmount
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (pendingValueRef.current !== null) {
        // Save immediately on unmount
        AsyncStorage.setItem(key, JSON.stringify(pendingValueRef.current)).catch(
          (error: any) => {
            console.warn(`⚠️ Failed to save ${key} on unmount:`, error.message);
          }
        );
      }
    };
  }, [key]);

  // ✅ Debounced save function
  const saveToDisk = useCallback(
    async (value: T) => {
      if (!isMountedRef.current) {
        return;
      }

      setIsSaving(true);
      try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
        if (isMountedRef.current) {
          console.log(`✅ Saved ${key} to disk:`, value);
          setIsSaving(false);
        }
      } catch (error: any) {
        console.error(`❌ Failed to save ${key} to disk:`, error.message);
        if (isMountedRef.current) {
          setIsSaving(false);
        }
      }
    },
    [key]
  );

  // ✅ Setter function with debounced save
  const setStateWithPersistence = useCallback(
    (value: T | ((prev: T) => T)) => {
      // ✅ Update state immediately (optimistic update)
      setState((prevState) => {
        const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prevState) : value;
        
        // ✅ Clear existing debounce timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }

        // ✅ Store pending value
        pendingValueRef.current = newValue;

        // ✅ Set new debounce timer
        debounceTimerRef.current = setTimeout(() => {
          if (pendingValueRef.current !== null) {
            saveToDisk(pendingValueRef.current);
            pendingValueRef.current = null;
          }
          debounceTimerRef.current = null;
        }, debounceMs);

        return newValue;
      });
    },
    [debounceMs, saveToDisk]
  );

  return [state, setStateWithPersistence, isSaving];
}

/**
 * ✅ Specialized hook for XP persistence
 * 
 * Provides type-safe XP management with debounced persistence.
 */
export function useXPPersistence(): [number, (value: number | ((prev: number) => number)) => void, boolean] {
  return useGamePersistence<number>({
    key: '@reflexion_xp_v1',
    initialValue: 0,
    debounceMs: 1000,
  });
}

/**
 * ✅ Specialized hook for coins persistence
 * 
 * Provides type-safe coins management with debounced persistence.
 */
export function useCoinsPersistence(): [number, (value: number | ((prev: number) => number)) => void, boolean] {
  return useGamePersistence<number>({
    key: '@reflexion_coins_v1',
    initialValue: 0,
    debounceMs: 1000,
  });
}








