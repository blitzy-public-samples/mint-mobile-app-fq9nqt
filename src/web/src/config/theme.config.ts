// @ts-check

/**
 * HUMAN TASKS:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards (minimum 4.5:1 for normal text)
 * 2. Test theme configuration with screen readers and assistive technologies
 * 3. Validate responsive breakpoints on actual devices
 */

// @types/react v18.0.0
import { Color } from '@types/react';

// Type definitions for theme configuration
type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

type FontFamilyConfig = {
  sans: string;
  mono: string;
};

type FontSizeConfig = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
};

type FontWeightConfig = {
  normal: string;
  medium: string;
  semibold: string;
  bold: string;
};

type LineHeightConfig = {
  tight: string;
  normal: string;
  relaxed: string;
};

type SpacingConfig = {
  [key: string]: string;
};

type BreakpointConfig = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
};

type ShadowConfig = {
  sm: string;
  md: string;
  lg: string;
  xl: string;
};

type ThemeOptions = Partial<{
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  breakpoints: typeof breakpoints;
  shadows: typeof shadows;
}>;

// Requirement: User Interface Design - Color Palette Configuration
export const colors = {
  primary: {
    50: '#E6F6FF',
    100: '#BAE3FF',
    200: '#7CC4FA',
    300: '#47A3F3',
    400: '#2186EB',
    500: '#0967D2', // Primary brand color
    600: '#0552B5',
    700: '#03449E',
    800: '#01337D',
    900: '#002159'
  } as ColorScale,

  neutral: {
    50: '#F5F7FA',
    100: '#E4E7EB',
    200: '#CBD2D9',
    300: '#9AA5B1',
    400: '#7B8794',
    500: '#616E7C',
    600: '#52606D',
    700: '#3E4C59',
    800: '#323F4B',
    900: '#1F2933'
  } as ColorScale,

  success: {
    50: '#E3F9E5',
    100: '#C1F2C7',
    200: '#91E697',
    300: '#51CA58',
    400: '#31B237',
    500: '#18981D',
    600: '#0F8613',
    700: '#0A6F0D',
    800: '#035F07',
    900: '#014807'
  } as ColorScale,

  warning: {
    50: '#FFF9E6',
    100: '#FFEDB3',
    200: '#FFE083',
    300: '#FFD24D',
    400: '#FFC726',
    500: '#FFBB00',
    600: '#E6A800',
    700: '#CC9600',
    800: '#B38300',
    900: '#996F00'
  } as ColorScale,

  error: {
    50: '#FFE3E3',
    100: '#FFBDBD',
    200: '#FF9B9B',
    300: '#F86A6A',
    400: '#EF4E4E',
    500: '#E12D39',
    600: '#CF1124',
    700: '#AB091E',
    800: '#8A041A',
    900: '#610316'
  } as ColorScale
};

// Requirement: User Interface Design - Typography Configuration
export const typography = {
  fontFamily: {
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
  } as FontFamilyConfig,

  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    md: '1rem',       // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem'  // 36px
  } as FontSizeConfig,

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  } as FontWeightConfig,

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75'
  } as LineHeightConfig
};

// Requirement: Mobile-First Design - Spacing Configuration
export const spacing = {
  values: {
    '0': '0',
    '1': '0.25rem',   // 4px
    '2': '0.5rem',    // 8px
    '3': '0.75rem',   // 12px
    '4': '1rem',      // 16px
    '5': '1.25rem',   // 20px
    '6': '1.5rem',    // 24px
    '8': '2rem',      // 32px
    '10': '2.5rem',   // 40px
    '12': '3rem',     // 48px
    '16': '4rem',     // 64px
    '20': '5rem'      // 80px
  } as SpacingConfig
};

// Requirement: Mobile-First Design - Responsive Breakpoints
export const breakpoints = {
  values: {
    xs: '320px',    // Small mobile devices
    sm: '640px',    // Large mobile devices
    md: '768px',    // Tablets
    lg: '1024px',   // Small laptops
    xl: '1280px',   // Large laptops
    '2xl': '1536px' // Desktop monitors
  } as BreakpointConfig
};

// Requirement: User Interface Design - Shadow Configuration
export const shadows = {
  values: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  } as ShadowConfig
};

// Requirement: Accessibility Features - Theme Creation with Validation
export function createTheme(options: ThemeOptions = {}) {
  // Merge default theme with provided options
  const theme = {
    colors: { ...colors, ...options.colors },
    typography: { ...typography, ...options.typography },
    spacing: { ...spacing, ...options.spacing },
    breakpoints: { ...breakpoints, ...options.breakpoints },
    shadows: { ...shadows, ...options.shadows }
  };

  // Validate color contrast ratios for accessibility
  const validateColorContrast = (color1: string, color2: string): boolean => {
    // Convert hex to relative luminance using WCAG formula
    const getLuminance = (hex: string): number => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = ((rgb >> 16) & 0xff) / 255;
      const g = ((rgb >> 8) & 0xff) / 255;
      const b = (rgb & 0xff) / 255;
      
      const toLinear = (c: number): number => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    };

    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    
    return ratio >= 4.5; // WCAG 2.1 AA standard for normal text
  };

  // Generate CSS custom properties
  const generateCssVariables = () => {
    const variables: Record<string, string> = {};
    
    // Colors
    Object.entries(theme.colors).forEach(([key, scale]) => {
      Object.entries(scale).forEach(([shade, value]) => {
        variables[`--color-${key}-${shade}`] = value;
      });
    });

    // Typography
    Object.entries(theme.typography).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          variables[`--${key}-${subKey}`] = subValue;
        });
      }
    });

    // Spacing
    Object.entries(theme.spacing.values).forEach(([key, value]) => {
      variables[`--spacing-${key}`] = value;
    });

    return variables;
  };

  return {
    ...theme,
    cssVariables: generateCssVariables(),
    utils: {
      validateColorContrast
    }
  };
}

// Default theme configuration
export const defaultTheme = createTheme();