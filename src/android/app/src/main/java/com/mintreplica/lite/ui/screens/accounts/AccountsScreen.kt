/*
 * Human Tasks:
 * 1. Configure Hilt dependency injection in the application module
 * 2. Verify Material3 dependency is added in app/build.gradle
 * 3. Set up proper analytics tracking for account operations
 * 4. Ensure proper accessibility testing with TalkBack service
 */

package com.mintreplica.lite.ui.screens.accounts

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import com.mintreplica.lite.R
import com.mintreplica.lite.domain.model.Account
import com.mintreplica.lite.ui.components.AccountCard
import com.mintreplica.lite.ui.navigation.Screen

/**
 * Main composable function that renders the accounts screen with pull-to-refresh and offline support.
 * 
 * Requirements addressed:
 * - Financial Account Integration (1.2): Display and manage linked financial accounts
 * - Account Overview (8.1.2): Show comprehensive account information and balances
 * - Mobile UI Design (8.1.1): Implement mobile-first interface with Material Design
 *
 * @param navController Navigation controller for handling screen transitions
 */
@Composable
fun AccountsScreen(
    navController: NavController,
    viewModel: AccountsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val swipeRefreshState = rememberSwipeRefreshState(isRefreshing = uiState.isRefreshing)

    LaunchedEffect(Unit) {
        // Initial load of accounts - replace with actual user ID
        viewModel.loadAccounts("current_user_id")
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(text = stringResource(R.string.accounts_screen_title)) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { /* Launch Plaid link flow */ },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_add_account),
                    contentDescription = stringResource(R.string.add_account_button_description)
                )
            }
        }
    ) { paddingValues ->
        SwipeRefresh(
            state = swipeRefreshState,
            onRefresh = { viewModel.refreshAccounts() },
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                uiState.isLoading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }

                uiState.error != null -> {
                    ErrorState(
                        error = uiState.error!!,
                        onRetry = { viewModel.loadAccounts("current_user_id") }
                    )
                }

                uiState.accounts.isEmpty() -> {
                    EmptyState(
                        onAddAccount = { /* Launch Plaid link flow */ }
                    )
                }

                else -> {
                    AccountsList(
                        accounts = uiState.accounts,
                        syncingAccounts = uiState.syncingAccounts,
                        onAccountClick = { accountId ->
                            navController.navigate("${Screen.Accounts.route}/$accountId")
                        },
                        onSyncAccount = { accountId ->
                            viewModel.syncAccount(accountId)
                        }
                    )
                }
            }
        }
    }
}

/**
 * Composable function that renders the scrollable list of account cards.
 * Implements efficient list rendering with LazyColumn.
 */
@Composable
private fun AccountsList(
    accounts: List<Account>,
    syncingAccounts: Set<String>,
    onAccountClick: (String) -> Unit,
    onSyncAccount: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(
            items = accounts,
            key = { account -> account.id }
        ) { account ->
            AccountCard(
                account = account,
                onClick = { onAccountClick(account.id) },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

/**
 * Composable function that displays an error state with retry option.
 */
@Composable
private fun ErrorState(
    error: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = error,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onRetry) {
            Text(text = stringResource(R.string.retry_button_label))
        }
    }
}

/**
 * Composable function that displays an empty state with add account button.
 */
@Composable
private fun EmptyState(
    onAddAccount: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            painter = painterResource(id = R.drawable.ic_empty_accounts),
            contentDescription = null,
            modifier = Modifier.size(120.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = stringResource(R.string.no_accounts_message),
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onAddAccount) {
            Text(text = stringResource(R.string.add_first_account_button_label))
        }
    }
}