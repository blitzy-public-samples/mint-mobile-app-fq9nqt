// @package class-validator ^0.14.0
import { IsString, IsNotEmpty, IsNumber, IsDate, IsOptional, Min, IsEnum, Length } from 'class-validator';
// @package @nestjs/swagger ^6.0.0
import { ApiProperty, PartialType } from '@nestjs/swagger';

/**
 * Data Transfer Object for updating financial goals
 * 
 * Requirements addressed:
 * - Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
 *   Enables modification of financial goals with validated input data
 * - Input Validation (Technical Specification/9.3.1 API Security)
 *   Implements comprehensive request payload validation for goal updates
 * - Goal Progress Monitoring (Technical Specification/1.2 Scope/Core Features)
 *   Supports updating goal progress and status tracking
 */
export class UpdateGoalDto {
  @ApiProperty({
    description: 'Updated name of the financial goal',
    example: 'Emergency Fund',
    required: false
  })
  @IsString()
  @IsOptional()
  @Length(3, 100)
  name?: string;

  @ApiProperty({
    description: 'Updated description of the goal',
    required: false
  })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @ApiProperty({
    description: 'Updated target amount to achieve',
    example: 10000,
    required: false
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  targetAmount?: number;

  @ApiProperty({
    description: 'Current progress amount towards the goal',
    example: 5000,
    required: false
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  currentAmount?: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    required: false
  })
  @IsString()
  @IsOptional()
  @Length(3, 3)
  currency?: string;

  @ApiProperty({
    description: 'Updated target date to achieve the goal',
    required: false
  })
  @IsDate()
  @IsOptional()
  targetDate?: Date;

  @ApiProperty({
    description: 'Current status of the goal',
    enum: ['IN_PROGRESS', 'COMPLETED', 'ON_HOLD'],
    required: false
  })
  @IsString()
  @IsOptional()
  @IsEnum(['IN_PROGRESS', 'COMPLETED', 'ON_HOLD'])
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

  @ApiProperty({
    description: 'Updated goal priority level',
    minimum: 1,
    maximum: 5,
    required: false
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  priority?: number;

  @ApiProperty({
    description: 'Whether the goal is active',
    required: false
  })
  @IsOptional()
  isActive?: boolean;
}