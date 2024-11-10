// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0
import dayjs from 'dayjs'; // ^1.11.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../../test/utils/test-helpers';
import { createMockUser, createMockAccount, createMockTransaction, mockCategories } from '../../../test/utils/mock-data';

/**
 * Human Tasks:
 * 1. Ensure test database is configured with proper permissions
 * 2. Configure test API endpoints in environment variables
 * 3. Set up test logging directory with write permissions
 * 4. Install required test dependencies with correct versions
 */

describe('Transaction Search API Integration Tests', () => {
  // Test environment globals
  let testEnv: any;
  let testUser: any;
  let testAccount: any;
  let testTransactions: any[];

  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test environment
    testEnv = await setupTestEnvironment();

    // Create test user
    testUser = await createMockUser();

    // Create test account
    testAccount = await createMockAccount(testUser.id);

    // Create sample transactions with various criteria
    testTransactions = [
      // Recent transactions
      await createMockTransaction(testAccount.id, testUser.id, {
        amount: -50.00,
        category: 'Food & Dining',
        description: 'Restaurant ABC',
        merchantName: 'ABC Restaurant',
        transactionDate: dayjs().subtract(1, 'day').toDate()
      }),
      // Older transactions
      await createMockTransaction(testAccount.id, testUser.id, {
        amount: -150.00,
        category: 'Shopping',
        description: 'Electronics Store',
        merchantName: 'Best Electronics',
        transactionDate: dayjs().subtract(30, 'day').toDate()
      }),
      // Large amount transaction
      await createMockTransaction(testAccount.id, testUser.id, {
        amount: -999.99,
        category: 'Housing',
        description: 'Monthly Rent',
        merchantName: 'Property Management',
        transactionDate: dayjs().subtract(15, 'day').toDate()
      }),
      // Income transaction
      await createMockTransaction(testAccount.id, testUser.id, {
        amount: 2500.00,
        category: 'Income',
        description: 'Salary Deposit',
        merchantName: 'Employer Inc',
        transactionDate: dayjs().subtract(7, 'day').toDate()
      })
    ];
  });

  // Cleanup test environment after all tests
  afterAll(async () => {
    // Clean up test transactions
    for (const transaction of testTransactions) {
      await testEnv.api.delete(`/api/transactions/${transaction.id}`);
    }

    // Clean up test account
    await testEnv.api.delete(`/api/accounts/${testAccount.id}`);

    // Clean up test user
    await testEnv.api.delete(`/api/users/${testUser.id}`);

    // Cleanup test environment
    await cleanupTestEnvironment(testEnv);
  });

  /**
   * Requirements addressed:
   * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
   * Tests search by date range functionality
   */
  describe('Search by Date Range', () => {
    test('should return transactions within specified date range', async () => {
      const startDate = dayjs().subtract(7, 'days').format('YYYY-MM-DD');
      const endDate = dayjs().format('YYYY-MM-DD');

      const response = await supertest(testEnv.api)
        .get('/api/transactions/search')
        .query({
          startDate,
          endDate
        })
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].transactionDate).toBeGreaterThanOrEqual(startDate);
      expect(response.body.data[0].transactionDate).toBeLessThanOrEqual(endDate);
    });

    test('should return 400 for invalid date range', async () => {
      const response = await supertest(testEnv.api)
        .get('/api/transactions/search')
        .query({
          startDate: 'invalid-date',
          endDate: dayjs().format('YYYY-MM-DD')
        })
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  /**
   * Requirements addressed:
   * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
   * Tests search by amount range functionality
   */
  describe('Search by Amount Range', () => {
    test('should return transactions within specified amount range', async () => {
      const response = await supertest(testEnv.api)
        .get('/api/transactions/search')
        .query({
          minAmount: -100,
          maxAmount: -1
        })
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].amount).toBeLessThanOrEqual(-1);
      expect(response.body.data[0].amount).toBeGreaterThanOrEqual(-100);
    });

    test('should handle positive amount ranges for income', async () => {
      const response = await supertest(testEnv.api)
        .get('/api/transactions/search')
        .query({
          minAmount: 1000,
          maxAmount: 5000
        })
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].amount).toBeGreaterThan(0);
    });
  });

  /**
   * Requirements addressed:
   * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
   * Tests search by category functionality
   */
  describe('Search by Category', () => {
    test('should return transactions matching specified category', async () => {
      const category = 'Food & Dining';
      
      const response = await supertest(testEnv.api)
        .get('/api/transactions/search')
        .query({ category })
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].category).toBe(category);
    });

    test('should return empty array for non-existent category', async () => {
      const response = await supertest(testEnv.api)
        .get('/api/transactions/search')
        .query({
          category: 'NonExistentCategory'
        })
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  /**
   * Requirements addressed:
   * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
   * Tests search by description and merchant name functionality
   */
  describe('Search by Description and Merchant', () => {
    test('should return transactions matching description keyword', async () => {
      const response = await supertest(testEnv.api)
        .get('/api/transactions/search')
        .query({
          keyword: 'Restaurant'
        })
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].description).toContain('Restaurant');
    });

    test('should return transactions matching merchant name', async () => {
      const response = await supertest(testEnv.api)
        .get('/api/transactions/search')
        .query({
          merchantName: 'ABC'
        })
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].merchantName).toContain('ABC');
    });
  });

  /**
   * Requirements addressed:
   * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
   * Tests search with multiple combined criteria
   */
  describe('Combined Search Criteria', () => {
    test('should return transactions matching multiple criteria', async () => {
      const startDate = dayjs().subtract(30, 'days').format('YYYY-MM-DD');
      const endDate = dayjs().format('YYYY-MM-DD');

      const response = await supertest(testEnv.api)
        .get('/api/transactions/search')
        .query({
          startDate,
          endDate,
          minAmount: -200,
          maxAmount: -50,
          category: 'Shopping'
        })
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].category).toBe('Shopping');
      expect(response.body.data[0].amount).toBeLessThanOrEqual(-50);
      expect(response.body.data[0].amount).toBeGreaterThanOrEqual(-200);
    });
  });

  /**
   * Requirements addressed:
   * - Data Security (Technical Specification/9.2 Data Security)
   * Tests security and authorization aspects
   */
  describe('Security Validation', () => {
    test('should require authentication for search', async () => {
      const response = await supertest(testEnv.api)
        .get('/api/transactions/search')
        .query({
          startDate: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
          endDate: dayjs().format('YYYY-MM-DD')
        });

      expect(response.status).toBe(401);
    });

    test('should only return transactions for authenticated user', async () => {
      const response = await supertest(testEnv.api)
        .get('/api/transactions/search')
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((transaction: any) => {
        expect(transaction.userId).toBe(testUser.id);
      });
    });
  });

  /**
   * Requirements addressed:
   * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
   * Tests pagination and performance aspects
   */
  describe('Pagination and Performance', () => {
    test('should handle pagination correctly', async () => {
      const response = await supertest(testEnv.api)
        .get('/api/transactions/search')
        .query({
          page: 1,
          limit: 2
        })
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalPages).toBeGreaterThan(0);
    });

    test('should handle sorting by date', async () => {
      const response = await supertest(testEnv.api)
        .get('/api/transactions/search')
        .query({
          sortBy: 'transactionDate',
          sortOrder: 'desc'
        })
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Verify descending order
      const dates = response.body.data.map((t: any) => new Date(t.transactionDate));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
      }
    });
  });
});