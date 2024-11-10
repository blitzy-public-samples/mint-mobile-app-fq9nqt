// External library versions:
// - androidx.room: 2.5.0

package com.mintreplica.lite.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.mintreplica.lite.data.database.dao.AccountDao
import com.mintreplica.lite.data.database.dao.TransactionDao
import com.mintreplica.lite.data.database.entities.AccountEntity
import com.mintreplica.lite.data.database.entities.TransactionEntity

/**
 * Human Tasks:
 * 1. Ensure Room schema version is properly configured in app/build.gradle:
 *    room.schemaLocation = "$projectDir/schemas"
 *    room.incremental = true
 * 2. Run Room schema export after any entity changes:
 *    ./gradlew room:exportSchema
 * 3. Verify database migration strategy when updating schema version
 * 4. Configure ProGuard rules if using code obfuscation to preserve Room annotations
 * 5. Set up database inspector in Android Studio for debugging
 */

/**
 * Room database abstract class that serves as the main database configuration
 * for the Mint Replica Lite Android application.
 *
 * Requirements addressed:
 * - Local Data Storage (5.2.1 Mobile Applications): Local SQLite database for offline data storage
 * - Data Architecture (5.2.4 Data Architecture): Database schema and configuration implementation
 * - Mobile Data Persistence (8.2.1 Schema Design): Local database implementation for mobile data persistence
 */
@Database(
    entities = [
        AccountEntity::class,
        TransactionEntity::class
    ],
    version = 1,
    exportSchema = true
)
@TypeConverters(DateConverter::class)
abstract class AppDatabase : RoomDatabase() {

    /**
     * Provides access to account database operations with reactive Flow support.
     * Implements data access methods defined in AccountDao interface.
     *
     * @return AccountDao implementation for account operations
     */
    abstract fun accountDao(): AccountDao

    /**
     * Provides access to transaction database operations with reactive Flow support.
     * Implements data access methods defined in TransactionDao interface.
     *
     * @return TransactionDao implementation for transaction operations
     */
    abstract fun transactionDao(): TransactionDao

    companion object {
        private const val DATABASE_NAME = "mint_replica_lite.db"

        @Volatile
        private var INSTANCE: AppDatabase? = null

        /**
         * Gets or creates database instance using double-checked locking singleton pattern.
         * Ensures thread-safe database initialization and access.
         *
         * @param context Application context for database creation
         * @return Thread-safe database instance
         */
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: buildDatabase(context).also { INSTANCE = it }
            }
        }

        private fun buildDatabase(context: Context): AppDatabase {
            return Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                DATABASE_NAME
            )
                // Destructive migration strategy - for development only
                // TODO: Implement proper migration strategy for production
                .fallbackToDestructiveMigration()
                // Enable main thread queries for development only
                // TODO: Remove for production and ensure all database operations are on background threads
                .allowMainThreadQueries()
                // Add database callback for initial data population if needed
                .addCallback(object : RoomDatabase.Callback() {
                    // Override callback methods if needed for database initialization
                })
                .build()
        }
    }
}

/**
 * Type converter for Room database to handle date/time conversions.
 * Converts between Instant and Long for database storage.
 *
 * Requirements addressed:
 * - Data Architecture (5.2.4 Data Architecture): Custom type conversion for database persistence
 */
class DateConverter {
    @androidx.room.TypeConverter
    fun fromTimestamp(value: Long?): java.time.Instant? {
        return value?.let { java.time.Instant.ofEpochMilli(it) }
    }

    @androidx.room.TypeConverter
    fun toTimestamp(instant: java.time.Instant?): Long? {
        return instant?.toEpochMilli()
    }
}