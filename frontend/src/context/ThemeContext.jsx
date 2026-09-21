import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themePreference, setThemePreference] = useState(() => {
    return localStorage.getItem('themePreference') || 'system';
  });

  useEffect(() => {
    localStorage.setItem('themePreference', themePreference);
    
    const applyTheme = () => {
      let activeTheme = themePreference;
      if (themePreference === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      if (activeTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    };

    applyTheme();

    if (themePreference === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themePreference]);

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};
