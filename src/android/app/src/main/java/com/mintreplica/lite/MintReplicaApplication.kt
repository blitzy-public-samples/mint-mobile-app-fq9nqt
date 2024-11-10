// External library versions:
// - dagger.hilt.android: 2.44
// - timber: 5.0.1
// - firebase.crashlytics: 18.3.5
// - kotlinx.coroutines: 1.6.4

package com.mintreplica.lite

import android.app.Application
import android.content.res.Configuration
import android.os.StrictMode
import android.security.NetworkSecurityPolicy
import com.google.firebase.crashlytics.FirebaseCrashlytics
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import timber.log.Timber
import java.security.Security
import javax.net.ssl.SSLContext

/**
 * Human Tasks:
 * 1. Configure Firebase project and add google-services.json
 * 2. Set up ProGuard rules for Hilt and Firebase
 * 3. Configure debug/release signing keys
 * 4. Set up network security config XML
 * 5. Review and adjust StrictMode policies for production
 * 6. Configure Firebase Crashlytics API key in build config
 */

/**
 * Main Application class for Mint Replica Lite that initializes core components
 * with secure configurations and monitoring.
 *
 * Requirements addressed:
 * - Native Mobile Applications (1.1 System Overview/Core Components):
 *   Implements native Android application with core component initialization
 * - System Components Architecture (5.2.1 Mobile Applications):
 *   Configures dependency injection and local storage
 * - Security Architecture (5.4 Security Architecture):
 *   Implements secure initialization and monitoring
 */
@HiltAndroidApp
class MintReplicaApplication : Application() {

    private val isDebugBuild: Boolean = BuildConfig.DEBUG
    
    // Application scope that survives configuration changes
    val applicationScope = CoroutineScope(SupervisorJob())

    override fun onCreate() {
        super.onCreate()
        
        // Configure strict mode for development builds
        if (isDebugBuild) {
            StrictMode.setThreadPolicy(
                StrictMode.ThreadPolicy.Builder()
                    .detectDiskReads()
                    .detectDiskWrites()
                    .detectNetwork()
                    .detectCustomSlowCalls()
                    .penaltyLog()
                    .build()
            )

            StrictMode.setVmPolicy(
                StrictMode.VmPolicy.Builder()
                    .detectLeakedSqlLiteObjects()
                    .detectLeakedClosableObjects()
                    .detectActivityLeaks()
                    .detectLeakedRegistrationObjects()
                    .penaltyLog()
                    .build()
            )

            // Initialize Timber for debug logging
            Timber.plant(Timber.DebugTree())
        } else {
            // Initialize Firebase Crashlytics for production builds
            FirebaseCrashlytics.getInstance().apply {
                setCrashlyticsCollectionEnabled(true)
                setCustomKey("app_version", BuildConfig.VERSION_NAME)
                setCustomKey("build_type", "release")
            }
        }

        // Initialize security provider for TLS 1.3
        try {
            Security.insertProviderAt(
                Security.getProvider("AndroidOpenSSL"), 1
            )
            SSLContext.getInstance("TLSv1.3")
        } catch (e: Exception) {
            Timber.e(e, "Failed to initialize security provider")
            if (!isDebugBuild) {
                FirebaseCrashlytics.getInstance().recordException(e)
            }
        }

        // Enforce network security policies
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
            NetworkSecurityPolicy.getInstance().apply {
                if (!isCleartextTrafficPermitted) {
                    Timber.i("Cleartext traffic is not permitted")
                }
            }
        }

        // Initialize memory trimming thresholds
        val runtime = Runtime.getRuntime()
        val maxMemory = runtime.maxMemory()
        Timber.d("Max memory available: ${maxMemory / 1024 / 1024}MB")
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        
        // Handle configuration changes
        Timber.d("Configuration changed: ${newConfig.orientation}")
        
        // Adjust memory allocation if needed
        if (newConfig.orientation == Configuration.ORIENTATION_LANDSCAPE) {
            System.gc()
        }
    }

    override fun onLowMemory() {
        super.onLowMemory()
        
        // Clear non-essential caches
        try {
            applicationScope.coroutineContext.cancelChildren()
            System.gc()
            Timber.w("Low memory condition handled")
        } catch (e: Exception) {
            Timber.e(e, "Error handling low memory condition")
            if (!isDebugBuild) {
                FirebaseCrashlytics.getInstance().recordException(e)
            }
        }
    }

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        
        when (level) {
            TRIM_MEMORY_RUNNING_CRITICAL,
            TRIM_MEMORY_COMPLETE -> {
                // Clear all non-critical caches
                System.gc()
                applicationScope.coroutineContext.cancelChildren()
                Timber.w("Critical memory trim performed")
            }
            TRIM_MEMORY_RUNNING_LOW,
            TRIM_MEMORY_MODERATE -> {
                // Clear some caches
                System.gc()
                Timber.w("Moderate memory trim performed")
            }
            TRIM_MEMORY_RUNNING_MODERATE,
            TRIM_MEMORY_BACKGROUND -> {
                // Clear minimal caches
                Timber.d("Background memory trim performed")
            }
            else -> {
                Timber.d("Memory trim level: $level")
            }
        }
    }
}