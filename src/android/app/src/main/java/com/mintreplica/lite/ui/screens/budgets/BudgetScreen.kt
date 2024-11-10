// External library versions:
// androidx.compose.runtime:1.5.0
// androidx.compose.material:1.5.0
// androidx.compose.foundation:1.5.0
// androidx.hilt.navigation.compose:1.0.0

package com.mintreplica.lite.ui.screens.budgets

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.mintreplica.lite.domain.model.Budget
import com.mintreplica.lite.ui.components.BudgetProgressBar
import java.text.NumberFormat

/**
 * Human Tasks:
 * 1. Configure proper error tracking/analytics integration
 * 2. Set up crash reporting for error states
 * 3. Review and adjust error messages for production
 * 4. Verify accessibility features with TalkBack
 * 5. Test pull-to-refresh functionality on all target devices
 */

/**
 * Main budget management screen that displays a list of budgets with their progress
 * and provides budget creation/editing functionality.
 * 
 * Requirements addressed:
 * - Budget Management (1.2): Budget creation and monitoring with support for different time periods
 * - Budget Status Visualization (8.1.2): Visual representation of budget progress with color-coding
 * - Budget Creation/Edit Interface (8.1.4): Comprehensive budget management interface
 *
 * @param navController Navigation controller for screen transitions
 */
@Composable
fun BudgetScreen(
    navController: NavController,
    viewModel: BudgetViewModel = hiltViewModel()
) {
    val budgets by viewModel.budgets.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    
    val pullRefreshState = rememberPullRefreshState(
        refreshing = isLoading,
        onRefresh = { viewModel.loadBudgets("current_user_id") } // Replace with actual user ID
    )
    
    val scaffoldState = rememberScaffoldState()
    
    LaunchedEffect(Unit) {
        viewModel.loadBudgets("current_user_id") // Replace with actual user ID
    }

    Scaffold(
        scaffoldState = scaffoldState,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { navController.navigate("budget/create") },
                modifier = Modifier.semantics { 
                    contentDescription = "Create new budget"
                }
            ) {
                Icon(Icons.Filled.Add, contentDescription = "Add budget")
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .pullRefresh(pullRefreshState)
        ) {
            when {
                error != null -> {
                    ErrorMessage(error = error!!)
                }
                budgets.isEmpty() && !isLoading -> {
                    EmptyBudgetState()
                }
                else -> {
                    BudgetList(
                        budgets = budgets,
                        onBudgetClick = { budgetId ->
                            navController.navigate("budget/detail/$budgetId")
                        }
                    )
                }
            }
            
            PullRefreshIndicator(
                refreshing = isLoading,
                state = pullRefreshState,
                modifier = Modifier.align(Alignment.TopCenter)
            )
        }
    }
}

/**
 * Displays a scrollable list of budget items with progress indicators.
 *
 * @param budgets List of budgets to display
 * @param onBudgetClick Callback for budget item click events
 */
@Composable
private fun BudgetList(
    budgets: List<Budget>,
    onBudgetClick: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(
            items = budgets,
            key = { it.id }
        ) { budget ->
            BudgetItem(
                budget = budget,
                onClick = { onBudgetClick(budget.id) }
            )
        }
    }
}

/**
 * Displays a single budget item with progress visualization.
 *
 * @param budget Budget to display
 * @param onClick Callback for item click events
 */
@Composable
private fun BudgetItem(
    budget: Budget,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .semantics {
                contentDescription = 
                    "${budget.name} budget, ${budget.getSpentPercentage()}% spent"
            },
        elevation = 4.dp
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = budget.name,
                    style = MaterialTheme.typography.h6,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = budget.category,
                    style = MaterialTheme.typography.body2,
                    color = MaterialTheme.colors.secondary
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            BudgetProgressBar(
                progress = budget.getSpentPercentage().toFloat() / 100f,
                label = budget.name,
                spent = budget.spent,
                total = budget.amount
            )
        }
    }
}

/**
 * Displays an error message when budget loading fails.
 *
 * @param error Error message to display
 */
@Composable
private fun ErrorMessage(error: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Filled.Error,
            contentDescription = "Error",
            tint = MaterialTheme.colors.error,
            modifier = Modifier.size(48.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = error,
            style = MaterialTheme.typography.body1,
            color = MaterialTheme.colors.error
        )
    }
}

/**
 * Displays a message when no budgets are available.
 */
@Composable
private fun EmptyBudgetState() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "No budgets found",
            style = MaterialTheme.typography.h6
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Create a budget to start tracking your spending",
            style = MaterialTheme.typography.body1,
            color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f)
        )
    }
}