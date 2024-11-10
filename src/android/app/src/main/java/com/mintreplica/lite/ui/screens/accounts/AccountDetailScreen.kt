// External library versions:
// - androidx.compose.material3: 1.1.0
// - androidx.compose.runtime: 1.5.0
// - androidx.compose.foundation: 1.5.0
// - androidx.hilt.navigation.compose: 1.0.0

package com.mintreplica.lite.ui.screens.accounts

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import com.mintreplica.lite.R
import com.mintreplica.lite.domain.model.Account
import com.mintreplica.lite.ui.components.TransactionItem
import kotlinx.coroutines.launch

/**
 * Human Tasks:
 * 1. Configure proper Hilt dependency injection in the application module
 * 2. Ensure proper Material Design 3 theme configuration
 * 3. Add proper content descriptions for accessibility support
 * 4. Verify proper error handling and logging infrastructure
 */

/**
 * Main composable function for the account detail screen.
 * Implements Material Design 3 guidelines with offline-first capabilities.
 * 
 * Requirements addressed:
 * - Account Details View (8.1.3 Account Details View)
 * - Transaction Tracking (1.2 Scope/Core Features)
 * - Real-time Sync (1.2 Technical Implementation)
 */
@Composable
fun AccountDetailScreen(
    accountId: String,
    navController: NavController,
    viewModel: AccountsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val account = uiState.accounts.find { it.id == accountId }
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    Scaffold(
        topBar = {
            AccountDetailTopBar(
                onBackClick = { navController.navigateUp() },
                onFilterClick = { /* Implement filter functionality */ }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        if (account == null) {
            AccountNotFoundContent(
                modifier = Modifier.padding(paddingValues),
                onBackClick = { navController.navigateUp() }
            )
            return@Scaffold
        }

        SwipeRefresh(
            state = rememberSwipeRefreshState(uiState.isRefreshing),
            onRefresh = {
                scope.launch {
                    viewModel.syncAccount(accountId)
                }
            },
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                AccountHeader(
                    account = account,
                    onSyncClick = {
                        scope.launch {
                            viewModel.syncAccount(accountId)
                        }
                    },
                    isSyncing = uiState.syncingAccounts.contains(accountId)
                )

                TransactionsList(
                    transactions = account.transactions,
                    onTransactionClick = { transactionId ->
                        navController.navigate("transaction/$transactionId")
                    }
                )

                if (uiState.error != null) {
                    LaunchedEffect(uiState.error) {
                        snackbarHostState.showSnackbar(
                            message = uiState.error ?: "An error occurred",
                            duration = SnackbarDuration.Short
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AccountDetailTopBar(
    onBackClick: () -> Unit,
    onFilterClick: () -> Unit
) {
    TopAppBar(
        title = { Text("Account Details") },
        navigationIcon = {
            IconButton(onClick = onBackClick) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_arrow_back),
                    contentDescription = "Navigate back"
                )
            }
        },
        actions = {
            IconButton(onClick = onFilterClick) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_filter),
                    contentDescription = "Filter transactions"
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    )
}

/**
 * Account header composable displaying balance and sync status.
 * Implements Material Design 3 styling with sync functionality.
 */
@Composable
private fun AccountHeader(
    account: Account,
    onSyncClick: () -> Unit,
    isSyncing: Boolean
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = account.name,
                        style = MaterialTheme.typography.titleLarge
                    )
                    Text(
                        text = account.accountType,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                IconButton(
                    onClick = onSyncClick,
                    enabled = !isSyncing && account.needsSync()
                ) {
                    if (isSyncing) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(
                            painter = painterResource(
                                id = if (account.needsSync()) {
                                    R.drawable.ic_sync_needed
                                } else {
                                    R.drawable.ic_sync_complete
                                }
                            ),
                            contentDescription = if (account.needsSync()) {
                                "Sync needed"
                            } else {
                                "Synced"
                            },
                            tint = if (account.needsSync()) {
                                MaterialTheme.colorScheme.primary
                            } else {
                                MaterialTheme.colorScheme.onSurfaceVariant
                            }
                        )
                    }
                }
            }

            Text(
                text = account.formatBalance(),
                style = MaterialTheme.typography.headlineLarge,
                modifier = Modifier.padding(top = 16.dp)
            )
        }
    }
}

/**
 * Transactions list composable with Material Design 3 styling.
 * Implements transaction display with proper spacing and interactions.
 */
@Composable
private fun TransactionsList(
    transactions: List<Transaction>,
    onTransactionClick: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(vertical = 8.dp)
    ) {
        if (transactions.isEmpty()) {
            item {
                EmptyTransactionsContent()
            }
        } else {
            items(transactions) { transaction ->
                TransactionItem(
                    transaction = transaction,
                    onClick = { onTransactionClick(transaction.id) }
                )
            }
        }
    }
}

@Composable
private fun EmptyTransactionsContent() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            painter = painterResource(id = R.drawable.ic_empty_transactions),
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = "No transactions yet",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(top = 16.dp)
        )
        Text(
            text = "Transactions will appear here once they're processed",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 8.dp)
        )
    }
}

@Composable
private fun AccountNotFoundContent(
    modifier: Modifier = Modifier,
    onBackClick: () -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            painter = painterResource(id = R.drawable.ic_error),
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.error
        )
        Text(
            text = "Account not found",
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.padding(top = 16.dp)
        )
        Text(
            text = "The requested account could not be found",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 8.dp)
        )
        Button(
            onClick = onBackClick,
            modifier = Modifier.padding(top = 24.dp)
        ) {
            Text("Go Back")
        }
    }
}