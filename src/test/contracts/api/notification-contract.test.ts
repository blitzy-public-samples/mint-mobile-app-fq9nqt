/**
 * Human Tasks:
 * 1. Configure FCM/APNS credentials in test environment variables
 * 2. Set up test notification delivery monitoring
 * 3. Configure test rate limiting thresholds
 * 4. Set up test message queues for notification processing
 * 5. Configure test push notification sandbox environments
 */

// Third-party imports with versions
import { describe, it, beforeAll, afterAll, expect } from '@jest/globals'; // ^29.0.0
import { v4 as uuid } from 'uuid'; // ^9.0.0

// Internal imports
import { CreateNotificationDto, NotificationType, NotificationPriority } from '../../../backend/src/modules/notifications/dto/create-notification.dto';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { TestApiClient } from '../../utils/api-client';

/**
 * Requirements addressed:
 * - Real-time notification system (Technical Specification/1.1 System Overview)
 * - Push Notification Services (Technical Specification/5.1 High-Level Architecture Overview)
 * - Notification Service (Technical Specification/5.2.3 Service Layer Architecture)
 */

describe('Notification API Contract Tests', () => {
    let testEnv: { db: any; api: TestApiClient; auth: { token: string } };
    let testUserId: string;

    beforeAll(async () => {
        // Initialize test environment with database and authentication
        testEnv = await setupTestEnvironment();
        testUserId = uuid();
    });

    afterAll(async () => {
        // Clean up test resources
        await cleanupTestEnvironment(testEnv);
    });

    describe('POST /api/notifications', () => {
        it('should create a notification with valid payload', async () => {
            // Arrange
            const notificationPayload: CreateNotificationDto = {
                userId: testUserId,
                type: NotificationType.BUDGET_ALERT,
                title: 'Budget Alert',
                message: 'You have exceeded your monthly budget limit',
                priority: NotificationPriority.HIGH,
                data: JSON.stringify({ budgetId: uuid(), category: 'groceries' }),
                scheduledAt: new Date(Date.now() + 3600000) // 1 hour from now
            };

            // Act
            const response = await testEnv.api.post('/api/notifications', notificationPayload);

            // Assert
            expect(response).toBeDefined();
            expect(response.id).toBeDefined();
            expect(response.createdAt).toBeDefined();
            expect(response.userId).toBe(testUserId);
            expect(response.type).toBe(notificationPayload.type);
            expect(response.title).toBe(notificationPayload.title);
            expect(response.message).toBe(notificationPayload.message);
            expect(response.priority).toBe(notificationPayload.priority);
            expect(JSON.parse(response.data)).toEqual(JSON.parse(notificationPayload.data));
            expect(new Date(response.scheduledAt)).toEqual(notificationPayload.scheduledAt);
            expect(response.status).toBe('PENDING');
            expect(response.deliveredAt).toBeNull();
        });

        it('should validate required notification fields', async () => {
            // Arrange
            const invalidPayload = {
                userId: testUserId,
                // Missing required fields
                message: 'Test message'
            };

            // Act & Assert
            await expect(testEnv.api.post('/api/notifications', invalidPayload))
                .rejects
                .toThrow(/validation failed/i);
        });

        it('should enforce notification type enum values', async () => {
            // Arrange
            const invalidPayload = {
                userId: testUserId,
                type: 'INVALID_TYPE',
                title: 'Test',
                message: 'Test message',
                priority: NotificationPriority.MEDIUM
            };

            // Act & Assert
            await expect(testEnv.api.post('/api/notifications', invalidPayload))
                .rejects
                .toThrow(/invalid notification type/i);
        });
    });

    describe('GET /api/notifications', () => {
        it('should retrieve paginated notifications list', async () => {
            // Arrange
            const page = 1;
            const limit = 10;

            // Act
            const response = await testEnv.api.get(`/api/notifications?page=${page}&limit=${limit}`);

            // Assert
            expect(response).toBeDefined();
            expect(response.items).toBeInstanceOf(Array);
            expect(response.meta).toBeDefined();
            expect(response.meta.page).toBe(page);
            expect(response.meta.limit).toBe(limit);
            expect(response.meta.totalItems).toBeDefined();
            expect(response.meta.totalPages).toBeDefined();
        });

        it('should filter notifications by type', async () => {
            // Arrange
            const type = NotificationType.TRANSACTION_ALERT;

            // Act
            const response = await testEnv.api.get(`/api/notifications?type=${type}`);

            // Assert
            expect(response.items).toBeInstanceOf(Array);
            response.items.forEach((notification: any) => {
                expect(notification.type).toBe(type);
            });
        });
    });

    describe('GET /api/notifications/unread', () => {
        it('should retrieve unread notifications', async () => {
            // Act
            const response = await testEnv.api.get('/api/notifications/unread');

            // Assert
            expect(response).toBeDefined();
            expect(response.items).toBeInstanceOf(Array);
            response.items.forEach((notification: any) => {
                expect(notification.readAt).toBeNull();
            });
        });

        it('should support real-time updates for unread notifications', async () => {
            // Arrange
            const notificationPayload: CreateNotificationDto = {
                userId: testUserId,
                type: NotificationType.SECURITY_ALERT,
                title: 'Security Alert',
                message: 'New device login detected',
                priority: NotificationPriority.URGENT
            };

            // Act
            const createdNotification = await testEnv.api.post('/api/notifications', notificationPayload);
            const unreadResponse = await testEnv.api.get('/api/notifications/unread');

            // Assert
            expect(unreadResponse.items).toContainEqual(
                expect.objectContaining({ id: createdNotification.id })
            );
        });
    });

    describe('PATCH /api/notifications/:id/read', () => {
        it('should mark notification as read', async () => {
            // Arrange
            const notification = await testEnv.api.post('/api/notifications', {
                userId: testUserId,
                type: NotificationType.SYSTEM_UPDATE,
                title: 'System Update',
                message: 'New features available',
                priority: NotificationPriority.LOW
            });

            // Act
            const response = await testEnv.api.patch(`/api/notifications/${notification.id}/read`);

            // Assert
            expect(response).toBeDefined();
            expect(response.id).toBe(notification.id);
            expect(response.readAt).toBeDefined();
            expect(new Date(response.readAt)).toBeInstanceOf(Date);
        });

        it('should handle marking already read notifications', async () => {
            // Arrange
            const notification = await testEnv.api.post('/api/notifications', {
                userId: testUserId,
                type: NotificationType.SYSTEM_UPDATE,
                title: 'System Update',
                message: 'New features available',
                priority: NotificationPriority.LOW
            });
            await testEnv.api.patch(`/api/notifications/${notification.id}/read`);

            // Act & Assert
            await expect(testEnv.api.patch(`/api/notifications/${notification.id}/read`))
                .rejects
                .toThrow(/notification already read/i);
        });
    });

    describe('DELETE /api/notifications/:id', () => {
        it('should delete notification', async () => {
            // Arrange
            const notification = await testEnv.api.post('/api/notifications', {
                userId: testUserId,
                type: NotificationType.SYSTEM_UPDATE,
                title: 'System Update',
                message: 'New features available',
                priority: NotificationPriority.LOW
            });

            // Act
            await testEnv.api.delete(`/api/notifications/${notification.id}`);

            // Assert
            await expect(testEnv.api.get(`/api/notifications/${notification.id}`))
                .rejects
                .toThrow(/notification not found/i);
        });

        it('should handle deleting non-existent notifications', async () => {
            // Arrange
            const nonExistentId = uuid();

            // Act & Assert
            await expect(testEnv.api.delete(`/api/notifications/${nonExistentId}`))
                .rejects
                .toThrow(/notification not found/i);
        });
    });
});