// Third-party imports with versions
import { Module } from '@nestjs/common'; // ^9.0.0
import { ConfigModule } from '@nestjs/config'; // ^2.0.0

// Internal imports
import { PlaidService } from './plaid.service';
import { PlaidController } from './plaid.controller';

/**
 * Human Tasks:
 * 1. Ensure Plaid API credentials are properly configured in environment variables:
 *    - PLAID_CLIENT_ID
 *    - PLAID_SECRET
 *    - PLAID_ENV (sandbox/development/production)
 * 2. Verify ConfigModule is properly imported in the root AppModule
 * 3. Configure proper environment-specific Plaid settings in configuration files
 */

/**
 * Module that configures Plaid integration services for secure financial account aggregation
 * Requirements addressed:
 * - Financial Institution Integration (Technical Specification/1.1 System Overview/Core Components)
 *   Configures third-party integrations for financial data aggregation with secure API endpoints
 * - Account Aggregation (Technical Specification/1.2 Scope/Core Features)
 *   Provides module configuration for secure financial account integration and real-time data synchronization
 * - Data Security (Technical Specification/9.2 Data Security/Data Classification)
 *   Ensures secure configuration for handling sensitive financial data with proper encryption and access controls
 */
@Module({
  imports: [
    // Import ConfigModule for accessing environment-based Plaid configuration
    ConfigModule
  ],
  controllers: [
    // Register PlaidController to handle Plaid-related HTTP requests
    PlaidController
  ],
  providers: [
    // Register PlaidService as a provider for Plaid API integration functionality
    PlaidService
  ],
  exports: [
    // Export PlaidService to make it available to other modules
    PlaidService
  ]
})
export class PlaidModule {}