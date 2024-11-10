// Third-party imports with versions
import { describe, beforeAll, afterAll, test, expect } from '@jest/globals'; // ^29.0.0
import request from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser, createMockBudget } from '../../utils/mock-data';
import { Budget } from '../../../backend/src/modules/budgets/entities/budget.entity';
import { Notification } from '../../../backend/src/modules/notifications/entities/notification.entity';

/**
 * Human Tasks Required:
 * 1. Configure test database with proper permissions for budget and notification tables
 * 2. Set up test environment variables in .env.test for notification service
 * 3. Configure test email/push notification providers if needed
 * 4. Ensure proper test data cleanup after test runs
 */

describe('Budget Alerts Integration Tests', () => {
  let testEnv: {
    db: any;
    api: any;
    auth: { token: string };
  };
  let testUser: any;
  let testBudget: Budget;

  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test environment with database and API client
    testEnv = await setupTestEnvironment();

    // Create test user
    const mockUser = await createMockUser();
    testUser = mockUser;

    // Create test budget with warning threshold
    const mockBudget = await createMockBudget(testUser.id, {
      amount: 1000,
      spent: 0,
      category: 'Groceries',
      period: 'monthly',
      isActive: true
    });
    testBudget = mockBudget;
  });

  // Cleanup test environment after all tests
  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  /**
   * Tests budget warning alert generation when spending reaches warning threshold
   * Requirements addressed:
   * - Budget Creation and Monitoring (Technical Specification/1.2 Scope/Core Features)
   * - Real-time notifications and alerts (Technical Specification/1.1 System Overview)
   */
  test('should generate warning alert when budget reaches warning threshold', async () => {
    // Add transaction to reach 75% of budget (warning threshold)
    const warningTransaction = {
      amount: 750,
      category: 'Groceries',
      description: 'Monthly groceries',
      date: new Date()
    };

    // Submit transaction
    const transactionResponse = await testEnv.api
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send(warningTransaction);

    expect(transactionResponse.status).toBe(201);

    // Wait for notification to be generated
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify warning notification was created
    const notificationsResponse = await testEnv.api
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .query({ type: 'BUDGET_WARNING' });

    expect(notificationsResponse.status).toBe(200);
    const notifications = notificationsResponse.body;

    // Verify notification content
    expect(notifications).toHaveLength(1);
    const warningNotification = notifications[0] as Notification;
    expect(warningNotification.type).toBe('BUDGET_WARNING');
    expect(warningNotification.priority).toBe('MEDIUM');
    expect(warningNotification.data).toMatchObject({
      budgetId: testBudget.id,
      category: 'Groceries',
      threshold: 75,
      spent: 750,
      amount: 1000
    });
  });

  /**
   * Tests budget exceeded alert generation when spending exceeds budget
   * Requirements addressed:
   * - Budget Creation and Monitoring (Technical Specification/1.2 Scope/Core Features)
   * - Budget Data Structure (Technical Specification/5.2.3 Service Layer Architecture)
   */
  test('should generate exceeded alert when budget is exceeded', async () => {
    // Add transaction to exceed budget
    const exceedTransaction = {
      amount: 300,
      category: 'Groceries',
      description: 'Additional groceries',
      date: new Date()
    };

    // Submit transaction
    const transactionResponse = await testEnv.api
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send(exceedTransaction);

    expect(transactionResponse.status).toBe(201);

    // Wait for notification to be generated
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify exceeded notification was created
    const notificationsResponse = await testEnv.api
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .query({ type: 'BUDGET_EXCEEDED' });

    expect(notificationsResponse.status).toBe(200);
    const notifications = notificationsResponse.body;

    // Verify notification content
    expect(notifications).toHaveLength(1);
    const exceededNotification = notifications[0] as Notification;
    expect(exceededNotification.type).toBe('BUDGET_EXCEEDED');
    expect(exceededNotification.priority).toBe('HIGH');
    expect(exceededNotification.data).toMatchObject({
      budgetId: testBudget.id,
      category: 'Groceries',
      threshold: 100,
      spent: 1050,
      amount: 1000
    });
  });

  /**
   * Tests handling of multiple budget alerts for different thresholds
   * Requirements addressed:
   * - Real-time notifications and alerts (Technical Specification/1.1 System Overview)
   * - Budget Data Structure (Technical Specification/5.2.3 Service Layer Architecture)
   */
  test('should handle multiple budget alerts for different thresholds', async () => {
    // Create new test budget with multiple thresholds
    const newBudget = await createMockBudget(testUser.id, {
      amount: 2000,
      spent: 0,
      category: 'Shopping',
      period: 'monthly',
      isActive: true
    });

    // Add transactions to trigger multiple thresholds
    const transactions = [
      {
        amount: 1000, // 50% - No alert
        category: 'Shopping',
        description: 'First shopping trip'
      },
      {
        amount: 500, // 75% - Warning alert
        category: 'Shopping',
        description: 'Second shopping trip'
      },
      {
        amount: 600, // 105% - Exceeded alert
        category: 'Shopping',
        description: 'Third shopping trip'
      }
    ];

    // Submit transactions sequentially
    for (const transaction of transactions) {
      const response = await testEnv.api
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(transaction);

      expect(response.status).toBe(201);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Verify all notifications were created
    const notificationsResponse = await testEnv.api
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .query({ 
        budgetId: newBudget.id,
        sort: 'createdAt:asc'
      });

    expect(notificationsResponse.status).toBe(200);
    const notifications = notificationsResponse.body;

    // Verify notification sequence and content
    expect(notifications).toHaveLength(2); // Warning and Exceeded alerts

    // Verify warning notification
    const warningNotification = notifications[0] as Notification;
    expect(warningNotification.type).toBe('BUDGET_WARNING');
    expect(warningNotification.priority).toBe('MEDIUM');
    expect(warningNotification.data.spent).toBe(1500);

    // Verify exceeded notification
    const exceededNotification = notifications[1] as Notification;
    expect(exceededNotification.type).toBe('BUDGET_EXCEEDED');
    expect(exceededNotification.priority).toBe('HIGH');
    expect(exceededNotification.data.spent).toBe(2100);
  });
});