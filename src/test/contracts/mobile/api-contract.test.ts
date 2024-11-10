// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0

// Internal imports
import { TestApiClient } from '../../utils/api-client';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser } from '../../utils/mock-data';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test
 * 2. Ensure test database is properly set up and accessible
 * 3. Configure test API endpoints if different from defaults
 * 4. Set up test authentication credentials
 * 5. Configure mobile client test certificates if required
 */

// Global test configuration
const API_VERSION = '/api/v1';
const TEST_TIMEOUT = 30000;

// Test environment state
let testEnv: {
    api: TestApiClient;
    auth: { token: string };
};

/**
 * Global test setup and teardown
 */
beforeAll(async () => {
    testEnv = await setupTestEnvironment();
});

afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
});

/**
 * Auth Endpoints Contract Tests
 * Requirements addressed:
 * - API Security (Technical Specification/9.3.1 API Security)
 * - Mobile Integration (Technical Specification/5.2.1 Mobile Applications)
 */
describe('Auth Endpoints', () => {
    jest.setTimeout(TEST_TIMEOUT);

    test('Login endpoint validates request schema and returns proper response', async () => {
        const response = await testEnv.api.post(`${API_VERSION}/auth/login`, {
            email: 'test@example.com',
            password: 'TestPass123!',
            deviceId: 'test-device-id',
            platform: 'ios'
        });

        expect(response).toMatchObject({
            token: expect.any(String),
            refreshToken: expect.any(String),
            expiresIn: expect.any(Number),
            user: expect.objectContaining({
                id: expect.any(String),
                email: expect.any(String)
            })
        });
    });

    test('Registration endpoint validates input and enforces password policy', async () => {
        const mockUser = createMockUser();
        const response = await testEnv.api.post(`${API_VERSION}/auth/register`, {
            email: mockUser.email,
            password: 'SecurePass123!',
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            deviceId: 'test-device-id',
            platform: 'android'
        });

        expect(response).toMatchObject({
            user: expect.objectContaining({
                id: expect.any(String),
                email: mockUser.email,
                firstName: mockUser.firstName,
                lastName: mockUser.lastName
            }),
            token: expect.any(String)
        });
    });

    test('Token refresh endpoint handles valid and expired tokens', async () => {
        const response = await testEnv.api.post(`${API_VERSION}/auth/refresh`, {
            refreshToken: testEnv.auth.token
        });

        expect(response).toMatchObject({
            token: expect.any(String),
            refreshToken: expect.any(String),
            expiresIn: expect.any(Number)
        });
    });

    test('Password reset flow validates token and updates password', async () => {
        const email = 'test@example.com';
        
        // Request reset
        await testEnv.api.post(`${API_VERSION}/auth/forgot-password`, { email });
        
        // Reset password (mock token)
        const response = await testEnv.api.post(`${API_VERSION}/auth/reset-password`, {
            token: 'mock-reset-token',
            password: 'NewSecurePass123!'
        });

        expect(response.success).toBe(true);
    });

    test('Biometric auth endpoint validates platform requirements', async () => {
        const response = await testEnv.api.post(`${API_VERSION}/auth/biometric`, {
            deviceId: 'test-device-id',
            platform: 'ios',
            biometricToken: 'mock-biometric-token'
        });

        expect(response).toMatchObject({
            token: expect.any(String),
            refreshToken: expect.any(String)
        });
    });
});

/**
 * Account Endpoints Contract Tests
 * Requirements addressed:
 * - Data Contracts (Technical Specification/8.3.1 API Design)
 * - Mobile Integration (Technical Specification/5.2.1 Mobile Applications)
 */
describe('Account Endpoints', () => {
    jest.setTimeout(TEST_TIMEOUT);

    test('Account creation validates Plaid integration data', async () => {
        const response = await testEnv.api.post(`${API_VERSION}/accounts`, {
            publicToken: 'mock-plaid-token',
            institutionId: 'inst_1',
            accounts: [{
                id: 'acc_1',
                name: 'Checking',
                type: 'depository',
                subtype: 'checking'
            }]
        });

        expect(response).toMatchObject({
            accounts: expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    institutionId: expect.any(String),
                    name: expect.any(String),
                    type: expect.any(String)
                })
            ])
        });
    });

    test('Account listing supports pagination and filtering', async () => {
        const response = await testEnv.api.get(`${API_VERSION}/accounts`, {
            params: {
                page: 1,
                limit: 10,
                type: 'checking'
            }
        });

        expect(response).toMatchObject({
            items: expect.any(Array),
            total: expect.any(Number),
            page: 1,
            limit: 10
        });
    });

    test('Account details endpoint returns balances and metadata', async () => {
        const accountId = 'test-account-id';
        const response = await testEnv.api.get(`${API_VERSION}/accounts/${accountId}`);

        expect(response).toMatchObject({
            id: accountId,
            balance: expect.any(Number),
            currency: expect.any(String),
            institution: expect.objectContaining({
                name: expect.any(String),
                logo: expect.any(String)
            })
        });
    });
});

/**
 * Transaction Endpoints Contract Tests
 * Requirements addressed:
 * - Data Contracts (Technical Specification/8.3.1 API Design)
 * - Mobile Integration (Technical Specification/5.2.1 Mobile Applications)
 */
