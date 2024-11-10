/**
 * Human Tasks:
 * 1. Configure database indexes for transaction queries
 * 2. Set up field-level encryption for sensitive transaction data
 * 3. Configure Plaid API credentials in environment
 * 4. Set up ML model for transaction categorization
 * 5. Configure transaction sync schedule in task scheduler
 */

// @nestjs/common v9.0.0
import { Module } from '@nestjs/common';

// @nestjs/typeorm v9.0.0
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';

/**
 * Module that configures and exports the transactions feature
 * 
 * Requirements addressed:
 * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
 *   Configures module for comprehensive transaction tracking and categorization
 *   functionality with secure data handling
 * 
 * - Data Security (Technical Specification/9.2 Data Security)
 *   Sets up secure transaction data handling infrastructure with field-level
 *   encryption and proper access controls
 * 
 * - System Architecture (Technical Specification/5.2.3 Service Layer Architecture)
 *   Implements modular architecture for transaction management following NestJS
 *   best practices and microservices pattern
 */
@Module({
  imports: [
    // Configure TypeORM for Transaction entity with repository pattern
    TypeOrmModule.forFeature([Transaction])
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService]
})
export class TransactionsModule {}