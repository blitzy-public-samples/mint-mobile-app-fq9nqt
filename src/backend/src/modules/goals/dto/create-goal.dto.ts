// @package class-validator ^0.14.0
import { IsString, IsNotEmpty, IsNumber, IsDate, IsOptional, Min, Length } from 'class-validator';
// @package @nestjs/swagger ^6.0.0
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for creating new financial goals
 * 
 * Requirements addressed:
 * - Financial Goal Setting (Technical Specification/1.2 Scope/Core Features)
 *   Enables financial goal setting and progress monitoring with validated input data
 * - Input Validation (Technical Specification/9.3.1 API Security)
 *   Implements comprehensive request payload validation for goal creation
 */
export class CreateGoalDto {
  @ApiProperty({
    description: 'Name of the financial goal',
    example: 'Emergency Fund'
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @ApiProperty({
    description: 'Detailed description of the goal',
    required: false
  })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @ApiProperty({
    description: 'Target amount to achieve',
    example: 10000
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  targetAmount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    default: 'USD'
  })
  @IsString()
  @IsOptional()
  @Length(3, 3)
  currency?: string;

  @ApiProperty({
    description: 'Target date to achieve the goal'
  })
  @IsDate()
  @IsNotEmpty()
  targetDate: Date;

  @ApiProperty({
    description: 'Goal priority level',
    default: 1,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  priority?: number;
}