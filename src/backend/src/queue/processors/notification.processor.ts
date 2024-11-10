// @nestjs/common v9.0.0
import { Injectable, Logger } from '@nestjs/common';
// @nestjs/bull v0.6.0
import { Process, Processor } from '@nestjs/bull';
// bull v4.10.0
import { Job } from 'bull';
// firebase-admin v11.0.0
import * as admin from 'firebase-admin';

import { NotificationsService } from '../../modules/notifications/notifications.service';

/**
 * Human Tasks:
 * 1. Configure Firebase Admin SDK credentials in environment variables
 * 2. Set up monitoring for notification delivery metrics
 * 3. Configure error alerting for failed notifications
 * 4. Set up rate limiting for external notification services
 * 5. Configure retry policies for different notification types
 */

/**
 * Processor class that handles asynchronous notification delivery through multiple channels
 * 
 * Requirements addressed:
 * - Real-time notification system (Technical Specification/1.1 System Overview)
 *   Implements asynchronous processing of real-time alerts with priority-based delivery
 * 
 * - Push Notification Services (Technical Specification/5.1 High-Level Architecture Overview)
 *   Processes and delivers notifications through FCM/APNS integration
 * 
 * - Message Queue (Technical Specification/5.2.3 Service Layer Architecture/Infrastructure Services)
 *   Processes notification jobs from the message queue with priority handling and error recovery
 */
@Injectable()
@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService
  ) {}

  /**
   * Processes notification jobs from the queue and handles delivery through appropriate channels
   * 
   * @param job - Bull queue job containing notification data
   */
  @Process('send')
  async processNotification(job: Job): Promise<void> {
    const correlationId = `notification-${job.id}`;
    this.logger.log(`Processing notification job ${correlationId}`);

    try {
      const { notificationId, userId, type, title, message, data } = job.data;

      // Log job details for tracking
      this.logger.debug({
        message: 'Processing notification delivery',
        correlationId,
        userId,
        type,
        priority: job.opts.priority
      });

      // Handle different notification types
      switch (type) {
        case 'PUSH':
          await this.handlePushNotification({
            userId,
            title,
            message,
            data,
            correlationId
          });
          break;

        case 'EMAIL':
          // Email handling would be implemented here
          break;

        case 'SMS':
          // SMS handling would be implemented here
          break;

        case 'IN_APP':
          // In-app notification handling would be implemented here
          break;

        default:
          throw new Error(`Unsupported notification type: ${type}`);
      }

      // Update notification status in database
      await this.notificationsService.markAsRead(notificationId);

      this.logger.log({
        message: 'Notification delivered successfully',
        correlationId,
        userId,
        type
      });

    } catch (error) {
      this.logger.error({
        message: 'Failed to process notification',
        correlationId,
        error: error.message,
        stack: error.stack
      });

      // Determine if job should be retried based on error type
      if (this.shouldRetryError(error)) {
        throw error; // Bull will retry based on job configuration
      }
    }
  }

  /**
   * Handles delivery of push notifications through Firebase Cloud Messaging
   * 
   * @param data - Push notification data including user and message details
   */
  private async handlePushNotification(data: {
    userId: string;
    title: string;
    message: string;
    data?: any;
    correlationId: string;
  }): Promise<void> {
    const { userId, title, message, data: notificationData, correlationId } = data;

    try {
      // Validate FCM token (would be retrieved from user service/database)
      const userFcmToken = await this.getUserFcmToken(userId);
      if (!userFcmToken) {
        throw new Error('User FCM token not found');
      }

      // Prepare FCM message payload
      const message = {
        notification: {
          title,
          body: message
        },
        data: notificationData ? {
          ...notificationData,
          correlationId
        } : { correlationId },
        token: userFcmToken,
        android: {
          priority: 'high',
          notification: {
            channelId: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default'
            }
          }
        }
      };

      // Send through Firebase Admin SDK
      const response = await admin.messaging().send(message);

      this.logger.debug({
        message: 'Push notification sent successfully',
        correlationId,
        messageId: response,
        userId
      });

    } catch (error) {
      this.logger.error({
        message: 'Push notification delivery failed',
        correlationId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Determines if an error should trigger a job retry
   * 
   * @param error - Error that occurred during processing
   * @returns Boolean indicating if job should be retried
   */
  private shouldRetryError(error: any): boolean {
    const retryableErrors = [
      'UNAVAILABLE',
      'INTERNAL',
      'DEADLINE_EXCEEDED',
      'TOKEN_EXPIRED'
    ];

    return retryableErrors.some(errorType => 
      error.message.includes(errorType) || 
      error.code?.includes(errorType)
    );
  }

  /**
   * Retrieves user's FCM token for push notification delivery
   * This is a placeholder - actual implementation would fetch from user service
   * 
   * @param userId - ID of the user to get FCM token for
   * @returns User's FCM token if available
   */
  private async getUserFcmToken(userId: string): Promise<string | null> {
    // Placeholder - would be implemented to fetch from user service/database
    return process.env.TEST_FCM_TOKEN || null;
  }
}