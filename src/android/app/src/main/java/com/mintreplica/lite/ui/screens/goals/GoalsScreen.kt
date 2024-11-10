/*
 * Human Tasks:
 * 1. Configure analytics tracking for goal-related user actions
 * 2. Verify accessibility labels with screen reader testing
 * 3. Review error message strings in strings.xml
 * 4. Test pull-to-refresh gesture sensitivity
 */

package com.mintreplica.lite.ui.screens.goals

// androidx.compose.runtime:runtime:1.5.0
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember

// androidx.compose.foundation.layout:layout:1.5.0
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items

// androidx.compose.material:material:1.5.0
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.FloatingActionButton
import androidx.compose.material.Icon
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Scaffold
import androidx.compose.material.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState

// androidx.compose.ui:ui:1.5.0
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

// androidx.hilt.navigation.compose:hilt-navigation-compose:1.0.0
import androidx.hilt.navigation.compose.hiltViewModel

// androidx.navigation.compose:navigation-compose:2.7.0
import androidx.navigation.NavController

import com.mintreplica.lite.ui.components.GoalCard
import com.mintreplica.lite.domain.model.Goal

/**
 * Main composable function for the goals screen that displays a list of financial goals
 * with progress tracking and management options.
 *
 * Requirements addressed:
 * - Financial Goal Setting and Progress Monitoring (1.2 Scope/Core Features)
 * - Mobile UI Implementation (5.2.1 Mobile Applications)
 * - Goal Progress Display (8.1.2 Main Dashboard/Goals Progress)
 *
 * @param navController Navigation controller for handling screen navigation
 * @param viewModel ViewModel instance for managing UI state and business logic
 */
@Composable
fun GoalsScreen(
    navController: NavController,
    viewModel: GoalsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val pullRefreshState = rememberPullRefreshState(
        refreshing = state.isLoading,
        onRefresh = { viewModel.loadGoals("current_user_id") } // TODO: Get from auth
    )

    // Initial load of goals
    LaunchedEffect(Unit) {
        viewModel.loadGoals("current_user_id") // TODO: Get from auth
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { navController.navigate("create_goal") },
                modifier = Modifier.semantics {
                    contentDescription = "Create new financial goal"
                }
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Add"
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .pullRefresh(pullRefreshState)
        ) {
            when {
                state.isLoading && state.goals.isEmpty() -> {
                    CircularProgressIndicator(
                        modifier = Modifier
                            .align(Alignment.Center)
                            .semantics { contentDescription = "Loading goals" }
                    )
                }
                state.error != null -> {
                    GoalsErrorState(
                        error = state.error!!,
                        onRetry = { viewModel.loadGoals("current_user_id") }
                    )
                }
                state.goals.isEmpty() -> {
                    GoalsEmptyState()
                }
                else -> {
                    LazyColumn(
                        contentPadding = PaddingValues(vertical = 16.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(
                            items = state.goals,
                            key = { goal -> goal.id }
                        ) { goal ->
                            GoalCard(
                                goal = goal,
                                onClick = {
                                    navController.navigate("goal_details/${goal.id}")
                                }
                            )
                        }
                    }
                }
            }

            PullRefreshIndicator(
                refreshing = state.isLoading,
                state = pullRefreshState,
                modifier = Modifier.align(Alignment.TopCenter)
            )
        }
    }
}

/**
 * Composable function that displays a message when no goals are available.
 *
 * Requirements addressed:
 * - Mobile UI Implementation (5.2.1 Mobile Applications)
 */
@Composable
private fun GoalsEmptyState() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .semantics { contentDescription = "No goals found" }
    ) {
        Text(
            text = "No financial goals yet. Create your first goal to start tracking your progress!",
            style = MaterialTheme.typography.body1,
            modifier = Modifier.align(Alignment.Center)
        )
    }
}

/**
 * Composable function that displays error state with retry option.
 *
 * Requirements addressed:
 * - Mobile UI Implementation (5.2.1 Mobile Applications)
 *
 * @param error Error message to display
 * @param onRetry Callback function to retry loading goals
 */
@Composable
private fun GoalsErrorState(
    error: String,
    onRetry: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .semantics { contentDescription = "Error loading goals" }
    ) {
        Text(
            text = error,
            style = MaterialTheme.typography.body1,
            color = MaterialTheme.colors.error,
            modifier = Modifier.align(Alignment.Center)
        )
    }
}