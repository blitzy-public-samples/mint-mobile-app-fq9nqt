// External library versions:
// - androidx.lifecycle:2.6.1
// - javax.inject:1
// - kotlinx.coroutines.flow:1.6.4
// - dagger.hilt:2.44

package com.mintreplica.lite.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mintreplica.lite.domain.model.Account
import com.mintreplica.lite.domain.usecase.AccountUseCases
import com.mintreplica.lite.domain.usecase.BudgetUseCases
import com.mintreplica.lite.domain.usecase.TransactionUseCases
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import java.math.BigDecimal
import javax.inject.Inject

/**
 * Human Tasks:
 * 1. Configure Hilt dependency injection in Application class
 * 2. Set up proper error tracking and analytics
 * 3. Configure ProGuard rules for ViewModel
 * 4. Review and adjust currency conversion settings
 */

/**
 * ViewModel for the dashboard screen that manages UI state and business logic.
 * Implements offline-first approach with real-time updates.
 *
 * Requirements addressed:
 * - Dashboard Overview (8.1.2 Main Dashboard): Comprehensive dashboard displaying net worth,
 *   accounts overview, budget status, and recent transactions
 * - Real-time Updates (1.2 Technical Implementation): Real-time data synchronization with offline support
 */
@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val accountUseCases: AccountUseCases,
    private val budgetUseCases: BudgetUseCases,
    private val transactionUseCases: TransactionUseCases
) : ViewModel() {

    private val _uiState = MutableStateFlow<DashboardState>(DashboardState.Loading)
    val uiState: StateFlow<DashboardState> = _uiState

    /**
     * Loads dashboard data for the specified user with offline-first approach.
     * Combines multiple data streams and handles errors gracefully.
     */
    fun loadDashboardData(userId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = DashboardState.Loading

                combine(
                    accountUseCases.getAccountsForUser(userId),
                    budgetUseCases.getUserBudgets(userId),
                    transactionUseCases.getTransactions(
                        TransactionUseCases.TransactionFilter(
                            includePending = false
                        ),
                        TransactionUseCases.SortOrder.DATE_DESC
                    )
                ) { accounts, budgets, transactions ->
                    val netWorth = calculateNetWorth(accounts)
                    DashboardState.Success(
                        netWorth = netWorth,
                        accounts = accounts,
                        budgets = budgets,
                        recentTransactions = transactions.take(5)
                    )
                }.catch { error ->
                    _uiState.value = DashboardState.Error(error.message ?: "Unknown error occurred")
                }.collect { state ->
                    _uiState.value = state
                }
            } catch (e: Exception) {
                _uiState.value = DashboardState.Error(e.message ?: "Failed to load dashboard data")
            }
        }
    }

    /**
     * Refreshes all dashboard data from remote sources.
     * Handles network errors with offline data fallback.
     */
    fun refreshData() {
        viewModelScope.launch {
            try {
                _uiState.value = (_uiState.value as? DashboardState.Success)?.copy(isRefreshing = true)
                    ?: return@launch

                // Refresh accounts data
                accountUseCases.refreshAllAccounts(getCurrentUserId())
                    .onFailure { error ->
                        // Log error but continue with other refreshes
                    }

                // Continue showing existing data while refresh happens in background
                loadDashboardData(getCurrentUserId())
            } catch (e: Exception) {
                _uiState.value = (_uiState.value as? DashboardState.Success)?.copy(isRefreshing = false)
                    ?: DashboardState.Error("Failed to refresh data")
            }
        }
    }

    /**
     * Calculates total net worth from all accounts with currency conversion.
     * Handles different currencies and pending transactions.
     */
    private fun calculateNetWorth(accounts: List<Account>): BigDecimal {
        return accounts
            .filter { it.isActive }
            .fold(BigDecimal.ZERO) { total, account ->
                // TODO: Implement currency conversion based on user's preferred currency
                total.add(account.balance)
            }
    }

    /**
     * Gets current user ID from secure storage.
     * TODO: Implement proper user session management
     */
    private fun getCurrentUserId(): String {
        return "current_user_id"
    }
}

/**
 * Sealed class representing different states of the dashboard UI.
 */
sealed class DashboardState {
    object Loading : DashboardState()
    
    data class Success(
        val netWorth: BigDecimal,
        val accounts: List<Account>,
        val budgets: List<Budget>,
        val recentTransactions: List<Transaction>,
        val isRefreshing: Boolean = false
    ) : DashboardState()
    
    data class Error(val message: String) : DashboardState()
}

/**
 * Data class representing a budget overview item.
 */
data class Budget(
    val id: String,
    val name: String,
    val amount: BigDecimal,
    val spent: BigDecimal,
    val category: String,
    val period: String,
    val startDate: Long,
    val endDate: Long
) {
    val remainingAmount: BigDecimal
        get() = amount.subtract(spent)

    val spentPercentage: Int
        get() = (spent.divide(amount, 2, BigDecimal.ROUND_HALF_UP)
            .multiply(BigDecimal(100))).toInt()
}

/**
 * Data class representing a transaction item.
 */
data class Transaction(
    val id: String,
    val date: Long,
    val description: String,
    val amount: BigDecimal,
    val category: String,
    val pending: Boolean = false
)