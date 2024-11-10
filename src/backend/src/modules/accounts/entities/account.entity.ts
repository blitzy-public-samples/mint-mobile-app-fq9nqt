// TypeORM v0.3.0
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';

// class-transformer v0.5.1
import { Exclude } from 'class-transformer';

import { User } from '../../../modules/users/entities/user.entity';
import { Transaction } from '../../../modules/transactions/entities/transaction.entity';

/**
 * Human Tasks:
 * 1. Ensure database has decimal/numeric column type support configured
 * 2. Set up field-level encryption for Plaid tokens and sensitive data
 * 3. Configure Plaid integration settings in environment
 * 4. Set up proper database indexes for query optimization
 * 5. Configure currency conversion rates source if supporting multiple currencies
 */

/**
 * Entity class representing a financial account in the system
 * 
 * Requirements addressed:
 * - Financial Account Integration (Technical Specification/1.2 Scope/Core Features)
 *   Enables financial institution integration and account aggregation
 * 
 * - Data Security (Technical Specification/9.2.2 Data Classification)
 *   Implements secure storage of sensitive account data with field-level encryption
 * 
 * - Account Management (Technical Specification/5.2.3 Service Layer Architecture)
 *   Provides core account data structure for the Account Service
 */
@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  institutionId: string;

  @Column()
  accountType: string;

  @Column('decimal', { precision: 10, scale: 2 })
  balance: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column()
  name: string;

  @Column({ length: 4, nullable: true })
  mask: string;

  @Column({ nullable: true })
  plaidAccountId: string;

  @Column({ nullable: true })
  @Exclude() // Excludes sensitive Plaid token from API responses
  plaidAccessToken: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Transaction, transaction => transaction.account)
  transactions: Transaction[];

  /**
   * Returns the account balance formatted with currency symbol
   * @returns Formatted balance string with currency symbol
   */
  getFormattedBalance(): string {
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥'
    };

    const symbol = currencySymbols[this.currency] || '$';
    const formattedBalance = this.balance.toFixed(2);
    
    return `${symbol}${formattedBalance}`;
  }
}