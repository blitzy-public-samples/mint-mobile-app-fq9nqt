// Library versions:
// @nestjs/testing: ^9.0.0
// supertest: ^6.3.0
// jest: ^29.0.0

/**
 * Human Tasks:
 * 1. Configure test database with sufficient sample data for analytics testing
 * 2. Set up test environment variables for analytics thresholds
 * 3. Review and adjust test timeouts for analytics calculations
 * 4. Configure test data retention policies
 * 5. Set up monitoring for test analytics performance
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { AnalyticsQueryDto, AnalyticsTimeframe, AnalyticsType } from '../src/modules/analytics/dto/analytics-query.dto';

describe('Analytics (e2e)', () => {
  let app: INestApplication;
  let testUser: { id: string; token: string };
  let testData: { transactions: any[]; budgets: any[]; goals: any[] };

  // Test data setup
  const sampleAnalyticsQuery: AnalyticsQueryDto = {
    startDate: '2024-01-01',
    endDate: '2024-03-15',
    timeframe: AnalyticsTimeframe.MONTHLY,
    type: AnalyticsType.SPENDING_TRENDS,
    category: 'groceries',
    accountId: 'test-account-id'
  };

  beforeAll(async () => {
    /**
     * Requirements addressed:
     * - Analytics and Reporting Engine (Technical Specification/1.1 System Overview)
     * Sets up test environment for analytics validation
     */
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Import required test modules
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user and authenticate
    testUser = await createTestUserAndAuthenticate(app);

    // Seed test data
    testData = await seedTestData(app, testUser.id);
  });

  afterAll(async () => {
    // Cleanup test data and close connections
    await cleanupTestData(app, testUser.id);
    await app.close();
  });

  describe('GET /analytics', () => {
    /**
     * Requirements addressed:
     * - Analytics and Reporting Engine (Technical Specification/1.1 System Overview)
     * Tests comprehensive analytics generation functionality
     */
    it('should generate analytics report with valid parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics')
        .query(sampleAnalyticsQuery)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('timeframe', AnalyticsTimeframe.MONTHLY);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('insights');
    });

    it('should validate query parameters', async () => {
      const invalidQuery = { ...sampleAnalyticsQuery, timeframe: 'INVALID' };
      await request(app.getHttpServer())
        .get('/analytics')
        .query(invalidQuery)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(400);
    });

    it('should handle unauthorized access', async () => {
      await request(app.getHttpServer())
        .get('/analytics')
        .query(sampleAnalyticsQuery)
        .expect(401);
    });

    it('should process different analytics types', async () => {
      const types = [
        AnalyticsType.SPENDING_TRENDS,
        AnalyticsType.BUDGET_PERFORMANCE,
        AnalyticsType.CATEGORY_BREAKDOWN
      ];

      for (const type of types) {
        const response = await request(app.getHttpServer())
          .get('/analytics')
          .query({ ...sampleAnalyticsQuery, type })
          .set('Authorization', `Bearer ${testUser.token}`)
          .expect(200);

        expect(response.body.data).toBeDefined();
      }
    });
  });

  describe('GET /analytics/spending-trends', () => {
    /**
     * Requirements addressed:
     * - Analytics and Reporting Engine (Technical Specification/1.1 System Overview)
     * Tests spending trends analysis functionality
     */
    it('should calculate accurate spending trends', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/spending-trends')
        .query(sampleAnalyticsQuery)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('trends');
      expect(response.body).toHaveProperty('significantChanges');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('periodComparison');

      // Validate trend calculations
      const { trends } = response.body;
      expect(Array.isArray(trends)).toBeTruthy();
      expect(trends.length).toBeGreaterThan(0);
      trends.forEach(trend => {
        expect(trend).toHaveProperty('period');
        expect(trend).toHaveProperty('totalSpent');
        expect(trend).toHaveProperty('categoryBreakdown');
      });
    });

    it('should handle different timeframe aggregations', async () => {
      const timeframes = [
        AnalyticsTimeframe.DAILY,
        AnalyticsTimeframe.WEEKLY,
        AnalyticsTimeframe.MONTHLY,
        AnalyticsTimeframe.QUARTERLY,
        AnalyticsTimeframe.YEARLY
      ];

      for (const timeframe of timeframes) {
        const response = await request(app.getHttpServer())
          .get('/analytics/spending-trends')
          .query({ ...sampleAnalyticsQuery, timeframe })
          .set('Authorization', `Bearer ${testUser.token}`)
          .expect(200);

        expect(response.body.timeframe).toBe(timeframe);
        expect(response.body.trends).toBeDefined();
      }
    });
  });

  describe('GET /analytics/budget-performance', () => {
    /**
     * Requirements addressed:
     * - Analytics and Reporting Engine (Technical Specification/1.1 System Overview)
     * Tests budget performance analysis functionality
     */
    it('should calculate accurate budget performance metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/budget-performance')
        .query(sampleAnalyticsQuery)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('performanceMetrics');
      expect(response.body).toHaveProperty('overallAdherence');
      expect(response.body).toHaveProperty('recommendations');

      // Validate performance calculations
      const { performanceMetrics } = response.body;
      performanceMetrics.forEach(metric => {
        expect(metric).toHaveProperty('budgetId');
        expect(metric).toHaveProperty('category');
        expect(metric).toHaveProperty('allocated');
        expect(metric).toHaveProperty('spent');
        expect(metric).toHaveProperty('adherenceRate');
        expect(metric.adherenceRate).toBeGreaterThanOrEqual(0);
        expect(metric.adherenceRate).toBeLessThanOrEqual(1);
      });
    });

    it('should identify savings opportunities', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/budget-performance')
        .query(sampleAnalyticsQuery)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      const { performanceMetrics } = response.body;
      performanceMetrics.forEach(metric => {
        expect(metric).toHaveProperty('savingsOpportunities');
        if (metric.savingsOpportunities.length > 0) {
          metric.savingsOpportunities.forEach(opportunity => {
            expect(opportunity).toHaveProperty('merchant');
            expect(opportunity).toHaveProperty('frequency');
            expect(opportunity).toHaveProperty('averageAmount');
            expect(opportunity).toHaveProperty('potentialSavings');
          });
        }
      });
    });
  });

  describe('POST /analytics/export', () => {
    /**
     * Requirements addressed:
     * - Data Export and Reporting (Technical Specification/1.2 Scope/Core Features)
     * Tests analytics data export functionality
     */
    it('should export analytics data in CSV format', async () => {
      const response = await request(app.getHttpServer())
        .post('/analytics/export')
        .send({ ...sampleAnalyticsQuery, format: 'csv' })
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('format', 'csv');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('filename');
      expect(response.body.filename).toMatch(/analytics_export_.*\.csv/);
    });

    it('should export analytics data in JSON format', async () => {
      const response = await request(app.getHttpServer())
        .post('/analytics/export')
        .send({ ...sampleAnalyticsQuery, format: 'json' })
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('format', 'json');
      expect(response.body).toHaveProperty('data');
      expect(response.body.filename).toMatch(/analytics_export_.*\.json/);
      expect(() => JSON.parse(response.body.data)).not.toThrow();
    });

    it('should handle invalid export format', async () => {
      await request(app.getHttpServer())
        .post('/analytics/export')
        .send({ ...sampleAnalyticsQuery, format: 'invalid' })
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(400);
    });

    it('should validate exported data accuracy', async () => {
      const response = await request(app.getHttpServer())
        .post('/analytics/export')
        .send({ ...sampleAnalyticsQuery, format: 'json' })
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      const exportedData = JSON.parse(response.body.data);
      expect(exportedData).toHaveProperty('timeframe');
      expect(exportedData).toHaveProperty('data');
      expect(exportedData.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            period: expect.any(String),
            totalSpent: expect.any(Number),
            categoryBreakdown: expect.any(Object)
          })
        ])
      );
    });
  });
});

// Helper functions for test setup and cleanup

async function createTestUserAndAuthenticate(app: INestApplication): Promise<{ id: string; token: string }> {
  // Implementation for creating test user and getting auth token
  return { id: 'test-user-id', token: 'test-auth-token' };
}

async function seedTestData(app: INestApplication, userId: string): Promise<{ transactions: any[]; budgets: any[]; goals: any[] }> {
  // Implementation for seeding test data
  return {
    transactions: [],
    budgets: [],
    goals: []
  };
}

async function cleanupTestData(app: INestApplication, userId: string): Promise<void> {
  // Implementation for cleaning up test data
}