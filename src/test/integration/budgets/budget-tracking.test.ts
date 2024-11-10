// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'; // ^29.0.0
import request from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser, createMockBudget } from '../../utils/mock-data';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test
 * 2. Ensure test database is properly configured with budget tables
 * 3. Set up test API endpoints for budget operations
 * 4. Configure test notification system for alert testing
 * 5. Set up test logging for budget tracking events
 */

describe('Budget Tracking Integration Tests', () => {
  // Global test environment variables
  let testEnv: any;
  let testUser: any;
  let testBudget: any;

  /**
   * Setup test environment before all tests
   * Requirements addressed:
   * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
   */
  beforeAll(async () => {
    // Initialize test environment
    testEnv = await setupTestEnvironment();

    // Create test user
    const mockUser = await createMockUser();
    testUser = mockUser;

    // Create initial test budget
    const mockBudget = await createMockBudget(testUser.id, {
      name: 'Test Monthly Budget',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
    });
    testBudget = mockBudget;
  });

  /**
   * Cleanup test environment after all tests
   * Requirements addressed:
   * - Test Data Management (Technical Specification/8. System Design/Testing Standards)
   */
  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  /**
   * Test budget creation and initial setup
   * Requirements addressed:
   * - Budget Creation and Monitoring (Technical Specification/1.2 Scope/Core Features)
   */
  test('should create new budget with correct initial properties', async () => {
    const newBudget = await createMockBudget(testUser.id, {
      name: 'New Test Budget',
      totalAllocated: 5000
    });

    const response = await request(testEnv.api)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send(newBudget);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      userId: testUser.id,
      name: 'New Test Budget',
      totalAllocated: 5000,
      totalSpent: 0,
      status: 'active',
      categories: expect.arrayContaining([
        expect.objectContaining({
          category: expect.any(String),
          allocated: expect.any(Number),
          spent: 0
        })
      ])
    });
  });

  /**
   * Test budget spending update functionality
   * Requirements addressed:
   * - Budget Tracking (Technical Specification/6.1.1 Core Application Components)
   */
  test('should update budget spending and calculate remaining amounts', async () => {
    // Create test transaction affecting budget
    const transaction = {
      amount: 150,
      category: testBudget.categories[0].category,
      date: new Date(),
      description: 'Test expense'
    };

    // Update budget with new spending
    const response = await request(testEnv.api)
      .post(`/api/budgets/${testBudget.id}/transactions`)
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send(transaction);

    expect(response.status).toBe(200);

    // Verify budget updates
    const updatedBudget = await request(testEnv.api)
      .get(`/api/budgets/${testBudget.id}`)
      .set('Authorization', `Bearer ${testEnv.auth.token}`);

    expect(updatedBudget.body).toMatchObject({
      id: testBudget.id,
      totalSpent: expect.any(Number),
      categories: expect.arrayContaining([
        expect.objectContaining({
          category: transaction.category,
          spent: expect.any(Number)
        })
      ])
    });

    // Verify spending history
    const history = await request(testEnv.api)
      .get(`/api/budgets/${testBudget.id}/history`)
      .set('Authorization', `Bearer ${testEnv.auth.token}`);

    expect(history.body).toContainEqual(
      expect.objectContaining({
        amount: transaction.amount,
        category: transaction.category,
        date: expect.any(String)
      })
    );
  });

  /**
   * Test budget alert generation
   * Requirements addressed:
   * - Real-time Notifications (Technical Specification/1.1 System Overview)
   */
  test('should generate alerts when spending exceeds thresholds', async () => {
    // Update spending to trigger alert
    const category = testBudget.categories[0];
    const transaction = {
      amount: category.allocated * 0.9, // 90% of allocated amount
      category: category.category,
      date: new Date(),
      description: 'Large expense'
    };

    await request(testEnv.api)
      .post(`/api/budgets/${testBudget.id}/transactions`)
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send(transaction);

    // Verify alert generation
    const alerts = await request(testEnv.api)
      .get(`/api/budgets/${testBudget.id}/alerts`)
      .set('Authorization', `Bearer ${testEnv.auth.token}`);

    expect(alerts.status).toBe(200);
    expect(alerts.body).toContainEqual(
      expect.objectContaining({
        type: 'THRESHOLD_WARNING',
        category: category.category,
        threshold: 90,
        currentSpending: expect.any(Number),
        allocated: category.allocated,
        status: 'ACTIVE',
        createdAt: expect.any(String)
      })
    );

    // Verify alert delivery
    const notifications = await request(testEnv.api)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${testEnv.auth.token}`);

    expect(notifications.body).toContainEqual(
      expect.objectContaining({
        type: 'BUDGET_ALERT',
        budgetId: testBudget.id,
        category: category.category,
        message: expect.stringContaining('threshold')
      })
    );
  });

  /**
   * Test continuous budget status monitoring
   * Requirements addressed:
   * - Budget Creation and Monitoring (Technical Specification/1.2 Scope/Core Features)
   */
  test('should track budget status changes over time', async () => {
    // Create multiple transactions over time
    const transactions = [
      { amount: 100, date: new Date(), category: testBudget.categories[0].category },
      { amount: 200, date: new Date(), category: testBudget.categories[1].category },
      { amount: 300, date: new Date(), category: testBudget.categories[2].category }
    ];

    for (const transaction of transactions) {
      await request(testEnv.api)
        .post(`/api/budgets/${testBudget.id}/transactions`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(transaction);
    }

    // Verify status tracking
    const statusHistory = await request(testEnv.api)
      .get(`/api/budgets/${testBudget.id}/status-history`)
      .set('Authorization', `Bearer ${testEnv.auth.token}`);

    expect(statusHistory.status).toBe(200);
    expect(statusHistory.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          date: expect.any(String),
          status: expect.stringMatching(/^(on_track|warning|over_budget)$/),
          totalSpent: expect.any(Number),
          totalAllocated: expect.any(Number),
          spendingRate: expect.any(Number)
        })
      ])
    );

    // Verify period-based status reset
    const nextPeriodBudget = await request(testEnv.api)
      .post('/api/budgets/roll-over')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send({
        sourceBudgetId: testBudget.id,
        startDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
      });

    expect(nextPeriodBudget.status).toBe(201);
    expect(nextPeriodBudget.body).toMatchObject({
      totalSpent: 0,
      categories: expect.arrayContaining([
        expect.objectContaining({
          spent: 0,
          allocated: expect.any(Number)
        })
      ])
    });
  });
});