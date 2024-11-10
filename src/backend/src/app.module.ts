/**
 * Human Tasks:
 * 1. Configure environment variables for database connection in .env file
 * 2. Set up AWS CloudWatch credentials for request logging
 * 3. Configure rate limiting thresholds based on environment
 * 4. Set up monitoring alerts for rate limiting events
 * 5. Configure task scheduling intervals in environment variables
 */

// Third-party imports with versions
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'; // ^9.0.0
import { ConfigModule, ConfigService } from '@nestjs/config'; // ^9.0.0
import { TypeOrmModule } from '@nestjs/typeorm'; // ^9.0.0
import { ThrottlerModule } from '@nestjs/throttler'; // ^3.0.0
import { ScheduleModule } from '@nestjs/schedule'; // ^2.0.0

// Internal module imports
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AccountsModule } from './modules/accounts/accounts.module';

// Middleware imports
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';

/**
 * Root module for the Mint Replica Lite NestJS backend application
 * 
 * Requirements addressed:
 * - System Architecture (Technical Specification/5.1 High-Level Architecture Overview)
 *   Implements modular backend architecture with independent service components
 *   and proper dependency injection
 * 
 * - Security Architecture (Technical Specification/5.4 Security Architecture)
 *   Configures application-wide security features including rate limiting,
 *   request tracing, and secure logging
 * 
 * - Database Architecture (Technical Specification/5.2.4 Data Architecture)
 *   Sets up TypeORM integration with PostgreSQL for secure data persistence
 */
@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true, // Make configuration globally available
      cache: true // Enable configuration caching
    }),

    // Database configuration with TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: ['dist/**/*.entity{.ts,.js}'],
        synchronize: false, // Disable auto-sync in production
        logging: configService.get<string>('NODE_ENV') !== 'production',
        ssl: configService.get<string>('NODE_ENV') === 'production',
        extra: {
          max: 20, // Maximum pool size
          idleTimeoutMillis: 30000, // Close idle connections after 30s
          connectionTimeoutMillis: 2000 // Connection timeout after 2s
        }
      }),
      inject: [ConfigService]
    }),

    // Rate limiting configuration
    ThrottlerModule.forRoot({
      ttl: 60, // Time window in seconds
      limit: 100, // Request limit per window
    }),

    // Task scheduling configuration
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    UsersModule,
    AccountsModule
  ],
  controllers: [],
  providers: []
})
export class AppModule implements NestModule {
  /**
   * Configures global middleware for request processing
   * @param consumer Middleware consumer for configuration
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggingMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}