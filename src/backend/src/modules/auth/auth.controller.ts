// @nestjs/common ^9.0.0
import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  HttpCode,
  UnauthorizedException,
  BadRequestException
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './strategies/jwt.strategy';

/**
 * Human Tasks:
 * 1. Configure rate limiting for authentication endpoints in production
 * 2. Set up monitoring for failed authentication attempts
 * 3. Configure JWT RS256 key pair in production environment
 * 4. Implement audit logging for authentication events
 * 5. Set up alerts for suspicious authentication patterns
 */

/**
 * Controller handling authentication endpoints with secure token management
 * and comprehensive input validation.
 * 
 * Requirements addressed:
 * - Authentication Methods (Technical Specification/9.1.1)
 * - Session Management (Technical Specification/9.1.3)
 * - API Security (Technical Specification/9.3.1)
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Handles user login requests with secure credential validation
   * 
   * Requirements addressed:
   * - Authentication Methods (Technical Specification/9.1.1)
   *   Implements email/password authentication with JWT tokens
   * - Session Management (Technical Specification/9.1.3)
   *   Returns access token (15m) and refresh token (7d)
   * - API Security (Technical Specification/9.3.1)
   *   Implements comprehensive input validation
   * 
   * @param loginDto Login credentials with validation
   * @returns Access token, refresh token and filtered user data
   */
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto): Promise<object> {
    try {
      const authResult = await this.authService.login(loginDto);
      return authResult;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Invalid login request');
    }
  }

  /**
   * Handles new user registration with comprehensive validation
   * 
   * Requirements addressed:
   * - Authentication Methods (Technical Specification/9.1.1)
   *   Implements secure user registration with validation
   * - API Security (Technical Specification/9.3.1)
   *   Enforces strong password requirements and input validation
   * 
   * @param registerDto Registration data with validation
   * @returns Access token and filtered user data
   */
  @Post('register')
  @HttpCode(201)
  async register(@Body() registerDto: RegisterDto): Promise<object> {
    try {
      const registrationResult = await this.authService.register(registerDto);
      return registrationResult;
    } catch (error) {
      if (error.code === '23505') { // PostgreSQL unique violation
        throw new BadRequestException('Email already registered');
      }
      throw new BadRequestException('Invalid registration data');
    }
  }

  /**
   * Refreshes access token using valid refresh token
   * 
   * Requirements addressed:
   * - Session Management (Technical Specification/9.1.3)
   *   Implements secure token refresh mechanism with 15-minute access tokens
   * - API Security (Technical Specification/9.3.1)
   *   Validates refresh token signature and expiry
   * 
   * @param refreshToken Valid refresh token
   * @returns New access token with 15m expiry
   */
  @Post('refresh')
  @HttpCode(200)
  async refreshToken(@Body('refreshToken') refreshToken: string): Promise<object> {
    try {
      if (!refreshToken) {
        throw new BadRequestException('Refresh token is required');
      }
      const tokenResult = await this.authService.refreshToken(refreshToken);
      return tokenResult;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Invalid refresh token request');
    }
  }

  /**
   * Handles user logout with token invalidation
   * 
   * Requirements addressed:
   * - Session Management (Technical Specification/9.1.3)
   *   Implements secure session termination
   * - API Security (Technical Specification/9.3.1)
   *   Requires valid JWT authentication
   * 
   * @param userId User ID for logout
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async logout(@Body('userId') userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      await this.authService.logout(userId);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Invalid logout request');
    }
  }
}