// Third-party imports with versions
import { describe, beforeAll, afterAll, test, expect } from '@jest/globals'; // ^29.0.0
import request from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockTransaction, mockCategories } from '../../utils/mock-data';
import { TransactionsService } from '../../../backend/src/modules/transactions/transactions.service';

/**
 * Human Tasks:
 * 1. Ensure test database is configured with proper permissions
 * 2. Configure test environment variables in .env.test
 * 3. Set up test user and account credentials
 * 4. Verify transaction categorization rules are configured
 * 5. Set up ML model for transaction categorization if applicable
 */

describe('Transaction Categorization Integration Tests', () => {
  // Test environment globals
  let testEnvironment: {
    db: any;
    api: any;
    auth: { token: string };
  };
  let testUser: any;
  let testAccount: any;
  let transactionService: TransactionsService;

  // Setup test environment before all tests
  beforeAll(async () => {
    // Requirements addressed:
    // - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
    testEnvironment = await setupTestEnvironment();

    // Create test user and account
    const response = await testEnvironment.api.post('/auth/register').send({
      email: 'test.user@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    });
    testUser = response.body;

    // Create test account
    const accountResponse = await testEnvironment.api
      .post('/accounts')
      .set('Authorization', `Bearer ${testEnvironment.auth.token}`)
      .send({
        userId: testUser.id,
        institutionId: 'test_institution',
        accountType: 'checking',
        balance: 1000,
        currency: 'USD',
        name: 'Test Checking Account'
      });
    testAccount = accountResponse.body;

    // Initialize TransactionsService
    transactionService = new TransactionsService(testEnvironment.db);
  });

  // Cleanup test environment after all tests
  afterAll(async () => {
    // Requirements addressed:
    // - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
    // Clean up test transactions
    await testEnvironment.db.query('DELETE FROM transactions WHERE user_id = $1', [testUser.id]);
    
    // Clean up test account and user
    await testEnvironment.db.query('DELETE FROM accounts WHERE user_id = $1', [testUser.id]);
    await testEnvironment.db.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    
    // Cleanup test environment
    await cleanupTestEnvironment(testEnvironment);
  });

  test('should automatically categorize transactions based on merchant and description', async () => {
    // Requirements addressed:
    // - Transaction Tracking and Categorization (Technical Specification/1.2 Scope/Core Features)
    
    // Create test transactions with different merchants
    const transactions = [
      createMockTransaction(testAccount.id, testUser.id, {
        merchantName: 'Walmart',
        description: 'Grocery shopping',
        amount: -125.50
      }),
      createMockTransaction(testAccount.id, testUser.id, {
        merchantName: 'Netflix',
        description: 'Monthly subscription',
        amount: -15.99
      }),
      createMockTransaction(testAccount.id, testUser.id, {
        merchantName: 'Uber',
        description: 'Ride to airport',
        amount: -45.30
      })
    ];

    // Process each transaction and verify categorization
    const categorizedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const result = await transactionService.categorizeTransaction(transaction);
        return {
          ...transaction,
          category: result
        };
      })
    );

    // Verify categorizations match expected patterns
    expect(categorizedTransactions[0].category).toBe('Groceries');
    expect(categorizedTransactions[1].category).toBe('Entertainment');
    expect(categorizedTransactions[2].category).toBe('Transportation');

    // Verify categories persist in database
    for (const transaction of categorizedTransactions) {
      const savedTransaction = await testEnvironment.db.query(
        'SELECT * FROM transactions WHERE id = $1',
        [transaction.id]
      );
      expect(savedTransaction.rows[0].category).toBe(transaction.category);
    }
  });

  test('should apply categorization rules based on transaction patterns', async () => {
    // Requirements addressed:
    // - Transaction Tracking and Categorization (Technical Specification/1.2 Scope/Core Features)
    
    // Test merchant name matching
    const merchantTransaction = createMockTransaction(testAccount.id, testUser.id, {
      merchantName: 'Starbucks',
      description: 'Coffee',
      amount: -5.75
    });
    const merchantCategory = await transactionService.categorizeTransaction(merchantTransaction);
    expect(merchantCategory).toBe('Dining');

    // Test description keyword matching
    const descriptionTransaction = createMockTransaction(testAccount.id, testUser.id, {
      merchantName: 'ACH Transfer',
      description: 'Monthly rent payment',
      amount: -2000
    });
    const descriptionCategory = await transactionService.categorizeTransaction(descriptionTransaction);
    expect(descriptionCategory).toBe('Housing');

    // Test amount-based categorization
    const largeTransaction = createMockTransaction(testAccount.id, testUser.id, {
      merchantName: 'Unknown Merchant',
      description: 'Large purchase',
      amount: -5000
    });
    const largeCategory = await transactionService.categorizeTransaction(largeTransaction);
    expect(mockCategories).toContain(largeCategory);
  });

  test('should allow manual override of automatically assigned categories', async () => {
    // Requirements addressed:
    // - Transaction Tracking and Categorization (Technical Specification/1.2 Scope/Core Features)
    
    // Create transaction with automatic category
    const transaction = await transactionService.create({
      accountId: testAccount.id,
      userId: testUser.id,
      merchantName: 'Amazon',
      description: 'Books purchase',
      amount: -50.25,
      transactionDate: new Date()
    });

    // Verify initial automatic categorization
    expect(transaction.category).toBe('Shopping');

    // Apply manual category override
    const updatedTransaction = await transactionService.update(
      transaction.id,
      {
        category: 'Education'
      },
      testUser.id
    );

    // Verify category override
    expect(updatedTransaction.category).toBe('Education');

    // Verify override persists in database
    const savedTransaction = await testEnvironment.db.query(
      'SELECT * FROM transactions WHERE id = $1',
      [transaction.id]
    );
    expect(savedTransaction.rows[0].category).toBe('Education');
  });

  test('should correctly categorize multiple transactions in bulk', async () => {
    // Requirements addressed:
    // - Transaction Tracking and Categorization (Technical Specification/1.2 Scope/Core Features)
    
    // Create multiple test transactions
    const bulkTransactions = [
      createMockTransaction(testAccount.id, testUser.id, {
        merchantName: 'Kroger',
        description: 'Groceries',
        amount: -85.75
      }),
      createMockTransaction(testAccount.id, testUser.id, {
        merchantName: 'Target',
        description: 'Household items',
        amount: -125.50
      }),
      createMockTransaction(testAccount.id, testUser.id, {
        merchantName: 'Spotify',
        description: 'Music subscription',
        amount: -9.99
      })
    ];

    // Perform bulk categorization
    const categorizedTransactions = await Promise.all(
      bulkTransactions.map(async (transaction) => {
        const created = await transactionService.create(transaction);
        return created;
      })
    );

    // Verify all transactions are categorized
    expect(categorizedTransactions.every(t => t.category)).toBe(true);

    // Verify category consistency
    const groceryTransactions = categorizedTransactions.filter(t => 
      t.merchantName.includes('Kroger') || t.description.includes('Groceries')
    );
    expect(groceryTransactions.every(t => t.category === 'Groceries')).toBe(true);

    const entertainmentTransactions = categorizedTransactions.filter(t => 
      t.merchantName.includes('Spotify') || t.description.includes('subscription')
    );
    expect(entertainmentTransactions.every(t => t.category === 'Entertainment')).toBe(true);

    // Verify categories are saved in database
    for (const transaction of categorizedTransactions) {
      const saved = await testEnvironment.db.query(
        'SELECT * FROM transactions WHERE id = $1',
        [transaction.id]
      );
      expect(saved.rows[0].category).toBe(transaction.category);
    }
  });
});