// External library versions:
// - kotlinx.parcelize: 1.8.0
// - android.os.Parcelable: Latest Android SDK version

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import java.math.BigDecimal
import java.time.Instant
import java.util.*

/**
 * Human Tasks:
 * 1. Ensure proper Kotlin Parcelize plugin configuration in app/build.gradle:
 *    id 'kotlin-parcelize'
 * 2. Configure ProGuard rules if using code obfuscation to preserve Parcelable implementation
 * 3. Verify currency formatting matches the application's localization requirements
 */

/**
 * Domain model class representing a financial transaction in the Mint Replica Lite application.
 * Implements Parcelable for efficient data transfer between Android components.
 * 
 * Requirements addressed:
 * - Transaction Tracking (1.2 Scope/Core Features)
 * - Data Model (8.2.1 Schema Design)
 * - Mobile Data Structure (5.2.1 Mobile Applications)
 */
@Parcelize
data class Transaction(
    val id: String,
    val accountId: String,
    val amount: BigDecimal,
    val date: Instant,
    val description: String,
    val category: String,
    val pending: Boolean,
    val metadata: Map<String, String> = emptyMap()
) : Parcelable {

    /**
     * Determines if the transaction is an expense based on the amount sign.
     * 
     * Implementation follows the technical specification section 8.2.1 Schema Design
     * for standardized transaction classification.
     *
     * @return True if the amount is negative (expense)
     */
    fun isExpense(): Boolean = amount < BigDecimal.ZERO

    /**
     * Determines if the transaction is income based on the amount sign.
     * 
     * Implementation follows the technical specification section 8.2.1 Schema Design
     * for standardized transaction classification.
     *
     * @return True if the amount is positive (income)
     */
    fun isIncome(): Boolean = amount > BigDecimal.ZERO

    /**
     * Returns formatted transaction amount with currency symbol based on associated account's currency.
     * 
     * Implementation follows the technical specification section 5.2.1 Mobile Applications
     * for consistent currency display across the application.
     *
     * @param account The associated Account object containing currency information
     * @return Formatted amount string with currency symbol
     */
    fun formattedAmount(account: Account): String {
        val currencyInstance = Currency.getInstance(account.currency)
        return java.text.NumberFormat.getCurrencyInstance().apply {
            currency = currencyInstance
            minimumFractionDigits = currencyInstance.defaultFractionDigits
            maximumFractionDigits = currencyInstance.defaultFractionDigits
        }.format(amount)
    }

    companion object {
        // Constants for metadata keys
        const val META_MERCHANT_ID = "merchant_id"
        const val META_LOCATION = "location"
        const val META_NOTES = "notes"
        const val META_RECEIPT_URL = "receipt_url"
    }
}