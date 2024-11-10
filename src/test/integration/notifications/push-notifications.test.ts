// Third-party imports with versions
import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals'; // ^29.0.0
import { Test } from 'supertest'; // ^6.3.0

// Internal imports
import { NotificationsService } from '../../src/modules/notifications/notifications.service';
import { setupTestEnvironment, cleanupTestEnvironment, waitForCondition } from '../../utils/test-helpers';
import { createMockUser } from '../../utils/mock-data';

/**
 * Human Tasks:
 * 1. Configure FCM test credentials in .env.test
 * 2. Set up mock FCM/APNS services for testing
 * 3. Configure notification delivery metrics collection
 * 4. Set up test device tokens in test environment
 * 5. Configure test notification templates
 */

describe('Push Notification Integration Tests', () => {
  let testEnv: any;
  let notificationsService: NotificationsService;
  let testUser: any;
  let validDeviceToken: string;
  let invalidDeviceToken: string;

  // Setup test environment before all tests
  beforeAll(async () => {
    // Requirements addressed: Real-time notification system (Technical Specification/1.1 System Overview)
    testEnv = await setupTestEnvironment({
      services: ['notifications', 'fcm', 'apns'],
      mocks: {
        fcm: true,
        apns: true
      }
    });

    notificationsService = testEnv.module.get(NotificationsService);
    validDeviceToken = 'valid_test_device_token_123';
    invalidDeviceToken = 'invalid_test_device_token_456';
  });

  // Cleanup test environment after all tests
  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  // Reset test state before each test
  beforeEach(async () => {
    testUser = await createMockUser({
      deviceTokens: [validDeviceToken],
      notificationPreferences: {
        push: true,
        email: true
      }
    });
  });

  // Cleanup after each test
  afterEach(async () => {
    await testEnv.cleanup();
  });

  // Test successful push notification delivery
  it('should deliver push notification successfully', async () => {
    // Requirements addressed: Push Notification Services (Technical Specification/5.1 High-Level Architecture Overview)
    const notification = await notificationsService.create({
      userId: testUser.id,
      type: 'TRANSACTION_ALERT',
      title: 'New Transaction',
      message: 'You have a new transaction of $50.00',
      priority: 'HIGH',
      data: JSON.stringify({
        transactionId: 'test_transaction_123',
        amount: 50.00,
        merchant: 'Test Merchant'
      })
    });

    // Wait for notification to be processed and delivered
    const delivered = await waitForCondition(
      async () => {
        const updatedNotification = await notificationsService.findAll(testUser.id);
        return updatedNotification[0]?.sentAt !== null;
      },
      5000,
      100
    );

    expect(delivered).toBe(true);
    expect(testEnv.mocks.fcm.getDeliveredNotifications()).toContainEqual(
      expect.objectContaining({
        token: validDeviceToken,
        title: 'New Transaction',
        body: 'You have a new transaction of $50.00'
      })
    );
  });

  // Test notification failure handling
  it('should handle delivery failures appropriately', async () => {
    // Requirements addressed: Notification Service (Technical Specification/5.2.3 Service Layer Architecture)
    testUser.deviceTokens = [invalidDeviceToken];
    
    const notification = await notificationsService.create({
      userId: testUser.id,
      type: 'SECURITY_ALERT',
      title: 'Security Alert',
      message: 'Unusual activity detected',
      priority: 'URGENT',
      data: JSON.stringify({
        alertId: 'test_alert_123',
        severity: 'high'
      })
    });

    // Wait for retry attempts and failure handling
    await waitForCondition(
      async () => {
        const updatedNotification = await notificationsService.findAll(testUser.id);
        return updatedNotification[0]?.failureReason !== null;
      },
      10000,
      500
    );

    const failedNotification = (await notificationsService.findAll(testUser.id))[0];
    expect(failedNotification.status).toBe('FAILED');
    expect(failedNotification.retryCount).toBeGreaterThan(0);
    expect(failedNotification.failureReason).toContain('Invalid device token');
  });

  // Test batch notification processing
  it('should process batch notifications correctly', async () => {
    // Requirements addressed: Real-time notification system (Technical Specification/1.1 System Overview)
    const notifications = await Promise.all([
      notificationsService.create({
        userId: testUser.id,
        type: 'BUDGET_ALERT',
        title: 'Budget Update 1',
        message: 'Budget alert 1',
        priority: 'LOW'
      }),
      notificationsService.create({
        userId: testUser.id,
        type: 'BUDGET_ALERT',
        title: 'Budget Update 2',
        message: 'Budget alert 2',
        priority: 'MEDIUM'
      }),
      notificationsService.create({
        userId: testUser.id,
        type: 'BUDGET_ALERT',
        title: 'Budget Update 3',
        message: 'Budget alert 3',
        priority: 'HIGH'
      })
    ]);

    // Wait for all notifications to be processed
    await waitForCondition(
      async () => {
        const processed = await notificationsService.findAll(testUser.id);
        return processed.every(n => n.sentAt !== null);
      },
      15000,
      500
    );

    const deliveredNotifications = testEnv.mocks.fcm.getDeliveredNotifications();
    expect(deliveredNotifications).toHaveLength(3);
    
    // Verify delivery order matches priority
    const deliveryOrder = deliveredNotifications.map(n => n.title);
    expect(deliveryOrder).toEqual([
      'Budget Update 3', // HIGH
      'Budget Update 2', // MEDIUM
      'Budget Update 1'  // LOW
    ]);
  });

  // Test notification priorities
  it('should respect notification priorities', async () => {
    // Requirements addressed: Push Notification Services (Technical Specification/5.1 High-Level Architecture Overview)
    const startTime = Date.now();

    // Create notifications with different priorities
    await Promise.all([
      notificationsService.create({
        userId: testUser.id,
        type: 'SYSTEM_ALERT',
        title: 'Low Priority',
        message: 'Low priority message',
        priority: 'LOW'
      }),
      notificationsService.create({
        userId: testUser.id,
        type: 'SYSTEM_ALERT',
        title: 'Urgent Priority',
        message: 'Urgent priority message',
        priority: 'URGENT'
      })
    ]);

    // Wait for notifications to be delivered
    await waitForCondition(
      async () => {
        const delivered = await notificationsService.findAll(testUser.id);
        return delivered.every(n => n.sentAt !== null);
      },
      10000,
      100
    );

    const deliveredNotifications = testEnv.mocks.fcm.getDeliveredNotifications();
    const deliveryTimes = deliveredNotifications.map(n => n.deliveredAt - startTime);

    // Verify urgent notification was delivered before low priority
    expect(deliveryTimes[0]).toBeLessThan(deliveryTimes[1]);
    expect(deliveredNotifications[0].title).toBe('Urgent Priority');
    expect(deliveredNotifications[1].title).toBe('Low Priority');

    // Verify performance metrics
    const urgentDeliveryTime = deliveryTimes[0];
    expect(urgentDeliveryTime).toBeLessThan(1000); // Urgent notifications should be delivered within 1 second
  });
});