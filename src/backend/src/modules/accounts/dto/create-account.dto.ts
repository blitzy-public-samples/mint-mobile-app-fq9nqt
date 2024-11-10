// External dependencies
// class-validator v0.14.0
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEnum, 
  IsNumber, 
  Length 
} from 'class-validator';
// @nestjs/swagger v6.0.0
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for validating and sanitizing account creation requests
 * 
 * Requirements addressed:
 * - Financial Account Integration (Technical Specification/1.2 Scope/Core Features)
 * - Data Validation (Technical Specification/9.3.1 API Security)
 * - Secure Account Management (Technical Specification/9.2.1 Data Classification)
 */
export class CreateAccountDto {
  @ApiProperty({
    description: 'Financial institution identifier',
    example: 'chase_bank',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  institutionId: string;

  @ApiProperty({
    description: 'Type of account',
    example: 'CHECKING',
    enum: ['CHECKING', 'SAVINGS', 'CREDIT', 'INVESTMENT'],
    required: true
  })
  @IsEnum(['CHECKING', 'SAVINGS', 'CREDIT', 'INVESTMENT'])
  @IsNotEmpty()
  accountType: string;

  @ApiProperty({
    description: 'Account number (masked)',
    example: '****1234',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 17)
  accountNumber: string;

  @ApiProperty({
    description: 'Bank routing number',
    example: '021000021',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @Length(9, 9)
  routingNumber: string;

  @ApiProperty({
    description: 'Current account balance',
    example: 1000.00,
    required: true
  })
  @IsNumber()
  @IsNotEmpty()
  balance: number;

  @ApiProperty({
    description: 'Account currency code',
    example: 'USD',
    default: 'USD',
    required: false
  })
  @IsString()
  @Length(3, 3)
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Account display name',
    example: 'Chase Checking',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Plaid access token',
    required: false
  })
  @IsString()
  @IsOptional()
  plaidAccessToken?: string;

  @ApiProperty({
    description: 'Plaid item ID',
    required: false
  })
  @IsString()
  @IsOptional()
  plaidItemId?: string;
}