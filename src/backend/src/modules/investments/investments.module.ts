// @nestjs/common v9.0.0
import { Module } from '@nestjs/common';

// @nestjs/typeorm v9.0.0
import { TypeOrmModule } from '@nestjs/typeorm';

import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { Investment } from './entities/investment.entity';

/**
 * Human Tasks:
 * 1. Configure database connection settings in app module for TypeORM
 * 2. Set up proper logging and monitoring for investment operations
 * 3. Configure appropriate security policies for investment data access
 * 4. Set up backup and disaster recovery procedures for investment data
 * 5. Configure rate limiting and throttling for investment endpoints
 */

/**
 * Module that configures and exports the investments feature
 * 
 * Requirements addressed:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 *   Configures module for basic investment portfolio tracking functionality with 
 *   real-time performance monitoring
 * 
 * - Data Storage (Technical Specification/5.2.3 Service Layer Architecture)
 *   Sets up database integration for investment data persistence with TypeORM
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Investment])
  ],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService]
})
export class InvestmentsModule {}