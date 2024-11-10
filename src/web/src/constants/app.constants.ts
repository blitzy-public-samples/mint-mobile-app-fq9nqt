/**
 * Core application constants and configuration values for the Mint Replica Lite web application
 * Implements requirements from:
 * - System Configuration (Technical Specification/5.3.1 Frontend Technologies)
 * - UI Design System (Technical Specification/8.1 User Interface Design)
 * - Core Features (Technical Specification/1.2 Scope/Core Features)
 */

import { AccountType, BudgetPeriod } from '../types/models.types';

// Core application configuration
export const APP_CONFIG = {
  name: 'Mint Replica Lite',
  version: '1.0.0',
  minPasswordLength: 12,
  maxPasswordLength: 128,
  sessionTimeout: 900000, // 15 minutes in milliseconds
  maxLoginAttempts: 5,
  defaultLocale: 'en-US',
  defaultCurrency: 'USD',
  defaultTimezone: 'UTC'
} as const;

// UI layout and design system constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 280, // pixels
  HEADER_HEIGHT: 64, // pixels
  FOOTER_HEIGHT: 48, // pixels
  MOBILE_BREAKPOINT: 768, // pixels
  TABLET_BREAKPOINT: 1024, // pixels
  DESKTOP_BREAKPOINT: 1280, // pixels
  ANIMATION_DURATION: 300, // milliseconds
  TOAST_DURATION: 3000, // milliseconds
  MODAL_Z_INDEX: 1000,
  TOAST_Z_INDEX: 2000
} as const;

// API and network related constants
export const API_CONSTANTS = {
  REQUEST_TIMEOUT: 30000, // 30 seconds in milliseconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second in milliseconds
  MAX_BATCH_SIZE: 100,
  CACHE_DURATION: 300000 // 5 minutes in milliseconds
} as const;

// Feature flag constants
export const FEATURE_FLAGS = {
  ENABLE_BIOMETRICS: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_DATA_EXPORT: true,
  ENABLE_BETA_FEATURES: false
} as const;

// Input validation constants
export const VALIDATION_CONSTANTS = {
  MAX_FILE_SIZE: 5242880, // 5MB in bytes
  MAX_ACCOUNTS: 10,
  MAX_BUDGETS: 20,
  MAX_GOALS: 10,
  MAX_TRANSACTIONS_PER_PAGE: 50,
  MIN_TRANSACTION_AMOUNT: 0.01,
  MAX_TRANSACTION_AMOUNT: 1000000 // $1M limit
} as const;

// Standardized error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please try again.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.'
} as const;

// Account type constants matching AccountType enum
export const ACCOUNT_TYPES: Record<AccountType, AccountType> = {
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  CREDIT: 'CREDIT',
  INVESTMENT: 'INVESTMENT',
  LOAN: 'LOAN'
} as const;

// Budget period constants matching BudgetPeriod enum
export const BUDGET_PERIODS: Record<BudgetPeriod, BudgetPeriod> = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY'
} as const;