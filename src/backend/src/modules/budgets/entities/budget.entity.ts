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

import { User } from '../../../modules/users/entities/user.entity';

/**
 * Human Tasks:
 * 1. Ensure database has decimal/numeric column type support configured
 * 2. Set up proper database indexes for query optimization
 * 3. Configure currency conversion rates source if supporting multiple currencies
 * 4. Set up data retention policies for budget history
 */

/**
 * Entity class representing a budget in the system with category-based spending limits
 * 
 * Requirements addressed:
 * - Budget Creation and Monitoring (Technical Specification/1.2 Scope/Core Features)
 *   Implements budget data model with category-based spending limits and tracking
 * 
 * - Budget Data Structure (Technical Specification/5.2.3 Service Layer Architecture)
 *   Defines core budget data structure with proper relationships and tracking capabilities
 * 
 * - Data Security (Technical Specification/9.2.2 Data Classification)
 *   Uses secure storage and field-level data classification for budget information
 */
@Entity('budgets')
@Index(['userId', 'category'])
@Index(['period', 'isActive'])
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column()
  @Index()
  period: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  spent: number;

  @Column()
  @Index()
  category: string;

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @Column()
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Calculates remaining budget amount
   * @returns Remaining amount in budget
   */
  getRemainingAmount(): number {
    return this.amount - this.spent;
  }

  /**
   * Calculates percentage of budget spent
   * @returns Percentage of budget spent
   */
  getSpentPercentage(): number {
    if (this.amount === 0) return 0;
    return (this.spent / this.amount) * 100;
  }
}