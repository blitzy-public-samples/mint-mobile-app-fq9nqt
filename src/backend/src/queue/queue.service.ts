// Third-party library versions:
// @nestjs/common: ^9.0.0
// @nestjs/bull: ^0.6.0
// bull: ^4.10.0

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job, JobOptions } from 'bull';
import { NotificationProcessor } from './processors/notification.processor';
import { SyncProcessor } from './processors/sync.processor';

/**
 * Human Tasks:
 * 1. Configure Redis connection settings in environment variables
 * 2. Set up queue monitoring and alerting
 * 3. Configure queue cleanup policies
 * 4. Set up dead letter queues for failed jobs
 * 5. Configure rate limiting for queue operations
 */

interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  isPaused: boolean;
}

/**
 * Service that manages queue operations for notifications and data synchronization
 * 
 * Requirements addressed:
 * - Message Queue (Technical Specification/5.2.3 Service Layer Architecture/Infrastructure Services)
 *   Implements queue management with Bull queue integration
 * 
 * - Real-time notification system (Technical Specification/1.1 System Overview)
 *   Manages queuing of real-time alerts with priority handling
 * 
 * - Real-time Data Synchronization (Technical Specification/1.2 Scope/Technical Implementation)
 *   Handles queuing of data synchronization tasks with error handling and retry mechanisms
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
    @InjectQueue('sync') private readonly syncQueue: Queue
  ) {
    this.logger.log('Queue service initialized');
  }

  /**
   * Adds a notification job to the queue with priority handling
   * 
   * @param data - Notification data to be processed
   * @param options - Optional Bull queue job options
   * @returns Created notification job instance
   */
  async addNotificationJob(data: any, options?: JobOptions): Promise<Job> {
    const correlationId = `notification-${Date.now()}`;
    
    this.logger.debug({
      message: 'Adding notification job to queue',
      correlationId,
      type: data.type,
      priority: options?.priority
    });

    try {
      // Validate notification data
      this.validateNotificationData(data);

      // Set default options for notification jobs
      const jobOptions: JobOptions = {
        priority: this.getNotificationPriority(data.type),
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: true,
        ...options
      };

      // Add job to notification queue
      const job = await this.notificationQueue.add('send', {
        ...data,
        timestamp: new Date(),
        correlationId
      }, jobOptions);

      this.logger.log({
        message: 'Notification job added successfully',
        jobId: job.id,
        correlationId
      });

      return job;

    } catch (error) {
      this.logger.error({
        message: 'Failed to add notification job',
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Adds a sync job to the queue with secure data handling
   * 
   * @param data - Sync data to be processed
   * @param options - Optional Bull queue job options
   * @returns Created sync job instance
   */
  async addSyncJob(data: any, options?: JobOptions): Promise<Job> {
    const jobId = `sync-${Date.now()}`;
    
    this.logger.debug({
      message: 'Adding sync job to queue',
      jobId,
      entityType: data.entityType,
      deviceId: data.deviceId
    });

    try {
      // Validate sync data
      this.validateSyncData(data);

      // Set default options for sync jobs
      const jobOptions: JobOptions = {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        timeout: 300000, // 5 minutes
        removeOnComplete: false,
        ...options
      };

      // Add job to sync queue
      const job = await this.syncQueue.add({
        ...data,
        timestamp: new Date(),
        jobId
      }, jobOptions);

      this.logger.log({
        message: 'Sync job added successfully',
        jobId: job.id,
        entityType: data.entityType
      });

      return job;

    } catch (error) {
      this.logger.error({
        message: 'Failed to add sync job',
        jobId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Removes a job from the specified queue
   * 
   * @param queueName - Name of the queue (notifications or sync)
   * @param jobId - ID of the job to remove
   */
  async removeJob(queueName: string, jobId: string): Promise<void> {
    this.logger.debug({
      message: 'Removing job from queue',
      queueName,
      jobId
    });

    try {
      const queue = this.getQueueByName(queueName);
      const job = await queue.getJob(jobId);

      if (!job) {
        throw new Error(`Job ${jobId} not found in queue ${queueName}`);
      }

      await job.remove();

      this.logger.log({
        message: 'Job removed successfully',
        queueName,
        jobId
      });

    } catch (error) {
      this.logger.error({
        message: 'Failed to remove job',
        queueName,
        jobId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Gets current status and metrics for the specified queue
   * 
   * @param queueName - Name of the queue to get status for
   * @returns Detailed queue metrics and health status
   */
  async getQueueStatus(queueName: string): Promise<QueueStatus> {
    this.logger.debug({
      message: 'Getting queue status',
      queueName
    });

    try {
      const queue = this.getQueueByName(queueName);

      // Get queue metrics
      const [
        waiting,
        active,
        completed,
        failed,
        delayed,
        isPaused
      ] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.isPaused()
      ]);

      const status: QueueStatus = {
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused: isPaused,
        isPaused
      };

      this.logger.debug({
        message: 'Queue status retrieved',
        queueName,
        metrics: status
      });

      return status;

    } catch (error) {
      this.logger.error({
        message: 'Failed to get queue status',
        queueName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Gets queue instance by name
   */
  private getQueueByName(queueName: string): Queue {
    switch (queueName) {
      case 'notifications':
        return this.notificationQueue;
      case 'sync':
        return this.syncQueue;
      default:
        throw new Error(`Invalid queue name: ${queueName}`);
    }
  }

  /**
   * Validates notification job data
   */
  private validateNotificationData(data: any): void {
    const requiredFields = ['type', 'userId', 'title', 'message'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!['PUSH', 'EMAIL', 'SMS', 'IN_APP'].includes(data.type)) {
      throw new Error(`Invalid notification type: ${data.type}`);
    }
  }

  /**
   * Validates sync job data
   */
  private validateSyncData(data: any): void {
    const requiredFields = ['userId', 'deviceId', 'entityType', 'changes'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(data.changes)) {
      throw new Error('Changes must be an array');
    }
  }

  /**
   * Determines notification priority based on type
   */
  private getNotificationPriority(type: string): number {
    const priorities = {
      PUSH: 1,
      EMAIL: 2,
      SMS: 1,
      IN_APP: 3
    };

    return priorities[type] || 3;
  }
}