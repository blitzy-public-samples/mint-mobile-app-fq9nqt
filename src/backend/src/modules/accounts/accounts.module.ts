// Third-party imports with versions
import { Module } from '@nestjs/common'; // ^9.0.0
import { TypeOrmModule } from '@nestjs/typeorm'; // ^9.0.0

// Internal imports
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { Account } from './entities/account.entity';

/**
 * Human Tasks:
 * 1. Configure Plaid API credentials in environment variables
 * 2. Set up database encryption keys for sensitive data
 * 3. Configure rate limiting for account operations
 * 4. Set up monitoring and alerts for account activities
 * 5. Configure audit logging for sensitive operations
 */

/**
 * Module that configures and exports the accounts feature module
 * 
 * Requirements addressed:
 * - Financial Account Integration (Technical Specification/1.2 Scope/Core Features)
 *   Configures module for secure financial institution integration and account aggregation through Plaid
 * 
 * - System Architecture (Technical Specification/5.2.3 Service Layer Architecture)
 *   Implements modular architecture for account management services with proper dependency injection
 * 
 * - Data Security (Technical Specification/9.2 Data Security)
 *   Ensures secure handling of sensitive financial data with proper repository configuration
 */
@Module({
  imports: [
    // Configure TypeORM for Account entity with field-level encryption
    TypeOrmModule.forFeature([Account])
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService]
})
export class AccountsModule {}