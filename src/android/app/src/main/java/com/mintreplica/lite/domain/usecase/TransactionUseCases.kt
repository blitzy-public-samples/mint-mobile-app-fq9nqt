// External library versions:
// - javax.inject:1
// - kotlinx.coroutines.flow:1.6.0
// - kotlin.Result:1.8.0

/**
 * Human Tasks:
 * 1. Ensure proper Coroutines configuration in app/build.gradle
 * 2. Configure ProGuard rules if using code obfuscation
 * 3. Set up proper ML model integration for transaction categorization
 * 4. Configure export file storage permissions in AndroidManifest.xml
 */

package com.mintreplica.lite.domain.usecase

import android.net.Uri
import com.mintreplica.lite.data.repository.TransactionRepository
import com.mintreplica.lite.domain.model.Transaction
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.math.BigDecimal

/**
 * Use case class that implements business logic for transaction-related operations.
 * Provides clean, domain-specific interfaces for transaction management with offline support.
 *
 * Requirements addressed:
 * - Transaction Tracking (1.2 Scope/Core Features): Implements comprehensive transaction management
 * - Data Export (1.2 Scope/Core Features): Provides data export capabilities
 * - Real-time Sync (1.2 Technical Implementation): Handles data synchronization with offline support
 */
@Singleton
class TransactionUseCases @Inject constructor(
    private val transactionRepository: TransactionRepository
) {
    /**
     * Retrieves all transactions with applied filters and sorting.
     *
     * @param filter Filter criteria for transactions
     * @param sortOrder Sorting order for transactions
     * @return Flow of filtered and sorted transactions
     */
    fun getTransactions(filter: TransactionFilter = TransactionFilter(), sortOrder: SortOrder = SortOrder.DATE_DESC): Flow<List<Transaction>> {
        return transactionRepository.getAllTransactions()
            .map { transactions ->
                var filtered = transactions

                // Apply date range filter
                if (filter.dateRange != null) {
                    filtered = filtered.filter { transaction ->
                        transaction.date.isAfter(filter.dateRange.start) &&
                        transaction.date.isBefore(filter.dateRange.end)
                    }
                }

                // Apply amount range filter
                if (filter.amountRange != null) {
                    filtered = filtered.filter { transaction ->
                        transaction.amount >= filter.amountRange.min &&
                        transaction.amount <= filter.amountRange.max
                    }
                }

                // Apply category filter
                if (!filter.categories.isNullOrEmpty()) {
                    filtered = filtered.filter { transaction ->
                        filter.categories.contains(transaction.category)
                    }
                }

                // Apply pending status filter
                if (filter.includePending != null) {
                    filtered = filtered.filter { transaction ->
                        transaction.pending == filter.includePending
                    }
                }

                // Apply sorting
                when (sortOrder) {
                    SortOrder.DATE_DESC -> filtered.sortedByDescending { it.date }
                    SortOrder.DATE_ASC -> filtered.sortedBy { it.date }
                    SortOrder.AMOUNT_DESC -> filtered.sortedByDescending { it.amount }
                    SortOrder.AMOUNT_ASC -> filtered.sortedBy { it.amount }
                }
            }
    }

    /**
     * Searches transactions by query string matching description or category.
     *
     * @param query Search query string
     * @return Flow of matching transactions
     */
    fun searchTransactions(query: String): Flow<List<Transaction>> {
        return transactionRepository.getAllTransactions()
            .map { transactions ->
                val searchTerms = query.lowercase().split(" ")
                transactions.filter { transaction ->
                    searchTerms.all { term ->
                        transaction.description.lowercase().contains(term) ||
                        transaction.category.lowercase().contains(term)
                    }
                }.sortedByDescending { it.date }
            }
    }

    /**
     * Updates transaction category with ML-based suggestion.
     * Uses transaction description and metadata for category prediction.
     *
     * @param transaction Transaction to categorize
     * @return Result containing updated transaction with suggested category
     */
    suspend fun categorizeTransaction(transaction: Transaction): Result<Transaction> = withContext(Dispatchers.Default) {
        try {
            // TODO: Integrate with ML model for category prediction
            // This is a simplified implementation
            val suggestedCategory = when {
                transaction.description.lowercase().contains("grocery") -> "Groceries"
                transaction.description.lowercase().contains("restaurant") -> "Dining"
                transaction.description.lowercase().contains("uber") -> "Transportation"
                transaction.description.lowercase().contains("amazon") -> "Shopping"
                transaction.amount > BigDecimal(1000) -> "Large Purchases"
                transaction.isIncome() -> "Income"
                else -> "Miscellaneous"
            }

            val categorizedTransaction = transaction.copy(category = suggestedCategory)
            transactionRepository.updateTransaction(categorizedTransaction)
                .map { categorizedTransaction }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Synchronizes transactions with remote server.
     * Implements offline support and conflict resolution.
     *
     * @param accountId Account ID for synchronization
     * @return Result indicating sync operation success or failure
     */
    suspend fun syncTransactions(accountId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            transactionRepository.syncTransactions(accountId)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Exports transactions in specified format.
     * Supports CSV and JSON export formats.
     *
     * @param format Export format (CSV or JSON)
     * @param dateRange Date range for export
     * @return Result containing URI of exported file
     */
    suspend fun exportTransactions(format: ExportFormat, dateRange: DateRange): Result<Uri> = withContext(Dispatchers.IO) {
        try {
            val transactions = getTransactions(
                TransactionFilter(dateRange = dateRange)
            ).map { it }.first()

            val fileName = "transactions_${dateRange.start}_${dateRange.end}.${format.extension}"
            val file = File(fileName)

            when (format) {
                ExportFormat.CSV -> exportToCsv(transactions, file)
                ExportFormat.JSON -> exportToJson(transactions, file)
            }

            Result.success(Uri.fromFile(file))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun exportToCsv(transactions: List<Transaction>, file: File) {
        file.bufferedWriter().use { writer ->
            // Write header
            writer.write("Date,Description,Category,Amount,Status\n")
            
            // Write transactions
            transactions.forEach { transaction ->
                writer.write("${transaction.date},${transaction.description},${transaction.category},${transaction.amount},${if (transaction.pending) "Pending" else "Completed"}\n")
            }
        }
    }

    private fun exportToJson(transactions: List<Transaction>, file: File) {
        // Simple JSON serialization
        file.bufferedWriter().use { writer ->
            writer.write("{\n\"transactions\": [\n")
            transactions.forEachIndexed { index, transaction ->
                writer.write("""
                    {
                        "id": "${transaction.id}",
                        "date": "${transaction.date}",
                        "description": "${transaction.description}",
                        "category": "${transaction.category}",
                        "amount": ${transaction.amount},
                        "pending": ${transaction.pending}
                    }${if (index < transactions.size - 1) "," else ""}
                """.trimIndent())
            }
            writer.write("]\n}")
        }
    }

    /**
     * Data class representing transaction filter criteria
     */
    data class TransactionFilter(
        val dateRange: DateRange? = null,
        val amountRange: AmountRange? = null,
        val categories: List<String>? = null,
        val includePending: Boolean? = null
    )

    /**
     * Data class representing a date range for filtering
     */
    data class DateRange(
        val start: Instant,
        val end: Instant
    )

    /**
     * Data class representing an amount range for filtering
     */
    data class AmountRange(
        val min: BigDecimal,
        val max: BigDecimal
    )

    /**
     * Enum representing transaction sort orders
     */
    enum class SortOrder {
        DATE_DESC,
        DATE_ASC,
        AMOUNT_DESC,
        AMOUNT_ASC
    }

    /**
     * Enum representing export format options
     */
    enum class ExportFormat(val extension: String) {
        CSV("csv"),
        JSON("json")
    }
}