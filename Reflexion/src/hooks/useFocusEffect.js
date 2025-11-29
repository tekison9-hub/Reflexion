/**
 * Custom useFocusEffect hook for state-based navigation
 * Mimics react-navigation's useFocusEffect behavior
 */

import { useEffect, useRef } from 'react';

/**
 * useFocusEffect hook that works with state-based navigation
 * @param {Function} callback - Function to call when screen is focused
 * @param {Array} deps - Dependencies array (optional)
 */
export function useFocusEffect(callback, deps = []) {
  const callbackRef = useRef(callback);
  
  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Run effect on mount and when dependencies change
  useEffect(() => {
    let isActive = true;
    
    const runCallback = () => {
      if (isActive && callbackRef.current) {
        const cleanup = callbackRef.current();
        return cleanup;
      }
    };
    
    const cleanup = runCallback();
    
    return () => {
      isActive = false;
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, deps);
}

export default useFocusEffect;

















