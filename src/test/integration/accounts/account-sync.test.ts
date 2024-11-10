// Third-party imports with versions
import { describe, it, beforeAll, afterAll, expect } from '@jest/globals'; // ^29.0.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment, waitForCondition } from '../../utils/test-helpers';
import { SyncService } from '../../../backend/src/modules/sync/sync.service';
import { AccountsService } from '../../../backend/src/modules/accounts/accounts.service';

/**
 * Human Tasks Required:
 * 1. Configure Plaid API test credentials in .env.test
 * 2. Set up test database with proper encryption keys
 * 3. Configure test user accounts with valid Plaid access tokens
 * 4. Ensure test environment has network access to Plaid sandbox
 * 5. Set up monitoring for test sync operations
 */

// Global test environment variables
let testEnv: any;
let syncService: SyncService;
let accountsService: AccountsService;

// Test data
const TEST_ACCOUNT = {
  institutionId: 'ins_test',
  accountType: 'checking',
  balance: 1000.00,
  currency: 'USD',
  plaidAccessToken: process.env.TEST_PLAID_ACCESS_TOKEN
};

beforeAll(async () => {
  // Requirements addressed: Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
  try {
    // Initialize test environment with secure configuration
    testEnv = await setupTestEnvironment({
      enableEncryption: true,
      useTestDatabase: true
    });

    // Create test service instances with proper authentication
    syncService = new SyncService(testEnv.plaidService);
    accountsService = new AccountsService(testEnv.accountRepository, testEnv.plaidService);

    // Set up test database with initial data
    await testEnv.db.synchronize(true);
  } catch (error) {
    console.error('Test environment setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  // Requirements addressed: Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
  try {
    // Clean up test resources
    await cleanupTestEnvironment(testEnv);
  } catch (error) {
    console.error('Test environment cleanup failed:', error);
    throw error;
  }
});

describe('Account Sync Integration Tests', () => {
  it('should sync account data with financial institution', async () => {
    // Requirements addressed: Financial Account Integration (Technical Specification/1.2 Scope/Core Features)
    const testUserId = testEnv.testUser.id;
    
    // Create test account with encrypted credentials
    const account = await accountsService.create({
      ...TEST_ACCOUNT,
      userId: testUserId
    }, testUserId);

    // Trigger account sync through SyncService
    await syncService.syncFinancialData(testUserId, account.id);

    // Verify sync completion with waitForCondition
    const syncCompleted = await waitForCondition(async () => {
      const updatedAccount = await accountsService.findOne(account.id, testUserId);
      return updatedAccount.lastSyncedAt > account.lastSyncedAt;
    }, 10000);

    expect(syncCompleted).toBe(true);

    // Assert account data updated correctly with proper encryption
    const syncedAccount = await accountsService.findOne(account.id, testUserId);
    expect(syncedAccount.balance).not.toBe(account.balance);
    expect(syncedAccount.lastSyncedAt).toBeInstanceOf(Date);
    expect(syncedAccount.plaidAccessToken).toBeUndefined(); // Sensitive data should be excluded
  });

  it('should handle offline sync queue', async () => {
    // Requirements addressed: Real-time Data Synchronization (Technical Specification/1.1 System Overview/Core Components)
    const testUserId = testEnv.testUser.id;
    
    // Create test account
    const account = await accountsService.create({
      ...TEST_ACCOUNT,
      userId: testUserId
    }, testUserId);

    // Disable network connection
    testEnv.network.disable();

    // Queue sync operations using SyncService
    const syncPromise = syncService.synchronize({
      deviceId: 'test-device',
      entityType: 'ACCOUNT',
      lastSyncTimestamp: new Date(),
      changes: []
    });

    // Restore network connection
    testEnv.network.enable();

    // Verify sync queue processed with data integrity
    const syncResult = await syncPromise;
    expect(syncResult.success).toBe(true);
    expect(syncResult.entityType).toBe('ACCOUNT');
    expect(syncResult.timestamp).toBeInstanceOf(Date);
  });

  it('should resolve sync conflicts correctly', async () => {
    // Requirements addressed: Data Security (Technical Specification/9.2 Data Security)
    const testUserId = testEnv.testUser.id;
    
    // Create test account
    const account = await accountsService.create({
      ...TEST_ACCOUNT,
      userId: testUserId
    }, testUserId);

    // Create conflicting changes in test accounts
    const clientChange = {
      entityId: account.id,
      timestamp: new Date(),
      operation: 'UPDATE',
      data: { balance: 1500.00 }
    };

    const serverChange = {
      entityId: account.id,
      timestamp: new Date(Date.now() + 1000), // Server change is newer
      operation: 'UPDATE',
      data: { balance: 2000.00 }
    };

    // Trigger sync operation through SyncService
    const syncResult = await syncService.synchronize({
      deviceId: 'test-device',
      entityType: 'ACCOUNT',
      lastSyncTimestamp: new Date(Date.now() - 3600000),
      changes: [clientChange]
    });

    // Verify conflict resolution using timestamp strategy
    expect(syncResult.conflicts).toBeDefined();
    expect(syncResult.conflicts.resolved).toContainEqual(
      expect.objectContaining({ entityId: account.id })
    );

    // Assert correct final state with data consistency
    const resolvedAccount = await accountsService.findOne(account.id, testUserId);
    expect(resolvedAccount.balance).toBe(serverChange.data.balance);
  });

  it('should handle Plaid API errors gracefully', async () => {
    // Requirements addressed: Financial Account Integration (Technical Specification/1.2 Scope/Core Features)
    const testUserId = testEnv.testUser.id;
    
    // Simulate Plaid API error conditions
    testEnv.plaidService.simulateError('INVALID_ACCESS_TOKEN');

    // Create test account
    const account = await accountsService.create({
      ...TEST_ACCOUNT,
      userId: testUserId
    }, testUserId);

    // Attempt sync operation through AccountsService
    try {
      await accountsService.syncAccount(account.id, testUserId);
      fail('Should have thrown an error');
    } catch (error) {
      // Verify error handling and retry logic
      expect(error.message).toContain('Failed to sync account');
      expect(error.cause).toBeDefined();
    }

    // Assert system remains stable with proper error states
    const failedAccount = await accountsService.findOne(account.id, testUserId);
    expect(failedAccount.syncStatus).toBe('ERROR');
    expect(failedAccount.lastSyncError).toBeDefined();
  });

  it('should respect rate limits during sync', async () => {
    // Requirements addressed: Data Security (Technical Specification/9.2 Data Security)
    const testUserId = testEnv.testUser.id;
    
    // Create multiple test accounts
    const accounts = await Promise.all([
      accountsService.create({ ...TEST_ACCOUNT, userId: testUserId }, testUserId),
      accountsService.create({ ...TEST_ACCOUNT, userId: testUserId }, testUserId),
      accountsService.create({ ...TEST_ACCOUNT, userId: testUserId }, testUserId)
    ]);

    // Trigger multiple concurrent sync requests
    const syncPromises = accounts.map(account => 
      syncService.syncFinancialData(testUserId, account.id)
    );

    // Verify rate limiting applied by SyncService
    const startTime = Date.now();
    await Promise.all(syncPromises);
    const duration = Date.now() - startTime;

    // Assert all syncs complete eventually with proper ordering
    expect(duration).toBeGreaterThan(1000); // Rate limiting should space out requests

    // Validate data consistency across all syncs
    const syncedAccounts = await Promise.all(
      accounts.map(account => accountsService.findOne(account.id, testUserId))
    );

    syncedAccounts.forEach(account => {
      expect(account.lastSyncedAt).toBeInstanceOf(Date);
      expect(account.syncStatus).toBe('SUCCESS');
    });
  });
});