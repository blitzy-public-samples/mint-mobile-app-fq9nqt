// External library versions:
// androidx.room:room-runtime:2.5.0
// kotlinx.coroutines.flow:1.6.0

package com.mintreplica.lite.data.database.dao

import androidx.room.*
import com.mintreplica.lite.data.database.entities.BudgetEntity
import kotlinx.coroutines.flow.Flow

/**
 * Human Tasks:
 * 1. Ensure proper database indices are created for frequently queried columns
 * 2. Verify Room database version is updated when modifying DAO queries
 * 3. Update database migration scripts if query changes affect schema
 * 4. Monitor query performance and optimize if needed
 */

/**
 * Room Database Data Access Object (DAO) for budget-related operations.
 * 
 * Requirements addressed:
 * - Budget Management (1.2 Scope/Core Features): Provides CRUD operations for budget data
 * - Local Data Storage (5.2.1 Mobile Applications): Implements SQLite database access
 * - Offline Support (5.2.1 Mobile Applications): Enables offline budget management
 */
@Dao
interface BudgetDao {
    /**
     * Retrieves all budgets for a specific user as a reactive Flow.
     * Updates are automatically emitted when the underlying data changes.
     */
    @Query("SELECT * FROM budgets WHERE user_id = :userId")
    fun getAllBudgets(userId: String): Flow<List<BudgetEntity>>

    /**
     * Retrieves a specific budget by ID with reactive updates.
     * Returns null if budget is not found.
     */
    @Query("SELECT * FROM budgets WHERE id = :budgetId")
    fun getBudgetById(budgetId: String): Flow<BudgetEntity?>

    /**
     * Retrieves all budgets for a specific category and user with reactive updates.
     * Filters by both category and user ID for data isolation.
     */
    @Query("SELECT * FROM budgets WHERE category = :category AND user_id = :userId")
    fun getBudgetsByCategory(category: String, userId: String): Flow<List<BudgetEntity>>

    /**
     * Retrieves all active budgets for a user with reactive updates.
     * Active budgets have is_active flag set to true.
     */
    @Query("SELECT * FROM budgets WHERE is_active = 1 AND user_id = :userId")
    fun getActiveBudgets(userId: String): Flow<List<BudgetEntity>>

    /**
     * Inserts a new budget into the database.
     * Returns the row ID of the inserted budget.
     */
    @Insert
    suspend fun insertBudget(budget: BudgetEntity): Long

    /**
     * Updates an existing budget in the database.
     * All fields are updated based on the primary key.
     */
    @Update
    suspend fun updateBudget(budget: BudgetEntity)

    /**
     * Deletes a budget from the database.
     * Removes the budget record completely.
     */
    @Delete
    suspend fun deleteBudget(budget: BudgetEntity)

    /**
     * Updates the spent amount for a specific budget.
     * Atomic operation to update single field.
     */
    @Query("UPDATE budgets SET spent = :spent WHERE id = :budgetId")
    suspend fun updateBudgetSpent(budgetId: String, spent: Double)

    /**
     * Transaction to safely update budget spent amount.
     * Ensures data consistency when updating spent values.
     */
    @Transaction
    suspend fun updateBudgetSpentSafely(budgetId: String, spent: Double) {
        updateBudgetSpent(budgetId, spent)
    }
}