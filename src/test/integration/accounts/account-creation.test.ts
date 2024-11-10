// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'; // ^29.0.0
import request from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser, createMockAccount } from '../../utils/mock-data';
import { Account } from '../../../backend/src/modules/accounts/entities/account.entity';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test
 * 2. Set up test database with proper permissions
 * 3. Configure test API endpoints and authentication
 * 4. Ensure all test dependencies are installed with correct versions
 * 5. Set up logging directory with write permissions
 */

describe('Account Creation Integration Tests', () => {
  let testEnv: {
    db: any;
    api: any;
    auth: { token: string };
  };
  let testUser: any;

  beforeAll(async () => {
    // Requirements addressed: Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
    testEnv = await setupTestEnvironment();
    const mockUser = createMockUser();
    testUser = await testEnv.db.getRepository('users').save(mockUser);
  });

  afterAll(async () => {
    // Requirements addressed: Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
    await cleanupTestEnvironment(testEnv);
  });

  test('should successfully create a financial account', async () => {
    // Requirements addressed: Financial Account Integration (Technical Specification/1.2 Scope/Core Features)
    const mockAccount = createMockAccount(testUser.id, {
      name: 'Test Checking Account',
      accountType: 'checking',
      balance: 1000.00,
      currency: 'USD',
      institutionId: 'inst_1'
    });

    const response = await request(testEnv.api)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send(mockAccount);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: mockAccount.name,
      accountType: mockAccount.accountType,
      balance: mockAccount.balance,
      currency: mockAccount.currency,
      isActive: true,
      userId: testUser.id
    });

    // Verify account persisted in database
    const savedAccount = await testEnv.db
      .getRepository(Account)
      .findOne({ where: { id: response.body.id } });
    
    expect(savedAccount).toBeTruthy();
    expect(savedAccount.userId).toBe(testUser.id);
  });

  test('should validate account creation rules', async () => {
    // Requirements addressed: Data Security (Technical Specification/9.2 Data Security)
    const invalidTestCases = [
      {
        // Missing required fields
        payload: {},
        expectedStatus: 400,
        expectedError: 'Required fields missing'
      },
      {
        // Invalid account type
        payload: createMockAccount(testUser.id, { accountType: 'invalid_type' }),
        expectedStatus: 400,
        expectedError: 'Invalid account type'
      },
      {
        // Invalid currency format
        payload: createMockAccount(testUser.id, { currency: 'INVALID' }),
        expectedStatus: 400,
        expectedError: 'Invalid currency code'
      },
      {
        // Invalid balance format
        payload: createMockAccount(testUser.id, { balance: 'invalid' }),
        expectedStatus: 400,
        expectedError: 'Invalid balance format'
      }
    ];

    for (const testCase of invalidTestCases) {
      const response = await request(testEnv.api)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(testCase.payload);

      expect(response.status).toBe(testCase.expectedStatus);
      expect(response.body.error).toContain(testCase.expectedError);
    }
  });

  test('should prevent duplicate account creation', async () => {
    // Requirements addressed: Data Security (Technical Specification/9.2 Data Security)
    const mockAccount = createMockAccount(testUser.id, {
      name: 'Duplicate Test Account',
      accountType: 'savings',
      institutionId: 'inst_1'
    });

    // Create initial account
    await request(testEnv.api)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send(mockAccount);

    // Attempt to create duplicate
    const duplicateResponse = await request(testEnv.api)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send(mockAccount);

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.error).toContain('Account already exists');

    // Verify no duplicate in database
    const accounts = await testEnv.db
      .getRepository(Account)
      .find({ where: { name: mockAccount.name, userId: testUser.id } });
    
    expect(accounts.length).toBe(1);
  });

  test('should enforce account creation authorization', async () => {
    // Requirements addressed: Data Security (Technical Specification/9.2 Data Security)
    const mockAccount = createMockAccount(testUser.id);

    // Test without auth token
    const noAuthResponse = await request(testEnv.api)
      .post('/api/v1/accounts')
      .send(mockAccount);

    expect(noAuthResponse.status).toBe(401);

    // Test with invalid auth token
    const invalidAuthResponse = await request(testEnv.api)
      .post('/api/v1/accounts')
      .set('Authorization', 'Bearer invalid_token')
      .send(mockAccount);

    expect(invalidAuthResponse.status).toBe(403);

    // Verify no accounts were created
    const accounts = await testEnv.db
      .getRepository(Account)
      .find({ where: { name: mockAccount.name } });
    
    expect(accounts.length).toBe(0);
  });
});