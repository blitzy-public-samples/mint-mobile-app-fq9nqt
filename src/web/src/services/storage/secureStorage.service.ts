/**
 * Human Tasks:
 * 1. Ensure REACT_APP_STORAGE_ENCRYPTION_KEY is set in the environment variables
 * 2. Verify encryption key meets minimum length requirements (32 bytes recommended for AES-256-GCM)
 * 3. Consider implementing key rotation mechanism for production environments
 * 4. Review and adjust error logging configuration based on environment
 */

// crypto-js v4.1.1
import CryptoJS from 'crypto-js';
import { encryptValue, decryptValue } from '../../utils/storage.utils';

/**
 * Service class for managing secure storage operations with AES-256-GCM encryption for sensitive data
 * Implements requirements from:
 * - Technical Specification/9.2 Data Security/Data Classification
 * - Technical Specification/9.2.1 Encryption Standards/Data at Rest
 * - Technical Specification/5.4 Security Architecture/Security Components
 */
export class SecureStorageService {
  // Static key prefixes for different types of sensitive data
  private static readonly SECURE_PREFIX: string = 'secure_';
  private static readonly FINANCIAL_DATA_KEY: string = 'financial_data';
  private static readonly CREDENTIALS_KEY: string = 'credentials';
  private static readonly PLAID_TOKENS_KEY: string = 'plaid_tokens';

  /**
   * Stores data with AES-256-GCM encryption in secure storage
   * @param key - Storage key
   * @param value - Value to store
   * @returns Promise resolving when storage is complete
   */
  public async setSecureItem<T>(key: string, value: T): Promise<void> {
    try {
      if (!key || value === undefined || value === null) {
        throw new Error('Invalid key or value provided to setSecureItem');
      }

      const secureKey = `${SecureStorageService.SECURE_PREFIX}${key}`;
      const encryptedValue = encryptValue(value);
      localStorage.setItem(secureKey, encryptedValue);
    } catch (error) {
      console.error('SecureStorageService: Error setting secure item:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Retrieves and decrypts data from secure storage using AES-256-GCM
   * @param key - Storage key
   * @returns Promise resolving to decrypted value or null if not found
   */
  public async getSecureItem<T>(key: string): Promise<T | null> {
    try {
      const secureKey = `${SecureStorageService.SECURE_PREFIX}${key}`;
      const encryptedValue = localStorage.getItem(secureKey);

      if (!encryptedValue) {
        return null;
      }

      return decryptValue<T>(encryptedValue);
    } catch (error) {
      console.error('SecureStorageService: Error getting secure item:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Removes item from secure storage with proper cleanup
   * @param key - Storage key
   * @returns Promise resolving when removal is complete
   */
  public async removeSecureItem(key: string): Promise<void> {
    try {
      const secureKey = `${SecureStorageService.SECURE_PREFIX}${key}`;
      localStorage.removeItem(secureKey);
    } catch (error) {
      console.error('SecureStorageService: Error removing secure item:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Securely stores sensitive financial data with encryption
   * @param financialData - Financial data object to store
   * @returns Promise resolving when storage is complete
   */
  public async setFinancialData(financialData: Record<string, any>): Promise<void> {
    try {
      await this.setSecureItem(SecureStorageService.FINANCIAL_DATA_KEY, financialData);
    } catch (error) {
      console.error('SecureStorageService: Error setting financial data:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Retrieves encrypted financial data with decryption
   * @returns Promise resolving to decrypted financial data or null
   */
  public async getFinancialData(): Promise<Record<string, any> | null> {
    try {
      return await this.getSecureItem<Record<string, any>>(SecureStorageService.FINANCIAL_DATA_KEY);
    } catch (error) {
      console.error('SecureStorageService: Error getting financial data:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Securely stores Plaid API tokens with encryption
   * @param tokens - Plaid API tokens object
   * @returns Promise resolving when storage is complete
   */
  public async setPlaidTokens(tokens: Record<string, string>): Promise<void> {
    try {
      await this.setSecureItem(SecureStorageService.PLAID_TOKENS_KEY, tokens);
    } catch (error) {
      console.error('SecureStorageService: Error setting Plaid tokens:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Retrieves encrypted Plaid API tokens with decryption
   * @returns Promise resolving to decrypted Plaid tokens or null
   */
  public async getPlaidTokens(): Promise<Record<string, string> | null> {
    try {
      return await this.getSecureItem<Record<string, string>>(SecureStorageService.PLAID_TOKENS_KEY);
    } catch (error) {
      console.error('SecureStorageService: Error getting Plaid tokens:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Clears all secure storage data with proper cleanup
   * @returns Promise resolving when clearing is complete
   */
  public async clearSecureStorage(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const secureKeys = keys.filter(key => 
        key.startsWith(SecureStorageService.SECURE_PREFIX)
      );

      secureKeys.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('SecureStorageService: Error clearing secure storage:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}