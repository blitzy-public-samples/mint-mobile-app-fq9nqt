// Third-party imports with versions
import { describe, beforeAll, afterAll, test, expect } from '@jest/globals'; // ^29.0.0
import { device, by, element } from 'detox'; // ^20.0.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createTestUser, loginTestUser } from '../../utils/auth-helper';

/**
 * Human Tasks Required:
 * 1. Configure Detox for iOS simulator and Android emulator testing
 * 2. Set up test devices with biometric capabilities (Face ID/Touch ID for iOS, Fingerprint for Android)
 * 3. Configure test environment variables in .env.test
 * 4. Ensure proper permissions are set for biometric usage in test apps
 * 5. Set up mock biometric responses in Detox configuration
 */

describe('Biometric Authentication Tests', () => {
  let testEnv: any;
  let testUser: any;

  // Setup test environment before all tests
  beforeAll(async () => {
    // Requirement: Security Architecture (Technical Specification/5.4 Security Architecture)
    testEnv = await setupTestEnvironment({
      biometricEnabled: true,
      mockBiometricResponses: true
    });

    // Create test user with biometric preferences enabled
    testUser = await createTestUser({
      biometricEnabled: true,
      deviceId: device.id,
      platform: device.getPlatform()
    });

    // Launch app in test mode
    await device.launchApp({
      newInstance: true,
      permissions: { biometric: 'YES' }
    });
  });

  // Cleanup after all tests
  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
    await device.uninstallApp();
  });

  test('should verify biometric hardware availability', async () => {
    // Requirement: Biometric Authentication (Technical Specification/9.1.1 Authentication Methods/Biometric)
    
    // Check biometric hardware status
    const biometricType = await device.getBiometricType();
    expect(biometricType).toBeDefined();
    expect(['TouchID', 'FaceID', 'Fingerprint']).toContain(biometricType);

    // Verify biometric enrollment state
    const isEnrolled = await device.isBiometricEnrolled();
    expect(isEnrolled).toBe(true);

    // Validate app's biometric availability reporting
    const biometricButton = await element(by.id('biometric-login-button'));
    expect(await biometricButton.isEnabled()).toBe(true);
  });

  test('should successfully authenticate with biometrics', async () => {
    // Requirement: Mobile Security (Technical Specification/9.2 Data Security/9.2.2 Data Classification)
    
    // Login user first to establish session
    const { accessToken } = await loginTestUser(testUser.email, testUser.password);
    expect(accessToken).toBeDefined();

    // Trigger biometric authentication
    const biometricButton = await element(by.id('biometric-login-button'));
    await biometricButton.tap();

    // Simulate successful biometric authentication
    await device.matchFace(); // iOS Face ID
    // or await device.matchFinger(); // Touch ID/Android Fingerprint

    // Verify successful authentication
    const dashboardScreen = await element(by.id('dashboard-screen'));
    await expect(dashboardScreen).toBeVisible();

    // Validate secure session creation
    const secureToken = await element(by.id('secure-session-indicator'));
    await expect(secureToken).toHaveText('Secure Session Active');
  });

  test('should handle biometric authentication failure', async () => {
    // Requirement: Security Architecture (Technical Specification/5.4 Security Architecture)
    
    // Trigger biometric authentication
    const biometricButton = await element(by.id('biometric-login-button'));
    await biometricButton.tap();

    // Simulate failed biometric attempt
    await device.failFace(); // iOS Face ID
    // or await device.failFinger(); // Touch ID/Android Fingerprint

    // Verify error handling
    const errorMessage = await element(by.id('biometric-error-message'));
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText('Biometric authentication failed');

    // Check fallback authentication option
    const passwordFallbackButton = await element(by.id('password-login-button'));
    await expect(passwordFallbackButton).toBeVisible();
  });

  test('should enforce biometric lockout after multiple failures', async () => {
    // Requirement: Mobile Security (Technical Specification/9.2 Data Security/9.2.2 Data Classification)
    
    // Simulate multiple failed attempts
    for (let i = 0; i < 5; i++) {
      const biometricButton = await element(by.id('biometric-login-button'));
      await biometricButton.tap();
      await device.failFace(); // iOS Face ID
      // or await device.failFinger(); // Touch ID/Android Fingerprint
    }

    // Verify lockout activation
    const lockoutMessage = await element(by.id('biometric-lockout-message'));
    await expect(lockoutMessage).toBeVisible();
    await expect(lockoutMessage).toHaveText('Too many failed attempts. Please try again later.');

    // Validate biometric button is disabled
    const biometricButton = await element(by.id('biometric-login-button'));
    await expect(biometricButton).toBeDisabled();

    // Verify fallback to password authentication
    const passwordFallbackButton = await element(by.id('password-login-button'));
    await expect(passwordFallbackButton).toBeVisible();
    await expect(passwordFallbackButton).toBeEnabled();
  });

  test('should maintain security state across app restart', async () => {
    // Requirement: Security Architecture (Technical Specification/5.4 Security Architecture)
    
    // Successfully authenticate with biometrics
    const biometricButton = await element(by.id('biometric-login-button'));
    await biometricButton.tap();
    await device.matchFace(); // iOS Face ID
    // or await device.matchFinger(); // Touch ID/Android Fingerprint

    // Restart app
    await device.reloadReactNative();

    // Verify security state persistence
    const secureToken = await element(by.id('secure-session-indicator'));
    await expect(secureToken).toHaveText('Secure Session Active');

    // Validate biometric settings persistence
    const biometricEnabled = await element(by.id('biometric-enabled-setting'));
    await expect(biometricEnabled).toHaveValue(true);
  });

  test('should handle system-level biometric changes', async () => {
    // Requirement: Biometric Authentication (Technical Specification/9.1.1 Authentication Methods/Biometric)
    
    // Simulate system-level biometric enrollment change
    await device.setBiometricEnrollment(false);

    // Verify app detects biometric unavailability
    const biometricButton = await element(by.id('biometric-login-button'));
    await expect(biometricButton).toBeDisabled();

    // Check for appropriate user message
    const biometricStatus = await element(by.id('biometric-status-message'));
    await expect(biometricStatus).toHaveText('Biometric authentication unavailable');

    // Restore biometric enrollment
    await device.setBiometricEnrollment(true);
  });

  test('should integrate with FIDO2 standards', async () => {
    // Requirement: Biometric Authentication (Technical Specification/9.1.1 Authentication Methods/Biometric)
    
    // Verify FIDO2 attestation
    const fido2Button = await element(by.id('fido2-register-button'));
    await fido2Button.tap();

    // Perform FIDO2 registration
    await device.matchFace(); // iOS Face ID
    // or await device.matchFinger(); // Touch ID/Android Fingerprint

    // Validate FIDO2 credential creation
    const credentialStatus = await element(by.id('fido2-credential-status'));
    await expect(credentialStatus).toHaveText('FIDO2 Credential Active');

    // Verify FIDO2 assertion
    const assertionResult = await element(by.id('fido2-assertion-result'));
    await expect(assertionResult).toHaveText('Verified');
  });
});