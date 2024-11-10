/**
 * Human Tasks:
 * 1. Configure rate limiting for analytics endpoints
 * 2. Set up monitoring for analytics endpoint performance
 * 3. Configure caching strategy for analytics responses
 * 4. Review and adjust analytics calculation thresholds
 * 5. Set up alerts for abnormal analytics usage patterns
 */

// @nestjs/common v9.0.0
import { Module } from '@nestjs/common';

// @nestjs/typeorm v9.0.0
import { TypeOrmModule } from '@nestjs/typeorm';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { BudgetsModule } from '../budgets/budgets.module';

/**
 * Module that configures analytics and reporting functionality with comprehensive
 * data analysis capabilities and secure operations
 * 
 * Requirements addressed:
 * - Analytics and Reporting Engine (Technical Specification/1.1 System Overview)
 *   Provides financial insights and analytics capabilities through comprehensive
 *   data analysis and visualization
 * 
 * - Data Export and Reporting (Technical Specification/1.2 Scope/Core Features)
 *   Implements data export and reporting capabilities with multiple format support
 *   and secure data handling
 */
@Module({
  imports: [
    // Configure TypeORM feature module for analytics entities
    TypeOrmModule.forFeature(),
    
    // Import TransactionsModule for transaction data access and analysis
    TransactionsModule,
    
    // Import BudgetsModule for budget performance analysis
    BudgetsModule
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService] // Export service for use in other modules
})
export class AnalyticsModule {}