// Third-party library versions:
// class-validator: ^0.14.0
// class-transformer: ^0.5.1
// @nestjs/swagger: ^6.0.0

import { IsString, IsNotEmpty, IsArray, IsOptional, IsDate, IsEnum, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Enumeration of entities that can be synchronized between mobile client and backend
 * Addresses requirement: Data Synchronization (Technical Specification/1.1 System Overview/Core Features)
 */
export enum SyncEntityType {
  ACCOUNTS = 'ACCOUNTS',
  TRANSACTIONS = 'TRANSACTIONS',
  BUDGETS = 'BUDGETS',
  GOALS = 'GOALS',
  INVESTMENTS = 'INVESTMENTS'
}

/**
 * DTO for data synchronization requests containing client state and changes.
 * Handles the synchronization of offline changes from mobile SQLite databases with the backend system.
 * 
 * Addresses requirements:
 * - Data Synchronization (Technical Specification/1.1 System Overview/Core Features)
 * - Offline Support (Technical Specification/5.2.1 Mobile Applications)
 * - Input Validation (Technical Specification/9.3.1 API Security)
 */
export class SyncRequestDto {
  @ApiProperty({
    description: 'Unique identifier of the client device',
    example: 'device-123'
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({
    description: 'Timestamp of last successful sync',
    example: '2023-01-01T00:00:00Z'
  })
  @IsDate()
  @Type(() => Date)
  lastSyncTimestamp: Date;

  @ApiProperty({
    description: 'Type of entity being synchronized',
    enum: SyncEntityType
  })
  @IsEnum(SyncEntityType)
  entityType: SyncEntityType;

  @ApiProperty({
    description: 'Array of changes to be synchronized',
    type: [Object]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  changes: object[];

  @ApiProperty({
    description: 'Client application version',
    example: '1.0.0'
  })
  @IsString()
  @IsOptional()
  clientVersion?: string;
}