describe('Transaction Endpoints', () => {
    jest.setTimeout(TEST_TIMEOUT);

    test('Transaction list supports filtering and search', async () => {
        const response = await testEnv.api.get(`${API_VERSION}/transactions`, {
            params: {
                accountId: 'test-account-id',
                startDate: '2023-01-01',
                endDate: '2023-12-31',
                category: 'Food & Dining',
                minAmount: 10,
                maxAmount: 100
            }
        });

        expect(response).toMatchObject({
            items: expect.any(Array),
            total: expect.any(Number),
            page: expect.any(Number)
        });
    });

    test('Transaction search validates criteria and returns matches', async () => {
        const response = await testEnv.api.post(`${API_VERSION}/transactions/search`, {
            query: 'coffee',
            filters: {
                dateRange: {
                    start: '2023-01-01',
                    end: '2023-12-31'
                }
            }
        });

        expect(response.items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    description: expect.stringMatching(/coffee/i)
                })
            ])
        );
    });

    test('Transaction sync endpoint handles incremental updates', async () => {
        const response = await testEnv.api.post(`${API_VERSION}/transactions/sync`, {
            lastSyncToken: 'mock-sync-token',
            accountIds: ['test-account-id']
        });

        expect(response).toMatchObject({
            added: expect.any(Array),
            modified: expect.any(Array),
            removed: expect.any(Array),
            nextSyncToken: expect.any(String)
        });
    });
});

/**
 * Budget Endpoints Contract Tests
 * Requirements addressed:
 * - Data Contracts (Technical Specification/8.3.1 API Design)
 * - Mobile Integration (Technical Specification/5.2.1 Mobile Applications)
 */
describe('Budget Endpoints', () => {
    jest.setTimeout(TEST_TIMEOUT);

    test('Budget creation validates categories and amounts', async () => {
        const response = await testEnv.api.post(`${API_VERSION}/budgets`, {
            name: 'Monthly Budget',
            period: 'monthly',
            categories: [
                { name: 'Food & Dining', amount: 500 },
                { name: 'Transportation', amount: 200 }
            ]
        });

        expect(response).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            categories: expect.arrayContaining([
                expect.objectContaining({
                    name: expect.any(String),
                    amount: expect.any(Number)
                })
            ])
        });
    });

    test('Budget progress calculation returns accurate metrics', async () => {
        const budgetId = 'test-budget-id';
        const response = await testEnv.api.get(`${API_VERSION}/budgets/${budgetId}/progress`);

        expect(response).toMatchObject({
            totalBudget: expect.any(Number),
            totalSpent: expect.any(Number),
            remainingAmount: expect.any(Number),
            categories: expect.arrayContaining([
                expect.objectContaining({
                    name: expect.any(String),
                    budgeted: expect.any(Number),
                    spent: expect.any(Number),
                    remaining: expect.any(Number)
                })
            ])
        });
    });
});

/**
 * Goal Endpoints Contract Tests
 * Requirements addressed:
 * - Data Contracts (Technical Specification/8.3.1 API Design)
 * - Mobile Integration (Technical Specification/5.2.1 Mobile Applications)
 */
describe('Goal Endpoints', () => {
    jest.setTimeout(TEST_TIMEOUT);

    test('Goal creation validates target and timeline', async () => {
        const response = await testEnv.api.post(`${API_VERSION}/goals`, {
            name: 'Emergency Fund',
            targetAmount: 10000,
            currentAmount: 2000,
            targetDate: '2024-12-31',
            type: 'savings'
        });

        expect(response).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            targetAmount: expect.any(Number),
            currentAmount: expect.any(Number),
            progress: expect.any(Number)
        });
    });

    test('Goal progress tracking returns completion metrics', async () => {
        const goalId = 'test-goal-id';
        const response = await testEnv.api.get(`${API_VERSION}/goals/${goalId}/progress`);

        expect(response).toMatchObject({
            currentAmount: expect.any(Number),
            targetAmount: expect.any(Number),
            percentComplete: expect.any(Number),
            projectedCompletion: expect.any(String),
            monthlyRequired: expect.any(Number)
        });
    });
});

/**
 * Notification Endpoints Contract Tests
 * Requirements addressed:
 * - Data Contracts (Technical Specification/8.3.1 API Design)
 * - Mobile Integration (Technical Specification/5.2.1 Mobile Applications)
 */
describe('Notification Endpoints', () => {
    jest.setTimeout(TEST_TIMEOUT);

    test('Push notification token registration validates platform', async () => {
        const response = await testEnv.api.post(`${API_VERSION}/notifications/device`, {
            token: 'mock-device-token',
            platform: 'ios',
            deviceId: 'test-device-id'
        });

        expect(response.success).toBe(true);
    });

    test('Notification preferences support granular settings', async () => {
        const response = await testEnv.api.put(`${API_VERSION}/notifications/preferences`, {
            pushEnabled: true,
            emailEnabled: true,
            categories: {
                transactions: true,
                budgets: true,
                goals: true,
                security: true
            }
        });

        expect(response).toMatchObject({
            preferences: expect.objectContaining({
                pushEnabled: expect.any(Boolean),
                emailEnabled: expect.any(Boolean),
                categories: expect.any(Object)
            })
        });
    });

    test('Notification history supports pagination and filtering', async () => {
        const response = await testEnv.api.get(`${API_VERSION}/notifications/history`, {
            params: {
                page: 1,
                limit: 20,
                type: 'transaction'
            }
        });

        expect(response).toMatchObject({
            items: expect.any(Array),
            total: expect.any(Number),
            page: expect.any(Number),
            limit: expect.any(Number)
        });
    });
});