// @package @jest/globals ^29.0.0
import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals';
// @package supertest ^6.3.0
import request from 'supertest';

import { CreateGoalDto } from '../src/modules/goals/dto/create-goal.dto';
import { UpdateGoalDto } from '../src/modules/goals/dto/update-goal.dto';
import { 
  setupTestEnvironment, 
  cleanupTestEnvironment, 
  createTestContext,
  waitForCondition,
  compareObjects 
} from '../../test/utils/test-helpers';

/**
 * Human Tasks Required:
 * 1. Ensure test database is configured and accessible
 * 2. Configure test environment variables in .env.test
 * 3. Set up test user credentials and permissions
 * 4. Configure rate limiting settings for testing
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

describe('Goals API E2E Tests', () => {
  let testEnv: any;
  let testContext: any;

  beforeAll(async () => {
    // Requirements addressed: Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
    testEnv = await setupTestEnvironment({
      database: true,
      authentication: true,
      logging: true
    });
    testContext = createTestContext();
  }, TEST_TIMEOUT);

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  beforeEach(async () => {
    // Clear test data before each test
    await testEnv.db.collection('goals').deleteMany({});
  });

  describe('POST /goals', () => {
    it('should create a new goal with valid data', async () => {
      // Requirements addressed: Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
      const goalData: CreateGoalDto = {
        name: 'Emergency Fund',
        description: 'Build emergency savings',
        targetAmount: 10000,
        currency: 'USD',
        targetDate: new Date('2024-12-31'),
        priority: 1
      };

      const response = await request(API_URL)
        .post('/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(goalData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        ...goalData,
        targetDate: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        userId: expect.any(String)
      });
    });

    it('should validate required fields', async () => {
      // Requirements addressed: API Security (Technical Specification/9.3.1 API Security)
      const invalidData = {
        name: '',
        targetAmount: -1000
      };

      const response = await request(API_URL)
        .post('/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toContain('validation failed');
    });

    it('should prevent duplicate goal names for the same user', async () => {
      const goalData = {
        name: 'Vacation Fund',
        targetAmount: 5000,
        targetDate: new Date('2024-06-30')
      };

      await request(API_URL)
        .post('/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(goalData)
        .expect(201);

      await request(API_URL)
        .post('/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(goalData)
        .expect(409);
    });

    it('should enforce rate limiting', async () => {
      // Requirements addressed: API Security (Technical Specification/9.3.1 API Security)
      const goalData = {
        name: 'Test Goal',
        targetAmount: 1000,
        targetDate: new Date('2024-01-01')
      };

      const requests = Array(10).fill(goalData).map(() =>
        request(API_URL)
          .post('/goals')
          .set('Authorization', `Bearer ${testEnv.auth.token}`)
          .send(goalData)
      );

      const responses = await Promise.all(requests);
      expect(responses.some(r => r.status === 429)).toBeTruthy();
    });
  });

  describe('GET /goals', () => {
    beforeEach(async () => {
      // Create test goals
      const goals = [
        {
          name: 'Goal 1',
          targetAmount: 1000,
          targetDate: new Date('2024-01-01')
        },
        {
          name: 'Goal 2',
          targetAmount: 2000,
          targetDate: new Date('2024-02-01')
        }
      ];

      for (const goal of goals) {
        await request(API_URL)
          .post('/goals')
          .set('Authorization', `Bearer ${testEnv.auth.token}`)
          .send(goal);
      }
    });

    it('should list all goals with pagination', async () => {
      const response = await request(API_URL)
        .get('/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toMatchObject({
        items: expect.any(Array),
        meta: {
          page: 1,
          limit: 10,
          totalItems: 2,
          totalPages: 1
        }
      });
    });

    it('should filter goals by status', async () => {
      const response = await request(API_URL)
        .get('/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .query({ status: 'IN_PROGRESS' })
        .expect(200);

      expect(response.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ status: 'IN_PROGRESS' })
        ])
      );
    });

    it('should sort goals by priority', async () => {
      const response = await request(API_URL)
        .get('/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .query({ sortBy: 'priority', sortOrder: 'DESC' })
        .expect(200);

      const priorities = response.body.items.map((goal: any) => goal.priority);
      expect(priorities).toEqual([...priorities].sort((a, b) => b - a));
    });
  });

  describe('PATCH /goals/:id', () => {
    let goalId: string;

    beforeEach(async () => {
      // Create a test goal
      const response = await request(API_URL)
        .post('/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send({
          name: 'Test Goal',
          targetAmount: 5000,
          targetDate: new Date('2024-06-30')
        });
      goalId = response.body.id;
    });

    it('should update goal progress', async () => {
      // Requirements addressed: Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
      const updateData: UpdateGoalDto = {
        currentAmount: 2500,
        status: 'IN_PROGRESS'
      };

      const response = await request(API_URL)
        .patch(`/goals/${goalId}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: goalId,
        currentAmount: 2500,
        status: 'IN_PROGRESS'
      });
    });

    it('should handle concurrent updates safely', async () => {
      const updates = Array(5).fill({
        currentAmount: 1000
      }).map(() =>
        request(API_URL)
          .patch(`/goals/${goalId}`)
          .set('Authorization', `Bearer ${testEnv.auth.token}`)
          .send({ currentAmount: 1000 })
      );

      const responses = await Promise.all(updates);
      expect(responses.every(r => r.status === 200 || r.status === 409)).toBeTruthy();
    });

    it('should validate status transitions', async () => {
      await request(API_URL)
        .patch(`/goals/${goalId}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });
  });

  describe('DELETE /goals/:id', () => {
    let goalId: string;

    beforeEach(async () => {
      // Create a test goal
      const response = await request(API_URL)
        .post('/goals')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send({
          name: 'Test Goal',
          targetAmount: 5000,
          targetDate: new Date('2024-06-30')
        });
      goalId = response.body.id;
    });

    it('should delete a goal', async () => {
      await request(API_URL)
        .delete(`/goals/${goalId}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .expect(204);

      // Verify goal is deleted
      await request(API_URL)
        .get(`/goals/${goalId}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .expect(404);
    });

    it('should prevent unauthorized deletion', async () => {
      // Requirements addressed: API Security (Technical Specification/9.3.1 API Security)
      await request(API_URL)
        .delete(`/goals/${goalId}`)
        .expect(401);
    });

    it('should handle non-existent goal deletion', async () => {
      await request(API_URL)
        .delete('/goals/non-existent-id')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .expect(404);
    });
  });
});