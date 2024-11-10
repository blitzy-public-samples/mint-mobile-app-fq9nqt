// Third-party imports with versions
import { describe, test, beforeAll, afterAll, expect } from '@jest/globals'; // ^29.0.0
import dayjs from 'dayjs'; // ^1.11.0

// Internal imports
import { setupTestEnvironment, teardownTestEnvironment } from '../../setup/test-environment';
import { createMockUser, createMockTransaction } from '../../utils/mock-data';
import { TestApiClient } from '../../utils/api-client';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test file
 * 2. Ensure test database is properly seeded with categories
 * 3. Verify API endpoints are accessible and properly configured
 * 4. Configure test timeouts if default values are not suitable
 * 5. Review and update test assertions based on business rules
 */

// Test suite configuration
const TEST_TIMEOUT = 30000;

// Global test variables
let testUser: any;
let testTransactions: any[];
let apiClient: TestApiClient;

/**
 * Requirements addressed:
 * - Analytics and Reporting Engine (Technical Specification/1.1 System Overview)
 * - Data Export and Reporting (Technical Specification/1.2 Scope/Core Features)
 */
describe('Transaction Analytics Integration Tests', () => {
    beforeAll(async () => {
        // Initialize test environment
        await setupTestEnvironment();

        // Create test API client
        apiClient = new TestApiClient({
            baseURL: process.env.TEST_API_URL,
            timeout: TEST_TIMEOUT
        });

        // Create test user
        testUser = createMockUser();
        const userResponse = await apiClient.post('/api/users', testUser);
        testUser.id = userResponse.id;

        // Set authentication token
        apiClient.setAuthToken(userResponse.token);

        // Generate test transactions across multiple categories and time periods
        testTransactions = [];
        const categories = ['Food & Dining', 'Shopping', 'Transportation', 'Utilities', 'Entertainment'];
        const amounts = [15.99, 45.50, 25.00, 100.00, 75.25];
        
        for (let i = 0; i < 50; i++) {
            const transaction = createMockTransaction(
                'test-account-id',
                testUser.id,
                {
                    category: categories[i % categories.length],
                    amount: amounts[i % amounts.length],
                    transactionDate: dayjs()
                        .subtract(i % 30, 'days')
                        .toDate()
                }
            );
            const response = await apiClient.post('/api/transactions', transaction);
            testTransactions.push(response);
        }
    }, TEST_TIMEOUT);

    afterAll(async () => {
        // Clean up test transactions
        for (const transaction of testTransactions) {
            await apiClient.delete(`/api/transactions/${transaction.id}`);
        }

        // Clean up test user
        await apiClient.delete(`/api/users/${testUser.id}`);

        // Tear down test environment
        await teardownTestEnvironment();
    }, TEST_TIMEOUT);

    test('should analyze spending trends with predefined transaction patterns', async () => {
        // Get spending trends analysis
        const response = await apiClient.get('/api/analytics/spending-trends', {
            params: {
                userId: testUser.id,
                startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
                endDate: dayjs().format('YYYY-MM-DD'),
                groupBy: 'category'
            }
        });

        // Verify response structure
        expect(response).toHaveProperty('trends');
        expect(response.trends).toBeInstanceOf(Array);
        expect(response.trends.length).toBeGreaterThan(0);

        // Verify trend calculations
        for (const trend of response.trends) {
            expect(trend).toHaveProperty('category');
            expect(trend).toHaveProperty('totalAmount');
            expect(trend).toHaveProperty('transactionCount');
            expect(trend).toHaveProperty('averageAmount');
            expect(trend).toHaveProperty('percentageOfTotal');

            // Validate calculations
            expect(trend.averageAmount).toBe(
                trend.totalAmount / trend.transactionCount
            );
            expect(trend.percentageOfTotal).toBeGreaterThanOrEqual(0);
            expect(trend.percentageOfTotal).toBeLessThanOrEqual(100);
        }

        // Verify total calculations
        const totalPercentage = response.trends.reduce(
            (sum: number, trend: any) => sum + trend.percentageOfTotal,
            0
        );
        expect(Math.round(totalPercentage)).toBe(100);
    }, TEST_TIMEOUT);

    test('should analyze transaction categorization with diverse transaction types', async () => {
        // Get categorization analysis
        const response = await apiClient.get('/api/analytics/categorization', {
            params: {
                userId: testUser.id,
                period: 'last30days'
            }
        });

        // Verify response structure
        expect(response).toHaveProperty('categories');
        expect(response).toHaveProperty('summary');
        expect(response.categories).toBeInstanceOf(Array);

        // Verify category distribution
        for (const category of response.categories) {
            expect(category).toHaveProperty('name');
            expect(category).toHaveProperty('count');
            expect(category).toHaveProperty('totalAmount');
            expect(category).toHaveProperty('averageAmount');
            expect(category).toHaveProperty('trend');

            // Validate category metrics
            expect(category.count).toBeGreaterThan(0);
            expect(category.totalAmount).toBeGreaterThan(0);
            expect(category.averageAmount).toBeGreaterThan(0);
            expect(['increasing', 'decreasing', 'stable']).toContain(category.trend);
        }

        // Verify summary statistics
        expect(response.summary).toHaveProperty('totalTransactions');
        expect(response.summary).toHaveProperty('totalAmount');
        expect(response.summary).toHaveProperty('averageTransactionAmount');
        expect(response.summary).toHaveProperty('mostFrequentCategory');
        expect(response.summary).toHaveProperty('highestSpendingCategory');
    }, TEST_TIMEOUT);

    test('should export analytics data with proper format validation', async () => {
        // Request analytics export
        const response = await apiClient.post('/api/analytics/export', {
            userId: testUser.id,
            startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
            endDate: dayjs().format('YYYY-MM-DD'),
            format: 'json',
            includeCategories: true,
            includeTrends: true
        });

        // Verify export structure
        expect(response).toHaveProperty('exportId');
        expect(response).toHaveProperty('data');
        expect(response).toHaveProperty('metadata');

        // Verify exported data
        const exportedData = response.data;
        expect(exportedData).toHaveProperty('transactions');
        expect(exportedData).toHaveProperty('categories');
        expect(exportedData).toHaveProperty('trends');
        expect(exportedData).toHaveProperty('summary');

        // Validate transaction data
        expect(exportedData.transactions).toBeInstanceOf(Array);
        for (const transaction of exportedData.transactions) {
            expect(transaction).toHaveProperty('id');
            expect(transaction).toHaveProperty('amount');
            expect(transaction).toHaveProperty('category');
            expect(transaction).toHaveProperty('date');
            expect(transaction).toHaveProperty('description');
        }

        // Validate metadata
        expect(response.metadata).toHaveProperty('exportDate');
        expect(response.metadata).toHaveProperty('dateRange');
        expect(response.metadata).toHaveProperty('totalRecords');
        expect(response.metadata).toHaveProperty('format');
        expect(response.metadata.totalRecords).toBe(exportedData.transactions.length);
    }, TEST_TIMEOUT);

    test('should analyze spending patterns over multiple time periods', async () => {
        // Get spending pattern analysis
        const response = await apiClient.get('/api/analytics/spending-patterns', {
            params: {
                userId: testUser.id,
                periods: ['daily', 'weekly', 'monthly'],
                startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
                endDate: dayjs().format('YYYY-MM-DD')
            }
        });

        // Verify response structure
        expect(response).toHaveProperty('patterns');
        expect(response.patterns).toHaveProperty('daily');
        expect(response.patterns).toHaveProperty('weekly');
        expect(response.patterns).toHaveProperty('monthly');

        // Validate daily patterns
        expect(response.patterns.daily).toBeInstanceOf(Array);
        for (const day of response.patterns.daily) {
            expect(day).toHaveProperty('date');
            expect(day).toHaveProperty('totalAmount');
            expect(day).toHaveProperty('transactionCount');
            expect(day).toHaveProperty('categories');
        }

        // Validate weekly patterns
        expect(response.patterns.weekly).toBeInstanceOf(Array);
        for (const week of response.patterns.weekly) {
            expect(week).toHaveProperty('startDate');
            expect(week).toHaveProperty('endDate');
            expect(week).toHaveProperty('totalAmount');
            expect(week).toHaveProperty('averageDailyAmount');
            expect(week).toHaveProperty('topCategories');
        }

        // Validate monthly patterns
        expect(response.patterns.monthly).toBeInstanceOf(Array);
        for (const month of response.patterns.monthly) {
            expect(month).toHaveProperty('month');
            expect(month).toHaveProperty('year');
            expect(month).toHaveProperty('totalAmount');
            expect(month).toHaveProperty('averageWeeklyAmount');
            expect(month).toHaveProperty('categoryDistribution');
        }
    }, TEST_TIMEOUT);
});