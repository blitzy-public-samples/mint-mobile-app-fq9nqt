// Third-party imports with versions
import { describe, beforeAll, afterAll, test, expect } from '@jest/globals'; // ^29.0.0
import { remote, Browser } from 'webdriverio'; // ^8.0.0

// Internal imports
import { 
    setupTestEnvironment, 
    cleanupTestEnvironment, 
    createTestContext, 
    waitForCondition 
} from '../../utils/test-helpers';

/**
 * Human Tasks Required:
 * 1. Configure Android emulator or physical device for testing
 * 2. Install and configure Appium server
 * 3. Set up test user credentials in .env.test
 * 4. Ensure app is built in test mode with proper configuration
 * 5. Configure test database with sample transaction data
 */

let driver: Browser;
let testContext: any;

describe('Android Transaction Flow Tests', () => {
    beforeAll(async () => {
        // Initialize test environment and context
        // Requirements addressed: Transaction Tracking (1.2 Scope/Core Features)
        testContext = createTestContext({
            platform: 'android',
            logLevel: 'debug'
        });

        // Set up WebdriverIO with Android capabilities
        driver = await remote({
            path: '/wd/hub',
            port: 4723,
            capabilities: {
                platformName: 'Android',
                automationName: 'UiAutomator2',
                deviceName: process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
                app: process.env.ANDROID_APP_PATH,
                noReset: false,
                fullReset: true
            }
        });

        // Initialize test environment
        await setupTestEnvironment({
            driver,
            context: testContext,
            auth: {
                username: process.env.TEST_USER_EMAIL,
                password: process.env.TEST_USER_PASSWORD
            }
        });

        // Login and navigate to dashboard
        await driver.$('~emailInput').setValue(process.env.TEST_USER_EMAIL);
        await driver.$('~passwordInput').setValue(process.env.TEST_USER_PASSWORD);
        await driver.$('~loginButton').click();

        // Wait for dashboard to load
        await waitForCondition(
            async () => await driver.$('~dashboardScreen').isDisplayed(),
            10000
        );
    });

    afterAll(async () => {
        // Cleanup test environment and close driver
        if (driver) {
            await driver.deleteSession();
        }
        await cleanupTestEnvironment({ context: testContext });
    });

    test('View Transactions', async () => {
        // Requirements addressed: User Interface Testing (8.1.2 Main Dashboard)
        
        // Verify recent transactions on dashboard
        const recentTransactions = await driver.$('~recentTransactionsList');
        expect(await recentTransactions.isDisplayed()).toBe(true);

        // Navigate to full transaction list
        await driver.$('~viewAllTransactionsButton').click();
        
        // Verify transaction list components
        const transactionList = await driver.$('~transactionList');
        expect(await transactionList.isDisplayed()).toBe(true);

        // Test sorting functionality
        await driver.$('~sortButton').click();
        await driver.$('~sortByDateOption').click();
        
        // Verify transaction details
        const firstTransaction = await driver.$('~transactionItem-0');
        await firstTransaction.click();
        
        const transactionDetails = await driver.$('~transactionDetailsScreen');
        expect(await transactionDetails.isDisplayed()).toBe(true);

        // Test offline viewing
        await driver.setNetwork({ offline: true });
        expect(await transactionList.isDisplayed()).toBe(true);
        await driver.setNetwork({ offline: false });
    });

    test('Create Transaction', async () => {
        // Requirements addressed: Mobile Data Management (5.2.1 Mobile Applications)
        
        // Open new transaction form
        await driver.$('~addTransactionButton').click();
        
        // Fill transaction details
        await driver.$('~transactionAmountInput').setValue('50.00');
        await driver.$('~transactionDescriptionInput').setValue('Test Transaction');
        await driver.$('~transactionDateInput').click();
        await driver.$('~confirmDateButton').click();
        
        // Select category
        await driver.$('~categorySelector').click();
        await driver.$('~categoryOption-groceries').click();
        
        // Add notes and tags
        await driver.$('~transactionNotesInput').setValue('E2E test transaction');
        await driver.$('~addTagButton').click();
        await driver.$('~tagInput').setValue('test');
        await driver.$('~confirmTagButton').click();
        
        // Submit transaction
        await driver.$('~saveTransactionButton').click();
        
        // Verify transaction appears in list
        await waitForCondition(
            async () => {
                const newTransaction = await driver.$('~transactionItem-0');
                const description = await newTransaction.$('~transactionDescription').getText();
                return description === 'Test Transaction';
            },
            5000
        );

        // Test offline creation
        await driver.setNetwork({ offline: true });
        await driver.$('~addTransactionButton').click();
        await driver.$('~transactionAmountInput').setValue('25.00');
        await driver.$('~transactionDescriptionInput').setValue('Offline Transaction');
        await driver.$('~saveTransactionButton').click();
        
        // Verify offline transaction is saved
        const offlineIndicator = await driver.$('~offlineSyncPendingIndicator');
        expect(await offlineIndicator.isDisplayed()).toBe(true);
        
        await driver.setNetwork({ offline: false });
    });

    test('Transaction Categorization', async () => {
        // Requirements addressed: Transaction Tracking (1.2 Scope/Core Features)
        
        // Select existing transaction
        const transaction = await driver.$('~transactionItem-0');
        await transaction.click();
        
        // Verify ML category suggestions
        const suggestedCategories = await driver.$('~suggestedCategoriesList');
        expect(await suggestedCategories.isDisplayed()).toBe(true);
        
        // Change category manually
        await driver.$('~changeCategoryButton').click();
        await driver.$('~categoryOption-entertainment').click();
        
        // Save and verify update
        await driver.$('~saveChangesButton').click();
        
        // Verify category update in list
        await waitForCondition(
            async () => {
                const updatedTransaction = await driver.$('~transactionItem-0');
                const category = await updatedTransaction.$('~transactionCategory').getText();
                return category === 'Entertainment';
            },
            5000
        );

        // Test bulk categorization
        await driver.$('~selectModeButton').click();
        await driver.$('~transactionItem-0').click();
        await driver.$('~transactionItem-1').click();
        await driver.$('~bulkCategoryButton').click();
        await driver.$('~categoryOption-shopping').click();
        await driver.$('~confirmBulkUpdateButton').click();
    });

    test('Transaction Search', async () => {
        // Requirements addressed: User Interface Testing (8.1.2 Main Dashboard)
        
        // Open search interface
        await driver.$('~searchButton').click();
        
        // Test search by description
        await driver.$('~searchInput').setValue('Test Transaction');
        await waitForCondition(
            async () => {
                const results = await driver.$$('~transactionItem');
                return results.length > 0;
            },
            5000
        );
        
        // Test date range filter
        await driver.$('~filterButton').click();
        await driver.$('~dateRangeFilter').click();
        await driver.$('~startDatePicker').click();
        await driver.$('~confirmDateButton').click();
        await driver.$('~endDatePicker').click();
        await driver.$('~confirmDateButton').click();
        await driver.$('~applyFiltersButton').click();
        
        // Test amount range filter
        await driver.$('~filterButton').click();
        await driver.$('~amountRangeFilter').click();
        await driver.$('~minAmountInput').setValue('10');
        await driver.$('~maxAmountInput').setValue('100');
        await driver.$('~applyFiltersButton').click();
        
        // Test category filter
        await driver.$('~filterButton').click();
        await driver.$('~categoryFilter').click();
        await driver.$('~categoryOption-shopping').click();
        await driver.$('~applyFiltersButton').click();
        
        // Verify empty search results handling
        await driver.$('~searchInput').setValue('NonexistentTransaction');
        const emptyState = await driver.$('~emptySearchState');
        expect(await emptyState.isDisplayed()).toBe(true);
        
        // Test search result sorting
        await driver.$('~searchInput').clear();
        await driver.$('~sortButton').click();
        await driver.$('~sortByAmountOption').click();
        
        // Verify sorted results
        const sortedTransactions = await driver.$$('~transactionAmount');
        const amounts = await Promise.all(
            sortedTransactions.map(async (elem) => {
                const amount = await elem.getText();
                return parseFloat(amount.replace(/[^0-9.-]+/g, ''));
            })
        );
        expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
    });
});