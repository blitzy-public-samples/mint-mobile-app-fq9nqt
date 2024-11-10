/*
 * Human Tasks:
 * 1. Verify accessibility features with TalkBack screen reader
 * 2. Test color contrast ratios for WCAG compliance
 * 3. Validate dialog interactions on different Android versions
 * 4. Review and adjust error message strings for production
 */

package com.mintreplica.lite.ui.screens.budgets

import androidx.compose.foundation.layout.* // version: 1.5.0
import androidx.compose.material.* // version: 1.5.0
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.runtime.* // version: 1.5.0
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel // version: 2.6.1
import androidx.navigation.NavController
import com.mintreplica.lite.domain.model.Budget
import com.mintreplica.lite.ui.components.BudgetProgressBar
import java.text.NumberFormat
import kotlinx.coroutines.launch

/**
 * Main composable function that displays detailed budget information and management actions.
 * 
 * Requirements addressed:
 * - Budget Management (1.2 Scope/Core Features): Comprehensive budget tracking capabilities
 * - Budget Status Visualization (8.1.4): Detailed budget information with progress visualization
 *
 * @param navController Navigation controller for screen transitions
 * @param budgetId ID of the budget to display
 */
@Composable
fun BudgetDetailScreen(
    navController: NavController,
    budgetId: String
) {
    val viewModel: BudgetViewModel = viewModel()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    
    // Collect states
    val budget by viewModel.selectedBudget.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    
    // Dialog state
    var showDeleteDialog by remember { mutableStateOf(false) }
    
    // Load budget details on first composition
    LaunchedEffect(budgetId) {
        viewModel.selectBudget(budgetId)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Budget Details") },
                navigationIcon = {
                    IconButton(onClick = { navController.navigateUp() }) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when {
                isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier
                            .size(50.dp)
                            .align(Alignment.Center)
                    )
                }
                error != null -> {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = error ?: "Unknown error occurred",
                            color = MaterialTheme.colors.error
                        )
                        Button(
                            onClick = { viewModel.selectBudget(budgetId) },
                            modifier = Modifier.padding(top = 8.dp)
                        ) {
                            Text("Retry")
                        }
                    }
                }
                budget != null -> {
                    BudgetDetails(
                        budget = budget!!,
                        onEdit = { navController.navigate("budget/edit/${budget!!.id}") },
                        onDelete = { showDeleteDialog = true }
                    )
                }
            }
        }
    }
    
    // Delete confirmation dialog
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Budget") },
            text = { Text("Are you sure you want to delete this budget? This action cannot be undone.") },
            confirmButton = {
                Button(
                    onClick = {
                        scope.launch {
                            budget?.let { viewModel.deleteBudget(it) }
                            showDeleteDialog = false
                            navController.navigateUp()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(backgroundColor = MaterialTheme.colors.error)
                ) {
                    Text("Delete", color = Color.White)
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
 * Composable function that displays detailed budget amount information.
 *
 * @param budget Budget object containing the details to display
 */
@Composable
private fun BudgetAmountSection(budget: Budget) {
    val currencyFormatter = NumberFormat.getCurrencyInstance()
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        elevation = 4.dp
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .semantics { 
                    contentDescription = "Budget amount details: " +
                        "Total ${currencyFormatter.format(budget.amount)}, " +
                        "Spent ${currencyFormatter.format(budget.spent)}, " +
                        "Remaining ${currencyFormatter.format(budget.getRemainingAmount())}"
                }
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Total Budget",
                    fontSize = 16.sp,
                    color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f)
                )
                Text(
                    text = currencyFormatter.format(budget.amount),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Spent",
                    fontSize = 16.sp,
                    color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f)
                )
                Text(
                    text = currencyFormatter.format(budget.spent),
                    fontSize = 18.sp,
                    color = if (budget.isOverBudget()) MaterialTheme.colors.error else Color.Unspecified
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Remaining",
                    fontSize = 16.sp,
                    color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f)
                )
                Text(
                    text = currencyFormatter.format(budget.getRemainingAmount()),
                    fontSize = 18.sp,
                    color = if (budget.isOverBudget()) MaterialTheme.colors.error else MaterialTheme.colors.primary
                )
            }
        }
    }
}

/**
 * Composable function that displays budget management actions.
 *
 * @param budget Budget object to manage
 * @param onEdit Callback for edit action
 * @param onDelete Callback for delete action
 */
@Composable
private fun BudgetActions(
    budget: Budget,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        Button(
            onClick = onEdit,
            modifier = Modifier
                .weight(1f)
                .padding(end = 8.dp)
                .semantics { contentDescription = "Edit budget" }
        ) {
            Icon(Icons.Default.Edit, contentDescription = null)
            Spacer(Modifier.width(8.dp))
            Text("Edit")
        }
        
        Button(
            onClick = onDelete,
            colors = ButtonDefaults.buttonColors(backgroundColor = MaterialTheme.colors.error),
            modifier = Modifier
                .weight(1f)
                .padding(start = 8.dp)
                .semantics { contentDescription = "Delete budget" }
        ) {
            Icon(Icons.Default.Delete, contentDescription = null)
            Spacer(Modifier.width(8.dp))
            Text("Delete", color = Color.White)
        }
    }
}

/**
 * Composable function that displays the complete budget details screen content.
 *
 * @param budget Budget object to display
 * @param onEdit Callback for edit action
 * @param onDelete Callback for delete action
 */
@Composable
private fun BudgetDetails(
    budget: Budget,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        Text(
            text = budget.name,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(16.dp)
        )
        
        Text(
            text = budget.category,
            fontSize = 16.sp,
            color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f),
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        BudgetProgressBar(
            progress = budget.getSpentPercentage().toFloat() / 100f,
            label = budget.name,
            spent = budget.spent,
            total = budget.amount
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        BudgetAmountSection(budget)
        
        Spacer(modifier = Modifier.height(24.dp))
        
        BudgetActions(
            budget = budget,
            onEdit = onEdit,
            onDelete = onDelete
        )
        
        if (budget.isOverBudget()) {
            Card(
                backgroundColor = MaterialTheme.colors.error.copy(alpha = 0.1f),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Warning,
                        contentDescription = null,
                        tint = MaterialTheme.colors.error
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Budget exceeded! Consider adjusting your spending or increasing the budget.",
                        color = MaterialTheme.colors.error
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
    }
}