// External library versions:
// - retrofit2: 2.9.0
// - kotlinx.coroutines: 1.6.4

/**
 * Human Tasks:
 * 1. Configure Retrofit instance with proper base URL in NetworkModule
 * 2. Set up authentication interceptor for token management
 * 3. Implement proper SSL certificate pinning for production
 * 4. Configure appropriate timeout policies for API calls
 * 5. Set up proper error handling and retry policies
 */

package com.mintreplica.lite.data.api

import com.mintreplica.lite.domain.model.Account
import com.mintreplica.lite.domain.model.Transaction
import retrofit2.Response
import retrofit2.http.*

/**
 * Retrofit service interface defining the REST API endpoints for communication with
 * Mint Replica Lite backend services.
 *
 * Requirements addressed:
 * - RESTful Backend API (1.1 System Overview/Core Components)
 * - Financial Data Integration (1.2 Scope/Core Features)
 * - Real-time Sync (1.2 Technical Implementation)
 */
interface ApiService {

    /**
     * Authenticates user with email and password credentials.
     *
     * @param request Login credentials containing email and password
     * @return HTTP response containing authentication token
     */
    @POST("/auth/login")
    @Headers("Content-Type: application/json")
    suspend fun loginUser(
        @Body request: LoginRequest
    ): Response<AuthToken>

    /**
     * Registers a new user account in the system.
     *
     * @param request User registration details
     * @return HTTP response containing authentication token for new user
     */
    @POST("/auth/register")
    @Headers("Content-Type: application/json")
    suspend fun registerUser(
        @Body request: RegisterRequest
    ): Response<AuthToken>

    /**
     * Retrieves list of user's linked financial accounts.
     *
     * @return HTTP response containing list of financial accounts
     */
    @GET("/accounts")
    @Headers("Authorization: Bearer {token}")
    suspend fun getAccounts(): Response<List<Account>>

    /**
     * Retrieves paginated list of transactions for a specific account.
     *
     * @param accountId Unique identifier of the account
     * @param page Page number for pagination
     * @param pageSize Number of items per page
     * @return HTTP response containing paginated list of transactions
     */
    @GET("/accounts/{accountId}/transactions")
    @Headers("Authorization: Bearer {token}")
    suspend fun getAccountTransactions(
        @Path("accountId") accountId: String,
        @Query("page") page: Int,
        @Query("pageSize") pageSize: Int
    ): Response<List<Transaction>>

    /**
     * Links a new financial account using Plaid integration.
     *
     * @param request Plaid link request containing public token and metadata
     * @return HTTP response containing newly linked account details
     */
    @POST("/plaid/link")
    @Headers(
        "Authorization: Bearer {token}",
        "Content-Type: application/json"
    )
    suspend fun linkPlaidAccount(
        @Body request: PlaidLinkRequest
    ): Response<Account>

    /**
     * Triggers manual synchronization of account data.
     *
     * @param accountId Unique identifier of the account to sync
     * @return HTTP response containing sync operation status
     */
    @POST("/accounts/{accountId}/sync")
    @Headers("Authorization: Bearer {token}")
    suspend fun syncAccount(
        @Path("accountId") accountId: String
    ): Response<SyncStatus>
}

/**
 * Data class for login request payload
 */
data class LoginRequest(
    val email: String,
    val password: String
)

/**
 * Data class for registration request payload
 */
data class RegisterRequest(
    val email: String,
    val password: String,
    val firstName: String,
    val lastName: String
)

/**
 * Data class for authentication token response
 */
data class AuthToken(
    val token: String,
    val expiresIn: Long,
    val refreshToken: String
)

/**
 * Data class for Plaid link request payload
 */
data class PlaidLinkRequest(
    val publicToken: String,
    val institutionId: String,
    val accountName: String,
    val metadata: Map<String, String>
)

/**
 * Data class for sync status response
 */
data class SyncStatus(
    val status: String,
    val lastSyncedAt: String,
    val message: String? = null
)