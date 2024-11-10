/**
 * Human Tasks:
 * 1. Verify Room database schema version is properly configured in AppDatabase
 * 2. Ensure DateConverter is registered in the AppDatabase configuration
 * 3. Verify database indices are properly set up for query performance
 */

package com.mintreplica.lite.data.database.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import com.mintreplica.lite.data.database.entities.GoalEntity
import kotlinx.coroutines.flow.Flow
import java.math.BigDecimal
import java.util.Date

/**
 * Data Access Object (DAO) interface for handling financial goal operations in the local SQLite database.
 * Implements reactive data access patterns using Kotlin Flow.
 *
 * Requirements addressed:
 * - Financial Goal Setting and Progress Monitoring (1.2 Scope/Core Features)
 * - Local Data Storage (5.2.1 Mobile Applications)
 * - Goal Data Model (8.2.1 Schema Design/Goals)
 */
@Dao
interface GoalDao {
    /**
     * Retrieves a specific goal by its ID with reactive updates.
     * Implements requirement from 1.2 Scope/Core Features for goal progress monitoring.
     *
     * @param goalId Unique identifier of the goal
     * @return Flow emitting the goal entity or null if not found
     */
    @Query("SELECT * FROM goals WHERE id = :goalId")
    fun getGoalById(goalId: String): Flow<GoalEntity?>

    /**
     * Retrieves all goals for a specific user ordered by creation date.
     * Implements requirement from 8.2.1 Schema Design/Goals for user-specific goal tracking.
     *
     * @param userId Unique identifier of the user
     * @return Flow emitting list of user's goals
     */
    @Query("SELECT * FROM goals WHERE user_id = :userId ORDER BY created_at DESC")
    fun getGoalsByUserId(userId: String): Flow<List<GoalEntity>>

    /**
     * Retrieves all active (incomplete) goals for a user ordered by target date.
     * Implements requirement from 1.2 Scope/Core Features for active goal monitoring.
     *
     * @param userId Unique identifier of the user
     * @return Flow emitting list of active goals
     */
    @Query("SELECT * FROM goals WHERE user_id = :userId AND is_completed = 0 ORDER BY target_date ASC")
    fun getActiveGoals(userId: String): Flow<List<GoalEntity>>

    /**
     * Retrieves all completed goals for a user ordered by last update.
     * Implements requirement from 1.2 Scope/Core Features for goal completion tracking.
     *
     * @param userId Unique identifier of the user
     * @return Flow emitting list of completed goals
     */
    @Query("SELECT * FROM goals WHERE user_id = :userId AND is_completed = 1 ORDER BY updated_at DESC")
    fun getCompletedGoals(userId: String): Flow<List<GoalEntity>>

    /**
     * Inserts a new goal into the database.
     * Implements requirement from 5.2.1 Mobile Applications for local data persistence.
     *
     * @param goal Goal entity to insert
     * @return ID of the inserted goal
     */
    @Insert
    suspend fun insertGoal(goal: GoalEntity): Long

    /**
     * Updates an existing goal in the database.
     * Implements requirement from 5.2.1 Mobile Applications for data modification.
     *
     * @param goal Goal entity to update
     * @return Number of rows updated
     */
    @Update
    suspend fun updateGoal(goal: GoalEntity): Int

    /**
     * Deletes a goal from the database.
     * Implements requirement from 5.2.1 Mobile Applications for data removal.
     *
     * @param goal Goal entity to delete
     * @return Number of rows deleted
     */
    @Delete
    suspend fun deleteGoal(goal: GoalEntity): Int

    /**
     * Updates the current amount and completion status of a goal.
     * Implements requirement from 1.2 Scope/Core Features for goal progress tracking.
     *
     * @param goalId Unique identifier of the goal
     * @param currentAmount Current progress amount
     * @param isCompleted Whether the goal is completed
     * @param updatedAt Last update timestamp
     * @return Number of rows updated
     */
    @Query("UPDATE goals SET current_amount = :currentAmount, is_completed = :isCompleted, updated_at = :updatedAt WHERE id = :goalId")
    suspend fun updateGoalProgress(
        goalId: String,
        currentAmount: BigDecimal,
        isCompleted: Boolean,
        updatedAt: Date
    ): Int
}