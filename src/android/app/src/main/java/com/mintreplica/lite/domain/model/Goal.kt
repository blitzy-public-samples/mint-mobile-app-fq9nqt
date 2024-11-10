/**
 * Human Tasks:
 * 1. Verify currency code configuration in app settings matches user's locale
 * 2. Ensure date formatting configuration aligns with device locale settings
 */

package com.mintreplica.lite.domain.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import java.math.BigDecimal
import java.util.Date
import com.mintreplica.lite.utils.DateUtils
import com.mintreplica.lite.utils.CurrencyFormatter

/**
 * Domain model class representing a financial goal in the Mint Replica Lite application.
 * 
 * Requirements addressed:
 * - Financial Goal Setting and Progress Monitoring (1.2 Scope/Core Features)
 * - Goal Data Model (8.2.1 Schema Design/Goals)
 */
@Parcelize
data class Goal(
    val id: String,
    val userId: String,
    val name: String,
    val description: String,
    val targetAmount: BigDecimal,
    val currentAmount: BigDecimal,
    val category: String,
    val targetDate: Date,
    val createdAt: Date,
    val updatedAt: Date,
    val isCompleted: Boolean
) : Parcelable {

    /**
     * Calculates the current progress percentage towards the goal.
     * Implementation addresses requirement from 1.2 Scope/Core Features for goal progress tracking.
     *
     * @return Progress percentage between 0 and 100
     */
    fun getProgress(): Float {
        if (targetAmount <= BigDecimal.ZERO) return 0f
        val progress = (currentAmount.divide(targetAmount, 4, BigDecimal.ROUND_HALF_UP)
            .multiply(BigDecimal("100")))
            .toFloat()
        return progress.coerceIn(0f, 100f)
    }

    /**
     * Calculates the remaining amount needed to reach the goal.
     * Implementation addresses requirement from 8.2.1 Schema Design/Goals for goal tracking.
     *
     * @return Remaining amount needed
     */
    fun getRemainingAmount(): BigDecimal {
        val remaining = targetAmount.subtract(currentAmount)
        return remaining.max(BigDecimal.ZERO)
    }

    /**
     * Calculates the number of days remaining until the target date.
     * Implementation addresses requirement from 1.2 Scope/Core Features for goal deadline tracking.
     *
     * @return Number of days remaining
     */
    fun getRemainingDays(): Long {
        val today = Date()
        return if (today.after(targetDate)) 0
        else DateUtils.getDaysBetween(today, targetDate)
    }

    /**
     * Returns the target amount formatted as currency.
     * Implementation addresses requirement from 8.2.1 Schema Design/Goals for goal amount display.
     *
     * @return Formatted currency string
     */
    fun getFormattedTargetAmount(): String {
        return CurrencyFormatter.formatAmount(targetAmount, "USD") // Default to USD, can be parameterized
    }

    /**
     * Returns the current amount formatted as currency.
     * Implementation addresses requirement from 8.2.1 Schema Design/Goals for goal progress display.
     *
     * @return Formatted currency string
     */
    fun getFormattedCurrentAmount(): String {
        return CurrencyFormatter.formatAmount(currentAmount, "USD") // Default to USD, can be parameterized
    }

    /**
     * Returns the target date in a human-readable format.
     * Implementation addresses requirement from 1.2 Scope/Core Features for goal deadline display.
     *
     * @return Formatted date string
     */
    fun getFormattedTargetDate(): String {
        return DateUtils.toDisplayFormat(targetDate)
    }
}