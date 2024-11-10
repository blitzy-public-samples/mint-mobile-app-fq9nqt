// Third-party imports with versions
import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0
import jwt from 'jsonwebtoken'; // ^9.0.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser } from '../../utils/mock-data';
import { TestApiClient } from '../../utils/api-client';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test
 * 2. Set up test database with proper permissions
 * 3. Configure JWT RS256 key pair for token signing
 * 4. Set up rate limiting configuration for tests
 * 5. Configure test logging directory with write permissions
 */

describe('Authentication - Login Integration Tests', () => {
    let testEnv: {
        db: any;
        api: TestApiClient;
        auth: { token: string };
    };
    let apiClient: TestApiClient;
    let mockUser: any;

    // Setup test environment before all tests
    beforeAll(async () => {
        // Requirements addressed: Technical Specification/9.1.1 Authentication Methods
        testEnv = await setupTestEnvironment({
            security: {
                bcryptCost: 12,
                jwtAlgorithm: 'RS256',
                tokenExpiry: '15m'
            }
        });
        apiClient = testEnv.api;
    });

    // Cleanup test environment after all tests
    afterAll(async () => {
        await cleanupTestEnvironment(testEnv);
    });

    // Reset state before each test
    beforeEach(async () => {
        // Create fresh mock user for each test
        mockUser = await createMockUser({
            password: 'Test@123456', // Meets password complexity requirements
            isActive: true,
            failedLoginAttempts: 0
        });
        await testEnv.db.getRepository('User').save(mockUser);
    });

    // Cleanup after each test
    afterEach(async () => {
        // Clear rate limiting cache and reset user state
        await testEnv.db.getRepository('User').delete({ email: mockUser.email });
    });

    it('should successfully login with valid credentials and return JWT token', async () => {
        // Requirements addressed: Technical Specification/9.1.1 Authentication Methods
        // Requirements addressed: Technical Specification/9.1.3 Session Management
        const response = await apiClient.post('/auth/login', {
            email: mockUser.email,
            password: 'Test@123456'
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');

        // Verify token properties
        const decodedToken = jwt.decode(response.body.token) as jwt.JwtPayload;
        expect(decodedToken.sub).toBe(mockUser.id);
        expect(decodedToken.email).toBe(mockUser.email);
        expect(decodedToken.alg).toBe('RS256');

        // Verify token expiration (15 minutes)
        const expiration = new Date(decodedToken.exp! * 1000);
        const issuedAt = new Date(decodedToken.iat! * 1000);
        expect(expiration.getTime() - issuedAt.getTime()).toBe(15 * 60 * 1000);

        // Verify user data in response
        expect(response.body.user).toMatchObject({
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName
        });

        // Verify token can be used for authenticated requests
        const protectedResponse = await apiClient
            .setAuthToken(response.body.token)
            .get('/users/profile');
        expect(protectedResponse.status).toBe(200);
    });

    it('should fail login with invalid credentials and enforce security measures', async () => {
        // Requirements addressed: Technical Specification/9.2 Data Security
        const response = await apiClient.post('/auth/login', {
            email: mockUser.email,
            password: 'WrongPassword123!'
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Invalid email or password');
        expect(response.body).not.toHaveProperty('token');

        // Verify rate limiting headers
        expect(response.headers).toHaveProperty('x-ratelimit-limit');
        expect(response.headers).toHaveProperty('x-ratelimit-remaining');
        expect(response.headers).toHaveProperty('x-ratelimit-reset');

        // Verify failed login attempt is recorded
        const updatedUser = await testEnv.db.getRepository('User')
            .findOne({ where: { email: mockUser.email } });
        expect(updatedUser.failedLoginAttempts).toBe(1);
    });

    it('should validate email format with proper security checks', async () => {
        // Requirements addressed: Technical Specification/9.2 Data Security
        const response = await apiClient.post('/auth/login', {
            email: 'invalid.email.format',
            password: 'Test@123456'
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Invalid email format');
        expect(response.headers).toHaveProperty('x-content-security-policy');
    });

    it('should validate required fields with security-conscious messages', async () => {
        // Requirements addressed: Technical Specification/9.2 Data Security
        const responseNoEmail = await apiClient.post('/auth/login', {
            password: 'Test@123456'
        });

        expect(responseNoEmail.status).toBe(400);
        expect(responseNoEmail.body.error).toBe('Email is required');

        const responseNoPassword = await apiClient.post('/auth/login', {
            email: mockUser.email
        });

        expect(responseNoPassword.status).toBe(400);
        expect(responseNoPassword.body.error).toBe('Password is required');
    });

    it('should handle non-existent user securely', async () => {
        // Requirements addressed: Technical Specification/9.2 Data Security
        const response = await apiClient.post('/auth/login', {
            email: 'nonexistent@example.com',
            password: 'Test@123456'
        });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid email or password');
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('should handle multiple concurrent login attempts with session management', async () => {
        // Requirements addressed: Technical Specification/9.1.3 Session Management
        const loginPromises = Array(5).fill(null).map(() => 
            apiClient.post('/auth/login', {
                email: mockUser.email,
                password: 'Test@123456'
            })
        );

        const responses = await Promise.all(loginPromises);
        const tokens = responses.map(r => r.body.token);

        // Verify all requests succeeded
        responses.forEach(response => {
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
        });

        // Verify token uniqueness
        const uniqueTokens = new Set(tokens);
        expect(uniqueTokens.size).toBe(tokens.length);

        // Verify all tokens are valid
        const verifyPromises = tokens.map(token => 
            apiClient
                .setAuthToken(token)
                .get('/users/profile')
        );
        const verifyResponses = await Promise.all(verifyPromises);
        verifyResponses.forEach(response => {
            expect(response.status).toBe(200);
        });
    });

    it('should enforce rate limiting after multiple failed attempts', async () => {
        // Requirements addressed: Technical Specification/9.2 Data Security
        const maxAttempts = 5;
        const attempts = [];

        // Make multiple failed login attempts
        for (let i = 0; i < maxAttempts + 1; i++) {
            attempts.push(
                apiClient.post('/auth/login', {
                    email: mockUser.email,
                    password: 'WrongPassword123!'
                })
            );
        }

        const responses = await Promise.all(attempts);

        // First maxAttempts should be 401 Unauthorized
        responses.slice(0, maxAttempts).forEach(response => {
            expect(response.status).toBe(401);
        });

        // Last attempt should be rate limited
        expect(responses[maxAttempts].status).toBe(429);
        expect(responses[maxAttempts].body.error).toMatch(/too many attempts/i);
        expect(responses[maxAttempts].headers['retry-after']).toBeDefined();
    });

    it('should handle login with inactive user account', async () => {
        // Deactivate user account
        await testEnv.db.getRepository('User').update(
            { email: mockUser.email },
            { isActive: false }
        );

        const response = await apiClient.post('/auth/login', {
            email: mockUser.email,
            password: 'Test@123456'
        });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Account is inactive');
        expect(response.body).not.toHaveProperty('token');
    });

    it('should validate password complexity requirements', async () => {
        // Create user with weak password
        const weakPassUser = await createMockUser({
            password: 'weak',
            isActive: true
        });
        await testEnv.db.getRepository('User').save(weakPassUser);

        const response = await apiClient.post('/auth/login', {
            email: weakPassUser.email,
            password: 'weak'
        });

        expect(response.status).toBe(401);
        expect(response.body.error).toMatch(/password requirements/i);
        expect(response.headers['x-content-security-policy']).toBeDefined();
    });
});