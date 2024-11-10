// Third-party imports with versions
import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals'; // ^29.0.0
import request from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment, createTestUser, createTestAccount, expectSuccessResponse, expectErrorResponse } from '../../test/utils/test-helpers';
import { SyncService } from '../src/modules/sync/sync.service';
import { SyncRequestDto, SyncEntityType } from '../src/modules/sync/dto/sync-request.dto';

/**
 * Human Tasks Required:
 * 1. Configure test database with proper permissions for sync operations
 * 2. Set up test environment variables in .env.test for Plaid API integration
 * 3. Configure test encryption keys for secure data transmission
 * 4. Set up test mobile client device IDs and certificates
 * 5. Configure test financial institution accounts for sync testing
 */

describe('Sync E2E Tests', () => {
  let testEnv: any;
  let syncService: SyncService;
  let testUser: any;
  let testAccount: any;
  let testDeviceId: string;

  beforeAll(async () => {
    // Requirement: Real-time Data Synchronization
    // Set up test environment with necessary services and connections
    testEnv = await setupTestEnvironment();
    syncService = testEnv.app.get(SyncService);
    
    // Create test user and account
    testUser = await createTestUser();
    testAccount = await createTestAccount(testUser.id);
    testDeviceId = 'test-device-001';
  });

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  beforeEach(async () => {
    // Reset sync state before each test
    await testEnv.db.collection('sync_state').deleteMany({});
  });

  afterEach(async () => {
    // Clean up test data after each test
    await testEnv.db.collection('sync_changes').deleteMany({});
  });

  it('should synchronize account data successfully', async () => {
    // Requirement: Real-time Data Synchronization
    const syncRequest: SyncRequestDto = {
      deviceId: testDeviceId,
      lastSyncTimestamp: new Date(Date.now() - 3600000), // 1 hour ago
      entityType: SyncEntityType.ACCOUNTS,
      changes: [
        {
          id: 'change-1',
          entityId: testAccount.id,
          timestamp: new Date(),
          operation: 'UPDATE',
          data: {
            balance: 1500.50,
            name: 'Updated Test Account'
          }
        }
      ]
    };

    const response = await request(testEnv.app.getHttpServer())
      .post('/api/v1/sync')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send(syncRequest);

    expectSuccessResponse(response);
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.changes).toBeInstanceOf(Array);
    
    // Verify data consistency
    const updatedAccount = await testEnv.db.collection('accounts').findOne({ id: testAccount.id });
    expect(updatedAccount.balance).toBe(1500.50);
    expect(updatedAccount.name).toBe('Updated Test Account');
  });

  it('should handle offline sync with conflict resolution', async () => {
    // Requirement: Offline Support
    // Create offline changes
    const offlineChanges = [
      {
        id: 'offline-1',
        entityId: testAccount.id,
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        operation: 'UPDATE',
        data: { balance: 2000.00 }
      }
    ];

    // Create conflicting server changes
    await testEnv.db.collection('accounts').updateOne(
      { id: testAccount.id },
      { $set: { balance: 2500.00, lastModified: new Date() } }
    );

    const syncRequest: SyncRequestDto = {
      deviceId: testDeviceId,
      lastSyncTimestamp: new Date(Date.now() - 7200000),
      entityType: SyncEntityType.ACCOUNTS,
      changes: offlineChanges
    };

    const response = await request(testEnv.app.getHttpServer())
      .post('/api/v1/sync')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send(syncRequest);

    expectSuccessResponse(response);
    expect(response.body.conflicts).toBeDefined();
    expect(response.body.conflicts.length).toBeGreaterThan(0);
    
    // Verify server version won (newer timestamp)
    const finalAccount = await testEnv.db.collection('accounts').findOne({ id: testAccount.id });
    expect(finalAccount.balance).toBe(2500.00);
  });

  it('should validate sync request payload', async () => {
    // Requirement: Data Security
    const invalidRequest = {
      deviceId: testDeviceId,
      // Missing required fields
      changes: []
    };

    const response = await request(testEnv.app.getHttpServer())
      .post('/api/v1/sync')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send(invalidRequest);

    expectErrorResponse(response);
    expect(response.body.message).toContain('lastSyncTimestamp');
    expect(response.body.message).toContain('entityType');
  });

  it('should handle financial data sync', async () => {
    // Requirement: Real-time Data Synchronization
    // Set up mock Plaid responses
    const mockPlaidData = {
      accounts: [{
        id: testAccount.id,
        balance: 3000.00,
        transactions: [
          {
            id: 'tx-1',
            amount: 50.00,
            date: new Date(),
            description: 'Test Transaction'
          }
        ]
      }]
    };

    // Mock Plaid service response
    jest.spyOn(syncService['plaidService'], 'getAccountData').mockResolvedValue(mockPlaidData);

    const response = await request(testEnv.app.getHttpServer())
      .post('/api/v1/sync/financial')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({
        accountId: testAccount.id,
        sync_type: 'FULL'
      });

    expectSuccessResponse(response);
    
    // Verify financial data sync
    const updatedAccount = await testEnv.db.collection('accounts').findOne({ id: testAccount.id });
    expect(updatedAccount.balance).toBe(3000.00);
    
    const syncedTransactions = await testEnv.db.collection('transactions')
      .find({ accountId: testAccount.id })
      .toArray();
    expect(syncedTransactions).toHaveLength(1);
    expect(syncedTransactions[0].amount).toBe(50.00);
  });

  it('should enforce security on sync endpoints', async () => {
    // Requirement: Data Security
    const syncRequest: SyncRequestDto = {
      deviceId: testDeviceId,
      lastSyncTimestamp: new Date(),
      entityType: SyncEntityType.ACCOUNTS,
      changes: []
    };

    // Test without auth token
    const noAuthResponse = await request(testEnv.app.getHttpServer())
      .post('/api/v1/sync')
      .send(syncRequest);
    expect(noAuthResponse.status).toBe(401);

    // Test with invalid auth token
    const invalidAuthResponse = await request(testEnv.app.getHttpServer())
      .post('/api/v1/sync')
      .set('Authorization', 'Bearer invalid-token')
      .send(syncRequest);
    expect(invalidAuthResponse.status).toBe(401);

    // Test with invalid device ID
    const invalidDeviceResponse = await request(testEnv.app.getHttpServer())
      .post('/api/v1/sync')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({
        ...syncRequest,
        deviceId: 'unregistered-device'
      });
    expect(invalidDeviceResponse.status).toBe(403);
  });

  it('should handle large sync payloads efficiently', async () => {
    // Requirement: Real-time Data Synchronization
    const largeChanges = Array.from({ length: 1000 }, (_, i) => ({
      id: `change-${i}`,
      entityId: `entity-${i}`,
      timestamp: new Date(),
      operation: 'CREATE',
      data: { test: `data-${i}` }
    }));

    const syncRequest: SyncRequestDto = {
      deviceId: testDeviceId,
      lastSyncTimestamp: new Date(Date.now() - 3600000),
      entityType: SyncEntityType.TRANSACTIONS,
      changes: largeChanges
    };

    const startTime = Date.now();
    const response = await request(testEnv.app.getHttpServer())
      .post('/api/v1/sync')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send(syncRequest);
    const endTime = Date.now();

    expectSuccessResponse(response);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    expect(response.body.changes).toBeInstanceOf(Array);
  });

  it('should maintain data integrity during sync failures', async () => {
    // Requirement: Data Security
    const initialState = await testEnv.db.collection('accounts').findOne({ id: testAccount.id });
    
    // Simulate a sync failure by sending invalid data mid-sync
    const syncRequest: SyncRequestDto = {
      deviceId: testDeviceId,
      lastSyncTimestamp: new Date(),
      entityType: SyncEntityType.ACCOUNTS,
      changes: [{
        id: 'change-1',
        entityId: testAccount.id,
        timestamp: new Date(),
        operation: 'UPDATE',
        data: { balance: 'invalid-balance' } // Invalid data type
      }]
    };

    const response = await request(testEnv.app.getHttpServer())
      .post('/api/v1/sync')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send(syncRequest);

    expectErrorResponse(response);
    
    // Verify data remained unchanged
    const finalState = await testEnv.db.collection('accounts').findOne({ id: testAccount.id });
    expect(finalState).toEqual(initialState);
  });
});