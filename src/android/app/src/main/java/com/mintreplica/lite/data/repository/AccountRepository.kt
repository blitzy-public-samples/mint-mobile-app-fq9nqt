// External library versions:
// - javax.inject: 1
// - kotlinx.coroutines.flow: 1.6.4
// - kotlinx.coroutines: 1.6.4

package com.mintreplica.lite.data.repository

import com.mintreplica.lite.data.api.ApiService
import com.mintreplica.lite.data.api.PlaidLinkRequest
import com.mintreplica.lite.data.api.SyncStatus
import com.mintreplica.lite.data.database.dao.AccountDao
import com.mintreplica.lite.domain.model.Account
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.math.BigDecimal
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Human Tasks:
 * 1. Configure Dagger/Hilt dependency injection in the application module
 * 2. Set up proper network security configuration for API communication
 * 3. Configure ProGuard rules for API and database models if using code obfuscation
 * 4. Set up proper error handling and logging infrastructure
 * 5. Configure database encryption for sensitive financial data
 */

/**
 * Repository implementation that manages financial account data operations with offline-first approach.
 * Coordinates between local database storage and remote API services.
 *
 * Requirements addressed:
 * - Financial Account Integration (1.2 Scope/Core Features): Manages financial institution integration
 * - Offline Data Access (5.2.1 Mobile Applications): Implements local database for offline access
 * - Real-time Sync (1.2 Technical Implementation): Handles data synchronization with backend
 */
@Singleton
class AccountRepository @Inject constructor(
    private val accountDao: AccountDao,
    private val apiService: ApiService
) {
    /**
     * Retrieves all accounts for a user with offline-first approach using Flow.
     * First emits local data, then fetches and updates with remote data.
     *
     * @param userId The ID of the user whose accounts to retrieve
     * @return Flow emitting list of accounts
     */
    fun getAccounts(userId: String): Flow<List<Account>> {
        return accountDao.getAccounts(userId)
            .map { accounts -> accounts.map { it.toDomainModel() } }
            .catch { e ->
                // Log error and emit empty list as fallback
                emit(emptyList())
            }
            .also {
                // Trigger background sync
                syncAccountsInBackground(userId)
            }
    }

    /**
     * Links a new financial account using Plaid integration.
     *
     * @param request Plaid link request containing public token and metadata
     * @return Newly linked account details
     * @throws Exception if linking fails
     */
    suspend fun linkAccount(request: PlaidLinkRequest): Account = withContext(Dispatchers.IO) {
        val response = apiService.linkPlaidAccount(request)
        if (response.isSuccessful) {
            val account = response.body()!!
            // Save to local database
            accountDao.insertAccount(account.toEntity())
            account
        } else {
            throw Exception("Failed to link account: ${response.errorBody()?.string()}")
        }
    }

    /**
     * Synchronizes account data with remote server if needed.
     *
     * @param accountId The ID of the account to sync
     * @return Result of sync operation
     */
    suspend fun syncAccount(accountId: String): SyncResult = withContext(Dispatchers.IO) {
        val account = accountDao.getAccountById(accountId).firstOrNull()?.toDomainModel()
            ?: return@withContext SyncResult(false, "Account not found")

        if (!account.needsSync()) {
            return@withContext SyncResult(true, "Account up to date")
        }

        try {
            val response = apiService.syncAccount(accountId)
            if (response.isSuccessful) {
                val syncStatus = response.body()!!
                if (syncStatus.status == "success") {
                    // Update local database with synced data
                    accountDao.updateAccount(account.toEntity())
                    SyncResult(true, "Sync successful")
                } else {
                    SyncResult(false, syncStatus.message ?: "Sync failed")
                }
            } else {
                SyncResult(false, "Sync request failed")
            }
        } catch (e: Exception) {
            SyncResult(false, "Sync error: ${e.message}")
        }
    }

    /**
     * Updates account balance locally and triggers sync with remote server.
     *
     * @param accountId The ID of the account to update
     * @param newBalance The new balance to set
     * @return Success status of update operation
     */
    suspend fun updateAccountBalance(accountId: String, newBalance: BigDecimal): Boolean = 
        withContext(Dispatchers.IO) {
            try {
                // Update local database first
                val updateResult = accountDao.updateAccountBalance(accountId, newBalance)
                if (updateResult > 0) {
                    // Trigger sync with remote server
                    val syncResult = syncAccount(accountId)
                    syncResult.success
                } else {
                    false
                }
            } catch (e: Exception) {
                false
            }
        }

    /**
     * Performs background synchronization of accounts for a user.
     *
     * @param userId The ID of the user whose accounts to sync
     */
    private suspend fun syncAccountsInBackground(userId: String) {
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getAccounts()
                if (response.isSuccessful) {
                    response.body()?.forEach { account ->
                        accountDao.updateAccount(account.toEntity())
                    }
                }
            } catch (e: Exception) {
                // Log error but don't throw - this is a background operation
            }
        }
    }
}

/**
 * Data class representing the result of a sync operation
 */
data class SyncResult(
    val success: Boolean,
    val message: String
)

/**
 * Extension function to convert Account domain model to database entity
 */
private fun Account.toEntity(): AccountEntity = AccountEntity(
    id = id,
    userId = userId,
    institutionId = institutionId,
    accountType = accountType,
    balance = balance,
    currency = currency,
    name = name,
    isActive = isActive,
    lastSynced = lastSynced
)

/**
 * Extension function to convert database entity to Account domain model
 */
private fun AccountEntity.toDomainModel(): Account = Account(
    id = id,
    userId = userId,
    institutionId = institutionId,
    accountType = accountType,
    balance = balance,
    currency = currency,
    name = name,
    isActive = isActive,
    lastSynced = lastSynced
)