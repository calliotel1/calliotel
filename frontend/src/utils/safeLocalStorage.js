/**
 * Safe localStorage wrapper for incognito/private browsing modes
 * where localStorage might be blocked or throw exceptions
 */

const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`localStorage.getItem blocked for key "${key}":`, e.message);
      return null;
    }
  },
  
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage.setItem blocked for key "${key}":`, e.message);
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`localStorage.removeItem blocked for key "${key}":`, e.message);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('localStorage.clear blocked:', e.message);
    }
  }
};

export default safeLocalStorage;
