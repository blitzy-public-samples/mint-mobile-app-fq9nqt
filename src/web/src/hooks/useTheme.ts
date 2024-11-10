// React v18.0.0
import { useState, useEffect, useCallback } from 'react';
import { colors, createTheme, typography, breakpoints } from '../config/theme.config';

// Theme mode type definition
export type ThemeMode = 'light' | 'dark' | 'system' | 'high-contrast';

// Theme preferences interface
export interface ThemePreferences {
  mode: ThemeMode;
  fontSize: number;
  useSystemPreference: boolean;
  colorBlindMode: boolean;
}

// Default theme preferences
const DEFAULT_PREFERENCES: ThemePreferences = {
  mode: 'system',
  fontSize: 16, // Minimum font size of 16sp per accessibility requirements
  useSystemPreference: true,
  colorBlindMode: false,
};

// Local storage key for theme preferences
const THEME_STORAGE_KEY = 'mint-replica-theme-preferences';

/**
 * Custom hook for managing theme preferences with accessibility support
 * 
 * Requirements addressed:
 * - Mobile-First Design (Technical Specification/1.1 System Overview)
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 * - Accessibility Features (Technical Specification/8.1.8 Accessibility Features)
 */
export const useTheme = () => {
  // Initialize theme preferences from localStorage or defaults
  const [preferences, setPreferences] = useState<ThemePreferences>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure minimum font size is maintained
      return {
        ...parsed,
        fontSize: Math.max(parsed.fontSize, 16)
      };
    }
    return DEFAULT_PREFERENCES;
  });

  // System theme preference media query
  const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // Get effective theme mode based on preferences
  const getEffectiveThemeMode = useCallback((): ThemeMode => {
    if (!preferences.useSystemPreference || preferences.mode !== 'system') {
      return preferences.mode;
    }
    return systemThemeQuery.matches ? 'dark' : 'light';
  }, [preferences.useSystemPreference, preferences.mode]);

  // Create theme object based on current preferences
  const createThemeWithPreferences = useCallback(() => {
    const mode = getEffectiveThemeMode();
    const isHighContrast = mode === 'high-contrast';

    // High contrast color modifications for accessibility
    const highContrastColors = {
      primary: {
        ...colors.primary,
        500: '#0052CC', // Enhanced contrast primary color
      },
      neutral: {
        ...colors.neutral,
        900: '#000000', // Pure black for maximum contrast
        50: '#FFFFFF',  // Pure white for maximum contrast
      }
    };

    // Color blind friendly palette modifications
    const colorBlindColors = {
      ...colors,
      success: {
        ...colors.success,
        500: '#2E7D32', // Deuteranopia-friendly green
      },
      error: {
        ...colors.error,
        500: '#D32F2F', // Protanopia-friendly red
      },
      warning: {
        ...colors.warning,
        500: '#0288D1', // Tritanopia-friendly blue instead of yellow
      }
    };

    return createTheme({
      colors: preferences.colorBlindMode ? colorBlindColors : 
              isHighContrast ? highContrastColors : colors,
      typography: {
        ...typography,
        fontSize: {
          ...typography.fontSize,
          md: `${preferences.fontSize}px`,
        }
      },
      breakpoints: {
        ...breakpoints
      }
    });
  }, [preferences, getEffectiveThemeMode]);

  // Apply theme changes to document root
  const applyTheme = useCallback(() => {
    const theme = createThemeWithPreferences();
    const root = document.documentElement;

    // Apply CSS variables
    Object.entries(theme.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Apply theme mode class
    const mode = getEffectiveThemeMode();
    root.classList.remove('light', 'dark', 'high-contrast');
    root.classList.add(mode);

    // Apply color blind mode class
    root.classList.toggle('color-blind', preferences.colorBlindMode);

    // Apply base font size
    root.style.fontSize = `${preferences.fontSize}px`;
  }, [preferences, getEffectiveThemeMode, createThemeWithPreferences]);

  // Persist theme changes to localStorage
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preferences));
    applyTheme();
  }, [preferences, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (preferences.useSystemPreference && preferences.mode === 'system') {
        applyTheme();
      }
    };

    systemThemeQuery.addEventListener('change', handleSystemThemeChange);
    return () => {
      systemThemeQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [preferences.useSystemPreference, preferences.mode, applyTheme]);

  // Theme control functions
  const setTheme = useCallback((mode: ThemeMode) => {
    setPreferences(prev => ({ ...prev, mode }));
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light'
    }));
  }, []);

  const setFontSize = useCallback((size: number) => {
    setPreferences(prev => ({
      ...prev,
      fontSize: Math.max(size, 16) // Ensure minimum font size of 16sp
    }));
  }, []);

  const toggleSystemPreference = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      useSystemPreference: !prev.useSystemPreference
    }));
  }, []);

  const toggleColorBlindMode = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      colorBlindMode: !prev.colorBlindMode
    }));
  }, []);

  return {
    theme: preferences,
    setTheme,
    toggleTheme,
    setFontSize,
    toggleSystemPreference,
    toggleColorBlindMode
  };
};