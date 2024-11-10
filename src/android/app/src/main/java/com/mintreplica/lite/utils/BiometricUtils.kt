/*
 * Human Tasks:
 * 1. Ensure biometric hardware capability is available on test devices
 * 2. Configure biometric prompt strings in strings.xml resource file
 * 3. Add required permissions in AndroidManifest.xml:
 *    - <uses-permission android:name="android.permission.USE_BIOMETRIC" />
 * 4. Verify master key alias in production keystore configuration
 */

// androidx.biometric:biometric:1.2.0-alpha05
// androidx.fragment:fragment:1.5.7
// androidx.security:security-crypto:1.1.0-alpha06

package com.mintreplica.lite.utils

import android.content.Context
import android.content.SharedPreferences
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.fragment.app.FragmentActivity
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.util.concurrent.Executor
import java.util.concurrent.Executors

/**
 * Utility object providing FIDO2-compliant biometric authentication functionality
 * with encrypted storage of preferences.
 * 
 * Addresses requirements:
 * - 9.1.1 Authentication Methods: Biometric Authentication
 * - 9.2.2 Data Security: Secure storage of preferences
 * - 9.3.1 API Security: Security controls
 */
object BiometricUtils {
    private const val ENCRYPTED_PREFS_FILE = "secure_biometric_prefs"
    private const val KEY_BIOMETRIC_ENABLED = "biometric_enabled"
    private const val MAX_FAILED_ATTEMPTS = 3
    private val executor: Executor = Executors.newSingleThreadExecutor()
    
    /**
     * Checks if the device supports and has configured biometric authentication
     * according to FIDO2 compliance requirements.
     */
    fun canAuthenticateWithBiometrics(context: Context): Boolean {
        val biometricManager = BiometricManager.from(context)
        
        return when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)) {
            BiometricManager.BIOMETRIC_SUCCESS -> true
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE,
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE,
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED,
            BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED,
            BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED,
            BiometricManager.BIOMETRIC_STATUS_UNKNOWN -> false
            else -> false
        }
    }

    /**
     * Displays the system biometric authentication prompt with security measures.
     */
    fun showBiometricPrompt(
        activity: FragmentActivity,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(activity.getString(R.string.biometric_prompt_title))
            .setSubtitle(activity.getString(R.string.biometric_prompt_subtitle))
            .setNegativeButtonText(activity.getString(R.string.biometric_prompt_negative))
            .setConfirmationRequired(true)
            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            .build()

        var failedAttempts = 0

        val biometricPrompt = BiometricPrompt(activity, executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    failedAttempts = 0
                    onSuccess()
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    onError(errString.toString())
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    failedAttempts++
                    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
                        onError(activity.getString(R.string.biometric_max_attempts_reached))
                    }
                }
            })

        biometricPrompt.authenticate(promptInfo)
    }

    /**
     * Checks if user has enabled biometric authentication for the app
     * using encrypted storage.
     */
    fun isBiometricEnabled(context: Context): Boolean {
        return try {
            getEncryptedPreferences(context)
                .getBoolean(KEY_BIOMETRIC_ENABLED, false)
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Sets whether biometric authentication is enabled for the app
     * with secure storage.
     */
    fun setBiometricEnabled(context: Context, enabled: Boolean) {
        try {
            getEncryptedPreferences(context)
                .edit()
                .putBoolean(KEY_BIOMETRIC_ENABLED, enabled)
                .apply()
        } catch (e: Exception) {
            // Log error but don't expose exception details
            e.printStackTrace()
        }
    }

    /**
     * Creates or retrieves encrypted SharedPreferences instance
     * using AES-256-GCM encryption.
     */
    private fun getEncryptedPreferences(context: Context): SharedPreferences {
        val masterKeyBuilder = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .setKeyGenParameterSpec(
                KeyGenParameterSpec.Builder(
                    MasterKey.DEFAULT_MASTER_KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
                )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
            )
        
        val masterKey = masterKeyBuilder.build()

        return EncryptedSharedPreferences.create(
            context,
            ENCRYPTED_PREFS_FILE,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }
}