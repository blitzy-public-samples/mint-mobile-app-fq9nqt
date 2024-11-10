// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'; // ^29.0.0
import request from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../utils/test-helpers';
import { TestApiClient } from '../utils/api-client';

/**
 * Human Tasks Required:
 * 1. Configure iOS Keychain access in test environment
 * 2. Set up Android EncryptedSharedPreferences test configuration
 * 3. Configure biometric authentication test environment
 * 4. Set up StrongBox keystore test parameters
 * 5. Configure secure enclave access for testing
 */

let testEnv: {
    api: TestApiClient;
};

// Test data
const sensitiveData = {
    creditCard: {
        number: '4111111111111111',
        cvv: '123',
        expiry: '12/25'
    },
    bankAccount: {
        accountNumber: '1234567890',
        routingNumber: '021000021'
    },
    personalInfo: {
        ssn: '123-45-6789',
        dob: '1990-01-01'
    }
};

const encryptionConfig = {
    algorithm: 'AES-256-GCM',
    keySize: 256,
    ivLength: 12,
    tagLength: 16
};

beforeAll(async () => {
    // Requirement: Data Security - Setup secure test environment
    testEnv = await setupTestEnvironment({
        securityControls: {
            encryption: encryptionConfig,
            keyStorage: {
                ios: 'keychain',
                android: 'strongbox'
            },
            biometrics: true
        }
    });
});

afterAll(async () => {
    // Requirement: Data Security - Clean up sensitive test data
    await cleanupTestEnvironment(testEnv);
});

describe('iOS Keychain Storage', () => {
    // Requirement: Data Security/9.2.1 Encryption Standards
    test('Should securely store sensitive data with AES-256-GCM', async () => {
        const testData = sensitiveData.creditCard;
        const keychain = await testEnv.api.post('/security/ios/keychain/store', {
            data: testData,
            encryption: encryptionConfig
        });

        expect(keychain.status).toBe('success');
        expect(keychain.encrypted).toBeTruthy();
        expect(keychain.algorithm).toBe('AES-256-GCM');
    });

    // Requirement: Secure Storage/9.2.2 Data Classification
    test('Should retrieve stored data with proper authentication', async () => {
        const storedData = await testEnv.api.get('/security/ios/keychain/retrieve', {
            headers: { 'x-biometric-auth': 'valid' }
        });

        expect(storedData).toBeDefined();
        expect(storedData.decrypted).toEqual(sensitiveData.creditCard);
    });

    // Requirement: Key Management/9.2.1 Encryption Standards
    test('Should handle data updates with key versioning', async () => {
        const updatedData = { ...sensitiveData.creditCard, cvv: '456' };
        const keychain = await testEnv.api.put('/security/ios/keychain/update', {
            data: updatedData,
            rotateKey: true
        });

        expect(keychain.keyVersion).toBeGreaterThan(1);
        expect(keychain.previousKeyArchived).toBeTruthy();
    });

    test('Should properly delete stored data with verification', async () => {
        const deletion = await testEnv.api.delete('/security/ios/keychain/delete');
        const verifyDeletion = await testEnv.api.get('/security/ios/keychain/verify');

        expect(deletion.status).toBe('success');
        expect(verifyDeletion.dataExists).toBeFalsy();
    });

    test('Should enforce biometric access control', async () => {
        await expect(testEnv.api.get('/security/ios/keychain/retrieve', {
            headers: { 'x-biometric-auth': 'invalid' }
        })).rejects.toThrow('Biometric authentication required');
    });

    test('Should maintain data integrity with checksums', async () => {
        const stored = await testEnv.api.post('/security/ios/keychain/store', {
            data: sensitiveData.bankAccount,
            withChecksum: true
        });

        const retrieved = await testEnv.api.get('/security/ios/keychain/retrieve');
        expect(retrieved.checksum).toBe(stored.checksum);
    });

    test('Should handle secure enclave key storage', async () => {
        const keyOperation = await testEnv.api.post('/security/ios/keychain/generate-key', {
            useSecureEnclave: true
        });

        expect(keyOperation.keyInSecureEnclave).toBeTruthy();
        expect(keyOperation.keyType).toBe('privateKey');
    });

    test('Should implement proper key rotation', async () => {
        const rotation = await testEnv.api.post('/security/ios/keychain/rotate-keys');
        
        expect(rotation.status).toBe('success');
        expect(rotation.newKeyGenerated).toBeTruthy();
        expect(rotation.oldKeyArchived).toBeTruthy();
    });
});

