// @nestjs/swagger version: ^9.0.0
// class-validator version: ^0.14.0

import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

/**
 * Data Transfer Object (DTO) for user update requests
 * 
 * Requirements addressed:
 * - User Authentication (Technical Specification/9.1.1 Authentication Methods)
 *   Implements validation for user profile updates with secure password requirements
 * 
 * - Data Security (Technical Specification/9.2.1 Encryption Standards)
 *   Ensures proper validation of sensitive user data before processing updates
 * 
 * - Input Validation (Technical Specification/9.3.1 API Security)
 *   Provides comprehensive validation rules for user update data
 */
export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character' }
  )
  password?: string;

  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  lastName?: string;
}