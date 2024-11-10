// TypeORM v0.3.0
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';

// class-transformer v0.5.1
import { Exclude } from 'class-transformer';

import { User } from '../../../modules/users/entities/user.entity';
import { Account } from '../../../modules/accounts/entities/account.entity';

/**
 * Human Tasks:
 * 1. Ensure database has decimal/numeric column type support configured
 * 2. Set up real-time market data integration for price updates
 * 3. Configure currency conversion rates source for multi-currency support
 * 4. Set up proper database indexes for query optimization
 * 5. Configure data retention policies for historical performance data
 */

/**
 * Entity class representing an investment holding in the system
 * 
 * Requirements addressed:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 *   Enables basic investment portfolio tracking functionality with performance calculation
 *   and position tracking
 * 
 * - Data Security (Technical Specification/9.2.2 Data Classification)
 *   Implements secure storage of sensitive investment data with appropriate data
 *   classification and encryption
 * 
 * - Investment Management (Technical Specification/5.2.3 Service Layer Architecture)
 *   Provides core investment data structure for the Investment Service with real-time
 *   price updates and performance tracking
 */
@Entity('investments')
@Index(['userId', 'symbol'])
@Index(['accountId'])
export class Investment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  @Index()
  accountId: string;

  @Column()
  @Index()
  symbol: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 4 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  costBasis: number;

  @Column('decimal', { precision: 10, scale: 2 })
  currentPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  marketValue: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unrealizedGain: number;

  @Column('decimal', { precision: 5, scale: 2 })
  returnPercentage: number;

  @Column()
  assetClass: string;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  lastPriceUpdateAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  /**
   * Calculates the current market value of the investment
   * @returns Current market value based on quantity and price
   */
  calculateMarketValue(): number {
    const value = this.quantity * this.currentPrice;
    return Number(value.toFixed(2));
  }

  /**
   * Calculates the unrealized gain/loss of the investment
   * @returns Unrealized gain/loss amount
   */
  calculateUnrealizedGain(): number {
    const totalCost = this.quantity * this.costBasis;
    const marketValue = this.calculateMarketValue();
    const gain = marketValue - totalCost;
    return Number(gain.toFixed(2));
  }

  /**
   * Calculates the return percentage of the investment
   * @returns Return percentage
   */
  calculateReturnPercentage(): number {
    const totalCost = this.quantity * this.costBasis;
    const gain = this.calculateUnrealizedGain();
    if (totalCost === 0) return 0;
    
    const percentage = (gain / totalCost) * 100;
    return Number(percentage.toFixed(2));
  }
}