/**
 * Human Tasks:
 * 1. Ensure TypeORM is properly configured in the application module for PostgreSQL
 * 2. Verify that the encryption keys for sensitive user data are set in environment variables
 * 3. Configure GDPR compliance settings in the application configuration
 */

// @nestjs/common v9.0.0
import { Module } from '@nestjs/common';

// @nestjs/typeorm v9.0.0
import { TypeOrmModule } from '@nestjs/typeorm';

// Internal dependencies
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

/**
 * UsersModule configures and exports the Users feature module
 * 
 * Requirements addressed:
 * - User Authentication (Technical Specification/9.1.1 Authentication Methods)
 *   Configures secure user authentication with Bcrypt password hashing
 * 
 * - Data Security (Technical Specification/9.2.1 Encryption Standards)
 *   Implements TypeORM integration with field-level encryption
 * 
 * - Core User Management (Technical Specification/1.2 Scope/Core Features)
 *   Provides comprehensive user account management with GDPR compliance
 */
@Module({
  imports: [
    // Configure TypeORM for the User entity with field-level encryption
    TypeOrmModule.forFeature([User])
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService] // Export UsersService for use in other modules
})
export class UsersModule {}