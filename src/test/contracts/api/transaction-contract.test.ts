// Third-party imports with versions
import { describe, it, beforeAll, afterAll, expect } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0

// Internal imports
import { CreateTransactionDto } from '../../../backend/src/modules/transactions/dto/create-transaction.dto';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';

/**
 * Human Tasks:
 * 1. Ensure test database is properly configured with required schemas
 * 2. Configure test environment variables in .env.test
 * 3. Set up test API endpoints in test environment
 * 4. Configure proper test user roles and permissions
 * 5. Verify rate limiting settings for API endpoints
 */

describe('Transaction API Contract Tests', () => {
  let testEnv: any;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
    request = supertest(process.env.TEST_API_URL || 'http://localhost:3000');
  });

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  /**
   * Tests the contract for transaction creation endpoint
   * Requirements addressed:
   * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
   * - API Security (Technical Specification/9.3.1 API Security)
   * - Data Validation (Technical Specification/9.2 Data Security/9.2.2 Data Classification)
   */
  describe('POST /api/transactions', () => {
    it('should validate required fields for transaction creation', async () => {
      const invalidTransaction = {};

      const response = await request
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(invalidTransaction);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'accountId',
          message: expect.any(String)
        })
      );
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'amount',
          message: expect.any(String)
        })
      );
    });

    it('should validate amount format and constraints', async () => {
      const invalidAmountTransaction: Partial<CreateTransactionDto> = {
        accountId: testEnv.testData.accountId,
        amount: -100, // Invalid: negative amount
        description: 'Test transaction',
        category: 'Test',
        transactionDate: new Date(),
        type: 'debit'
      };

      const response = await request
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(invalidAmountTransaction);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'amount',
          message: expect.stringContaining('minimum')
        })
      );
    });

    it('should validate date format', async () => {
      const invalidDateTransaction: Partial<CreateTransactionDto> = {
        accountId: testEnv.testData.accountId,
        amount: 100,
        description: 'Test transaction',
        category: 'Test',
        transactionDate: 'invalid-date' as any,
        type: 'debit'
      };

      const response = await request
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(invalidDateTransaction);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'transactionDate',
          message: expect.stringContaining('date')
        })
      );
    });

    it('should successfully create transaction with valid data', async () => {
      const validTransaction: CreateTransactionDto = {
        accountId: testEnv.testData.accountId,
        amount: 100.50,
        description: 'Test transaction',
        category: 'Shopping',
        transactionDate: new Date(),
        type: 'debit',
        isPending: false,
        merchantName: 'Test Store',
        currency: 'USD',
        metadata: {
          location: 'Test Location'
        }
      };

      const response = await request
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(validTransaction);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        accountId: validTransaction.accountId,
        amount: validTransaction.amount,
        description: validTransaction.description,
        category: validTransaction.category,
        transactionDate: expect.any(String),
        type: validTransaction.type,
        isPending: validTransaction.isPending,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });
  });

  /**
   * Tests the contract for retrieving transaction details
   * Requirements addressed:
   * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
   * - API Security (Technical Specification/9.3.1 API Security)
   */
  describe('GET /api/transactions/:id', () => {
    it('should return 404 for non-existent transaction', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request
        .get(`/api/transactions/${nonExistentId}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(404);
    });

    it('should return transaction details for valid ID', async () => {
      // First create a transaction
      const transaction: CreateTransactionDto = {
        accountId: testEnv.testData.accountId,
        amount: 150.75,
        description: 'Test retrieval',
        category: 'Testing',
        transactionDate: new Date(),
        type: 'credit',
        isPending: false
      };

      const createResponse = await request
        .post('/api/transactions')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(transaction);

      const retrieveResponse = await request
        .get(`/api/transactions/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(retrieveResponse.status).toBe(200);
      expect(retrieveResponse.body).toMatchObject({
        id: createResponse.body.id,
        accountId: transaction.accountId,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        type: transaction.type,
        isPending: transaction.isPending
      });
    });
  });

  /**
   * Tests the contract for updating transaction details
   * Requirements addressed:
   * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
   * - Data Validation (Technical Specification/9.2 Data Security/9.2.2 Data Classification)
   */
  describe('PATCH /api/transactions/:id', () => {
    it('should validate update constraints', async () => {
      const transaction = await createTestTransaction(request, testEnv.auth.token);
      
      const invalidUpdate = {
        amount: -50, // Invalid negative amount
        category: '' // Invalid empty category
      };

      const response = await request
        .patch(`/api/transactions/${transaction.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(invalidUpdate);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should successfully update valid fields', async () => {
      const transaction = await createTestTransaction(request, testEnv.auth.token);
      
      const update = {
        description: 'Updated description',
        category: 'Updated category',
        isPending: true
      };

      const response = await request
        .patch(`/api/transactions/${transaction.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(update);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: transaction.id,
        description: update.description,
        category: update.category,
        isPending: update.isPending,
        updatedAt: expect.any(String)
      });
    });
  });

  /**
   * Tests the contract for transaction deletion
   * Requirements addressed:
   * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
   * - API Security (Technical Specification/9.3.1 API Security)
   */
  describe('DELETE /api/transactions/:id', () => {
    it('should return 404 for non-existent transaction', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request
        .delete(`/api/transactions/${nonExistentId}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(404);
    });

    it('should successfully delete existing transaction', async () => {
      const transaction = await createTestTransaction(request, testEnv.auth.token);
      
      const deleteResponse = await request
        .delete(`/api/transactions/${transaction.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(deleteResponse.status).toBe(204);

      // Verify transaction is deleted
      const getResponse = await request
        .get(`/api/transactions/${transaction.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(getResponse.status).toBe(404);
    });
  });
});

/**
 * Helper function to create a test transaction
 */
async function createTestTransaction(request: supertest.SuperTest<supertest.Test>, token: string) {
  const transaction: CreateTransactionDto = {
    accountId: '00000000-0000-0000-0000-000000000000', // Test account ID
    amount: 100,
    description: 'Test transaction',
    category: 'Test',
    transactionDate: new Date(),
    type: 'debit',
    isPending: false
  };

  const response = await request
    .post('/api/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send(transaction);

  return response.body;
}