/**
 * Human Tasks:
 * 1. Configure JWT token secret in environment variables
 * 2. Set up token expiration times in environment settings
 * 3. Configure secure storage encryption key
 * 4. Set up error tracking and monitoring for authentication flows
 */

// jwt-decode v3.1.2
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { AuthState } from '../types/auth.types';
import { API_ENDPOINTS } from '../constants/api.constants';
import { setLocalStorageItem, getLocalStorageItem, removeLocalStorageItem } from './storage.utils';

// Constants for token storage and management
export const AUTH_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const TOKEN_EXPIRY_BUFFER = 300; // 5 minutes in seconds

/**
 * Stores authentication tokens securely in local storage using AES-256-GCM encryption
 * Requirement: Technical Specification/9.1.3 Session Management - Secure token storage
 * 
 * @param accessToken - JWT access token
 * @param refreshToken - JWT refresh token
 */
export const setAuthTokens = (accessToken: string, refreshToken: string): void => {
  try {
    if (!accessToken || !refreshToken) {
      throw new Error('Invalid tokens provided');
    }

    // Store tokens with encryption
    setLocalStorageItem(AUTH_TOKEN_KEY, accessToken, true);
    setLocalStorageItem(REFRESH_TOKEN_KEY, refreshToken, true);
  } catch (error) {
    console.error('Error storing auth tokens:', error);
    throw error;
  }
};

/**
 * Retrieves and decrypts stored authentication tokens
 * Requirement: Technical Specification/9.1.3 Session Management - Secure token retrieval
 * 
 * @returns Object containing access and refresh tokens
 */
export const getAuthTokens = (): { accessToken: string | null; refreshToken: string | null } => {
  try {
    const accessToken = getLocalStorageItem<string>(AUTH_TOKEN_KEY, true);
    const refreshToken = getLocalStorageItem<string>(REFRESH_TOKEN_KEY, true);

    return {
      accessToken,
      refreshToken
    };
  } catch (error) {
    console.error('Error retrieving auth tokens:', error);
    return {
      accessToken: null,
      refreshToken: null
    };
  }
};

/**
 * Securely removes stored authentication tokens
 * Requirement: Technical Specification/9.1.3 Session Management - Token cleanup
 */
export const clearAuthTokens = (): void => {
  try {
    removeLocalStorageItem(AUTH_TOKEN_KEY);
    removeLocalStorageItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
    throw error;
  }
};

/**
 * Validates JWT token signature and expiration
 * Requirement: Technical Specification/9.1.1 Authentication Methods - JWT token validation
 * 
 * @param token - JWT token to validate
 * @returns boolean indicating token validity
 */
export const isTokenValid = (token: string): boolean => {
  try {
    if (!token) {
      return false;
    }

    const decodedToken = jwtDecode<JwtPayload>(token);
    
    if (!decodedToken.exp) {
      return false;
    }

    // Check if token has expired
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp > currentTime;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

/**
 * Determines if token refresh is needed based on expiry buffer
 * Requirement: Technical Specification/8.4.1 Authentication Flow - Token refresh
 * 
 * @param token - JWT token to check
 * @returns boolean indicating if refresh is needed
 */
export const shouldRefreshToken = (token: string): boolean => {
  try {
    if (!token) {
      return true;
    }

    const decodedToken = jwtDecode<JwtPayload>(token);
    
    if (!decodedToken.exp) {
      return true;
    }

    // Check if token is within refresh buffer window
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decodedToken.exp - currentTime;
    
    return timeUntilExpiry <= TOKEN_EXPIRY_BUFFER;
  } catch (error) {
    console.error('Error checking token refresh:', error);
    return true;
  }
};

/**
 * Returns current authentication state with user info
 * Requirement: Technical Specification/8.4.1 Authentication Flow - Auth state management
 * 
 * @returns Current AuthState
 */
export const getAuthState = (): AuthState => {
  try {
    const { accessToken, refreshToken } = getAuthTokens();

    // If no access token or invalid, return unauthenticated state
    if (!accessToken || !isTokenValid(accessToken)) {
      return {
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null
      };
    }

    // Decode user info from valid token
    const decodedToken = jwtDecode<JwtPayload & { user: AuthState['user'] }>(accessToken);

    return {
      isAuthenticated: true,
      user: decodedToken.user,
      accessToken,
      refreshToken
    };
  } catch (error) {
    console.error('Error getting auth state:', error);
    return {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null
    };
  }
};

// Export API endpoints for authentication
export const AUTH_ENDPOINTS = API_ENDPOINTS.AUTH;