// Third-party imports with versions
import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createTestUser, loginTestUser, verifyTestToken, clearTestAuth } from '../../utils/auth-helper';
import { AuthService } from '../../../backend/src/modules/auth/auth.service';

/**
 * Human Tasks Required:
 * 1. Configure JWT_SECRET and JWT_REFRESH_SECRET in test environment
 * 2. Set up test database with proper user tables and permissions
 * 3. Configure test API endpoints in environment
 * 4. Ensure Redis is running for token storage (if used)
 * 5. Set up proper test timeouts for token expiration tests
 */

describe('Token Refresh Integration Tests', () => {
  let testEnv: any;
  let authService: AuthService;
  let testUser: { id: string; email: string };
  let initialTokens: { accessToken: string; refreshToken: string };

  // Set up test environment before all tests
  beforeAll(async () => {
    // Requirement: Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
    testEnv = await setupTestEnvironment({
      auth: true,
      database: true,
      redis: true
    });
    authService = new AuthService(null, null, null); // Will be properly initialized by setupTestEnvironment
  });

  // Clean up test environment after all tests
  afterAll(async () => {
    // Requirement: Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
    await cleanupTestEnvironment(testEnv);
  });

  // Set up fresh test user before each test
  beforeEach(async () => {
    // Create test user and get initial tokens
    const { user, password } = await createTestUser();
    testUser = user;
    initialTokens = await loginTestUser(user.email, password);
  });

  // Clean up test data after each test
  afterEach(async () => {
    if (testUser?.id) {
      await clearTestAuth(testUser.id);
    }
  });

  it('should successfully refresh token with valid refresh token', async () => {
    // Requirement: Session Management (Technical Specification/9.1.3 Session Management)
    // Requirement: OAuth 2.0 (Technical Specification/9.1.1 Authentication Methods)
    
    // Wait for access token to approach expiry (simulated for test)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Request new access token using refresh token
    const response = await supertest(testEnv.app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialTokens.refreshToken })
      .expect(200);

    // Verify response structure
    expect(response.body).toHaveProperty('accessToken');
    expect(typeof response.body.accessToken).toBe('string');

    // Verify new access token is valid
    const decodedToken = verifyTestToken(response.body.accessToken);
    expect(decodedToken).toHaveProperty('sub', testUser.id);
    expect(decodedToken).toHaveProperty('email', testUser.email);
    expect(decodedToken).toHaveProperty('type', 'access');

    // Verify token expiration is set correctly (15 minutes)
    const expiration = new Date(decodedToken.exp * 1000);
    const now = new Date();
    const diffMinutes = Math.round((expiration.getTime() - now.getTime()) / 1000 / 60);
    expect(diffMinutes).toBeCloseTo(15, 1);
  });

  it('should reject refresh request with invalid refresh token', async () => {
    // Requirement: OAuth 2.0 (Technical Specification/9.1.1 Authentication Methods)
    
    // Attempt refresh with malformed token
    const response = await supertest(testEnv.app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid.token.format' })
      .expect(401);

    // Verify error response
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatch(/invalid.*token/i);
  });

  it('should reject refresh request with expired refresh token', async () => {
    // Requirement: Session Management (Technical Specification/9.1.3 Session Management)
    
    // Generate expired refresh token (7+ days old)
    const expiredToken = await authService.refreshToken(initialTokens.refreshToken);
    // Manipulate token expiration for test
    const expiredRefreshToken = expiredToken.accessToken.split('.').map((part, index) => {
      if (index === 1) {
        const payload = JSON.parse(Buffer.from(part, 'base64').toString());
        payload.exp = Math.floor(Date.now() / 1000) - 86400; // 24 hours ago
        return Buffer.from(JSON.stringify(payload)).toString('base64');
      }
      return part;
    }).join('.');

    // Attempt refresh with expired token
    const response = await supertest(testEnv.app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: expiredRefreshToken })
      .expect(401);

    // Verify error response
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatch(/expired.*token/i);
  });

  it('should handle concurrent token refresh requests correctly', async () => {
    // Requirement: Session Management (Technical Specification/9.1.3 Session Management)
    
    // Send multiple concurrent refresh requests
    const concurrentRequests = 5;
    const requests = Array(concurrentRequests).fill(null).map(() => 
      supertest(testEnv.app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialTokens.refreshToken })
    );

    // Wait for all requests to complete
    const responses = await Promise.all(requests);

    // Verify all requests were successful
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    // Verify all tokens are unique
    const tokens = responses.map(r => r.body.accessToken);
    const uniqueTokens = new Set(tokens);
    expect(uniqueTokens.size).toBe(concurrentRequests);

    // Verify all tokens are valid and have correct expiry
    tokens.forEach(token => {
      const decoded = verifyTestToken(token);
      expect(decoded).toHaveProperty('sub', testUser.id);
      expect(decoded).toHaveProperty('type', 'access');
      
      const expiration = new Date(decoded.exp * 1000);
      const now = new Date();
      const diffMinutes = Math.round((expiration.getTime() - now.getTime()) / 1000 / 60);
      expect(diffMinutes).toBeCloseTo(15, 1);
    });
  });

  it('should maintain user claims and permissions in refreshed token', async () => {
    // Requirement: OAuth 2.0 (Technical Specification/9.1.1 Authentication Methods)
    
    // Add test claims to initial token
    const testClaims = {
      roles: ['user'],
      permissions: ['read:transactions', 'write:budgets']
    };
    
    // Create token with test claims
    const tokenWithClaims = await loginTestUser(testUser.email, 'TestPass123!');
    
    // Refresh token
    const response = await supertest(testEnv.app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokenWithClaims.refreshToken })
      .expect(200);

    // Verify claims are preserved in new token
    const decodedToken = verifyTestToken(response.body.accessToken);
    expect(decodedToken).toHaveProperty('roles');
    expect(decodedToken.roles).toEqual(testClaims.roles);
    expect(decodedToken).toHaveProperty('permissions');
    expect(decodedToken.permissions).toEqual(testClaims.permissions);
  });

  it('should invalidate refresh token after successful refresh', async () => {
    // Requirement: Session Management (Technical Specification/9.1.3 Session Management)
    
    // First refresh should succeed
    const firstRefresh = await supertest(testEnv.app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialTokens.refreshToken })
      .expect(200);

    // Second refresh with same token should fail
    const secondRefresh = await supertest(testEnv.app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialTokens.refreshToken })
      .expect(401);

    expect(secondRefresh.body).toHaveProperty('error');
    expect(secondRefresh.body.error).toMatch(/invalid.*token/i);
  });
});