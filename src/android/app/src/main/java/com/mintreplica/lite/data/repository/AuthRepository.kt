/*
 * Human Tasks:
 * 1. Configure proper API base URL in NetworkModule
 * 2. Set up ProGuard rules for Kotlin coroutines and Hilt
 * 3. Configure proper timeout and retry policies for API calls
 * 4. Set up proper SSL certificate pinning
 * 5. Configure biometric prompt strings in strings.xml
 */

// External library versions:
// - dagger.hilt.android: 2.44
// - kotlinx.coroutines: 1.6.4
// - androidx.security:security-crypto: 1.1.0-alpha06

package com.mintreplica.lite.data.repository

import android.content.Context
import androidx.fragment.app.FragmentActivity
import com.mintreplica.lite.data.api.ApiService
import com.mintreplica.lite.data.api.AuthToken
import com.mintreplica.lite.data.api.LoginRequest
import com.mintreplica.lite.data.api.RegisterRequest
import com.mintreplica.lite.utils.BiometricUtils
import com.mintreplica.lite.utils.SecurityUtils
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository implementation for handling authentication operations including
 * user login, registration, token management, and biometric authentication.
 *
 * Requirements addressed:
 * - 9.1.1 Authentication Methods: Implements secure user authentication
 * - 9.1.3 Session Management: Handles JWT token management
 * - 9.1.1 Biometric Integration: Integrates biometric authentication
 */
