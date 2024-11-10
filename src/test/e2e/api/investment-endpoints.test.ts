// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, teardownTestEnvironment } from '../../setup/test-environment';
import { TestApiClient } from '../../utils/api-client';
import { createTestContext } from '../../utils/test-helpers';

/**
 * Human Tasks Required:
 * 1. Configure test database with proper investment schema and permissions
 * 2. Set up test user credentials with investment access rights
 * 3. Configure test environment variables in .env.test
 * 4. Ensure test data cleanup scripts have proper permissions
 * 5. Verify investment-related API endpoints are accessible in test environment
 */

let apiClient: TestApiClient;
let testContext: any;

/**
 * Initialize test environment with proper security measures
 * Requirements addressed:
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 * - Security Testing (Technical Specification/9.3 Security Protocols/9.3.5 Secure Development)
 */
beforeAll(async () => {
    await setupTestEnvironment();
    testContext = createTestContext();
    apiClient = new TestApiClient({
        baseURL: process.env.TEST_API_URL,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json'
        }
    });
});

/**
 * Clean up test environment and resources
 * Requirements addressed:
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 */
afterAll(async () => {
    await teardownTestEnvironment();
});

/**
 * Reset test state before each test
 * Requirements addressed:
 * - Test Data Management (Technical Specification/8. System Design/Testing Standards)
 */
beforeEach(async () => {
    // Create fresh test investment data
    const testData = await testContext.utils.createTestInvestments();
    testContext.testData = testData;
});

/**
 * Clean up after each test
 * Requirements addressed:
 * - Test Data Management (Technical Specification/8. System Design/Testing Standards)
 */
afterEach(async () => {
    // Remove test investment data
    await testContext.utils.cleanupTestInvestments();
});

