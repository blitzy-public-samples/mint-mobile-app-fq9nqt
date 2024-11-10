// Third-party imports with versions
import { by, device, element, expect } from 'detox'; // ^20.0.0
import { describe, beforeAll, beforeEach, afterAll, test } from '@jest/globals'; // ^29.0.0

// Internal imports
import { createTestUser, loginTestUser, clearTestAuth } from '../../../utils/auth-helper';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../../utils/test-helpers';

/**
 * Human Tasks:
 * 1. Configure iOS simulator with Face ID/Touch ID capability
 * 2. Set up test environment variables in .env.test
 * 3. Ensure iOS app is built with proper signing and capabilities
 * 4. Configure test timeouts in jest.config.js
 * 5. Set up test database with required user tables
 */

// Test environment configuration
let testEnvironment: any;
let testUser: { email: string; password: string; id: string };

// Test suite for iOS authentication flows
describe('iOS Authentication Flow Tests', () => {
  // Set up test environment before all tests
  beforeAll(async () => {
    // Requirements addressed: Authentication Methods (Technical Specification/9.1.1)
    testEnvironment = await setupTestEnvironment({
      platform: 'ios',
      biometricAuth: true,
      secureStorage: true
    });

    // Create test user with secure password
    const { user, password } = await createTestUser({
      email: `test-${Date.now()}@example.com`,
      password: 'Test123!@#$',
      firstName: 'Test',
      lastName: 'User'
    });

    testUser = {
      email: user.email,
      password: password,
      id: user.id
    };

    // Launch iOS app with detox
    await device.launchApp({
      newInstance: true,
      permissions: { faceid: 'YES' }
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    // Requirements addressed: Session Management (Technical Specification/9.1.3)
    await clearTestAuth(testUser.id);
    await cleanupTestEnvironment(testEnvironment);
    await device.terminateApp();
  });

  // Reset app state before each test
  beforeEach(async () => {
    await device.reloadReactNative();
    await device.clearKeychain();
    await element(by.id('loginScreen')).waitToBeVisible();
  });

  // Test successful email/password login
  test('should successfully login with email and password', async () => {
    // Requirements addressed: Authentication Methods (Technical Specification/9.1.1)
    // Enter email
    await element(by.id('emailInput')).typeText(testUser.email);
    
    // Enter password
    await element(by.id('passwordInput')).typeText(testUser.password);
    
    // Tap login button
    await element(by.id('loginButton')).tap();

    // Verify successful login
    await element(by.id('dashboardScreen')).waitToBeVisible();
    await expect(element(by.id('userGreeting'))).toHaveText(`Welcome, Test`);

    // Verify JWT token storage
    const { accessToken, refreshToken } = await loginTestUser(testUser.email, testUser.password);
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
  });

  // Test biometric authentication
  test('should successfully login with biometric authentication', async () => {
    // Requirements addressed: Authentication Methods (Technical Specification/9.1.1)
    // Enable biometric login
    await element(by.id('biometricLoginButton')).tap();

    // Simulate successful Face ID/Touch ID
    await device.matchFace();
    // Or for Touch ID: await device.matchFinger();

    // Verify successful biometric authentication
    await element(by.id('dashboardScreen')).waitToBeVisible();
    await expect(element(by.id('secureLoginIndicator'))).toBeVisible();

    // Verify secure session establishment
    await expect(element(by.id('sessionStatus'))).toHaveText('Secure session active');
  });

  // Test invalid credentials
  test('should show error message with invalid credentials', async () => {
    // Requirements addressed: Mobile UI Testing (Technical Specification/8.1)
    // Enter invalid email
    await element(by.id('emailInput')).typeText('invalid@example.com');
    
    // Enter invalid password
    await element(by.id('passwordInput')).typeText('wrongpassword');
    
    // Tap login button
    await element(by.id('loginButton')).tap();

    // Verify error message
    await expect(element(by.id('errorMessage'))).toBeVisible();
    await expect(element(by.id('errorMessage'))).toHaveText('Invalid email or password');

    // Verify staying on login screen
    await expect(element(by.id('loginScreen'))).toBeVisible();
  });

  // Test form validation
  test('should validate login form fields', async () => {
    // Requirements addressed: Mobile UI Testing (Technical Specification/8.1)
    // Test empty fields
    await element(by.id('loginButton')).tap();
    await expect(element(by.id('emailError'))).toHaveText('Email is required');
    await expect(element(by.id('passwordError'))).toHaveText('Password is required');

    // Test invalid email format
    await element(by.id('emailInput')).typeText('invalidemail');
    await element(by.id('loginButton')).tap();
    await expect(element(by.id('emailError'))).toHaveText('Invalid email format');

    // Test password minimum length
    await element(by.id('emailInput')).clearText();
    await element(by.id('emailInput')).typeText('valid@example.com');
    await element(by.id('passwordInput')).typeText('short');
    await element(by.id('loginButton')).tap();
    await expect(element(by.id('passwordError'))).toHaveText('Password must be at least 8 characters');
  });

  // Test password reset flow
  test('should handle password reset request', async () => {
    // Requirements addressed: Session Management (Technical Specification/9.1.3)
    // Tap forgot password link
    await element(by.id('forgotPasswordLink')).tap();

    // Verify navigation to reset screen
    await expect(element(by.id('resetPasswordScreen'))).toBeVisible();

    // Enter email for reset
    await element(by.id('resetEmailInput')).typeText(testUser.email);
    await element(by.id('sendResetButton')).tap();

    // Verify confirmation message
    await expect(element(by.id('resetConfirmation'))).toBeVisible();
    await expect(element(by.id('resetConfirmation'))).toHaveText('Password reset instructions sent');
  });

  // Test session expiry handling
  test('should handle session expiry correctly', async () => {
    // Requirements addressed: Session Management (Technical Specification/9.1.3)
    // Login successfully
    await element(by.id('emailInput')).typeText(testUser.email);
    await element(by.id('passwordInput')).typeText(testUser.password);
    await element(by.id('loginButton')).tap();

    // Wait for session expiry (simulated)
    await device.sendUserNotification({
      trigger: {
        type: 'sessionExpired'
      }
    });

    // Verify session expiry handling
    await expect(element(by.id('sessionExpiredModal'))).toBeVisible();
    await expect(element(by.id('reloginButton'))).toBeVisible();

    // Verify secure data protection
    await expect(element(by.id('secureContent'))).not.toBeVisible();
  });

  // Test biometric authentication errors
  test('should handle biometric authentication errors', async () => {
    // Requirements addressed: Authentication Methods (Technical Specification/9.1.1)
    // Tap biometric login button
    await element(by.id('biometricLoginButton')).tap();

    // Simulate failed biometric authentication
    await device.matchFaceWithError();
    // Or for Touch ID: await device.matchFingerWithError();

    // Verify error handling
    await expect(element(by.id('biometricError'))).toBeVisible();
    await expect(element(by.id('fallbackLoginButton'))).toBeVisible();

    // Verify security state
    await expect(element(by.id('secureLoginIndicator'))).not.toBeVisible();
  });
});