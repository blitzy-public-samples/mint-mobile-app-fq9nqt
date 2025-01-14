/**
 * HUMAN TASKS:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards (minimum 4.5:1 for normal text)
 * 2. Test theme configuration with screen readers and assistive technologies
 * 3. Validate responsive breakpoints on actual devices
 * 4. Test color-blind mode with users having different types of color blindness
 */

// React v18.0.0
import React, { createContext, useContext } from 'react';
import { colors, createTheme, typography, breakpoints } from '../config/theme.config';
import { useTheme, ThemePreferences, ThemeMode } from '../hooks/useTheme';

// Theme context type definition
interface ThemeContextType {
  theme: ThemePreferences;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setFontSize: (size: number) => void;
  toggleSystemPreference: () => void;
  toggleColorBlindMode: () => void;
}

// Theme provider props interface
interface ThemeProviderProps {
  children: React.ReactNode;
}

// Create theme context with null initial value
const ThemeContext = createContext<ThemeContextType | null>(null);

/**
 * Theme Provider Component
 * 
 * Requirements addressed:
 * - Mobile-First Design (Technical Specification/1.1 System Overview)
 *   Implements responsive theme management supporting mobile-first design principles
 * 
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 *   Provides theme context matching UI design specifications including typography, colors, and spacing
 * 
 * - Accessibility Features (Technical Specification/8.1.8 Accessibility Features)
 *   Manages accessible theme preferences including high contrast mode support,
 *   minimum text size of 16sp, color-blind friendly palette, and focus indicators
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme hook with accessibility features
  const {
    theme,
    setTheme,
    toggleTheme,
    setFontSize,
    toggleSystemPreference,
    toggleColorBlindMode
  } = useTheme();

  // Create context value object with theme state and control functions
  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    setFontSize,
    toggleSystemPreference,
    toggleColorBlindMode
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to consume theme context with accessibility features
 * Throws error if used outside ThemeProvider
 */
export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }

  // Validate minimum font size requirement
  if (context.theme.fontSize < 16) {
    console.warn('Font size should not be less than 16sp for accessibility compliance');
    context.setFontSize(16);
  }

  return context;
};

// Export theme provider component and context hook
// export { ThemeMode };
export type { ThemePreferences, ThemeContextType };