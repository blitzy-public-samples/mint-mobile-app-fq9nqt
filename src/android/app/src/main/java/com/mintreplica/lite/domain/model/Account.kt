// External library versions:
// - kotlinx.parcelize: Latest Android Gradle Plugin version
// - android.os.Parcelable: Latest Android SDK version

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import java.math.BigDecimal
import java.text.NumberFormat
import java.util.*
import java.time.Instant
import java.time.Duration

/**
 * Human Tasks:
 * 1. Ensure proper Kotlin Parcelize plugin configuration in app/build.gradle:
 *    id 'kotlin-parcelize'
 * 2. Configure ProGuard rules if using code obfuscation to preserve Parcelable implementation
 */

/**
 * Domain model class representing a financial account in the Mint Replica Lite application.
 * Implements Parcelable for efficient data transfer between Android components.
 * 
 * Requirements addressed:
 * - Financial Account Integration (1.2 Scope/Core Features)
 * - Account Data Structure (8.2.1 Schema Design)
 * - Mobile Data Management (5.2.1 Mobile Applications)
 */
@Parcelize
data class Account(
    val id: String,
    val userId: String,
    val institutionId: String,
    val accountType: String,
    val balance: BigDecimal,
    val currency: String,
    val name: String,
    val isActive: Boolean,
    val lastSynced: Instant
) : Parcelable {

    /**
     * Formats the account balance with proper currency symbol and decimals according to locale settings.
     * 
     * Implementation follows the technical specification section 8.2.1 Schema Design for standardized
     * currency handling across the application.
     *
     * @return Formatted balance string with currency symbol based on locale settings
     */
    fun formatBalance(): String {
        val currencyInstance = Currency.getInstance(currency)
        return NumberFormat.getCurrencyInstance().apply {
            currency = currencyInstance
            minimumFractionDigits = currencyInstance.defaultFractionDigits
            maximumFractionDigits = currencyInstance.defaultFractionDigits
        }.format(balance)
    }

    /**
     * Determines if account needs synchronization based on last sync time and sync policy.
     * 
     * Implementation follows the technical specification section 5.2.1 Mobile Applications
     * for offline data management and sync policies.
     *
     * @return True if the time since last sync exceeds the threshold (15 minutes)
     */
    fun needsSync(): Boolean {
        val syncThreshold = Duration.ofMinutes(15)
        val timeSinceLastSync = Duration.between(lastSynced, Instant.now())
        return timeSinceLastSync > syncThreshold
    }

    companion object {
        // Default sync threshold as specified in technical requirements
        private const val DEFAULT_SYNC_THRESHOLD_MINUTES = 15L
    }
}