@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    @ApplicationContext private val context: Context
) {
    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated

    companion object {
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_STORED_EMAIL = "stored_email"
        private const val KEY_STORED_PASSWORD = "stored_password"
        private const val TOKEN_EXPIRY_BUFFER = 60_000L // 1 minute buffer
    }

    init {
        // Check for existing valid token on initialization
        SecurityUtils.securelyRetrieveData(context, KEY_AUTH_TOKEN)?.let {
            _isAuthenticated.value = true
        }
    }

    /**
     * Authenticates user with email and password credentials.
     * Stores authentication token securely on success.
     */
    suspend fun login(email: String, password: String): Flow<Result<AuthToken>> = flow {
        try {
            val hashedPassword = SecurityUtils.hashPassword(password)
            val response = apiService.loginUser(LoginRequest(email, hashedPassword))

            if (response.isSuccessful) {
                response.body()?.let { token ->
                    // Store authentication data securely
                    SecurityUtils.securelyStoreData(context, KEY_AUTH_TOKEN, token.token)
                    SecurityUtils.securelyStoreData(context, KEY_REFRESH_TOKEN, token.refreshToken)

                    // If biometric is enabled, store credentials securely
                    if (BiometricUtils.isBiometricEnabled(context)) {
                        SecurityUtils.securelyStoreData(context, KEY_STORED_EMAIL, email)
                        SecurityUtils.securelyStoreData(context, KEY_STORED_PASSWORD, hashedPassword)
                    }

                    _isAuthenticated.value = true
                    emit(Result.success(token))
                } ?: emit(Result.failure(Exception("Empty response body")))
            } else {
                emit(Result.failure(Exception("Login failed: ${response.code()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    /**
     * Registers a new user account with provided details.
     * Automatically logs in user on successful registration.
     */
    suspend fun register(
        email: String,
        password: String,
        name: String
    ): Flow<Result<AuthToken>> = flow {
        try {
            val hashedPassword = SecurityUtils.hashPassword(password)
            val response = apiService.registerUser(
                RegisterRequest(
                    email = email,
                    password = hashedPassword,
                    firstName = name.split(" ").first(),
                    lastName = name.split(" ").getOrNull(1) ?: ""
                )
            )

            if (response.isSuccessful) {
                response.body()?.let { token ->
                    SecurityUtils.securelyStoreData(context, KEY_AUTH_TOKEN, token.token)
                    SecurityUtils.securelyStoreData(context, KEY_REFRESH_TOKEN, token.refreshToken)
                    _isAuthenticated.value = true
                    emit(Result.success(token))
                } ?: emit(Result.failure(Exception("Empty response body")))
            } else {
                emit(Result.failure(Exception("Registration failed: ${response.code()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    /**
     * Performs biometric authentication and automatically logs in
     * using stored credentials if successful.
     */
    suspend fun authenticateWithBiometrics(
        activity: FragmentActivity
    ): Flow<Result<AuthToken>> = flow {
        try {
            if (!BiometricUtils.isBiometricEnabled(context)) {
                emit(Result.failure(Exception("Biometric authentication not enabled")))
                return@flow
            }

            if (!BiometricUtils.canAuthenticateWithBiometrics(context)) {
                emit(Result.failure(Exception("Biometric authentication not available")))
                return@flow
            }

            var authenticationComplete = false
            var authenticationError: String? = null

            BiometricUtils.showBiometricPrompt(
                activity = activity,
                onSuccess = {
                    authenticationComplete = true
                },
                onError = { error ->
                    authenticationError = error
                    authenticationComplete = true
                }
            )

            // Wait for biometric authentication to complete
            while (!authenticationComplete) {
                kotlinx.coroutines.delay(100)
            }

            authenticationError?.let {
                emit(Result.failure(Exception(it)))
                return@flow
            }

            // Retrieve stored credentials and perform login
            val storedEmail = SecurityUtils.securelyRetrieveData(context, KEY_STORED_EMAIL)
            val storedPassword = SecurityUtils.securelyRetrieveData(context, KEY_STORED_PASSWORD)

            if (storedEmail != null && storedPassword != null) {
                val response = apiService.loginUser(LoginRequest(storedEmail, storedPassword))
                if (response.isSuccessful) {
                    response.body()?.let { token ->
                        SecurityUtils.securelyStoreData(context, KEY_AUTH_TOKEN, token.token)
                        SecurityUtils.securelyStoreData(context, KEY_REFRESH_TOKEN, token.refreshToken)
                        _isAuthenticated.value = true
                        emit(Result.success(token))
                    } ?: emit(Result.failure(Exception("Empty response body")))
                } else {
                    emit(Result.failure(Exception("Login failed: ${response.code()}")))
                }
            } else {
                emit(Result.failure(Exception("No stored credentials found")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    /**
     * Logs out the current user by clearing stored tokens and credentials.
     */
    suspend fun logout() {
        SecurityUtils.securelyStoreData(context, KEY_AUTH_TOKEN, "")
        SecurityUtils.securelyStoreData(context, KEY_REFRESH_TOKEN, "")
        
        // Only clear stored credentials if biometric is disabled
        if (!BiometricUtils.isBiometricEnabled(context)) {
            SecurityUtils.securelyStoreData(context, KEY_STORED_EMAIL, "")
            SecurityUtils.securelyStoreData(context, KEY_STORED_PASSWORD, "")
        }
        
        _isAuthenticated.value = false
    }

    /**
     * Refreshes the authentication token before expiration.
     * Implements token refresh logic with proper error handling.
     */
    suspend fun refreshToken(): Flow<Result<AuthToken>> = flow {
        try {
            val currentToken = SecurityUtils.securelyRetrieveData(context, KEY_AUTH_TOKEN)
            val refreshToken = SecurityUtils.securelyRetrieveData(context, KEY_REFRESH_TOKEN)

            if (currentToken == null || refreshToken == null) {
                emit(Result.failure(Exception("No token available for refresh")))
                return@flow
            }

            // TODO: Implement token refresh API call when endpoint is available
            // val response = apiService.refreshToken(RefreshTokenRequest(refreshToken))
            
            // Placeholder for token refresh logic
            emit(Result.failure(Exception("Token refresh not implemented")))
        } catch (e: Exception) {
            _isAuthenticated.value = false
            emit(Result.failure(e))
        }
    }
}