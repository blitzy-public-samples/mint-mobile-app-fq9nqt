// Third-party imports with versions
import { describe, it, beforeAll, afterAll, expect } from '@jest/globals'; // ^29.0.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { TestApiClient } from '../../utils/api-client';
import { CreateGoalDto } from '../../../backend/src/modules/goals/dto/create-goal.dto';
import { Goal } from '../../../backend/src/modules/goals/entities/goal.entity';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test
 * 2. Ensure test database is set up with proper permissions
 * 3. Configure test API endpoints and authentication
 * 4. Set up test logging directory with write permissions
 * 5. Verify test user creation and authentication is working
 */

describe('Goal API Endpoints (E2E)', () => {
  let testEnv: {
    db: any;
    api: TestApiClient;
    auth: { token: string };
  };

  // Test data
  const validGoalData: CreateGoalDto = {
    name: 'Emergency Fund',
    description: 'Build emergency savings',
    targetAmount: 10000,
    currency: 'USD',
    targetDate: new Date('2024-12-31'),
    priority: 1
  };

  /**
   * Setup test environment before all tests
   * Requirements addressed:
   * - API Security (Technical Specification/9.3.1 API Security)
   */
  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  /**
   * Cleanup test environment after all tests
   */
  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  /**
   * Test goal creation endpoint
   * Requirements addressed:
   * - Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
   * - Input Validation (Technical Specification/9.3.1 API Security/API Security)
   */
  describe('POST /api/v1/goals', () => {
    it('should create a new goal with valid data', async () => {
      const response = await testEnv.api.post<Goal>('/api/v1/goals', validGoalData);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(validGoalData.name);
      expect(response.targetAmount).toBe(validGoalData.targetAmount);
      expect(response.status).toBe('active');
      expect(response.currentAmount).toBe(0);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        targetAmount: -100, // Invalid: negative amount
        targetDate: 'invalid-date' // Invalid: wrong date format
      };

      try {
        await testEnv.api.post('/api/v1/goals', invalidData);
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('validation failed');
      }
    });

    it('should require authentication', async () => {
      // Remove auth token temporarily
      const originalToken = testEnv.api.setAuthToken('');

      try {
        await testEnv.api.post('/api/v1/goals', validGoalData);
        fail('Should have thrown unauthorized error');
      } catch (error: any) {
        expect(error.message).toContain('401');
      } finally {
        // Restore auth token
        testEnv.api.setAuthToken(originalToken);
      }
    });
  });

  /**
   * Test goal retrieval endpoints
   * Requirements addressed:
   * - Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
   */
  describe('GET /api/v1/goals', () => {
    let createdGoal: Goal;

    beforeAll(async () => {
      createdGoal = await testEnv.api.post<Goal>('/api/v1/goals', validGoalData);
    });

    it('should retrieve all user goals with pagination', async () => {
      const response = await testEnv.api.get<{ items: Goal[]; total: number }>('/api/v1/goals?page=1&limit=10');

      expect(response.items).toBeDefined();
      expect(Array.isArray(response.items)).toBe(true);
      expect(response.total).toBeGreaterThanOrEqual(1);
      expect(response.items.some(goal => goal.id === createdGoal.id)).toBe(true);
    });

    it('should retrieve a specific goal by ID', async () => {
      const response = await testEnv.api.get<Goal>(`/api/v1/goals/${createdGoal.id}`);

      expect(response).toBeDefined();
      expect(response.id).toBe(createdGoal.id);
      expect(response.name).toBe(createdGoal.name);
      expect(response.targetAmount).toBe(createdGoal.targetAmount);
    });

    it('should handle non-existent goal ID', async () => {
      try {
        await testEnv.api.get('/api/v1/goals/non-existent-id');
        fail('Should have thrown not found error');
      } catch (error: any) {
        expect(error.message).toContain('404');
      }
    });
  });

  /**
   * Test goal update endpoint
   * Requirements addressed:
   * - Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
   * - Input Validation (Technical Specification/9.3.1 API Security/API Security)
   */
  describe('PUT /api/v1/goals/:id', () => {
    let goalToUpdate: Goal;

    beforeAll(async () => {
      goalToUpdate = await testEnv.api.post<Goal>('/api/v1/goals', validGoalData);
    });

    it('should update goal with valid data', async () => {
      const updateData = {
        name: 'Updated Emergency Fund',
        targetAmount: 15000,
        description: 'Increased emergency fund target'
      };

      const response = await testEnv.api.put<Goal>(`/api/v1/goals/${goalToUpdate.id}`, updateData);

      expect(response).toBeDefined();
      expect(response.id).toBe(goalToUpdate.id);
      expect(response.name).toBe(updateData.name);
      expect(response.targetAmount).toBe(updateData.targetAmount);
      expect(response.description).toBe(updateData.description);
    });

    it('should validate update data', async () => {
      const invalidUpdate = {
        targetAmount: -500 // Invalid: negative amount
      };

      try {
        await testEnv.api.put(`/api/v1/goals/${goalToUpdate.id}`, invalidUpdate);
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('validation failed');
      }
    });

    it('should prevent unauthorized updates', async () => {
      // Remove auth token temporarily
      const originalToken = testEnv.api.setAuthToken('');

      try {
        await testEnv.api.put(`/api/v1/goals/${goalToUpdate.id}`, { name: 'Unauthorized Update' });
        fail('Should have thrown unauthorized error');
      } catch (error: any) {
        expect(error.message).toContain('401');
      } finally {
        // Restore auth token
        testEnv.api.setAuthToken(originalToken);
      }
    });
  });

  /**
   * Test goal deletion endpoint
   * Requirements addressed:
   * - Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
   * - API Security (Technical Specification/9.3.1 API Security)
   */
  describe('DELETE /api/v1/goals/:id', () => {
    let goalToDelete: Goal;

    beforeAll(async () => {
      goalToDelete = await testEnv.api.post<Goal>('/api/v1/goals', validGoalData);
    });

    it('should delete an existing goal', async () => {
      await testEnv.api.delete(`/api/v1/goals/${goalToDelete.id}`);

      // Verify goal is deleted
      try {
        await testEnv.api.get(`/api/v1/goals/${goalToDelete.id}`);
        fail('Should have thrown not found error');
      } catch (error: any) {
        expect(error.message).toContain('404');
      }
    });

    it('should prevent unauthorized deletion', async () => {
      const newGoal = await testEnv.api.post<Goal>('/api/v1/goals', validGoalData);
      
      // Remove auth token temporarily
      const originalToken = testEnv.api.setAuthToken('');

      try {
        await testEnv.api.delete(`/api/v1/goals/${newGoal.id}`);
        fail('Should have thrown unauthorized error');
      } catch (error: any) {
        expect(error.message).toContain('401');
      } finally {
        // Restore auth token
        testEnv.api.setAuthToken(originalToken);
      }
    });
  });

  /**
   * Test goal progress tracking
   * Requirements addressed:
   * - Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
   */
  describe('Goal Progress Tracking', () => {
    let progressGoal: Goal;

    beforeAll(async () => {
      progressGoal = await testEnv.api.post<Goal>('/api/v1/goals', validGoalData);
    });

    it('should track goal progress correctly', async () => {
      // Update progress
      const updateData = {
        currentAmount: 5000 // 50% progress
      };

      const response = await testEnv.api.put<Goal>(`/api/v1/goals/${progressGoal.id}`, updateData);

      expect(response).toBeDefined();
      expect(response.currentAmount).toBe(updateData.currentAmount);
      expect(response.calculateProgress()).toBe(50);
      expect(response.status).toBe('active');
    });

    it('should mark goal as completed when target is reached', async () => {
      // Update to target amount
      const updateData = {
        currentAmount: validGoalData.targetAmount
      };

      const response = await testEnv.api.put<Goal>(`/api/v1/goals/${progressGoal.id}`, updateData);

      expect(response).toBeDefined();
      expect(response.currentAmount).toBe(validGoalData.targetAmount);
      expect(response.calculateProgress()).toBe(100);
      expect(response.status).toBe('completed');
    });

    it('should detect overdue goals', async () => {
      // Create a goal with past target date
      const overdueGoal = await testEnv.api.post<Goal>('/api/v1/goals', {
        ...validGoalData,
        targetDate: new Date('2020-01-01')
      });

      expect(overdueGoal.isOverdue()).toBe(true);
    });
  });
});