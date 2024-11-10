// Third-party imports with versions
import { describe, beforeAll, afterAll, it, expect } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0
import bcrypt from 'bcrypt'; // ^5.1.0
import jwt from 'jsonwebtoken'; // ^9.0.0

// Internal imports
import { 
  setupTestEnvironment, 
  cleanupTestEnvironment,
  expectSuccessResponse,
  expectErrorResponse 
} from '../../test/utils/test-helpers';
import { createMockUser } from '../../test/utils/mock-data';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test
 * 2. Set up test database with proper permissions
 * 3. Generate RSA key pair for JWT signing
 * 4. Configure rate limiting settings for tests
 * 5. Set up Redis for session management tests
 */

describe('Authentication E2E Tests', () => {
  let testEnv: any;
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  const TEST_TIMEOUT = 30000;

  // Set up test environment
  beforeAll(async () => {
    // Requirements addressed: Technical Specification/9.1.1 Authentication Methods
    // Initialize test environment with database and API client
    testEnv = await setupTestEnvironment({
      database: true,
      redis: true, // For session management
      rateLimiting: {
        points: 10,
        duration: 60,
        blockDuration: 300
      }
    });

    // Configure longer timeout for auth tests
    jest.setTimeout(TEST_TIMEOUT);
  });

  // Clean up test environment
  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  describe('User Registration', () => {
    it('should successfully register a new user with valid credentials', async () => {
      // Requirements addressed: Technical Specification/9.1.1 Authentication Methods
      const mockUser = createMockUser();
      const password = 'SecureP@ssw0rd123'; // Meets complexity requirements

      const response = await supertest(API_BASE_URL)
        .post('/auth/register')
        .send({
          email: mockUser.email,
          password,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName
        });

      expectSuccessResponse(response, 201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Verify JWT token format and signing
      const decodedToken = jwt.decode(response.body.accessToken) as jwt.JwtPayload;
      expect(decodedToken).toHaveProperty('sub');
      expect(decodedToken).toHaveProperty('exp');
      expect(decodedToken.iss).toBe('mint-replica-lite');

      // Verify user creation in database
      const user = await testEnv.db.getRepository('User').findOne({
        where: { email: mockUser.email }
      });
      expect(user).toBeTruthy();
      expect(user.email).toBe(mockUser.email);

      // Verify password is properly hashed
      const isPasswordValid = await bcrypt.compare(password, user.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should reject registration with weak password', async () => {
      // Requirements addressed: Technical Specification/9.1.1 Authentication Methods
      const mockUser = createMockUser();
      const weakPassword = 'weak123'; // Doesn't meet requirements

      const response = await supertest(API_BASE_URL)
        .post('/auth/register')
        .send({
          email: mockUser.email,
          password: weakPassword,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName
        });

      expectErrorResponse(response, 400);
      expect(response.body.message).toContain('Password must be at least 12 characters');
    });

    it('should prevent duplicate email registration', async () => {
      const mockUser = createMockUser();
      const password = 'SecureP@ssw0rd123';

      // First registration
      await supertest(API_BASE_URL)
        .post('/auth/register')
        .send({
          email: mockUser.email,
          password,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName
        });

      // Attempt duplicate registration
      const response = await supertest(API_BASE_URL)
        .post('/auth/register')
        .send({
          email: mockUser.email,
          password,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName
        });

      expectErrorResponse(response, 409);
      expect(response.body.message).toContain('Email already registered');
    });
  });

  describe('User Login', () => {
    it('should successfully login with valid credentials', async () => {
      // Requirements addressed: Technical Specification/9.1.1 Authentication Methods
      const password = 'SecureP@ssw0rd123';
      const mockUser = createMockUser();

      // Create test user
      await testEnv.db.getRepository('User').save({
        ...mockUser,
        password: await bcrypt.hash(password, 10)
      });

      const response = await supertest(API_BASE_URL)
        .post('/auth/login')
        .send({
          email: mockUser.email,
          password
        });

      expectSuccessResponse(response, 200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Verify token expiry times
      const accessToken = jwt.decode(response.body.accessToken) as jwt.JwtPayload;
      const refreshToken = jwt.decode(response.body.refreshToken) as jwt.JwtPayload;

      // Access token should expire in 15 minutes
      expect(accessToken.exp - accessToken.iat).toBe(900);
      // Refresh token should expire in 7 days
      expect(refreshToken.exp - refreshToken.iat).toBe(604800);

      // Verify security headers
      expect(response.headers['strict-transport-security']).toBeTruthy();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
    });
  });

  describe('Token Refresh', () => {
    it('should successfully refresh tokens', async () => {
      // Requirements addressed: Technical Specification/9.1.3 Session Management
      const mockUser = await testEnv.createAuthenticatedUser();
      const { refreshToken } = mockUser.tokens;

      // Wait for access token to expire
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await supertest(API_BASE_URL)
        .post('/auth/refresh')
        .send({ refreshToken });

      expectSuccessResponse(response, 200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Verify refresh token rotation
      expect(response.body.refreshToken).not.toBe(refreshToken);

      // Verify old refresh token is invalidated
      const oldRefreshResponse = await supertest(API_BASE_URL)
        .post('/auth/refresh')
        .send({ refreshToken });

      expectErrorResponse(oldRefreshResponse, 401);
    });
  });

  describe('Logout', () => {
    it('should successfully logout and invalidate tokens', async () => {
      // Requirements addressed: Technical Specification/9.1.3 Session Management
      const mockUser = await testEnv.createAuthenticatedUser();
      const { accessToken, refreshToken } = mockUser.tokens;

      const response = await supertest(API_BASE_URL)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expectSuccessResponse(response, 200);

      // Verify tokens are invalidated
      const protectedResponse = await supertest(API_BASE_URL)
        .get('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expectErrorResponse(protectedResponse, 401);

      // Verify refresh token is invalidated
      const refreshResponse = await supertest(API_BASE_URL)
        .post('/auth/refresh')
        .send({ refreshToken });

      expectErrorResponse(refreshResponse, 401);
    });
  });

  describe('Invalid Credentials', () => {
    it('should handle invalid login attempts and rate limiting', async () => {
      // Requirements addressed: Technical Specification/9.3 Security Protocols/9.3.1 API Security
      const mockUser = createMockUser();
      const password = 'SecureP@ssw0rd123';

      // Create test user
      await testEnv.db.getRepository('User').save({
        ...mockUser,
        password: await bcrypt.hash(password, 10)
      });

      // Test invalid email format
      const invalidEmailResponse = await supertest(API_BASE_URL)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password
        });

      expectErrorResponse(invalidEmailResponse, 400);

      // Test non-existent email
      const nonExistentResponse = await supertest(API_BASE_URL)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password
        });

      expectErrorResponse(nonExistentResponse, 401);

      // Test wrong password multiple times to trigger rate limiting
      for (let i = 0; i < 5; i++) {
        await supertest(API_BASE_URL)
          .post('/auth/login')
          .send({
            email: mockUser.email,
            password: 'wrongpassword'
          });
      }

      // Verify rate limiting is enforced
      const rateLimitResponse = await supertest(API_BASE_URL)
        .post('/auth/login')
        .send({
          email: mockUser.email,
          password: 'wrongpassword'
        });

      expectErrorResponse(rateLimitResponse, 429);
      expect(rateLimitResponse.headers['retry-after']).toBeTruthy();
    });
  });

  describe('Concurrent Sessions', () => {
    it('should manage multiple active sessions correctly', async () => {
      // Requirements addressed: Technical Specification/9.1.3 Session Management
      const mockUser = createMockUser();
      const password = 'SecureP@ssw0rd123';

      // Create test user
      await testEnv.db.getRepository('User').save({
        ...mockUser,
        password: await bcrypt.hash(password, 10)
      });

      // Login from three different devices
      const sessions = [];
      for (let i = 0; i < 3; i++) {
        const response = await supertest(API_BASE_URL)
          .post('/auth/login')
          .send({
            email: mockUser.email,
            password
          });

        expectSuccessResponse(response, 200);
        sessions.push(response.body);
      }

      // Verify all sessions are active
      for (const session of sessions) {
        const profileResponse = await supertest(API_BASE_URL)
          .get('/users/profile')
          .set('Authorization', `Bearer ${session.accessToken}`);

        expectSuccessResponse(profileResponse, 200);
      }

      // Attempt fourth login
      const fourthLoginResponse = await supertest(API_BASE_URL)
        .post('/auth/login')
        .send({
          email: mockUser.email,
          password
        });

      expectSuccessResponse(fourthLoginResponse, 200);

      // Verify oldest session is invalidated
      const oldestSessionResponse = await supertest(API_BASE_URL)
        .get('/users/profile')
        .set('Authorization', `Bearer ${sessions[0].accessToken}`);

      expectErrorResponse(oldestSessionResponse, 401);
    });
  });
});