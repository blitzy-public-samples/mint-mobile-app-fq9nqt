// Library versions:
// class-validator: ^0.14.0
// @nestjs/swagger: ^9.0.0

/**
 * Human Tasks:
 * 1. Review and adjust validation rules based on production usage patterns
 * 2. Monitor query performance with different timeframes and adjust indexes if needed
 * 3. Consider implementing response caching for frequently requested analytics
 * 4. Update OpenAPI examples when new analytics types are added
 */

import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApiPagination } from '../../../common/decorators/api-pagination.decorator';

/**
 * Available timeframes for analytics data aggregation
 * @requirement Analytics and Reporting Engine
 */
export enum AnalyticsTimeframe {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

/**
 * Types of financial analytics reports available
 * @requirement Analytics and Reporting Engine
 */
export enum AnalyticsType {
  SPENDING_TRENDS = 'SPENDING_TRENDS',
  BUDGET_PERFORMANCE = 'BUDGET_PERFORMANCE',
  INVESTMENT_RETURNS = 'INVESTMENT_RETURNS',
  GOAL_PROGRESS = 'GOAL_PROGRESS',
  CATEGORY_BREAKDOWN = 'CATEGORY_BREAKDOWN'
}

/**
 * DTO for analytics query parameters with validation and pagination support
 * @requirement Analytics and Reporting Engine
 * @requirement Data Export and Reporting
 */
@ApiPagination()
export class AnalyticsQueryDto {
  @ApiProperty({
    description: 'Start date for analytics period',
    example: '2024-01-01',
    required: false
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for analytics period',
    example: '2024-12-31',
    required: false
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    enum: AnalyticsTimeframe,
    description: 'Timeframe for data aggregation',
    required: false,
    example: AnalyticsTimeframe.MONTHLY
  })
  @IsEnum(AnalyticsTimeframe)
  @IsOptional()
  timeframe?: AnalyticsTimeframe;

  @ApiProperty({
    enum: AnalyticsType,
    description: 'Type of analytics report',
    required: true,
    example: AnalyticsType.SPENDING_TRENDS
  })
  @IsEnum(AnalyticsType)
  type!: AnalyticsType;

  @ApiProperty({
    description: 'Category filter for analytics',
    required: false,
    example: 'groceries'
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Account filter for analytics',
    required: false,
    example: 'acc_12345'
  })
  @IsString()
  @IsOptional()
  accountId?: string;
}

export default AnalyticsQueryDto;