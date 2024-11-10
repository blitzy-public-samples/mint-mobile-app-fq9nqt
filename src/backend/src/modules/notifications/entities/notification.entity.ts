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

// Internal imports
import { User } from '../../users/entities/user.entity';
import { NotificationType, NotificationPriority } from '../dto/create-notification.dto';

/**
 * Human Tasks:
 * 1. Configure database indexes for optimal notification querying
 * 2. Set up notification archival/cleanup policies
 * 3. Configure monitoring for notification delivery metrics
 * 4. Set up rate limiting for notification queries
 * 5. Ensure proper database partitioning for notifications table
 */

/**
 * Entity class representing a notification in the system
 * 
 * Requirements addressed:
 * - Real-time notification system (Technical Specification/1.1 System Overview)
 *   Implements the core notification data model for real-time alerts and updates
 *   with support for multiple notification types and priorities
 * 
 * - Push Notification Services (Technical Specification/5.1 High-Level Architecture Overview)
 *   Supports notification persistence and delivery through FCM/APNS with scheduling
 *   capabilities and delivery tracking
 * 
 * - Data Security (Technical Specification/9.2 Data Security)
 *   Ensures secure storage of notification data with proper encryption, access controls,
 *   and audit trails through timestamps
 */
@Entity('notifications')
@Index(['userId', 'type', 'createdAt'])
@Index(['userId', 'isRead', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  @Index()
  user: User;

  @Column()
  userId: string;

  @Column({ 
    type: 'enum', 
    enum: NotificationType 
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ 
    type: 'enum', 
    enum: NotificationPriority 
  })
  priority: NotificationPriority;

  @Column({ 
    type: 'jsonb', 
    nullable: true 
  })
  data: Record<string, any>;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ nullable: true })
  sentAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}