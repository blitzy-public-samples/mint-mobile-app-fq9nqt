/**
 * Human Tasks:
 * 1. Ensure JWT token secret is properly configured in environment variables
 * 2. Configure token expiration times in environment settings
 * 3. Set up secure password requirements in validation constants
 */

/**
 * Authentication type definitions for Mint Replica Lite web application
 * 
 * Requirements addressed:
 * - Technical Specification/9.1.1 Authentication Methods: Email/password authentication with JWT tokens
 * - Technical Specification/9.1.3 Session Management: JWT token and session state management types
 * - Technical Specification/8.4.1 Authentication Flow: Types for login, registration, and token refresh
 */

/**
 * Interface representing login request credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Interface representing registration request credentials
 */
export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Interface representing user data
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface representing the authentication state
 * Used for managing the user's authentication status and tokens
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * Interface representing authentication API responses
 * Used for handling login, registration, and token refresh responses
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Interface representing password reset request credentials
 */
export interface PasswordResetCredentials {
  token: string;
  newPassword: string;
}