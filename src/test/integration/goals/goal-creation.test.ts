// @jest/globals v29.0.0
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser } from '../../utils/mock-data';
import { Goal } from '../../../backend/src/modules/goals/entities/goal.entity';

/**
 * Human Tasks:
 * 1. Ensure test database is configured with proper permissions for goal creation
 * 2. Configure test environment variables in .env.test for API endpoints
 * 3. Verify test user has appropriate permissions for goal operations
 * 4. Set up test data cleanup procedures in CI/CD pipeline
 */

describe('Goal Creation Integration Tests', () => {
  let testEnv: {
    db: any;
    api: any;
    auth: { token: string };
  };
  let testUser: any;

  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test environment with database and API client
    testEnv = await setupTestEnvironment();
    
    // Create test user
    const mockUserData = await createMockUser();
    testUser = mockUserData;
  });

  // Cleanup test environment after all tests
  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  /**
   * Test successful creation of a valid financial goal
   * Requirements addressed:
   * - Financial Goal Management (Technical Specification/1.2 Scope/Core Features)
   * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
   */
  it('should successfully create a valid financial goal', async () => {
    // Prepare valid goal data
    const validGoalData = {
      name: 'Emergency Fund',
      description: 'Build emergency savings',
      targetAmount: 10000,
      currency: 'USD',
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      status: 'active'
    };

    // Send authenticated POST request to create goal
    const response = await testEnv.api.post('/api/goals', validGoalData, {
      headers: { Authorization: `Bearer ${testEnv.auth.token}` }
    });

    // Verify 201 Created response
    expect(response.status).toBe(201);
    
    // Validate created goal data
    const createdGoal = response.data as Goal;
    expect(createdGoal.id).toBeDefined();
    expect(createdGoal.name).toBe(validGoalData.name);
    expect(createdGoal.targetAmount).toBe(validGoalData.targetAmount);
    expect(createdGoal.currency).toBe(validGoalData.currency);
    expect(createdGoal.status).toBe('active');
    expect(createdGoal.currentAmount).toBe(0);
    expect(createdGoal.userId).toBe(testUser.id);

    // Verify goal persistence in database
    const persistedGoal = await testEnv.db
      .getRepository(Goal)
      .findOne({ where: { id: createdGoal.id } });
    
    expect(persistedGoal).toBeDefined();
    expect(persistedGoal?.name).toBe(validGoalData.name);
    expect(persistedGoal?.targetAmount).toBe(validGoalData.targetAmount);
  });

  /**
   * Test validation handling for invalid goal data
   * Requirements addressed:
   * - Financial Goal Management (Technical Specification/1.2 Scope/Core Features)
   * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
   */
  it('should handle invalid goal creation attempts', async () => {
    // Test missing required fields
    const invalidGoalData = {
      description: 'Invalid goal without name and target'
    };

    const response = await testEnv.api.post('/api/goals', invalidGoalData, {
      headers: { Authorization: `Bearer ${testEnv.auth.token}` }
    });

    // Verify 400 Bad Request response
    expect(response.status).toBe(400);
    expect(response.data.errors).toBeDefined();
    expect(response.data.errors).toContain('name is required');
    expect(response.data.errors).toContain('targetAmount is required');

    // Test invalid target amount
    const negativeAmountGoal = {
      name: 'Invalid Goal',
      targetAmount: -1000,
      targetDate: new Date(Date.now() + 86400000) // tomorrow
    };

    const negativeResponse = await testEnv.api.post('/api/goals', negativeAmountGoal, {
      headers: { Authorization: `Bearer ${testEnv.auth.token}` }
    });

    expect(negativeResponse.status).toBe(400);
    expect(negativeResponse.data.errors).toContain('targetAmount must be positive');

    // Test invalid target date (past date)
    const pastDateGoal = {
      name: 'Past Goal',
      targetAmount: 1000,
      targetDate: new Date(Date.now() - 86400000) // yesterday
    };

    const pastDateResponse = await testEnv.api.post('/api/goals', pastDateGoal, {
      headers: { Authorization: `Bearer ${testEnv.auth.token}` }
    });

    expect(pastDateResponse.status).toBe(400);
    expect(pastDateResponse.data.errors).toContain('targetDate must be in the future');
  });

  /**
   * Test handling of duplicate goal creation attempts
   * Requirements addressed:
   * - Financial Goal Management (Technical Specification/1.2 Scope/Core Features)
   * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
   */
  it('should handle duplicate goal creation attempts', async () => {
    // Create initial goal
    const initialGoal = {
      name: 'Vacation Fund',
      targetAmount: 5000,
      currency: 'USD',
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
      status: 'active'
    };

    // Create first goal
    const firstResponse = await testEnv.api.post('/api/goals', initialGoal, {
      headers: { Authorization: `Bearer ${testEnv.auth.token}` }
    });
    expect(firstResponse.status).toBe(201);

    // Attempt to create duplicate goal with same name
    const duplicateResponse = await testEnv.api.post('/api/goals', initialGoal, {
      headers: { Authorization: `Bearer ${testEnv.auth.token}` }
    });

    // Verify 409 Conflict response
    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.data.message).toContain('Goal with this name already exists');

    // Verify only one goal exists in database
    const goals = await testEnv.db
      .getRepository(Goal)
      .find({ where: { name: initialGoal.name, userId: testUser.id } });
    
    expect(goals.length).toBe(1);
    expect(goals[0].targetAmount).toBe(initialGoal.targetAmount);
  });

  /**
   * Test goal creation with maximum allowed values
   * Requirements addressed:
   * - Financial Goal Management (Technical Specification/1.2 Scope/Core Features)
   * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
   */
  it('should handle goal creation with maximum allowed values', async () => {
    const maxValueGoal = {
      name: 'A'.repeat(100), // Maximum name length
      description: 'B'.repeat(500), // Maximum description length
      targetAmount: 999999999.99, // Maximum amount
      currency: 'USD',
      targetDate: new Date('2100-12-31'), // Far future date
      status: 'active'
    };

    const response = await testEnv.api.post('/api/goals', maxValueGoal, {
      headers: { Authorization: `Bearer ${testEnv.auth.token}` }
    });

    expect(response.status).toBe(201);
    expect(response.data.name).toBe(maxValueGoal.name);
    expect(response.data.targetAmount).toBe(maxValueGoal.targetAmount);
  });

  /**
   * Test goal creation with metadata
   * Requirements addressed:
   * - Financial Goal Management (Technical Specification/1.2 Scope/Core Features)
   * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
   */
  it('should handle goal creation with metadata', async () => {
    const goalWithMetadata = {
      name: 'House Down Payment',
      targetAmount: 50000,
      currency: 'USD',
      targetDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 years from now
      status: 'active',
      metadata: {
        category: 'Housing',
        priority: 'High',
        monthlyContribution: 2000,
        notes: 'Save for 20% down payment'
      }
    };

    const response = await testEnv.api.post('/api/goals', goalWithMetadata, {
      headers: { Authorization: `Bearer ${testEnv.auth.token}` }
    });

    expect(response.status).toBe(201);
    expect(response.data.metadata).toEqual(goalWithMetadata.metadata);
  });
});