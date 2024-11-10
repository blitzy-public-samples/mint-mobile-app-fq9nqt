// External library versions:
// - androidx.room: 2.5.0

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.PrimaryKey
import androidx.room.TypeConverters
import com.mintreplica.lite.domain.model.Transaction
import java.math.BigDecimal
import java.time.Instant

/**
 * Human Tasks:
 * 1. Ensure Room schema version is properly configured in the database migration strategy
 * 2. Verify DateConverter is implemented and registered in the database configuration
 * 3. Configure ProGuard rules if using code obfuscation to preserve Room annotations
 */

/**
 * Room database entity representing a financial transaction record.
 * Maps to the 'transactions' table in SQLite database.
 *
 * Requirements addressed:
 * - Transaction Tracking (1.2 Scope/Core Features): Provides local data persistence for transaction records
 * - Data Architecture (5.2.4 Data Architecture): Implements local database schema for transaction storage
 * - Mobile Data Storage (5.2.1 Mobile Applications): Enables offline transaction data storage in SQLite
 */
@Entity(
    tableName = "transactions",
    foreignKeys = [
        ForeignKey(
            entity = AccountEntity::class,
            parentColumns = ["id"],
            childColumns = ["account_id"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
@TypeConverters(DateConverter::class)
data class TransactionEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "account_id")
    val accountId: String,

    @ColumnInfo(name = "amount")
    val amount: BigDecimal,

    @ColumnInfo(name = "transaction_date")
    val date: Instant,

    @ColumnInfo(name = "description")
    val description: String,

    @ColumnInfo(name = "category")
    val category: String,

    @ColumnInfo(name = "is_pending")
    val isPending: Boolean,

    @ColumnInfo(name = "metadata")
    val metadata: String = "{}" // JSON string for metadata storage
) {

    /**
     * Converts database entity to domain model.
     * Implementation follows Data Architecture (5.2.4) for clean separation of concerns.
     *
     * @return Transaction domain model instance
     */
    fun toDomainModel(): Transaction {
        return Transaction(
            id = id,
            accountId = accountId,
            amount = amount,
            date = date,
            description = description,
            category = category,
            pending = isPending,
            metadata = try {
                // Convert JSON string to Map
                kotlinx.serialization.json.Json.decodeFromString<Map<String, String>>(metadata)
            } catch (e: Exception) {
                emptyMap()
            }
        )
    }

    companion object {
        /**
         * Creates database entity from domain model.
         * Implementation follows Data Architecture (5.2.4) for consistent data mapping.
         *
         * @param transaction Domain model instance
         * @return TransactionEntity database entity instance
         */
        fun fromDomainModel(transaction: Transaction): TransactionEntity {
            return TransactionEntity(
                id = transaction.id,
                accountId = transaction.accountId,
                amount = transaction.amount,
                date = transaction.date,
                description = transaction.description,
                category = transaction.category,
                isPending = transaction.pending,
                metadata = try {
                    // Convert Map to JSON string
                    kotlinx.serialization.json.Json.encodeToString(
                        transaction.metadata
                    )
                } catch (e: Exception) {
                    "{}"
                }
            )
        }
    }
}