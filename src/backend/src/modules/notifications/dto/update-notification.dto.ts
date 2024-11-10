/**
 * Human Tasks:
 * 1. Configure FCM/APNS credentials in environment variables for push notifications
 * 2. Set up rate limiting for notification update endpoints
 * 3. Configure monitoring for notification update metrics
 */

// class-validator v0.14.0
import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsJSON, 
  IsDateString,
  IsBoolean 
} from 'class-validator';

// @nestjs/swagger v6.0.0
import { ApiProperty, PartialType } from '@nestjs/swagger';

import { 
  NotificationType, 
  NotificationPriority, 
  CreateNotificationDto 
} from './create-notification.dto';

/**
 * Requirements addressed:
 * - Real-time notification system (Technical Specification/1.1 System Overview)
 *   Defines the data structure for updating system notifications with real-time delivery capabilities
 * 
 * - Push Notification Services (Technical Specification/5.1 High-Level Architecture Overview)
 *   Supports modification of push notifications before delivery through FCM/APNS integration
 * 
 * - Data Security (Technical Specification/9.2 Data Security)
 *   Implements secure validation and sanitization for notification updates with strict type checking
 */

@PartialType(CreateNotificationDto)
export class UpdateNotificationDto {
  @ApiProperty({ 
    description: 'Type of notification', 
    enum: NotificationType, 
    required: false, 
    example: 'BUDGET_ALERT' 
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({ 
    description: 'Notification title', 
    required: false, 
    example: 'Updated Budget Alert' 
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ 
    description: 'Notification message content', 
    required: false, 
    example: 'Your budget status has been updated' 
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ 
    description: 'Notification priority level', 
    enum: NotificationPriority, 
    required: false, 
    example: 'HIGH' 
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiProperty({ 
    description: 'Additional notification data', 
    required: false, 
    example: { 
      budgetId: '123', 
      category: 'groceries', 
      updatedAt: '2024-01-01T10:00:00Z' 
    } 
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

  @ApiProperty({ 
    description: 'Read status of notification', 
    required: false, 
    example: true 
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiProperty({ 
    description: 'Timestamp when notification was read', 
    required: false, 
    example: '2024-01-01T10:00:00Z' 
  })
  @IsOptional()
  @IsDateString()
  readAt?: Date;
}