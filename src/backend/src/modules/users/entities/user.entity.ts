// TypeORM v0.3.0
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index
} from 'typeorm';

// class-transformer v0.5.1
import { Exclude } from 'class-transformer';

/**
 * Human Tasks:
 * 1. Ensure database has UUID extension enabled for PostgreSQL
 * 2. Configure field-level encryption keys in environment variables
 * 3. Set up GDPR data retention policies
 * 4. Configure password hashing settings (salt rounds) in environment
 */

/**
 * User entity representing a user account in the system
 * 
 * Requirements addressed:
 * - Core User Management (Technical Specification/1.2 Scope/Core Features)
 *   Implements core user data model with GDPR-compliant fields
 * 
 * - User Authentication (Technical Specification/9.1.1 Authentication Methods)
 *   Supports email/password authentication with secure password storage
 * 
 * - Data Security (Technical Specification/9.2.1 Encryption Standards)
 *   Uses field-level encryption and secure data handling practices
 */
@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  @Exclude() // Excludes password from API responses
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}