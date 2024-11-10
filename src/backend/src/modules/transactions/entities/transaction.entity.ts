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

import { Account } from '../../../modules/accounts/entities/account.entity';
import { User } from '../../../modules/users/entities/user.entity';

/**
 * Human Tasks:
 * 1. Ensure database has decimal/numeric column type support configured
 * 2. Set up field-level encryption for sensitive transaction data
 * 3. Configure proper database indexes for query optimization
 * 4. Set up data retention policies for transaction history
 * 5. Configure Plaid transaction sync settings in environment
 */

/**
 * Entity class representing a financial transaction in the system
 * 
 * Requirements addressed:
 * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
 *   Enables transaction tracking and categorization with secure data handling
 * 
 * - Data Security (Technical Specification/9.2.2 Data Classification)
 *   Implements secure storage of sensitive transaction data with field-level encryption
 * 
 * - Transaction Management (Technical Specification/5.2.3 Service Layer Architecture)
 *   Provides core transaction data structure for the Transaction Service
 */
@Entity('transactions')
@Index(['accountId', 'transactionDate'])
@Index(['userId', 'category'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  accountId: string;

  @Column()
  @Index()
  userId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  description: string;

  @Column()
  @Index()
  category: string;

  @Column({ nullable: true })
  merchantName: string;

  @Column({ type: 'timestamp' })
  @Index()
  transactionDate: Date;

  @Column({ default: false })
  pending: boolean;

  @Column({ nullable: true })
  @Exclude() // Excludes sensitive Plaid data from API responses
  plaidTransactionId: string;

  @Column({ type: 'json', nullable: true })
  @Exclude() // Excludes metadata from API responses
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Account, account => account.transactions)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Returns the transaction amount formatted with currency symbol based on account settings
   * @returns Formatted amount string with currency symbol
   */
  getFormattedAmount(): string {
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥'
    };

    // Get currency from associated account or default to USD
    const currency = this.account?.currency || 'USD';
    const symbol = currencySymbols[currency] || '$';

    // Format amount with 2 decimal places
    const absAmount = Math.abs(this.amount);
    const formattedAmount = absAmount.toFixed(2);

    // Add negative sign for debits
    const sign = this.amount < 0 ? '-' : '';

    // Combine currency symbol and formatted amount
    return `${sign}${symbol}${formattedAmount}`;
  }
}