// External library versions:
// - dagger.hilt: 2.44
// - javax.inject: 1
// - kotlinx.coroutines: 1.6.4

package com.mintreplica.lite.di

import android.app.Application
import android.content.Context
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import javax.inject.Singleton

/**
 * Human Tasks:
 * 1. Ensure Hilt is properly configured in the application's build.gradle
 * 2. Verify the Application class is properly annotated with @HiltAndroidApp
 * 3. Configure ProGuard rules for Hilt if using code obfuscation
 * 4. Review coroutine dispatcher configurations for production environment
 */

/**
 * Main Hilt module that provides application-wide dependencies and coordinates other modules
 * with proper scoping and lifecycle management.
 *
 * Requirements addressed:
 * - System Components Architecture (5.2.1 Mobile Applications): 
 *   Native Android application using Kotlin and Jetpack Compose with shared business logic layer
 * - Dependency Injection (6.4 Component Dependencies):
 *   Application-wide dependency management and coordination
 */
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    /**
     * Provides the singleton Application instance for dependency injection throughout the app.
     * This instance is used for accessing application-level resources and services.
     *
     * @param application The Android Application instance
     * @return Singleton-scoped Application instance
     */
    @Provides
    @Singleton
    fun provideApplication(application: Application): Application {
        requireNotNull(application) { "Application instance cannot be null" }
        return application
    }

    /**
     * Provides the application context for dependency injection with proper lifecycle awareness.
     * This context is used for accessing application resources and services safely.
     *
     * @param application The Android Application instance
     * @return Application context with proper lifecycle scope
     */
    @Provides
    @Singleton
    fun provideApplicationContext(application: Application): Context {
        val context = application.applicationContext
        requireNotNull(context) { "Application context cannot be null" }
        return context
    }

    /**
     * Provides coroutine dispatcher for background operations with proper thread management.
     * Uses IO dispatcher for optimal performance in network and database operations.
     *
     * The dispatcher is configured for:
     * - Optimal background thread utilization
     * - Proper cancellation handling
     * - Exception propagation
     *
     * @return IO-optimized coroutine dispatcher
     */
    @Provides
    @Singleton
    fun provideCoroutineDispatcher(): CoroutineDispatcher {
        return Dispatchers.IO
    }
}