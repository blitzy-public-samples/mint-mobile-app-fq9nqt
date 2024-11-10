// @jest/globals v29.0.0
import { describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';

// supertest v6.3.0
import supertest from 'supertest';

// Internal imports
import { TransactionsService } from '../../../backend/src/modules/transactions/transactions.service';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser, createMockAccount, createMockTransaction } from '../../utils/mock-data';

/**
 * Human Tasks:
 * 1. Configure test database with proper indexes for transaction queries
 * 2. Set up test Plaid API credentials in environment
 * 3. Configure test Redis instance for sync locking
 * 4. Set up test logging directory with write permissions
 * 5. Ensure proper test environment variables in .env.test
 */

describe('Transaction Synchronization Integration Tests', () => {
  let testEnv: any;
  let transactionsService: TransactionsService;
  let mockUser: any;
  let mockAccount: any;

  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test environment with database and API client
    testEnv = await setupTestEnvironment({
      enableLogging: true,
      usePlaidSandbox: true
    });

    // Create mock user and account for tests
    mockUser = await createMockUser();
    mockAccount = await createMockAccount(mockUser.id, {
      institutionId: 'inst_1',
      accountType: 'checking',
      isActive: true
    });

    // Initialize transactions service
    transactionsService = new TransactionsService(testEnv.db.getRepository('Transaction'));
  });

  // Cleanup test environment after all tests
  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  // Reset state before each test
  beforeEach(async () => {
    // Clear transactions table
    await testEnv.db.getRepository('Transaction').clear();
    
    // Reset mock Plaid API responses
    testEnv.api.resetMocks();
    
    // Clear Redis sync locks
    await testEnv.redis.flushall();
  });

  // Test synchronization of new transactions
  it('should successfully sync new transactions from financial institution', async () => {
    // Requirements: Transaction Tracking, Data Synchronization
    
    // Create mock external transactions
    const mockExternalTransactions = [
      createMockTransaction(mockAccount.id, mockUser.id, {
        amount: -50.00,
        description: 'Grocery Store Purchase',
        merchantName: 'Walmart',
        transactionDate: new Date(),
        metadata: {
          plaidTransactionId: 'tx_1'
        }
      }),
      createMockTransaction(mockAccount.id, mockUser.id, {
        amount: -25.50,
        description: 'Restaurant Payment',
        merchantName: 'Starbucks',
        transactionDate: new Date(),
        metadata: {
          plaidTransactionId: 'tx_2'
        }
      })
    ];

    // Configure mock Plaid API response
    testEnv.api.mockPlaidTransactions(mockAccount.id, mockExternalTransactions);

    // Trigger transaction sync
    const syncedTransactions = await transactionsService.syncTransactions(
      mockAccount.id,
      mockUser.id
    );

    // Verify transactions were created
    expect(syncedTransactions).toHaveLength(2);
    
    // Verify transaction details match source data
    const savedTransactions = await transactionsService.findAll({
      accountId: mockAccount.id,
      userId: mockUser.id
    });
    
    expect(savedTransactions[0]).toHaveLength(2);
    expect(savedTransactions[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          amount: -50.00,
          description: 'Grocery Store Purchase',
          merchantName: 'Walmart',
          category: 'Groceries', // Auto-categorized
          metadata: expect.objectContaining({
            plaidTransactionId: 'tx_1'
          })
        }),
        expect.objectContaining({
          amount: -25.50,
          description: 'Restaurant Payment',
          merchantName: 'Starbucks',
          category: 'Dining', // Auto-categorized
          metadata: expect.objectContaining({
            plaidTransactionId: 'tx_2'
          })
        })
      ])
    );
  });

  // Test synchronization of existing transactions
  it('should correctly update existing transactions during sync', async () => {
    // Requirements: Transaction Tracking, Data Synchronization
    
    // Create existing transaction in database
    const existingTransaction = await transactionsService.create(
      createMockTransaction(mockAccount.id, mockUser.id, {
        amount: -75.00,
        description: 'Original Description',
        merchantName: 'Original Merchant',
        metadata: {
          plaidTransactionId: 'tx_3'
        }
      })
    );

    // Modify transaction data in Plaid mock
    const updatedTransactionData = {
      ...existingTransaction,
      amount: -80.00,
      description: 'Updated Description',
      merchantName: 'Updated Merchant'
    };
    
    testEnv.api.mockPlaidTransactions(mockAccount.id, [updatedTransactionData]);

    // Trigger sync operation
    await transactionsService.syncTransactions(mockAccount.id, mockUser.id);

    // Verify updates were applied
    const updatedTransaction = await transactionsService.findOne(
      existingTransaction.id,
      mockUser.id
    );

    expect(updatedTransaction).toMatchObject({
      amount: -80.00,
      description: 'Updated Description',
      merchantName: 'Updated Merchant',
      metadata: expect.objectContaining({
        plaidTransactionId: 'tx_3'
      })
    });
  });

  // Test error handling during sync
  it('should handle sync errors gracefully and maintain data consistency', async () => {
    // Requirements: Data Synchronization, Financial Institution Integration
    
    // Configure mock API errors
    testEnv.api.mockPlaidError('INVALID_ACCESS_TOKEN', 'Invalid access token');

    // Attempt transaction sync
    await expect(
      transactionsService.syncTransactions(mockAccount.id, mockUser.id)
    ).rejects.toThrow('Transaction sync failed');

    // Verify no partial data was saved
    const transactions = await transactionsService.findAll({
      accountId: mockAccount.id,
      userId: mockUser.id
    });

    expect(transactions[0]).toHaveLength(0);

    // Verify error was logged
    expect(testEnv.logger.getLastError()).toMatchObject({
      message: expect.stringContaining('Transaction sync failed'),
      code: 'INVALID_ACCESS_TOKEN'
    });
  });

  // Test concurrent sync requests
  it('should handle concurrent sync requests correctly', async () => {
    // Requirements: Data Synchronization
    
    // Create mock transactions
    const mockTransactions = Array(5).fill(null).map(() => 
      createMockTransaction(mockAccount.id, mockUser.id)
    );
    
    testEnv.api.mockPlaidTransactions(mockAccount.id, mockTransactions);

    // Initiate multiple concurrent sync requests
    const syncPromises = Array(3).fill(null).map(() =>
      transactionsService.syncTransactions(mockAccount.id, mockUser.id)
    );

    // Wait for all syncs to complete
    await Promise.all(syncPromises);

    // Verify no duplicate transactions were created
    const savedTransactions = await transactionsService.findAll({
      accountId: mockAccount.id,
      userId: mockUser.id
    });

    expect(savedTransactions[0]).toHaveLength(5);

    // Verify transaction IDs are unique
    const transactionIds = savedTransactions[0].map(t => t.id);
    const uniqueIds = new Set(transactionIds);
    expect(uniqueIds.size).toBe(5);
  });
});