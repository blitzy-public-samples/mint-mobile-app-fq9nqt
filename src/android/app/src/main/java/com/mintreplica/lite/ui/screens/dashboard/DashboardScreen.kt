/*
 * Human Tasks:
 * 1. Verify Material Design 3 theme configuration in app theme
 * 2. Test with TalkBack screen reader for proper accessibility
 * 3. Validate color contrast ratios meet WCAG 2.1 AA standards
 * 4. Configure proper ProGuard rules for Compose
 */

package com.mintreplica.lite.ui.screens.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import com.mintreplica.lite.R
import com.mintreplica.lite.ui.components.AccountCard
import com.mintreplica.lite.ui.components.BudgetProgressBar
import com.mintreplica.lite.ui.components.TransactionItem
import com.mintreplica.lite.utils.CurrencyFormatter
import java.math.BigDecimal

/**
 * Main dashboard screen composable that displays a comprehensive financial overview.
 * 
 * Requirements addressed:
 * - Dashboard Overview (8.1.2): Comprehensive dashboard with net worth, accounts, budgets, and transactions
 * - Mobile UI Design (8.1.7): Responsive layout with proper touch targets
 * - Accessibility Support (8.1.8): Screen reader support and semantic properties
 *
 * @param navController Navigation controller for handling screen navigation
 */
@Composable
fun DashboardScreen(
    navController: NavController,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val swipeRefreshState = rememberSwipeRefreshState(
        isRefreshing = (uiState as? DashboardState.Success)?.isRefreshing == true
    )

    SwipeRefresh(
        state = swipeRefreshState,
        onRefresh = { viewModel.refreshData() }
    ) {
        when (val currentState = uiState) {
            is DashboardState.Loading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            
            is DashboardState.Success -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(vertical = 16.dp)
                ) {
                    // Net Worth Section
                    item {
                        NetWorthSection(
                            netWorth = currentState.netWorth,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                    }

                    // Accounts Section
                    item {
                        AccountsSection(
                            accounts = currentState.accounts,
                            onAccountClick = { accountId ->
                                navController.navigate("account_details/$accountId")
                            }
                        )
                    }

                    // Budgets Section
                    item {
                        BudgetSection(
                            budgets = currentState.budgets,
                            onBudgetClick = { budgetId ->
                                navController.navigate("budget_details/$budgetId")
                            }
                        )
                    }

                    // Transactions Section
                    item {
                        TransactionsSection(
                            transactions = currentState.recentTransactions,
                            onTransactionClick = { transactionId ->
                                navController.navigate("transaction_details/$transactionId")
                            },
                            onSeeAllClick = {
                                navController.navigate("transactions")
                            }
                        )
                    }
                }
            }
            
            is DashboardState.Error -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = currentState.message,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.error
                    )
                    Button(
                        onClick = { viewModel.refreshData() },
                        modifier = Modifier.padding(top = 16.dp)
                    ) {
                        Text("Retry")
                    }
                }
            }
        }
    }
}

@Composable
private fun NetWorthSection(
    netWorth: BigDecimal,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .semantics { heading() }
            .padding(bottom = 24.dp)
    ) {
        Text(
            text = stringResource(R.string.net_worth),
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
        )
        Text(
            text = CurrencyFormatter.formatAmount(netWorth),
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.semantics {
                contentDescription = "Net worth: ${CurrencyFormatter.formatAmount(netWorth)}"
            }
        )
    }
}

@Composable
private fun AccountsSection(
    accounts: List<Account>,
    onAccountClick: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 24.dp)
    ) {
        Text(
            text = stringResource(R.string.accounts),
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier
                .padding(horizontal = 16.dp)
                .semantics { heading() }
        )
        Spacer(modifier = Modifier.height(16.dp))
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(accounts) { account ->
                AccountCard(
                    account = account,
                    onClick = { onAccountClick(account.id) },
                    modifier = Modifier.width(280.dp)
                )
            }
        }
    }
}

@Composable
private fun BudgetSection(
    budgets: List<Budget>,
    onBudgetClick: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 24.dp)
    ) {
        Text(
            text = stringResource(R.string.budgets),
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier
                .padding(horizontal = 16.dp)
                .semantics { heading() }
        )
        Spacer(modifier = Modifier.height(16.dp))
        budgets.forEach { budget ->
            BudgetProgressBar(
                progress = budget.spentPercentage / 100f,
                label = budget.name,
                spent = budget.spent.toDouble(),
                total = budget.amount.toDouble(),
                showAmount = true
            )
        }
    }
}

@Composable
private fun TransactionsSection(
    transactions: List<Transaction>,
    onTransactionClick: (String) -> Unit,
    onSeeAllClick: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = stringResource(R.string.recent_transactions),
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.semantics { heading() }
            )
            TextButton(onClick = onSeeAllClick) {
                Text(stringResource(R.string.see_all))
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        transactions.forEach { transaction ->
            TransactionItem(
                transaction = transaction,
                onClick = { onTransactionClick(transaction.id) }
            )
        }
    }
}