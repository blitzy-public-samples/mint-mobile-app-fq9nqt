// @jest/globals v29.0.0
import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
// supertest v6.3.0
import supertest from 'supertest';
// aws-sdk v2.1400.0
import { SES } from 'aws-sdk';

import { NotificationsService } from '../../../backend/src/modules/notifications/notifications.service';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser } from '../../utils/mock-data';

/**
 * Human Tasks:
 * 1. Configure AWS SES credentials in test environment
 * 2. Set up SES sandbox environment for testing
 * 3. Verify test email addresses in SES
 * 4. Configure SES sending quotas and limits
 * 5. Set up email bounce and complaint handling
 */

describe('Email Notification Integration Tests', () => {
  let testEnv: any;
  let notificationsService: NotificationsService;
  let ses: SES;
  let testUser: any;
  let testEmailAddress: string;

  // Set up test environment before all tests
  beforeAll(async () => {
    // Initialize test environment with database and services
    testEnv = await setupTestEnvironment({
      services: ['notifications'],
      aws: {
        region: process.env.AWS_REGION || 'us-east-1'
      }
    });

    // Initialize AWS SES client
    ses = new SES({
      apiVersion: '2010-12-01',
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });

    // Create test user and verify email
    testUser = await createMockUser();
    testEmailAddress = testUser.email;

    // Verify test email in SES sandbox if needed
    if (process.env.NODE_ENV === 'test') {
      await ses.verifyEmailIdentity({
        EmailAddress: testEmailAddress
      }).promise();
    }

    // Get notifications service instance
    notificationsService = testEnv.app.get(NotificationsService);
  });

  // Clean up test environment after all tests
  afterAll(async () => {
    // Remove test email verification if in sandbox
    if (process.env.NODE_ENV === 'test') {
      await ses.deleteIdentity({
        Identity: testEmailAddress
      }).promise();
    }

    // Clean up test environment
    await cleanupTestEnvironment(testEnv);
  });

  // Test successful email notification delivery
  it('should deliver email notifications successfully', async () => {
    // Requirements addressed: Email delivery (Technical Specification/7.4 Third-Party Services)
    const testNotification = {
      userId: testUser.id,
      type: 'EMAIL',
      title: 'Test Notification',
      message: 'This is a test email notification',
      priority: 'HIGH',
      data: JSON.stringify({
        templateId: 'TEST_TEMPLATE',
        variables: {
          userName: testUser.firstName
        }
      })
    };

    // Create notification
    const notification = await notificationsService.create(testNotification);
    expect(notification).toBeDefined();
    expect(notification.id).toBeDefined();

    // Wait for email delivery (with timeout)
    const emailDelivered = await new Promise((resolve) => {
      const checkDelivery = async () => {
        try {
          const result = await ses.getSendStatistics().promise();
          const recentDeliveries = result.SendDataPoints.filter(point => 
            point.Timestamp > new Date(Date.now() - 5000)
          );
          return recentDeliveries.some(point => point.DeliveryAttempts > 0);
        } catch (error) {
          return false;
        }
      };

      let attempts = 0;
      const interval = setInterval(async () => {
        if (await checkDelivery() || attempts >= 10) {
          clearInterval(interval);
          resolve(attempts < 10);
        }
        attempts++;
      }, 1000);
    });

    expect(emailDelivered).toBe(true);

    // Verify notification status update
    const updatedNotification = await notificationsService.findAll(testUser.id);
    expect(updatedNotification[0].sentAt).toBeDefined();
    expect(updatedNotification[0].status).toBe('DELIVERED');
  });

  // Test email template rendering with dynamic content
  it('should render email templates correctly with dynamic content', async () => {
    // Requirements addressed: Notification Service (Technical Specification/5.2.3 Service Layer Architecture)
    const templateVariables = {
      userName: testUser.firstName,
      accountBalance: '$1,000.00',
      transactionDate: new Date().toLocaleDateString()
    };

    const testNotification = {
      userId: testUser.id,
      type: 'EMAIL',
      title: 'Account Update',
      message: 'Your account balance has been updated',
      priority: 'MEDIUM',
      data: JSON.stringify({
        templateId: 'ACCOUNT_UPDATE',
        variables: templateVariables
      })
    };

    // Create notification with template
    const notification = await notificationsService.create(testNotification);
    expect(notification).toBeDefined();

    // Verify template rendering
    const emailContent = await new Promise<string>((resolve) => {
      ses.sendEmail({
        Source: process.env.SES_FROM_EMAIL!,
        Destination: {
          ToAddresses: [testEmailAddress]
        },
        Message: {
          Subject: {
            Data: notification.title
          },
          Body: {
            Html: {
              Data: notification.message
            }
          }
        }
      }).promise()
        .then(() => resolve(notification.message));
    });

    // Check template variable substitution
    Object.entries(templateVariables).forEach(([key, value]) => {
      expect(emailContent).toContain(value);
    });
  });

  // Test email delivery retry mechanism
  it('should handle email delivery failures and implement retry logic', async () => {
    // Requirements addressed: Real-time notification system (Technical Specification/1.1 System Overview)
    const testNotification = {
      userId: testUser.id,
      type: 'EMAIL',
      title: 'Retry Test',
      message: 'Testing delivery retry mechanism',
      priority: 'HIGH'
    };

    // Temporarily disable SES to simulate failure
    const originalSendEmail = ses.sendEmail;
    let attempts = 0;
    ses.sendEmail = () => ({
      promise: () => new Promise((resolve, reject) => {
        attempts++;
        if (attempts < 3) {
          reject(new Error('Simulated failure'));
        } else {
          resolve({});
        }
      })
    })) as any;

    // Create notification
    const notification = await notificationsService.create(testNotification);
    expect(notification).toBeDefined();

    // Wait for retry attempts
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify retry attempts
    expect(attempts).toBeGreaterThanOrEqual(3);

    // Restore original SES function
    ses.sendEmail = originalSendEmail;
  });

  // Test handling of bounced emails
  it('should process email bounces appropriately', async () => {
    // Requirements addressed: Email delivery (Technical Specification/7.4 Third-Party Services)
    const testNotification = {
      userId: testUser.id,
      type: 'EMAIL',
      title: 'Bounce Test',
      message: 'Testing bounce handling',
      priority: 'MEDIUM'
    };

    // Create notification
    const notification = await notificationsService.create(testNotification);

    // Simulate bounce notification from SES
    const bounceNotification = {
      notificationType: 'Bounce',
      bounce: {
        bounceType: 'Permanent',
        bounceSubType: 'General',
        bouncedRecipients: [{ emailAddress: testEmailAddress }],
        timestamp: new Date().toISOString(),
        feedbackId: 'test-feedback-id'
      }
    };

    // Send bounce notification to API
    await supertest(testEnv.app)
      .post('/api/notifications/ses-webhook')
      .send(bounceNotification)
      .expect(200);

    // Verify notification status update
    const updatedNotification = await notificationsService.findAll(testUser.id);
    expect(updatedNotification[0].status).toBe('BOUNCED');
    expect(updatedNotification[0].metadata.bounceData).toBeDefined();
  });
});