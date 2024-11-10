// @jest/globals ^29.0.0
import { describe, beforeAll, afterAll, test, expect } from '@jest/globals';

// Internal imports
import { RegisterDto } from '../../../backend/src/modules/auth/dto/register.dto';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { TestApiClient } from '../../utils/api-client';

/**
 * Human Tasks Required:
 * 1. Configure test database with proper permissions in .env.test
 * 2. Ensure test API server is running and accessible
 * 3. Set up test environment variables for authentication
 * 4. Configure test logging directory with write permissions
 * 5. Verify test database cleanup scripts are working
 */

// Test environment variables
let apiClient: TestApiClient;
let testEnv: { db: any; api: TestApiClient; auth: { token: string } };

/**
 * Requirements addressed:
 * - User Authentication (Technical Specification/9.1.1 Authentication Methods)
 *   Tests email/password registration with validation rules
 * - Data Security (Technical Specification/9.2.1 Encryption Standards)
 *   Verifies secure user data handling during registration
 * - Input Validation (Technical Specification/9.3.1 API Security)
 *   Validates registration input validation rules and error handling
 */

describe('User Registration Integration Tests', () => {
    beforeAll(async () => {
        // Initialize test environment with database and API client
        testEnv = await setupTestEnvironment({
            database: 'mint_replica_test',
            apiUrl: process.env.TEST_API_URL || 'http://localhost:3000'
        });
        apiClient = testEnv.api;
    });

    afterAll(async () => {
        // Clean up test environment and database
        await cleanupTestEnvironment(testEnv);
    });

    test('should successfully register a new user with valid data', async () => {
        // Arrange
        const validRegistrationData: RegisterDto = {
            email: 'test.user@example.com',
            password: 'SecureP@ssw0rd123',
            firstName: 'Test',
            lastName: 'User'
        };

        // Act
        const response = await apiClient.post('/auth/register', validRegistrationData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('accessToken');
        expect(response.data).toHaveProperty('user');
        expect(response.data.user).toHaveProperty('email', validRegistrationData.email);
        expect(response.data.user).toHaveProperty('firstName', validRegistrationData.firstName);
        expect(response.data.user).toHaveProperty('lastName', validRegistrationData.lastName);
        expect(response.data.user).not.toHaveProperty('password'); // Password should not be returned
    });

    test('should reject registration with invalid email format', async () => {
        // Arrange
        const invalidEmailData: RegisterDto = {
            email: 'invalid.email',
            password: 'SecureP@ssw0rd123',
            firstName: 'Test',
            lastName: 'User'
        };

        // Act
        try {
            await apiClient.post('/auth/register', invalidEmailData);
            fail('Should have thrown validation error');
        } catch (error: any) {
            // Assert
            expect(error.response.status).toBe(400);
            expect(error.response.data.message).toContain('email');
            expect(error.response.data.errors).toContainEqual(
                expect.objectContaining({
                    field: 'email',
                    message: expect.stringContaining('valid email')
                })
            );
        }
    });

    test('should reject registration with weak password', async () => {
        // Arrange
        const weakPasswordData: RegisterDto = {
            email: 'test.user@example.com',
            password: 'weak',
            firstName: 'Test',
            lastName: 'User'
        };

        // Act
        try {
            await apiClient.post('/auth/register', weakPasswordData);
            fail('Should have thrown validation error');
        } catch (error: any) {
            // Assert
            expect(error.response.status).toBe(400);
            expect(error.response.data.message).toContain('password');
            expect(error.response.data.errors).toContainEqual(
                expect.objectContaining({
                    field: 'password',
                    message: expect.stringContaining('must contain uppercase, lowercase, number and special character')
                })
            );
        }
    });

    test('should reject registration with duplicate email', async () => {
        // Arrange
        const existingUserData: RegisterDto = {
            email: 'existing.user@example.com',
            password: 'SecureP@ssw0rd123',
            firstName: 'Existing',
            lastName: 'User'
        };

        // First registration
        await apiClient.post('/auth/register', existingUserData);

        // Act - Attempt duplicate registration
        try {
            await apiClient.post('/auth/register', existingUserData);
            fail('Should have thrown conflict error');
        } catch (error: any) {
            // Assert
            expect(error.response.status).toBe(409);
            expect(error.response.data.message).toContain('email already exists');
        }
    });

    test('should reject registration with missing required fields', async () => {
        // Arrange
        const incompleteData = {
            email: 'test.user@example.com',
            // Missing password, firstName, lastName
        };

        // Act
        try {
            await apiClient.post('/auth/register', incompleteData);
            fail('Should have thrown validation error');
        } catch (error: any) {
            // Assert
            expect(error.response.status).toBe(400);
            expect(error.response.data.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'password' }),
                    expect.objectContaining({ field: 'firstName' }),
                    expect.objectContaining({ field: 'lastName' })
                ])
            );
        }
    });

    test('should reject registration with too long field values', async () => {
        // Arrange
        const tooLongData: RegisterDto = {
            email: 'a'.repeat(256) + '@example.com',
            password: 'SecureP@ssw0rd123',
            firstName: 'A'.repeat(51),
            lastName: 'B'.repeat(51)
        };

        // Act
        try {
            await apiClient.post('/auth/register', tooLongData);
            fail('Should have thrown validation error');
        } catch (error: any) {
            // Assert
            expect(error.response.status).toBe(400);
            expect(error.response.data.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'email' }),
                    expect.objectContaining({ field: 'firstName' }),
                    expect.objectContaining({ field: 'lastName' })
                ])
            );
        }
    });

    test('should create user with properly hashed password', async () => {
        // Arrange
        const registrationData: RegisterDto = {
            email: 'hash.test@example.com',
            password: 'SecureP@ssw0rd123',
            firstName: 'Hash',
            lastName: 'Test'
        };

        // Act
        const response = await apiClient.post('/auth/register', registrationData);

        // Verify password is hashed in database
        const user = await testEnv.db.query(
            'SELECT password_hash FROM users WHERE email = $1',
            [registrationData.email]
        );

        // Assert
        expect(response.status).toBe(201);
        expect(user.rows[0].password_hash).not.toBe(registrationData.password);
        expect(user.rows[0].password_hash).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/); // bcrypt hash pattern
    });
});