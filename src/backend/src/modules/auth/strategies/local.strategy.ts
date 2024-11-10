// @nestjs/common v9.0.0
import { Injectable, UnauthorizedException } from '@nestjs/common';
// @nestjs/passport v9.0.0
import { PassportStrategy } from '@nestjs/passport';
// passport-local v1.0.0
import { Strategy } from 'passport-local';

import { AuthService } from '../auth.service';

/**
 * Human Tasks:
 * 1. Configure rate limiting for authentication attempts
 * 2. Set up monitoring and alerting for failed login attempts
 * 3. Implement IP-based blocking after multiple failed attempts
 */

/**
 * Implements Passport.js local authentication strategy for email/password authentication
 * 
 * Requirements addressed:
 * - Email/Password Authentication (Technical Specification/9.1.1)
 * - Security Controls (Technical Specification/9.3.1)
 */
@Injectable()
@PassportStrategy(Strategy)
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // Configure strategy to use email field instead of username
      passwordField: 'password',
      passReqToCallback: false
    });
  }

  /**
   * Validates user credentials using the AuthService
   * 
   * Requirements addressed:
   * - Email/Password Authentication (Technical Specification/9.1.1)
   *   Implementation: Secure credential validation with bcrypt password comparison
   * - Security Controls (Technical Specification/9.3.1)
   *   Implementation: Proper error handling and secure validation flow
   * 
   * @param email User's email address
   * @param password User's password
   * @returns Validated user object with sensitive data removed
   * @throws UnauthorizedException if credentials are invalid
   */
  async validate(email: string, password: string): Promise<any> {
    // Validate credentials using AuthService
    const user = await this.authService.validateUser(email, password);
    
    // Throw UnauthorizedException if validation fails
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Return validated user object (sensitive data already removed by AuthService)
    return user;
  }
}