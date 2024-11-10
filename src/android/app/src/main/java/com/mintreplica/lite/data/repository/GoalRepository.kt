/**
 * Human Tasks:
 * 1. Verify Room database configuration in AppDatabase.kt
 * 2. Ensure proper database migration strategy is in place
 * 3. Configure appropriate database backup strategy
 */

package com.mintreplica.lite.data.repository

import com.mintreplica.lite.data.database.dao.GoalDao
import com.mintreplica.lite.data.database.entities.GoalEntity
import com.mintreplica.lite.domain.model.Goal
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.math.BigDecimal
import java.util.Date
import javax.inject.Inject

/**
 * Repository implementation for managing financial goals in the Mint Replica Lite application.
 * Provides a clean API for goal management with reactive Flow support.
 *
 * Requirements addressed:
 * - Financial Goal Setting and Progress Monitoring (1.2 Scope/Core Features)
 * - Local Data Storage (5.2.1 Mobile Applications)
 * - Goal Data Model (8.2.1 Schema Design/Goals)
 */
class GoalRepository @Inject constructor(
    private val goalDao: GoalDao
) {
    /**
     * Retrieves a specific goal by its ID with reactive updates.
     * Implementation addresses requirement from 1.2 Scope/Core Features for goal progress monitoring.
     *
     * @param goalId Unique identifier of the goal
     * @return Flow emitting the goal domain model or null if not found
     */
    fun getGoalById(goalId: String): Flow<Goal?> {
        return goalDao.getGoalById(goalId).map { entity ->
            entity?.toDomainModel()
        }
    }

    /**
     * Retrieves all goals for a specific user with reactive updates.
     * Implementation addresses requirement from 8.2.1 Schema Design/Goals for user-specific goal tracking.
     *
     * @param userId Unique identifier of the user
     * @return Flow emitting list of goal domain models
     */
    fun getGoalsByUserId(userId: String): Flow<List<Goal>> {
        return goalDao.getGoalsByUserId(userId).map { entities ->
            entities.map { it.toDomainModel() }
        }
    }

    /**
     * Creates a new goal in the database.
     * Implementation addresses requirement from 5.2.1 Mobile Applications for local data persistence.
     *
     * @param goal Goal domain model to create
     * @return ID of created goal
     */
    suspend fun createGoal(goal: Goal): Long {
        val entity = GoalEntity.fromDomainModel(goal)
        return goalDao.insertGoal(entity)
    }

    /**
     * Updates an existing goal in the database.
     * Implementation addresses requirement from 5.2.1 Mobile Applications for data modification.
     *
     * @param goal Goal domain model to update
     * @return Success status of update operation
     */
    suspend fun updateGoal(goal: Goal): Boolean {
        val entity = GoalEntity.fromDomainModel(goal)
        return goalDao.updateGoal(entity) > 0
    }

    /**
     * Deletes a goal from the database.
     * Implementation addresses requirement from 5.2.1 Mobile Applications for data removal.
     *
     * @param goal Goal domain model to delete
     * @return Success status of delete operation
     */
    suspend fun deleteGoal(goal: Goal): Boolean {
        val entity = GoalEntity.fromDomainModel(goal)
        return goalDao.deleteGoal(entity) > 0
    }

    /**
     * Updates the progress of a goal and checks completion.
     * Implementation addresses requirement from 1.2 Scope/Core Features for goal progress tracking.
     *
     * @param goalId Unique identifier of the goal
     * @param currentAmount Current progress amount
     * @return Success status of progress update
     */
    suspend fun updateGoalProgress(goalId: String, currentAmount: BigDecimal): Boolean {
        val goal = goalDao.getGoalById(goalId).map { it?.toDomainModel() }
            .collect { it }
            ?: return false

        val isCompleted = currentAmount >= goal.targetAmount
        
        return goalDao.updateGoalProgress(
            goalId = goalId,
            currentAmount = currentAmount,
            isCompleted = isCompleted,
            updatedAt = Date()
        ) > 0
    }

    /**
     * Retrieves all active (incomplete) goals for a user.
     * Implementation addresses requirement from 1.2 Scope/Core Features for active goal monitoring.
     *
     * @param userId Unique identifier of the user
     * @return Flow emitting list of active goals
     */
    fun getActiveGoals(userId: String): Flow<List<Goal>> {
        return goalDao.getActiveGoals(userId).map { entities ->
            entities.map { it.toDomainModel() }
        }
    }

    /**
     * Retrieves all completed goals for a user.
     * Implementation addresses requirement from 1.2 Scope/Core Features for goal completion tracking.
     *
     * @param userId Unique identifier of the user
     * @return Flow emitting list of completed goals
     */
    fun getCompletedGoals(userId: String): Flow<List<Goal>> {
        return goalDao.getCompletedGoals(userId).map { entities ->
            entities.map { it.toDomainModel() }
        }
    }
}