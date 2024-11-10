// Third-party imports with versions
import { jest } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser } from '../../utils/mock-data';
import { InvestmentsService } from '../../../backend/src/modules/investments/investments.service';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test for investment data
 * 2. Set up mock market data service for price updates
 * 3. Configure test database with investment schema and permissions
 * 4. Set up test API endpoints for investment operations
 * 5. Configure secure test environment for sensitive investment data
 */

describe('Investment Portfolio Synchronization', () => {
  let testEnv: any;
  let investmentsService: InvestmentsService;
  let testUser: any;

  // Setup test environment before all tests
  beforeAll(async () => {
    // Requirements addressed: Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
    testEnv = await setupTestEnvironment({
      modules: ['investments'],
      mockServices: ['marketData']
    });
    
    // Create test user
    testUser = await createMockUser({
      preferences: {
        investmentNotifications: true,
        priceAlerts: true
      }
    });

    // Initialize investments service
    investmentsService = new InvestmentsService(testEnv.db.getRepository('Investment'));
  });

  // Cleanup test environment after all tests
  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  // Reset test state before each test
  beforeEach(async () => {
    // Clear test data
    await testEnv.db.getRepository('Investment').clear();
    
    // Reset mock market data service
    jest.clearAllMocks();
  });

  describe('Portfolio Synchronization', () => {
    it('should synchronize investment portfolio with market data updates', async () => {
      // Requirements addressed: Real-time Data Synchronization (Technical Specification/1.1 System Overview)
      
      // Create test investment portfolio
      const testInvestments = [
        {
          symbol: 'AAPL',
          shares: 100,
          costBasis: 150.00,
          currentPrice: 160.00
        },
        {
          symbol: 'GOOGL',
          shares: 50,
          costBasis: 2500.00,
          currentPrice: 2600.00
        }
      ];

      // Add investments to portfolio
      for (const inv of testInvestments) {
        await investmentsService.create({
          userId: testUser.id,
          symbol: inv.symbol,
          shares: inv.shares,
          costBasis: inv.costBasis,
          currentPrice: inv.currentPrice
        }, testUser.id);
      }

      // Trigger price update sync
      await investmentsService.updatePrices(testUser.id);

      // Verify market data updates
      const updatedInvestments = await investmentsService.findAll(testUser.id);
      expect(updatedInvestments).toHaveLength(2);
      
      for (const investment of updatedInvestments) {
        expect(investment.lastPriceUpdateAt).toBeDefined();
        expect(investment.marketValue).toBeGreaterThan(0);
        expect(investment.unrealizedGain).toBeDefined();
        expect(investment.returnPercentage).toBeDefined();
      }
    });

    it('should calculate correct performance metrics after market updates', async () => {
      // Requirements addressed: Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
      
      // Create test investment with known values
      const testInvestment = await investmentsService.create({
        userId: testUser.id,
        symbol: 'MSFT',
        shares: 200,
        costBasis: 200.00,
        currentPrice: 220.00
      }, testUser.id);

      // Calculate expected values
      const expectedMarketValue = 200 * 220.00;
      const expectedUnrealizedGain = expectedMarketValue - (200 * 200.00);
      const expectedReturnPercentage = (expectedUnrealizedGain / (200 * 200.00)) * 100;

      // Update prices
      await investmentsService.updatePrices(testUser.id);

      // Verify calculations
      const updatedInvestment = await investmentsService.findOne(testInvestment.id, testUser.id);
      expect(updatedInvestment.marketValue).toBeCloseTo(expectedMarketValue, 2);
      expect(updatedInvestment.unrealizedGain).toBeCloseTo(expectedUnrealizedGain, 2);
      expect(updatedInvestment.returnPercentage).toBeCloseTo(expectedReturnPercentage, 2);

      // Verify portfolio total
      const portfolioValue = await investmentsService.calculatePortfolioValue(testUser.id);
      expect(portfolioValue).toBeCloseTo(expectedMarketValue, 2);
    });

    it('should maintain data consistency during multiple sync operations', async () => {
      // Requirements addressed: Data Security (Technical Specification/9.2.1 Encryption Standards)
      
      // Create initial portfolio state
      const initialInvestment = await investmentsService.create({
        userId: testUser.id,
        symbol: 'AMZN',
        shares: 50,
        costBasis: 3000.00,
        currentPrice: 3100.00
      }, testUser.id);

      // Perform multiple price updates
      const priceUpdates = [3150.00, 3200.00, 3175.00];
      
      for (const price of priceUpdates) {
        // Update price
        await investmentsService.update(initialInvestment.id, {
          currentPrice: price
        }, testUser.id);
        
        // Trigger sync
        await investmentsService.updatePrices(testUser.id);

        // Verify data integrity
        const investment = await investmentsService.findOne(initialInvestment.id, testUser.id);
        expect(investment.currentPrice).toBe(price);
        expect(investment.marketValue).toBe(price * investment.shares);
        expect(investment.lastPriceUpdateAt).toBeDefined();
        expect(new Date(investment.lastPriceUpdateAt)).toBeInstanceOf(Date);
      }

      // Verify final state matches expected calculations
      const finalInvestment = await investmentsService.findOne(initialInvestment.id, testUser.id);
      const expectedFinalValue = 50 * priceUpdates[priceUpdates.length - 1];
      expect(finalInvestment.marketValue).toBe(expectedFinalValue);
    });

    it('should handle concurrent portfolio updates safely', async () => {
      // Requirements addressed: Data Security (Technical Specification/9.2.1 Encryption Standards)
      
      // Create test investment
      const investment = await investmentsService.create({
        userId: testUser.id,
        symbol: 'NFLX',
        shares: 75,
        costBasis: 400.00,
        currentPrice: 410.00
      }, testUser.id);

      // Simulate concurrent price updates
      const concurrentUpdates = [
        { price: 415.00 },
        { price: 420.00 },
        { price: 418.00 }
      ];

      // Execute updates concurrently
      await Promise.all(concurrentUpdates.map(update => 
        investmentsService.update(investment.id, {
          currentPrice: update.price
        }, testUser.id)
      ));

      // Verify data consistency
      const updatedInvestment = await investmentsService.findOne(investment.id, testUser.id);
      expect(updatedInvestment.currentPrice).toBeDefined();
      expect(updatedInvestment.marketValue).toBe(updatedInvestment.currentPrice * updatedInvestment.shares);
      expect(updatedInvestment.lastPriceUpdateAt).toBeDefined();
    });

    it('should validate security constraints during portfolio sync', async () => {
      // Requirements addressed: Data Security (Technical Specification/9.2.1 Encryption Standards)
      
      // Create test investment
      const investment = await investmentsService.create({
        userId: testUser.id,
        symbol: 'FB',
        shares: 100,
        costBasis: 300.00,
        currentPrice: 310.00
      }, testUser.id);

      // Attempt unauthorized access
      const unauthorizedUser = await createMockUser();
      
      // Verify security checks
      await expect(
        investmentsService.findOne(investment.id, unauthorizedUser.id)
      ).rejects.toThrow();

      await expect(
        investmentsService.update(investment.id, {
          currentPrice: 320.00
        }, unauthorizedUser.id)
      ).rejects.toThrow();

      // Verify data remains secure
      const secureInvestment = await investmentsService.findOne(investment.id, testUser.id);
      expect(secureInvestment.currentPrice).toBe(310.00);
    });
  });
});