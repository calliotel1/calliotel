import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DarkModeToggle = ({ showLabel = true }) => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full"
    >
      <div className={`p-2 rounded-full ${darkMode ? 'bg-blue-100 dark:bg-blue-900' : 'bg-yellow-100'}`}>
        {darkMode ? (
          <Moon className="w-5 h-5 text-ember dark:text-blue-400" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-600" />
        )}
      </div>
      
      {showLabel && (
        <div className="flex-1 text-left">
          <p className="font-semibold text-gray-900 dark:text-white">
            {darkMode ? '🌑 Tactical View' : 'Light Mode'}
          </p>
          <p className="text-sm text-gray-600 dark:text-ember">
            {darkMode ? 'Obsidian warfare mode active' : 'Switch to Tactical View'}
          </p>
        </div>
      )}
      
      <div className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
        darkMode ? 'bg-ember' : 'bg-gray-300'
      }`}>
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
            darkMode ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </div>
    </button>
  );
};

export default DarkModeToggle;
