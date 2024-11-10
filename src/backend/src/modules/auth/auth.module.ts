/**
 * Human Tasks:
 * 1. Generate and securely store RS256 key pair for JWT signing in production
 * 2. Configure JWT token secrets and expiration times in environment variables
 * 3. Set up monitoring for authentication failures and suspicious patterns
 * 4. Configure rate limiting for authentication endpoints
 * 5. Implement secure key rotation policy for JWT signing keys
 */

// @nestjs/common v9.0.0
import { Module } from '@nestjs/common';
// @nestjs/passport v9.0.0
import { PassportModule } from '@nestjs/passport';
// @nestjs/jwt v9.0.0
import { JwtModule } from '@nestjs/jwt';
// @nestjs/config v9.0.0
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * AuthModule configures and exports the authentication feature module
 * 
 * Requirements addressed:
 * - Authentication Methods (Technical Specification/9.1.1)
 *   Implementation: Email/password authentication with bcrypt (cost factor 12)
 *   and JWT tokens with RS256 signing
 * 
 * - OAuth 2.0 (Technical Specification/9.1.1)
 *   Implementation: JWT token authentication with RS256 signing and secure
 *   token management
 * 
 * - Session Management (Technical Specification/9.1.3)
 *   Implementation: JWT token lifecycle with 15-minute access tokens and
 *   7-day refresh tokens
 */
@Module({
  imports: [
    // Import required modules
    UsersModule,
    
    // Configure Passport with JWT as default strategy
    PassportModule.register({ 
      defaultStrategy: 'jwt' 
    }),
    
    // Configure JWT module with RS256 signing
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { 
          algorithm: 'RS256',
          expiresIn: '15m', // 15-minute access tokens
          issuer: 'mint-replica-lite',
          audience: 'mint-replica-api'
        },
        verifyOptions: {
          algorithms: ['RS256'], // Only allow RS256
          issuer: 'mint-replica-lite',
          audience: 'mint-replica-api'
        }
      }),
      inject: [ConfigService]
    }),
    
    // Import ConfigModule for environment variables
    ConfigModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy
  ],
  exports: [AuthService] // Export AuthService for use in other modules
})
export class AuthModule {}