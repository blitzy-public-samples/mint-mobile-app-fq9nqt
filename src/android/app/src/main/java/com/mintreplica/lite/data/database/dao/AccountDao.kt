// External library versions:
// - androidx.room: 2.5.0
// - kotlinx.coroutines: 1.6.0

package com.mintreplica.lite.data.database.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import com.mintreplica.lite.data.database.entities.AccountEntity
import kotlinx.coroutines.flow.Flow
import java.math.BigDecimal

/**
 * Human Tasks:
 * 1. Ensure Room database configuration includes this DAO in the AppDatabase class
 * 2. Verify database migrations if schema changes are made
 * 3. Configure database inspector in Android Studio for debugging
 */

/**
 * Room database Data Access Object (DAO) interface that provides database operations
 * for managing financial accounts in the local SQLite database.
 *
 * Requirements addressed:
 * - Local Data Storage (5.2.1 Mobile Applications): Local SQLite database for offline data storage
 * - Data Architecture (5.2.4 Data Architecture): Database access layer implementation
 * - Account Management (6.1.1 Core Application Components): Account data operations and persistence
 */
@Dao
interface AccountDao {

    /**
     * Retrieves all accounts for a specific user as a Flow for reactive updates.
     * The Flow will emit a new value whenever the accounts table changes.
     *
     * @param userId The ID of the user whose accounts to retrieve
     * @return Flow emitting list of account entities
     */
    @Query("SELECT * FROM accounts WHERE user_id = :userId")
    fun getAccounts(userId: String): Flow<List<AccountEntity>>

    /**
     * Retrieves a specific account by its ID with reactive updates.
     * The Flow will emit a new value whenever the account data changes.
     *
     * @param accountId The ID of the account to retrieve
     * @return Flow emitting the requested account entity
     */
    @Query("SELECT * FROM accounts WHERE id = :accountId")
    fun getAccountById(accountId: String): Flow<AccountEntity>

    /**
     * Inserts a new account into the database.
     * Returns the row ID of the inserted account.
     *
     * @param account The account entity to insert
     * @return The row ID of the newly inserted account
     */
    @Insert
    suspend fun insertAccount(account: AccountEntity): Long

    /**
     * Updates an existing account in the database.
     * Returns the number of accounts updated (should be 1).
     *
     * @param account The account entity to update
     * @return Number of accounts updated
     */
    @Update
    suspend fun updateAccount(account: AccountEntity): Int

    /**
     * Deletes an account from the database.
     * Returns the number of accounts deleted (should be 1).
     *
     * @param account The account entity to delete
     * @return Number of accounts deleted
     */
    @Delete
    suspend fun deleteAccount(account: AccountEntity): Int

    /**
     * Retrieves all active accounts for a specific user with reactive updates.
     * The Flow will emit a new value whenever the active accounts change.
     *
     * @param userId The ID of the user whose active accounts to retrieve
     * @return Flow emitting list of active account entities
     */
    @Query("SELECT * FROM accounts WHERE user_id = :userId AND is_active = 1")
    fun getActiveAccounts(userId: String): Flow<List<AccountEntity>>

    /**
     * Updates the balance of a specific account.
     * Returns the number of accounts updated (should be 1).
     *
     * @param accountId The ID of the account to update
     * @param newBalance The new balance to set
     * @return Number of accounts updated
     */
    @Query("UPDATE accounts SET balance = :newBalance WHERE id = :accountId")
    suspend fun updateAccountBalance(accountId: String, newBalance: BigDecimal): Int
}