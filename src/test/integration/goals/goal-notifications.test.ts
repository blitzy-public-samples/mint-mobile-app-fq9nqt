// Third-party imports with versions
import { describe, beforeAll, afterAll, test, expect } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../../test/utils/test-helpers';
import { Goal } from '../../../backend/src/modules/goals/entities/goal.entity';
import { Notification } from '../../../backend/src/modules/notifications/entities/notification.entity';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test
 * 2. Set up test database with proper permissions
 * 3. Configure notification service endpoints
 * 4. Set up test user with required permissions
 * 5. Configure test notification listeners
 */

describe('Goal Notifications Integration Tests', () => {
  let testEnv: {
    db: any;
    api: any;
    auth: { token: string };
  };
  let testGoal: Partial<Goal>;

  // Setup test environment before all tests
  beforeAll(async () => {
    testEnv = await setupTestEnvironment();

    // Create test goal data
    testGoal = {
      name: 'Test Savings Goal',
      description: 'Test goal for notification integration tests',
      targetAmount: 1000.00,
      currentAmount: 0.00,
      currency: 'USD',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'active'
    };
  });

  // Cleanup test environment after all tests
  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  /**
   * Tests notification generation for goal progress updates
   * Requirements addressed:
   * - Real-time notifications (Technical Specification/1.1 System Overview/Core Components)
   * - Financial goal monitoring (Technical Specification/1.2 Scope/Core Features)
   */
  test('should generate notification when goal progress is updated', async () => {
    // Create a new goal
    const createResponse = await testEnv.api
      .post('/api/goals')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send(testGoal);
    
    expect(createResponse.status).toBe(201);
    const goalId = createResponse.body.id;

    // Update goal progress
    const updateData = {
      currentAmount: 500.00
    };

    const updateResponse = await testEnv.api
      .patch(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send(updateData);

    expect(updateResponse.status).toBe(200);

    // Verify notification was created
    const notificationsResponse = await testEnv.api
      .get('/api/notifications')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .query({
        type: 'GOAL_PROGRESS',
        goalId
      });

    expect(notificationsResponse.status).toBe(200);
    const notification = notificationsResponse.body.data[0];

    expect(notification).toMatchObject({
      type: 'GOAL_PROGRESS',
      priority: 'MEDIUM',
      isRead: false,
      data: {
        goalId,
        progress: 50, // 500/1000 = 50%
        previousAmount: 0,
        newAmount: 500.00
      }
    });
  });

  /**
   * Tests notification generation when a goal is completed
   * Requirements addressed:
   * - Real-time notifications (Technical Specification/1.1 System Overview/Core Components)
   * - Financial goal monitoring (Technical Specification/1.2 Scope/Core Features)
   */
  test('should generate notification when goal is completed', async () => {
    // Create a new goal
    const createResponse = await testEnv.api
      .post('/api/goals')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send(testGoal);
    
    expect(createResponse.status).toBe(201);
    const goalId = createResponse.body.id;

    // Update goal to completed status
    const updateData = {
      currentAmount: 1000.00,
      status: 'completed'
    };

    const updateResponse = await testEnv.api
      .patch(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send(updateData);

    expect(updateResponse.status).toBe(200);

    // Verify completion notification
    const notificationsResponse = await testEnv.api
      .get('/api/notifications')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .query({
        type: 'GOAL_COMPLETED',
        goalId
      });

    expect(notificationsResponse.status).toBe(200);
    const notification = notificationsResponse.body.data[0];

    expect(notification).toMatchObject({
      type: 'GOAL_COMPLETED',
      priority: 'HIGH',
      isRead: false,
      data: {
        goalId,
        completedAt: expect.any(String),
        targetAmount: 1000.00,
        achievedAmount: 1000.00
      }
    });
  });

  /**
   * Tests notification generation for approaching goal deadlines
   * Requirements addressed:
   * - Real-time notifications (Technical Specification/1.1 System Overview/Core Components)
   * - Financial goal monitoring (Technical Specification/1.2 Scope/Core Features)
   */
  test('should generate notification for approaching goal deadline', async () => {
    // Create a goal with near-future deadline
    const nearFutureGoal = {
      ...testGoal,
      targetDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
    };

    const createResponse = await testEnv.api
      .post('/api/goals')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send(nearFutureGoal);
    
    expect(createResponse.status).toBe(201);
    const goalId = createResponse.body.id;

    // Trigger deadline check (this might be automatic in production)
    await testEnv.api
      .post('/api/goals/check-deadlines')
      .set('Authorization', `Bearer ${testEnv.auth.token}`);

    // Verify deadline warning notification
    const notificationsResponse = await testEnv.api
      .get('/api/notifications')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .query({
        type: 'GOAL_DEADLINE_APPROACHING',
        goalId
      });

    expect(notificationsResponse.status).toBe(200);
    const notification = notificationsResponse.body.data[0];

    expect(notification).toMatchObject({
      type: 'GOAL_DEADLINE_APPROACHING',
      priority: 'HIGH',
      isRead: false,
      data: {
        goalId,
        targetDate: expect.any(String),
        daysRemaining: 2,
        currentProgress: 0,
        remainingAmount: 1000.00
      }
    });
  });

  /**
   * Tests notification delivery and handling for overdue goals
   * Requirements addressed:
   * - Real-time notifications (Technical Specification/1.1 System Overview/Core Components)
   * - Financial goal monitoring (Technical Specification/1.2 Scope/Core Features)
   */
  test('should generate notification when goal becomes overdue', async () => {
    // Create a goal with past deadline
    const overdueGoal = {
      ...testGoal,
      targetDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    };

    const createResponse = await testEnv.api
      .post('/api/goals')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send(overdueGoal);
    
    expect(createResponse.status).toBe(201);
    const goalId = createResponse.body.id;

    // Trigger overdue check
    await testEnv.api
      .post('/api/goals/check-deadlines')
      .set('Authorization', `Bearer ${testEnv.auth.token}`);

    // Verify overdue notification
    const notificationsResponse = await testEnv.api
      .get('/api/notifications')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .query({
        type: 'GOAL_OVERDUE',
        goalId
      });

    expect(notificationsResponse.status).toBe(200);
    const notification = notificationsResponse.body.data[0];

    expect(notification).toMatchObject({
      type: 'GOAL_OVERDUE',
      priority: 'HIGH',
      isRead: false,
      data: {
        goalId,
        targetDate: expect.any(String),
        daysOverdue: 1,
        currentProgress: 0,
        remainingAmount: 1000.00
      }
    });
  });

  /**
   * Tests notification preferences and delivery settings
   * Requirements addressed:
   * - Real-time notifications (Technical Specification/1.1 System Overview/Core Components)
   */
  test('should respect notification preferences for goal updates', async () => {
    // Set notification preferences
    await testEnv.api
      .put('/api/users/notification-preferences')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send({
        goalProgress: false,
        goalCompletion: true,
        goalDeadlines: true
      });

    // Create and update a goal
    const createResponse = await testEnv.api
      .post('/api/goals')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send(testGoal);
    
    expect(createResponse.status).toBe(201);
    const goalId = createResponse.body.id;

    // Update goal progress
    await testEnv.api
      .patch(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send({ currentAmount: 500.00 });

    // Verify no progress notification was created (as per preferences)
    const progressNotifications = await testEnv.api
      .get('/api/notifications')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .query({
        type: 'GOAL_PROGRESS',
        goalId
      });

    expect(progressNotifications.body.data).toHaveLength(0);

    // Complete the goal
    await testEnv.api
      .patch(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .send({
        currentAmount: 1000.00,
        status: 'completed'
      });

    // Verify completion notification was created (as per preferences)
    const completionNotifications = await testEnv.api
      .get('/api/notifications')
      .set('Authorization', `Bearer ${testEnv.auth.token}`)
      .query({
        type: 'GOAL_COMPLETED',
        goalId
      });

    expect(completionNotifications.body.data).toHaveLength(1);
  });
});