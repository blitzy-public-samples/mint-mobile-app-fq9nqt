// External library versions:
// - androidx.lifecycle:viewmodel:2.6.1
// - javax.inject:1
// - kotlinx.coroutines.flow:1.6.4
// - dagger.hilt:2.44

package com.mintreplica.lite.ui.screens.accounts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mintreplica.lite.data.api.PlaidLinkRequest
import com.mintreplica.lite.domain.model.Account
import com.mintreplica.lite.domain.usecase.AccountUseCases
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Human Tasks:
 * 1. Configure Hilt dependency injection in the application module
 * 2. Set up proper error handling and logging infrastructure
 * 3. Configure ProGuard rules for Hilt if using code obfuscation
 * 4. Set up proper analytics tracking for account operations
 */

/**
 * Data class representing the UI state for the accounts screen
 */
data class AccountsUiState(
    val isLoading: Boolean = false,
    val accounts: List<Account> = emptyList(),
    val error: String? = null,
    val isRefreshing: Boolean = false,
    val isLinking: Boolean = false,
    val syncingAccounts: Set<String> = emptySet()
)

/**
 * ViewModel that manages the UI state and business logic for the accounts screen.
 * Implements offline-first architecture with reactive data streams.
 *
 * Requirements addressed:
 * - Financial Account Integration (1.2 Scope/Core Features)
 * - Real-time Notifications (1.2 Scope/Core Features)
 * - Offline Data Access (5.2.1 Mobile Applications)
 * - Real-time Sync (1.2 Technical Implementation)
 */
@HiltViewModel
class AccountsViewModel @Inject constructor(
    private val accountUseCases: AccountUseCases
) : ViewModel() {

    private val _uiState = MutableStateFlow(AccountsUiState())
    val uiState: StateFlow<AccountsUiState> = _uiState

    /**
     * Loads user accounts and updates UI state using reactive Flow.
     * Implements offline-first approach with automatic background synchronization.
     *
     * @param userId The ID of the user whose accounts to load
     */
    fun loadAccounts(userId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            try {
                accountUseCases.getAccountsForUser(userId)
                    .catch { exception ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = exception.message ?: "Failed to load accounts"
                        )
                    }
                    .collect { accounts ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            accounts = accounts.map { it.apply { formatBalance() } }
                        )
                    }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to load accounts"
                )
            }
        }
    }

    /**
     * Triggers a refresh of all account data with parallel sync.
     * Implements real-time synchronization with error handling.
     */
    fun refreshAccounts() {
        val currentAccounts = _uiState.value.accounts
        if (currentAccounts.isEmpty()) return

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isRefreshing = true, error = null)
            
            try {
                val userId = currentAccounts.firstOrNull()?.userId ?: return@launch
                accountUseCases.refreshAllAccounts(userId).fold(
                    onSuccess = { syncResults ->
                        // Reload accounts to reflect updated data
                        loadAccounts(userId)
                    },
                    onFailure = { exception ->
                        _uiState.value = _uiState.value.copy(
                            isRefreshing = false,
                            error = exception.message ?: "Failed to refresh accounts"
                        )
                    }
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isRefreshing = false,
                    error = e.message ?: "Failed to refresh accounts"
                )
            }
        }
    }

    /**
     * Initiates Plaid account linking process with error handling.
     * Implements financial institution integration requirement.
     *
     * @param request Plaid link request containing necessary tokens and metadata
     * @return Result containing the linked account or error details
     */
    suspend fun linkPlaidAccount(request: PlaidLinkRequest): Result<Account> {
        _uiState.value = _uiState.value.copy(isLinking = true, error = null)
        
        return try {
            accountUseCases.linkPlaidAccount(request).also { result ->
                result.fold(
                    onSuccess = { account ->
                        val updatedAccounts = _uiState.value.accounts + account
                        _uiState.value = _uiState.value.copy(
                            isLinking = false,
                            accounts = updatedAccounts
                        )
                    },
                    onFailure = { exception ->
                        _uiState.value = _uiState.value.copy(
                            isLinking = false,
                            error = exception.message ?: "Failed to link account"
                        )
                    }
                )
            }
        } catch (e: Exception) {
            _uiState.value = _uiState.value.copy(
                isLinking = false,
                error = e.message ?: "Failed to link account"
            )
            Result.failure(e)
        }
    }

    /**
     * Synchronizes a specific account with offline-first approach.
     * Implements real-time sync requirement with progress tracking.
     *
     * @param accountId The ID of the account to synchronize
     * @return Result containing sync operation status
     */
    suspend fun syncAccount(accountId: String): Result<SyncResult> {
        if (_uiState.value.syncingAccounts.contains(accountId)) {
            return Result.failure(IllegalStateException("Account sync already in progress"))
        }

        _uiState.value = _uiState.value.copy(
            syncingAccounts = _uiState.value.syncingAccounts + accountId
        )

        return try {
            val account = _uiState.value.accounts.find { it.id == accountId }
            if (account == null || !account.needsSync()) {
                return Result.success(SyncResult.SKIPPED)
            }

            accountUseCases.syncAccountData(accountId).also { result ->
                result.fold(
                    onSuccess = { syncResult ->
                        // Refresh the specific account data
                        val userId = account.userId
                        loadAccounts(userId)
                    },
                    onFailure = { exception ->
                        _uiState.value = _uiState.value.copy(
                            error = exception.message ?: "Failed to sync account"
                        )
                    }
                )
                _uiState.value = _uiState.value.copy(
                    syncingAccounts = _uiState.value.syncingAccounts - accountId
                )
            }
        } catch (e: Exception) {
            _uiState.value = _uiState.value.copy(
                syncingAccounts = _uiState.value.syncingAccounts - accountId,
                error = e.message ?: "Failed to sync account"
            )
            Result.failure(e)
        }
    }

    companion object {
        private const val TAG = "AccountsViewModel"
    }
}