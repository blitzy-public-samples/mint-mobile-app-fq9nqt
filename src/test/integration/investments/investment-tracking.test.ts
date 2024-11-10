// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'; // ^29.0.0
import request from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser } from '../../utils/mock-data';
import { InvestmentsService } from '../../../backend/src/modules/investments/investments.service';

/**
 * Human Tasks Required:
 * 1. Configure test database with investment data schema
 * 2. Set up market data mock service for price updates
 * 3. Configure test environment variables in .env.test
 * 4. Ensure proper test user permissions for investment operations
 */

describe('Investment Portfolio Tracking Integration Tests', () => {
  let testEnv: {
    db: any;
    api: any;
    auth: { token: string };
  };
  let testUser: any;
  let investmentsService: InvestmentsService;

  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test environment with database and API client
    testEnv = await setupTestEnvironment({
      services: ['investments'],
      mockMarketData: true
    });

    // Create test user with investment permissions
    testUser = await createMockUser({
      permissions: ['investments.read', 'investments.write']
    });

    // Initialize investments service
    investmentsService = new InvestmentsService(testEnv.db.getRepository('Investment'));
  });

  // Cleanup test environment after all tests
  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  /**
   * Test investment creation with validation
   * Requirements addressed:
   * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
   */
  test('testInvestmentCreation', async () => {
    // Create test investment data
    const investmentData = {
      symbol: 'AAPL',
      quantity: 10,
      purchasePrice: 150.00,
      purchaseDate: new Date(),
      notes: 'Test investment position'
    };

    // Create investment through service
    const createdInvestment = await investmentsService.create(investmentData, testUser.id);

    // Verify investment details
    expect(createdInvestment).toBeDefined();
    expect(createdInvestment.symbol).toBe(investmentData.symbol);
    expect(createdInvestment.quantity).toBe(investmentData.quantity);
    expect(createdInvestment.purchasePrice).toBe(investmentData.purchasePrice);

    // Verify market value calculations
    const marketValue = createdInvestment.quantity * createdInvestment.purchasePrice;
    expect(createdInvestment.marketValue).toBe(marketValue);

    // Verify unrealized gain calculations
    expect(createdInvestment.unrealizedGain).toBe(0); // Initial position has no gain/loss
  });

  /**
   * Test portfolio value calculations across multiple holdings
   * Requirements addressed:
   * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
   */
  test('testPortfolioValuation', async () => {
    // Create multiple test investments
    const investments = [
      {
        symbol: 'MSFT',
        quantity: 5,
        purchasePrice: 200.00
      },
      {
        symbol: 'GOOGL',
        quantity: 2,
        purchasePrice: 2500.00
      }
    ];

    // Create investments and store their IDs
    const createdInvestments = await Promise.all(
      investments.map(inv => investmentsService.create(inv, testUser.id))
    );

    // Calculate expected total portfolio value
    const expectedTotal = investments.reduce((sum, inv) => 
      sum + (inv.quantity * inv.purchasePrice), 0
    );

    // Get actual portfolio value from service
    const portfolioValue = await investmentsService.calculatePortfolioValue(testUser.id);

    // Verify calculation accuracy
    expect(portfolioValue).toBe(expectedTotal);

    // Test with price updates
    const updatedPrice = 210.00; // 5% increase for MSFT
    await investmentsService.update(createdInvestments[0].id, {
      currentPrice: updatedPrice
    }, testUser.id);

    // Verify updated portfolio value
    const updatedPortfolioValue = await investmentsService.calculatePortfolioValue(testUser.id);
    const expectedUpdatedTotal = (updatedPrice * investments[0].quantity) + 
      (investments[1].quantity * investments[1].purchasePrice);
    expect(updatedPortfolioValue).toBe(expectedUpdatedTotal);
  });

  /**
   * Test investment price update functionality and recalculations
   * Requirements addressed:
   * - Real-time Data Synchronization (Technical Specification/1.1 System Overview)
   */
  test('testPriceUpdates', async () => {
    // Create test investment with initial price
    const investment = await investmentsService.create({
      symbol: 'NFLX',
      quantity: 10,
      purchasePrice: 400.00
    }, testUser.id);

    // Update price through service
    const newPrice = 420.00; // 5% increase
    await investmentsService.update(investment.id, {
      currentPrice: newPrice
    }, testUser.id);

    // Verify price update
    const updatedInvestment = await investmentsService.findOne(investment.id, testUser.id);
    expect(updatedInvestment.currentPrice).toBe(newPrice);

    // Check market value recalculation
    const expectedMarketValue = updatedInvestment.quantity * newPrice;
    expect(updatedInvestment.marketValue).toBe(expectedMarketValue);

    // Verify unrealized gain calculation
    const expectedGain = (newPrice - investment.purchasePrice) * investment.quantity;
    expect(updatedInvestment.unrealizedGain).toBe(expectedGain);
  });

  /**
   * Test investment performance calculations and metrics
   * Requirements addressed:
   * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
   */
  test('testPerformanceMetrics', async () => {
    // Create test investment with price history
    const investment = await investmentsService.create({
      symbol: 'AMZN',
      quantity: 5,
      purchasePrice: 3000.00,
      purchaseDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
    }, testUser.id);

    // Update with current price (10% gain)
    const currentPrice = 3300.00;
    await investmentsService.update(investment.id, {
      currentPrice
    }, testUser.id);

    // Verify return calculations
    const updatedInvestment = await investmentsService.findOne(investment.id, testUser.id);
    const expectedReturn = ((currentPrice - investment.purchasePrice) / investment.purchasePrice) * 100;
    expect(updatedInvestment.returnPercentage).toBe(expectedReturn);

    // Test different time period calculations
    const thirtyDayPrice = 3150.00; // 5% gain from purchase
    await investmentsService.update(investment.id, {
      currentPrice: thirtyDayPrice,
      priceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }, testUser.id);

    // Verify thirty-day return calculation
    const thirtyDayReturn = ((currentPrice - thirtyDayPrice) / thirtyDayPrice) * 100;
    expect(updatedInvestment.thirtyDayReturn).toBe(thirtyDayReturn);

    // Validate total gain calculations
    const totalGain = (currentPrice - investment.purchasePrice) * investment.quantity;
    expect(updatedInvestment.totalGain).toBe(totalGain);
  });
});