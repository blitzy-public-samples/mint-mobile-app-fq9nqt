// TypeORM v0.3.0
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

import { User } from '../users/entities/user.entity';

/**
 * Human Tasks:
 * 1. Ensure database has decimal/numeric type support configured
 * 2. Set up appropriate database indices for frequent queries
 * 3. Configure currency precision settings in environment
 * 4. Set up automated cleanup jobs for completed/cancelled goals
 */

/**
 * Goal entity representing a financial goal with progress tracking
 * 
 * Requirements addressed:
 * - Financial Goal Management (Technical Specification/1.2 Scope/Core Features)
 *   Implements financial goal model with target amounts, deadlines, and progress tracking
 * 
 * - Data Classification (Technical Specification/9.2.2 Data Classification)
 *   Handles sensitive financial data with appropriate column types and metadata
 */
@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  targetAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentAmount: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'date', nullable: true })
  targetDate: Date;

  @Column({ 
    type: 'enum', 
    enum: ['active', 'completed', 'cancelled'] 
  })
  status: 'active' | 'completed' | 'cancelled';

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Calculates the current progress percentage towards the goal target amount
   * @returns Progress percentage between 0 and 100
   */
  calculateProgress(): number {
    if (this.targetAmount <= 0) {
      return 0;
    }
    const percentage = (this.currentAmount / this.targetAmount) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  }

  /**
   * Checks if the goal has passed its target date without completion
   * @returns True if goal is overdue, false otherwise
   */
  isOverdue(): boolean {
    if (!this.targetDate || this.status !== 'active') {
      return false;
    }
    return new Date() > this.targetDate;
  }
}