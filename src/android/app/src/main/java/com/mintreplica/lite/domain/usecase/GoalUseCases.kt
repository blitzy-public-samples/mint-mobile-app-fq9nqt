/**
 * Human Tasks:
 * 1. Verify error handling configuration aligns with app-wide error handling strategy
 * 2. Ensure proper analytics tracking is configured for goal-related events
 * 3. Configure appropriate validation rules in app settings
 */

package com.mintreplica.lite.domain.usecase

import com.mintreplica.lite.domain.model.Goal
import com.mintreplica.lite.data.repository.GoalRepository
import kotlinx.coroutines.flow.Flow
import java.math.BigDecimal
import javax.inject.Inject

/**
 * Use cases for managing financial goals in the Mint Replica Lite application.
 * Implements business logic for goal creation, tracking, and management following clean architecture principles.
 *
 * Requirements addressed:
 * - Financial Goal Setting and Progress Monitoring (1.2 Scope/Core Features)
 * - Goal Data Model (8.2.1 Schema Design/Goals)
 */
class GoalUseCases @Inject constructor(
    private val repository: GoalRepository
) {
    /**
     * Retrieves a goal by its ID with reactive updates.
     * Implementation addresses requirement from 1.2 Scope/Core Features for goal progress monitoring.
     *
     * @param goalId Unique identifier of the goal
     * @return Flow emitting the goal or null if not found
     */
    fun getGoal(goalId: String): Flow<Goal?> {
        return repository.getGoalById(goalId)
    }

    /**
     * Retrieves all goals for a user with reactive updates.
     * Implementation addresses requirement from 8.2.1 Schema Design/Goals for user-specific goal tracking.
     *
     * @param userId Unique identifier of the user
     * @return Flow emitting list of goals
     */
    fun getUserGoals(userId: String): Flow<List<Goal>> {
        return repository.getGoalsByUserId(userId)
    }

    /**
     * Creates a new financial goal after validating parameters.
     * Implementation addresses requirement from 1.2 Scope/Core Features for goal creation.
     *
     * @param goal Goal to create
     * @return ID of created goal
     * @throws IllegalArgumentException if validation fails
     */
    suspend fun createGoal(goal: Goal): Long {
        validateGoalParameters(goal)
        return repository.createGoal(goal)
    }

    /**
     * Updates an existing goal after validating parameters.
     * Implementation addresses requirement from 8.2.1 Schema Design/Goals for goal management.
     *
     * @param goal Goal to update
     * @return Success status
     * @throws IllegalArgumentException if validation fails
     */
    suspend fun updateGoal(goal: Goal): Boolean {
        validateGoalParameters(goal)
        return repository.updateGoal(goal)
    }

    /**
     * Deletes a goal.
     * Implementation addresses requirement from 8.2.1 Schema Design/Goals for goal management.
     *
     * @param goal Goal to delete
     * @return Success status
     */
    suspend fun deleteGoal(goal: Goal): Boolean {
        return repository.deleteGoal(goal)
    }

    /**
     * Updates the progress of a goal and checks completion status.
     * Implementation addresses requirement from 1.2 Scope/Core Features for goal progress tracking.
     *
     * @param goalId Unique identifier of the goal
     * @param currentAmount Current progress amount
     * @return Success status
     * @throws IllegalArgumentException if amount is negative
     */
    suspend fun updateGoalProgress(goalId: String, currentAmount: BigDecimal): Boolean {
        require(currentAmount >= BigDecimal.ZERO) { "Current amount cannot be negative" }
        return repository.updateGoalProgress(goalId, currentAmount)
    }

    /**
     * Validates goal parameters before creation or update.
     * Implementation addresses requirement from 8.2.1 Schema Design/Goals for data validation.
     *
     * @param goal Goal to validate
     * @throws IllegalArgumentException if validation fails
     */
    private fun validateGoalParameters(goal: Goal) {
        require(goal.targetAmount > BigDecimal.ZERO) { 
            "Target amount must be greater than zero" 
        }
        require(goal.currentAmount >= BigDecimal.ZERO) { 
            "Current amount cannot be negative" 
        }
        require(goal.currentAmount <= goal.targetAmount) { 
            "Current amount cannot exceed target amount" 
        }
        require(goal.name.isNotBlank()) { 
            "Goal name cannot be empty" 
        }
        require(goal.targetDate.after(goal.createdAt)) { 
            "Target date must be in the future" 
        }
    }
}