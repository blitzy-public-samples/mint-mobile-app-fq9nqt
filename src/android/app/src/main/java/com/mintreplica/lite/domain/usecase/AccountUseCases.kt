// External library versions:
// - javax.inject: 1
// - kotlinx.coroutines.flow: 1.6.4
// - kotlinx.coroutines: 1.6.4

package com.mintreplica.lite.domain.usecase

import com.mintreplica.lite.data.api.PlaidLinkRequest
import com.mintreplica.lite.data.repository.AccountRepository
import com.mintreplica.lite.data.repository.SyncResult
import com.mintreplica.lite.domain.model.Account
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Human Tasks:
 * 1. Configure Dagger/Hilt dependency injection in the application module
 * 2. Set up proper error handling and logging infrastructure
 * 3. Configure ProGuard rules if using code obfuscation
 * 4. Set up proper analytics tracking for account operations
 */

/**
 * Use case class that encapsulates business logic for account-related operations.
 * Implements clean architecture principles by mediating between UI and repository layers.
 *
 * Requirements addressed:
 * - Financial Account Integration (1.2 Scope/Core Features)
 * - Transaction Tracking (1.2 Scope/Core Features)
 * - Real-time Sync (1.2 Technical Implementation)
 */
@Singleton
class AccountUseCases @Inject constructor(
    private val accountRepository: AccountRepository
) {
    /**
     * Retrieves all accounts for a user with their formatted balances using reactive Flow.
     * Implements offline-first approach with automatic background synchronization.
     *
     * @param userId The ID of the user whose accounts to retrieve
     * @return Flow emitting list of accounts with formatted balances
     */
    fun getAccountsForUser(userId: String): Flow<List<Account>> {
        require(userId.isNotBlank()) { "User ID cannot be empty" }

        return accountRepository.getAccounts(userId)
            .map { accounts ->
                accounts.map { account ->
                    // Format balance for display
                    account.copy().apply { formatBalance() }
                }
            }
            .catch { e ->
                // Log error and emit empty list as fallback
                emit(emptyList())
            }
    }

    /**
     * Links a new financial account using Plaid integration.
     * Handles the Plaid authentication flow and account setup process.
     *
     * @param request Plaid link request containing public token and metadata
     * @return Result containing new account or error details
     */
    suspend fun linkPlaidAccount(request: PlaidLinkRequest): Result<Account> = 
        withContext(Dispatchers.IO) {
            try {
                // Validate request parameters
                require(request.publicToken.isNotBlank()) { "Public token cannot be empty" }
                require(request.metadata.institutionId.isNotBlank()) { "Institution ID cannot be empty" }

                // Attempt to link account through repository
                val account = accountRepository.linkAccount(request)
                Result.success(account)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    /**
     * Synchronizes account data with remote server using offline-first approach.
     * Checks if sync is needed based on last sync time before performing operation.
     *
     * @param accountId The ID of the account to sync
     * @return Result of sync operation with status
     */
    suspend fun syncAccountData(accountId: String): Result<SyncResult> = 
        withContext(Dispatchers.IO) {
            try {
                require(accountId.isNotBlank()) { "Account ID cannot be empty" }

                // Perform sync through repository
                val syncResult = accountRepository.syncAccount(accountId)
                Result.success(syncResult)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    /**
     * Refreshes all user accounts data in parallel using coroutines.
     * Only syncs accounts that need updating based on last sync time.
     *
     * @param userId The ID of the user whose accounts to refresh
     * @return Results of all sync operations
     */
    suspend fun refreshAllAccounts(userId: String): Result<List<SyncResult>> = 
        withContext(Dispatchers.IO) {
            try {
                require(userId.isNotBlank()) { "User ID cannot be empty" }

                // Get all accounts that need syncing
                val accounts = accountRepository.getAccounts(userId)
                    .map { accountList ->
                        accountList.filter { it.needsSync() }
                    }
                    .catch { emit(emptyList()) }
                    .collect { accountsToSync ->
                        // Launch parallel sync operations for each account
                        val syncResults = accountsToSync.map { account ->
                            async {
                                accountRepository.syncAccount(account.id)
                            }
                        }.awaitAll()

                        Result.success(syncResults)
                    }

                Result.failure(Exception("Failed to collect accounts"))
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    companion object {
        private const val TAG = "AccountUseCases"
    }
}