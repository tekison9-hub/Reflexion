/**
 * REFLEXION - Safe Access Utilities
 * Prevents "Cannot read property 'X' of undefined" errors
 */

/**
 * Safely get a property from an object
 * @param {Object} obj - The object to access
 * @param {string} property - The property name
 * @param {any} defaultValue - Default value if access fails
 * @returns {any} The property value or default
 */
export function safeGet(obj, property, defaultValue = undefined) {
  try {
    if (!obj || typeof obj !== 'object') {
      return defaultValue;
    }
    return obj[property] !== undefined ? obj[property] : defaultValue;
  } catch (error) {
    console.warn(`⚠️ safeGet failed for property "${property}":`, error);
    return defaultValue;
  }
}

/**
 * Safely call a method on an object
 * @param {Object} obj - The object containing the method
 * @param {string} method - The method name
 * @param {Array} args - Arguments to pass to the method
 * @param {any} defaultValue - Default value if call fails
 * @returns {any} The method result or default
 */
export function safeCall(obj, method, args = [], defaultValue = undefined) {
  try {
    if (!obj || typeof obj !== 'object') {
      return defaultValue;
    }
    if (typeof obj[method] !== 'function') {
      return defaultValue;
    }
    return obj[method](...args);
  } catch (error) {
    console.warn(`⚠️ safeCall failed for method "${method}":`, error);
    return defaultValue;
  }
}

/**
 * Safely get from a Map-like structure
 * @param {Map|Object} container - Map or object
 * @param {any} key - The key to access
 * @param {any} defaultValue - Default value if access fails
 * @returns {any} The value or default
 */
export function safeMapGet(container, key, defaultValue = undefined) {
  try {
    if (!container) {
      return defaultValue;
    }
    
    // If it's a Map
    if (container instanceof Map && typeof container.get === 'function') {
      return container.has(key) ? container.get(key) : defaultValue;
    }
    
    // If it's a plain object
    if (typeof container === 'object') {
      return container[key] !== undefined ? container[key] : defaultValue;
    }
    
    return defaultValue;
  } catch (error) {
    console.warn(`⚠️ safeMapGet failed for key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Check if object and method exist before calling
 * @param {Object} obj - The object
 * @param {string} method - The method name
 * @returns {boolean} True if safe to call
 */
export function canCall(obj, method) {
  return obj && typeof obj === 'object' && typeof obj[method] === 'function';
}

/**
 * Check if object and property exist
 * @param {Object} obj - The object
 * @param {string} property - The property name
 * @returns {boolean} True if property exists
 */
export function hasProperty(obj, property) {
  return obj && typeof obj === 'object' && property in obj;
}

