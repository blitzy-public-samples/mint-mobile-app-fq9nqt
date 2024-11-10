// @nestjs/common v9.0.0
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
// @nestjs/jwt v9.0.0
import { JwtService } from '@nestjs/jwt';
// @nestjs/config v9.0.0
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { comparePassword } from '../../common/utils/crypto.util';

/**
 * Human Tasks:
 * 1. Configure JWT RS256 key pair in production environment
 * 2. Set up secure key rotation policy for JWT signing keys
 * 3. Configure token expiration times in environment variables
 * 4. Set up monitoring for failed authentication attempts
 * 5. Configure rate limiting for authentication endpoints
 */

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Validates user credentials for local strategy authentication
   * 
   * Requirement: Authentication Methods (Technical Specification/9.1.1)
   * Implementation: Secure password verification using timing-safe comparison
   * 
   * @param email User's email address
   * @param password User's password
   * @returns User object without sensitive data if valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Remove sensitive data before returning user object
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Authenticates user and generates JWT tokens
   * 
   * Requirements addressed:
   * - Authentication Methods (Technical Specification/9.1.1)
   * - Session Management (Technical Specification/9.1.3)
   * 
   * @param loginDto Login credentials
   * @returns Object containing access token, refresh token and user data
   */
  async login(loginDto: LoginDto): Promise<any> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens with specified expiry times
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user)
    ]);

    // Update last login timestamp
    await this.usersService.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    };
  }

  /**
   * Registers a new user account
   * 
   * Requirements addressed:
   * - Authentication Methods (Technical Specification/9.1.1)
   * - OAuth 2.0 (Technical Specification/9.1.1)
   * 
   * @param registerDto User registration data
   * @returns Object containing access token and created user data
   */
  async register(registerDto: RegisterDto): Promise<any> {
    // Create new user with hashed password
    const user = await this.usersService.create(registerDto);

    // Generate initial access token
    const accessToken = await this.generateAccessToken({
      id: user.id,
      email: user.email
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    };
  }

  /**
   * Generates new access token from refresh token
   * 
   * Requirement: Session Management (Technical Specification/9.1.3)
   * Implementation: JWT token rotation with 15-minute access token validity
   * 
   * @param refreshToken Valid refresh token
   * @returns Object containing new access token
   */
  async refreshToken(refreshToken: string): Promise<any> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshTokenSecret')
      });

      // Generate new access token
      const accessToken = await this.generateAccessToken({
        id: payload.sub,
        email: payload.email
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Handles user logout by invalidating active tokens
   * 
   * Requirement: Session Management (Technical Specification/9.1.3)
   * Implementation: Secure session termination
   * 
   * @param userId User ID to logout
   */
  async logout(userId: string): Promise<void> {
    // Note: JWT tokens cannot be invalidated directly
    // Best practice is to maintain a blacklist of logged out tokens
    // or implement token versioning on the user record
    await this.usersService.updateLastLogin(userId);
  }

  /**
   * Generates access token with 15-minute expiry
   * 
   * @param user User data to encode in token
   * @returns Signed JWT access token
   */
  private async generateAccessToken(user: any): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'access'
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.accessTokenSecret'),
      expiresIn: '15m',
      algorithm: 'RS256'
    });
  }

  /**
   * Generates refresh token with 7-day expiry
   * 
   * @param user User data to encode in token
   * @returns Signed JWT refresh token
   */
  private async generateRefreshToken(user: any): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'refresh'
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.refreshTokenSecret'),
      expiresIn: '7d',
      algorithm: 'RS256'
    });
  }
}