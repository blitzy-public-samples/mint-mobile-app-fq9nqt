// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'; // ^29.0.0
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0

// Internal imports
import { setupTestEnvironment, teardownTestEnvironment } from '../../setup/test-environment';
import { createTestContext } from '../../utils/test-helpers';
import { TestApiClient } from '../../utils/api-client';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test file
 * 2. Ensure test database is properly configured with notifications table
 * 3. Verify test Redis instance is running for real-time notifications
 * 4. Configure test user credentials and permissions
 * 5. Set up test logging directory with write permissions
 */

// Global test configuration
const TEST_API_URL = process.env.TEST_API_URL || 'http://localhost:4000';
const TEST_TIMEOUT = 30000;

// Test context and client
let testContext: any;
let apiClient: TestApiClient;

/**
 * Test suite for notification endpoints
 * Requirements addressed:
 * - Real-time notification system (Technical Specification/1.1 System Overview)
 * - Push Notification Services (Technical Specification/5.1 High-Level Architecture Overview)
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 */
describe('Notification Endpoints', () => {
    // Setup test environment before all tests
    beforeAll(async () => {
        await setupTestEnvironment();
        testContext = createTestContext();
        apiClient = new TestApiClient({
            baseURL: TEST_API_URL,
            timeout: TEST_TIMEOUT
        });
    }, TEST_TIMEOUT);

    // Cleanup test environment after all tests
    afterAll(async () => {
        await teardownTestEnvironment();
    });

    // Reset test state before each test
    beforeEach(async () => {
        // Clear notifications and reset state
        await apiClient.delete('/notifications/test/clear');
        // Refresh authentication token
        const token = await testContext.utils.generateToken();
        apiClient.setAuthToken(token);
    });

    /**
     * Test notification creation endpoint
     * Requirements addressed:
     * - Real-time notification delivery (Technical Specification/1.1 System Overview)
     * - Security validation (Technical Specification/9.3 Security Protocols)
     */
    test('POST /notifications - should create notification', async () => {
        // Prepare test notification data
        const notificationData = {
            type: 'TRANSACTION_ALERT',
            title: 'New Transaction',
            message: 'A new transaction was recorded in your account',
            priority: 'HIGH',
            metadata: {
                transactionId: uuidv4(),
                amount: 100.00,
                category: 'Shopping'
            }
        };

        // Send create notification request
        const response = await apiClient.post('/notifications', notificationData);

        // Verify response
        expect(response.status).toBe(201);
        expect(response.data).toMatchObject({
            id: expect.any(String),
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            priority: notificationData.priority,
            metadata: notificationData.metadata,
            isRead: false,
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
        });

        // Verify security headers
        expect(response.headers['content-security-policy']).toBeDefined();
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-frame-options']).toBe('DENY');
    });

    /**
     * Test retrieving all notifications with pagination
     * Requirements addressed:
     * - Notification management (Technical Specification/1.1 System Overview)
     * - Performance optimization (Technical Specification/5.1 High-Level Architecture Overview)
     */
    test('GET /notifications - should get all notifications', async () => {
        // Create multiple test notifications
        const notifications = await Promise.all([
            apiClient.post('/notifications', {
                type: 'BUDGET_ALERT',
                title: 'Budget Update',
                message: 'You have reached 80% of your monthly budget',
                priority: 'MEDIUM'
            }),
            apiClient.post('/notifications', {
                type: 'SECURITY_ALERT',
                title: 'New Login',
                message: 'New login detected from your account',
                priority: 'HIGH'
            })
        ]);

        // Get notifications with pagination
        const response = await apiClient.get('/notifications?page=1&limit=10');

        // Verify response
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
            items: expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    type: expect.any(String),
                    title: expect.any(String),
                    message: expect.any(String),
                    priority: expect.any(String),
                    isRead: expect.any(Boolean),
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String)
                })
            ]),
            meta: {
                page: 1,
                limit: 10,
                totalItems: expect.any(Number),
                totalPages: expect.any(Number)
            }
        });

        // Verify caching headers
        expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
        expect(response.headers['pragma']).toBe('no-cache');
    });

    /**
     * Test retrieving unread notifications
     * Requirements addressed:
     * - Notification filtering (Technical Specification/1.1 System Overview)
     * - Performance optimization (Technical Specification/5.1 High-Level Architecture Overview)
     */
    test('GET /notifications/unread - should get unread notifications', async () => {
        // Create mix of read/unread notifications
        const notification1 = await apiClient.post('/notifications', {
            type: 'ACCOUNT_ALERT',
            title: 'Account Update',
            message: 'Your account details have been updated',
            priority: 'LOW'
        });

        const notification2 = await apiClient.post('/notifications', {
            type: 'PAYMENT_ALERT',
            title: 'Payment Due',
            message: 'Upcoming payment due tomorrow',
            priority: 'HIGH'
        });

        // Mark one notification as read
        await apiClient.put(`/notifications/${notification1.id}/read`);

        // Get unread notifications
        const response = await apiClient.get('/notifications/unread');

        // Verify response
        expect(response.status).toBe(200);
        expect(response.data.items).toHaveLength(1);
        expect(response.data.items[0]).toMatchObject({
            id: notification2.id,
            isRead: false
        });

        // Verify metadata
        expect(response.data.meta.unreadCount).toBe(1);
    });

    /**
     * Test marking notification as read
     * Requirements addressed:
     * - Notification status management (Technical Specification/1.1 System Overview)
     * - Data persistence (Technical Specification/5.1 High-Level Architecture Overview)
     */
    test('PUT /notifications/:id/read - should mark notification as read', async () => {
        // Create test notification
        const notification = await apiClient.post('/notifications', {
            type: 'GOAL_ALERT',
            title: 'Goal Achievement',
            message: 'You are close to reaching your savings goal',
            priority: 'MEDIUM'
        });

        // Mark notification as read
        const response = await apiClient.put(`/notifications/${notification.id}/read`);

        // Verify response
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
            id: notification.id,
            isRead: true,
            readAt: expect.any(String)
        });

        // Verify persistence
        const updatedNotification = await apiClient.get(`/notifications/${notification.id}`);
        expect(updatedNotification.isRead).toBe(true);
        expect(updatedNotification.readAt).toBeDefined();
    });

    /**
     * Test notification deletion
     * Requirements addressed:
     * - Data management (Technical Specification/1.1 System Overview)
     * - Security validation (Technical Specification/9.3 Security Protocols)
     */
    test('DELETE /notifications/:id - should delete notification', async () => {
        // Create test notification
        const notification = await apiClient.post('/notifications', {
            type: 'SYSTEM_ALERT',
            title: 'System Update',
            message: 'System maintenance scheduled',
            priority: 'LOW'
        });

        // Delete notification
        const response = await apiClient.delete(`/notifications/${notification.id}`);

        // Verify response
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
            success: true,
            message: 'Notification deleted successfully'
        });

        // Verify deletion
        try {
            await apiClient.get(`/notifications/${notification.id}`);
            fail('Should have thrown 404 error');
        } catch (error) {
            expect(error.response.status).toBe(404);
        }

        // Verify audit log
        const auditLog = await apiClient.get(`/audit-logs?entityId=${notification.id}`);
        expect(auditLog.items[0]).toMatchObject({
            action: 'DELETE',
            entityType: 'notification',
            entityId: notification.id
        });
    });
});