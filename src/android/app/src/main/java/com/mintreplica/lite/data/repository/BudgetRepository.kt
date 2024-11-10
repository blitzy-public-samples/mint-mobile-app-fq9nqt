// External library versions:
// kotlinx.coroutines.flow:1.6.0
// javax.inject:1

package com.mintreplica.lite.data.repository

import com.mintreplica.lite.data.database.dao.BudgetDao
import com.mintreplica.lite.data.database.entities.BudgetEntity
import com.mintreplica.lite.domain.model.Budget
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

/**
 * Human Tasks:
 * 1. Ensure proper dependency injection setup in the app module
 * 2. Monitor database query performance in production
 * 3. Consider implementing caching strategy if needed
 * 4. Set up proper error tracking for database operations
 */

/**
 * Repository implementation for managing budget data with offline support and reactive streams.
 * Provides a clean API for budget management operations between local database and domain layer.
 *
 * Requirements addressed:
 * - Budget Management (1.2 Scope/Core Features): Implements budget creation and monitoring
 * - Local Data Storage (5.2.1 Mobile Applications): Manages local SQLite database operations
 * - Offline Support (5.2.1 Mobile Applications): Enables offline budget management functionality
 */
class BudgetRepository @Inject constructor(
    private val budgetDao: BudgetDao
) {
    /**
     * Retrieves all budgets for a user as a reactive Flow.
     * Automatically updates when underlying data changes.
     *
     * @param userId The ID of the user whose budgets to retrieve
     * @return Flow of list of Budget domain models
     */
    fun getBudgets(userId: String): Flow<List<Budget>> {
        return budgetDao.getAllBudgets(userId)
            .map { entities -> entities.map { it.toDomainModel() } }
    }

    /**
     * Retrieves all active budgets for a user.
     * Filters budgets where isActive is true.
     *
     * @param userId The ID of the user whose active budgets to retrieve
     * @return Flow of list of active Budget domain models
     */
    fun getActiveBudgets(userId: String): Flow<List<Budget>> {
        return budgetDao.getActiveBudgets(userId)
            .map { entities -> entities.map { it.toDomainModel() } }
    }

    /**
     * Retrieves a specific budget by ID.
     * Returns null if budget is not found.
     *
     * @param budgetId The ID of the budget to retrieve
     * @return Flow of optional Budget domain model
     */
    fun getBudgetById(budgetId: String): Flow<Budget?> {
        return budgetDao.getBudgetById(budgetId)
            .map { entity -> entity?.toDomainModel() }
    }

    /**
     * Creates a new budget in the database.
     * Converts domain model to entity and performs insertion.
     *
     * @param budget The Budget domain model to create
     * @return ID of the created budget
     */
    suspend fun createBudget(budget: Budget): Long {
        val entity = BudgetEntity.fromDomainModel(budget)
        return budgetDao.insertBudget(entity)
    }

    /**
     * Updates an existing budget in the database.
     * Converts domain model to entity and performs update.
     *
     * @param budget The Budget domain model to update
     */
    suspend fun updateBudget(budget: Budget) {
        val entity = BudgetEntity.fromDomainModel(budget)
        budgetDao.updateBudget(entity)
    }

    /**
     * Updates the spent amount for a specific budget.
     * Performs atomic update of spent field.
     *
     * @param budgetId The ID of the budget to update
     * @param spent The new spent amount
     */
    suspend fun updateBudgetSpent(budgetId: String, spent: Double) {
        budgetDao.updateBudgetSpentSafely(budgetId, spent)
    }

    /**
     * Deletes a budget from the database.
     * Converts domain model to entity and performs deletion.
     *
     * @param budget The Budget domain model to delete
     */
    suspend fun deleteBudget(budget: Budget) {
        val entity = BudgetEntity.fromDomainModel(budget)
        budgetDao.deleteBudget(entity)
    }
}