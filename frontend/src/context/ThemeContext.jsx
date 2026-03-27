import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first
    const saved = safeLocalStorage.getItem('darkMode');
    return saved === 'true';
  });
  const [loading, setLoading] = useState(true);

  // Load theme settings from backend on mount
  useEffect(() => {
    loadThemeSettings();
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save to localStorage
    safeLocalStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const loadThemeSettings = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API}/theme/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDarkMode(response.data.settings.dark_mode);
      }
    } catch (error) {
      console.error('Failed to load theme settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = async () => {
    const newValue = !darkMode;
    setDarkMode(newValue);

    // Save to backend
    try {
      const token = safeLocalStorage.getItem('token');
      if (token) {
        await axios.post(
          `${API}/theme/update`,
          { dark_mode: newValue, theme_color: 'purple' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error('Failed to save theme settings:', error);
    }
  };

  const value = {
    darkMode,
    toggleDarkMode,
    loading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
