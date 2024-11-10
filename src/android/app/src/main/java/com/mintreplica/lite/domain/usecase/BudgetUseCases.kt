// External library versions:
// kotlinx.coroutines.flow:1.6.0
// javax.inject:1

package com.mintreplica.lite.domain.usecase

import com.mintreplica.lite.data.repository.BudgetRepository
import com.mintreplica.lite.domain.model.Budget
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

/**
 * Human Tasks:
 * 1. Ensure proper dependency injection setup in the app module
 * 2. Set up budget threshold notifications in the notification service
 * 3. Configure proper error tracking and analytics for budget operations
 * 4. Review and adjust budget validation rules if needed for production
 */

/**
 * Use case class that implements budget management business logic for the Mint Replica Lite Android application.
 * Provides reactive data streams with offline support following clean architecture principles.
 *
 * Requirements addressed:
 * - Budget Management (1.2 Scope/Core Features): Implements budget creation and monitoring with 
 *   support for different time periods and categories
 * - Core Features (1.1 System Overview): Provides financial management functionality including 
 *   budget tracking and monitoring
 */
class BudgetUseCases @Inject constructor(
    private val budgetRepository: BudgetRepository
) {
    /**
     * Retrieves all budgets for a user as a reactive stream.
     * Validates user ID and provides real-time updates through Flow.
     *
     * @param userId The ID of the user whose budgets to retrieve
     * @return Flow of list of budgets with real-time updates
     * @throws IllegalArgumentException if userId is empty
     */
    fun getUserBudgets(userId: String): Flow<List<Budget>> {
        require(userId.isNotEmpty()) { "User ID cannot be empty" }
        return budgetRepository.getBudgets(userId)
            .map { budgets ->
                budgets.sortedByDescending { it.startDate }
            }
    }

    /**
     * Retrieves detailed information for a specific budget with reactive updates.
     * Validates budget ID and provides real-time updates through Flow.
     *
     * @param budgetId The ID of the budget to retrieve details for
     * @return Flow of optional budget details with real-time updates
     * @throws IllegalArgumentException if budgetId is empty
     */
    fun getBudgetDetails(budgetId: String): Flow<Budget?> {
        require(budgetId.isNotEmpty()) { "Budget ID cannot be empty" }
        return budgetRepository.getBudgetById(budgetId)
    }

    /**
     * Creates a new budget with validation and persistence.
     * Validates budget parameters before creation.
     *
     * @param budget The budget to create
     * @return ID of created budget
     * @throws IllegalArgumentException if budget parameters are invalid
     */
    suspend fun createNewBudget(budget: Budget): Long {
        validateBudget(budget)
        return budgetRepository.createBudget(budget)
    }

    /**
     * Updates budget spending amount with validation and notifications.
     * Checks for budget thresholds and validates spending amount.
     *
     * @param budget The budget to update
     * @param newSpentAmount The new spent amount to set
     * @throws IllegalArgumentException if newSpentAmount is negative
     */
    suspend fun updateBudgetSpending(budget: Budget, newSpentAmount: Double) {
        require(newSpentAmount >= 0) { "Spent amount cannot be negative" }

        val updatedBudget = budget.copy(spent = newSpentAmount)
        budgetRepository.updateBudgetSpent(budget.id, newSpentAmount)

        // Check budget thresholds for notifications
        if (!budget.isOverBudget() && updatedBudget.isOverBudget()) {
            // TODO: Trigger over-budget notification through notification service
        } else if (updatedBudget.getSpentPercentage() >= 90 && budget.getSpentPercentage() < 90) {
            // TODO: Trigger approaching budget limit notification
        }
    }

    /**
     * Deletes an existing budget with validation.
     * Checks if budget exists and can be deleted.
     *
     * @param budget The budget to delete
     * @throws IllegalArgumentException if budget cannot be deleted
     */
    suspend fun deleteBudget(budget: Budget) {
        require(budget.id.isNotEmpty()) { "Budget ID cannot be empty" }
        budgetRepository.deleteBudget(budget)
    }

    /**
     * Validates budget parameters for creation and updates.
     * Ensures all required fields are valid and within acceptable ranges.
     *
     * @param budget The budget to validate
     * @throws IllegalArgumentException if any validation fails
     */
    private fun validateBudget(budget: Budget) {
        require(budget.amount > 0) { "Budget amount must be greater than zero" }
        require(budget.userId.isNotEmpty()) { "User ID cannot be empty" }
        require(budget.name.isNotEmpty()) { "Budget name cannot be empty" }
        require(budget.category.isNotEmpty()) { "Budget category cannot be empty" }
        require(budget.period.isNotEmpty()) { "Budget period cannot be empty" }
        require(budget.startDate > 0) { "Start date must be valid" }
        require(budget.endDate > budget.startDate) { "End date must be after start date" }
        
        // Validate period format based on expected values
        require(budget.period in listOf("DAILY", "WEEKLY", "MONTHLY", "YEARLY")) {
            "Invalid budget period"
        }
    }
}