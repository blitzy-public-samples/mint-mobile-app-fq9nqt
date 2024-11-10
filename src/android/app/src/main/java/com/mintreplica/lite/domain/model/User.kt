/*
 * Human Tasks:
 * 1. Ensure proper Parcelable configuration in proguard-rules.pro:
 *    -keepclassmembers class * implements android.os.Parcelable {
 *        static ** CREATOR;
 *    }
 * 2. Configure kotlinx.serialization plugin in app/build.gradle:
 *    plugins {
 *        id 'org.jetbrains.kotlin.plugin.serialization' version '1.5.0'
 *    }
 */

package com.mintreplica.lite.domain.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import android.content.Context
import com.mintreplica.lite.utils.SecurityUtils
import java.util.concurrent.ConcurrentHashMap

/**
 * Domain model representing a user in the Mint Replica Lite application.
 * Implements secure data handling with AES-256-GCM encryption for sensitive data.
 *
 * Addresses requirements:
 * - 9.1.1 Authentication Methods: Core user data structure supporting email/password and biometric authentication
 * - 9.2.2 Data Classification: Handles critical user data with appropriate security classifications
 */
@Parcelize
@Serializable
data class User(
    @SerialName("id")
    val id: String,
    
    @SerialName("email")
    val email: String,
    
    @SerialName("first_name")
    val firstName: String,
    
    @SerialName("last_name")
    val lastName: String,
    
    @SerialName("phone_number")
    val phoneNumber: String? = null,
    
    @Transient
    var isEmailVerified: Boolean = false,
    
    @Transient
    var isBiometricEnabled: Boolean = false,
    
    @SerialName("created_at")
    val createdAt: Long = System.currentTimeMillis(),
    
    @Transient
    var lastLoginAt: Long = System.currentTimeMillis(),
    
    @Transient
    private val preferences: ConcurrentHashMap<String, String> = ConcurrentHashMap()
) : Parcelable {

    /**
     * Returns the user's full name by combining first and last name
     */
    fun getFullName(): String = "$firstName $lastName"

    /**
     * Updates a user preference with encryption using AES-256-GCM
     * Ensures secure storage of sensitive preference data
     *
     * @param key Preference key
     * @param value Preference value to be encrypted
     * @param context Android context required for encryption
     */
    fun updatePreference(key: String, value: String, context: Context) {
        try {
            val encryptedValue = SecurityUtils.encryptData(value, context)
            preferences[key] = encryptedValue
        } catch (e: SecurityException) {
            throw IllegalStateException("Failed to update preference: ${e.message}", e)
        }
    }

    /**
     * Retrieves and decrypts a user preference
     *
     * @param key Preference key
     * @param context Android context required for decryption
     * @return Decrypted preference value or null if not found
     */
    fun getPreference(key: String, context: Context): String? {
        return try {
            preferences[key]?.let { encryptedValue ->
                SecurityUtils.decryptData(encryptedValue, context)
            }
        } catch (e: SecurityException) {
            null
        }
    }

    /**
     * Serializes user data to JSON, excluding sensitive fields marked with @Transient
     * Returns a JSON representation suitable for API communication
     */
    @kotlinx.serialization.Transient
    fun toJson(): String {
        return kotlinx.serialization.json.Json.encodeToString(
            serializer(),
            this
        )
    }

    companion object {
        // Preference keys
        const val PREF_THEME = "theme"
        const val PREF_NOTIFICATION = "notifications"
        const val PREF_CURRENCY = "currency"
        const val PREF_LANGUAGE = "language"
        
        // Security-related constants
        private const val MIN_PASSWORD_LENGTH = 12
        private const val MAX_LOGIN_ATTEMPTS = 5
        
        /**
         * Validates user credentials with security best practices
         *
         * @param email Email to validate
         * @param password Password to validate
         * @return Boolean indicating if credentials are valid
         */
        fun validateCredentials(email: String, password: String): Boolean {
            val emailPattern = "[a-zA-Z0-9._-]+@[a-z]+\\.+[a-z]+"
            return email.matches(emailPattern.toRegex()) &&
                   password.length >= MIN_PASSWORD_LENGTH &&
                   password.contains(Regex("[A-Z]")) &&
                   password.contains(Regex("[a-z]")) &&
                   password.contains(Regex("[0-9]")) &&
                   password.contains(Regex("[^A-Za-z0-9]"))
        }
    }
}