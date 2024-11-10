// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'; // ^29.0.0
import dayjs from 'dayjs'; // ^1.11.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser, createMockAccount, createMockTransaction } from '../../utils/mock-data';

/**
 * Human Tasks Required:
 * 1. Ensure test database is configured with analytics tables and permissions
 * 2. Configure test environment variables for analytics service endpoints
 * 3. Set up test data retention policies
 * 4. Configure analytics service rate limits for testing
 * 5. Set up monitoring for test analytics processing
 */

describe('User Analytics Integration Tests', () => {
    let testEnv: any;
    let mockUser: any;
    let mockAccount: any;
    let mockTransactions: any[];
    let startDate: Date;
    let endDate: Date;

    // Setup test environment before all tests
    beforeAll(async () => {
        // Requirements addressed: Analytics and Reporting Engine (Technical Specification/1.1 System Overview)
        testEnv = await setupTestEnvironment({
            services: ['analytics', 'transactions', 'accounts'],
            enableMetrics: true
        });
    });

    // Cleanup test environment after all tests
    afterAll(async () => {
        await cleanupTestEnvironment(testEnv);
    });

    // Setup fresh test data before each test
    beforeEach(async () => {
        // Create test user
        mockUser = await createMockUser();

        // Create test account
        mockAccount = await createMockAccount(mockUser.id);

        // Set up test time period
        startDate = dayjs().subtract(30, 'days').toDate();
        endDate = dayjs().toDate();

        // Generate diverse test transactions across categories
        mockTransactions = [];
        const categories = ['Groceries', 'Transportation', 'Entertainment', 'Shopping', 'Utilities'];
        
        for (const category of categories) {
            // Create multiple transactions per category
            for (let i = 0; i < 5; i++) {
                const transactionDate = dayjs(startDate)
                    .add(Math.floor(Math.random() * 30), 'days')
                    .toDate();

                const transaction = await createMockTransaction(mockAccount.id, mockUser.id, {
                    category,
                    transactionDate,
                    amount: -Math.floor(Math.random() * 200) - 50 // Random amounts between -50 and -250
                });
                mockTransactions.push(transaction);
            }
        }

        // Add some income transactions
        for (let i = 0; i < 2; i++) {
            const transaction = await createMockTransaction(mockAccount.id, mockUser.id, {
                category: 'Income',
                transactionDate: dayjs(startDate).add(i * 15, 'days').toDate(),
                amount: 3000 // Bi-weekly salary
            });
            mockTransactions.push(transaction);
        }
    });

    // Cleanup test data after each test
    afterEach(async () => {
        // Clean up test transactions
        for (const transaction of mockTransactions) {
            await testEnv.db.collection('transactions').deleteOne({ id: transaction.id });
        }
        // Clean up test account and user
        await testEnv.db.collection('accounts').deleteOne({ id: mockAccount.id });
        await testEnv.db.collection('users').deleteOne({ id: mockUser.id });
    });

    test('should generate spending trends report', async () => {
        // Requirements addressed: Analytics and Reporting Engine (Technical Specification/1.1 System Overview)
        const response = await testEnv.api.post('/api/v1/analytics/spending-trends', {
            userId: mockUser.id,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            groupBy: 'category'
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('trends');
        expect(response.data.trends).toBeInstanceOf(Array);
        expect(response.data.period).toEqual({
            start: startDate.toISOString(),
            end: endDate.toISOString()
        });

        // Validate trends data structure
        response.data.trends.forEach((trend: any) => {
            expect(trend).toHaveProperty('category');
            expect(trend).toHaveProperty('totalSpent');
            expect(trend).toHaveProperty('transactionCount');
            expect(trend).toHaveProperty('averageTransaction');
            expect(trend).toHaveProperty('percentageOfTotal');
        });

        // Verify all categories are represented
        const categories = response.data.trends.map((t: any) => t.category);
        expect(categories).toContain('Groceries');
        expect(categories).toContain('Transportation');
        expect(categories).toContain('Entertainment');
    });

    test('should analyze budget performance', async () => {
        // Create test budget data
        const budgetCategories = {
            Groceries: 500,
            Transportation: 300,
            Entertainment: 200,
            Shopping: 400,
            Utilities: 250
        };

        const response = await testEnv.api.post('/api/v1/analytics/budget-performance', {
            userId: mockUser.id,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            budgetCategories
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('performance');
        expect(response.data.performance).toBeInstanceOf(Array);

        // Validate performance metrics
        response.data.performance.forEach((category: any) => {
            expect(category).toHaveProperty('category');
            expect(category).toHaveProperty('budgeted');
            expect(category).toHaveProperty('actual');
            expect(category).toHaveProperty('variance');
            expect(category).toHaveProperty('percentageUsed');
            expect(category).toHaveProperty('status'); // 'under', 'over', or 'on_track'
            expect(category).toHaveProperty('recommendations');
        });
    });

    test('should export analytics data', async () => {
        // Requirements addressed: Data Export and Reporting (Technical Specification/1.2 Scope/Core Features)
        const response = await testEnv.api.post('/api/v1/analytics/export', {
            userId: mockUser.id,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            format: 'csv',
            includeMetrics: ['spending_trends', 'budget_performance', 'cash_flow']
        });

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('text/csv');
        expect(response.data).toBeTruthy();

        // Validate CSV structure
        const csvLines = response.data.split('\n');
        expect(csvLines[0]).toContain('Category,Total Spent,Transaction Count,Average Transaction');
        expect(csvLines.length).toBeGreaterThan(1);
    });

    test('should handle date range filters', async () => {
        // Test different date ranges
        const dateRanges = [
            { start: dayjs().subtract(7, 'days'), end: dayjs(), label: 'Last 7 days' },
            { start: dayjs().subtract(14, 'days'), end: dayjs(), label: 'Last 14 days' },
            { start: dayjs().subtract(1, 'month'), end: dayjs(), label: 'Last month' }
        ];

        for (const range of dateRanges) {
            const response = await testEnv.api.post('/api/v1/analytics/spending-trends', {
                userId: mockUser.id,
                startDate: range.start.toDate().toISOString(),
                endDate: range.end.toDate().toISOString(),
                groupBy: 'category'
            });

            expect(response.status).toBe(200);
            expect(response.data.trends).toBeInstanceOf(Array);
            expect(response.data.period).toEqual({
                start: range.start.toDate().toISOString(),
                end: range.end.toDate().toISOString()
            });

            // Verify transactions are within date range
            const transactionDates = response.data.trends
                .flatMap((t: any) => t.transactions || [])
                .map((t: any) => dayjs(t.date));

            transactionDates.forEach(date => {
                expect(date.isAfter(range.start) || date.isSame(range.start)).toBeTruthy();
                expect(date.isBefore(range.end) || date.isSame(range.end)).toBeTruthy();
            });
        }
    });

    test('should handle empty data sets', async () => {
        // Clear all test transactions
        await testEnv.db.collection('transactions').deleteMany({ userId: mockUser.id });

        const response = await testEnv.api.post('/api/v1/analytics/spending-trends', {
            userId: mockUser.id,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            groupBy: 'category'
        });

        expect(response.status).toBe(200);
        expect(response.data.trends).toBeInstanceOf(Array);
        expect(response.data.trends).toHaveLength(0);
        expect(response.data.summary).toEqual({
            totalTransactions: 0,
            totalSpent: 0,
            averageTransaction: 0
        });
    });

    test('should generate accurate monthly comparisons', async () => {
        const currentMonth = dayjs().startOf('month');
        const previousMonth = currentMonth.subtract(1, 'month');

        const response = await testEnv.api.post('/api/v1/analytics/monthly-comparison', {
            userId: mockUser.id,
            months: [
                previousMonth.toDate().toISOString(),
                currentMonth.toDate().toISOString()
            ]
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('months');
        expect(response.data.months).toHaveLength(2);

        // Validate comparison metrics
        response.data.months.forEach((month: any) => {
            expect(month).toHaveProperty('period');
            expect(month).toHaveProperty('totalSpent');
            expect(month).toHaveProperty('categoryBreakdown');
            expect(month).toHaveProperty('averageTransactionSize');
            expect(month).toHaveProperty('transactionCount');
        });

        // Verify month-over-month calculations
        expect(response.data).toHaveProperty('comparison');
        expect(response.data.comparison).toHaveProperty('spendingTrend');
        expect(response.data.comparison).toHaveProperty('categoryChanges');
        expect(response.data.comparison).toHaveProperty('insights');
    });
});