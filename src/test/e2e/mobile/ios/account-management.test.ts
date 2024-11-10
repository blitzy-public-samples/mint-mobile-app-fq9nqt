/**
 * Human Tasks Required:
 * 1. Configure iOS simulator environment variables in .env.test
 * 2. Install XCUITest and WebDriverIO dependencies with correct versions
 * 3. Set up iOS simulator with test app installed
 * 4. Configure test logging directory with write permissions
 * 5. Set up test financial institution credentials
 */

// Third-party imports with versions
import { describe, test, beforeAll, afterAll, expect } from '@jest/globals'; // ^29.0.0
import { remote } from 'webdriverio'; // ^8.0.0
import { XCUITest } from 'xcuitest'; // ^2.0.0

// Internal imports
import { 
    setupTestEnvironment, 
    cleanupTestEnvironment,
    waitForCondition 
} from '../../../utils/test-helpers';
import { 
    createMockUser, 
    createMockAccount,
    mockInstitutions 
} from '../../../utils/mock-data';
import { TestApiClient } from '../../../utils/api-client';

// Test configuration
const IOS_CAPABILITIES = {
    platformName: 'iOS',
    platformVersion: process.env.IOS_PLATFORM_VERSION || '15.0',
    deviceName: process.env.IOS_DEVICE_NAME || 'iPhone 13',
    automationName: 'XCUITest',
    app: process.env.IOS_APP_PATH || './MintReplicaLite.app',
    noReset: false
};

// Test environment state
let testEnv: {
    db: any;
    api: TestApiClient;
    auth: { token: string };
    driver: WebdriverIO.Browser;
    user: any;
    testAccount: any;
};

/**
 * Sets up test environment before all tests
 * Requirements addressed:
 * - iOS Platform Support (Technical Specification/5.2.1 Mobile Applications/Native iOS application)
 */
beforeAll(async () => {
    // Initialize test environment
    const env = await setupTestEnvironment();
    
    // Create test user and account
    const user = await createMockUser();
    const testAccount = await createMockAccount(user.id);
    
    // Initialize iOS driver
    const driver = await remote({
        ...IOS_CAPABILITIES,
        logLevel: 'error',
        waitforTimeout: 30000,
        connectionRetryTimeout: 120000,
        connectionRetryCount: 3
    });

    // Store test environment state
    testEnv = {
        ...env,
        driver,
        user,
        testAccount
    };

    // Launch app and wait for initialization
    await driver.launchApp();
    await driver.pause(2000); // Wait for app to stabilize
});

/**
 * Cleans up test environment after all tests
 */
afterAll(async () => {
    if (testEnv?.driver) {
        await testEnv.driver.deleteSession();
    }
    await cleanupTestEnvironment(testEnv);
});

/**
 * Account Management E2E Test Suite
 * Requirements addressed:
 * - Account Management (Technical Specification/5.2.1 Mobile Applications/Core Features)
 * - Data Synchronization (Technical Specification/5.2.3 Service Layer Architecture/Sync Service)
 */
