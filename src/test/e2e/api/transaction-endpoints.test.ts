// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0
import dayjs from 'dayjs'; // ^1.11.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser, createMockAccount, createMockTransaction } from '../../utils/mock-data';
import { TestApiClient } from '../../utils/api-client';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test
 * 2. Ensure test database is set up with proper permissions
 * 3. Configure test API endpoints and authentication
 * 4. Set up test logging directory with write permissions
 * 5. Verify rate limiting settings for test environment
 */

// Global test configuration
const TEST_TIMEOUT = 30000;
const API_BASE_URL = process.env.TEST_API_BASE_URL || 'http://localhost:3000';

// Test environment state
let testEnv: {
    db: any;
    api: TestApiClient;
    auth: { token: string };
    testUser: any;
    testAccount: any;
};

/**
 * Setup function that runs before all tests
 * Requirements addressed:
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 * - API Security (Technical Specification/9.3.1 API Security)
 */
beforeAll(async () => {
    // Initialize test environment
    testEnv = await setupTestEnvironment();

    // Create test user and account
    testEnv.testUser = await createMockUser();
    testEnv.testAccount = await createMockAccount(testEnv.testUser.id);

    // Configure API client with authentication
    testEnv.api.setAuthToken(testEnv.auth.token);
}, TEST_TIMEOUT);

/**
 * Cleanup function that runs after all tests
 * Requirements addressed:
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 * - Data Validation (Technical Specification/8.2 Database Design/8.2.1 Schema Design)
 */
afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
}, TEST_TIMEOUT);

