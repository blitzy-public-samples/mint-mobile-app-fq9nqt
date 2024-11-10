// Third-party imports with versions
import { describe, test, beforeAll, afterAll, beforeEach, expect } from '@jest/globals'; // ^29.0.0
import { device, element, by, waitFor } from 'detox'; // ^20.0.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { TestApiClient } from '../../utils/api-client';
import { createMockUser } from '../../utils/mock-data';

/**
 * Human Tasks Required:
 * 1. Configure Detox for iOS simulator in package.json
 * 2. Set up test environment variables in .env.test
 * 3. Ensure iOS app is built in debug configuration
 * 4. Configure test user credentials in test environment
 * 5. Set up test investment data in mock database
 */

describe('Investment Flow Tests', () => {
    let testEnv: {
        api: TestApiClient;
        auth: { token: string };
    };
    let testUser: any;

    // Setup test environment before all tests
    beforeAll(async () => {
        // Requirements addressed: Mobile Testing Standards
        // Initialize test environment with database and API client
        testEnv = await setupTestEnvironment();
        testUser = await createMockUser();

        // Launch app and login
        await device.launchApp({
            newInstance: true,
            permissions: { notifications: 'YES', camera: 'YES' }
        });

        // Login via API to get authenticated session
        await testEnv.api.post('/auth/login', {
            email: testUser.email,
            password: testUser.password
        });

        // Navigate to investments screen
        await element(by.id('tab-bar-investments')).tap();
        await waitFor(element(by.id('investment-dashboard-screen')))
            .toBeVisible()
            .withTimeout(5000);
    });

    // Cleanup after all tests
    afterAll(async () => {
        // Requirements addressed: Mobile Testing Standards
        await cleanupTestEnvironment(testEnv);
        await device.uninstallApp();
    });

    // Reset app state before each test
    beforeEach(async () => {
        // Requirements addressed: Mobile Testing Standards
        await device.reloadReactNative();
        await element(by.id('tab-bar-investments')).tap();
        
        // Clear any existing test data
        await testEnv.api.post('/test/reset-investment-data', {
            userId: testUser.id
        });
    });

    test('should display portfolio overview correctly', async () => {
        // Requirements addressed: Investment Dashboard (8.1.5)
        // Create test investment data via API
        const portfolioData = await testEnv.api.post('/investments/portfolio', {
            userId: testUser.id,
            totalValue: 50000,
            returnPercentage: 15.5,
            holdings: [
                {
                    symbol: 'AAPL',
                    shares: 10,
                    value: 1750.50,
                    returnPercentage: 12.3
                }
            ]
        });

        // Verify total portfolio value display
        const portfolioValueElement = element(by.id('portfolio-total-value'));
        await waitFor(portfolioValueElement)
            .toHaveText(`$${portfolioData.totalValue.toLocaleString()}`)
            .withTimeout(2000);

        // Check return percentage visibility and format
        const returnElement = element(by.id('portfolio-return-percentage'));
        await waitFor(returnElement)
            .toHaveText(`+${portfolioData.returnPercentage}%`)
            .withTimeout(2000);

        // Validate performance chart presence
        await expect(element(by.id('performance-chart'))).toBeVisible();

        // Test portfolio refresh functionality
        await element(by.id('investment-dashboard-screen')).swipe('down', 'slow', 0.5);
        await waitFor(element(by.id('refresh-indicator')))
            .not.toBeVisible()
            .withTimeout(5000);
    });

    test('should display investment holdings list correctly', async () => {
        // Requirements addressed: Investment Portfolio Tracking
        // Create test holdings via API
        const holdings = await testEnv.api.post('/investments/holdings', {
            userId: testUser.id,
            holdings: [
                {
                    symbol: 'AAPL',
                    shares: 10,
                    value: 1750.50,
                    returnPercentage: 12.3
                },
                {
                    symbol: 'GOOGL',
                    shares: 5,
                    value: 7500.25,
                    returnPercentage: 8.5
                }
            ]
        });

        // Verify holdings list count
        const holdingsList = element(by.id('holdings-list'));
        await waitFor(holdingsList).toBeVisible().withTimeout(2000);
        
        const holdingsCount = await holdingsList.getAttributes();
        expect(holdingsCount.elements).toBe(holdings.holdings.length);

        // Check individual holding details
        for (const holding of holdings.holdings) {
            const holdingElement = element(by.id(`holding-${holding.symbol}`));
            await expect(holdingElement).toBeVisible();
            
            // Verify holding information
            await expect(element(by.id(`${holding.symbol}-shares`)))
                .toHaveText(`${holding.shares} shares`);
            await expect(element(by.id(`${holding.symbol}-value`)))
                .toHaveText(`$${holding.value.toLocaleString()}`);
            await expect(element(by.id(`${holding.symbol}-return`)))
                .toHaveText(`${holding.returnPercentage > 0 ? '+' : ''}${holding.returnPercentage}%`);
        }

        // Test sorting functionality
        await element(by.id('sort-button')).tap();
        await element(by.id('sort-by-value')).tap();
        
        // Verify sorted order
        const sortedHoldings = [...holdings.holdings].sort((a, b) => b.value - a.value);
        for (let i = 0; i < sortedHoldings.length; i++) {
            const holdingValue = await element(by.id(`holding-${i}`))
                .getAttributes();
            expect(holdingValue.value).toBe(sortedHoldings[i].value);
        }
    });

    test('should display investment details correctly', async () => {
        // Requirements addressed: Investment Portfolio Tracking
        // Create test holding via API
        const holding = await testEnv.api.post('/investments/holdings', {
            userId: testUser.id,
            holdings: [{
                symbol: 'AAPL',
                shares: 10,
                value: 1750.50,
                returnPercentage: 12.3,
                costBasis: 1500.00,
                performance: {
                    '1D': 1.5,
                    '1W': 3.2,
                    '1M': 8.5,
                    '1Y': 15.7,
                    'ALL': 25.3
                }
            }]
        });

        // Navigate to holding detail view
        await element(by.id('holding-AAPL')).tap();
        await waitFor(element(by.id('investment-detail-screen')))
            .toBeVisible()
            .withTimeout(2000);

        // Verify holding information display
        await expect(element(by.id('detail-symbol'))).toHaveText('AAPL');
        await expect(element(by.id('detail-shares')))
            .toHaveText(`${holding.holdings[0].shares} shares`);
        await expect(element(by.id('detail-value')))
            .toHaveText(`$${holding.holdings[0].value.toLocaleString()}`);
        await expect(element(by.id('detail-cost-basis')))
            .toHaveText(`$${holding.holdings[0].costBasis.toLocaleString()}`);

        // Check performance metrics
        const periods = ['1D', '1W', '1M', '1Y', 'ALL'];
        for (const period of periods) {
            await expect(element(by.id(`performance-${period}`)))
                .toHaveText(`${holding.holdings[0].performance[period]}%`);
        }

        // Test back navigation
        await element(by.id('back-button')).tap();
        await expect(element(by.id('investment-dashboard-screen')))
            .toBeVisible();
    });

    test('should handle performance chart interactions correctly', async () => {
        // Requirements addressed: Investment Dashboard (8.1.5)
        // Create test performance data via API
        const performanceData = await testEnv.api.post('/investments/performance', {
            userId: testUser.id,
            data: {
                '1D': [
                    { timestamp: '2023-03-15T09:30:00Z', value: 49500 },
                    { timestamp: '2023-03-15T16:00:00Z', value: 50000 }
                ],
                '1W': [
                    { timestamp: '2023-03-08T16:00:00Z', value: 48000 },
                    { timestamp: '2023-03-15T16:00:00Z', value: 50000 }
                ],
                '1M': [
                    { timestamp: '2023-02-15T16:00:00Z', value: 45000 },
                    { timestamp: '2023-03-15T16:00:00Z', value: 50000 }
                ]
            }
        });

        // Verify chart rendering
        await expect(element(by.id('performance-chart'))).toBeVisible();

        // Test time period selection
        const periods = ['1D', '1W', '1M', '1Y', 'ALL'];
        for (const period of periods) {
            await element(by.id(`period-${period}`)).tap();
            
            if (performanceData.data[period]) {
                // Verify data points match API data
                const dataPoints = performanceData.data[period];
                const chartValues = await element(by.id('chart-values'))
                    .getAttributes();
                
                expect(chartValues.data).toEqual(
                    dataPoints.map(point => point.value)
                );
            }
        }

        // Test chart interactions
        await element(by.id('performance-chart')).pinch(1.5); // Zoom in
        await element(by.id('performance-chart')).pinch(0.5); // Zoom out
        await element(by.id('performance-chart')).swipe('left'); // Pan right
        await element(by.id('performance-chart')).swipe('right'); // Pan left
    });
});