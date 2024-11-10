// @nestjs/common ^9.0.0
import { Module } from '@nestjs/common';
// @nestjs/typeorm ^9.0.0
import { TypeOrmModule } from '@nestjs/typeorm';
// @nestjs/event-emitter ^1.0.0
import { EventEmitterModule } from '@nestjs/event-emitter';

import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { Goal } from './entities/goal.entity';

/**
 * Human Tasks:
 * 1. Ensure TypeORM is properly configured in app.module.ts
 * 2. Configure EventEmitter options in app.module.ts for goal notifications
 * 3. Set up appropriate database indices for goals table
 * 4. Configure event handlers for goal-related notifications
 */

/**
 * NestJS module that configures and exports the goals feature module
 * 
 * Requirements addressed:
 * - Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
 *   Provides module configuration for financial goal setting and progress monitoring
 *   functionality with support for target amounts, deadlines, and real-time notifications
 * 
 * - System Components Architecture (Technical Specification/5.2 Component Architecture)
 *   Implements modular architecture for the goals management component following
 *   NestJS best practices and microservices pattern
 * 
 * - Real-time Notifications (Technical Specification/1.1 System Overview)
 *   Integrates event emitter for real-time goal progress and achievement notifications
 */
@Module({
  imports: [
    // Register Goal entity with TypeORM
    TypeOrmModule.forFeature([Goal]),
    // Import EventEmitter for goal notifications
    EventEmitterModule
  ],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [] // Module is self-contained, no exports needed
})
export class GoalsModule {}