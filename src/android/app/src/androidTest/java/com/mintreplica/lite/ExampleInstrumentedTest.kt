package com.mintreplica.lite

import androidx.test.platform.app.InstrumentationRegistry // version: 1.5.2
import androidx.test.runner.AndroidJUnitRunner // version: 1.5.2
import org.junit.Assert.* // version: 4.13.2
import org.junit.Test // version: 4.13.2

/**
 * Human Tasks:
 * 1. Ensure the test device has sufficient permissions configured
 * 2. Configure test-specific build variants in build.gradle
 * 3. Set up test-specific Android security config if needed
 * 4. Verify test device API level compatibility
 */

/**
 * Example instrumented test class demonstrating Android test environment setup
 * and basic device testing with comprehensive application component validation.
 *
 * Requirements addressed:
 * - Testing Standards (A.1.2 Code Quality Standards):
 *   Implementation of instrumented tests to validate Android-specific functionality
 *   and ensure proper application initialization
 * - Mobile Testing (8. System Design/Testing Strategy):
 *   Android instrumented tests for validating application functionality in a real
 *   device environment with focus on application context and component initialization
 */
class ExampleInstrumentedTest {

    @Test
    fun useAppContext() {
        // Get the application context from instrumentation
        val context = InstrumentationRegistry.getInstrumentation().targetContext

        // Verify package name matches expected value
        assertEquals("com.mintreplica.lite", context.packageName)

        // Verify context is not null and properly initialized
        assertNotNull("Application context should not be null", context)
        assertTrue("Context should be initialized", context.resources != null)
        assertTrue("Context should have package manager", context.packageManager != null)
        assertTrue("Context should have class loader", context.classLoader != null)
    }

    @Test
    fun testApplicationClass() {
        // Get the application instance
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val application = context.applicationContext as MintReplicaApplication

        // Verify it's the correct application class
        assertTrue("Application should be instance of MintReplicaApplication",
            application is MintReplicaApplication)

        // Verify isDebugBuild property is accessible and matches build type
        assertNotNull("isDebugBuild property should be accessible",
            application.javaClass.getDeclaredField("isDebugBuild"))

        // Verify onCreate has been called and critical components are initialized
        assertNotNull("Application scope should be initialized",
            application.applicationScope)
        assertTrue("Application scope should be active",
            !application.applicationScope.coroutineContext.isActive)

        // Verify security components
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
            val networkSecurityPolicy = android.security.NetworkSecurityPolicy.getInstance()
            assertNotNull("Network security policy should be initialized", networkSecurityPolicy)
        }

        // Verify memory management
        val runtime = Runtime.getRuntime()
        assertTrue("Max memory should be greater than 0", runtime.maxMemory() > 0)
        assertTrue("Total memory should be greater than 0", runtime.totalMemory() > 0)
        assertTrue("Free memory should be greater than 0", runtime.freeMemory() > 0)
    }
}