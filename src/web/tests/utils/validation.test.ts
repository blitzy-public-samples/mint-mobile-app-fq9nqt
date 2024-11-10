// @jest/globals version: 29.0+
import { describe, test, expect } from '@jest/globals';
import { 
  validatePassword,
  validateEmail,
  validateAmount,
  validateDateRange,
  validateUserInput,
  validateBudgetPeriod,
  validateGoalDate
} from '../../src/utils/validation.utils';
import { 
  AUTH_VALIDATION,
  AMOUNT_VALIDATION,
  DATE_VALIDATION,
  FORM_VALIDATION,
  BUDGET_VALIDATION,
  GOAL_VALIDATION
} from '../../src/constants/validation.constants';

// Human Tasks:
// 1. Verify test cases cover all edge cases in production scenarios
// 2. Ensure test data matches real-world usage patterns
// 3. Review security test cases for completeness
// 4. Confirm date validation tests cover all timezone scenarios

describe('validatePassword', () => {
  // Addresses requirement: Password Security Testing (Technical Specification/9.1.1 Authentication Methods)
  test('should validate password minimum length requirement', () => {
    expect(validatePassword('Short1!Aa')).toBe(false);
    expect(validatePassword('LongEnough1!Aa')).toBe(true);
  });

  test('should validate password complexity requirements', () => {
    expect(validatePassword('lowercaseonly123!')).toBe(false);
    expect(validatePassword('UPPERCASEONLY123!')).toBe(false);
    expect(validatePassword('NoSpecialChar123')).toBe(false);
    expect(validatePassword('NoNumbers!@#Aa')).toBe(false);
    expect(validatePassword('Valid1Password!')).toBe(true);
  });

  test('should handle edge cases', () => {
    expect(validatePassword('')).toBe(false);
    expect(validatePassword(' '.repeat(12))).toBe(false);
    expect(validatePassword('!'.repeat(12))).toBe(false);
    expect(validatePassword('1'.repeat(12))).toBe(false);
  });

  test('should validate special characters requirement', () => {
    const validSpecialChars = ['!', '@', '#', '$', '%', '*', '?', '&'];
    validSpecialChars.forEach(char => {
      expect(validatePassword(`ValidPass1${char}word`)).toBe(true);
    });
  });
});

describe('validateEmail', () => {
  // Addresses requirement: Input Validation Testing (Technical Specification/9.2 Data Security/9.2.1 Data Classification)
  test('should validate valid email formats', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('user.name@example.co.uk')).toBe(true);
    expect(validateEmail('user+tag@example.com')).toBe(true);
    expect(validateEmail('123.456@example.com')).toBe(true);
  });

  test('should reject invalid email formats', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('invalid.email')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('user@.')).toBe(false);
    expect(validateEmail('user@.com')).toBe(false);
    expect(validateEmail('user@example')).toBe(false);
  });

  test('should handle special characters correctly', () => {
    expect(validateEmail('user!@example.com')).toBe(false);
    expect(validateEmail('user#@example.com')).toBe(false);
    expect(validateEmail('user$@example.com')).toBe(false);
  });
});

describe('validateAmount', () => {
  // Addresses requirement: Form Validation Testing (Technical Specification/8.1 User Interface Design)
  test('should validate amount within allowed range', () => {
    expect(validateAmount(0)).toBe(true);
    expect(validateAmount(100)).toBe(true);
    expect(validateAmount(999999999.99)).toBe(true);
  });

  test('should reject amounts outside allowed range', () => {
    expect(validateAmount(-1)).toBe(false);
    expect(validateAmount(1000000000)).toBe(false);
  });

  test('should validate decimal places', () => {
    expect(validateAmount(100.00)).toBe(true);
    expect(validateAmount(100.99)).toBe(true);
    expect(validateAmount(100.999)).toBe(false);
    expect(validateAmount(100.9999)).toBe(false);
  });

  test('should handle edge cases', () => {
    expect(validateAmount(NaN)).toBe(false);
    expect(validateAmount(Infinity)).toBe(false);
    expect(validateAmount(-Infinity)).toBe(false);
  });
});

