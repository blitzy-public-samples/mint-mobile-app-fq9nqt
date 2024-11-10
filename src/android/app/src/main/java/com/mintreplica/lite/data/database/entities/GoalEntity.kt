/**
 * Human Tasks:
 * 1. Verify Room database schema version is properly configured in AppDatabase
 * 2. Ensure DateConverter is registered in the AppDatabase configuration
 */

package com.mintreplica.lite.data.database.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverters
import com.mintreplica.lite.domain.model.Goal
import java.math.BigDecimal
import java.util.Date

/**
 * Room database entity representing a financial goal in the local SQLite database.
 * 
 * Requirements addressed:
 * - Financial Goal Setting and Progress Monitoring (1.2 Scope/Core Features)
 * - Local Data Storage (5.2.1 Mobile Applications)
 * - Goal Data Model (8.2.1 Schema Design/Goals)
 */
@Entity(tableName = "goals")
@TypeConverters(DateConverter::class)
data class GoalEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,

    @ColumnInfo(name = "user_id")
    val userId: String,

    @ColumnInfo(name = "name")
    val name: String,

    @ColumnInfo(name = "description")
    val description: String,

    @ColumnInfo(name = "target_amount")
    val targetAmount: BigDecimal,

    @ColumnInfo(name = "current_amount")
    val currentAmount: BigDecimal,

    @ColumnInfo(name = "category")
    val category: String,

    @ColumnInfo(name = "target_date")
    val targetDate: Date,

    @ColumnInfo(name = "created_at")
    val createdAt: Date,

    @ColumnInfo(name = "updated_at")
    val updatedAt: Date,

    @ColumnInfo(name = "is_completed")
    val isCompleted: Boolean
) {
    /**
     * Converts the database entity to a domain model instance.
     * Implementation addresses requirement from 5.2.1 Mobile Applications for data mapping.
     *
     * @return Goal domain model instance
     */
    fun toDomainModel(): Goal {
        return Goal(
            id = id,
            userId = userId,
            name = name,
            description = description,
            targetAmount = targetAmount,
            currentAmount = currentAmount,
            category = category,
            targetDate = targetDate,
            createdAt = createdAt,
            updatedAt = updatedAt,
            isCompleted = isCompleted
        )
    }

    companion object {
        /**
         * Creates a database entity from a domain model instance.
         * Implementation addresses requirement from 5.2.1 Mobile Applications for data persistence.
         *
         * @param goal Domain model instance to convert
         * @return GoalEntity database entity instance
         */
        fun fromDomainModel(goal: Goal): GoalEntity {
            return GoalEntity(
                id = goal.id,
                userId = goal.userId,
                name = goal.name,
                description = goal.description,
                targetAmount = goal.targetAmount,
                currentAmount = goal.currentAmount,
                category = goal.category,
                targetDate = goal.targetDate,
                createdAt = goal.createdAt,
                updatedAt = goal.updatedAt,
                isCompleted = goal.isCompleted
            )
        }
    }
}