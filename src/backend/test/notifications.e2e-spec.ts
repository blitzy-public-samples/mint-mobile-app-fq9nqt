// Third-party imports with versions
import { describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/globals'; // ^29.0.0
import * as request from 'supertest'; // ^6.3.0
import { INestApplication } from '@nestjs/common';

// Internal imports
import { TestEnvironment, initialize, cleanup, reset } from '../../test/setup/test-environment';
import { CreateNotificationDto, NotificationType, NotificationPriority } from '../src/modules/notifications/dto/create-notification.dto';
import { Notification } from '../src/modules/notifications/entities/notification.entity';

/**
 * Human Tasks Required:
 * 1. Configure FCM/APNS credentials in test environment for push notification testing
 * 2. Set up test user accounts with required permissions
 * 3. Configure test environment variables in .env.test
 * 4. Ensure test database has proper isolation
 * 5. Set up monitoring for notification delivery metrics in test environment
 */

/**
 * End-to-end tests for the notifications functionality
 * Requirements addressed:
 * - Real-time notification system (Technical Specification/1.1 System Overview)
 * - Push Notification Services (Technical Specification/5.1 High-Level Architecture Overview)
 * - Notification Service (Technical Specification/5.2.3 Service Layer Architecture)
 */
@describe('Notifications - /api/notifications (e2e)')
export class NotificationsE2ETests {
  private app: INestApplication;
  private testUser: any;
  private authToken: string;
  private testNotification: Notification;

  @beforeAll()
  async function setupTestEnvironment(): Promise<void> {
    // Initialize test environment with secure configuration
    await initialize({
      enableAuth: true,
      enablePushNotifications: true,
      isolateDatabase: true
    });

    // Create test user with required permissions
    this.testUser = await TestEnvironment.createTestUser({
      email: 'test.user@example.com',
      permissions: ['notifications.manage']
    });

    // Generate authentication token
    this.authToken = await TestEnvironment.generateAuthToken(this.testUser);

    // Configure notification service for testing
    await TestEnvironment.configurePushNotifications({
      fcmEnabled: true,
      apnsEnabled: true,
      mockDelivery: true
    });
  }

  @afterAll()
  async function cleanupTestEnvironment(): Promise<void> {
    // Clean up test notifications
    await TestEnvironment.cleanupNotifications(this.testUser.id);

    // Remove test user data
    await TestEnvironment.removeTestUser(this.testUser.id);

    // Clear notification queue
    await TestEnvironment.clearNotificationQueue();

    // Reset mock providers
    await TestEnvironment.resetPushProviders();

    // Clean up test environment
    await cleanup();
  }

  @beforeEach()
  async function prepareTest(): Promise<void> {
    // Clear notification queue before each test
    await TestEnvironment.clearNotificationQueue();

    // Reset notification counters
    await TestEnvironment.resetNotificationMetrics();

    // Refresh authentication token
    this.authToken = await TestEnvironment.refreshAuthToken(this.testUser);

    // Reset mock provider states
    await TestEnvironment.resetPushProviders();
  }

  @test('POST /api/notifications')
  async function testCreateNotification(): Promise<void> {
    // Prepare notification DTO
    const notificationDto: CreateNotificationDto = {
      userId: this.testUser.id,
      type: NotificationType.BUDGET_ALERT,
      title: 'Budget Alert',
      message: 'You have exceeded your monthly budget',
      priority: NotificationPriority.HIGH,
      data: JSON.stringify({
        budgetId: 'test-budget-123',
        category: 'groceries',
        threshold: 0.9
      })
    };

    // Send POST request to create notification
    const response = await request(this.app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${this.authToken}`)
      .send(notificationDto)
      .expect(201);

    // Verify response structure
    expect(response.body).toHaveProperty('id');
    expect(response.body.type).toBe(NotificationType.BUDGET_ALERT);
    expect(response.body.title).toBe(notificationDto.title);
    expect(response.body.priority).toBe(NotificationPriority.HIGH);

    // Verify notification persistence
    const savedNotification = await TestEnvironment.getNotification(response.body.id);
    expect(savedNotification).toBeDefined();
    expect(savedNotification.userId).toBe(this.testUser.id);

    // Verify push notification delivery
    const pushDelivery = await TestEnvironment.getPushDeliveryStatus(response.body.id);
    expect(pushDelivery.status).toBe('delivered');
    expect(pushDelivery.timestamp).toBeDefined();

    // Store test notification for cleanup
    this.testNotification = savedNotification;
  }

  @test('GET /api/notifications')
  async function testGetAllNotifications(): Promise<void> {
    // Create multiple test notifications
    const notifications = await TestEnvironment.createTestNotifications(this.testUser.id, 5);

    // Send GET request with pagination
    const response = await request(this.app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${this.authToken}`)
      .query({
        page: 1,
        limit: 10,
        sort: 'createdAt:DESC'
      })
      .expect(200);

    // Verify response pagination
    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.meta.totalItems).toBeGreaterThanOrEqual(5);
    expect(response.body.meta.itemsPerPage).toBe(10);

    // Verify notification data
    expect(response.body.items).toBeInstanceOf(Array);
    expect(response.body.items[0]).toHaveProperty('id');
    expect(response.body.items[0]).toHaveProperty('type');
    expect(response.body.items[0]).toHaveProperty('title');
    expect(response.body.items[0]).toHaveProperty('createdAt');

    // Clean up test notifications
    await TestEnvironment.cleanupNotifications(notifications.map(n => n.id));
  }

  @test('GET /api/notifications/unread')
  async function testGetUnreadNotifications(): Promise<void> {
    // Create mix of read/unread notifications
    const unreadCount = 3;
    const readCount = 2;
    await TestEnvironment.createTestNotifications(this.testUser.id, unreadCount, { isRead: false });
    await TestEnvironment.createTestNotifications(this.testUser.id, readCount, { isRead: true });

    // Send GET request for unread notifications
    const response = await request(this.app)
      .get('/api/notifications/unread')
      .set('Authorization', `Bearer ${this.authToken}`)
      .expect(200);

    // Verify only unread notifications returned
    expect(response.body).toHaveProperty('items');
    expect(response.body.items).toHaveLength(unreadCount);
    response.body.items.forEach((notification: Notification) => {
      expect(notification.isRead).toBe(false);
    });

    // Verify priority-based sorting
    const priorities = response.body.items.map((n: Notification) => n.priority);
    expect(priorities).toEqual([...priorities].sort());

    // Clean up test notifications
    await TestEnvironment.cleanupAllTestNotifications(this.testUser.id);
  }

  @test('PUT /api/notifications/:id/read')
  async function testMarkNotificationAsRead(): Promise<void> {
    // Create unread test notification
    const notification = await TestEnvironment.createTestNotification(this.testUser.id, {
      isRead: false,
      type: NotificationType.TRANSACTION_ALERT
    });

    // Send PUT request to mark as read
    const response = await request(this.app)
      .put(`/api/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${this.authToken}`)
      .expect(200);

    // Verify read status update
    expect(response.body.isRead).toBe(true);
    expect(response.body.readAt).toBeDefined();

    // Verify database update
    const updatedNotification = await TestEnvironment.getNotification(notification.id);
    expect(updatedNotification.isRead).toBe(true);
    expect(updatedNotification.readAt).toBeDefined();

    // Verify unread count update
    const unreadCount = await TestEnvironment.getUnreadNotificationCount(this.testUser.id);
    expect(unreadCount).toBe(0);

    // Clean up test notification
    await TestEnvironment.cleanupNotification(notification.id);
  }

  @test('DELETE /api/notifications/:id')
  async function testDeleteNotification(): Promise<void> {
    // Create test notification for deletion
    const notification = await TestEnvironment.createTestNotification(this.testUser.id, {
      type: NotificationType.SYSTEM_UPDATE
    });

    // Send DELETE request
    await request(this.app)
      .delete(`/api/notifications/${notification.id}`)
      .set('Authorization', `Bearer ${this.authToken}`)
      .expect(200);

    // Verify notification deletion
    const deletedNotification = await TestEnvironment.getNotification(notification.id);
    expect(deletedNotification).toBeNull();

    // Verify push notification cleanup
    const pushStatus = await TestEnvironment.getPushDeliveryStatus(notification.id);
    expect(pushStatus).toBeNull();

    // Verify notification events cleanup
    const events = await TestEnvironment.getNotificationEvents(notification.id);
    expect(events).toHaveLength(0);
  }
}