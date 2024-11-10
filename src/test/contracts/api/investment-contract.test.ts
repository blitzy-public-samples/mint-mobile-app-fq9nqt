// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0

// Internal imports
import { Investment } from '../../../backend/src/modules/investments/entities/investment.entity';
import { CreateInvestmentDto } from '../../../backend/src/modules/investments/dto/create-investment.dto';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { TestApiClient } from '../../utils/api-client';

/**
 * Human Tasks:
 * 1. Configure test database with proper decimal/numeric column support
 * 2. Set up test environment variables in .env.test
 * 3. Ensure proper network access to API endpoints for testing
 * 4. Configure test timeouts if default values are not suitable
 * 5. Set up test authentication credentials
 */

describe('Investment API Contract Tests', () => {
  let testEnv: {
    db: any;
    api: TestApiClient;
    auth: { token: string };
  };

  // Test data
  const testInvestment: CreateInvestmentDto = {
    accountId: '123e4567-e89b-12d3-a456-426614174000',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    assetClass: 'stocks',
    quantity: 10.5,
    costBasis: 150.75,
    currentPrice: 155.25,
    currency: 'USD'
  };

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await testEnv.db.getRepository(Investment).delete({});
  });

  /**
   * Tests the contract for creating a new investment
   * Requirements addressed:
   * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
   * - API Design (Technical Specification/8.3 API Design)
   * - Data Security (Technical Specification/9.2.2 Data Classification)
   */
  test('testInvestmentCreationContract', async () => {
    // Send POST request to create investment
    const response = await testEnv.api.post<Investment>(
      '/api/investments',
      testInvestment
    );

    // Verify response structure matches Investment entity schema
    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.userId).toBeDefined();
    expect(response.accountId).toBe(testInvestment.accountId);
    expect(response.symbol).toBe(testInvestment.symbol);
    expect(response.name).toBe(testInvestment.name);
    expect(response.quantity).toBe(testInvestment.quantity);
    expect(response.costBasis).toBe(testInvestment.costBasis);
    expect(response.currentPrice).toBe(testInvestment.currentPrice);
    expect(response.currency).toBe(testInvestment.currency);

    // Verify calculated fields
    expect(response.marketValue).toBe(testInvestment.quantity * testInvestment.currentPrice);
    expect(response.unrealizedGain).toBe(
      (testInvestment.currentPrice - testInvestment.costBasis) * testInvestment.quantity
    );
    expect(response.returnPercentage).toBeDefined();

    // Verify timestamps
    expect(response.createdAt).toBeDefined();
    expect(response.updatedAt).toBeDefined();
  });

  /**
   * Tests the contract for retrieving investment details
   * Requirements addressed:
   * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
   * - API Design (Technical Specification/8.3 API Design)
   * - Data Security (Technical Specification/9.2.2 Data Classification)
   */
  test('testInvestmentRetrievalContract', async () => {
    // Create test investment
    const created = await testEnv.api.post<Investment>(
      '/api/investments',
      testInvestment
    );

    // Retrieve investment
    const response = await testEnv.api.get<Investment>(
      `/api/investments/${created.id}`
    );

    // Verify response structure
    expect(response).toBeDefined();
    expect(response.id).toBe(created.id);
    expect(response.userId).toBe(created.userId);
    expect(response.accountId).toBe(testInvestment.accountId);
    expect(response.symbol).toBe(testInvestment.symbol);
    expect(response.name).toBe(testInvestment.name);
    expect(response.quantity).toBe(testInvestment.quantity);
    expect(response.costBasis).toBe(testInvestment.costBasis);
    expect(response.currentPrice).toBe(testInvestment.currentPrice);
    expect(response.marketValue).toBe(created.marketValue);
    expect(response.unrealizedGain).toBe(created.unrealizedGain);
    expect(response.returnPercentage).toBe(created.returnPercentage);
    expect(response.currency).toBe(testInvestment.currency);
    expect(response.createdAt).toBeDefined();
    expect(response.updatedAt).toBeDefined();
  });

  /**
   * Tests the contract for updating investment details
   * Requirements addressed:
   * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
   * - API Design (Technical Specification/8.3 API Design)
   * - Data Security (Technical Specification/9.2.2 Data Classification)
   */
  test('testInvestmentUpdateContract', async () => {
    // Create test investment
    const created = await testEnv.api.post<Investment>(
      '/api/investments',
      testInvestment
    );

    // Update data
    const updates = {
      quantity: 15.75,
      currentPrice: 160.50
    };

    // Send update request
    const response = await testEnv.api.put<Investment>(
      `/api/investments/${created.id}`,
      updates
    );

    // Verify updated fields
    expect(response.id).toBe(created.id);
    expect(response.quantity).toBe(updates.quantity);
    expect(response.currentPrice).toBe(updates.currentPrice);

    // Verify recalculated fields
    expect(response.marketValue).toBe(updates.quantity * updates.currentPrice);
    expect(response.unrealizedGain).toBe(
      (updates.currentPrice - testInvestment.costBasis) * updates.quantity
    );
    expect(response.returnPercentage).toBeDefined();

    // Verify unchanged fields
    expect(response.symbol).toBe(testInvestment.symbol);
    expect(response.costBasis).toBe(testInvestment.costBasis);
    expect(response.currency).toBe(testInvestment.currency);

    // Verify timestamps
    expect(response.updatedAt).not.toBe(created.updatedAt);
  });

  /**
   * Tests the contract for deleting an investment
   * Requirements addressed:
   * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
   * - API Design (Technical Specification/8.3 API Design)
   * - Data Security (Technical Specification/9.2.2 Data Classification)
   */
  test('testInvestmentDeletionContract', async () => {
    // Create test investment
    const created = await testEnv.api.post<Investment>(
      '/api/investments',
      testInvestment
    );

    // Delete investment
    await testEnv.api.delete(`/api/investments/${created.id}`);

    // Verify investment is no longer retrievable
    try {
      await testEnv.api.get(`/api/investments/${created.id}`);
      fail('Expected 404 error');
    } catch (error) {
      expect(error).toBeDefined();
      expect(JSON.parse(error.message).status).toBe(404);
    }

    // Verify investment is removed from database
    const dbRecord = await testEnv.db
      .getRepository(Investment)
      .findOne({ where: { id: created.id } });
    expect(dbRecord).toBeNull();
  });

  /**
   * Tests error handling for invalid investment data
   * Requirements addressed:
   * - API Design (Technical Specification/8.3 API Design)
   * - Data Security (Technical Specification/9.2.2 Data Classification)
   */
  test('testInvestmentValidationContract', async () => {
    // Test invalid quantity
    const invalidQuantity = { ...testInvestment, quantity: -1 };
    try {
      await testEnv.api.post('/api/investments', invalidQuantity);
      fail('Expected validation error');
    } catch (error) {
      expect(error).toBeDefined();
      expect(JSON.parse(error.message).status).toBe(400);
    }

    // Test invalid cost basis
    const invalidCostBasis = { ...testInvestment, costBasis: 0 };
    try {
      await testEnv.api.post('/api/investments', invalidCostBasis);
      fail('Expected validation error');
    } catch (error) {
      expect(error).toBeDefined();
      expect(JSON.parse(error.message).status).toBe(400);
    }

    // Test missing required fields
    const missingFields = {
      symbol: 'AAPL',
      quantity: 10
    };
    try {
      await testEnv.api.post('/api/investments', missingFields);
      fail('Expected validation error');
    } catch (error) {
      expect(error).toBeDefined();
      expect(JSON.parse(error.message).status).toBe(400);
    }
  });
});