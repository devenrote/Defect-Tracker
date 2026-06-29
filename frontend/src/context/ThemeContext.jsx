import { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const theme = 'light';
  const toggleTheme = () => {
    // Locked to light theme by request
  };

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    root.classList.remove('dark');
    body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
