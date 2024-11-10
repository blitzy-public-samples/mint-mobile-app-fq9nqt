// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'; // ^29.0.0

// Internal imports
import { 
  createTestUser, 
  loginTestUser, 
  generateTestToken, 
  verifyTestToken 
} from '../../utils/auth-helper';
import { 
  setupTestEnvironment, 
  cleanupTestEnvironment, 
  waitForCondition 
} from '../../utils/test-helpers';
import { AuthService } from '../../../backend/src/modules/auth/auth.service';

/**
 * Human Tasks:
 * 1. Configure JWT RS256 key pair in test environment
 * 2. Set up test database with required user tables
 * 3. Configure test authentication timeouts
 * 4. Ensure proper cleanup of test tokens after test execution
 * 5. Configure rate limiting settings for test environment
 */

describe('Token Security Tests', () => {
  let testEnv: any;
  let testUser: { user: any; password: string };
  let authService: AuthService;

  // Setup test environment before all tests
  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
    authService = new AuthService(null, null, null); // Will be properly initialized by setupTestEnvironment
  });

  // Cleanup after all tests
  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  /**
   * Tests JWT token generation with correct claims and RS256 signing algorithm
   * 
   * Requirements addressed:
   * - Authentication Methods (Technical Specification/9.1.1)
   * - Security Protocols (Technical Specification/9.3)
   */
  test('testTokenGeneration', async () => {
    // Create test user
    testUser = await createTestUser();

    // Login to get tokens
    const { accessToken, refreshToken } = await loginTestUser(
      testUser.user.email,
      testUser.password
    );

    // Verify access token structure and claims
    const decodedAccess = await verifyTestToken(accessToken);
    expect(decodedAccess).toBeDefined();
    expect(decodedAccess.sub).toBe(testUser.user.id);
    expect(decodedAccess.email).toBe(testUser.user.email);
    expect(decodedAccess.type).toBe('access');

    // Verify refresh token structure
    const decodedRefresh = await verifyTestToken(refreshToken);
    expect(decodedRefresh).toBeDefined();
    expect(decodedRefresh.sub).toBe(testUser.user.id);
    expect(decodedRefresh.type).toBe('refresh');

    // Assert token signing algorithm
    expect(decodedAccess.header.alg).toBe('RS256');
    expect(decodedRefresh.header.alg).toBe('RS256');

    // Verify token expiration times
    const accessExp = new Date(decodedAccess.exp * 1000);
    const refreshExp = new Date(decodedRefresh.exp * 1000);
    const now = new Date();

    // Access token should expire in 15 minutes
    expect(accessExp.getTime() - now.getTime()).toBeLessThanOrEqual(15 * 60 * 1000);
    
    // Refresh token should expire in 7 days
    expect(refreshExp.getTime() - now.getTime()).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000);
  });

  /**
   * Tests token expiration handling and validation
   * 
   * Requirements addressed:
   * - Session Management (Technical Specification/9.1.3)
   * - Security Protocols (Technical Specification/9.3)
   */
  test('testTokenExpiration', async () => {
    // Generate token with 1 second expiration for testing
    const shortLivedToken = generateTestToken({
      sub: testUser.user.id,
      exp: Math.floor(Date.now() / 1000) + 1
    });

    // Wait for token to expire
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify token is expired
    await expect(verifyTestToken(shortLivedToken))
      .rejects
      .toThrow('Token expired');

    // Test refresh token after expiration
    const { refreshToken } = await loginTestUser(
      testUser.user.email,
      testUser.password
    );

    // Generate expired refresh token
    const expiredRefreshToken = generateTestToken({
      sub: testUser.user.id,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) - 3600
    });

    // Verify expired refresh token cannot be used
    await expect(authService.refreshToken(expiredRefreshToken))
      .rejects
      .toThrow('Invalid refresh token');
  });

  /**
   * Tests token validation and security measures
   * 
   * Requirements addressed:
   * - Authentication Methods (Technical Specification/9.1.1)
   * - Security Protocols (Technical Specification/9.3)
   */
  test('testTokenValidation', async () => {
    // Test invalid signature detection
    const tamperedToken = generateTestToken({
      sub: testUser.user.id
    }).slice(0, -5) + 'xxxxx'; // Tamper with signature

    await expect(verifyTestToken(tamperedToken))
      .rejects
      .toThrow('Invalid signature');

    // Test malformed token handling
    const malformedToken = 'not.a.valid.jwt.token';
    await expect(verifyTestToken(malformedToken))
      .rejects
      .toThrow('Invalid token');

    // Test token tampering detection
    const validToken = generateTestToken({
      sub: testUser.user.id,
      role: 'user'
    });

    // Attempt to modify claims
    const [header, payload, signature] = validToken.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
    decodedPayload.role = 'admin'; // Attempt to escalate privileges
    const tamperedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64');
    const tamperedToken = `${header}.${tamperedPayload}.${signature}`;

    await expect(verifyTestToken(tamperedToken))
      .rejects
      .toThrow('Invalid signature');
  });

  /**
   * Tests refresh token functionality and rotation
   * 
   * Requirements addressed:
   * - Session Management (Technical Specification/9.1.3)
   * - Security Protocols (Technical Specification/9.3)
   */
  test('testTokenRefresh', async () => {
    // Login to get initial tokens
    const { accessToken, refreshToken } = await loginTestUser(
      testUser.user.email,
      testUser.password
    );

    // Use refresh token to get new access token
    const { accessToken: newAccessToken } = await authService.refreshToken(refreshToken);
    expect(newAccessToken).toBeDefined();
    expect(newAccessToken).not.toBe(accessToken);

    // Verify new access token is valid
    const decodedNewAccess = await verifyTestToken(newAccessToken);
    expect(decodedNewAccess.sub).toBe(testUser.user.id);
    expect(decodedNewAccess.type).toBe('access');

    // Verify new access token has 15-minute expiry
    const newAccessExp = new Date(decodedNewAccess.exp * 1000);
    const now = new Date();
    expect(newAccessExp.getTime() - now.getTime()).toBeLessThanOrEqual(15 * 60 * 1000);

    // Test refresh token reuse prevention
    await expect(authService.refreshToken(refreshToken))
      .rejects
      .toThrow('Invalid refresh token');

    // Verify refresh token rotation maintains security
    const { refreshToken: rotatedRefreshToken } = await loginTestUser(
      testUser.user.email,
      testUser.password
    );
    expect(rotatedRefreshToken).not.toBe(refreshToken);
  });
});