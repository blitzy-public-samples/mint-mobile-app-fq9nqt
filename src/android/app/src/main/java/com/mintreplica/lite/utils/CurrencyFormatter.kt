// External library versions:
// - java.text.NumberFormat: Latest Android SDK version
// - java.util.Currency: Latest Android SDK version
// - java.util.Locale: Latest Android SDK version

import java.math.BigDecimal
import java.text.NumberFormat
import java.util.Currency
import java.util.Locale
import com.mintreplica.lite.domain.model.Transaction
import com.mintreplica.lite.domain.model.Account

/**
 * Human Tasks:
 * 1. Verify locale handling matches application's internationalization requirements
 * 2. Ensure currency code validation aligns with supported currencies in the application
 * 3. Review decimal place handling for specific currency edge cases
 */

/**
 * Utility object providing standardized currency formatting functionality across the application.
 * 
 * Requirements addressed:
 * - Transaction Tracking (1.2 Scope/Core Features): Support for displaying formatted transaction amounts
 * - Data Display (8.1.2 Main Dashboard): Currency formatting with locale-specific formatting
 */
object CurrencyFormatter {

    /**
     * Formats a decimal amount with proper currency symbol and formatting based on locale.
     * 
     * Implementation follows technical specification section 8.1.2 Main Dashboard for
     * consistent currency display across the application.
     *
     * @param amount The decimal amount to format
     * @param currencyCode The ISO 4217 currency code (e.g., "USD", "EUR")
     * @return Formatted string with currency symbol and proper formatting
     * @throws IllegalArgumentException if currency code is invalid
     */
    fun formatAmount(amount: BigDecimal, currencyCode: String): String {
        val currency = try {
            Currency.getInstance(currencyCode)
        } catch (e: IllegalArgumentException) {
            throw IllegalArgumentException("Invalid currency code: $currencyCode", e)
        }

        return NumberFormat.getCurrencyInstance().apply {
            this.currency = currency
            minimumFractionDigits = currency.defaultFractionDigits
            maximumFractionDigits = currency.defaultFractionDigits
            isGroupingUsed = true
        }.format(amount)
    }

    /**
     * Formats a decimal amount without currency symbol but with proper decimal places and grouping.
     * 
     * Implementation follows technical specification section 8.1.2 Main Dashboard for
     * consistent number formatting across the application.
     *
     * @param amount The decimal amount to format
     * @return Formatted string with proper decimal places and grouping
     */
    fun formatAmountWithoutSymbol(amount: BigDecimal): String {
        return NumberFormat.getNumberInstance().apply {
            minimumFractionDigits = 2
            maximumFractionDigits = 2
            isGroupingUsed = true
        }.format(amount)
    }

    /**
     * Gets the currency symbol for a given currency code based on current locale.
     * 
     * Implementation follows technical specification section 8.1.2 Main Dashboard for
     * locale-aware currency symbol display.
     *
     * @param currencyCode The ISO 4217 currency code
     * @return Currency symbol for the specified currency code
     * @throws IllegalArgumentException if currency code is invalid
     */
    fun getCurrencySymbol(currencyCode: String): String {
        val currency = try {
            Currency.getInstance(currencyCode)
        } catch (e: IllegalArgumentException) {
            throw IllegalArgumentException("Invalid currency code: $currencyCode", e)
        }

        return try {
            currency.getSymbol(Locale.getDefault())
        } catch (e: IllegalArgumentException) {
            // Fallback to currency code if symbol not available for locale
            currencyCode
        }
    }

    /**
     * Extension function to format Transaction amount with proper currency symbol.
     * 
     * Implementation follows technical specification section 1.2 Scope/Core Features for
     * transaction amount display requirements.
     *
     * @param account The associated Account containing currency information
     * @return Formatted transaction amount with currency symbol
     */
    fun Transaction.formatAmount(account: Account): String {
        return formatAmount(this.amount, account.currency)
    }

    /**
     * Extension function to format Account balance with proper currency symbol.
     * 
     * Implementation follows technical specification section 8.1.2 Main Dashboard for
     * account balance display requirements.
     *
     * @return Formatted account balance with currency symbol
     */
    fun Account.formatBalance(): String {
        return formatAmount(this.balance, this.currency)
    }
}