// Third-party library versions:
// @nestjs/common: ^9.0.0
// @nestjs/bull: ^0.6.0
// bull: ^4.10.0

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { NotificationProcessor } from './processors/notification.processor';
import { SyncProcessor } from './processors/sync.processor';

/**
 * Human Tasks:
 * 1. Configure Redis connection settings in environment variables:
 *    - REDIS_HOST
 *    - REDIS_PORT
 *    - REDIS_PASSWORD (if required)
 * 2. Set up queue monitoring and alerting
 * 3. Configure queue cleanup policies
 * 4. Set up dead letter queues for failed jobs
 * 5. Configure rate limiting for queue operations
 */

/**
 * Module that configures and provides queue functionality for notifications and data synchronization
 * 
 * Requirements addressed:
 * - Message Queue (Technical Specification/5.2.3 Service Layer Architecture/Infrastructure Services)
 *   Configures message queue infrastructure with Bull queue integration
 * 
 * - Real-time notification system (Technical Specification/1.1 System Overview)
 *   Sets up notification queue processing infrastructure with priority-based delivery
 * 
 * - Real-time Data Synchronization (Technical Specification/1.2 Scope/Technical Implementation)
 *   Configures data synchronization queue processing with secure data transmission
 */
@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'notifications',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          },
          removeOnComplete: true,
          priority: 0
        },
        settings: {
          lockDuration: 30000, // 30 seconds
          stalledInterval: 30000,
          maxStalledCount: 3
        },
        limiter: {
          max: 100, // Max jobs processed per time window
          duration: 5000 // Time window in milliseconds
        }
      },
      {
        name: 'sync',
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: true,
          timeout: 300000 // 5 minutes
        },
        settings: {
          lockDuration: 60000, // 60 seconds
          stalledInterval: 60000,
          maxStalledCount: 2
        },
        limiter: {
          max: 50, // Max sync jobs processed per time window
          duration: 10000 // Time window in milliseconds
        }
      }
    )
  ],
  providers: [
    QueueService,
    NotificationProcessor,
    SyncProcessor
  ],
  exports: [
    QueueService
  ]
})
export class QueueModule {}