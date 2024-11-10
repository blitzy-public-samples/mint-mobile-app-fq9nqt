// External library versions:
// - androidx.room: 2.5.0

package com.mintreplica.lite.data.database.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.mintreplica.lite.domain.model.Account
import java.math.BigDecimal
import java.time.Instant

/**
 * Human Tasks:
 * 1. Ensure Room schema version is properly configured in app/build.gradle:
 *    room.schemaLocation = "$projectDir/schemas"
 *    room.incremental = true
 * 2. Run Room schema export after any entity changes:
 *    ./gradlew room:exportSchema
 */

/**
 * Room database entity representing a financial account in the local SQLite database.
 * Maps to the accounts table and provides persistence for Account domain model.
 *
 * Requirements addressed:
 * - Local Data Storage (5.2.1 Mobile Applications): Local SQLite database for offline data storage
 * - Data Architecture (5.2.4 Data Architecture): Database entity implementation for account data
 * - Account Data Structure (8.2.1 Schema Design): Database schema implementation for accounts table
 */
@Entity(tableName = "accounts")
data class AccountEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,

    @ColumnInfo(name = "user_id")
    val userId: String,

    @ColumnInfo(name = "institution_id")
    val institutionId: String,

    @ColumnInfo(name = "account_type")
    val accountType: String,

    @ColumnInfo(name = "balance")
    val balance: BigDecimal,

    @ColumnInfo(name = "currency")
    val currency: String,

    @ColumnInfo(name = "name")
    val name: String,

    @ColumnInfo(name = "is_active")
    val isActive: Boolean,

    @ColumnInfo(name = "last_synced")
    val lastSynced: Instant
) {

    /**
     * Converts database entity to domain model instance.
     * Maps all properties from the database representation to the domain model.
     *
     * @return Account domain model instance with all properties mapped from the entity
     */
    fun toDomainModel(): Account = Account(
        id = id,
        userId = userId,
        institutionId = institutionId,
        accountType = accountType,
        balance = balance,
        currency = currency,
        name = name,
        isActive = isActive,
        lastSynced = lastSynced
    )

    companion object {
        /**
         * Creates database entity from domain model instance.
         * Maps all properties from the domain model to the database representation.
         *
         * @param account Domain model instance to convert to database entity
         * @return AccountEntity instance with all properties mapped from the domain model
         */
        fun fromDomainModel(account: Account): AccountEntity = AccountEntity(
            id = account.id,
            userId = account.userId,
            institutionId = account.institutionId,
            accountType = account.accountType,
            balance = account.balance,
            currency = account.currency,
            name = account.name,
            isActive = account.isActive,
            lastSynced = account.lastSynced
        )
    }
}