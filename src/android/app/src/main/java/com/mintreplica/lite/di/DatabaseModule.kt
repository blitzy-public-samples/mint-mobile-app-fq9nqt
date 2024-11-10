// External library versions:
// - dagger.hilt: 2.44
// - javax.inject: 1

package com.mintreplica.lite.di

import android.content.Context
import com.mintreplica.lite.data.database.AppDatabase
import com.mintreplica.lite.data.database.dao.AccountDao
import com.mintreplica.lite.data.database.dao.TransactionDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Human Tasks:
 * 1. Ensure Hilt is properly configured in the application's build.gradle
 * 2. Verify Room schema version and migration strategy in AppDatabase
 * 3. Configure database inspector in Android Studio for debugging
 * 4. Set up ProGuard rules if using code obfuscation to preserve Hilt and Room annotations
 */

/**
 * Hilt dependency injection module that provides database-related dependencies
 * for the Mint Replica Lite Android application.
 *
 * Requirements addressed:
 * - Local Data Storage (5.2.1 Mobile Applications): Provides singleton database instance
 * - Data Architecture (5.2.4 Data Architecture): Configures database dependency injection
 */
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    /**
     * Provides singleton instance of Room database with proper initialization.
     * Uses double-checked locking pattern from AppDatabase for thread-safe initialization.
     *
     * @param context Application context for database creation
     * @return Thread-safe singleton database instance
     */
    @Provides
    @Singleton
    fun provideAppDatabase(
        @ApplicationContext context: Context
    ): AppDatabase {
        return AppDatabase.getDatabase(context)
    }

    /**
     * Provides AccountDao instance for account database operations.
     * The DAO is scoped to singleton to ensure consistent access across the app.
     *
     * @param database The Room database instance
     * @return Account data access object with Flow support
     */
    @Provides
    @Singleton
    fun provideAccountDao(database: AppDatabase): AccountDao {
        return database.accountDao()
    }

    /**
     * Provides TransactionDao instance for transaction database operations.
     * The DAO is scoped to singleton to ensure consistent access across the app.
     *
     * @param database The Room database instance
     * @return Transaction data access object with Flow support
     */
    @Provides
    @Singleton
    fun provideTransactionDao(database: AppDatabase): TransactionDao {
        return database.transactionDao()
    }
}