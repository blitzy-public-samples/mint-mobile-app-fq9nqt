// class-validator v0.14.0
import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsUUID, 
  IsPositive, 
  IsOptional 
} from 'class-validator';

// @nestjs/swagger v6.0.0
import { ApiProperty } from '@nestjs/swagger';

/**
 * Human Tasks:
 * 1. Ensure proper validation rules are configured in the validation pipeline
 * 2. Verify UUID format matches the system's UUID generation strategy
 * 3. Configure proper currency code validation against supported currencies
 * 4. Set up asset class validation against allowed investment types
 */

/**
 * DTO for creating a new investment record with validation
 * 
 * Requirements addressed:
 * - Investment Portfolio Tracking (Technical Specification/1.2 Scope/Core Features)
 *   Enables basic investment portfolio tracking with required data validation
 * 
 * - Data Security (Technical Specification/9.2.2 Data Classification)
 *   Implements input validation for sensitive investment data
 * 
 * - API Documentation (Technical Specification/7.2 Frameworks and Libraries)
 *   Uses OpenAPI/Swagger decorators for API documentation
 */
export class CreateInvestmentDto {
  @ApiProperty({ 
    description: 'UUID of the associated financial account',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  accountId: string;

  @ApiProperty({ 
    description: 'Investment symbol/ticker',
    example: 'AAPL'
  })
  @IsNotEmpty()
  @IsString()
  symbol: string;

  @ApiProperty({ 
    description: 'Investment name/description',
    example: 'Apple Inc.'
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Asset class of the investment',
    example: 'stocks'
  })
  @IsNotEmpty()
  @IsString()
  assetClass: string;

  @ApiProperty({ 
    description: 'Quantity of investment units',
    example: 10.5
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ 
    description: 'Cost basis per unit',
    example: 150.75
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  costBasis: number;

  @ApiProperty({ 
    description: 'Current market price per unit',
    example: 155.25
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  currentPrice: number;

  @ApiProperty({ 
    description: 'Currency code (default: USD)',
    default: 'USD',
    example: 'USD'
  })
  @IsOptional()
  @IsString()
  currency: string;
}