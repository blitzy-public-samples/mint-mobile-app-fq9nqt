// External dependencies
// @nestjs/swagger v6.0.0
import { ApiProperty, PartialType } from '@nestjs/swagger';
// class-validator v0.14.0
import { IsOptional, IsBoolean } from 'class-validator';

import { CreateAccountDto } from './create-account.dto';

/**
 * DTO for validating account update requests, extending CreateAccountDto with all fields optional
 * 
 * Requirements addressed:
 * - Financial Account Management (Technical Specification/1.2 Scope/Core Features)
 * - Data Validation (Technical Specification/9.3.1 API Security)
 * - Secure Account Updates (Technical Specification/9.2.1 Data Classification)
 */
export class UpdateAccountDto extends PartialType(CreateAccountDto) {
  @ApiProperty({ 
    description: 'Account active status', 
    example: true, 
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ 
    description: 'Last successful sync timestamp', 
    example: '2023-12-25T12:00:00Z',
    required: false 
  })
  @IsOptional()
  lastSyncedAt?: Date;
}