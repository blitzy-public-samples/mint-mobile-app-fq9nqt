/**
 * Human Tasks:
 * 1. Verify accessibility labels and content descriptions
 * 2. Test with different screen sizes and orientations
 * 3. Validate currency formatting with different locales
 * 4. Review deletion confirmation dialog text with product team
 */

package com.mintreplica.lite.ui.screens.goals

// androidx.compose.runtime:runtime:1.5.0
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue

// androidx.compose.foundation.layout:layout:1.5.0
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll

// androidx.compose.material:material:1.5.0
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Save

// androidx.hilt.navigation.compose:hilt-navigation-compose:1.0.0
import androidx.hilt.navigation.compose.hiltViewModel

import com.mintreplica.lite.domain.model.Goal
import com.mintreplica.lite.ui.components.GoalCard
import kotlinx.coroutines.launch

/**
 * Main composable function for the goal detail screen that displays and manages a single financial goal.
 * 
 * Requirements addressed:
 * - Financial Goal Setting and Progress Monitoring (1.2 Scope/Core Features)
 * - Mobile UI Architecture (5.2.1 Mobile Applications)
 * - Goal Detail View (8.1.6 Navigation Flow/Goals)
 *
 * @param goalId ID of the goal to display
 * @param onNavigateBack Callback to handle navigation back
 */
@Composable
fun GoalDetailScreen(
    goalId: String,
    onNavigateBack: () -> Unit
) {
    val viewModel: GoalsViewModel = hiltViewModel()
    val state by viewModel.state.collectAsState()
    val coroutineScope = rememberCoroutineScope()
    val scaffoldState = rememberScaffoldState()
    
    var showDeleteDialog by remember { mutableStateOf(false) }
    var isEditing by remember { mutableStateOf(false) }
    
    val goal = state.goals.find { it.id == goalId }
    
    Scaffold(
        scaffoldState = scaffoldState,
        topBar = {
            TopAppBar(
                title = { Text(text = if (isEditing) "Edit Goal" else "Goal Details") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Navigate back"
                        )
                    }
                },
                actions = {
                    if (!isEditing) {
                        IconButton(onClick = { isEditing = true }) {
                            Icon(
                                imageVector = Icons.Default.Edit,
                                contentDescription = "Edit goal"
                            )
                        }
                        IconButton(onClick = { showDeleteDialog = true }) {
                            Icon(
                                imageVector = Icons.Default.Delete,
                                contentDescription = "Delete goal"
                            )
                        }
                    }
                }
            )
        }
    ) { padding ->
        if (state.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = androidx.compose.ui.Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (goal == null) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = androidx.compose.ui.Alignment.Center
            ) {
                Text("Goal not found")
            }
        } else {
            if (isEditing) {
                GoalDetailEditContent(
                    goal = goal,
                    onSave = { updatedGoal ->
                        coroutineScope.launch {
                            val success = viewModel.updateGoal(updatedGoal)
                            if (success) {
                                isEditing = false
                            } else {
                                scaffoldState.snackbarHostState.showSnackbar(
                                    "Failed to update goal"
                                )
                            }
                        }
                    },
                    onCancel = { isEditing = false },
                    modifier = Modifier.padding(padding)
                )
            } else {
                GoalDetailContent(
                    goal = goal,
                    onDelete = {
                        coroutineScope.launch {
                            val success = viewModel.deleteGoal(goal)
                            if (success) {
                                onNavigateBack()
                            } else {
                                scaffoldState.snackbarHostState.showSnackbar(
                                    "Failed to delete goal"
                                )
                            }
                        }
                    },
                    modifier = Modifier.padding(padding)
                )
            }
        }
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Goal") },
            text = { Text("Are you sure you want to delete this goal? This action cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteDialog = false
                        goal?.let { coroutineScope.launch { viewModel.deleteGoal(it) } }
                        onNavigateBack()
                    }
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

/**
 * Composable function for displaying goal details in view mode.
 *
 * @param goal Goal to display
 * @param onDelete Callback for goal deletion
 * @param modifier Modifier for the content
 */
@Composable
private fun GoalDetailContent(
    goal: Goal,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        GoalCard(
            goal = goal,
            onClick = {}
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Text(
            text = "Description",
            style = MaterialTheme.typography.h6
        )
        Text(
            text = goal.description,
            style = MaterialTheme.typography.body1,
            modifier = Modifier.padding(top = 8.dp)
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Text(
            text = "Target Date",
            style = MaterialTheme.typography.h6
        )
        Text(
            text = goal.getFormattedTargetDate(),
            style = MaterialTheme.typography.body1,
            modifier = Modifier.padding(top = 8.dp)
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Text(
            text = "Progress Details",
            style = MaterialTheme.typography.h6
        )
        Column(
            modifier = Modifier.padding(top = 8.dp)
        ) {
            ProgressDetail(
                label = "Current Amount",
                value = goal.getFormattedCurrentAmount()
            )
            ProgressDetail(
                label = "Target Amount",
                value = goal.getFormattedTargetAmount()
            )
            ProgressDetail(
                label = "Remaining Amount",
                value = goal.getRemainingAmount().toString()
            )
            ProgressDetail(
                label = "Days Remaining",
                value = "${goal.getRemainingDays()} days"
            )
            ProgressDetail(
                label = "Progress",
                value = "${goal.getProgress().toInt()}%"
            )
        }
    }
}

/**
 * Composable function for displaying goal details in edit mode.
 *
 * @param goal Goal to edit
 * @param onSave Callback for saving changes
 * @param onCancel Callback for canceling edit
 * @param modifier Modifier for the content
 */
@Composable
private fun GoalDetailEditContent(
    goal: Goal,
    onSave: (Goal) -> Unit,
    onCancel: () -> Unit,
    modifier: Modifier = Modifier
) {
    var name by remember { mutableStateOf(goal.name) }
    var description by remember { mutableStateOf(goal.description) }
    var targetAmount by remember { mutableStateOf(goal.targetAmount.toString()) }
    var currentAmount by remember { mutableStateOf(goal.currentAmount.toString()) }
    
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Goal Name") },
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        OutlinedTextField(
            value = description,
            onValueChange = { description = it },
            label = { Text("Description") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        OutlinedTextField(
            value = targetAmount,
            onValueChange = { targetAmount = it },
            label = { Text("Target Amount") },
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = androidx.compose.ui.text.input.KeyboardOptions(
                keyboardType = androidx.compose.ui.text.input.KeyboardType.Number
            )
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        OutlinedTextField(
            value = currentAmount,
            onValueChange = { currentAmount = it },
            label = { Text("Current Amount") },
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = androidx.compose.ui.text.input.KeyboardOptions(
                keyboardType = androidx.compose.ui.text.input.KeyboardType.Number
            )
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            OutlinedButton(
                onClick = onCancel,
                modifier = Modifier.weight(1f)
            ) {
                Text("Cancel")
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Button(
                onClick = {
                    // Create updated goal with new values
                    val updatedGoal = goal.copy(
                        name = name,
                        description = description,
                        targetAmount = targetAmount.toBigDecimalOrNull() ?: goal.targetAmount,
                        currentAmount = currentAmount.toBigDecimalOrNull() ?: goal.currentAmount
                    )
                    onSave(updatedGoal)
                },
                modifier = Modifier.weight(1f)
            ) {
                Text("Save")
            }
        }
    }
}

/**
 * Helper composable for displaying a progress detail item.
 *
 * @param label Label text
 * @param value Value text
 */
@Composable
private fun ProgressDetail(
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.body1,
            color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.body1
        )
    }
}