describe('validateDateRange', () => {
  // Addresses requirement: Form Validation Testing (Technical Specification/8.1 User Interface Design)
  test('should validate valid date ranges', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 30);
    
    expect(validateDateRange(today, tomorrow)).toBe(true);
    expect(validateDateRange(today, futureDate)).toBe(true);
  });

  test('should reject invalid date ranges', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tooFarFuture = new Date(today);
    tooFarFuture.setDate(tooFarFuture.getDate() + 366);
    
    expect(validateDateRange(today, yesterday)).toBe(false);
    expect(validateDateRange(today, tooFarFuture)).toBe(false);
  });

  test('should handle edge cases', () => {
    const today = new Date();
    expect(validateDateRange(today, today)).toBe(false);
    expect(validateDateRange(null as any, today)).toBe(false);
    expect(validateDateRange(today, null as any)).toBe(false);
    expect(validateDateRange(undefined as any, today)).toBe(false);
  });
});

describe('validateUserInput', () => {
  // Addresses requirement: Input Validation Testing (Technical Specification/9.2 Data Security/9.2.1 Data Classification)
  const validUser = {
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe'
  };

  test('should validate valid user input', () => {
    const result = validateUserInput(validUser);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  test('should validate email field', () => {
    const invalidUser = { ...validUser, email: 'invalid.email' };
    const result = validateUserInput(invalidUser);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty('email');
  });

  test('should validate name length restrictions', () => {
    const longName = 'a'.repeat(FORM_VALIDATION.MAX_NAME_LENGTH + 1);
    const invalidUser = { ...validUser, firstName: longName };
    const result = validateUserInput(invalidUser);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty('firstName');
  });

  test('should handle empty required fields', () => {
    const emptyUser = { email: '', firstName: '', lastName: '' };
    const result = validateUserInput(emptyUser);
    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors).length).toBe(3);
  });
});

describe('validateBudgetPeriod', () => {
  // Addresses requirement: Form Validation Testing (Technical Specification/8.1 User Interface Design)
  test('should validate valid budget periods', () => {
    const startDate = new Date();
    const validEndDate = new Date(startDate);
    validEndDate.setDate(validEndDate.getDate() + 30);
    
    expect(validateBudgetPeriod(startDate, validEndDate)).toBe(true);
  });

  test('should reject invalid budget periods', () => {
    const startDate = new Date();
    const tooShortEndDate = new Date(startDate);
    tooShortEndDate.setDate(tooShortEndDate.getDate() + 6); // Less than minimum
    
    const tooLongEndDate = new Date(startDate);
    tooLongEndDate.setDate(tooLongEndDate.getDate() + 366); // More than maximum
    
    expect(validateBudgetPeriod(startDate, tooShortEndDate)).toBe(false);
    expect(validateBudgetPeriod(startDate, tooLongEndDate)).toBe(false);
  });

  test('should handle invalid date inputs', () => {
    const validDate = new Date();
    expect(validateBudgetPeriod(null as any, validDate)).toBe(false);
    expect(validateBudgetPeriod(validDate, null as any)).toBe(false);
    expect(validateBudgetPeriod('invalid' as any, validDate)).toBe(false);
  });
});

describe('validateGoalDate', () => {
  // Addresses requirement: Form Validation Testing (Technical Specification/8.1 User Interface Design)
  test('should validate valid goal target dates', () => {
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 100);
    expect(validateGoalDate(validDate)).toBe(true);
  });

  test('should reject invalid goal target dates', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tooFarFuture = new Date(today);
    tooFarFuture.setDate(tooFarFuture.getDate() + DATE_VALIDATION.GOAL_MAX_DAYS + 1);
    
    expect(validateGoalDate(yesterday)).toBe(false);
    expect(validateGoalDate(tooFarFuture)).toBe(false);
  });

  test('should handle invalid date inputs', () => {
    expect(validateGoalDate(null as any)).toBe(false);
    expect(validateGoalDate(undefined as any)).toBe(false);
    expect(validateGoalDate('invalid' as any)).toBe(false);
  });
});