describe('Android Secure Storage', () => {
    // Requirement: Data Security/9.2.1 Encryption Standards
    test('Should encrypt data using AES-256-GCM properly', async () => {
        const encryptedData = await testEnv.api.post('/security/android/encrypted-prefs/store', {
            data: sensitiveData.personalInfo,
            encryption: encryptionConfig
        });

        expect(encryptedData.iv).toBeDefined();
        expect(encryptedData.tag).toBeDefined();
        expect(encryptedData.algorithm).toBe('AES-256-GCM');
    });

    test('Should securely store master keys in StrongBox', async () => {
        const keyStorage = await testEnv.api.get('/security/android/strongbox/verify');
        
        expect(keyStorage.isStrongBoxBacked).toBeTruthy();
        expect(keyStorage.keyProtectionLevel).toBe('hardware');
    });

    test('Should handle encryption/decryption with IV', async () => {
        const stored = await testEnv.api.post('/security/android/encrypted-prefs/store', {
            data: sensitiveData.bankAccount
        });

        const retrieved = await testEnv.api.get('/security/android/encrypted-prefs/retrieve', {
            headers: { 'x-encryption-iv': stored.iv }
        });

        expect(retrieved.decrypted).toEqual(sensitiveData.bankAccount);
    });

    test('Should manage encrypted shared preferences', async () => {
        const prefs = await testEnv.api.post('/security/android/encrypted-prefs/batch', {
            operations: [
                { key: 'sensitive_1', value: 'test1' },
                { key: 'sensitive_2', value: 'test2' }
            ]
        });

        expect(prefs.encryptedCount).toBe(2);
        expect(prefs.status).toBe('success');
    });

    test('Should protect against unauthorized access', async () => {
        await expect(testEnv.api.get('/security/android/encrypted-prefs/retrieve', {
            headers: { 'x-auth-level': 'unauthorized' }
        })).rejects.toThrow('Unauthorized access');
    });

    test('Should handle key rotation securely', async () => {
        const rotation = await testEnv.api.post('/security/android/encrypted-prefs/rotate');
        
        expect(rotation.masterKeyRotated).toBeTruthy();
        expect(rotation.dataReEncrypted).toBeTruthy();
    });

    test('Should validate encryption integrity', async () => {
        const tamperedData = await testEnv.api.post('/security/android/encrypted-prefs/verify', {
            tamperTest: true
        });

        expect(tamperedData.integrityValid).toBeFalsy();
        expect(tamperedData.error).toBe('Data tampering detected');
    });

    test('Should implement secure key generation', async () => {
        const keyGen = await testEnv.api.post('/security/android/strongbox/generate-key');
        
        expect(keyGen.keyStrength).toBe(256);
        expect(keyGen.secureHardwareUsed).toBeTruthy();
    });
});

describe('Cross-Platform Security', () => {
    test('Should isolate data between devices cryptographically', async () => {
        const device1Data = await testEnv.api.post('/security/cross-platform/store', {
            deviceId: 'device_1',
            data: sensitiveData.creditCard
        });

        const device2Data = await testEnv.api.post('/security/cross-platform/store', {
            deviceId: 'device_2',
            data: sensitiveData.creditCard
        });

        expect(device1Data.encryptionKey).not.toBe(device2Data.encryptionKey);
    });

    test('Should enforce platform security standards', async () => {
        const securityCheck = await testEnv.api.get('/security/cross-platform/verify');
        
        expect(securityCheck.ios.keychainProtection).toBe('complete');
        expect(securityCheck.android.strongBoxEnabled).toBeTruthy();
    });

    test('Should prevent unauthorized cross-device access', async () => {
        await expect(testEnv.api.get('/security/cross-platform/retrieve', {
            headers: { 'x-device-id': 'unauthorized_device' }
        })).rejects.toThrow('Device not authorized');
    });

    test('Should maintain consistent encryption strength', async () => {
        const iosEncryption = await testEnv.api.get('/security/ios/keychain/encryption-info');
        const androidEncryption = await testEnv.api.get('/security/android/encrypted-prefs/encryption-info');
        
        expect(iosEncryption.keySize).toBe(256);
        expect(androidEncryption.keySize).toBe(256);
        expect(iosEncryption.algorithm).toBe(androidEncryption.algorithm);
    });

    test('Should handle secure data migration', async () => {
        const migration = await testEnv.api.post('/security/cross-platform/migrate', {
            sourceDevice: 'device_1',
            targetDevice: 'device_2',
            data: sensitiveData
        });

        expect(migration.status).toBe('success');
        expect(migration.secureTransfer).toBeTruthy();
    });

    test('Should validate encryption mechanisms', async () => {
        const validation = await testEnv.api.post('/security/cross-platform/validate', {
            testVector: sensitiveData.personalInfo
        });

        expect(validation.iosEncryption).toBe('valid');
        expect(validation.androidEncryption).toBe('valid');
        expect(validation.crossPlatformCompatible).toBeTruthy();
    });
});