describe('iOS Account Management E2E Tests', () => {
    /**
     * Tests the financial institution account linking flow
     * Requirements addressed:
     * - Account Management (Technical Specification/5.2.1 Mobile Applications/Core Features)
     */
    test('should successfully link a financial institution account', async () => {
        const testInstitution = mockInstitutions[0];
        const testCredentials = {
            username: 'test_user',
            password: 'test_password'
        };

        // Navigate to account linking screen
        await testEnv.driver.$('~AddAccountButton').click();
        await testEnv.driver.$('~SearchInstitutionField').setValue(testInstitution.name);
        
        // Select institution
        const institutionCell = await testEnv.driver.$(`~Institution_${testInstitution.id}`);
        await institutionCell.waitForDisplayed();
        await institutionCell.click();
        
        // Enter credentials securely
        await testEnv.driver.$('~UsernameField').setValue(testCredentials.username);
        await testEnv.driver.$('~PasswordField').setValue(testCredentials.password);
        await testEnv.driver.$('~SubmitButton').click();
        
        // Verify successful linking
        const successMessage = await testEnv.driver.$('~AccountLinkedSuccess');
        await successMessage.waitForDisplayed({ timeout: 10000 });
        expect(await successMessage.isDisplayed()).toBe(true);
        
        // Verify account data sync
        const accountCard = await testEnv.driver.$('~AccountCard');
        await accountCard.waitForDisplayed();
        expect(await accountCard.isDisplayed()).toBe(true);
    });

    /**
     * Tests account data synchronization with backend
     * Requirements addressed:
     * - Data Synchronization (Technical Specification/5.2.3 Service Layer Architecture/Sync Service)
     */
    test('should sync account data with backend', async () => {
        // Create test account data
        const syncTestAccount = await createMockAccount(testEnv.user.id);
        await testEnv.api.post('/accounts', syncTestAccount);
        
        // Trigger manual sync
        await testEnv.driver.$('~SyncButton').click();
        
        // Verify sync status
        const syncIndicator = await testEnv.driver.$('~SyncStatus');
        await syncIndicator.waitForDisplayed();
        expect(await syncIndicator.getText()).toContain('Synced');
        
        // Verify data consistency
        const accountBalance = await testEnv.driver.$(`~AccountBalance_${syncTestAccount.id}`);
        await accountBalance.waitForDisplayed();
        expect(await accountBalance.getText()).toContain(syncTestAccount.balance.toString());
    });

    /**
     * Tests account CRUD operations and management features
     * Requirements addressed:
     * - Account Management (Technical Specification/5.2.1 Mobile Applications/Core Features)
     */
    test('should perform account management operations', async () => {
        // Create new account
        await testEnv.driver.$('~AddAccountButton').click();
        await testEnv.driver.$('~ManualAccountButton').click();
        await testEnv.driver.$('~AccountNameField').setValue('Test Account');
        await testEnv.driver.$('~AccountTypeField').setValue('Savings');
        await testEnv.driver.$('~InitialBalanceField').setValue('1000');
        await testEnv.driver.$('~CreateAccountButton').click();
        
        // Verify account creation
        const accountName = await testEnv.driver.$('~AccountName');
        await accountName.waitForDisplayed();
        expect(await accountName.getText()).toBe('Test Account');
        
        // Update account settings
        await testEnv.driver.$('~AccountSettingsButton').click();
        await testEnv.driver.$('~AccountNicknameField').setValue('Updated Account');
        await testEnv.driver.$('~SaveSettingsButton').click();
        
        // Verify update
        await accountName.waitForDisplayed();
        expect(await accountName.getText()).toBe('Updated Account');
        
        // Delete account
        await testEnv.driver.$('~AccountSettingsButton').click();
        await testEnv.driver.$('~DeleteAccountButton').click();
        await testEnv.driver.$('~ConfirmDeleteButton').click();
        
        // Verify deletion
        await waitForCondition(async () => {
            const deletedAccount = await testEnv.driver.$('~AccountName');
            return !(await deletedAccount.isDisplayed());
        });
    });

    /**
     * Tests offline account management capabilities
     * Requirements addressed:
     * - Data Synchronization (Technical Specification/5.2.3 Service Layer Architecture/Sync Service)
     */
    test('should handle offline account management', async () => {
        // Enable airplane mode
        await testEnv.driver.toggleAirplaneMode();
        await testEnv.driver.pause(2000);
        
        // Perform offline operation
        const offlineBalance = '2000';
        await testEnv.driver.$('~AccountSettingsButton').click();
        await testEnv.driver.$('~UpdateBalanceButton').click();
        await testEnv.driver.$('~BalanceField').setValue(offlineBalance);
        await testEnv.driver.$('~SaveBalanceButton').click();
        
        // Verify offline update
        const updatedBalance = await testEnv.driver.$('~AccountBalance');
        await updatedBalance.waitForDisplayed();
        expect(await updatedBalance.getText()).toContain(offlineBalance);
        
        // Verify offline indicator
        const offlineIndicator = await testEnv.driver.$('~OfflineIndicator');
        expect(await offlineIndicator.isDisplayed()).toBe(true);
        
        // Disable airplane mode and verify sync
        await testEnv.driver.toggleAirplaneMode();
        await testEnv.driver.pause(2000);
        
        // Wait for sync completion
        await waitForCondition(async () => {
            const syncStatus = await testEnv.driver.$('~SyncStatus');
            return (await syncStatus.getText()).includes('Synced');
        });
        
        // Verify data persistence after sync
        const syncedBalance = await testEnv.driver.$('~AccountBalance');
        expect(await syncedBalance.getText()).toContain(offlineBalance);
    });
});