// kotlinx.parcelize library version 1.8.0
import android.os.Parcelable
import kotlinx.parcelize.Parcelize

/**
 * Human Tasks:
 * 1. Ensure Kotlin Parcelize plugin is enabled in the app-level build.gradle:
 *    id 'kotlin-parcelize'
 */

/**
 * Domain model class representing a budget in the Mint Replica Lite Android application.
 * Implements core budget tracking functionality with support for different time periods and categories.
 * 
 * Requirements addressed:
 * - Budget Management (1.2 Scope/Core Features): Budget creation and monitoring with support for 
 *   different time periods and categories
 * - Core Features (1.1 System Overview): Financial management functionality including budget 
 *   tracking and monitoring
 */
@Parcelize
data class Budget(
    val id: String,
    val userId: String,
    val name: String,
    val amount: Double,
    val period: String,
    val category: String,
    var spent: Double,
    val startDate: Long,
    val endDate: Long,
    var isActive: Boolean
) : Parcelable {

    /**
     * Calculates remaining budget amount for tracking available funds.
     * 
     * @return Remaining budget amount (amount - spent)
     */
    fun getRemainingAmount(): Double {
        return amount - spent
    }

    /**
     * Calculates percentage of budget spent for progress tracking.
     * 
     * @return Percentage of budget spent (0-100)
     */
    fun getSpentPercentage(): Double {
        return if (amount > 0) {
            (spent / amount) * 100
        } else {
            0.0
        }
    }

    /**
     * Checks if spending exceeds budget amount for alert purposes.
     * 
     * @return True if spent > amount, false otherwise
     */
    fun isOverBudget(): Boolean {
        return spent > amount
    }
}