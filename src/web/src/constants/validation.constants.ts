/**
 * Human Tasks:
 * 1. Ensure password complexity requirements align with organization security policies
 * 2. Verify maximum amount limits are in sync with backend processing limits
 * 3. Confirm file size limits match infrastructure capacity
 */

// Addresses requirement: Input Validation (Technical Specification/9.2 Data Security/9.2.1 Data Classification)
// Defines validation rules for sensitive user input data
export const AUTH_VALIDATION = {
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
  EMAIL_PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
} as const;

// Addresses requirement: Form Validation (Technical Specification/8.1 User Interface Design)
// Defines validation rules for financial amounts
export const AMOUNT_VALIDATION = {
  MIN_AMOUNT: 0,
  MAX_AMOUNT: 999999999.99,
  DECIMAL_PLACES: 2
} as const;

// Addresses requirement: Form Validation (Technical Specification/8.1 User Interface Design)
// Defines validation rules for date ranges
export const DATE_VALIDATION = {
  MIN_DATE_RANGE_DAYS: 1,
  MAX_DATE_RANGE_DAYS: 365,
  BUDGET_MIN_DAYS: 7,
  BUDGET_MAX_DAYS: 365,
  GOAL_MIN_DAYS: 1,
  GOAL_MAX_DAYS: 3650
} as const;

// Addresses requirement: Form Validation (Technical Specification/8.1 User Interface Design)
// Defines validation rules for form inputs
export const FORM_VALIDATION = {
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_CATEGORY_LENGTH: 50,
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_FILE_TYPES: ['.jpg', '.jpeg', '.png', '.pdf'] as const
} as const;

// Addresses requirement: Input Validation (Technical Specification/9.2 Data Security/9.2.1 Data Classification)
// Defines validation rules for transaction data
export const TRANSACTION_VALIDATION = {
  MIN_DESCRIPTION_LENGTH: 3,
  MAX_DESCRIPTION_LENGTH: 200,
  CATEGORY_REQUIRED: true,
  DATE_REQUIRED: true,
  AMOUNT_REQUIRED: true
} as const;

// Addresses requirement: Form Validation (Technical Specification/8.1 User Interface Design)
// Defines validation rules for budget data
export const BUDGET_VALIDATION = {
  MIN_BUDGET_NAME_LENGTH: 3,
  MAX_BUDGET_NAME_LENGTH: 50,
  MIN_CATEGORIES: 1,
  MAX_CATEGORIES: 20,
  MIN_CATEGORY_AMOUNT: 0,
  MAX_CATEGORY_AMOUNT: 999999999.99
} as const;

// Addresses requirement: Form Validation (Technical Specification/8.1 User Interface Design)
// Defines validation rules for financial goals
export const GOAL_VALIDATION = {
  MIN_GOAL_NAME_LENGTH: 3,
  MAX_GOAL_NAME_LENGTH: 50,
  MIN_TARGET_AMOUNT: 1,
  MAX_TARGET_AMOUNT: 999999999.99,
  REQUIRE_TARGET_DATE: true
} as const;