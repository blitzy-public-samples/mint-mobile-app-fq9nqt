// class-validator v0.14.0
import { 
  IsOptional, 
  IsString, 
  IsNotEmpty, 
  IsDecimal, 
  Min 
} from 'class-validator';

// @nestjs/swagger v6.0.0
import { PartialType } from '@nestjs/swagger';

/**
 * Human Tasks:
 * 1. Ensure proper validation rules are configured in the validation pipeline
 * 2. Set up API documentation for investment update endpoints
 * 3. Configure proper decimal precision handling in the database
 */

/**
 * Data Transfer Object for updating investment holdings
 * 
 * Requirements addressed:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 *   Enables updating of investment holdings and performance data with proper validation
 * 
 * - Data Validation (Technical Specification/9.3.1 API Security)
 *   Implements comprehensive input validation for investment updates to prevent invalid data
 * 
 * - Data Security (Technical Specification/9.2.2 Data Classification)
 *   Ensures secure handling of sensitive investment data through proper validation
 */
export class UpdateInvestmentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  symbol?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '4' })
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  costBasis?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  currentPrice?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  currency?: string;
}