/**
 * Human Tasks:
 * 1. Ensure validation rules align with business requirements
 * 2. Configure proper error messages in i18n system
 * 3. Review and adjust decimal validation limits based on currency requirements
 * 4. Set up proper API documentation for OpenAPI/Swagger
 */

// class-validator v0.14.0
import {
  IsOptional,
  IsNumber,
  IsString,
  IsDate,
  IsBoolean,
  IsObject,
  MaxLength,
  DecimalMin,
  DecimalMax
} from 'class-validator';

// @nestjs/swagger v6.0.0
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for validating transaction update requests with comprehensive validation rules
 * 
 * Requirements addressed:
 * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
 *   Defines the structure and validation rules for updating existing financial transactions
 * 
 * - Data Security (Technical Specification/9.2.2 Data Classification)
 *   Implements validation rules for sensitive transaction data updates
 * 
 * - Input Validation (Technical Specification/9.3.1 API Security)
 *   Ensures updated transaction data meets security and business requirements
 */
export class UpdateTransactionDto {
  @ApiProperty({
    description: 'Transaction amount (positive for credits, negative for debits)',
    required: false,
    example: 125.50
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @DecimalMin('-999999.99')
  @DecimalMax('999999.99')
  amount?: number;

  @ApiProperty({
    description: 'Description of the transaction',
    required: false,
    maxLength: 255,
    example: 'Grocery shopping at Walmart'
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    description: 'Transaction category for expense tracking',
    required: false,
    example: 'Groceries'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({
    description: 'Name of the merchant or transaction source',
    required: false,
    example: 'Walmart'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  merchantName?: string;

  @ApiProperty({
    description: 'Date when the transaction occurred',
    required: false,
    example: '2024-01-15T10:30:00Z'
  })
  @IsOptional()
  @IsDate()
  transactionDate?: Date;

  @ApiProperty({
    description: 'Indicates if the transaction is pending or settled',
    required: false,
    example: false
  })
  @IsOptional()
  @IsBoolean()
  pending?: boolean;

  @ApiProperty({
    description: 'Additional transaction metadata',
    required: false,
    example: { location: 'Store #123', paymentMethod: 'Credit Card' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}