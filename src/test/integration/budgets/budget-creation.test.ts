// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, teardownTestEnvironment } from '../../setup/test-environment';
import { createMockUser, createMockBudget } from '../../utils/mock-data';
import { TestApiClient } from '../../utils/api-client';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test file
 * 2. Ensure test database is properly configured and accessible
 * 3. Verify Redis server is running for session management
 * 4. Configure test logging settings if needed
 * 5. Set up test user credentials and permissions
 */

// Global test context
let apiClient: TestApiClient;
let testUser: any;
let authToken: string;

/**
 * Test suite for budget creation functionality
 * Requirements addressed:
 * - Budget Creation (Technical Specification/1.2 Scope/Core Features)
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 * - Input Validation (Technical Specification/9.3.1 API Security)
 * - Security Testing (Technical Specification/9.3.5 Secure Development)
 */
describe('Budget Creation Integration Tests', () => {
    // Initialize test environment
    beforeAll(async () => {
        await setupTestEnvironment();
        apiClient = new TestApiClient({
            baseURL: process.env.TEST_API_URL || 'http://localhost:3000'
        });
    });

    // Clean up test environment
    afterAll(async () => {
        await teardownTestEnvironment();
    });

    // Set up test context before each test
    beforeEach(async () => {
        // Create test user and get authentication token
        testUser = createMockUser();
        const response = await apiClient.post('/api/v1/auth/register', {
            email: testUser.email,
            password: 'Test123!@#',
            firstName: testUser.firstName,
            lastName: testUser.lastName
        });
        authToken = response.token;
        apiClient.setAuthToken(authToken);
    });

    // Clean up test context after each test
    afterEach(async () => {
        // Clean up test data
        if (testUser?.id) {
            await apiClient.delete(`/api/v1/users/${testUser.id}`);
        }
    });

    /**
     * Test successful budget creation with valid data
     * Requirements addressed:
     * - Budget Creation (Technical Specification/1.2 Scope/Core Features)
     * - Data Validation (Technical Specification/9.3.1 API Security)
     */
    test('should successfully create a budget with valid data', async () => {
        // Generate valid mock budget data
        const mockBudget = createMockBudget(testUser.id);

        // Send budget creation request
        const response = await apiClient.post('/api/v1/budgets', mockBudget);

        // Verify response
        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data.userId).toBe(testUser.id);
        expect(response.data.name).toBe(mockBudget.name);
        expect(response.data.totalAllocated).toBe(mockBudget.totalAllocated);
        expect(response.data.categories).toHaveLength(mockBudget.categories.length);

        // Verify budget persistence
        const savedBudget = await apiClient.get(`/api/v1/budgets/${response.data.id}`);
        expect(savedBudget).toMatchObject({
            ...mockBudget,
            id: response.data.id
        });
    });

    /**
     * Test budget input validation
     * Requirements addressed:
     * - Input Validation (Technical Specification/9.3.1 API Security)
     * - Data Security (Technical Specification/9.3.5 Secure Development)
     */
    test('should validate budget input data', async () => {
        const invalidBudgets = [
            // Missing required fields
            { userId: testUser.id },
            // Invalid amount format
            {
                ...createMockBudget(testUser.id),
                categories: [{ category: 'Food', allocated: 'invalid' }]
            },
            // Invalid date range
            {
                ...createMockBudget(testUser.id),
                startDate: new Date('2023-12-31'),
                endDate: new Date('2023-01-01')
            },
            // Empty categories
            {
                ...createMockBudget(testUser.id),
                categories: []
            }
        ];

        for (const invalidBudget of invalidBudgets) {
            const response = await apiClient.post('/api/v1/budgets', invalidBudget);
            expect(response.status).toBe(400);
            expect(response.data).toHaveProperty('error');
            expect(response.data.error).toHaveProperty('message');
        }
    });

    /**
     * Test handling of duplicate budget periods
     * Requirements addressed:
     * - Data Integrity (Technical Specification/9.3.1 API Security)
     */
    test('should handle duplicate budget periods', async () => {
        // Create initial budget
        const initialBudget = createMockBudget(testUser.id);
        await apiClient.post('/api/v1/budgets', initialBudget);

        // Attempt to create overlapping budget
        const duplicateBudget = createMockBudget(testUser.id, {
            startDate: initialBudget.startDate,
            endDate: initialBudget.endDate
        });

        const response = await apiClient.post('/api/v1/budgets', duplicateBudget);
        expect(response.status).toBe(409);
        expect(response.data.error.message).toContain('overlapping budget period');

        // Verify original budget remains unchanged
        const savedBudget = await apiClient.get('/api/v1/budgets', {
            params: {
                userId: testUser.id,
                startDate: initialBudget.startDate,
                endDate: initialBudget.endDate
            }
        });
        expect(savedBudget.data).toHaveLength(1);
        expect(savedBudget.data[0]).toMatchObject(initialBudget);
    });

    /**
     * Test unauthorized budget creation attempts
     * Requirements addressed:
     * - Security Testing (Technical Specification/9.3.5 Secure Development)
     * - Authentication (Technical Specification/9.3.1 API Security)
     */
    test('should prevent unauthorized budget creation', async () => {
        const mockBudget = createMockBudget(testUser.id);

        // Test without auth token
        apiClient.setAuthToken('');
        let response = await apiClient.post('/api/v1/budgets', mockBudget);
        expect(response.status).toBe(401);

        // Test with invalid auth token
        apiClient.setAuthToken('invalid_token');
        response = await apiClient.post('/api/v1/budgets', mockBudget);
        expect(response.status).toBe(401);

        // Test with expired token
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMo';
        apiClient.setAuthToken(expiredToken);
        response = await apiClient.post('/api/v1/budgets', mockBudget);
        expect(response.status).toBe(401);

        // Test with different user's ID
        apiClient.setAuthToken(authToken);
        const differentUserBudget = createMockBudget('different_user_id');
        response = await apiClient.post('/api/v1/budgets', differentUserBudget);
        expect(response.status).toBe(403);
    });
});