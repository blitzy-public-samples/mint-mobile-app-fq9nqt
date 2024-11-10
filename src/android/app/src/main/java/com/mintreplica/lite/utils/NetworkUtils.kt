package com.mintreplica.lite.utils

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import kotlinx.coroutines.delay
import kotlin.math.pow

/**
 * Human Tasks:
 * 1. Ensure the app has the required network permissions in AndroidManifest.xml:
 *    - android.permission.ACCESS_NETWORK_STATE
 *    - android.permission.INTERNET
 * 2. Configure network security config if using custom SSL certificates
 * 3. Review and adjust retry parameters based on production requirements
 */

/**
 * Custom exception class for network-related errors
 * Addresses requirement: Network Security (9.3.1 API Security)
 */
class NetworkException(
    message: String,
    cause: Throwable? = null,
    val errorCode: Int = 0,
    val errorMessage: String = message
) : Exception(message, cause)

/**
 * Enum class representing different network connection types
 */
enum class NetworkType {
    WIFI,
    CELLULAR,
    NONE
}

/**
 * Utility object providing network-related functionality
 * Addresses requirements:
 * - Real-time Data Synchronization (1.2 Technical Implementation)
 * - Offline Support (5.2.3 Service Layer Architecture)
 * - Network Security (9.3.1 API Security)
 */
object NetworkUtils {

    /**
     * Checks if network connectivity is available
     * Addresses requirement: Offline Support (5.2.3 Service Layer Architecture)
     *
     * @param context Android context
     * @return Boolean indicating if network is available
     */
    fun isNetworkAvailable(context: Context): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false

        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    /**
     * Executes a network operation with retry logic
     * Addresses requirements:
     * - Real-time Data Synchronization (1.2 Technical Implementation)
     * - Network Security (9.3.1 API Security)
     *
     * @param networkOperation Suspend function representing the network operation
     * @param maxRetries Maximum number of retry attempts
     * @param initialDelayMs Initial delay between retries in milliseconds
     * @return Result of type T from the network operation
     * @throws NetworkException if all retry attempts fail
     */
    suspend fun <T> executeWithRetry(
        networkOperation: suspend () -> T,
        maxRetries: Int = 3,
        initialDelayMs: Long = 1000
    ): T {
        var currentDelay = initialDelayMs
        var lastException: Exception? = null

        repeat(maxRetries + 1) { attempt ->
            try {
                return networkOperation()
            } catch (e: Exception) {
                lastException = e
                if (attempt == maxRetries) {
                    throw handleNetworkError(e)
                }
                // Exponential backoff with jitter
                val jitter = (Math.random() * 0.1 * currentDelay).toLong()
                delay(currentDelay + jitter)
                currentDelay = (currentDelay * 2.0.pow(attempt)).toLong()
            }
        }

        // This line should never be reached due to the throw in the catch block
        throw handleNetworkError(lastException ?: Exception("Unknown network error"))
    }

    /**
     * Determines the current network connection type
     * Addresses requirement: Offline Support (5.2.3 Service Layer Architecture)
     *
     * @param context Android context
     * @return NetworkType enum indicating the type of network connection
     */
    fun getNetworkType(context: Context): NetworkType {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return NetworkType.NONE
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return NetworkType.NONE

        return when {
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> NetworkType.WIFI
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> NetworkType.CELLULAR
            else -> NetworkType.NONE
        }
    }

    /**
     * Handles and transforms network errors into appropriate exceptions
     * Addresses requirement: Network Security (9.3.1 API Security)
     *
     * @param error The original error that occurred
     * @throws NetworkException with appropriate error details
     */
    fun handleNetworkError(error: Throwable): NetworkException {
        return when (error) {
            is NetworkException -> error
            is java.net.UnknownHostException -> NetworkException(
                "Unable to reach server. Please check your internet connection.",
                error,
                errorCode = 1001
            )
            is java.net.SocketTimeoutException -> NetworkException(
                "Connection timed out. Please try again.",
                error,
                errorCode = 1002
            )
            is javax.net.ssl.SSLException -> NetworkException(
                "Secure connection failed. Please try again.",
                error,
                errorCode = 1003
            )
            is java.io.IOException -> NetworkException(
                "Network error occurred. Please check your connection.",
                error,
                errorCode = 1004
            )
            else -> NetworkException(
                "An unexpected error occurred. Please try again.",
                error,
                errorCode = 1000
            )
        }
    }
}