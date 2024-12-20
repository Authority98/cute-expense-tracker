import React from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';

function DarkModeToggle({ darkMode, toggleDarkMode }) {
  return (
    <button 
      onClick={toggleDarkMode} 
      className="dark-mode-toggle"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? <FaSun /> : <FaMoon />}
    </button>
  );
}

export default DarkModeToggle;
