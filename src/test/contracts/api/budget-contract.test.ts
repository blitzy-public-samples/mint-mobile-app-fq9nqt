// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'; // ^29.0.0

// Internal imports
import { CreateBudgetDto } from '../../../backend/src/modules/budgets/dto/create-budget.dto';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { TestApiClient } from '../../utils/api-client';

/**
 * Human Tasks Required:
 * 1. Ensure test database is configured and accessible
 * 2. Configure test environment variables in .env.test
 * 3. Set up test user credentials and permissions
 * 4. Verify API endpoints are accessible in test environment
 * 5. Configure rate limiting exceptions for test environment
 */

let apiClient: TestApiClient;
let testEnvironment: { db: any; api: TestApiClient; auth: { token: string } };

// Test suite setup
beforeAll(async () => {
  // Requirement: Testing Standards - Initialize test environment
  testEnvironment = await setupTestEnvironment({
    enableLogging: true,
    useTestDatabase: true
  });
  apiClient = testEnvironment.api;
});

// Test suite cleanup
afterAll(async () => {
  // Requirement: Testing Standards - Proper resource cleanup
  await cleanupTestEnvironment(testEnvironment);
});

describe('Budget API Contract Tests', () => {
  // Test budget creation endpoint contract
  test('testBudgetCreation: should create a budget with valid payload', async () => {
    // Requirement: Budget Creation and Monitoring - Validate budget creation contract
    const budgetPayload: CreateBudgetDto = {
      name: 'Monthly Household Budget',
      period: 'monthly',
      totalAmount: 2000.00,
      categories: [
        {
          name: 'Groceries',
          amount: 500.00
        },
        {
          name: 'Utilities',
          amount: 300.00
        }
      ]
    };

    const response = await apiClient.post('/api/v1/budgets', budgetPayload);

    // Requirement: API Security - Validate response structure and data integrity
    expect(response.statusCode).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data).toHaveProperty('name', budgetPayload.name);
    expect(response.data).toHaveProperty('period', budgetPayload.period);
    expect(response.data).toHaveProperty('totalAmount', budgetPayload.totalAmount);
    expect(response.data).toHaveProperty('categories');
    expect(response.data.categories).toHaveLength(budgetPayload.categories.length);
    expect(response.data).toHaveProperty('createdAt');
    expect(new Date(response.data.createdAt)).toBeInstanceOf(Date);
  });

  // Test budget retrieval endpoint contract
  test('testBudgetRetrieval: should retrieve budget with correct format', async () => {
    // Create a test budget first
    const budgetPayload: CreateBudgetDto = {
      name: 'Test Retrieval Budget',
      period: 'monthly',
      totalAmount: 1500.00,
      categories: [
        {
          name: 'Entertainment',
          amount: 200.00
        }
      ]
    };

    const createResponse = await apiClient.post('/api/v1/budgets', budgetPayload);
    const budgetId = createResponse.data.id;

    // Requirement: API Security - Validate retrieval with authentication
    const response = await apiClient.get(`/api/v1/budgets/${budgetId}`);

    // Requirement: Testing Standards - Validate response contract
    expect(response.statusCode).toBe(200);
    expect(response.data).toHaveProperty('id', budgetId);
    expect(response.data).toHaveProperty('name', budgetPayload.name);
    expect(response.data).toHaveProperty('period', budgetPayload.period);
    expect(response.data).toHaveProperty('totalAmount', budgetPayload.totalAmount);
    expect(response.data).toHaveProperty('categories');
    expect(response.data).toHaveProperty('spent');
    expect(response.data).toHaveProperty('remaining');
    expect(response.data).toHaveProperty('updatedAt');
  });

  // Test budget update endpoint contract
  test('testBudgetUpdate: should update budget with valid modifications', async () => {
    // Create a test budget first
    const initialBudget: CreateBudgetDto = {
      name: 'Test Update Budget',
      period: 'monthly',
      totalAmount: 1000.00,
      categories: [
        {
          name: 'Food',
          amount: 300.00
        }
      ]
    };

    const createResponse = await apiClient.post('/api/v1/budgets', initialBudget);
    const budgetId = createResponse.data.id;

    // Update payload
    const updatePayload = {
      name: 'Updated Budget Name',
      totalAmount: 1200.00,
      categories: [
        {
          name: 'Food',
          amount: 400.00
        }
      ]
    };

    // Requirement: Budget Creation and Monitoring - Validate update capabilities
    const response = await apiClient.put(`/api/v1/budgets/${budgetId}`, updatePayload);

    // Requirement: Testing Standards - Validate update contract
    expect(response.statusCode).toBe(200);
    expect(response.data).toHaveProperty('id', budgetId);
    expect(response.data).toHaveProperty('name', updatePayload.name);
    expect(response.data).toHaveProperty('totalAmount', updatePayload.totalAmount);
    expect(response.data.categories[0]).toHaveProperty('amount', updatePayload.categories[0].amount);
    expect(response.data).toHaveProperty('updatedAt');
    expect(new Date(response.data.updatedAt)).toBeInstanceOf(Date);
  });

  // Test budget deletion endpoint contract
  test('testBudgetDeletion: should delete budget and return correct response', async () => {
    // Create a test budget first
    const budgetPayload: CreateBudgetDto = {
      name: 'Test Deletion Budget',
      period: 'monthly',
      totalAmount: 500.00,
      categories: [
        {
          name: 'Miscellaneous',
          amount: 500.00
        }
      ]
    };

    const createResponse = await apiClient.post('/api/v1/budgets', budgetPayload);
    const budgetId = createResponse.data.id;

    // Requirement: API Security - Validate deletion with authentication
    const deleteResponse = await apiClient.delete(`/api/v1/budgets/${budgetId}`);

    // Requirement: Testing Standards - Validate deletion contract
    expect(deleteResponse.statusCode).toBe(204);

    // Verify budget cannot be retrieved after deletion
    try {
      await apiClient.get(`/api/v1/budgets/${budgetId}`);
      fail('Expected 404 error for deleted budget');
    } catch (error: any) {
      expect(error.response.statusCode).toBe(404);
    }
  });

  // Additional contract validation tests
  test('should validate budget creation with invalid payload', async () => {
    // Requirement: API Security - Input validation
    const invalidPayload = {
      name: '', // Invalid: empty name
      period: 'invalid_period', // Invalid: wrong period
      totalAmount: -100, // Invalid: negative amount
      categories: [] // Invalid: empty categories
    };

    try {
      await apiClient.post('/api/v1/budgets', invalidPayload);
      fail('Expected validation error');
    } catch (error: any) {
      expect(error.response.statusCode).toBe(400);
      expect(error.response.data).toHaveProperty('message');
      expect(error.response.data).toHaveProperty('errors');
      expect(Array.isArray(error.response.data.errors)).toBe(true);
    }
  });

  test('should enforce authentication for budget operations', async () => {
    // Requirement: API Security - Authentication validation
    const unauthenticatedClient = new TestApiClient({
      baseURL: process.env.TEST_API_URL
    });

    try {
      await unauthenticatedClient.get('/api/v1/budgets');
      fail('Expected authentication error');
    } catch (error: any) {
      expect(error.response.statusCode).toBe(401);
      expect(error.response.data).toHaveProperty('message');
    }
  });

  test('should handle rate limiting for budget endpoints', async () => {
    // Requirement: API Security - Rate limiting validation
    const requests = Array(100).fill(null).map(() => 
      apiClient.get('/api/v1/budgets')
    );

    try {
      await Promise.all(requests);
      fail('Expected rate limit error');
    } catch (error: any) {
      expect(error.response.statusCode).toBe(429);
      expect(error.response.data).toHaveProperty('message');
      expect(error.response.headers).toHaveProperty('retry-after');
    }
  });
});