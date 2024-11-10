/*
 * Human Tasks:
 * 1. Configure proper API base URL in NetworkModule
 * 2. Set up ProGuard rules for Compose and Hilt
 * 3. Configure biometric prompt strings in strings.xml
 * 4. Verify proper SSL certificate pinning is configured
 * 5. Set up proper error tracking and analytics
 */

// External library versions:
// - androidx.compose.material:1.5.0
// - androidx.compose.runtime:1.5.0
// - androidx.compose.foundation:1.5.0
// - androidx.hilt.navigation.compose:1.0.0

package com.mintreplica.lite.ui.screens.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.fragment.app.FragmentActivity
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.mintreplica.lite.ui.theme.MintReplicaLiteTheme

/**
 * Main login screen composable that implements secure authentication interface
 * with accessibility support.
 *
 * Requirements addressed:
 * - 8.1.2 Main Dashboard/Login Screen: User-friendly login interface
 * - 8.1.8 Accessibility Features: Screen reader compatibility and focus management
 * - 9.1.1 Authentication Methods: Secure email/password and biometric login
 *
 * @param navController Navigation controller for screen transitions
 */
@Composable
fun LoginScreen(
    navController: NavController,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    // Handle successful login
    LaunchedEffect(uiState) {
        if (uiState is LoginUiState.Success) {
            navController.navigate("dashboard") {
                popUpTo("login") { inclusive = true }
            }
        }
    }

    MintReplicaLiteTheme {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colors.background
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                LoginForm(
                    uiState = uiState,
                    onLoginClick = { email, password ->
                        viewModel.loginWithCredentials(email, password)
                    },
                    onBiometricClick = {
                        viewModel.loginWithBiometrics(context as FragmentActivity)
                    }
                )

                // Show loading indicator
                if (uiState is LoginUiState.Loading) {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }

                // Show error message
                if (uiState is LoginUiState.Error) {
                    val errorMessage = (uiState as LoginUiState.Error).message
                    Snackbar(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(16.dp),
                        action = {
                            TextButton(onClick = { viewModel.clearError() }) {
                                Text("Dismiss")
                            }
                        }
                    ) {
                        Text(errorMessage)
                    }
                }
            }
        }
    }
}

/**
 * Login form composable with accessibility support and secure input handling.
 *
 * Requirements addressed:
 * - 8.1.8 Accessibility Features: Minimum touch target size and focus management
 * - 9.1.1 Authentication Methods: Secure credential input
 */
@OptIn(ExperimentalComposeUiApi::class)
@Composable
private fun LoginForm(
    uiState: LoginUiState,
    onLoginClick: (String, String) -> Unit,
    onBiometricClick: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val emailFocusRequester = remember { FocusRequester() }
    val passwordFocusRequester = remember { FocusRequester() }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Email field
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            modifier = Modifier
                .fillMaxWidth()
                .focusRequester(emailFocusRequester)
                .semantics { 
                    contentDescription = "Email input field"
                },
            leadingIcon = {
                Icon(Icons.Default.Email, "Email icon")
            },
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Next
            ),
            keyboardActions = KeyboardActions(
                onNext = { passwordFocusRequester.requestFocus() }
            ),
            singleLine = true,
            enabled = uiState !is LoginUiState.Loading
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Password field
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            modifier = Modifier
                .fillMaxWidth()
                .focusRequester(passwordFocusRequester)
                .semantics { 
                    contentDescription = "Password input field"
                },
            leadingIcon = {
                Icon(Icons.Default.Lock, "Password icon")
            },
            trailingIcon = {
                IconButton(
                    onClick = { passwordVisible = !passwordVisible },
                    modifier = Modifier.semantics {
                        contentDescription = if (passwordVisible) {
                            "Hide password"
                        } else {
                            "Show password"
                        }
                    }
                ) {
                    Icon(
                        if (passwordVisible) {
                            Icons.Default.VisibilityOff
                        } else {
                            Icons.Default.Visibility
                        },
                        contentDescription = null
                    )
                }
            },
            visualTransformation = if (passwordVisible) {
                VisualTransformation.None
            } else {
                PasswordVisualTransformation()
            },
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done
            ),
            keyboardActions = KeyboardActions(
                onDone = {
                    keyboardController?.hide()
                    focusManager.clearFocus()
                    onLoginClick(email, password)
                }
            ),
            singleLine = true,
            enabled = uiState !is LoginUiState.Loading
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Login button
        Button(
            onClick = {
                keyboardController?.hide()
                focusManager.clearFocus()
                onLoginClick(email, password)
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .semantics { 
                    contentDescription = "Login button"
                },
            enabled = email.isNotEmpty() && 
                     password.isNotEmpty() && 
                     uiState !is LoginUiState.Loading
        ) {
            Text("Login")
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Biometric login button
        OutlinedButton(
            onClick = {
                keyboardController?.hide()
                focusManager.clearFocus()
                onBiometricClick()
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .semantics { 
                    contentDescription = "Login with biometrics button"
                },
            enabled = uiState !is LoginUiState.Loading
        ) {
            Icon(
                Icons.Default.Fingerprint,
                contentDescription = null,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("Login with Biometrics")
        }
    }

    // Set initial focus to email field
    LaunchedEffect(Unit) {
        emailFocusRequester.requestFocus()
    }
}