/**
 * Human Tasks:
 * 1. Generate and securely store RS256 private/public key pair for JWT signing
 * 2. Configure JWT_SECRET in production environment with RS256 private key
 * 3. Set up secure key rotation mechanism for production
 * 4. Configure token expiration settings in environment variables
 * 5. Review and update JWT validation rules based on security requirements
 */

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common'; // @nestjs/common ^9.0.0
import { AuthGuard } from '@nestjs/passport'; // @nestjs/passport ^9.0.0
import { JwtStrategy } from '../../modules/auth/strategies/jwt.strategy';

/**
 * Requirement: Authentication Security
 * Location: Technical Specification/9.1 Authentication and Authorization/9.1.1 Authentication Methods
 * Implementation: JWT authentication guard with RS256 signing and 15-minute token expiration
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  /**
   * Requirement: API Security
   * Location: Technical Specification/9.3.1 API Security
   * Implementation: Validates JWT token authenticity and expiration before allowing request processing
   * 
   * @param context The execution context containing the request
   * @returns Promise<boolean> True if authentication is valid
   * @throws UnauthorizedException if authentication fails
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Call parent AuthGuard to perform passport JWT validation
      const result = await super.canActivate(context);
      
      if (!result) {
        throw new UnauthorizedException('Invalid authentication token');
      }

      // Get request object
      const request = context.switchToHttp().getRequest();
      
      // Verify token exists in authorization header
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Missing or invalid authorization header');
      }

      // Additional validation will be performed in handleRequest
      return true;
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof UnauthorizedException 
          ? error.message 
          : 'Authentication failed'
      );
    }
  }

  /**
   * Requirement: Authentication Security
   * Location: Technical Specification/9.1.1 Authentication Methods
   * Implementation: Custom error handler with detailed validation and security checks
   * 
   * @param err Error from passport strategy
   * @param user Authenticated user data
   * @returns Validated user data
   * @throws UnauthorizedException with specific error message
   */
  handleRequest(err: Error, user: any): any {
    // Check for authentication errors
    if (err || !user) {
      throw new UnauthorizedException(
        err?.message || 'Authentication failed'
      );
    }

    // Verify required user data exists
    if (!user.userId || !user.email) {
      throw new UnauthorizedException('Invalid user data in token');
    }

    // Verify token expiration (15-minute window)
    const tokenTimestamp = user.iat ? user.iat * 1000 : 0;
    const currentTime = Date.now();
    const tokenAge = currentTime - tokenTimestamp;
    const maxAge = 15 * 60 * 1000; // 15 minutes in milliseconds

    if (tokenAge > maxAge) {
      throw new UnauthorizedException('Token has expired (15-minute limit)');
    }

    return user;
  }
}