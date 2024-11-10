// Third-party library versions:
// @nestjs/bull: ^0.6.0
// @nestjs/common: ^9.0.0
// bull: ^4.10.0

import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SyncService } from '../../modules/sync/sync.service';

/**
 * Human Tasks:
 * 1. Configure Redis connection for Bull queue
 * 2. Set up monitoring for queue metrics
 * 3. Configure queue retry policies
 * 4. Set up alerts for failed jobs
 * 5. Configure queue cleanup policies
 */

interface SyncJobData {
  userId: string;
  deviceId: string;
  entityType: string;
  lastSyncTimestamp: Date;
  changes: any[];
  isFinancialSync?: boolean;
  accountId?: string;
}

/**
 * Queue processor responsible for handling asynchronous data synchronization jobs
 * Requirements addressed:
 * - Real-time Data Synchronization
 * - Message Queue
 * - Third-party integrations
 * - Data Security
 */
@Injectable()
@Processor('sync')
export class SyncProcessor {
  private readonly logger: Logger;

  constructor(private readonly syncService: SyncService) {
    this.logger = new Logger('SyncProcessor');
  }

  /**
   * Processes sync jobs from the queue with secure data handling
   * Requirements addressed:
   * - Real-time Data Synchronization
   * - Data Security
   */
  @Process()
  async process(job: Job<SyncJobData>): Promise<void> {
    try {
      this.logger.log(`Processing sync job ${job.id} for device ${job.data.deviceId}`);

      // Update job progress
      await job.progress(10);

      // Validate job data structure
      this.validateJobData(job.data);

      // Update job progress
      await job.progress(20);

      if (job.data.isFinancialSync && job.data.accountId) {
        // Handle financial data synchronization
        await this.syncService.syncFinancialData(
          job.data.userId,
          job.data.accountId
        );
      } else {
        // Handle regular data synchronization
        await this.syncService.synchronize({
          deviceId: job.data.deviceId,
          userId: job.data.userId,
          entityType: job.data.entityType,
          lastSyncTimestamp: job.data.lastSyncTimestamp,
          changes: job.data.changes
        });
      }

      // Update job progress to complete
      await job.progress(100);

      this.logger.log(`Successfully completed sync job ${job.id}`);
    } catch (error) {
      this.logger.error(`Error processing sync job ${job.id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handles sync job failures with proper error reporting
   * Requirements addressed:
   * - Message Queue
   * - Data Security
   */
  @OnQueueFailed()
  async handleFailure(job: Job<SyncJobData>, error: Error): Promise<void> {
    this.logger.error(
      `Failed to process sync job ${job.id} for device ${job.data.deviceId}`,
      error.stack
    );

    // Determine if job should be retried based on error type
    const shouldRetry = this.shouldRetryJob(error);

    if (shouldRetry && job.attemptsMade < job.opts.attempts) {
      this.logger.log(
        `Scheduling retry for job ${job.id}. Attempt ${job.attemptsMade + 1} of ${job.opts.attempts}`
      );
      return;
    }

    // Update job metadata with error details
    await job.updateProgress(100);
    await job.update({
      ...job.data,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date()
      }
    });

    // Emit error metrics for monitoring
    this.emitErrorMetrics(job, error);

    // Handle cleanup of any partial sync state
    await this.cleanupFailedSync(job.data);
  }

  /**
   * Validates the structure of the sync job data
   */
  private validateJobData(data: SyncJobData): void {
    if (!data.userId || !data.deviceId || !data.entityType) {
      throw new Error('Invalid job data: missing required fields');
    }

    if (data.isFinancialSync && !data.accountId) {
      throw new Error('Invalid job data: financial sync requires accountId');
    }

    if (!Array.isArray(data.changes)) {
      throw new Error('Invalid job data: changes must be an array');
    }

    if (!(data.lastSyncTimestamp instanceof Date)) {
      throw new Error('Invalid job data: invalid lastSyncTimestamp');
    }
  }

  /**
   * Determines if a failed job should be retried based on the error type
   */
  private shouldRetryJob(error: Error): boolean {
    // Retry on network or temporary errors
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'NETWORK_ERROR',
      'REDIS_ERROR'
    ];

    return retryableErrors.some(errorType => 
      error.message.includes(errorType)
    );
  }

  /**
   * Emits error metrics for monitoring systems
   */
  private emitErrorMetrics(job: Job<SyncJobData>, error: Error): void {
    // Implementation would depend on monitoring system
    this.logger.log(`Emitting error metrics for job ${job.id}`);
  }

  /**
   * Cleans up any partial sync state after a failed job
   */
  private async cleanupFailedSync(jobData: SyncJobData): Promise<void> {
    try {
      this.logger.log(`Cleaning up failed sync for device ${jobData.deviceId}`);
      // Implementation would depend on the specific cleanup requirements
      // For example, rolling back partial changes or marking entities as requiring re-sync
    } catch (cleanupError) {
      this.logger.error(
        `Error during cleanup of failed sync: ${cleanupError.message}`
      );
    }
  }
}