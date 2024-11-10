// External library versions:
// androidx.room:room-runtime:2.5.0
// kotlinx.android.parcel:1.5.0

package com.mintreplica.lite.data.database.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import com.mintreplica.lite.domain.model.Budget

/**
 * Human Tasks:
 * 1. Ensure Room database schema version is properly incremented when modifying this entity
 * 2. Update database migration scripts if schema changes are made
 * 3. Verify index creation for frequently queried columns if needed
 */

/**
 * Room database entity representing a budget record in the local SQLite database.
 * 
 * Requirements addressed:
 * - Budget Management (1.2 Scope/Core Features): Provides local persistence for budget data
 * - Local Data Storage (5.2.1 Mobile Applications): Maps to SQLite table for offline storage
 * - Offline Support (5.2.1 Mobile Applications): Enables offline budget tracking functionality
 */
@Entity(tableName = "budgets")
@Parcelize
data class BudgetEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,

    @ColumnInfo(name = "user_id")
    val userId: String,

    @ColumnInfo(name = "name")
    val name: String,

    @ColumnInfo(name = "amount")
    val amount: Double,

    @ColumnInfo(name = "period")
    val period: String,

    @ColumnInfo(name = "category")
    val category: String,

    @ColumnInfo(name = "spent")
    var spent: Double,

    @ColumnInfo(name = "start_date")
    val startDate: Long,

    @ColumnInfo(name = "end_date")
    val endDate: Long,

    @ColumnInfo(name = "is_active")
    var isActive: Boolean
) : Parcelable {

    /**
     * Converts the database entity to a domain model object for use in business logic.
     * Maps all database columns to corresponding domain model fields.
     */
    fun toDomainModel() = Budget(
        id = id,
        userId = userId,
        name = name,
        amount = amount,
        period = period,
        category = category,
        spent = spent,
        startDate = startDate,
        endDate = endDate,
        isActive = isActive
    )

    companion object {
        /**
         * Creates a database entity from a domain model object for persistence.
         * Maps all domain model fields to corresponding database columns.
         */
        fun fromDomainModel(budget: Budget) = BudgetEntity(
            id = budget.id,
            userId = budget.userId,
            name = budget.name,
            amount = budget.amount,
            period = budget.period,
            category = budget.category,
            spent = budget.spent,
            startDate = budget.startDate,
            endDate = budget.endDate,
            isActive = budget.isActive
        )
    }
}