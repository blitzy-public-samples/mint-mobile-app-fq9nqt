// Third-party imports
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator'; // ^0.14.0
import { ApiProperty } from '@nestjs/swagger'; // ^6.0.0

/**
 * Data Transfer Object for exchanging a temporary Plaid Link public token for a permanent access token
 * 
 * Requirements addressed:
 * - Financial Institution Integration (Technical Specification/1.2 Scope/Core Features)
 *   Enables secure integration with financial institutions through Plaid API
 * - API Security (Technical Specification/9.3.1 API Security)
 *   Implements secure token exchange validation for Plaid integration
 * - Data Security (Technical Specification/9.2 Data Security)
 *   Ensures secure handling of sensitive financial institution access tokens
 */
export class ExchangeTokenDto {
  @IsString()
  @IsNotEmpty()
  @Length(50, 200)
  @Matches(/^public-sandbox-[a-zA-Z0-9-]+$/)
  @ApiProperty({
    description: 'Temporary public token from Plaid Link',
    example: 'public-sandbox-123abc...'
  })
  publicToken: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 50)
  @Matches(/^ins_[a-zA-Z0-9]+$/)
  @ApiProperty({
    description: 'Plaid institution identifier',
    example: 'ins_123456'
  })
  institutionId: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 50)
  @Matches(/^[a-zA-Z0-9_]+$/)
  @ApiProperty({
    description: 'Selected account identifier',
    example: 'checking_12345'
  })
  accountId: string;
}