describe('Investment Endpoints', () => {
    /**
     * Test investment creation endpoint
     * Requirements addressed:
     * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
     * - Security Testing (Technical Specification/9.3 Security Protocols/9.3.5 Secure Development)
     */
    test('POST /api/investments - Should create a new investment with proper validation', async () => {
        // Prepare test data
        const newInvestment = {
            symbol: 'AAPL',
            quantity: 10,
            purchasePrice: 150.50,
            purchaseDate: new Date().toISOString(),
            accountId: testContext.testData.account.id
        };

        // Send authenticated request
        const response = await apiClient.post('/api/investments', newInvestment);

        // Verify response
        expect(response.status).toBe(201);
        expect(response.data).toMatchObject({
            id: expect.any(String),
            symbol: newInvestment.symbol,
            quantity: newInvestment.quantity,
            purchasePrice: newInvestment.purchasePrice,
            currentValue: expect.any(Number),
            performanceMetrics: expect.any(Object)
        });

        // Verify database entry
        const dbInvestment = await testContext.utils.getInvestmentById(response.data.id);
        expect(dbInvestment).toBeTruthy();

        // Verify audit log
        const auditLog = await testContext.utils.getAuditLog('investment_create', response.data.id);
        expect(auditLog).toBeTruthy();
    });

    /**
     * Test investment listing endpoint
     * Requirements addressed:
     * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
     * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
     */
    test('GET /api/investments - Should retrieve all investments for authenticated user', async () => {
        // Create multiple test investments
        const testInvestments = await testContext.utils.createMultipleTestInvestments(3);

        // Send authenticated request
        const response = await apiClient.get('/api/investments');

        // Verify response
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data.investments)).toBe(true);
        expect(response.data.investments.length).toBeGreaterThanOrEqual(3);

        // Verify pagination
        expect(response.data.pagination).toMatchObject({
            total: expect.any(Number),
            page: expect.any(Number),
            limit: expect.any(Number)
        });

        // Verify data structure
        response.data.investments.forEach((investment: any) => {
            expect(investment).toMatchObject({
                id: expect.any(String),
                symbol: expect.any(String),
                quantity: expect.any(Number),
                purchasePrice: expect.any(Number),
                currentValue: expect.any(Number),
                performanceMetrics: expect.any(Object)
            });
        });
    });

    /**
     * Test specific investment retrieval endpoint
     * Requirements addressed:
     * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
     * - Security Testing (Technical Specification/9.3 Security Protocols/9.3.5 Secure Development)
     */
    test('GET /api/investments/:id - Should retrieve specific investment details securely', async () => {
        // Create test investment
        const testInvestment = await testContext.utils.createTestInvestment();

        // Send authenticated request
        const response = await apiClient.get(`/api/investments/${testInvestment.id}`);

        // Verify response
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
            id: testInvestment.id,
            symbol: testInvestment.symbol,
            quantity: testInvestment.quantity,
            purchasePrice: testInvestment.purchasePrice,
            currentValue: expect.any(Number),
            performanceMetrics: {
                totalReturn: expect.any(Number),
                percentageReturn: expect.any(Number),
                annualizedReturn: expect.any(Number)
            }
        });

        // Verify sensitive data handling
        expect(response.data.accountDetails).toBeUndefined();
    });

    /**
     * Test investment update endpoint
     * Requirements addressed:
     * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
     * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
     */
    test('PUT /api/investments/:id - Should update investment details with validation', async () => {
        // Create test investment
        const testInvestment = await testContext.utils.createTestInvestment();

        // Prepare update data
        const updateData = {
            quantity: 15,
            notes: 'Updated investment position'
        };

        // Send authenticated request
        const response = await apiClient.put(`/api/investments/${testInvestment.id}`, updateData);

        // Verify response
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
            id: testInvestment.id,
            quantity: updateData.quantity,
            notes: updateData.notes
        });

        // Verify audit trail
        const auditLog = await testContext.utils.getAuditLog('investment_update', testInvestment.id);
        expect(auditLog).toBeTruthy();
    });

    /**
     * Test investment deletion endpoint
     * Requirements addressed:
     * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
     * - Security Testing (Technical Specification/9.3 Security Protocols/9.3.5 Secure Development)
     */
    test('DELETE /api/investments/:id - Should delete an investment securely', async () => {
        // Create test investment
        const testInvestment = await testContext.utils.createTestInvestment();

        // Send authenticated request
        const response = await apiClient.delete(`/api/investments/${testInvestment.id}`);

        // Verify response
        expect(response.status).toBe(204);

        // Verify investment removal
        const deletedInvestment = await testContext.utils.getInvestmentById(testInvestment.id);
        expect(deletedInvestment).toBeNull();

        // Verify audit log
        const auditLog = await testContext.utils.getAuditLog('investment_delete', testInvestment.id);
        expect(auditLog).toBeTruthy();
    });

    /**
     * Test investment performance calculation endpoint
     * Requirements addressed:
     * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
     * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
     */
    test('GET /api/investments/performance - Should calculate investment performance metrics', async () => {
        // Create investments with history
        const testInvestments = await testContext.utils.createInvestmentsWithHistory();

        // Send authenticated request
        const response = await apiClient.get('/api/investments/performance');

        // Verify response
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
            totalValue: expect.any(Number),
            totalCost: expect.any(Number),
            totalReturn: expect.any(Number),
            performanceMetrics: {
                dailyReturn: expect.any(Number),
                weeklyReturn: expect.any(Number),
                monthlyReturn: expect.any(Number),
                yearlyReturn: expect.any(Number),
                annualizedReturn: expect.any(Number)
            }
        });

        // Verify calculations
        expect(response.data.totalReturn).toBe(
            response.data.totalValue - response.data.totalCost
        );
    });

    /**
     * Test portfolio summary endpoint
     * Requirements addressed:
     * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
     * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
     */
    test('GET /api/investments/portfolio - Should retrieve comprehensive portfolio summary', async () => {
        // Create diverse investment portfolio
        const testPortfolio = await testContext.utils.createDiverseTestPortfolio();

        // Send authenticated request
        const response = await apiClient.get('/api/investments/portfolio');

        // Verify response
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
            summary: {
                totalValue: expect.any(Number),
                totalCost: expect.any(Number),
                totalReturn: expect.any(Number),
                returnPercentage: expect.any(Number)
            },
            allocation: {
                byAssetClass: expect.any(Object),
                bySector: expect.any(Object),
                byRegion: expect.any(Object)
            },
            riskMetrics: {
                beta: expect.any(Number),
                sharpeRatio: expect.any(Number),
                volatility: expect.any(Number)
            },
            holdings: expect.any(Array)
        });

        // Verify allocation percentages sum to 100
        const assetClassSum = Object.values(response.data.allocation.byAssetClass)
            .reduce((a: any, b: any) => a + b, 0);
        expect(Math.round(assetClassSum)).toBe(100);
    });
});