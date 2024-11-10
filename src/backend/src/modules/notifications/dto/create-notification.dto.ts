/**
 * Human Tasks:
 * 1. Configure FCM/APNS credentials in environment variables for push notifications
 * 2. Set up rate limiting for notification creation endpoints
 * 3. Configure notification retention policies
 * 4. Set up monitoring for notification delivery metrics
 */

// class-validator v0.14.0
import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  IsUUID, 
  IsOptional, 
  IsJSON, 
  IsDateString 
} from 'class-validator';

// @nestjs/swagger v6.0.0
import { ApiProperty } from '@nestjs/swagger';

/**
 * Requirements addressed:
 * - Real-time notification system (Technical Specification/1.1 System Overview)
 *   Defines data structure for creating system notifications with real-time delivery
 * 
 * - Push Notification Services (Technical Specification/5.1 High-Level Architecture Overview)
 *   Supports push notification creation through FCM/APNS with priority levels
 * 
 * - Data Security (Technical Specification/9.2 Data Security)
 *   Implements comprehensive input validation for notification data
 */

/**
 * Enumeration of supported notification types in the system
 */
export enum NotificationType {
  ACCOUNT_SYNC = 'ACCOUNT_SYNC',
  BUDGET_ALERT = 'BUDGET_ALERT',
  GOAL_MILESTONE = 'GOAL_MILESTONE',
  TRANSACTION_ALERT = 'TRANSACTION_ALERT',
  SECURITY_ALERT = 'SECURITY_ALERT',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE'
}

/**
 * Enumeration of notification priority levels for delivery control
 */
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

/**
 * DTO class for creating new notifications with comprehensive validation rules
 */
export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID of the user to receive the notification',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: 'BUDGET_ALERT'
  })
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Notification title',
    example: 'Budget Alert'
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification message content',
    example: 'You have exceeded your monthly budget'
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Notification priority level',
    enum: NotificationPriority,
    example: 'HIGH'
  })
  @IsNotEmpty()
  @IsEnum(NotificationPriority)
  priority: NotificationPriority;

  @ApiProperty({
    description: 'Additional notification data',
    required: false,
    example: { budgetId: '123', category: 'groceries' }
  })
  @IsOptional()
  @IsJSON()
  data?: string;

  @ApiProperty({
    description: 'Scheduled delivery time',
    required: false,
    example: '2024-01-01T10:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: Date;
}