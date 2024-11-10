// Third-party imports with versions
import { remote } from 'webdriverio'; // ^8.0.0
import { describe, test, beforeAll, afterAll, beforeEach, expect } from '@jest/globals'; // ^29.0.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../../utils/test-helpers';
import { createMockUser, createMockAccount } from '../../../utils/mock-data';
import { TestApiClient } from '../../../utils/api-client';

/**
 * Human Tasks Required:
 * 1. Configure Android emulator with specified app package and activity
 * 2. Set up Appium server and required drivers
 * 3. Configure test environment variables in .env.test
 * 4. Ensure test database is accessible and properly configured
 * 5. Set up test logging directory with write permissions
 */

// Global test configuration
jest.setTimeout(TEST_TIMEOUT);

// Android app configuration
const ANDROID_CONFIG = {
    platformName: 'Android',
    automationName: 'UiAutomator2',
    app: process.env.ANDROID_APP_PATH,
    appPackage: ANDROID_APP_PACKAGE,
    appActivity: ANDROID_APP_ACTIVITY,
    noReset: false
};

describe('Android Account Management E2E Tests', () => {
    let driver: WebdriverIO.Browser;
    let testEnv: {
        db: any;
        api: TestApiClient;
        auth: { token: string };
    };
    let testUser: any;
    let testAccount: any;

    beforeAll(async () => {
        // Requirements addressed: Account Management (Technical Specification/5.2.1 Mobile Applications)
        // Initialize test environment with security controls
        testEnv = await setupTestEnvironment();
        
        // Create test user and account
        testUser = await createMockUser();
        testAccount = await createMockAccount(testUser.id);

        // Initialize Android driver
        driver = await remote({
            ...ANDROID_CONFIG,
            capabilities: {
                'appium:automationName': 'UiAutomator2',
                'appium:deviceName': 'Android Emulator',
                'appium:platformVersion': '12.0'
            }
        });
    });

    afterAll(async () => {
        // Cleanup test environment and close driver
        if (driver) {
            await driver.deleteSession();
        }
        await cleanupTestEnvironment(testEnv);
    });

    beforeEach(async () => {
        // Reset app state and navigate to accounts screen
        await driver.reset();
        await driver.startActivity(ANDROID_APP_PACKAGE, ANDROID_APP_ACTIVITY);
        
        // Login and navigate to accounts screen
        await loginToApp(driver, testUser);
        await navigateToAccounts(driver);
    });

    test('should successfully link a bank account', async () => {
        // Requirements addressed: Financial Institution Integration (Technical Specification/1.2 Scope/Core Features)
        
        // Click add account button
        const addAccountButton = await driver.$('~add-account-button');
        await addAccountButton.click();

        // Verify Plaid institution selection screen
        const institutionScreen = await driver.$('~institution-selection-screen');
        expect(await institutionScreen.isDisplayed()).toBe(true);

        // Select test bank
        const testBank = await driver.$('~bank-chase');
        await testBank.click();

        // Enter Plaid sandbox credentials
        const usernameInput = await driver.$('~plaid-username');
        const passwordInput = await driver.$('~plaid-password');
        await usernameInput.setValue('user_good');
        await passwordInput.setValue('pass_good');
        
        // Submit credentials
        const submitButton = await driver.$('~submit-credentials');
        await submitButton.click();

        // Handle account selection
        const selectAllAccounts = await driver.$('~select-all-accounts');
        await selectAllAccounts.click();
        
        const continueButton = await driver.$('~continue-button');
        await continueButton.click();

        // Verify success state
        const successMessage = await driver.$('~link-success-message');
        expect(await successMessage.isDisplayed()).toBe(true);

        // Verify account data in backend
        const accounts = await testEnv.api.get(`/accounts/user/${testUser.id}`);
        expect(accounts.length).toBeGreaterThan(0);
    });

    test('should sync account data with backend', async () => {
        // Requirements addressed: Data Synchronization (Technical Specification/5.2.3 Service Layer Architecture)
        
        // Create test account with mock data
        const mockAccount = await createMockAccount(testUser.id);
        await testEnv.api.post('/accounts', mockAccount);

        // Refresh accounts list
        const refreshButton = await driver.$('~refresh-accounts');
        await refreshButton.click();

        // Verify sync status indicator
        const syncIndicator = await driver.$('~sync-status');
        expect(await syncIndicator.getText()).toBe('Synced');

        // Modify account data offline
        await driver.setNetworkConnection(0); // Disable network
        
        const accountCard = await driver.$(`~account-${mockAccount.id}`);
        await accountCard.click();

        const editButton = await driver.$('~edit-account');
        await editButton.click();

        const nameInput = await driver.$('~account-name-input');
        await nameInput.setValue('Updated Account Name');

        const saveButton = await driver.$('~save-changes');
        await saveButton.click();

        // Re-enable network and trigger sync
        await driver.setNetworkConnection(6); // Enable WiFi and mobile data
        
        const syncButton = await driver.$('~sync-now');
        await syncButton.click();

        // Verify data consistency
        const updatedAccount = await testEnv.api.get(`/accounts/${mockAccount.id}`);
        expect(updatedAccount.name).toBe('Updated Account Name');
    });

    test('should display and manage account details', async () => {
        // Requirements addressed: Security Controls (Technical Specification/9.3 Security Protocols)
        
        // Select test account
        const accountCard = await driver.$(`~account-${testAccount.id}`);
        await accountCard.click();

        // Verify account details screen
        const accountScreen = await driver.$('~account-details-screen');
        expect(await accountScreen.isDisplayed()).toBe(true);

        // Verify sensitive data masking
        const accountNumber = await driver.$('~account-number');
        expect(await accountNumber.getText()).toMatch(/^\*+\d{4}$/);

        // Test account settings modification
        const settingsButton = await driver.$('~account-settings');
        await settingsButton.click();

        const notificationToggle = await driver.$('~notification-toggle');
        await notificationToggle.click();

        const saveSettings = await driver.$('~save-settings');
        await saveSettings.click();

        // Verify changes persisted
        const updatedAccount = await testEnv.api.get(`/accounts/${testAccount.id}`);
        expect(updatedAccount.settings.notifications).toBe(true);
    });

    test('should securely delete an account', async () => {
        // Requirements addressed: Security Controls (Technical Specification/9.3 Security Protocols)
        
        // Select account to delete
        const accountCard = await driver.$(`~account-${testAccount.id}`);
        await accountCard.click();

        // Initiate deletion
        const moreOptionsButton = await driver.$('~more-options');
        await moreOptionsButton.click();

        const deleteButton = await driver.$('~delete-account');
        await deleteButton.click();

        // Verify security confirmation
        const confirmDialog = await driver.$('~security-confirmation');
        expect(await confirmDialog.isDisplayed()).toBe(true);

        // Enter confirmation
        const confirmInput = await driver.$('~confirmation-input');
        await confirmInput.setValue('DELETE');

        const confirmButton = await driver.$('~confirm-delete');
        await confirmButton.click();

        // Verify account removed
        const accountsList = await driver.$('~accounts-list');
        const deletedAccount = await accountsList.$(`~account-${testAccount.id}`);
        expect(await deletedAccount.isExisting()).toBe(false);

        // Verify backend deletion
        try {
            await testEnv.api.get(`/accounts/${testAccount.id}`);
            fail('Account should not exist');
        } catch (error) {
            expect(error.message).toContain('404');
        }
    });
});

/**
 * Helper function to login to the app
 */
async function loginToApp(driver: WebdriverIO.Browser, user: any) {
    const emailInput = await driver.$('~email-input');
    const passwordInput = await driver.$('~password-input');
    const loginButton = await driver.$('~login-button');

    await emailInput.setValue(user.email);
    await passwordInput.setValue('testPassword123');
    await loginButton.click();

    // Wait for dashboard to load
    const dashboard = await driver.$('~dashboard-screen');
    await dashboard.waitForDisplayed({ timeout: 5000 });
}

/**
 * Helper function to navigate to accounts screen
 */
async function navigateToAccounts(driver: WebdriverIO.Browser) {
    const accountsTab = await driver.$('~accounts-tab');
    await accountsTab.click();

    const accountsScreen = await driver.$('~accounts-screen');
    await accountsScreen.waitForDisplayed({ timeout: 5000 });
}