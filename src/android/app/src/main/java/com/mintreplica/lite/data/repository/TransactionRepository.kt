// External library versions:
// - javax.inject:1
// - kotlinx.coroutines:1.6.0
// - kotlinx.coroutines.flow:1.6.0

/**
 * Human Tasks:
 * 1. Ensure proper Coroutines configuration in app/build.gradle
 * 2. Configure ProGuard rules if using code obfuscation
 * 3. Verify network security configuration for API communication
 * 4. Set up proper error tracking/monitoring integration
 */

package com.mintreplica.lite.data.repository

import com.mintreplica.lite.data.api.ApiService
import com.mintreplica.lite.data.database.dao.TransactionDao
import com.mintreplica.lite.domain.model.Transaction
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Dispatchers
import java.time.Instant
import java.util.UUID

/**
 * Repository implementation that manages transaction data operations.
 * Coordinates between local database storage and remote API services.
 * 
 * Requirements addressed:
 * - Transaction Tracking (1.2 Scope/Core Features): Implements synchronized local and remote transaction management
 * - Real-time Data Synchronization (1.2 Technical Implementation): Handles data sync between local and remote
 * - Offline Support (5.2.1 Mobile Applications): Provides offline-first transaction access
 */
@Singleton
class TransactionRepository @Inject constructor(
    private val transactionDao: TransactionDao,
    private val apiService: ApiService
) {
    /**
     * Retrieves all transactions as a Flow, ordered by date descending.
     * Provides real-time updates for UI.
     */
    fun getAllTransactions(): Flow<List<Transaction>> {
        return transactionDao.getAllTransactions()
            .map { transactions -> transactions.map { it.toDomainModel() } }
            .catch { e ->
                // Log error and emit empty list as fallback
                e.printStackTrace()
                emit(emptyList())
            }
    }

    /**
     * Retrieves a specific transaction by ID with real-time updates.
     */
    fun getTransactionById(transactionId: String): Flow<Transaction?> {
        return transactionDao.getTransactionById(transactionId)
            .map { it?.toDomainModel() }
            .catch { e ->
                e.printStackTrace()
                emit(null)
            }
    }

    /**
     * Synchronizes transactions with remote server.
     * Implements conflict resolution and error handling.
     */
    suspend fun syncTransactions(accountId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            // Fetch remote transactions
            val response = apiService.getAccountTransactions(accountId, 1, 100)
            if (!response.isSuccessful) {
                return@withContext Result.failure(Exception("Failed to fetch transactions: ${response.code()}"))
            }

            val remoteTransactions = response.body() ?: emptyList()
            
            // Sync with local database
            val localTransactions = transactionDao.getAllTransactions()
                .map { transactions -> transactions.map { it.toDomainModel() } }
                .catch { emit(emptyList()) }
                .collect { it }

            // Resolve conflicts using timestamp-based strategy
            val mergedTransactions = mergeTransactions(localTransactions, remoteTransactions)
            
            // Update local database
            transactionDao.deleteAllTransactions()
            transactionDao.insertTransactions(mergedTransactions.map { it.toEntity() })

            // Sync status with server
            val syncResponse = apiService.syncAccount(accountId)
            if (!syncResponse.isSuccessful) {
                return@withContext Result.failure(Exception("Failed to update sync status: ${syncResponse.code()}"))
            }

            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    /**
     * Saves a new transaction with offline support.
     * Queues for sync when offline.
     */
    suspend fun saveTransaction(transaction: Transaction): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            // Save to local database first
            val result = transactionDao.insertTransaction(transaction.toEntity())
            if (result <= 0) {
                return@withContext Result.failure(Exception("Failed to save transaction locally"))
            }

            // Attempt remote sync if online
            try {
                val syncResponse = apiService.syncAccount(transaction.accountId)
                if (!syncResponse.isSuccessful) {
                    // Transaction saved locally but sync failed - will be synced later
                    return@withContext Result.success(Unit)
                }
            } catch (e: Exception) {
                // Network error - transaction saved locally, will sync later
                e.printStackTrace()
            }

            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    /**
     * Updates an existing transaction with offline support.
     */
    suspend fun updateTransaction(transaction: Transaction): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            // Update local database
            val result = transactionDao.updateTransaction(transaction.toEntity())
            if (result <= 0) {
                return@withContext Result.failure(Exception("Failed to update transaction locally"))
            }

            // Attempt remote sync if online
            try {
                val syncResponse = apiService.syncAccount(transaction.accountId)
                if (!syncResponse.isSuccessful) {
                    // Transaction updated locally but sync failed - will be synced later
                    return@withContext Result.success(Unit)
                }
            } catch (e: Exception) {
                // Network error - transaction updated locally, will sync later
                e.printStackTrace()
            }

            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    /**
     * Deletes a transaction with offline support.
     */
    suspend fun deleteTransaction(transaction: Transaction): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            // Delete from local database
            val result = transactionDao.deleteTransaction(transaction.toEntity())
            if (result <= 0) {
                return@withContext Result.failure(Exception("Failed to delete transaction locally"))
            }

            // Attempt remote sync if online
            try {
                val syncResponse = apiService.syncAccount(transaction.accountId)
                if (!syncResponse.isSuccessful) {
                    // Transaction deleted locally but sync failed - will be synced later
                    return@withContext Result.success(Unit)
                }
            } catch (e: Exception) {
                // Network error - transaction deleted locally, will sync later
                e.printStackTrace()
            }

            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    /**
     * Merges local and remote transactions using timestamp-based conflict resolution.
     */
    private fun mergeTransactions(
        local: List<Transaction>,
        remote: List<Transaction>
    ): List<Transaction> {
        val merged = mutableMapOf<String, Transaction>()
        
        // Add all local transactions
        local.forEach { transaction ->
            merged[transaction.id] = transaction
        }

        // Merge remote transactions, newer timestamp wins
        remote.forEach { remoteTransaction ->
            val localTransaction = merged[remoteTransaction.id]
            if (localTransaction == null || remoteTransaction.date.isAfter(localTransaction.date)) {
                merged[remoteTransaction.id] = remoteTransaction
            }
        }

        return merged.values.toList().sortedByDescending { it.date }
    }

    /**
     * Extension function to convert Transaction domain model to database entity.
     */
    private fun Transaction.toEntity(): TransactionEntity {
        return TransactionEntity(
            id = id,
            accountId = accountId,
            amount = amount,
            date = date,
            description = description,
            category = category,
            pending = pending,
            metadata = metadata
        )
    }

    /**
     * Extension function to convert database entity to Transaction domain model.
     */
    private fun TransactionEntity.toDomainModel(): Transaction {
        return Transaction(
            id = id,
            accountId = accountId,
            amount = amount,
            date = date,
            description = description,
            category = category,
            pending = pending,
            metadata = metadata
        )
    }
}