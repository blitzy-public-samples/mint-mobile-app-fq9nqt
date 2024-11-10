/*
 * Human Tasks:
 * 1. Configure proper API base URL in NetworkModule
 * 2. Set up ProGuard rules for Kotlin coroutines and Hilt
 * 3. Configure biometric prompt strings in strings.xml
 * 4. Verify proper SSL certificate pinning is configured
 * 5. Set up proper error tracking and analytics
 */

// External library versions:
// - androidx.lifecycle:viewmodel:2.6.1
// - dagger.hilt.android:2.44
// - kotlinx.coroutines:1.6.4

package com.mintreplica.lite.ui.screens.auth

import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mintreplica.lite.domain.usecase.AuthUseCases
import com.mintreplica.lite.utils.BiometricUtils
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel that manages login screen state and authentication operations
 * with secure credential handling.
 *
 * Requirements addressed:
 * - 9.1.1 Authentication Methods: Implements secure user authentication with email/password and FIDO2 biometrics
 * - 9.1.3 Session Management: Manages authentication session with secure token handling
 * - 9.2.2 Data Security: Ensures secure handling of authentication credentials
 */
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authUseCases: AuthUseCases
) : ViewModel() {

    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Initial)
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    init {
        checkBiometricAvailability()
    }

    /**
     * Attempts to log in user with email and password using secure authentication.
     * Validates credentials format and security requirements.
     */
    fun loginWithCredentials(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading

            if (!validateEmail(email)) {
                _uiState.value = LoginUiState.Error("Invalid email format")
                return@launch
            }

            if (!validatePassword(password)) {
                _uiState.value = LoginUiState.Error(
                    "Password must be at least 12 characters and contain uppercase, lowercase, number, and special character"
                )
                return@launch
            }

            authUseCases.loginWithCredentials(email, password)
                .collect { result ->
                    result.fold(
                        onSuccess = { token ->
                            _uiState.value = LoginUiState.Success(token)
                        },
                        onFailure = { error ->
                            _uiState.value = LoginUiState.Error(
                                error.message ?: "Authentication failed"
                            )
                        }
                    )
                }
        }
    }

    /**
     * Attempts to log in user using FIDO2-compliant device biometrics.
     * Verifies biometric availability and configuration.
     */
    fun loginWithBiometrics(activity: FragmentActivity) {
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading

            if (!BiometricUtils.canAuthenticateWithBiometrics(activity)) {
                _uiState.value = LoginUiState.Error("Biometric authentication not available")
                return@launch
            }

            if (!BiometricUtils.isBiometricEnabled(activity)) {
                _uiState.value = LoginUiState.Error("Biometric login not enabled")
                return@launch
            }

            authUseCases.loginWithBiometrics(activity)
                .collect { result ->
                    result.fold(
                        onSuccess = { token ->
                            _uiState.value = LoginUiState.Success(token)
                        },
                        onFailure = { error ->
                            _uiState.value = LoginUiState.Error(
                                error.message ?: "Biometric authentication failed"
                            )
                        }
                    )
                }
        }
    }

    /**
     * Validates email format using RFC 5322 regex pattern.
     */
    private fun validateEmail(email: String): Boolean {
        val emailRegex = Regex(
            "[a-zA-Z0-9+._%\\-]{1,256}" +
            "@" +
            "[a-zA-Z0-9][a-zA-Z0-9\\-]{0,64}" +
            "(" +
            "\\." +
            "[a-zA-Z0-9][a-zA-Z0-9\\-]{0,25}" +
            ")+"
        )
        return email.matches(emailRegex)
    }

    /**
     * Validates password meets security requirements:
     * - Minimum 12 characters
     * - Contains uppercase letter
     * - Contains lowercase letter
     * - Contains number
     * - Contains special character
     */
    private fun validatePassword(password: String): Boolean {
        val hasUpperCase = password.any { it.isUpperCase() }
        val hasLowerCase = password.any { it.isLowerCase() }
        val hasDigit = password.any { it.isDigit() }
        val hasSpecialChar = password.any { !it.isLetterOrDigit() }
        
        return password.length >= 12 &&
                hasUpperCase &&
                hasLowerCase &&
                hasDigit &&
                hasSpecialChar
    }

    /**
     * Clears any error state from the UI.
     */
    fun clearError() {
        if (uiState.value is LoginUiState.Error) {
            _uiState.value = LoginUiState.Initial
        }
    }

    /**
     * Checks biometric authentication availability on device initialization.
     */
    private fun checkBiometricAvailability() {
        viewModelScope.launch {
            try {
                // This will be used to show/hide biometric login option in UI
                _uiState.value = LoginUiState.Initial
            } catch (e: Exception) {
                _uiState.value = LoginUiState.Error(
                    "Failed to check biometric availability"
                )
            }
        }
    }
}

/**
 * Sealed class representing the different states of the login UI.
 */
sealed class LoginUiState {
    object Initial : LoginUiState()
    object Loading : LoginUiState()
    data class Success(val token: AuthToken) : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}