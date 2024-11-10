// Third-party library versions:
// @nestjs/common: ^9.0.0
// @nestjs/typeorm: ^9.0.0

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { QueueModule } from '../../queue/queue.module';
import { Account } from '../accounts/entities/account.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { Goal } from '../goals/entities/goal.entity';

/**
 * Human Tasks:
 * 1. Configure environment variables for database connection
 * 2. Set up monitoring for sync operations
 * 3. Configure rate limiting for sync endpoints
 * 4. Set up backup procedures for sync data
 * 5. Configure client version compatibility checks
 */

/**
 * Module that configures and provides data synchronization functionality
 * with offline-first support and secure data transmission
 * 
 * Requirements addressed:
 * - Real-time Data Synchronization (Technical Specification/1.1 System Overview/Core Components)
 *   Implements real-time data synchronization between mobile clients and backend
 * 
 * - Offline Support (Technical Specification/5.2.1 Mobile Applications)
 *   Enables offline-first functionality with data synchronization
 * 
 * - Data Security (Technical Specification/9.2 Data Security)
 *   Ensures secure data transmission and storage during sync using AES-256-GCM encryption
 */
@Module({
  imports: [
    // Register TypeORM entities for synchronization
    TypeOrmModule.forFeature([
      Account,
      Transaction,
      Budget,
      Goal
    ]),
    // Import QueueModule for async operations with retry strategies
    QueueModule
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService]
})
export class SyncModule {}