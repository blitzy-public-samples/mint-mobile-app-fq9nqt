// Third-party imports with versions
import { jest } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../../utils/test-helpers';
import { createMockUser } from '../../../utils/mock-data';
import { GoalsService } from '../../../../backend/src/modules/goals/goals.service';

/**
 * Human Tasks:
 * 1. Configure test environment variables in .env.test
 * 2. Set up test database with proper permissions
 * 3. Configure event emitter for notification testing
 * 4. Ensure test data cleanup after test runs
 * 5. Configure test timeouts appropriately for CI/CD
 */

describe('Goal Progress Integration Tests', () => {
  // Test environment variables
  let testEnvironment: any;
  let testUser: any;
  let testGoal: any;
  let goalsService: GoalsService;
  let notificationEvents: any[] = [];

  /**
   * Setup test environment before all tests
   * Requirements addressed:
   * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
   */
  beforeAll(async () => {
    // Initialize test environment
    testEnvironment = await setupTestEnvironment();
    
    // Create test user
    testUser = await createMockUser();
    
    // Initialize goals service
    goalsService = new GoalsService(
      testEnvironment.db.getRepository('Goal'),
      testEnvironment.eventEmitter
    );

    // Create test goal
    testGoal = await goalsService.create(testUser.id, {
      name: 'Test Savings Goal',
      description: 'Integration test goal',
      targetAmount: 10000,
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      category: 'savings',
      priority: 'high'
    });

    // Set up notification event listener
    testEnvironment.eventEmitter.on('goal.progress', (event: any) => {
      notificationEvents.push(event);
    });
    testEnvironment.eventEmitter.on('goal.completed', (event: any) => {
      notificationEvents.push(event);
    });
  });

  /**
   * Cleanup test environment after all tests
   * Requirements addressed:
   * - Test Data Management (Technical Specification/8. System Design/Testing Standards)
   */
  afterAll(async () => {
    // Remove test goal
    await goalsService.delete(testUser.id, testGoal.id);
    
    // Remove event listeners
    testEnvironment.eventEmitter.removeAllListeners('goal.progress');
    testEnvironment.eventEmitter.removeAllListeners('goal.completed');
    
    // Cleanup test environment
    await cleanupTestEnvironment(testEnvironment);
  });

  /**
   * Clear notification events before each test
   */
  beforeEach(() => {
    notificationEvents = [];
  });

  /**
   * Test goal progress update functionality
   * Requirements addressed:
   * - Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
   */
  test('should update goal progress with correct calculations', async () => {
    // Update goal progress to 50%
    const targetAmount = testGoal.targetAmount;
    const progressAmount = targetAmount * 0.5;
    
    const updatedGoal = await goalsService.updateProgress(
      testUser.id,
      testGoal.id,
      progressAmount
    );

    // Verify goal progress update
    expect(updatedGoal.currentAmount).toBe(progressAmount);
    expect(updatedGoal.calculateProgress()).toBe(50);
    expect(updatedGoal.status).toBe('active');

    // Verify progress notification event
    expect(notificationEvents).toHaveLength(1);
    expect(notificationEvents[0]).toMatchObject({
      type: 'goal.progress',
      userId: testUser.id,
      goalId: testGoal.id,
      previousAmount: 0,
      currentAmount: progressAmount,
      progressPercentage: 50,
      isCompleted: false
    });
  });

  /**
   * Test goal milestone notifications
   * Requirements addressed:
   * - Real-time Notifications (Technical Specification/1.1 System Overview)
   */
  test('should emit milestone notifications when reaching progress thresholds', async () => {
    // Update progress to trigger milestone (75%)
    const targetAmount = testGoal.targetAmount;
    const progressAmount = targetAmount * 0.75;
    
    const updatedGoal = await goalsService.updateProgress(
      testUser.id,
      testGoal.id,
      progressAmount
    );

    // Verify goal state
    expect(updatedGoal.currentAmount).toBe(progressAmount);
    expect(updatedGoal.calculateProgress()).toBe(75);
    expect(updatedGoal.status).toBe('active');

    // Verify milestone notification
    expect(notificationEvents).toHaveLength(1);
    expect(notificationEvents[0]).toMatchObject({
      type: 'goal.progress',
      userId: testUser.id,
      goalId: testGoal.id,
      progressPercentage: 75,
      isCompleted: false
    });
  });

  /**
   * Test goal completion status and notifications
   * Requirements addressed:
   * - Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
   * - Real-time Notifications (Technical Specification/1.1 System Overview)
   */
  test('should mark goal as completed and emit completion notification when reaching target', async () => {
    // Update progress to 100%
    const targetAmount = testGoal.targetAmount;
    
    const completedGoal = await goalsService.updateProgress(
      testUser.id,
      testGoal.id,
      targetAmount
    );

    // Verify goal completion
    expect(completedGoal.currentAmount).toBe(targetAmount);
    expect(completedGoal.calculateProgress()).toBe(100);
    expect(completedGoal.status).toBe('completed');

    // Verify notifications (progress + completion)
    expect(notificationEvents).toHaveLength(2);
    
    // Verify progress notification
    expect(notificationEvents[0]).toMatchObject({
      type: 'goal.progress',
      userId: testUser.id,
      goalId: testGoal.id,
      progressPercentage: 100,
      isCompleted: true
    });

    // Verify completion notification
    expect(notificationEvents[1]).toMatchObject({
      type: 'goal.completed',
      userId: testUser.id,
      goalId: testGoal.id,
      achievedAmount: targetAmount
    });
  });

  /**
   * Test validation for goal progress updates
   * Requirements addressed:
   * - Data Validation (Technical Specification/9.1 Data Integrity)
   */
  test('should validate goal progress updates', async () => {
    // Test negative progress amount
    await expect(
      goalsService.updateProgress(testUser.id, testGoal.id, -1000)
    ).rejects.toThrow('Progress amount cannot be negative');

    // Test non-existent goal
    await expect(
      goalsService.updateProgress(testUser.id, 'non-existent-id', 1000)
    ).rejects.toThrow('Goal not found or unauthorized access');

    // Test unauthorized access
    await expect(
      goalsService.updateProgress('wrong-user-id', testGoal.id, 1000)
    ).rejects.toThrow('Goal not found or unauthorized access');
  });

  /**
   * Test goal progress persistence
   * Requirements addressed:
   * - Data Persistence (Technical Specification/8.1 Data Storage)
   */
  test('should persist goal progress correctly', async () => {
    const progressAmount = 2500;
    
    // Update goal progress
    await goalsService.updateProgress(
      testUser.id,
      testGoal.id,
      progressAmount
    );

    // Retrieve goal and verify persistence
    const retrievedGoal = await goalsService.findOne(
      testUser.id,
      testGoal.id
    );

    expect(retrievedGoal.currentAmount).toBe(progressAmount);
    expect(retrievedGoal.metadata.lastProgressUpdate).toBeDefined();
    expect(new Date(retrievedGoal.metadata.lastProgressUpdate)).toBeInstanceOf(Date);
  });
});