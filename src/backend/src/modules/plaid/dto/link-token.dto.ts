// Third-party imports with versions
import { IsString, IsNotEmpty, IsOptional, IsArray, ArrayMinSize, IsEnum } from 'class-validator'; // ^0.14.0
import { ApiProperty } from '@nestjs/swagger'; // ^6.0.0

/**
 * Human Tasks:
 * 1. Ensure Plaid API credentials are configured in the environment
 * 2. Verify webhook URL is accessible from Plaid servers if using webhooks
 * 3. Configure allowed redirect URIs in Plaid dashboard if using OAuth
 */

/**
 * Supported Plaid products for link token creation
 * @description Defines available integration features
 */
export enum PlaidProduct {
  TRANSACTIONS = 'TRANSACTIONS',
  AUTH = 'AUTH',
  IDENTITY = 'IDENTITY',
  INVESTMENTS = 'INVESTMENTS',
  ASSETS = 'ASSETS',
  LIABILITIES = 'LIABILITIES'
}

/**
 * Supported languages for Plaid Link interface
 * @description Defines available localization options
 */
export enum PlaidLanguage {
  en = 'en',
  fr = 'fr',
  es = 'es',
  nl = 'nl'
}

/**
 * Supported country codes for financial institutions
 * @description Defines available countries for integration
 */
export enum PlaidCountryCode {
  US = 'US',
  CA = 'CA',
  GB = 'GB',
  FR = 'FR',
  ES = 'ES',
  NL = 'NL'
}

/**
 * DTO for creating a Plaid link token request
 * @description Validates and structures data for Plaid link token creation
 * Requirements addressed:
 * - Financial Institution Integration (Technical Specification/1.1 System Overview/Core Components)
 * - Account Aggregation (Technical Specification/1.2 Scope/Core Features)
 * - Data Security (Technical Specification/9.2 Data Security)
 */
export class LinkTokenDto {
  @ApiProperty({ description: 'Unique identifier for the user' })
  @IsString()
  @IsNotEmpty()
  clientUserId: string;

  @ApiProperty({ description: 'Name of the client application' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiProperty({
    description: 'Array of Plaid products to initialize',
    enum: PlaidProduct,
    isArray: true
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(PlaidProduct, { each: true })
  products: PlaidProduct[];

  @ApiProperty({
    description: 'Language for the Plaid Link interface',
    enum: PlaidLanguage
  })
  @IsEnum(PlaidLanguage)
  @IsOptional()
  language?: PlaidLanguage;

  @ApiProperty({
    description: 'Array of country codes for financial institutions',
    enum: PlaidCountryCode,
    isArray: true
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(PlaidCountryCode, { each: true })
  countryCodes: PlaidCountryCode[];

  @ApiProperty({ description: 'Webhook URL for Plaid notifications' })
  @IsString()
  @IsOptional()
  webhook?: string;
}