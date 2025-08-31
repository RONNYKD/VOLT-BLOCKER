/**
 * Theme Provider - Provides theme context throughout the app
 */
import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/settings';
import { colors, lightThemeColors, darkThemeColors } from './colors';

export interface ThemeContextType {
  isDark: boolean;
  theme: 'light' | 'dark';
  colors: typeof lightThemeColors;
  rawColors: typeof colors;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const { theme: userTheme, setTheme: setUserTheme } = useSettingsStore();

  // Determine the actual theme to use
  const isDark = userTheme === 'system' 
    ? systemColorScheme === 'dark'
    : userTheme === 'dark';

  const theme = isDark ? 'dark' : 'light';
  const themeColors = isDark ? darkThemeColors : lightThemeColors;

  const toggleTheme = () => {
    const newTheme = userTheme === 'light' ? 'dark' : 'light';
    setUserTheme(newTheme);
  };

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setUserTheme(newTheme);
  };

  const contextValue: ThemeContextType = {
    isDark,
    theme,
    colors: themeColors,
    rawColors: colors,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};