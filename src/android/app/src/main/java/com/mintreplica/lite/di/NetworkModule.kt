// External library versions:
// - dagger.hilt.android: 2.44
// - retrofit2: 2.9.0
// - okhttp3: 4.9.0
// - moshi: 1.13.0

/**
 * Human Tasks:
 * 1. Configure the API base URL in build.gradle or a secure configuration file
 * 2. Set up SSL certificate pins in build configuration
 * 3. Configure ProGuard rules for API models
 * 4. Review and adjust timeout values for production environment
 * 5. Set up proper monitoring and error tracking integration
 */

package com.mintreplica.lite.di

import android.content.Context
import com.mintreplica.lite.data.api.ApiClient
import com.mintreplica.lite.data.api.ApiService
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.CertificatePinner
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.math.BigDecimal
import java.util.Date
import java.util.concurrent.TimeUnit
import javax.inject.Singleton
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager

/**
 * Dagger Hilt module providing network-related dependencies with secure communication configuration.
 *
 * Requirements addressed:
 * - RESTful Backend API Integration (1.1 System Overview/Core Components)
 * - Secure Communication (5.4 Security Architecture/Transport)
 */
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    /**
     * Provides singleton OkHttpClient instance with security configurations.
     * Implements TLS 1.3 and certificate pinning as per security requirements.
     */
    @Provides
    @Singleton
    fun provideOkHttpClient(
        @ApplicationContext context: Context,
        tokenManager: TokenManager
    ): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        // Configure certificate pinning for secure communication
        val certificatePinner = CertificatePinner.Builder()
            .add(BuildConfig.API_DOMAIN, BuildConfig.SSL_PIN_HASH_1)
            .add(BuildConfig.API_DOMAIN, BuildConfig.SSL_PIN_HASH_2)
            .build()

        // Configure TLS 1.3 as required security protocol
        val trustManagerFactory = TrustManagerFactory.getInstance(
            TrustManagerFactory.getDefaultAlgorithm()
        )
        trustManagerFactory.init(null as java.security.KeyStore?)
        val trustManagers = trustManagerFactory.trustManagers
        val sslContext = SSLContext.getInstance("TLSv1.3")
        sslContext.init(null, trustManagers, null)

        return OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenManager))
            .addInterceptor(loggingInterceptor)
            .certificatePinner(certificatePinner)
            .sslSocketFactory(
                sslContext.socketFactory,
                trustManagers[0] as X509TrustManager
            )
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .addInterceptor { chain ->
                // Check network connectivity
                if (!NetworkUtils.isNetworkAvailable(context)) {
                    throw NetworkUtils.NetworkException("No network connection available")
                }
                chain.proceed(chain.request())
            }
            .build()
    }

    /**
     * Provides singleton Retrofit instance configured with Moshi converter.
     * Sets up the base API client for RESTful communication.
     */
    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(provideMoshi()))
            .build()
    }

    /**
     * Provides singleton ApiService implementation for network calls.
     * Configures the interface for all API endpoints.
     */
    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }

    /**
     * Provides singleton Moshi instance for JSON parsing.
     * Configures custom type adapters for proper data serialization.
     */
    @Provides
    @Singleton
    fun provideMoshi(): Moshi {
        return Moshi.Builder()
            .add(KotlinJsonAdapterFactory())
            .add(Date::class.java, DateJsonAdapter())
            .add(BigDecimal::class.java, BigDecimalJsonAdapter())
            .build()
    }

    /**
     * Custom JSON adapter for Date serialization
     */
    private class DateJsonAdapter {
        @ToJson
        fun toJson(date: Date): String = date.time.toString()

        @FromJson
        fun fromJson(value: String): Date = Date(value.toLong())
    }

    /**
     * Custom JSON adapter for BigDecimal serialization
     */
    private class BigDecimalJsonAdapter {
        @ToJson
        fun toJson(value: BigDecimal): String = value.toString()

        @FromJson
        fun fromJson(value: String): BigDecimal = BigDecimal(value)
    }
}