// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0
import { PlaidProduct, PlaidCountryCode } from '../../../backend/src/modules/plaid/dto/link-token.dto';

// Internal imports
import { PlaidService } from '../../../backend/src/modules/plaid/plaid.service';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser } from '../../utils/mock-data';

/**
 * Human Tasks:
 * 1. Configure Plaid sandbox credentials in test environment:
 *    - PLAID_CLIENT_ID
 *    - PLAID_SECRET
 *    - PLAID_ENV=sandbox
 * 2. Set up test webhook endpoint URL in environment
 * 3. Configure test OAuth redirect URIs in Plaid dashboard
 * 4. Ensure test database has encryption configured for token storage
 */

describe('Plaid Integration Tests', () => {
  let testEnv: any;
  let plaidService: PlaidService;
  let mockUser: any;
  let mockPublicToken: string;
  let accessToken: string;

  // Test environment setup
  beforeAll(async () => {
    // Requirements addressed: Financial Institution Integration
    // Set up secure test environment with database and API client
    testEnv = await setupTestEnvironment({
      enableEncryption: true,
      logLevel: 'debug'
    });

    // Initialize Plaid service with test credentials
    plaidService = new PlaidService(testEnv.config);

    // Create mock user for testing
    mockUser = await createMockUser();

    // Mock Plaid sandbox public token
    mockPublicToken = 'public-sandbox-' + Math.random().toString(36).substring(2, 15);
  });

  // Clean up test environment
  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  test('should create Plaid link token with proper configuration', async () => {
    // Requirements addressed: Financial Institution Integration, Data Security
    const linkTokenRequest = {
      clientUserId: mockUser.id,
      clientName: 'MintReplica Test',
      products: [PlaidProduct.TRANSACTIONS, PlaidProduct.AUTH],
      countryCodes: [PlaidCountryCode.US],
      language: 'en',
      webhook: process.env.PLAID_WEBHOOK_URL
    };

    const result = await plaidService.createLinkToken(linkTokenRequest);

    // Verify link token format and properties
    expect(result).toHaveProperty('linkToken');
    expect(typeof result.linkToken).toBe('string');
    expect(result.linkToken).toMatch(/^link-sandbox-/);

    // Verify token expiration (should be valid for 4 hours)
    const tokenParts = result.linkToken.split('_');
    const expirationTimestamp = parseInt(tokenParts[tokenParts.length - 1]);
    expect(expirationTimestamp).toBeGreaterThan(Date.now() / 1000);
    expect(expirationTimestamp).toBeLessThan((Date.now() / 1000) + 14400);
  });

  test('should exchange public token for access token securely', async () => {
    // Requirements addressed: Account Aggregation, Data Security
    const exchangeResult = await plaidService.exchangePublicToken({
      publicToken: mockPublicToken
    });

    // Verify access token and item ID
    expect(exchangeResult).toHaveProperty('accessToken');
    expect(exchangeResult).toHaveProperty('itemId');
    expect(typeof exchangeResult.accessToken).toBe('string');
    expect(typeof exchangeResult.itemId).toBe('string');

    // Store access token for subsequent tests
    accessToken = exchangeResult.accessToken;

    // Verify token encryption
    const encryptedToken = await testEnv.db.query(
      'SELECT access_token FROM plaid_items WHERE item_id = $1',
      [exchangeResult.itemId]
    );
    expect(encryptedToken.rows[0].access_token).not.toBe(accessToken);
  });

  test('should retrieve account data with proper authorization', async () => {
    // Requirements addressed: Account Aggregation, Data Security
    const accountData = await plaidService.getAccountData(accessToken);

    // Verify account data structure
    expect(accountData).toHaveProperty('accounts');
    expect(accountData).toHaveProperty('item');
    expect(Array.isArray(accountData.accounts)).toBe(true);

    // Verify required account fields
    accountData.accounts.forEach((account: any) => {
      expect(account).toHaveProperty('account_id');
      expect(account).toHaveProperty('balances');
      expect(account).toHaveProperty('mask');
      expect(account).toHaveProperty('name');
      expect(account).toHaveProperty('official_name');
      expect(account).toHaveProperty('type');
      expect(account).toHaveProperty('subtype');
    });

    // Verify data encryption in transit
    expect(testEnv.api.lastRequest.headers['x-encryption-key']).toBeTruthy();
  });

  test('should retrieve transactions with date filtering', async () => {
    // Requirements addressed: Account Aggregation, Data Security
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const transactionData = await plaidService.getTransactions(
      accessToken,
      startDate,
      endDate
    );

    // Verify transaction data structure
    expect(transactionData).toHaveProperty('transactions');
    expect(transactionData).toHaveProperty('accounts');
    expect(Array.isArray(transactionData.transactions)).toBe(true);

    // Verify transaction fields
    transactionData.transactions.forEach((transaction: any) => {
      expect(transaction).toHaveProperty('transaction_id');
      expect(transaction).toHaveProperty('account_id');
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('date');
      expect(transaction).toHaveProperty('name');
      expect(transaction).toHaveProperty('merchant_name');
      expect(transaction).toHaveProperty('pending');
      expect(transaction).toHaveProperty('category');
      expect(transaction).toHaveProperty('category_id');

      // Verify transaction date is within specified range
      const transactionDate = new Date(transaction.date);
      expect(transactionDate >= startDate).toBe(true);
      expect(transactionDate <= endDate).toBe(true);
    });
  });

  test('should handle Plaid API errors appropriately', async () => {
    // Requirements addressed: Data Security
    // Test invalid token scenario
    await expect(
      plaidService.getAccountData('invalid-token')
    ).rejects.toThrow('Failed to retrieve account data');

    // Test rate limit handling
    const rateLimitPromises = Array(10).fill(null).map(() => 
      plaidService.getAccountData(accessToken)
    );
    const results = await Promise.allSettled(rateLimitPromises);
    const rateLimitedRequests = results.filter(
      result => result.status === 'rejected' && 
      result.reason.message.includes('rate limit')
    );
    expect(rateLimitedRequests.length).toBeGreaterThan(0);

    // Test token refresh on expiration
    const expiredToken = 'access-sandbox-expired';
    await expect(
      plaidService.getTransactions(
        expiredToken,
        new Date(),
        new Date()
      )
    ).rejects.toThrow('Failed to retrieve transactions');
  });

  test('should validate webhook notifications', async () => {
    // Requirements addressed: Financial Institution Integration, Data Security
    const mockWebhook = {
      webhook_type: 'TRANSACTIONS',
      webhook_code: 'DEFAULT_UPDATE',
      item_id: 'mock-item-id',
      new_transactions: 3
    };

    // Verify webhook signature
    const webhookResponse = await supertest(testEnv.app)
      .post('/api/plaid/webhook')
      .set('Plaid-Verification', 'mock-signature')
      .send(mockWebhook);

    expect(webhookResponse.status).toBe(200);

    // Verify invalid signature rejection
    const invalidWebhookResponse = await supertest(testEnv.app)
      .post('/api/plaid/webhook')
      .set('Plaid-Verification', 'invalid-signature')
      .send(mockWebhook);

    expect(invalidWebhookResponse.status).toBe(401);
  });

  test('should handle token refresh and rotation', async () => {
    // Requirements addressed: Data Security
    // Mock token rotation after 30 days
    const oldAccessToken = accessToken;
    jest.useFakeTimers().setSystemTime(
      new Date().getTime() + (31 * 24 * 60 * 60 * 1000)
    );

    const rotationResult = await plaidService.rotateAccessToken(oldAccessToken);
    expect(rotationResult).toHaveProperty('new_access_token');
    expect(rotationResult.new_access_token).not.toBe(oldAccessToken);

    // Verify old token is invalidated
    await expect(
      plaidService.getAccountData(oldAccessToken)
    ).rejects.toThrow('Failed to retrieve account data');

    // Verify new token works
    const accountData = await plaidService.getAccountData(
      rotationResult.new_access_token
    );
    expect(accountData).toHaveProperty('accounts');

    jest.useRealTimers();
  });
});