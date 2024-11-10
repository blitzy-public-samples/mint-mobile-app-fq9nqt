/**
 * Core application configuration and environment settings for the Mint Replica Lite web application
 * Implements requirements from:
 * - System Configuration (Technical Specification/5.3.1 Frontend Technologies)
 * - Security Configuration (Technical Specification/9.1 Authentication and Authorization)
 * - UI Design System (Technical Specification/8.1 User Interface Design)
 */

// @version: process.env ^16.0.0

import { AccountType, BudgetPeriod } from '../types/models.types';
import { APP_CONFIG as APP_CONSTANTS } from '../constants/app.constants';

// Human Tasks:
// 1. Ensure environment variables are properly configured in .env file
// 2. Verify API endpoints in deployment environment
// 3. Review and adjust security timeouts for production environment
// 4. Configure CDN endpoints for static assets if used
// 5. Set up monitoring for API health checks

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  VERSION: 'v1',
  MAX_BATCH_SIZE: 100,
  CACHE_DURATION: 300000, // 5 minutes
  ENDPOINTS: {
    AUTH: '/auth',
    ACCOUNTS: '/accounts',
    TRANSACTIONS: '/transactions',
    BUDGETS: '/budgets',
    GOALS: '/goals',
    INVESTMENTS: '/investments'
  }
} as const;

// Authentication and Security Configuration
export const AUTH_CONFIG = {
  SESSION_TIMEOUT: 900000, // 15 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  MIN_PASSWORD_LENGTH: 12,
  MAX_PASSWORD_LENGTH: 128,
  PASSWORD_RULES: {
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    minLength: 12
  },
  TOKEN_REFRESH_THRESHOLD: 300000, // 5 minutes
  BIOMETRIC_TIMEOUT: 300000, // 5 minutes
  MAX_DEVICES: 3,
  TOKEN_STORAGE_KEY: 'mint_replica_token',
  REFRESH_TOKEN_STORAGE_KEY: 'mint_replica_refresh_token'
} as const;

// UI Configuration
export const UI_CONFIG = {
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1280,
    WIDE: 1440
  },
  LAYOUT: {
    SIDEBAR_WIDTH: 280,
    HEADER_HEIGHT: 64,
    FOOTER_HEIGHT: 48,
    CONTAINER_MAX_WIDTH: 1200,
    GRID_COLUMNS: 12,
    GRID_GAP: 16
  },
  ANIMATION: {
    DURATION: 300,
    EASING: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  TOAST: {
    DURATION: 3000,
    Z_INDEX: 2000
  },
  MODAL: {
    Z_INDEX: 1000,
    BACKDROP_OPACITY: 0.5
  },
  TOUCH: {
    MIN_TARGET_SIZE: 44
  }
} as const;

/**
 * Retrieves environment-specific configuration based on current environment
 * Implements System Configuration requirements (Technical Specification/5.3.1)
 */
export const getEnvironmentConfig = (): Record<string, any> => {
  const environment = process.env.NODE_ENV || 'development';
  const config = {
    appName: APP_CONSTANTS.name,
    appVersion: APP_CONSTANTS.version,
    environment,
    apiUrl: API_CONFIG.BASE_URL,
    isProduction: environment === 'production',
    isDevelopment: environment === 'development',
    isTest: environment === 'test',
    features: {
      enableAnalytics: environment === 'production',
      enableDebugLogging: environment !== 'production',
      enableServiceWorker: environment === 'production',
      enablePushNotifications: environment === 'production'
    }
  };

  validateConfig();
  return config;
};

/**
 * Validates required configuration settings and environment variables
 * Implements Security Configuration requirements (Technical Specification/9.1)
 */
export const validateConfig = (): boolean => {
  const requiredEnvVars = [
    'NODE_ENV',
    'REACT_APP_API_URL'
  ];

  // Validate required environment variables
  const missingEnvVars = requiredEnvVars.filter(
    envVar => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
  }

  // Validate API configuration
  if (!API_CONFIG.BASE_URL) {
    throw new Error('API base URL is required');
  }

  // Validate authentication settings
  if (AUTH_CONFIG.SESSION_TIMEOUT < 300000) { // Minimum 5 minutes
    throw new Error('Session timeout must be at least 5 minutes');
  }

  if (AUTH_CONFIG.MIN_PASSWORD_LENGTH < 12) {
    throw new Error('Minimum password length must be at least 12 characters');
  }

  // Validate UI configuration
  if (UI_CONFIG.BREAKPOINTS.MOBILE > UI_CONFIG.BREAKPOINTS.TABLET) {
    throw new Error('Mobile breakpoint must be smaller than tablet breakpoint');
  }

  if (UI_CONFIG.BREAKPOINTS.TABLET > UI_CONFIG.BREAKPOINTS.DESKTOP) {
    throw new Error('Tablet breakpoint must be smaller than desktop breakpoint');
  }

  return true;
};

// Export configuration object with all settings
export const config = {
  API_CONFIG,
  AUTH_CONFIG,
  UI_CONFIG,
  getEnvironmentConfig,
  validateConfig
};

export default config;