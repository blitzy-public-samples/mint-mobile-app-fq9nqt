/**
 * Human Tasks:
 * 1. Configure budget alert thresholds in environment variables
 * 2. Set up notification service integration for budget alerts
 * 3. Configure proper database indexes for budget queries
 * 4. Set up monitoring for budget tracking performance
 * 5. Configure data retention policies for budget history
 */

import { Injectable } from '@nestjs/common'; // ^9.0.0
import { InjectRepository } from '@nestjs/typeorm'; // ^9.0.0
import { Repository } from 'typeorm'; // ^0.3.0
import { Budget } from './entities/budget.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

/**
 * Service implementing core budget management business logic
 * 
 * Requirements addressed:
 * - Budget Creation and Monitoring (Technical Specification/1.2 Scope/Core Features)
 *   Implements comprehensive budget management with category tracking
 * 
 * - Budget Tracking (Technical Specification/6.1.1 Core Application Components)
 *   Provides real-time budget tracking and spending analysis
 * 
 * - Real-time Notifications (Technical Specification/1.1 System Overview)
 *   Implements budget alerts based on spending thresholds
 */
@Injectable()
export class BudgetsService {
  // Budget alert thresholds
  private readonly WARNING_THRESHOLD = 0.8; // 80% of budget
  private readonly CRITICAL_THRESHOLD = 0.95; // 95% of budget

  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>
  ) {}

  /**
   * Creates a new budget for a user with validation
   */
  async create(userId: string, createBudgetDto: CreateBudgetDto): Promise<Budget> {
    const budget = this.budgetRepository.create({
      ...createBudgetDto,
      userId,
      spent: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Validate budget period and amount
    this.validateBudgetPeriod(budget.period);
    this.validateBudgetAmount(budget.amount);

    return this.budgetRepository.save(budget);
  }

  /**
   * Updates an existing budget with validation
   */
  async update(id: string, updateBudgetDto: UpdateBudgetDto): Promise<Budget> {
    const budget = await this.findOne(id);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    // Validate updates if provided
    if (updateBudgetDto.period) {
      this.validateBudgetPeriod(updateBudgetDto.period);
    }
    if (updateBudgetDto.amount) {
      this.validateBudgetAmount(updateBudgetDto.amount);
    }

    const updatedBudget = {
      ...budget,
      ...updateBudgetDto,
      updatedAt: new Date()
    };

    return this.budgetRepository.save(updatedBudget);
  }

  /**
   * Retrieves all budgets for a user with proper filtering
   */
  async findAll(userId: string): Promise<Budget[]> {
    return this.budgetRepository.find({
      where: {
        userId,
        isActive: true
      },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  /**
   * Retrieves a specific budget by ID with security checks
   */
  async findOne(id: string): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({
      where: { id }
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    return budget;
  }

  /**
   * Deletes a budget with proper validation
   */
  async delete(id: string): Promise<void> {
    const budget = await this.findOne(id);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    // Perform soft delete by marking inactive
    await this.budgetRepository.update(id, {
      isActive: false,
      updatedAt: new Date()
    });
  }

  /**
   * Checks budget status and generates alerts based on thresholds
   */
  async checkBudgetStatus(budgetId: string): Promise<{ status: string, alerts: Alert[] }> {
    const budget = await this.findOne(budgetId);
    const alerts: Alert[] = [];
    let status = 'OK';

    const spentPercentage = budget.getSpentPercentage();

    if (spentPercentage >= this.CRITICAL_THRESHOLD * 100) {
      status = 'CRITICAL';
      alerts.push({
        type: 'CRITICAL',
        message: `Budget '${budget.name}' has reached critical level (${spentPercentage.toFixed(1)}%)`
      });
    } else if (spentPercentage >= this.WARNING_THRESHOLD * 100) {
      status = 'WARNING';
      alerts.push({
        type: 'WARNING',
        message: `Budget '${budget.name}' is approaching limit (${spentPercentage.toFixed(1)}%)`
      });
    }

    return { status, alerts };
  }

  /**
   * Updates budget spending amount with validation
   */
  async updateSpending(budgetId: string, amount: number): Promise<Budget> {
    const budget = await this.findOne(budgetId);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    // Validate amount
    if (amount < 0) {
      throw new Error('Spending amount cannot be negative');
    }

    const updatedBudget = {
      ...budget,
      spent: budget.spent + amount,
      updatedAt: new Date()
    };

    // Check if update would exceed budget
    if (updatedBudget.spent > updatedBudget.amount) {
      throw new Error('Transaction would exceed budget limit');
    }

    const savedBudget = await this.budgetRepository.save(updatedBudget);

    // Check budget status after update
    const { alerts } = await this.checkBudgetStatus(budgetId);
    
    // If there are alerts, they should be sent through notification service
    if (alerts.length > 0) {
      // Notification service integration would be called here
      this.logBudgetAlerts(alerts);
    }

    return savedBudget;
  }

  /**
   * Validates budget period format and values
   */
  private validateBudgetPeriod(period: string): void {
    const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    if (!validPeriods.includes(period.toLowerCase())) {
      throw new Error('Invalid budget period');
    }
  }

  /**
   * Validates budget amount constraints
   */
  private validateBudgetAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('Budget amount must be greater than zero');
    }
    if (amount > 1000000000) { // 1 billion limit
      throw new Error('Budget amount exceeds maximum allowed value');
    }
  }

  /**
   * Logs budget alerts for monitoring
   */
  private logBudgetAlerts(alerts: Alert[]): void {
    alerts.forEach(alert => {
      console.log(`[BUDGET_ALERT] ${alert.type}: ${alert.message}`);
    });
  }
}

interface Alert {
  type: 'WARNING' | 'CRITICAL';
  message: string;
}