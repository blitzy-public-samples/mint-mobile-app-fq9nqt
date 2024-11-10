// @nestjs/common v9.0.0
import { Module } from '@nestjs/common';
// @nestjs/typeorm v9.0.0
import { TypeOrmModule } from '@nestjs/typeorm';
// @nestjs/bull v0.6.0
import { BullModule } from '@nestjs/bull';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';

/**
 * Human Tasks:
 * 1. Configure Redis connection for Bull queue in environment variables
 * 2. Set up monitoring for notification queue metrics
 * 3. Configure queue cleanup and maintenance policies
 * 4. Set up proper queue concurrency limits
 * 5. Configure queue retry strategies and error handling
 */

/**
 * Module that configures notification system components and dependencies
 * 
 * Requirements addressed:
 * - Real-time notification system (Technical Specification/1.1 System Overview)
 *   Configures the notification system components for real-time alerts and updates
 *   with support for multiple notification types and priority-based delivery
 * 
 * - Push Notification Services (Technical Specification/5.1 High-Level Architecture Overview)
 *   Sets up integration with FCM/APNS for push notifications with comprehensive
 *   delivery tracking and scheduling capabilities
 * 
 * - Notification Service (Technical Specification/5.2.3 Service Layer Architecture)
 *   Configures notification service components and dependencies for secure notification
 *   management, delivery, and persistence
 */
@Module({
  imports: [
    // Configure TypeORM for notification persistence
    TypeOrmModule.forFeature([Notification]),
    
    // Configure Bull queue for notification processing
    BullModule.registerQueue({
      name: 'notifications',
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      },
      limiter: {
        max: 1000, // Maximum number of jobs processed per time window
        duration: 5000, // Time window in milliseconds
        bounceBack: false // Don't retry rate-limited jobs immediately
      }
    })
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule {}