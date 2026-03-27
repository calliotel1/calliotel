import { useEffect } from 'react';

/**
 * Version Check Hook - Forces clean localStorage on version updates
 * Fixes the "incognito only" bug by clearing stale data
 */
export const useVersionCheck = () => {
  useEffect(() => {
    const CURRENT_VERSION = 'v1.0.1_fortress';
    const savedVersion = localStorage.getItem('app_version');

    // Check for version mismatch
    if (savedVersion !== CURRENT_VERSION) {
      console.log('🚀 Version mismatch detected. Performing global reset...');
      console.log(`Old version: ${savedVersion || 'none'}, New version: ${CURRENT_VERSION}`);
      
      // Clear all localStorage and sessionStorage
      const itemsToKeep = []; // Add any items you want to preserve
      
      if (itemsToKeep.length > 0) {
        // Preserve specific items
        const preserved = {};
        itemsToKeep.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) preserved[key] = value;
        });
        
        localStorage.clear();
        sessionStorage.clear();
        
        // Restore preserved items
        Object.entries(preserved).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
      } else {
        // Clear everything
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Set new version
      localStorage.setItem('app_version', CURRENT_VERSION);
      
      console.log('✅ Reset complete. New version set:', CURRENT_VERSION);
      
      // Force reload to ensure clean state
      window.location.reload();
    }
  }, []);
};

export default useVersionCheck;
