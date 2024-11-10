/**
 * Human Tasks:
 * 1. Ensure proper validation rules are configured in class-validator settings
 * 2. Configure Swagger UI documentation settings for API endpoints
 * 3. Set up proper error messages for validation failures in i18n
 */

// class-validator v0.14.0
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  IsDate,
  IsOptional,
  IsBoolean,
  Min
} from 'class-validator';

// @nestjs/swagger v6.0.0
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for creating new transactions
 * 
 * Requirements addressed:
 * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
 *   Defines structure and validation rules for creating financial transactions
 * 
 * - Data Security (Technical Specification/9.2.2 Data Classification)
 *   Implements validation rules for sensitive transaction data
 * 
 * - Input Validation (Technical Specification/9.3.1 API Security)
 *   Ensures comprehensive validation of transaction input data
 */
export class CreateTransactionDto {
  @ApiProperty({
    description: 'ID of the account associated with the transaction',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  accountId: string;

  @ApiProperty({
    description: 'Transaction amount (positive for credits, negative for debits)',
    example: 125.50
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Description of the transaction',
    example: 'Grocery shopping at Walmart'
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Transaction category',
    example: 'Groceries'
  })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Name of the merchant',
    required: false,
    example: 'Walmart'
  })
  @IsOptional()
  @IsString()
  merchantName: string;

  @ApiProperty({
    description: 'Date of the transaction',
    example: '2023-12-25T12:00:00Z'
  })
  @IsNotEmpty()
  @IsDate()
  transactionDate: Date;

  @ApiProperty({
    description: 'Type of transaction (e.g., debit, credit)',
    example: 'debit'
  })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Whether the transaction is pending',
    default: false,
    example: false
  })
  @IsOptional()
  @IsBoolean()
  isPending: boolean;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    default: 'USD',
    example: 'USD'
  })
  @IsOptional()
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Additional transaction metadata',
    required: false,
    example: {
      'location': 'Store #123',
      'paymentMethod': 'Credit Card'
    }
  })
  @IsOptional()
  metadata: Record<string, any>;
}