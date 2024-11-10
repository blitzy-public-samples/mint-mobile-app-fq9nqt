// Third-party imports with versions
import { describe, beforeAll, afterAll, test, expect } from '@jest/globals'; // ^29.0.0
import { remote } from 'webdriverio'; // ^8.0.0
import { browser } from '@wdio/globals'; // ^8.0.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../../utils/test-helpers';
import { createMockBudget } from '../../../utils/mock-data';
import { Budget } from '../../../../android/app/src/main/java/com/mintreplica/lite/domain/model/Budget';

/**
 * Human Tasks Required:
 * 1. Configure WebDriverIO for Android testing in wdio.conf.js
 * 2. Set up Android emulator or physical device for testing
 * 3. Install and configure Appium server
 * 4. Ensure app APK is built and accessible
 * 5. Set up test user credentials in .env.test
 */

describe('Android Budget Management Flow', () => {
    let driver: WebdriverIO.Browser;
    let testEnv: any;
    let mockBudget: any;

    beforeAll(async () => {
        // Initialize test environment
        testEnv = await setupTestEnvironment();

        // Configure WebDriverIO for Android
        driver = await remote({
            path: '/wd/hub',
            port: 4723,
            capabilities: {
                platformName: 'Android',
                automationName: 'UiAutomator2',
                deviceName: process.env.ANDROID_DEVICE_NAME || 'Pixel_4_API_30',
                app: process.env.ANDROID_APP_PATH || './app/build/outputs/apk/debug/app-debug.apk',
                appPackage: 'com.mintreplica.lite',
                appActivity: '.MainActivity',
                noReset: false
            }
        });

        // Login test user
        await driver.$('~emailInput').setValue(process.env.TEST_USER_EMAIL);
        await driver.$('~passwordInput').setValue(process.env.TEST_USER_PASSWORD);
        await driver.$('~loginButton').click();

        // Navigate to budgets section
        await driver.$('~budgetsTab').click();
    });

    afterAll(async () => {
        // Close WebDriverIO session
        if (driver) {
            await driver.deleteSession();
        }

        // Clean up test environment
        await cleanupTestEnvironment(testEnv);
    });

    test('Create new budget with validation', async () => {
        // Requirements: Budget Management (1.2 Scope/Core Features)
        
        // Click create budget button
        await driver.$('~createBudgetButton').click();
        
        // Fill budget form
        const budgetName = 'Monthly Groceries';
        const budgetAmount = '500.00';
        
        await driver.$('~budgetNameInput').setValue(budgetName);
        await driver.$('~budgetAmountInput').setValue(budgetAmount);
        
        // Select budget period
        await driver.$('~periodDropdown').click();
        await driver.$('~periodMonthly').click();
        
        // Select budget category
        await driver.$('~categoryDropdown').click();
        await driver.$('~categoryFood').click();
        
        // Submit form
        await driver.$('~saveBudgetButton').click();
        
        // Verify budget creation
        const budgetCard = await driver.$(`~budget-${budgetName}`);
        expect(await budgetCard.isDisplayed()).toBe(true);
        
        const budgetAmountText = await driver.$(`~budget-amount-${budgetName}`).getText();
        expect(budgetAmountText).toContain(budgetAmount);
    });

    test('Track budget spending and progress', async () => {
        // Requirements: Mobile Application Testing (5.2.1 Mobile Applications)
        
        // Create test budget
        mockBudget = createMockBudget(testEnv.auth.userId, {
            amount: 1000,
            spent: 750
        });
        await testEnv.api.post('/budgets', mockBudget);
        
        // Refresh budgets list
        await driver.$('~refreshButton').click();
        
        // Verify budget progress
        const progressBar = await driver.$(`~budget-progress-${mockBudget.id}`);
        const progressText = await progressBar.getText();
        expect(progressText).toContain('75%'); // 750/1000 = 75%
        
        // Check remaining amount
        const remainingAmount = await driver.$(`~budget-remaining-${mockBudget.id}`).getText();
        expect(remainingAmount).toContain('250.00');
        
        // Validate spent percentage
        const spentPercentage = await driver.$(`~budget-percentage-${mockBudget.id}`).getText();
        expect(spentPercentage).toContain('75%');
    });

    test('Budget overspending alerts', async () => {
        // Requirements: E2E Testing Standards (A.4 Development Standards Reference/Testing Standards)
        
        // Create budget near limit
        mockBudget = createMockBudget(testEnv.auth.userId, {
            amount: 100,
            spent: 95
        });
        await testEnv.api.post('/budgets', mockBudget);
        
        // Add transaction to trigger alert
        await testEnv.api.post('/transactions', {
            budgetId: mockBudget.id,
            amount: 10,
            category: mockBudget.category
        });
        
        // Refresh to trigger alert
        await driver.$('~refreshButton').click();
        
        // Verify alert appears
        const alert = await driver.$('~budgetAlertMessage');
        expect(await alert.isDisplayed()).toBe(true);
        
        const alertText = await alert.getText();
        expect(alertText).toContain('Budget Exceeded');
        
        // Dismiss alert
        await driver.$('~dismissAlertButton').click();
        expect(await alert.isDisplayed()).toBe(false);
    });

    test('Edit existing budget', async () => {
        // Requirements: Budget Management (1.2 Scope/Core Features)
        
        // Create test budget
        mockBudget = createMockBudget(testEnv.auth.userId);
        await testEnv.api.post('/budgets', mockBudget);
        
        // Open budget details
        await driver.$(`~budget-${mockBudget.id}`).click();
        
        // Click edit button
        await driver.$('~editBudgetButton').click();
        
        // Modify budget
        const newAmount = '750.00';
        await driver.$('~budgetAmountInput').clearValue();
        await driver.$('~budgetAmountInput').setValue(newAmount);
        
        // Change category
        await driver.$('~categoryDropdown').click();
        await driver.$('~categoryUtilities').click();
        
        // Save changes
        await driver.$('~saveBudgetButton').click();
        
        // Verify updates
        const updatedAmount = await driver.$(`~budget-amount-${mockBudget.id}`).getText();
        expect(updatedAmount).toContain(newAmount);
        
        const updatedCategory = await driver.$(`~budget-category-${mockBudget.id}`).getText();
        expect(updatedCategory).toContain('Utilities');
    });
});