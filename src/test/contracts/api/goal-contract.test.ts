// Third-party imports with versions
import { describe, it, beforeAll, afterAll, expect } from '@jest/globals'; // ^29.0.0
import request from 'supertest'; // ^6.3.0

// Internal imports
import { CreateGoalDto } from '../../../backend/src/modules/goals/dto/create-goal.dto';
import { Goal } from '../../../backend/src/modules/goals/entities/goal.entity';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';

/**
 * Human Tasks:
 * 1. Configure test database with appropriate permissions and schema
 * 2. Set up test environment variables in .env.test
 * 3. Ensure rate limiting is properly configured for tests
 * 4. Configure test logging and monitoring
 */

describe('Goal API Contract Tests', () => {
  let testEnv: { db: any; api: any; auth: { token: string } };
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  /**
   * Tests the contract for goal creation endpoint
   * Requirements addressed:
   * - Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
   * - API Security (Technical Specification/9.3.1 API Security)
   */
  describe('testGoalCreationContract', () => {
    const validGoal: CreateGoalDto = {
      name: 'Emergency Fund',
      description: 'Build emergency savings',
      targetAmount: 10000,
      targetDate: new Date('2024-12-31'),
      currency: 'USD',
      priority: 1
    };

    it('should validate required fields for goal creation', async () => {
      const invalidGoal = {
        description: 'Missing required fields'
      };

      const response = await request(baseUrl)
        .post('/api/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(invalidGoal);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          message: expect.any(String)
        })
      );
    });

    it('should enforce field type validations', async () => {
      const invalidTypes = {
        name: 123,
        targetAmount: 'invalid',
        targetDate: 'not-a-date',
        priority: 'high'
      };

      const response = await request(baseUrl)
        .post('/api/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(invalidTypes);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: expect.any(String),
          message: expect.stringContaining('type')
        })
      );
    });

    it('should create a goal with valid payload', async () => {
      const response = await request(baseUrl)
        .post('/api/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(validGoal);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: validGoal.name,
        targetAmount: validGoal.targetAmount,
        status: 'active',
        currentAmount: 0
      });
    });

    it('should require authentication', async () => {
      const response = await request(baseUrl)
        .post('/api/goals')
        .send(validGoal);

      expect(response.status).toBe(401);
    });
  });

  /**
   * Tests the contract for goal retrieval endpoint
   * Requirements addressed:
   * - Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
   * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
   */
  describe('testGoalRetrievalContract', () => {
    let createdGoal: Goal;

    beforeAll(async () => {
      const response = await request(baseUrl)
        .post('/api/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send({
          name: 'Test Goal',
          targetAmount: 5000,
          targetDate: new Date('2024-06-30')
        });
      createdGoal = response.body;
    });

    it('should retrieve goal with correct data structure', async () => {
      const response = await request(baseUrl)
        .get(`/api/goals/${createdGoal.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        targetAmount: expect.any(Number),
        currentAmount: expect.any(Number),
        status: expect.stringMatching(/^(active|completed|cancelled)$/),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    it('should support pagination and filtering', async () => {
      const response = await request(baseUrl)
        .get('/api/goals')
        .query({
          limit: 10,
          offset: 0,
          status: 'active',
          fromDate: '2023-01-01'
        })
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
        limit: 10,
        offset: 0
      });
    });

    it('should validate query parameters', async () => {
      const response = await request(baseUrl)
        .get('/api/goals')
        .query({
          limit: 'invalid',
          offset: -1
        })
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  /**
   * Tests the contract for goal update endpoint
   * Requirements addressed:
   * - Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
   * - API Security (Technical Specification/9.3.1 API Security)
   */
  describe('testGoalUpdateContract', () => {
    let goalToUpdate: Goal;

    beforeAll(async () => {
      const response = await request(baseUrl)
        .post('/api/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send({
          name: 'Update Test Goal',
          targetAmount: 3000,
          targetDate: new Date('2024-03-31')
        });
      goalToUpdate = response.body;
    });

    it('should allow partial updates', async () => {
      const update = {
        name: 'Updated Goal Name',
        description: 'New description'
      };

      const response = await request(baseUrl)
        .patch(`/api/goals/${goalToUpdate.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(update);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        ...goalToUpdate,
        ...update,
        updatedAt: expect.any(String)
      });
    });

    it('should validate update payload', async () => {
      const invalidUpdate = {
        targetAmount: -1000,
        status: 'invalid'
      };

      const response = await request(baseUrl)
        .patch(`/api/goals/${goalToUpdate.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(invalidUpdate);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  /**
   * Tests the contract for goal progress tracking
   * Requirements addressed:
   * - Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
   * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
   */
  describe('testGoalProgressContract', () => {
    let progressGoal: Goal;

    beforeAll(async () => {
      const response = await request(baseUrl)
        .post('/api/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send({
          name: 'Progress Test Goal',
          targetAmount: 1000,
          targetDate: new Date('2024-01-31')
        });
      progressGoal = response.body;
    });

    it('should update goal progress correctly', async () => {
      const progressUpdate = {
        currentAmount: 500
      };

      const response = await request(baseUrl)
        .patch(`/api/goals/${progressGoal.id}/progress`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(progressUpdate);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        currentAmount: 500,
        progress: 50 // calculateProgress() should return 50%
      });
    });

    it('should validate progress update payload', async () => {
      const invalidProgress = {
        currentAmount: 'invalid'
      };

      const response = await request(baseUrl)
        .patch(`/api/goals/${progressGoal.id}/progress`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(invalidProgress);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle goal completion', async () => {
      const completionUpdate = {
        currentAmount: 1000
      };

      const response = await request(baseUrl)
        .patch(`/api/goals/${progressGoal.id}/progress`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(completionUpdate);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        currentAmount: 1000,
        status: 'completed',
        progress: 100
      });
    });

    it('should check goal overdue status', async () => {
      const overdueGoal = await request(baseUrl)
        .post('/api/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send({
          name: 'Overdue Test Goal',
          targetAmount: 2000,
          targetDate: new Date('2023-01-01') // Past date
        });

      const response = await request(baseUrl)
        .get(`/api/goals/${overdueGoal.body.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`);

      expect(response.status).toBe(200);
      expect(response.body.isOverdue).toBe(true);
    });
  });
});