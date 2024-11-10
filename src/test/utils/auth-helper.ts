// Third-party imports with versions
import { JwtService } from '@nestjs/jwt'; // ^9.0.0

// Internal imports
import { AuthService } from '../../backend/src/modules/auth/auth.service';
import { createMockUser } from './mock-data';
import { TestLogger } from './test-logger';

/**
 * Human Tasks:
 * 1. Ensure JWT_SECRET is configured in test environment
 * 2. Configure test user credentials in test environment if needed
 * 3. Set up test database with required user tables
 * 4. Configure test authentication timeouts
 * 5. Ensure proper cleanup of test users after test execution
 */

// Initialize test logger
const logger = new TestLogger({ logLevel: 'debug' });

/**
 * Creates a test user with authentication credentials
 * 
 * Requirements addressed:
 * - Authentication Methods (Technical Specification/9.1.1)
 * - Testing Standards (Technical Specification/8. System Design/Testing Standards)
 * 
 * @param overrides Optional user data overrides
 * @returns Created test user object and raw password
 */
export async function createTestUser(overrides: Partial<any> = {}): Promise<{ user: any; password: string }> {
  try {
    // Generate mock user data with password
    const password = 'TestPass123!'; // Default test password
    const mockUser = createMockUser({
      password,
      ...overrides
    });

    // Register user using AuthService
    const authService = new AuthService(null, null, null); // Inject actual dependencies in your test setup
    const { user } = await authService.register({
      email: mockUser.email,
      password: password,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName
    });

    logger.debug('Created test user', { userId: user.id, email: user.email });

    return { user, password };
  } catch (error) {
    logger.logError(error, 'Failed to create test user');
    throw error;
  }
}

/**
 * Logs in a test user and returns JWT tokens
 * 
 * Requirements addressed:
 * - Session Management (Technical Specification/9.1.3)
 * - Authentication Methods (Technical Specification/9.1.1)
 * 
 * @param email User email
 * @param password User password
 * @returns JWT access token and refresh token
 */
export async function loginTestUser(
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const authService = new AuthService(null, null, null); // Inject actual dependencies in your test setup
    const { accessToken, refreshToken } = await authService.login({
      email,
      password
    });

    logger.debug('Logged in test user', { email });

    return { accessToken, refreshToken };
  } catch (error) {
    logger.logError(error, 'Failed to login test user');
    throw error;
  }
}

/**
 * Generates a test JWT token with custom claims
 * 
 * Requirements addressed:
 * - Session Management (Technical Specification/9.1.3)
 * - Authentication Methods (Technical Specification/9.1.1)
 * 
 * @param payload Custom token payload
 * @returns RS256-signed JWT token
 */
export function generateTestToken(payload: any): string {
  try {
    const jwtService = new JwtService({
      secret: process.env.JWT_SECRET,
      signOptions: {
        algorithm: 'RS256',
        expiresIn: '15m'
      }
    });

    const token = jwtService.sign(payload);
    logger.debug('Generated test token', { subject: payload.sub });

    return token;
  } catch (error) {
    logger.logError(error, 'Failed to generate test token');
    throw error;
  }
}

/**
 * Verifies and decodes a test JWT token
 * 
 * Requirements addressed:
 * - Session Management (Technical Specification/9.1.3)
 * - Authentication Methods (Technical Specification/9.1.1)
 * 
 * @param token JWT token to verify
 * @returns Decoded token payload
 */
export function verifyTestToken(token: string): any {
  try {
    const jwtService = new JwtService({
      secret: process.env.JWT_SECRET,
      verifyOptions: {
        algorithms: ['RS256']
      }
    });

    const decoded = jwtService.verify(token);
    logger.debug('Verified test token', { subject: decoded.sub });

    return decoded;
  } catch (error) {
    logger.logError(error, 'Failed to verify test token');
    throw error;
  }
}

/**
 * Cleans up test authentication data
 * 
 * Requirements addressed:
 * - Testing Standards (Technical Specification/8. System Design/Testing Standards)
 * - Session Management (Technical Specification/9.1.3)
 * 
 * @param userId User ID to clean up
 */
export async function clearTestAuth(userId: string): Promise<void> {
  try {
    const authService = new AuthService(null, null, null); // Inject actual dependencies in your test setup
    
    // Logout user and invalidate tokens
    await authService.logout(userId);
    
    // Additional cleanup as needed (e.g., remove test user)
    // await userService.remove(userId);

    logger.debug('Cleared test auth data', { userId });
  } catch (error) {
    logger.logError(error, 'Failed to clear test auth data');
    throw error;
  }
}