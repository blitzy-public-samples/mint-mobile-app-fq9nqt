// Third-party imports with versions
import { describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/globals'; // ^29.0.0
import { device, element, by, waitFor } from 'detox'; // ^20.0.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createTestUser, loginTestUser } from '../../utils/auth-helper';

/**
 * Human Tasks Required:
 * 1. Configure Android emulator with API level 30+ for biometric testing
 * 2. Set up Android Keystore for secure credential storage testing
 * 3. Configure test environment variables in .env.test
 * 4. Ensure Detox is properly configured in package.json
 * 5. Install required Android test dependencies
 */

describe('Android Authentication Flow Tests', () => {
  // Test environment state
  let testEnv: any;
  let testUser: { email: string; password: string };

  beforeAll(async () => {
    // Requirements: Authentication Methods (Technical Specification/9.1.1)
    testEnv = await setupTestEnvironment({
      platform: 'android',
      app: 'com.mintreplica.lite'
    });

    // Launch Android app
    await device.launchApp({
      newInstance: true,
      permissions: { biometric: 'YES' }
    });

    // Clear app storage and Android Keystore
    await device.clearKeychain();
    await device.resetContentAndSettings();
  });

  afterAll(async () => {
    // Clean up test environment
    await cleanupTestEnvironment(testEnv);

    // Close Android app
    await device.terminateApp();
  });

  beforeEach(async () => {
    // Reset to login screen
    await device.reloadReactNative();
    await element(by.id('login-screen')).waitToBeVisible();

    // Clear input fields
    await element(by.id('email-input')).clearText();
    await element(by.id('password-input')).clearText();

    // Clear any biometric prompts
    await device.setBiometricEnrollment(false);
  });

  test('Login with valid credentials', async () => {
    // Requirements: Authentication Methods (Technical Specification/9.1.1)
    // Create test user with bcrypt hashed password
    const { user, password } = await createTestUser();
    testUser = { email: user.email, password };

    // Enter valid credentials
    await element(by.id('email-input')).typeText(testUser.email);
    await element(by.id('password-input')).typeText(testUser.password);
    
    // Submit login form
    await element(by.id('login-button')).tap();

    // Verify successful login
    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify JWT tokens in Android Keystore
    // Requirements: Session Management (Technical Specification/9.1.3)
    const accessToken = await device.getKeychain('access_token');
    const refreshToken = await device.getKeychain('refresh_token');
    
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    // Validate token expiry times
    const decodedAccess = JSON.parse(atob(accessToken.split('.')[1]));
    const decodedRefresh = JSON.parse(atob(refreshToken.split('.')[1]));

    expect(decodedAccess.exp - decodedAccess.iat).toBe(900); // 15 minutes
    expect(decodedRefresh.exp - decodedRefresh.iat).toBe(604800); // 7 days
  });

  test('Login with invalid credentials', async () => {
    // Enter invalid credentials
    await element(by.id('email-input')).typeText('invalid@email.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    
    // Submit login form
    await element(by.id('login-button')).tap();

    // Verify error message
    await waitFor(element(by.id('error-message')))
      .toHaveText('Invalid email or password')
      .withTimeout(3000);

    // Verify staying on login screen
    await expect(element(by.id('login-screen'))).toBeVisible();

    // Verify no tokens stored
    const accessToken = await device.getKeychain('access_token');
    const refreshToken = await device.getKeychain('refresh_token');
    
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });

  test('Biometric authentication', async () => {
    // Requirements: Mobile Security (Technical Specification/9.3.6)
    // Setup biometric mock
    await device.setBiometricEnrollment(true);
    
    // Tap biometric login button
    await element(by.id('biometric-login-button')).tap();

    // Simulate successful fingerprint
    await device.matchFace();
    // or await device.matchFingerprint();

    // Verify successful biometric auth
    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify biometric auth record
    const biometricEnabled = await device.getKeychain('biometric_enabled');
    expect(biometricEnabled).toBe('true');

    // Verify JWT tokens
    const accessToken = await device.getKeychain('access_token');
    expect(accessToken).toBeTruthy();
  });

  test('Session token expiration and refresh', async () => {
    // Requirements: Session Management (Technical Specification/9.1.3)
    // Login with valid credentials
    const { accessToken, refreshToken } = await loginTestUser(testUser.email, testUser.password);

    // Store tokens in Keystore
    await device.setKeychain('access_token', accessToken);
    await device.setKeychain('refresh_token', refreshToken);

    // Manipulate access token to force expiry
    const expiredAccess = accessToken.replace(/exp":(\d+)/, `exp":${Date.now() / 1000 - 1}`);
    await device.setKeychain('access_token', expiredAccess);

    // Trigger authenticated request
    await element(by.id('refresh-dashboard')).tap();

    // Verify automatic token refresh
    const newAccessToken = await device.getKeychain('access_token');
    expect(newAccessToken).not.toBe(expiredAccess);

    // Verify new token validity
    const decodedNew = JSON.parse(atob(newAccessToken.split('.')[1]));
    expect(decodedNew.exp).toBeGreaterThan(Date.now() / 1000);

    // Test refresh token expiry
    const expiredRefresh = refreshToken.replace(/exp":(\d+)/, `exp":${Date.now() / 1000 - 1}`);
    await device.setKeychain('refresh_token', expiredRefresh);

    // Verify return to login on full session expiry
    await element(by.id('refresh-dashboard')).tap();
    await expect(element(by.id('login-screen'))).toBeVisible();
  });
});