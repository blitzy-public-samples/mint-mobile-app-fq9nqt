/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test
 * 2. Set up test database with proper permissions
 * 3. Configure test API endpoints and authentication
 * 4. Ensure all test dependencies are installed with correct versions
 * 5. Set up logging directory with write permissions
 */

// Third-party imports with versions
import { describe, it, beforeAll, afterAll, expect } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { TestApiClient } from '../../utils/api-client';
import { createMockUser, createMockAccount } from '../../utils/mock-data';
import { generateTestToken } from '../../utils/auth-helper';

// Test environment globals
let testEnvironment: { db: any; api: TestApiClient; auth: any };
let mockUser: { id: string; email: string };
let authToken: string;

/**
 * Account API Contract Tests
 * Requirements addressed:
 * - Financial Account Integration (Technical Specification/1.2 Scope/Core Features)
 * - API Security (Technical Specification/9.3.1 API Security)
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 */
describe('Account API Contract Tests', () => {
  // Setup test environment before all tests
  beforeAll(async () => {
    testEnvironment = await setupTestEnvironment();
    const { user } = await createMockUser();
    mockUser = { id: user.id, email: user.email };
    authToken = generateTestToken({
      sub: mockUser.id,
      email: mockUser.email,
      roles: ['user']
    });
  });

  // Cleanup test environment after all tests
  afterAll(async () => {
    await cleanupTestEnvironment(testEnvironment);
  });

  /**
   * Tests the account creation endpoint contract
   * Verifies the API contract for creating new financial accounts
   */
  it('should validate account creation endpoint contract', async () => {
    // Prepare test account data
    const mockAccount = createMockAccount(mockUser.id);
    testEnvironment.api.setAuthToken(authToken);

    // Send POST request to create account
    const response = await testEnvironment.api.post('/accounts', {
      institutionId: mockAccount.institutionId,
      accountType: mockAccount.accountType,
      name: mockAccount.name,
      balance: mockAccount.balance,
      currency: mockAccount.currency,
      mask: mockAccount.mask,
      metadata: mockAccount.metadata
    });

    // Verify response status and schema
    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('userId', mockUser.id);
    expect(response).toHaveProperty('institutionId');
    expect(response).toHaveProperty('accountType');
    expect(response).toHaveProperty('balance');
    expect(response).toHaveProperty('currency');
    expect(response).toHaveProperty('name');
    expect(response).toHaveProperty('mask');
    expect(response).toHaveProperty('isActive', true);
    expect(response).toHaveProperty('lastSyncedAt');
    expect(response).toHaveProperty('metadata');
    expect(response).toHaveProperty('createdAt');
    expect(response).toHaveProperty('updatedAt');
  });

  /**
   * Tests the account retrieval endpoint contract
   * Verifies the API contract for fetching account details
   */
  it('should validate account retrieval endpoint contract', async () => {
    // Create test account
    const mockAccount = createMockAccount(mockUser.id);
    const createdAccount = await testEnvironment.api.post('/accounts', mockAccount);
    
    testEnvironment.api.setAuthToken(authToken);

    // Send GET request to retrieve account
    const response = await testEnvironment.api.get(`/accounts/${createdAccount.id}`);

    // Verify response schema and data
    expect(response).toHaveProperty('id', createdAccount.id);
    expect(response).toHaveProperty('userId', mockUser.id);
    expect(response).toHaveProperty('institutionId');
    expect(response).toHaveProperty('accountType');
    expect(response).toHaveProperty('balance');
    expect(response).toHaveProperty('currency');
    expect(response).toHaveProperty('name');
    expect(response).toHaveProperty('mask');
    expect(response).toHaveProperty('isActive');
    expect(response).toHaveProperty('lastSyncedAt');
    expect(response).toHaveProperty('metadata');
    expect(response).toHaveProperty('createdAt');
    expect(response).toHaveProperty('updatedAt');
  });

  /**
   * Tests the account update endpoint contract
   * Verifies the API contract for updating account information
   */
  it('should validate account update endpoint contract', async () => {
    // Create test account
    const mockAccount = createMockAccount(mockUser.id);
    const createdAccount = await testEnvironment.api.post('/accounts', mockAccount);
    
    testEnvironment.api.setAuthToken(authToken);

    // Prepare update data
    const updateData = {
      name: 'Updated Account Name',
      balance: 5000.00,
      metadata: {
        ...mockAccount.metadata,
        notes: 'Updated account notes'
      }
    };

    // Send PUT request to update account
    const response = await testEnvironment.api.put(
      `/accounts/${createdAccount.id}`,
      updateData
    );

    // Verify response schema and updated fields
    expect(response).toHaveProperty('id', createdAccount.id);
    expect(response).toHaveProperty('userId', mockUser.id);
    expect(response).toHaveProperty('name', updateData.name);
    expect(response).toHaveProperty('balance', updateData.balance);
    expect(response.metadata).toHaveProperty('notes', updateData.metadata.notes);
    expect(response).toHaveProperty('updatedAt');
    
    // Verify non-updatable fields remain unchanged
    expect(response).toHaveProperty('institutionId', createdAccount.institutionId);
    expect(response).toHaveProperty('accountType', createdAccount.accountType);
    expect(response).toHaveProperty('mask', createdAccount.mask);
  });

  /**
   * Tests the account sync endpoint contract
   * Verifies the API contract for syncing account data
   */
  it('should validate account sync endpoint contract', async () => {
    // Create test account
    const mockAccount = createMockAccount(mockUser.id);
    const createdAccount = await testEnvironment.api.post('/accounts', mockAccount);
    
    testEnvironment.api.setAuthToken(authToken);

    // Send POST request to sync account
    const response = await testEnvironment.api.post(
      `/accounts/${createdAccount.id}/sync`
    );

    // Verify sync response schema
    expect(response).toHaveProperty('id', createdAccount.id);
    expect(response).toHaveProperty('userId', mockUser.id);
    expect(response).toHaveProperty('balance');
    expect(response).toHaveProperty('lastSyncedAt');
    expect(response).toHaveProperty('transactions');
    expect(Array.isArray(response.transactions)).toBe(true);
    
    // Verify transaction schema if present
    if (response.transactions.length > 0) {
      const transaction = response.transactions[0];
      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('accountId', createdAccount.id);
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('description');
      expect(transaction).toHaveProperty('category');
      expect(transaction).toHaveProperty('transactionDate');
    }
  });

  /**
   * Tests the account deactivation endpoint contract
   * Verifies the API contract for deactivating accounts
   */
  it('should validate account deactivation endpoint contract', async () => {
    // Create test account
    const mockAccount = createMockAccount(mockUser.id);
    const createdAccount = await testEnvironment.api.post('/accounts', mockAccount);
    
    testEnvironment.api.setAuthToken(authToken);

    // Send DELETE request to deactivate account
    const response = await testEnvironment.api.delete(
      `/accounts/${createdAccount.id}`
    );

    // Verify deactivation response schema
    expect(response).toHaveProperty('id', createdAccount.id);
    expect(response).toHaveProperty('userId', mockUser.id);
    expect(response).toHaveProperty('isActive', false);
    expect(response).toHaveProperty('deactivatedAt');
    
    // Verify account data is preserved
    expect(response).toHaveProperty('institutionId');
    expect(response).toHaveProperty('accountType');
    expect(response).toHaveProperty('name');
    expect(response).toHaveProperty('mask');
    expect(response).toHaveProperty('metadata');

    // Verify account is not listed in active accounts
    const activeAccounts = await testEnvironment.api.get('/accounts');
    const deactivatedAccount = activeAccounts.find(
      (acc: any) => acc.id === createdAccount.id
    );
    expect(deactivatedAccount).toBeUndefined();
  });
});