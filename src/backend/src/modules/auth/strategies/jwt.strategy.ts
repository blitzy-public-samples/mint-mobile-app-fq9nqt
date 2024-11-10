/**
 * Human Tasks:
 * 1. Generate and securely store RS256 private/public key pair for JWT signing
 * 2. Configure JWT_SECRET in production environment with RS256 private key
 * 3. Set up secure key rotation mechanism for production
 * 4. Configure token expiration settings in environment variables
 * 5. Review and update JWT validation rules based on security requirements
 */

import { Injectable, UnauthorizedException } from '@nestjs/common'; // @nestjs/common ^9.0.0
import { PassportStrategy } from '@nestjs/passport'; // @nestjs/passport ^9.0.0
import { ExtractJwt, Strategy } from 'passport-jwt'; // passport-jwt ^4.0.0
import { ConfigService } from '@nestjs/config'; // @nestjs/config ^9.0.0
import configuration from '../../../config/configuration';

/**
 * Interface defining the structure of JWT payload data
 */
interface JwtPayload {
  sub: string;      // Subject identifier (user ID)
  email: string;    // User email
  iat: number;      // Issued at timestamp
  exp: number;      // Expiration timestamp
}

/**
 * Requirement: OAuth 2.0
 * Location: Technical Specification/9.1.1 Authentication Methods
 * Implementation: JWT strategy with RS256 signing and 15-minute access token expiry
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      algorithms: ['RS256'], // Enforce RS256 signing algorithm
      issuer: 'mint-replica-lite', // Validate token issuer
      audience: 'mint-replica-api', // Validate token audience
    });
  }

  /**
   * Requirement: API Security
   * Location: Technical Specification/9.3.1 API Security
   * Implementation: Secure token validation and user extraction with comprehensive checks
   * 
   * @param payload The decoded JWT payload
   * @returns The validated user data
   * @throws UnauthorizedException if validation fails
   */
  async validate(payload: JwtPayload): Promise<any> {
    try {
      // Verify payload structure
      if (!payload.sub || !payload.email) {
        throw new UnauthorizedException('Invalid token payload structure');
      }

      // Verify token expiration (additional check beyond passport-jwt's built-in check)
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (payload.exp <= currentTimestamp) {
        throw new UnauthorizedException('Token has expired');
      }

      // Verify token age is not too old (max 15 minutes as per requirements)
      const tokenAge = currentTimestamp - payload.iat;
      const maxAge = 15 * 60; // 15 minutes in seconds
      if (tokenAge > maxAge) {
        throw new UnauthorizedException('Token has exceeded maximum age');
      }

      // Return user data for request context
      return {
        userId: payload.sub,
        email: payload.email
      };
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }
}