describe('Transaction API Endpoints', () => {
    /**
     * Tests transaction creation endpoint with validation
     * Requirements addressed:
     * - Transaction Management (Technical Specification/6.1.1 Core Application Components/TransactionManager)
     * - Data Validation (Technical Specification/8.2 Database Design/8.2.1 Schema Design)
     */
    test('should create a new transaction with valid data', async () => {
        // Create mock transaction data
        const mockTransaction = createMockTransaction(
            testEnv.testAccount.id,
            testEnv.testUser.id
        );

        // Send POST request to create transaction
        const response = await testEnv.api.post('/api/v1/transactions', mockTransaction);

        // Verify response
        expect(response.status).toBe(201);
        expect(response.data).toMatchObject({
            id: expect.any(String),
            accountId: mockTransaction.accountId,
            userId: mockTransaction.userId,
            amount: mockTransaction.amount,
            description: mockTransaction.description,
            category: mockTransaction.category,
            merchantName: mockTransaction.merchantName,
            transactionDate: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
        });

        // Test validation errors
        const invalidTransaction = { ...mockTransaction, amount: 'invalid' };
        await expect(
            testEnv.api.post('/api/v1/transactions', invalidTransaction)
        ).rejects.toThrow();
    }, TEST_TIMEOUT);

    /**
     * Tests transaction retrieval with pagination and filtering
     * Requirements addressed:
     * - Transaction Management (Technical Specification/6.1.1 Core Application Components/TransactionManager)
     * - API Security (Technical Specification/9.3.1 API Security)
     */
    test('should retrieve transactions with pagination and filtering', async () => {
        // Create multiple test transactions
        const transactions = await Promise.all([
            createMockTransaction(testEnv.testAccount.id, testEnv.testUser.id),
            createMockTransaction(testEnv.testAccount.id, testEnv.testUser.id),
            createMockTransaction(testEnv.testAccount.id, testEnv.testUser.id)
        ].map(tx => testEnv.api.post('/api/v1/transactions', tx)));

        // Test pagination
        const paginatedResponse = await testEnv.api.get('/api/v1/transactions', {
            params: { page: 1, limit: 2 }
        });
        expect(paginatedResponse.data.length).toBe(2);
        expect(paginatedResponse.meta.totalPages).toBeGreaterThan(1);

        // Test date range filtering
        const dateFilterResponse = await testEnv.api.get('/api/v1/transactions', {
            params: {
                startDate: dayjs().subtract(30, 'days').toISOString(),
                endDate: dayjs().toISOString()
            }
        });
        expect(dateFilterResponse.data.length).toBeGreaterThan(0);

        // Test category filtering
        const categoryFilterResponse = await testEnv.api.get('/api/v1/transactions', {
            params: { category: transactions[0].category }
        });
        expect(categoryFilterResponse.data.every(tx => tx.category === transactions[0].category)).toBe(true);
    }, TEST_TIMEOUT);

    /**
     * Tests transaction update functionality
     * Requirements addressed:
     * - Transaction Management (Technical Specification/6.1.1 Core Application Components/TransactionManager)
     * - Data Validation (Technical Specification/8.2 Database Design/8.2.1 Schema Design)
     */
    test('should update transaction with valid changes', async () => {
        // Create test transaction
        const transaction = await testEnv.api.post(
            '/api/v1/transactions',
            createMockTransaction(testEnv.testAccount.id, testEnv.testUser.id)
        );

        // Update transaction
        const updates = {
            description: 'Updated Description',
            category: 'Shopping',
            merchantName: 'Updated Merchant'
        };

        const response = await testEnv.api.put(
            `/api/v1/transactions/${transaction.id}`,
            updates
        );

        // Verify updates
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
            ...transaction,
            ...updates,
            updatedAt: expect.any(String)
        });

        // Test validation errors
        await expect(
            testEnv.api.put(`/api/v1/transactions/${transaction.id}`, { amount: 'invalid' })
        ).rejects.toThrow();
    }, TEST_TIMEOUT);

    /**
     * Tests transaction deletion endpoint
     * Requirements addressed:
     * - Transaction Management (Technical Specification/6.1.1 Core Application Components/TransactionManager)
     * - API Security (Technical Specification/9.3.1 API Security)
     */
    test('should delete transaction and handle non-existent transactions', async () => {
        // Create test transaction
        const transaction = await testEnv.api.post(
            '/api/v1/transactions',
            createMockTransaction(testEnv.testAccount.id, testEnv.testUser.id)
        );

        // Delete transaction
        const response = await testEnv.api.delete(`/api/v1/transactions/${transaction.id}`);
        expect(response.status).toBe(204);

        // Verify deletion
        await expect(
            testEnv.api.get(`/api/v1/transactions/${transaction.id}`)
        ).rejects.toThrow();

        // Test deleting non-existent transaction
        await expect(
            testEnv.api.delete('/api/v1/transactions/non-existent-id')
        ).rejects.toThrow();
    }, TEST_TIMEOUT);

    /**
     * Tests transaction search functionality
     * Requirements addressed:
     * - Transaction Management (Technical Specification/6.1.1 Core Application Components/TransactionManager)
     */
    test('should search transactions with multiple criteria', async () => {
        // Create transactions with various search criteria
        const searchTransactions = await Promise.all([
            createMockTransaction(testEnv.testAccount.id, testEnv.testUser.id, {
                merchantName: 'Target Store',
                amount: -50.00,
                category: 'Shopping'
            }),
            createMockTransaction(testEnv.testAccount.id, testEnv.testUser.id, {
                merchantName: 'Amazon.com',
                amount: -75.50,
                category: 'Shopping'
            }),
            createMockTransaction(testEnv.testAccount.id, testEnv.testUser.id, {
                merchantName: 'Walmart',
                amount: -25.75,
                category: 'Groceries'
            })
        ].map(tx => testEnv.api.post('/api/v1/transactions', tx)));

        // Test merchant name search
        const merchantResponse = await testEnv.api.get('/api/v1/transactions/search', {
            params: { merchantName: 'Target' }
        });
        expect(merchantResponse.data.some(tx => tx.merchantName.includes('Target'))).toBe(true);

        // Test amount range search
        const amountResponse = await testEnv.api.get('/api/v1/transactions/search', {
            params: { minAmount: -80, maxAmount: -50 }
        });
        expect(amountResponse.data.every(tx => tx.amount >= -80 && tx.amount <= -50)).toBe(true);

        // Test category search
        const categoryResponse = await testEnv.api.get('/api/v1/transactions/search', {
            params: { category: 'Shopping' }
        });
        expect(categoryResponse.data.every(tx => tx.category === 'Shopping')).toBe(true);
    }, TEST_TIMEOUT);

    /**
     * Tests automatic transaction categorization
     * Requirements addressed:
     * - Transaction Management (Technical Specification/6.1.1 Core Application Components/TransactionManager)
     */
    test('should automatically categorize transactions', async () => {
        // Create uncategorized transaction
        const uncategorizedTx = await testEnv.api.post(
            '/api/v1/transactions',
            createMockTransaction(testEnv.testAccount.id, testEnv.testUser.id, {
                category: null,
                merchantName: 'Netflix'
            })
        );

        // Trigger auto-categorization
        const categorizedResponse = await testEnv.api.post(
            `/api/v1/transactions/${uncategorizedTx.id}/categorize`
        );

        // Verify categorization
        expect(categorizedResponse.status).toBe(200);
        expect(categorizedResponse.data).toMatchObject({
            id: uncategorizedTx.id,
            category: expect.any(String),
            confidence: expect.any(Number)
        });

        // Verify category rules
        expect(categorizedResponse.data.category).toBe('Entertainment');
        expect(categorizedResponse.data.confidence).toBeGreaterThan(0.8);
    }, TEST_TIMEOUT);
});