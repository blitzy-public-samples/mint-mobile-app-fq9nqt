// @nestjs/common ^9.0.0
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// @nestjs/typeorm ^9.0.0
import { InjectRepository } from '@nestjs/typeorm';
// typeorm ^0.3.0
import { Repository } from 'typeorm';
// @nestjs/event-emitter ^1.0.0
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Goal } from './entities/goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { formatDate } from '../../common/utils/date.util';

/**
 * Human Tasks:
 * 1. Configure event emitter module in app.module.ts
 * 2. Set up appropriate database indices for userId and status columns
 * 3. Configure notification handlers for goal-related events
 * 4. Set up automated cleanup jobs for completed/cancelled goals
 * 5. Configure currency precision settings in environment
 */

/**
 * Service implementing financial goal management business logic
 * 
 * Requirements addressed:
 * - Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
 *   Implements comprehensive goal management with progress tracking
 * - Data Security (Technical Specification/9.2 Data Security/9.2.2 Data Classification)
 *   Ensures secure handling of financial goal data with user-based access control
 * - Real-time Notifications (Technical Specification/1.1 System Overview)
 *   Emits events for goal-related activities enabling real-time updates
 */
@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Creates a new financial goal for a user
   */
  async create(userId: string, createGoalDto: CreateGoalDto): Promise<Goal> {
    const goal = this.goalRepository.create({
      userId,
      ...createGoalDto,
      status: 'active',
      currentAmount: 0,
      metadata: {
        createdAt: formatDate(new Date()),
        lastProgressUpdate: null
      }
    });

    const savedGoal = await this.goalRepository.save(goal);

    this.eventEmitter.emit('goal.created', {
      userId,
      goalId: savedGoal.id,
      goalName: savedGoal.name,
      targetAmount: savedGoal.targetAmount,
      targetDate: savedGoal.targetDate
    });

    return savedGoal;
  }

  /**
   * Retrieves all goals for a specific user
   */
  async findAll(userId: string): Promise<Goal[]> {
    return this.goalRepository.find({
      where: { userId },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  /**
   * Retrieves a specific goal by ID with user ownership validation
   */
  async findOne(userId: string, goalId: string): Promise<Goal> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, userId }
    });

    if (!goal) {
      throw new NotFoundException('Goal not found or unauthorized access');
    }

    return goal;
  }

  /**
   * Updates an existing goal with validation and notification
   */
  async update(userId: string, goalId: string, updateGoalDto: UpdateGoalDto): Promise<Goal> {
    const goal = await this.findOne(userId, goalId);

    // Check if goal is already completed or cancelled
    if (goal.status !== 'active' && !updateGoalDto.status) {
      throw new BadRequestException('Cannot update completed or cancelled goals');
    }

    // Update goal properties
    Object.assign(goal, updateGoalDto);

    // Check if goal is completed based on current amount
    if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
      goal.status = 'completed';
      this.eventEmitter.emit('goal.completed', {
        userId,
        goalId: goal.id,
        goalName: goal.name,
        achievedAmount: goal.currentAmount,
        completedAt: formatDate(new Date())
      });
    }

    const updatedGoal = await this.goalRepository.save(goal);

    this.eventEmitter.emit('goal.updated', {
      userId,
      goalId: updatedGoal.id,
      goalName: updatedGoal.name,
      changes: updateGoalDto
    });

    return updatedGoal;
  }

  /**
   * Updates the progress of a goal with completion check
   */
  async updateProgress(userId: string, goalId: string, amount: number): Promise<Goal> {
    const goal = await this.findOne(userId, goalId);

    if (goal.status !== 'active') {
      throw new BadRequestException('Cannot update progress of inactive goals');
    }

    if (amount < 0) {
      throw new BadRequestException('Progress amount cannot be negative');
    }

    const previousAmount = goal.currentAmount;
    goal.currentAmount = amount;
    goal.metadata = {
      ...goal.metadata,
      lastProgressUpdate: formatDate(new Date())
    };

    // Check if goal is completed with this update
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
      this.eventEmitter.emit('goal.completed', {
        userId,
        goalId: goal.id,
        goalName: goal.name,
        achievedAmount: goal.currentAmount,
        completedAt: formatDate(new Date())
      });
    }

    const updatedGoal = await this.goalRepository.save(goal);

    // Emit progress update event
    this.eventEmitter.emit('goal.progress', {
      userId,
      goalId: goal.id,
      goalName: goal.name,
      previousAmount,
      currentAmount: amount,
      progressPercentage: goal.calculateProgress(),
      isCompleted: goal.status === 'completed'
    });

    return updatedGoal;
  }

  /**
   * Deletes a goal with ownership validation
   */
  async delete(userId: string, goalId: string): Promise<void> {
    const goal = await this.findOne(userId, goalId);

    await this.goalRepository.remove(goal);

    this.eventEmitter.emit('goal.deleted', {
      userId,
      goalId,
      goalName: goal.name,
      deletedAt: formatDate(new Date())
    });
  }
}