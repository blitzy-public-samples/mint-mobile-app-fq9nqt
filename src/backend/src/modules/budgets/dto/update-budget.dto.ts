/**
 * Human Tasks:
 * 1. Ensure validation rules align with frontend validation
 * 2. Configure currency codes list if supporting multiple currencies
 * 3. Set up proper error messages translations
 */

import { 
  IsOptional, 
  IsString, 
  IsNumber, 
  IsDate, 
  IsBoolean, 
  IsJSON, 
  IsNotEmpty, 
  Min, 
  MaxLength 
} from 'class-validator'; // ^0.14.0
import { PartialType } from '@nestjs/swagger'; // ^9.0.0

/**
 * Data Transfer Object for updating budget information
 * 
 * Requirements addressed:
 * - Budget Creation and Monitoring (Technical Specification/1.2 Scope/Core Features)
 *   Defines the structure and validation rules for budget update operations
 * 
 * - Input Validation (Technical Specification/9.3.1 API Security)
 *   Implements comprehensive validation rules for budget update data
 * 
 * - Data Security (Technical Specification/9.2.2 Data Classification)
 *   Ensures proper validation of sensitive budget data
 */
export class UpdateBudgetDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  period?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsJSON()
  metadata?: Record<string, any>;
}