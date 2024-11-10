// @jest/globals v29.0.0
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// Internal imports
import { InvestmentsService } from '../../../backend/src/modules/investments/investments.service';
import { Investment } from '../../../backend/src/modules/investments/entities/investment.entity';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';

/**
 * Human Tasks:
 * 1. Ensure test database is configured with decimal/numeric column support
 * 2. Configure test environment variables in .env.test
 * 3. Set up test market data provider mock
 * 4. Configure test logging directory with write permissions
 * 5. Verify test database has proper indexes for performance
 */

describe('Investment Performance Calculation Integration Tests', () => {
  let testEnv: any;
  let investmentsService: InvestmentsService;
  let testInvestment: Investment;

  // Test data constants
  const TEST_QUANTITY = 100;
  const TEST_COST_BASIS = 45.00;
  const TEST_CURRENT_PRICE = 50.25;
  const EXPECTED_MARKET_VALUE = 5025.00;
  const EXPECTED_UNREALIZED_GAIN = 525.00;
  const EXPECTED_RETURN_PERCENTAGE = 11.67;

  beforeAll(async () => {
    // Requirements addressed: Investment Portfolio Tracking
    // Technical Specification/1.2 Scope/Core Features
    testEnv = await setupTestEnvironment({
      enableSecurity: true,
      mockMarketData: true
    });

    investmentsService = testEnv.module.get(InvestmentsService);

    // Create test investment with known values
    const createInvestmentDto = {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      quantity: TEST_QUANTITY,
      costBasis: TEST_COST_BASIS,
      currentPrice: TEST_CURRENT_PRICE,
      assetClass: 'Stocks',
      currency: 'USD',
      accountId: testEnv.testAccount.id
    };

    testInvestment = await investmentsService.create(createInvestmentDto, testEnv.testUser.id);
  });

  afterAll(async () => {
    // Requirements addressed: Data Security
    // Technical Specification/9.2.1 Encryption Standards
    await cleanupTestEnvironment(testEnv);
  });

  test('should calculate market value with precision', async () => {
    // Requirements addressed: Investment Portfolio Tracking
    // Technical Specification/1.2 Scope/Core Features
    
    // Calculate market value
    const marketValue = testInvestment.calculateMarketValue();

    // Verify precision and accuracy
    expect(marketValue).toBe(EXPECTED_MARKET_VALUE);
    expect(Number.isFinite(marketValue)).toBe(true);
    expect(marketValue.toString()).toMatch(/^\d+\.\d{2}$/);

    // Test with zero quantity
    testInvestment.quantity = 0;
    expect(testInvestment.calculateMarketValue()).toBe(0);

    // Test with large numbers
    testInvestment.quantity = 1000000;
    const largeValue = testInvestment.calculateMarketValue();
    expect(Number.isFinite(largeValue)).toBe(true);
    expect(largeValue.toString()).toMatch(/^\d+\.\d{2}$/);
  });

  test('should calculate unrealized gain/loss correctly', async () => {
    // Requirements addressed: Investment Portfolio Tracking
    // Technical Specification/1.2 Scope/Core Features
    
    // Reset test data
    testInvestment.quantity = TEST_QUANTITY;
    testInvestment.costBasis = TEST_COST_BASIS;
    testInvestment.currentPrice = TEST_CURRENT_PRICE;

    // Calculate unrealized gain
    const unrealizedGain = testInvestment.calculateUnrealizedGain();

    // Verify calculations
    expect(unrealizedGain).toBe(EXPECTED_UNREALIZED_GAIN);
    expect(Number.isFinite(unrealizedGain)).toBe(true);
    expect(unrealizedGain.toString()).toMatch(/^-?\d+\.\d{2}$/);

    // Test loss scenario
    testInvestment.currentPrice = 40.00;
    const unrealizedLoss = testInvestment.calculateUnrealizedGain();
    expect(unrealizedLoss).toBeLessThan(0);
    expect(unrealizedLoss.toString()).toMatch(/^-\d+\.\d{2}$/);

    // Test zero cost basis
    testInvestment.costBasis = 0;
    expect(testInvestment.calculateUnrealizedGain()).toBe(
      testInvestment.calculateMarketValue()
    );
  });

  test('should calculate return percentage with formatting', async () => {
    // Requirements addressed: Investment Portfolio Tracking
    // Technical Specification/1.2 Scope/Core Features
    
    // Reset test data
    testInvestment.quantity = TEST_QUANTITY;
    testInvestment.costBasis = TEST_COST_BASIS;
    testInvestment.currentPrice = TEST_CURRENT_PRICE;

    // Calculate return percentage
    const returnPercentage = testInvestment.calculateReturnPercentage();

    // Verify calculations and formatting
    expect(returnPercentage).toBe(EXPECTED_RETURN_PERCENTAGE);
    expect(Number.isFinite(returnPercentage)).toBe(true);
    expect(returnPercentage.toString()).toMatch(/^-?\d+\.\d{2}$/);

    // Test negative return
    testInvestment.currentPrice = 40.00;
    const negativeReturn = testInvestment.calculateReturnPercentage();
    expect(negativeReturn).toBeLessThan(0);
    expect(negativeReturn.toString()).toMatch(/^-\d+\.\d{2}$/);

    // Test zero cost basis
    testInvestment.costBasis = 0;
    expect(testInvestment.calculateReturnPercentage()).toBe(0);
  });

  test('should calculate total portfolio value with multiple investments', async () => {
    // Requirements addressed: Investment Portfolio Tracking
    // Technical Specification/1.2 Scope/Core Features
    
    // Create additional test investments
    const investment1 = await investmentsService.create({
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      quantity: 50,
      costBasis: 300.00,
      currentPrice: 310.00,
      assetClass: 'Stocks',
      currency: 'USD',
      accountId: testEnv.testAccount.id
    }, testEnv.testUser.id);

    const investment2 = await investmentsService.create({
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      quantity: 25,
      costBasis: 2800.00,
      currentPrice: 2850.00,
      assetClass: 'Stocks',
      currency: 'USD',
      accountId: testEnv.testAccount.id
    }, testEnv.testUser.id);

    // Calculate expected total value
    const expectedTotal = 
      investment1.calculateMarketValue() +
      investment2.calculateMarketValue() +
      testInvestment.calculateMarketValue();

    // Get portfolio value from service
    const portfolioValue = await investmentsService.calculatePortfolioValue(testEnv.testUser.id);

    // Verify calculations
    expect(portfolioValue).toBe(Number(expectedTotal.toFixed(2)));
    expect(Number.isFinite(portfolioValue)).toBe(true);
    expect(portfolioValue.toString()).toMatch(/^\d+\.\d{2}$/);

    // Test empty portfolio
    await investmentsService.remove(investment1.id, testEnv.testUser.id);
    await investmentsService.remove(investment2.id, testEnv.testUser.id);
    await investmentsService.remove(testInvestment.id, testEnv.testUser.id);

    const emptyPortfolioValue = await investmentsService.calculatePortfolioValue(testEnv.testUser.id);
    expect(emptyPortfolioValue).toBe(0);
  });

  test('should update investment prices and recalculate values', async () => {
    // Requirements addressed: Investment Portfolio Tracking, Data Security
    // Technical Specification/1.2 Scope/Core Features, 9.2.1 Encryption Standards
    
    // Create test investment
    const investment = await investmentsService.create({
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      quantity: 10,
      costBasis: 800.00,
      currentPrice: 850.00,
      assetClass: 'Stocks',
      currency: 'USD',
      accountId: testEnv.testAccount.id
    }, testEnv.testUser.id);

    // Record initial values
    const initialMarketValue = investment.marketValue;
    const initialUnrealizedGain = investment.unrealizedGain;
    const initialReturnPercentage = investment.returnPercentage;

    // Update prices (simulated market data update)
    await investmentsService.updatePrices(testEnv.testUser.id);

    // Fetch updated investment
    const updatedInvestment = await investmentsService.findOne(investment.id, testEnv.testUser.id);

    // Verify updates
    expect(updatedInvestment.lastPriceUpdateAt).toBeInstanceOf(Date);
    expect(updatedInvestment.marketValue).toBeDefined();
    expect(updatedInvestment.unrealizedGain).toBeDefined();
    expect(updatedInvestment.returnPercentage).toBeDefined();

    // Verify value changes
    expect(updatedInvestment.marketValue).not.toBe(initialMarketValue);
    expect(updatedInvestment.unrealizedGain).not.toBe(initialUnrealizedGain);
    expect(updatedInvestment.returnPercentage).not.toBe(initialReturnPercentage);

    // Clean up
    await investmentsService.remove(investment.id, testEnv.testUser.id);
  });
});