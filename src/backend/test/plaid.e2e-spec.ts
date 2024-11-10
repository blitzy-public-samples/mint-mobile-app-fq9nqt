// Third-party imports with versions
import { Test, TestingModule } from '@nestjs/testing'; // ^9.0.0
import { INestApplication } from '@nestjs/common'; // ^9.0.0
import * as request from 'supertest'; // ^6.3.0

// Internal imports
import { PlaidService } from '../src/modules/plaid/plaid.service';
import { LinkTokenDto, PlaidProduct, PlaidCountryCode } from '../src/modules/plaid/dto/link-token.dto';
import { ExchangeTokenDto } from '../src/modules/plaid/dto/exchange-token.dto';

/**
 * Human Tasks:
 * 1. Configure test environment with valid Plaid API sandbox credentials
 * 2. Set up test database with required user and account data
 * 3. Configure test webhook URL if testing webhook functionality
 * 4. Ensure network access to Plaid sandbox environment
 * 5. Set up test user credentials in environment variables
 */

/**
 * End-to-end tests for Plaid integration functionality
 * Requirements addressed:
 * - Financial Institution Integration Testing (Technical Specification/1.2 Scope/Core Features)
 * - Security Testing (Technical Specification/9.2 Data Security)
 * - API Security Testing (Technical Specification/9.3.1 API Security)
 */
describe('Plaid Integration (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let plaidService: PlaidService;

  // Test data
  const testUserId = 'test-user-123';
  const testInstitutionId = 'ins_sandbox_test';
  const testAccountId = 'test_checking_account';

  beforeAll(async () => {
    // Create test module with PlaidService
    moduleRef = await Test.createTestingModule({
      imports: [], // Add required modules
      providers: [PlaidService],
    }).compile();

    // Create NestJS application instance
    app = moduleRef.createNestApplication();
    await app.init();

    // Get PlaidService instance
    plaidService = moduleRef.get<PlaidService>(PlaidService);
  });

  afterAll(async () => {
    // Cleanup test resources
    await app.close();
  });

  describe('Link Token Creation', () => {
    it('should create a valid link token with required parameters', async () => {
      // Test requirement: Financial Institution Integration Testing
      const linkTokenDto: LinkTokenDto = {
        clientUserId: testUserId,
        clientName: 'Mint Replica Lite Test',
        products: [PlaidProduct.TRANSACTIONS, PlaidProduct.AUTH],
        countryCodes: [PlaidCountryCode.US],
      };

      const response = await request(app.getHttpServer())
        .post('/plaid/create-link-token')
        .send(linkTokenDto)
        .expect(201);

      // Verify response structure and token format
      expect(response.body).toHaveProperty('linkToken');
      expect(response.body.linkToken).toMatch(/^link-sandbox-[a-zA-Z0-9-]+$/);
    });

    it('should validate required link token parameters', async () => {
      // Test requirement: API Security Testing
      const invalidDto = {
        clientUserId: testUserId,
        // Missing required fields
      };

      await request(app.getHttpServer())
        .post('/plaid/create-link-token')
        .send(invalidDto)
        .expect(400);
    });

    it('should handle Plaid API errors gracefully', async () => {
      // Test requirement: Security Testing
      const invalidDto: LinkTokenDto = {
        clientUserId: '', // Invalid user ID
        clientName: 'Test',
        products: [PlaidProduct.TRANSACTIONS],
        countryCodes: [PlaidCountryCode.US],
      };

      await request(app.getHttpServer())
        .post('/plaid/create-link-token')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('Public Token Exchange', () => {
    it('should exchange public token for access token', async () => {
      // Test requirement: Financial Institution Integration Testing
      const exchangeTokenDto: ExchangeTokenDto = {
        publicToken: 'public-sandbox-123abc',
        institutionId: testInstitutionId,
        accountId: testAccountId,
      };

      const response = await request(app.getHttpServer())
        .post('/plaid/exchange-token')
        .send(exchangeTokenDto)
        .expect(201);

      // Verify response contains access token and item ID
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('itemId');
      expect(response.body.accessToken).toMatch(/^access-sandbox-[a-zA-Z0-9-]+$/);
      expect(response.body.itemId).toMatch(/^item-sandbox-[a-zA-Z0-9-]+$/);
    });

    it('should validate public token format', async () => {
      // Test requirement: API Security Testing
      const invalidDto: ExchangeTokenDto = {
        publicToken: 'invalid-token',
        institutionId: testInstitutionId,
        accountId: testAccountId,
      };

      await request(app.getHttpServer())
        .post('/plaid/exchange-token')
        .send(invalidDto)
        .expect(400);
    });

    it('should handle invalid public tokens', async () => {
      // Test requirement: Security Testing
      const invalidDto: ExchangeTokenDto = {
        publicToken: 'public-sandbox-invalid',
        institutionId: testInstitutionId,
        accountId: testAccountId,
      };

      await request(app.getHttpServer())
        .post('/plaid/exchange-token')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('Account Data Retrieval', () => {
    let testAccessToken: string;

    beforeAll(async () => {
      // Set up test access token for account data tests
      testAccessToken = 'access-sandbox-test-token';
    });

    it('should retrieve account data with valid access token', async () => {
      // Test requirement: Financial Institution Integration Testing
      const response = await request(app.getHttpServer())
        .get('/plaid/accounts')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(200);

      // Verify account data structure
      expect(response.body).toHaveProperty('accounts');
      expect(Array.isArray(response.body.accounts)).toBeTruthy();
      expect(response.body.accounts[0]).toHaveProperty('account_id');
      expect(response.body.accounts[0]).toHaveProperty('balances');
    });

    it('should handle invalid access tokens', async () => {
      // Test requirement: Security Testing
      await request(app.getHttpServer())
        .get('/plaid/accounts')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should validate account data response format', async () => {
      // Test requirement: API Security Testing
      const response = await request(app.getHttpServer())
        .get('/plaid/accounts')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(200);

      // Verify data masking and security
      expect(response.body.accounts[0]).not.toHaveProperty('access_token');
      expect(response.body.accounts[0]).not.toHaveProperty('numbers');
    });
  });

  describe('Error Handling', () => {
    it('should handle Plaid API timeouts', async () => {
      // Test requirement: Security Testing
      jest.spyOn(plaidService, 'createLinkToken').mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 5000);
        });
      });

      await request(app.getHttpServer())
        .post('/plaid/create-link-token')
        .send({
          clientUserId: testUserId,
          clientName: 'Test',
          products: [PlaidProduct.TRANSACTIONS],
          countryCodes: [PlaidCountryCode.US],
        })
        .expect(408);
    });

    it('should handle rate limiting', async () => {
      // Test requirement: API Security Testing
      const requests = Array(10).fill(null).map(() => 
        request(app.getHttpServer())
          .post('/plaid/create-link-token')
          .send({
            clientUserId: testUserId,
            clientName: 'Test',
            products: [PlaidProduct.TRANSACTIONS],
            countryCodes: [PlaidCountryCode.US],
          })
      );

      const responses = await Promise.all(requests);
      expect(responses.some(r => r.status === 429)).toBeTruthy();
    });

    it('should handle Plaid API errors with proper status codes', async () => {
      // Test requirement: Security Testing
      jest.spyOn(plaidService, 'getAccountData').mockRejectedValueOnce(new Error('INVALID_ACCOUNT'));

      await request(app.getHttpServer())
        .get('/plaid/accounts')
        .set('Authorization', 'Bearer test-token')
        .expect(400)
        .expect(res => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('error');
        });
    });
  });
});