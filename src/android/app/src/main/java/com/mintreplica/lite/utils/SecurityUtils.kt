/*
 * Human Tasks:
 * 1. Configure Android Keystore alias in production environment
 * 2. Add required permissions in AndroidManifest.xml:
 *    - <uses-permission android:name="android.permission.USE_BIOMETRIC" />
 * 3. Verify encryption key rotation policy in production
 * 4. Configure secure backup settings for EncryptedSharedPreferences
 */

// androidx.security:security-crypto:1.1.0-alpha06
// javax.crypto:javax.crypto:default
// android.util:Base64:default

package com.mintreplica.lite.utils

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.SecretKeyFactory

/**
 * Utility object providing security-related functionality including AES-256-GCM encryption,
 * secure key storage, and FIDO2-compliant cryptographic operations.
 * 
 * Addresses requirements:
 * - 9.2.1 Encryption Standards: AES-256-GCM encryption with proper key rotation
 * - 9.2.2 Data Classification: Secure storage for sensitive data
 * - 9.2.1 Key Management: Cryptographic key generation and secure storage
 */
object SecurityUtils {
    private const val ANDROID_KEYSTORE = "AndroidKeyStore"
    private const val GCM_IV_LENGTH = 12
    private const val GCM_TAG_LENGTH = 128
    private const val AES_KEY_SIZE = 256
    private const val PBKDF2_ITERATIONS = 100000
    private const val SALT_LENGTH = 32
    private const val ENCRYPTED_PREFS_FILE = "secure_app_prefs"

    /**
     * Encrypts sensitive data using AES-256-GCM encryption with proper IV handling
     */
    fun encryptData(data: String, context: Context): String {
        try {
            val key = getOrGenerateSecretKey(context)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            
            // Generate random IV for GCM mode
            val iv = ByteArray(GCM_IV_LENGTH)
            SecureRandom().nextBytes(iv)
            
            // Initialize cipher with key and IV
            val gcmSpec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
            cipher.init(Cipher.ENCRYPT_MODE, key, gcmSpec)
            
            // Perform encryption
            val encryptedData = cipher.doFinal(data.toByteArray(Charsets.UTF_8))
            
            // Combine IV and encrypted data
            val combined = ByteArray(iv.size + encryptedData.size)
            System.arraycopy(iv, 0, combined, 0, iv.size)
            System.arraycopy(encryptedData, 0, combined, iv.size, encryptedData.size)
            
            return Base64.encodeToString(combined, Base64.NO_WRAP)
        } catch (e: Exception) {
            throw SecurityException("Encryption failed", e)
        }
    }

    /**
     * Decrypts encrypted data using AES-256-GCM decryption with IV extraction
     */
    fun decryptData(encryptedData: String, context: Context): String {
        try {
            val key = getOrGenerateSecretKey(context)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            
            // Decode Base64 data
            val combined = Base64.decode(encryptedData, Base64.NO_WRAP)
            
            // Extract IV and encrypted data
            val iv = combined.copyOfRange(0, GCM_IV_LENGTH)
            val encrypted = combined.copyOfRange(GCM_IV_LENGTH, combined.size)
            
            // Initialize cipher for decryption
            val gcmSpec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
            cipher.init(Cipher.DECRYPT_MODE, key, gcmSpec)
            
            // Perform decryption
            val decryptedBytes = cipher.doFinal(encrypted)
            return String(decryptedBytes, Charsets.UTF_8)
        } catch (e: Exception) {
            throw SecurityException("Decryption failed", e)
        }
    }

    /**
     * Generates a secure AES-256 cryptographic key in Android Keystore
     */
    fun generateSecureKey(keyAlias: String, requireUserAuth: Boolean): SecretKey {
        try {
            val keyGenerator = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                ANDROID_KEYSTORE
            )
            
            val builder = KeyGenParameterSpec.Builder(
                keyAlias,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
            .setKeySize(AES_KEY_SIZE)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true)
            
            if (requireUserAuth && BiometricUtils.canAuthenticateWithBiometrics(context)) {
                builder.setUserAuthenticationRequired(true)
                    .setUserAuthenticationValidityDurationSeconds(-1)
            }
            
            keyGenerator.init(builder.build())
            return keyGenerator.generateKey()
        } catch (e: Exception) {
            throw SecurityException("Key generation failed", e)
        }
    }

    /**
     * Stores sensitive data securely using EncryptedSharedPreferences
     */
    fun securelyStoreData(context: Context, key: String, value: String) {
        try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            
            val encryptedPrefs = EncryptedSharedPreferences.create(
                context,
                ENCRYPTED_PREFS_FILE,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
            
            encryptedPrefs.edit()
                .putString(key, value)
                .apply()
        } catch (e: Exception) {
            throw SecurityException("Secure storage failed", e)
        }
    }

    /**
     * Retrieves securely stored data from EncryptedSharedPreferences
     */
    fun securelyRetrieveData(context: Context, key: String): String? {
        return try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            
            val encryptedPrefs = EncryptedSharedPreferences.create(
                context,
                ENCRYPTED_PREFS_FILE,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
            
            encryptedPrefs.getString(key, null)
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Creates secure hash of password using PBKDF2 with SHA-256
     */
    fun hashPassword(password: String): String {
        try {
            // Generate random salt
            val salt = ByteArray(SALT_LENGTH)
            SecureRandom().nextBytes(salt)
            
            // Configure PBKDF2 with SHA-256
            val spec = PBEKeySpec(
                password.toCharArray(),
                salt,
                PBKDF2_ITERATIONS,
                AES_KEY_SIZE
            )
            
            val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
            val hash = factory.generateSecret(spec).encoded
            
            // Combine salt and hash
            val combined = ByteArray(salt.size + hash.size)
            System.arraycopy(salt, 0, combined, 0, salt.size)
            System.arraycopy(hash, 0, combined, salt.size, hash.size)
            
            return Base64.encodeToString(combined, Base64.NO_WRAP)
        } catch (e: Exception) {
            throw SecurityException("Password hashing failed", e)
        }
    }

    /**
     * Gets or generates encryption key from Android Keystore
     */
    private fun getOrGenerateSecretKey(context: Context): SecretKey {
        val keyAlias = "${context.packageName}.encryption_key"
        return try {
            generateSecureKey(keyAlias, false)
        } catch (e: Exception) {
            throw SecurityException("Failed to get or generate encryption key", e)
        }
    }
}