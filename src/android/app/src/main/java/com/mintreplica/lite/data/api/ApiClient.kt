// External library versions:
// - retrofit2: 2.9.0
// - okhttp3: 4.9.0
// - moshi: 1.13.0
// - kotlinx.coroutines: 1.6.4
// - dagger.hilt.android: 2.44

/**
 * Human Tasks:
 * 1. Configure base URL in NetworkModule
 * 2. Set up SSL certificate pinning configuration
 * 3. Configure ProGuard rules for API models
 * 4. Set up proper error handling and monitoring
 * 5. Configure appropriate timeout values for production
 */

package com.mintreplica.lite.data.api

import android.content.Context
import com.mintreplica.lite.utils.NetworkUtils
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import okhttp3.*
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager
import okhttp3.CertificatePinner

/**
 * Main API client implementation using Retrofit for secure network communication.
 * 
 * Requirements addressed:
 * - RESTful Backend API Integration (1.1 System Overview/Core Components)
 * - Secure Communication (5.4 Security Architecture/Transport)
 * - Real-time Sync (1.2 Technical Implementation)
 */
@Singleton
class ApiClient @Inject constructor(
    @ApplicationContext private val context: Context,
    private val tokenManager: TokenManager
) {
    private val isRefreshingToken = MutableStateFlow(false)
    lateinit var apiService: ApiService
    private lateinit var httpClient: OkHttpClient
    private lateinit var retrofit: Retrofit

    init {
        httpClient = createHttpClient()
        retrofit = createRetrofit(httpClient)
        apiService = retrofit.create(ApiService::class.java)
    }

    /**
     * Creates and configures OkHttpClient instance with security settings
     * Addresses requirement: Secure Communication (5.4 Security Architecture/Transport)
     */
    private fun createHttpClient(): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        // Configure certificate pinning
        val certificatePinner = CertificatePinner.Builder()
            .add(BuildConfig.API_DOMAIN, BuildConfig.SSL_PIN_HASH_1)
            .add(BuildConfig.API_DOMAIN, BuildConfig.SSL_PIN_HASH_2)
            .build()

        // Configure TLS 1.3
        val trustManagerFactory = TrustManagerFactory.getInstance(
            TrustManagerFactory.getDefaultAlgorithm()
        )
        trustManagerFactory.init(null as KeyStore?)
        val trustManagers = trustManagerFactory.trustManagers
        val sslContext = SSLContext.getInstance("TLSv1.3")
        sslContext.init(null, trustManagers, null)

        return OkHttpClient.Builder().apply {
            addInterceptor(AuthInterceptor(tokenManager))
            addInterceptor(loggingInterceptor)
            certificatePinner(certificatePinner)
            sslSocketFactory(sslContext.socketFactory, trustManagers[0] as X509TrustManager)
            connectTimeout(30, TimeUnit.SECONDS)
            readTimeout(30, TimeUnit.SECONDS)
            writeTimeout(30, TimeUnit.SECONDS)
            retryOnConnectionFailure(true)
            addInterceptor { chain ->
                if (!NetworkUtils.isNetworkAvailable(context)) {
                    throw NetworkUtils.NetworkException("No network connection available")
                }
                chain.proceed(chain.request())
            }
        }.build()
    }

    /**
     * Creates and configures Retrofit instance with converters
     * Addresses requirement: RESTful Backend API Integration (1.1 System Overview/Core Components)
     */
    private fun createRetrofit(client: OkHttpClient): Retrofit {
        val moshi = Moshi.Builder()
            .add(KotlinJsonAdapterFactory())
            .build()

        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
    }

    /**
     * Handles token refresh process when current token expires
     * Addresses requirement: Secure Communication (5.4 Security Architecture/Transport)
     */
    suspend fun refreshToken(): Boolean {
        if (isRefreshingToken.value) {
            return false
        }

        return try {
            isRefreshingToken.value = true
            val refreshToken = tokenManager.getRefreshToken()
                ?: throw NetworkUtils.NetworkException("No refresh token available")

            val response = NetworkUtils.executeWithRetry {
                apiService.refreshToken(RefreshTokenRequest(refreshToken))
            }

            if (response.isSuccessful) {
                response.body()?.let { token ->
                    tokenManager.saveAccessToken(token.token)
                    tokenManager.saveRefreshToken(token.refreshToken)
                    true
                } ?: false
            } else {
                tokenManager.clearTokens()
                false
            }
        } catch (e: Exception) {
            NetworkUtils.handleNetworkError(e)
            false
        } finally {
            isRefreshingToken.value = false
        }
    }
}

/**
 * Interceptor for handling authentication headers and token refresh
 * Addresses requirement: Secure Communication (5.4 Security Architecture/Transport)
 */
class AuthInterceptor(private val tokenManager: TokenManager) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        // Skip authentication for login and registration
        if (originalRequest.url.encodedPath.startsWith("/auth")) {
            return chain.proceed(originalRequest)
        }

        val accessToken = tokenManager.getAccessToken()
            ?: throw NetworkUtils.NetworkException("No access token available")

        val authenticatedRequest = originalRequest.newBuilder()
            .header("Authorization", "Bearer $accessToken")
            .build()

        val response = chain.proceed(authenticatedRequest)

        // Handle 401 Unauthorized
        if (response.code == 401) {
            response.close()
            
            // Attempt to refresh token
            val refreshed = runBlocking {
                ApiClient(context, tokenManager).refreshToken()
            }

            return if (refreshed) {
                // Retry with new token
                val newToken = tokenManager.getAccessToken()
                    ?: throw NetworkUtils.NetworkException("Token refresh failed")

                val newRequest = originalRequest.newBuilder()
                    .header("Authorization", "Bearer $newToken")
                    .build()

                chain.proceed(newRequest)
            } else {
                throw NetworkUtils.NetworkException("Authentication failed")
            }
        }

        return response
    }
}

/**
 * Handles API errors and maps them to appropriate domain exceptions
 * Addresses requirement: RESTful Backend API Integration (1.1 System Overview/Core Components)
 */
fun handleApiError(error: Throwable): Nothing {
    throw when (error) {
        is retrofit2.HttpException -> {
            when (error.code()) {
                400 -> NetworkUtils.NetworkException("Invalid request", error, 400)
                401 -> NetworkUtils.NetworkException("Unauthorized", error, 401)
                403 -> NetworkUtils.NetworkException("Forbidden", error, 403)
                404 -> NetworkUtils.NetworkException("Resource not found", error, 404)
                500 -> NetworkUtils.NetworkException("Server error", error, 500)
                else -> NetworkUtils.NetworkException("API error: ${error.message()}", error, error.code())
            }
        }
        else -> NetworkUtils.handleNetworkError(error)
    }
}

data class RefreshTokenRequest(
    val refreshToken: String
)