// Third-party imports with versions
import { describe, beforeAll, afterAll, test, expect } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../test/utils/test-helpers';
import { generateTestToken } from '../../test/utils/auth-helper';
import { initTestDatabase, cleanupTestDatabase } from '../../test/utils/db-helper';
import { createTestUser } from '../../test/utils/test-helpers';

/**
 * Human Tasks Required:
 * 1. Configure test database credentials in .env.test
 * 2. Ensure test database is running and accessible
 * 3. Set up test API server with proper configuration
 * 4. Configure test user permissions for budget operations
 * 5. Set up WebSocket server for budget alert testing
 */

describe('Budget Management E2E Tests', () => {
  let testEnv: any;
  let request: supertest.SuperTest<supertest.Test>;
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  const TEST_TIMEOUT = 30000;

  beforeAll(async () => {
    // Initialize test environment
    testEnv = await setupTestEnvironment();
    
    // Set up test database
    await initTestDatabase({
      host: process.env.TEST_DB_HOST,
      port: Number(process.env.TEST_DB_PORT),
      database: process.env.TEST_DB_NAME,
      username: process.env.TEST_DB_USER,
      password: process.env.TEST_DB_PASSWORD
    });

    // Create test user and generate auth token
    const { user } = await createTestUser();
    const token = generateTestToken({
      sub: user.id,
      email: user.email,
      roles: ['user']
    });

    // Initialize supertest instance
    request = supertest(API_BASE_URL);
    testEnv.token = token;
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Clean up test database
    await cleanupTestDatabase(testEnv.db);
    
    // Clean up test environment
    await cleanupTestEnvironment(testEnv);
  });

  /**
   * Test budget creation functionality
   * Requirements addressed:
   * - Budget Creation and Monitoring (Technical Specification/1.2 Scope/Core Features)
   */
  test('should create a new budget with categories and limits', async () => {
    const budgetData = {
      name: 'Monthly Expenses',
      amount: 2000.00,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      categories: ['groceries', 'utilities', 'entertainment'],
      limits: {
        groceries: 800,
        utilities: 400,
        entertainment: 800
      },
      currency: 'USD',
      notifications: {
        enabled: true,
        threshold: 80 // Percentage
      }
    };

    const response = await request
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${testEnv.token}`)
      .send(budgetData)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      userId: expect.any(String),
      name: budgetData.name,
      amount: budgetData.amount,
      startDate: expect.any(String),
      endDate: expect.any(String),
      categories: expect.arrayContaining(budgetData.categories),
      limits: budgetData.limits,
      currency: budgetData.currency,
      notifications: budgetData.notifications,
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });

    // Verify budget creation in database
    const dbBudget = await testEnv.db.query(
      'SELECT * FROM budgets WHERE id = $1',
      [response.body.id]
    );
    expect(dbBudget[0]).toBeTruthy();
  });

  /**
   * Test budget update functionality
   * Requirements addressed:
   * - Budget Tracking (Technical Specification/6.1.1 Core Application Components)
   */
  test('should update existing budget with new limits', async () => {
    // First create a budget
    const initialBudget = {
      name: 'Test Budget',
      amount: 1000.00,
      categories: ['food', 'transport'],
      limits: {
        food: 600,
        transport: 400
      }
    };

    const createResponse = await request
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${testEnv.token}`)
      .send(initialBudget)
      .expect(201);

    const budgetId = createResponse.body.id;

    // Update the budget
    const updateData = {
      amount: 1500.00,
      limits: {
        food: 800,
        transport: 700
      }
    };

    const updateResponse = await request
      .put(`/api/v1/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${testEnv.token}`)
      .send(updateData)
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      id: budgetId,
      amount: updateData.amount,
      limits: updateData.limits
    });

    // Verify update in database
    const dbBudget = await testEnv.db.query(
      'SELECT * FROM budgets WHERE id = $1',
      [budgetId]
    );
    expect(dbBudget[0].amount).toBe(updateData.amount);
  });

  /**
   * Test budget deletion functionality
   * Requirements addressed:
   * - Budget Creation and Monitoring (Technical Specification/1.2 Scope/Core Features)
   */
  test('should delete an existing budget', async () => {
    // Create a budget for deletion
    const budgetData = {
      name: 'Budget to Delete',
      amount: 500.00,
      categories: ['misc'],
      limits: { misc: 500 }
    };

    const createResponse = await request
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${testEnv.token}`)
      .send(budgetData)
      .expect(201);

    const budgetId = createResponse.body.id;

    // Delete the budget
    await request
      .delete(`/api/v1/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${testEnv.token}`)
      .expect(204);

    // Verify deletion in database
    const dbBudget = await testEnv.db.query(
      'SELECT * FROM budgets WHERE id = $1',
      [budgetId]
    );
    expect(dbBudget).toHaveLength(0);
  });

  /**
   * Test budget retrieval functionality
   * Requirements addressed:
   * - Budget Tracking (Technical Specification/6.1.1 Core Application Components)
   */
  test('should retrieve budgets with filtering and pagination', async () => {
    // Create multiple test budgets
    const budgets = [
      { name: 'Budget 1', amount: 1000, categories: ['cat1'] },
      { name: 'Budget 2', amount: 2000, categories: ['cat2'] },
      { name: 'Budget 3', amount: 3000, categories: ['cat3'] }
    ];

    for (const budget of budgets) {
      await request
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${testEnv.token}`)
        .send(budget);
    }

    // Test pagination and filtering
    const response = await request
      .get('/api/v1/budgets')
      .set('Authorization', `Bearer ${testEnv.token}`)
      .query({
        page: 1,
        limit: 2,
        minAmount: 1500
      })
      .expect(200);

    expect(response.body).toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({ amount: expect.any(Number) })
      ]),
      meta: {
        page: 1,
        limit: 2,
        totalItems: expect.any(Number),
        totalPages: expect.any(Number)
      }
    });

    // Verify amounts are filtered correctly
    response.body.items.forEach((budget: any) => {
      expect(budget.amount).toBeGreaterThanOrEqual(1500);
    });
  });

  /**
   * Test budget alert functionality
   * Requirements addressed:
   * - Real-time Notifications (Technical Specification/1.1 System Overview)
   */
  test('should generate alerts when budget threshold is breached', async () => {
    // Create a budget with alerts enabled
    const budgetData = {
      name: 'Alert Test Budget',
      amount: 1000.00,
      categories: ['test'],
      limits: { test: 1000 },
      notifications: {
        enabled: true,
        threshold: 90
      }
    };

    const createResponse = await request
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${testEnv.token}`)
      .send(budgetData)
      .expect(201);

    const budgetId = createResponse.body.id;

    // Simulate transaction that triggers alert
    const transactionData = {
      amount: 950.00,
      category: 'test',
      budgetId: budgetId
    };

    await request
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${testEnv.token}`)
      .send(transactionData)
      .expect(201);

    // Verify alert generation
    const alerts = await request
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${testEnv.token}`)
      .query({ type: 'BUDGET_THRESHOLD_BREACH' })
      .expect(200);

    expect(alerts.body.items).toContainEqual(
      expect.objectContaining({
        type: 'BUDGET_THRESHOLD_BREACH',
        budgetId: budgetId,
        message: expect.stringContaining('threshold')
      })
    );
  });
});