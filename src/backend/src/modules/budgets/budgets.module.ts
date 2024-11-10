/**
 * Human Tasks:
 * 1. Configure database connection settings for TypeORM
 * 2. Set up proper database indexes for budget queries
 * 3. Configure monitoring for budget tracking performance
 * 4. Set up data retention policies for budget history
 */

import { Module } from '@nestjs/common'; // ^9.0.0
import { TypeOrmModule } from '@nestjs/typeorm'; // ^9.0.0
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { Budget } from './entities/budget.entity';

/**
 * Module that configures budget management functionality with proper dependency injection
 * and database integration
 * 
 * Requirements addressed:
 * - Budget Creation and Monitoring (Technical Specification/1.2 Scope/Core Features)
 *   Configures module for budget creation and monitoring functionality with category-based tracking
 * 
 * - Budget Service Architecture (Technical Specification/5.2.3 Service Layer Architecture)
 *   Implements budget service layer in the microservices architecture with proper dependency injection
 *   and database integration
 */
@Module({
  imports: [
    // Configure TypeORM for Budget entity with repository pattern
    TypeOrmModule.forFeature([Budget])
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService] // Export service for use in other modules
})
export class BudgetsModule {}