/**
 * Human Tasks:
 * 1. Ensure REACT_APP_STORAGE_ENCRYPTION_KEY is set in the environment variables
 * 2. Verify encryption key meets minimum length requirements (32 bytes recommended for AES-256)
 * 3. Consider implementing key rotation mechanism for production environments
 * 4. Review and adjust error logging configuration based on environment
 */

import { User } from '../../types/models.types';
import {
  setLocalStorageItem,
  getLocalStorageItem,
  removeLocalStorageItem,
  clearLocalStorage
} from '../../utils/storage.utils';

/**
 * Service class for managing local storage operations with AES-256-GCM encryption support
 * Addresses requirements:
 * - Offline Support (Technical Specification/1.2 Scope/Technical Implementation)
 * - Data Security (Technical Specification/9.2 Data Security/Data Classification)
 * - Secure Storage (Technical Specification/5.4 Security Architecture/Security Components)
 */
export class LocalStorageService {
  // Storage keys for different data types
  private static readonly AUTH_TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'user_data';
  private static readonly PREFERENCES_KEY = 'user_preferences';

  /**
   * Stores authentication token in localStorage with AES-256-GCM encryption
   * @param token - JWT authentication token
   */
  public static setAuthToken(token: string): void {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid authentication token provided');
    }

    try {
      // Store token with encryption enabled for security
      setLocalStorageItem(this.AUTH_TOKEN_KEY, token, true);
    } catch (error) {
      console.error('Failed to store authentication token:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Retrieves encrypted authentication token from localStorage
   * @returns Decrypted auth token or null if not found
   */
  public static getAuthToken(): string | null {
    try {
      // Retrieve and decrypt token
      return getLocalStorageItem<string>(this.AUTH_TOKEN_KEY, true);
    } catch (error) {
      console.error('Failed to retrieve authentication token:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Removes authentication token from localStorage
   */
  public static removeAuthToken(): void {
    try {
      removeLocalStorageItem(this.AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove authentication token:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Stores user data in localStorage with AES-256-GCM encryption
   * @param user - User object containing profile and preferences
   */
  public static setUser(user: User): void {
    if (!user || !user.id || !user.email) {
      throw new Error('Invalid user data provided');
    }

    try {
      // Store user data with encryption enabled for sensitive information
      setLocalStorageItem(this.USER_KEY, user, true);
    } catch (error) {
      console.error('Failed to store user data:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: user.id
      });
      throw error;
    }
  }

  /**
   * Retrieves encrypted user data from localStorage
   * @returns Decrypted user data or null if not found
   */
  public static getUser(): User | null {
    try {
      // Retrieve and decrypt user data
      return getLocalStorageItem<User>(this.USER_KEY, true);
    } catch (error) {
      console.error('Failed to retrieve user data:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Removes user data from localStorage
   */
  public static removeUser(): void {
    try {
      removeLocalStorageItem(this.USER_KEY);
    } catch (error) {
      console.error('Failed to remove user data:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Stores user preferences in localStorage without encryption
   * @param preferences - User preferences object
   */
  public static setPreferences(preferences: Record<string, any>): void {
    if (!preferences || typeof preferences !== 'object') {
      throw new Error('Invalid preferences data provided');
    }

    try {
      // Store preferences without encryption as they don't contain sensitive data
      setLocalStorageItem(this.PREFERENCES_KEY, preferences, false);
    } catch (error) {
      console.error('Failed to store user preferences:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Retrieves user preferences from localStorage
   * @returns User preferences or null if not found
   */
  public static getPreferences(): Record<string, any> | null {
    try {
      // Retrieve preferences without decryption
      return getLocalStorageItem<Record<string, any>>(this.PREFERENCES_KEY, false);
    } catch (error) {
      console.error('Failed to retrieve user preferences:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Clears all application data from localStorage
   * Preserves other applications' data
   */
  public static clearAll(): void {
    try {
      clearLocalStorage();
    } catch (error) {
      console.error('Failed to clear local storage:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}