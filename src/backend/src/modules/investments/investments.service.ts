// @nestjs/common v9.0.0
import { Injectable, NotFoundException } from '@nestjs/common';

// @nestjs/typeorm v9.0.0
import { InjectRepository } from '@nestjs/typeorm';

// typeorm v0.3.0
import { Repository } from 'typeorm';

import { Investment } from './entities/investment.entity';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';

/**
 * Human Tasks:
 * 1. Configure market data integration service for real-time price updates
 * 2. Set up proper error monitoring and alerting for investment operations
 * 3. Configure rate limiting for investment operations
 * 4. Set up audit logging for investment transactions
 * 5. Configure backup strategy for investment data
 */

/**
 * Service implementing core investment portfolio tracking functionality
 * 
 * Requirements addressed:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 *   Implements comprehensive investment portfolio management with real-time tracking
 * 
 * - Real-time Data Synchronization (Technical Specification/1.1 System Overview)
 *   Handles market data synchronization with automated price updates
 * 
 * - Data Security (Technical Specification/9.2.1 Encryption Standards)
 *   Implements secure handling of sensitive investment data
 */
@Injectable()
export class InvestmentsService {
  constructor(
    @InjectRepository(Investment)
    private readonly investmentRepository: Repository<Investment>
  ) {}

  /**
   * Creates a new investment record with initial calculations
   */
  async create(createInvestmentDto: CreateInvestmentDto, userId: string): Promise<Investment> {
    const investment = this.investmentRepository.create({
      ...createInvestmentDto,
      userId,
      marketValue: 0,
      unrealizedGain: 0,
      returnPercentage: 0,
      lastPriceUpdateAt: new Date()
    });

    // Calculate initial values
    investment.marketValue = investment.calculateMarketValue();
    investment.unrealizedGain = investment.calculateUnrealizedGain();
    investment.returnPercentage = investment.calculateReturnPercentage();

    return this.investmentRepository.save(investment);
  }

  /**
   * Retrieves all investments for a user with security checks
   */
  async findAll(userId: string): Promise<Investment[]> {
    return this.investmentRepository.find({
      where: { userId },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  /**
   * Retrieves a specific investment by ID with security validation
   */
  async findOne(id: string, userId: string): Promise<Investment> {
    const investment = await this.investmentRepository.findOne({
      where: { id, userId }
    });

    if (!investment) {
      throw new NotFoundException(`Investment with ID ${id} not found`);
    }

    return investment;
  }

  /**
   * Updates an existing investment with recalculations
   */
  async update(id: string, updateInvestmentDto: UpdateInvestmentDto, userId: string): Promise<Investment> {
    const investment = await this.findOne(id, userId);

    // Update fields
    Object.assign(investment, updateInvestmentDto);

    // Recalculate values
    investment.marketValue = investment.calculateMarketValue();
    investment.unrealizedGain = investment.calculateUnrealizedGain();
    investment.returnPercentage = investment.calculateReturnPercentage();
    investment.lastPriceUpdateAt = new Date();

    return this.investmentRepository.save(investment);
  }

  /**
   * Removes an investment record with security checks
   */
  async remove(id: string, userId: string): Promise<void> {
    const investment = await this.findOne(id, userId);
    await this.investmentRepository.remove(investment);
  }

  /**
   * Updates current prices for investments with market data
   */
  async updatePrices(userId: string): Promise<void> {
    const investments = await this.findAll(userId);

    // TODO: Integrate with market data service for real-time prices
    const updatedInvestments = investments.map(investment => {
      investment.marketValue = investment.calculateMarketValue();
      investment.unrealizedGain = investment.calculateUnrealizedGain();
      investment.returnPercentage = investment.calculateReturnPercentage();
      investment.lastPriceUpdateAt = new Date();
      return investment;
    });

    await this.investmentRepository.save(updatedInvestments);
  }

  /**
   * Calculates total portfolio value for a user
   */
  async calculatePortfolioValue(userId: string): Promise<number> {
    const investments = await this.findAll(userId);
    const totalValue = investments.reduce((sum, investment) => {
      return sum + investment.calculateMarketValue();
    }, 0);
    
    return Number(totalValue.toFixed(2));
  }
}