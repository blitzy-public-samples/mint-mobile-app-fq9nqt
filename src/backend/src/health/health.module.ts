/**
 * Human Tasks:
 * 1. Configure health check thresholds in environment variables
 * 2. Set up alerts for failed health checks
 * 3. Configure monitoring dashboards to display health metrics
 * 4. Set up automated recovery procedures for failed components
 * 5. Document health check response formats for monitoring tools
 */

// @nestjs/common v9.0.0
import { Module } from '@nestjs/common';

// @nestjs/terminus v9.0.0
import { TerminusModule } from '@nestjs/terminus';

// @nestjs/axios v1.0.0
import { HttpModule } from '@nestjs/axios';

// Internal imports
import { HealthController } from './health.controller';

/**
 * Module that configures comprehensive health check functionality with role-based access control
 * 
 * Requirements addressed:
 * - Health Monitoring (5.2.3 Service Layer Architecture): Configures health check module for monitoring 
 *   service status and dependencies including API availability, disk storage, and memory usage
 * - System Monitoring (10.5.2 GitHub Actions Workflow): Provides health check configuration for 
 *   deployment validation and monitoring with role-based access control
 */
@Module({
  imports: [
    // Import TerminusModule for health check functionality
    TerminusModule,
    
    // Import HttpModule for external service health checks
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    })
  ],
  controllers: [HealthController]
})
export class HealthModule {}