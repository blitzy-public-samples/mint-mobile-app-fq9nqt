// Third-party imports with versions
import { describe, test, beforeAll, afterAll, expect } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser, createMockBudget } from '../../utils/mock-data';
import { AnalyticsService } from '../../../backend/src/modules/analytics/analytics.service';

/**
 * Human Tasks:
 * 1. Configure test database with sufficient test data volume for analytics
 * 2. Set up test environment variables for analytics service configuration
 * 3. Ensure analytics service performance monitoring is configured
 * 4. Review and adjust test thresholds based on production requirements
 */

describe('Budget Analytics Integration Tests', () => {
  // Test environment globals
  let testEnvironment: any;
  let analyticsService: AnalyticsService;
  let testUser: any;
  let testBudgets: any[];

  // Test constants
  const TEST_CATEGORIES = ['Housing', 'Transportation', 'Food & Dining', 'Utilities'];
  const PERFORMANCE_THRESHOLD = 0.8; // 80% budget utilization threshold
  const TREND_SIGNIFICANCE = 0.1; // 10% change for trend significance

  beforeAll(async () => {
    // Initialize test environment with security protocols
    testEnvironment = await setupTestEnvironment();

    // Create test user and analytics service instance
    testUser = await createMockUser();

    // Create test budgets with various spending patterns
    testBudgets = await Promise.all([
      createMockBudget(testUser.id, {
        name: 'Under Budget',
        categories: TEST_CATEGORIES.map(category => ({
          category,
          allocated: 1000,
          spent: 500 // 50% utilization
        }))
      }),
      createMockBudget(testUser.id, {
        name: 'Near Threshold',
        categories: TEST_CATEGORIES.map(category => ({
          category,
          allocated: 1000,
          spent: 850 // 85% utilization
        }))
      }),
      createMockBudget(testUser.id, {
        name: 'Over Budget',
        categories: TEST_CATEGORIES.map(category => ({
          category,
          allocated: 1000,
          spent: 1200 // 120% utilization
        }))
      })
    ]);

    // Initialize analytics service
    analyticsService = testEnvironment.app.get(AnalyticsService);
  });

  afterAll(async () => {
    // Clean up test environment and resources
    await cleanupTestEnvironment(testEnvironment);
  });

  test('should generate budget performance report', async () => {
    // Requirements addressed:
    // - Analytics and Reporting Engine (Technical Specification/1.1 System Overview)
    // - Budget creation and monitoring (Technical Specification/1.2 Scope/Core Features)

    const response = await supertest(testEnvironment.app.getHttpServer())
      .post('/api/analytics/budget-performance')
      .set('Authorization', `Bearer ${testEnvironment.auth.token}`)
      .send({
        userId: testUser.id,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate: new Date(),
        timeframe: 'MONTHLY'
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      timeframe: 'MONTHLY',
      performanceMetrics: expect.any(Array),
      overallAdherence: expect.any(Number),
      recommendations: expect.any(Array)
    });

    // Validate performance metrics for each budget
    response.body.performanceMetrics.forEach((metric: any) => {
      expect(metric).toMatchObject({
        budgetId: expect.any(String),
        category: expect.any(String),
        allocated: expect.any(Number),
        spent: expect.any(Number),
        status: expect.any(String),
        adherenceRate: expect.any(Number)
      });
    });

    // Verify recommendations for over-budget categories
    const overBudgetRecommendations = response.body.recommendations
      .filter((rec: any) => rec.type === 'warning');
    expect(overBudgetRecommendations.length).toBeGreaterThan(0);
  });

  test('should analyze spending trends by category', async () => {
    // Requirements addressed:
    // - Analytics and Reporting Engine (Technical Specification/1.1 System Overview)
    // - Budget creation and monitoring (Technical Specification/1.2 Scope/Core Features)

    const response = await supertest(testEnvironment.app.getHttpServer())
      .post('/api/analytics/spending-trends')
      .set('Authorization', `Bearer ${testEnvironment.auth.token}`)
      .send({
        userId: testUser.id,
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        endDate: new Date(),
        timeframe: 'MONTHLY',
        categories: TEST_CATEGORIES
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      timeframe: 'MONTHLY',
      trends: expect.any(Array),
      significantChanges: expect.any(Array),
      summary: expect.any(String)
    });

    // Validate trend data structure
    response.body.trends.forEach((trend: any) => {
      expect(trend).toMatchObject({
        period: expect.any(String),
        totalSpent: expect.any(Number),
        categoryBreakdown: expect.any(Object),
        transactionCount: expect.any(Number)
      });

      // Verify category breakdown
      TEST_CATEGORIES.forEach(category => {
        expect(trend.categoryBreakdown[category]).toBeDefined();
        expect(typeof trend.categoryBreakdown[category]).toBe('number');
      });
    });

    // Verify significant changes detection
    response.body.significantChanges.forEach((change: any) => {
      expect(Math.abs(change.changePercent) / 100).toBeGreaterThanOrEqual(TREND_SIGNIFICANCE);
      expect(change).toMatchObject({
        period: expect.any(String),
        changePercent: expect.any(Number),
        type: expect.stringMatching(/^(increase|decrease)$/),
        previousAmount: expect.any(Number),
        currentAmount: expect.any(Number)
      });
    });
  });

  test('should calculate budget adherence metrics', async () => {
    // Requirements addressed:
    // - Analytics and Reporting Engine (Technical Specification/1.1 System Overview)
    // - Budget creation and monitoring (Technical Specification/1.2 Scope/Core Features)

    const response = await supertest(testEnvironment.app.getHttpServer())
      .post('/api/analytics/budget-adherence')
      .set('Authorization', `Bearer ${testEnvironment.auth.token}`)
      .send({
        userId: testUser.id,
        budgetIds: testBudgets.map(b => b.id),
        timeframe: 'MONTHLY'
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      overallAdherence: expect.any(Number),
      budgetMetrics: expect.any(Array)
    });

    // Validate adherence metrics for each budget
    response.body.budgetMetrics.forEach((metric: any) => {
      expect(metric).toMatchObject({
        budgetId: expect.any(String),
        name: expect.any(String),
        adherenceRate: expect.any(Number),
        status: expect.stringMatching(/^(under|near|over)$/),
        categories: expect.any(Array)
      });

      // Verify category-level metrics
      metric.categories.forEach((category: any) => {
        expect(category).toMatchObject({
          name: expect.any(String),
          allocated: expect.any(Number),
          spent: expect.any(Number),
          adherenceRate: expect.any(Number)
        });

        // Validate adherence rate calculation
        expect(category.adherenceRate).toBeGreaterThanOrEqual(0);
        expect(category.adherenceRate).toBeLessThanOrEqual(2); // Allow for up to 200% utilization
      });
    });
  });

  test('should identify overspending patterns', async () => {
    // Requirements addressed:
    // - Analytics and Reporting Engine (Technical Specification/1.1 System Overview)
    // - Budget creation and monitoring (Technical Specification/1.2 Scope/Core Features)

    const response = await supertest(testEnvironment.app.getHttpServer())
      .post('/api/analytics/overspending-patterns')
      .set('Authorization', `Bearer ${testEnvironment.auth.token}`)
      .send({
        userId: testUser.id,
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // Last 180 days
        endDate: new Date(),
        threshold: PERFORMANCE_THRESHOLD
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      patterns: expect.any(Array),
      riskCategories: expect.any(Array),
      recommendations: expect.any(Array)
    });

    // Validate overspending patterns
    response.body.patterns.forEach((pattern: any) => {
      expect(pattern).toMatchObject({
        category: expect.any(String),
        frequency: expect.any(Number),
        averageOverspend: expect.any(Number),
        timeframes: expect.any(Array),
        trend: expect.stringMatching(/^(increasing|decreasing|stable)$/)
      });

      // Verify pattern thresholds
      expect(pattern.averageOverspend).toBeGreaterThan(0);
      pattern.timeframes.forEach((timeframe: any) => {
        expect(timeframe.utilizationRate).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLD);
      });
    });

    // Validate risk categories
    response.body.riskCategories.forEach((category: any) => {
      expect(category).toMatchObject({
        name: expect.any(String),
        riskLevel: expect.stringMatching(/^(high|medium|low)$/),
        overspendingFrequency: expect.any(Number),
        recommendedAction: expect.any(String)
      });
    });

    // Verify actionable recommendations
    response.body.recommendations.forEach((recommendation: any) => {
      expect(recommendation).toMatchObject({
        category: expect.any(String),
        type: expect.stringMatching(/^(adjustment|alert|review)$/),
        message: expect.any(String),
        suggestedAction: expect.any(String),
        potentialSavings: expect.any(Number)
      });
    });
  });
});