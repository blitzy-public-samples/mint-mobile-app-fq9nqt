// External library versions:
// - androidx.room: 2.5.0
// - kotlinx.coroutines.flow: 1.6.0

package com.mintreplica.lite.data.database.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
import com.mintreplica.lite.data.database.entities.TransactionEntity
import kotlinx.coroutines.flow.Flow

/**
 * Human Tasks:
 * 1. Ensure Room database configuration includes this DAO in the database builder
 * 2. Verify database migration strategy handles any schema changes
 * 3. Configure ProGuard rules to preserve Room annotations if using code obfuscation
 */

/**
 * Room Database Data Access Object (DAO) for transaction-related operations.
 * Provides methods for CRUD operations and complex queries with reactive data streams.
 *
 * Requirements addressed:
 * - Transaction Tracking (1.2 Scope/Core Features): Implements local database access for transaction management
 * - Data Architecture (5.2.4 Data Architecture): Provides data access layer for transaction operations
 * - Mobile Data Storage (5.2.1 Mobile Applications): Enables offline-first transaction data access
 */
@Dao
interface TransactionDao {

    /**
     * Retrieves all transactions ordered by date descending.
     * Provides reactive updates using Kotlin Flow.
     *
     * @return Flow emitting list of all transactions
     */
    @Query("SELECT * FROM transactions ORDER BY transaction_date DESC")
    fun getAllTransactions(): Flow<List<TransactionEntity>>

    /**
     * Retrieves a specific transaction by ID.
     * Returns null if transaction is not found.
     *
     * @param id Transaction ID to retrieve
     * @return Flow emitting the transaction or null
     */
    @Query("SELECT * FROM transactions WHERE id = :id")
    fun getTransactionById(id: String): Flow<TransactionEntity?>

    /**
     * Retrieves all transactions for a specific account ordered by date.
     *
     * @param accountId Account ID to filter transactions
     * @return Flow emitting list of account transactions
     */
    @Query("SELECT * FROM transactions WHERE account_id = :accountId ORDER BY transaction_date DESC")
    fun getTransactionsByAccountId(accountId: String): Flow<List<TransactionEntity>>

    /**
     * Retrieves all transactions for a specific category ordered by date.
     *
     * @param category Category to filter transactions
     * @return Flow emitting list of categorized transactions
     */
    @Query("SELECT * FROM transactions WHERE category = :category ORDER BY transaction_date DESC")
    fun getTransactionsByCategory(category: String): Flow<List<TransactionEntity>>

    /**
     * Inserts a new transaction into the database.
     *
     * @param transaction Transaction entity to insert
     * @return Generated row ID
     */
    @Insert
    suspend fun insertTransaction(transaction: TransactionEntity): Long

    /**
     * Inserts multiple transactions in a single transaction.
     * Ensures atomic batch insertion.
     *
     * @param transactions List of transaction entities to insert
     * @return List of generated row IDs
     */
    @Insert
    @Transaction
    suspend fun insertTransactions(transactions: List<TransactionEntity>): List<Long>

    /**
     * Updates an existing transaction in the database.
     *
     * @param transaction Transaction entity to update
     * @return Number of rows updated (1 if successful, 0 if not found)
     */
    @Update
    suspend fun updateTransaction(transaction: TransactionEntity): Int

    /**
     * Deletes a transaction from the database.
     *
     * @param transaction Transaction entity to delete
     * @return Number of rows deleted (1 if successful, 0 if not found)
     */
    @Delete
    suspend fun deleteTransaction(transaction: TransactionEntity): Int

    /**
     * Deletes all transactions from the database.
     * Executes in a transaction for atomicity.
     */
    @Query("DELETE FROM transactions")
    @Transaction
    suspend fun deleteAllTransactions()

    /**
     * Gets transaction count grouped by category for analytics.
     *
     * @return Flow emitting map of category to transaction count
     */
    @Query("SELECT category, COUNT(*) as count FROM transactions GROUP BY category")
    fun getTransactionCountByCategory(): Flow<Map<String, Int>>

    /**
     * Searches transactions by description or category with pattern matching.
     *
     * @param query Search query string
     * @return Flow emitting list of matching transactions
     */
    @Query("SELECT * FROM transactions WHERE description LIKE '%' || :query || '%' OR category LIKE '%' || :query || '%' ORDER BY transaction_date DESC")
    fun searchTransactions(query: String): Flow<List<TransactionEntity>>
}