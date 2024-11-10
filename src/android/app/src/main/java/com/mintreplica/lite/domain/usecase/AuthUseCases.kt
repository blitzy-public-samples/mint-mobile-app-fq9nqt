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

package com.mintreplica.lite.domain.usecase

import androidx.fragment.app.FragmentActivity
import com.mintreplica.lite.data.repository.AuthRepository
import com.mintreplica.lite.utils.BiometricUtils
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Use case class that encapsulates authentication-related business logic
 * providing clean domain layer abstraction for authentication operations.
 *
 * Requirements addressed:
 * - 9.1.1 Authentication Methods: Implements secure user authentication with email/password and biometric options
 * - 9.1.3 Session Management: Handles authentication session with secure token storage
 * - 9.2.2 Data Security: Ensures secure handling of authentication credentials
 */
@Singleton
@AndroidEntryPoint
class AuthUseCases @Inject constructor(
    private val authRepository: AuthRepository
) {
    companion object {
        private const val MIN_PASSWORD_LENGTH = 8
        private const val EMAIL_PATTERN = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$"
        private const val MIN_NAME_LENGTH = 2
    }

    /**
     * Authenticates user with email and password credentials.
     * Validates input format and security requirements before authentication.
     */
    suspend fun loginWithCredentials(
        email: String,
        password: String
    ): Flow<Result<AuthToken>> = flow {
        try {
            // Validate email format
            if (!email.matches(EMAIL_PATTERN.toRegex())) {
                emit(Result.failure(Exception("Invalid email format")))
                return@flow
            }

            // Validate password requirements
            if (password.length < MIN_PASSWORD_LENGTH) {
                emit(Result.failure(Exception("Password must be at least $MIN_PASSWORD_LENGTH characters")))
                return@flow
            }

            // Perform login through repository
            authRepository.login(email, password).collect { result ->
                emit(result)
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    /**
     * Registers a new user account with secure password handling.
     * Validates all input requirements before registration.
     */
    suspend fun registerUser(
        email: String,
        password: String,
        name: String
    ): Flow<Result<AuthToken>> = flow {
        try {
            // Validate email format
            if (!email.matches(EMAIL_PATTERN.toRegex())) {
                emit(Result.failure(Exception("Invalid email format")))
                return@flow
            }

            // Validate password strength
            if (password.length < MIN_PASSWORD_LENGTH ||
                !password.any { it.isDigit() } ||
                !password.any { it.isUpperCase() } ||
                !password.any { it.isLowerCase() }
            ) {
                emit(Result.failure(Exception(
                    "Password must be at least $MIN_PASSWORD_LENGTH characters " +
                    "and contain at least one digit, one uppercase and one lowercase letter"
                )))
                return@flow
            }

            // Validate name requirements
            if (name.length < MIN_NAME_LENGTH || !name.trim().contains(" ")) {
                emit(Result.failure(Exception(
                    "Please provide both first and last name with minimum $MIN_NAME_LENGTH characters each"
                )))
                return@flow
            }

            // Perform registration through repository
            authRepository.register(email, password, name).collect { result ->
                emit(result)
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    /**
     * Authenticates user using FIDO2-compliant device biometrics.
     * Verifies biometric availability and configuration before authentication.
     */
    suspend fun loginWithBiometrics(
        activity: FragmentActivity
    ): Flow<Result<AuthToken>> = flow {
        try {
            // Check if biometric authentication is available
            if (!BiometricUtils.canAuthenticateWithBiometrics(activity)) {
                emit(Result.failure(Exception("Biometric authentication not available on this device")))
                return@flow
            }

            // Verify biometric is enabled for app
            if (!BiometricUtils.isBiometricEnabled(activity)) {
                emit(Result.failure(Exception("Biometric authentication not enabled for this app")))
                return@flow
            }

            // Perform biometric authentication through repository
            authRepository.authenticateWithBiometrics(activity).collect { result ->
                emit(result)
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    /**
     * Logs out the current user and cleans up session.
     * Ensures proper cleanup of authentication state and secure storage.
     */
    suspend fun logoutUser(): Flow<Result<Unit>> = flow {
        try {
            authRepository.logout()
            emit(Result.success(Unit))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    /**
     * Refreshes the authentication token before expiration.
     * Implements automatic token refresh to maintain session.
     */
    suspend fun refreshAuthToken(): Flow<Result<AuthToken>> = flow {
        try {
            // Check if user is authenticated
            if (!authRepository.isAuthenticated.value) {
                emit(Result.failure(Exception("User not authenticated")))
                return@flow
            }

            // Perform token refresh through repository
            authRepository.refreshToken().collect { result ->
                emit(result)
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
}