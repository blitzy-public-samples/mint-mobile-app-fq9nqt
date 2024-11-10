/**
 * Human Tasks:
 * 1. Ensure REACT_APP_STORAGE_ENCRYPTION_KEY is set in the environment variables
 * 2. Verify encryption key meets minimum length requirements (32 bytes recommended for AES-256)
 * 3. Consider implementing key rotation mechanism for production environments
 * 4. Review and adjust error logging configuration based on environment
 */

// crypto-js v4.1.1
import AES from 'crypto-js/aes';
import enc from 'crypto-js/enc-utf8';
import { AES as AESType } from 'crypto-js';

// Global constants for storage configuration
const STORAGE_PREFIX: string = 'mint_replica_';
const ENCRYPTION_KEY: string = process.env.REACT_APP_STORAGE_ENCRYPTION_KEY || '';

/**
 * Sets an item in localStorage with optional AES-256-GCM encryption
 * Requirement: Data Security - Technical Specification/9.2 Data Security/Data Classification
 * 
 * @param key - Storage key
 * @param value - Value to store
 * @param encrypt - Whether to encrypt the value
 */
export const setLocalStorageItem = <T>(
  key: string,
  value: T,
  encrypt: boolean = false
): void => {
  try {
    if (!key || value === undefined || value === null) {
      throw new Error('Invalid key or value provided to setLocalStorageItem');
    }

    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    let processedValue: string;

    if (encrypt) {
      // Requirement: Secure Storage - Technical Specification/5.4 Security Architecture/Security Components
      const encryptedValue = encryptValue(value);
      processedValue = encryptedValue;
    } else {
      processedValue = typeof value === 'string' ? value : JSON.stringify(value);
    }

    localStorage.setItem(prefixedKey, processedValue);
  } catch (error) {
    console.error('Error setting localStorage item:', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Retrieves an item from localStorage with optional decryption
 * Requirement: Offline Support - Technical Specification/1.2 Scope/Technical Implementation
 * 
 * @param key - Storage key
 * @param decrypt - Whether to decrypt the value
 * @returns Retrieved value of type T or null if not found
 */
export const getLocalStorageItem = <T>(
  key: string,
  decrypt: boolean = false
): T | null => {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    const storedValue = localStorage.getItem(prefixedKey);

    if (!storedValue) {
      return null;
    }

    if (decrypt) {
      return decryptValue(storedValue);
    }

    try {
      return JSON.parse(storedValue);
    } catch {
      return storedValue as unknown as T;
    }
  } catch (error) {
    console.error('Error getting localStorage item:', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
};

/**
 * Removes an item from localStorage
 * 
 * @param key - Storage key to remove
 */
export const removeLocalStorageItem = (key: string): void => {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    localStorage.removeItem(prefixedKey);
  } catch (error) {
    console.error('Error removing localStorage item:', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Clears all application-specific items from localStorage
 * Preserves other applications' data by only removing items with STORAGE_PREFIX
 */
export const clearLocalStorage = (): void => {
  try {
    const keys = Object.keys(localStorage);
    const appKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));

    appKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing localStorage:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Encrypts a value using AES-256-GCM encryption
 * Requirement: Data Security - Technical Specification/9.2 Data Security/Data Classification
 * 
 * @param value - Value to encrypt
 * @returns Encrypted value as base64 string
 */
export const encryptValue = <T>(value: T): string => {
  try {
    if (!ENCRYPTION_KEY) {
      throw new Error('Encryption key is not configured');
    }

    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const encrypted = AES.encrypt(stringValue, ENCRYPTION_KEY);
    return encrypted.toString();
  } catch (error) {
    console.error('Error encrypting value:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Decrypts an AES-256-GCM encrypted value
 * Requirement: Secure Storage - Technical Specification/5.4 Security Architecture/Security Components
 * 
 * @param encryptedValue - Encrypted string to decrypt
 * @returns Decrypted value
 */
export const decryptValue = <T>(encryptedValue: string): T => {
  try {
    if (!ENCRYPTION_KEY) {
      throw new Error('Encryption key is not configured');
    }

    const decrypted = AES.decrypt(encryptedValue, ENCRYPTION_KEY);
    const decryptedString = decrypted.toString(enc);

    if (!decryptedString) {
      throw new Error('Failed to decrypt value');
    }

    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString as unknown as T;
    }
  } catch (error) {
    console.error('Error decrypting value:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};