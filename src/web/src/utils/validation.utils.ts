// Human Tasks:
// 1. Verify password complexity requirements match security policies
// 2. Ensure amount validation limits align with backend processing
// 3. Review date range restrictions for business requirements
// 4. Confirm email validation pattern meets RFC standards

import { AUTH_VALIDATION, AMOUNT_VALIDATION, DATE_VALIDATION, FORM_VALIDATION, 
         TRANSACTION_VALIDATION, BUDGET_VALIDATION, GOAL_VALIDATION } from '../constants/validation.constants';
import { User } from '../types/models.types';

/**
 * Validates password against security requirements
 * Addresses requirement: Password Security (Technical Specification/9.1.1 Authentication Methods)
 */
export const validatePassword = (password: string): boolean => {
  if (!password || password.length < AUTH_VALIDATION.PASSWORD_MIN_LENGTH) {
    return false;
  }
  return AUTH_VALIDATION.PASSWORD_PATTERN.test(password);
};

/**
 * Validates email format using RFC compliant pattern
 * Addresses requirement: Input Validation (Technical Specification/9.2 Data Security/9.2.1 Data Classification)
 */
export const validateEmail = (email: string): boolean => {
  if (!email || email.length === 0) {
    return false;
  }
  return AUTH_VALIDATION.EMAIL_PATTERN.test(email);
};

/**
 * Validates financial amount within allowed range and decimal places
 * Addresses requirement: Form Validation (Technical Specification/8.1 User Interface Design)
 */
export const validateAmount = (amount: number): boolean => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return false;
  }

  // Check range
  if (amount < AMOUNT_VALIDATION.MIN_AMOUNT || amount > AMOUNT_VALIDATION.MAX_AMOUNT) {
    return false;
  }

  // Check decimal places
  const decimalStr = amount.toString().split('.')[1];
  if (decimalStr && decimalStr.length > AMOUNT_VALIDATION.DECIMAL_PLACES) {
    return false;
  }

  return true;
};

/**
 * Validates date range for reports and filters
 * Addresses requirement: Form Validation (Technical Specification/8.1 User Interface Design)
 */
export const validateDateRange = (startDate: Date, endDate: Date): boolean => {
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    return false;
  }

  // Ensure startDate is before endDate
  if (startDate >= endDate) {
    return false;
  }

  // Calculate date range in days
  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Validate range is within allowed limits
  return daysDiff >= DATE_VALIDATION.MIN_DATE_RANGE_DAYS && 
         daysDiff <= DATE_VALIDATION.MAX_DATE_RANGE_DAYS;
};

/**
 * Validates user profile input fields
 * Addresses requirement: Input Validation (Technical Specification/9.2 Data Security/9.2.1 Data Classification)
 */
export const validateUserInput = (user: User): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Validate email
  if (!validateEmail(user.email)) {
    errors.email = 'Invalid email format';
  }

  // Validate firstName
  if (!user.firstName || user.firstName.length === 0) {
    errors.firstName = 'First name is required';
  } else if (user.firstName.length > FORM_VALIDATION.MAX_NAME_LENGTH) {
    errors.firstName = `First name must not exceed ${FORM_VALIDATION.MAX_NAME_LENGTH} characters`;
  }

  // Validate lastName
  if (!user.lastName || user.lastName.length === 0) {
    errors.lastName = 'Last name is required';
  } else if (user.lastName.length > FORM_VALIDATION.MAX_NAME_LENGTH) {
    errors.lastName = `Last name must not exceed ${FORM_VALIDATION.MAX_NAME_LENGTH} characters`;
  }

  // Sanitize inputs to prevent XSS
  const sanitizedUser = {
    ...user,
    firstName: sanitizeInput(user.firstName),
    lastName: sanitizeInput(user.lastName)
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitizes input string to prevent XSS attacks
 * Addresses requirement: Input Validation (Technical Specification/9.2 Data Security/9.2.1 Data Classification)
 */
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Validates budget period range
 * Addresses requirement: Form Validation (Technical Specification/8.1 User Interface Design)
 */
export const validateBudgetPeriod = (startDate: Date, endDate: Date): boolean => {
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    return false;
  }

  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysDiff >= DATE_VALIDATION.BUDGET_MIN_DAYS && 
         daysDiff <= DATE_VALIDATION.BUDGET_MAX_DAYS;
};

/**
 * Validates goal target date
 * Addresses requirement: Form Validation (Technical Specification/8.1 User Interface Design)
 */
export const validateGoalDate = (targetDate: Date): boolean => {
  if (!(targetDate instanceof Date)) {
    return false;
  }

  const today = new Date();
  const daysDiff = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return daysDiff >= DATE_VALIDATION.GOAL_MIN_DAYS && 
         daysDiff <= DATE_VALIDATION.GOAL_MAX_DAYS;
};