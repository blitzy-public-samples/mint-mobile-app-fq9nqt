// Third-party imports with versions
import { describe, test, expect } from '@jest/globals'; // ^29.0.0

// Internal imports
import { createTestUser, loginTestUser, generateTestToken } from '../../utils/auth-helper';
import { createMockUser } from '../../utils/mock-data';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';

/**
 * Human Tasks:
 * 1. Configure test environment variables in .env.test
 * 2. Set up test database with required user tables
 * 3. Configure JWT secret and signing keys for test environment
 * 4. Set up test rate limiting configuration
 * 5. Configure test WAF rules for authentication endpoints
 */

let testEnv: {
  db: any;
  api: any;
  auth: { token: string };
};

const mockValidUser = {
  email: 'test@example.com',
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User'
};

const mockInvalidUser = {
  email: 'invalid@example.com',
  password: 'wrong',
  firstName: 'Invalid',
  lastName: 'User'
};

describe('Authentication API Contract Tests', () => {
  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  describe('Login Endpoint Contract', () => {
    test('testLoginContract', async () => {
      // Requirements addressed: Authentication Methods (Technical Specification/9.1.1)
      // Create test user with bcrypt hashed password
      const { user, password } = await createTestUser(mockValidUser);

      // Test successful login response format and JWT token structure
      const loginResponse = await testEnv.api.post('/auth/login', {
        email: user.email,
        password: password
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data).toHaveProperty('accessToken');
      expect(loginResponse.data).toHaveProperty('refreshToken');
      expect(loginResponse.data.tokenType).toBe('Bearer');

      // Requirements addressed: Session Management (Technical Specification/9.1.3)
      // Verify RS256-signed JWT token claims and 15-minute expiry
      const decodedToken = testEnv.api.decodeToken(loginResponse.data.accessToken);
      expect(decodedToken.alg).toBe('RS256');
      expect(decodedToken.exp - decodedToken.iat).toBe(900); // 15 minutes in seconds
      expect(decodedToken.sub).toBe(user.id);
      expect(decodedToken.email).toBe(user.email);

      // Requirements addressed: Security Protocols (Technical Specification/9.3.1)
      // Test invalid credentials error response format
      const invalidLoginResponse = await testEnv.api.post('/auth/login', {
        email: mockInvalidUser.email,
        password: mockInvalidUser.password
      });

      expect(invalidLoginResponse.status).toBe(401);
      expect(invalidLoginResponse.data).toHaveProperty('error');
      expect(invalidLoginResponse.data.error).toBe('Invalid credentials');

      // Test rate limiting behavior with WAF rules
      const rateLimitPromises = Array(6).fill(null).map(() => 
        testEnv.api.post('/auth/login', mockInvalidUser)
      );
      const rateLimitResponses = await Promise.all(rateLimitPromises);
      const lastResponse = rateLimitResponses[rateLimitResponses.length - 1];

      expect(lastResponse.status).toBe(429);
      expect(lastResponse.data).toHaveProperty('error');
      expect(lastResponse.data.error).toMatch(/rate limit exceeded/i);
      expect(lastResponse.headers).toHaveProperty('retry-after');
    });
  });

  describe('Registration Endpoint Contract', () => {
    test('testRegisterContract', async () => {
      // Requirements addressed: Authentication Methods (Technical Specification/9.1.1)
      // Test successful registration response with User entity format
      const mockUser = createMockUser();
      const registerResponse = await testEnv.api.post('/auth/register', {
        email: mockUser.email,
        password: 'SecurePass123!',
        firstName: mockUser.firstName,
        lastName: mockUser.lastName
      });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.data).toHaveProperty('id');
      expect(registerResponse.data).toHaveProperty('email');
      expect(registerResponse.data).not.toHaveProperty('password');
      expect(registerResponse.data.isActive).toBe(true);

      // Requirements addressed: Security Protocols (Technical Specification/9.3.1)
      // Verify duplicate email error handling
      const duplicateResponse = await testEnv.api.post('/auth/register', {
        email: mockUser.email,
        password: 'AnotherPass123!',
        firstName: 'Another',
        lastName: 'User'
      });

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.data).toHaveProperty('error');
      expect(duplicateResponse.data.error).toMatch(/email already exists/i);

      // Test password validation rules
      const weakPasswordResponse = await testEnv.api.post('/auth/register', {
        email: 'new@example.com',
        password: 'weak',
        firstName: 'New',
        lastName: 'User'
      });

      expect(weakPasswordResponse.status).toBe(400);
      expect(weakPasswordResponse.data).toHaveProperty('error');
      expect(weakPasswordResponse.data.error).toMatch(/password requirements/i);

      // Test required field validation
      const missingFieldsResponse = await testEnv.api.post('/auth/register', {
        email: 'incomplete@example.com'
      });

      expect(missingFieldsResponse.status).toBe(400);
      expect(missingFieldsResponse.data).toHaveProperty('error');
      expect(missingFieldsResponse.data.error).toMatch(/required fields/i);
    });
  });

  describe('Token Refresh Endpoint Contract', () => {
    test('testTokenRefreshContract', async () => {
      // Requirements addressed: Session Management (Technical Specification/9.1.3)
      // Create authenticated session with access and refresh tokens
      const { user, password } = await createTestUser();
      const { accessToken, refreshToken } = await loginTestUser(user.email, password);

      // Test refresh token exchange for new token pair
      const refreshResponse = await testEnv.api.post('/auth/refresh', {
        refreshToken
      });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.data).toHaveProperty('accessToken');
      expect(refreshResponse.data).toHaveProperty('refreshToken');

      // Verify new token pair format and expiry times
      const newAccessToken = refreshResponse.data.accessToken;
      const decodedNewToken = testEnv.api.decodeToken(newAccessToken);
      expect(decodedNewToken.exp - decodedNewToken.iat).toBe(900); // 15 minutes
      expect(decodedNewToken.sub).toBe(user.id);

      // Test invalid refresh token error handling
      const invalidRefreshResponse = await testEnv.api.post('/auth/refresh', {
        refreshToken: 'invalid-token'
      });

      expect(invalidRefreshResponse.status).toBe(401);
      expect(invalidRefreshResponse.data).toHaveProperty('error');
      expect(invalidRefreshResponse.data.error).toMatch(/invalid refresh token/i);

      // Test expired token error responses
      const expiredToken = generateTestToken({
        sub: user.id,
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      });

      const expiredResponse = await testEnv.api.post('/auth/refresh', {
        refreshToken: expiredToken
      });

      expect(expiredResponse.status).toBe(401);
      expect(expiredResponse.data).toHaveProperty('error');
      expect(expiredResponse.data.error).toMatch(/token expired/i);
    });
  });

  describe('Logout Endpoint Contract', () => {
    test('testLogoutContract', async () => {
      // Requirements addressed: Session Management (Technical Specification/9.1.3)
      // Create authenticated session with valid tokens
      const { user, password } = await createTestUser();
      const { accessToken } = await loginTestUser(user.email, password);

      testEnv.api.setAuthToken(accessToken);

      // Test successful logout response format
      const logoutResponse = await testEnv.api.post('/auth/logout');

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.data).toHaveProperty('message');
      expect(logoutResponse.data.message).toMatch(/logged out successfully/i);

      // Verify token invalidation and session termination
      const invalidatedTokenResponse = await testEnv.api.get('/auth/profile');
      expect(invalidatedTokenResponse.status).toBe(401);

      // Test unauthenticated logout attempt
      testEnv.api.setAuthToken('');
      const unauthenticatedResponse = await testEnv.api.post('/auth/logout');

      expect(unauthenticatedResponse.status).toBe(401);
      expect(unauthenticatedResponse.data).toHaveProperty('error');
      expect(unauthenticatedResponse.data.error).toMatch(/unauthorized/i);
    });
  });
});