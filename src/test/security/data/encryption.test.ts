// @jest/globals v29.0.0
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
// Node.js built-in crypto module
import * as crypto from 'crypto';
// Internal imports
import { encryptData, decryptData, CRYPTO_CONSTANTS } from '../../../backend/src/common/utils/crypto.util';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';

/**
 * Human Tasks:
 * 1. Ensure test environment has proper access to encryption keys
 * 2. Configure secure key storage for test environment
 * 3. Set up test data cleanup procedures
 * 4. Review and update test thresholds based on performance requirements
 * 5. Configure test logging for security audit compliance
 */

// Test data constants
const TEST_DATA_SIZES = {
  SMALL: 1024, // 1KB
  MEDIUM: 1024 * 1024, // 1MB
  LARGE: 10 * 1024 * 1024 // 10MB
};

const PERFORMANCE_THRESHOLDS = {
  ENCRYPTION_MAX_TIME: 1000, // 1 second
  DECRYPTION_MAX_TIME: 1000 // 1 second
};

// Test environment variables
let testEnv: any;

describe('Encryption Tests', () => {
  beforeAll(async () => {
    // Requirement: Security Controls - Technical Specification/9.3 Security Protocols/9.3.5 Secure Development
    testEnv = await setupTestEnvironment({
      enableSecurityLogging: true,
      enablePerformanceMonitoring: true
    });
  });

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  test('testEncryptionDecryptionFlow', async () => {
    // Requirement: Data Encryption Standards - Technical Specification/9.2 Data Security/9.2.1 Encryption Standards
    const testData = 'sensitive-test-data-123';

    // Test encryption
    const encryptedResult = encryptData(testData);

    // Verify encryption result structure
    expect(encryptedResult).toHaveProperty('iv');
    expect(encryptedResult).toHaveProperty('encryptedData');
    expect(encryptedResult).toHaveProperty('authTag');

    // Verify IV length
    expect(Buffer.from(encryptedResult.iv, 'hex').length).toBe(CRYPTO_CONSTANTS.IV_LENGTH);

    // Verify auth tag length
    expect(Buffer.from(encryptedResult.authTag, 'hex').length).toBe(CRYPTO_CONSTANTS.AUTH_TAG_LENGTH);

    // Test decryption
    const decryptedData = decryptData(encryptedResult);

    // Verify decrypted data matches original
    expect(decryptedData).toBe(testData);
  });

  test('testEncryptionWithDifferentDataTypes', async () => {
    // Requirement: Data Classification Security - Technical Specification/9.2 Data Security/9.2.2 Data Classification
    
    // Test with credentials (critical data)
    const credentials = {
      username: 'test@example.com',
      password: 'SecureP@ssw0rd123',
      apiKey: 'sk_test_123456789'
    };
    const encryptedCredentials = encryptData(JSON.stringify(credentials));
    const decryptedCredentials = JSON.parse(decryptData(encryptedCredentials));
    expect(decryptedCredentials).toEqual(credentials);

    // Test with numeric data (sensitive data)
    const accountBalance = '12345.67';
    const encryptedBalance = encryptData(accountBalance);
    const decryptedBalance = decryptData(encryptedBalance);
    expect(decryptedBalance).toBe(accountBalance);

    // Test with JSON object (transaction data)
    const transaction = {
      id: 'tx_123',
      amount: 500.00,
      currency: 'USD',
      description: 'Test transaction'
    };
    const encryptedTransaction = encryptData(JSON.stringify(transaction));
    const decryptedTransaction = JSON.parse(decryptData(encryptedTransaction));
    expect(decryptedTransaction).toEqual(transaction);

    // Test with binary data (tokens)
    const binaryToken = crypto.randomBytes(32).toString('hex');
    const encryptedToken = encryptData(binaryToken);
    const decryptedToken = decryptData(encryptedToken);
    expect(decryptedToken).toBe(binaryToken);
  });

  test('testEncryptionPerformance', async () => {
    // Requirement: Security Controls - Technical Specification/9.3 Security Protocols/9.3.5 Secure Development
    
    // Generate test data
    const testData = crypto.randomBytes(TEST_DATA_SIZES.LARGE).toString('hex');

    // Test encryption performance
    const encryptStartTime = process.hrtime();
    const encryptedData = encryptData(testData);
    const encryptEndTime = process.hrtime(encryptStartTime);
    const encryptionTime = (encryptEndTime[0] * 1000) + (encryptEndTime[1] / 1000000);

    expect(encryptionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ENCRYPTION_MAX_TIME);

    // Test decryption performance
    const decryptStartTime = process.hrtime();
    const decryptedData = decryptData(encryptedData);
    const decryptEndTime = process.hrtime(decryptStartTime);
    const decryptionTime = (decryptEndTime[0] * 1000) + (decryptEndTime[1] / 1000000);

    expect(decryptionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DECRYPTION_MAX_TIME);
    expect(decryptedData).toBe(testData);
  });

  test('testEncryptionFailureCases', async () => {
    // Requirement: Data Encryption Standards - Technical Specification/9.2 Data Security/9.2.1 Encryption Standards
    
    // Test with invalid input data
    expect(() => encryptData('')).toThrow('Data is required for encryption');
    expect(() => encryptData(null as any)).toThrow('Data is required for encryption');
    expect(() => encryptData(undefined as any)).toThrow('Data is required for encryption');

    // Test with invalid encrypted data structure
    expect(() => decryptData({} as any)).toThrow('Invalid encrypted data structure');
    expect(() => decryptData({ iv: '', encryptedData: '', authTag: '' })).toThrow('Data decryption failed');

    // Test with corrupted IV
    const validEncryption = encryptData('test-data');
    const corruptedIV = {
      ...validEncryption,
      iv: 'invalid-iv'
    };
    expect(() => decryptData(corruptedIV)).toThrow('Data decryption failed');

    // Test with corrupted auth tag
    const corruptedAuthTag = {
      ...validEncryption,
      authTag: 'invalid-auth-tag'
    };
    expect(() => decryptData(corruptedAuthTag)).toThrow('Data decryption failed');

    // Test with corrupted encrypted data
    const corruptedData = {
      ...validEncryption,
      encryptedData: 'invalid-encrypted-data'
    };
    expect(() => decryptData(corruptedData)).toThrow('Data decryption failed');
  });
});