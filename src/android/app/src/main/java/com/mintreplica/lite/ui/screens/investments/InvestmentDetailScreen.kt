/*
 * Human Tasks:
 * 1. Verify chart animations perform smoothly on low-end devices
 * 2. Test accessibility features with TalkBack screen reader
 * 3. Validate color contrast ratios for all text elements
 * 4. Review performance with large datasets
 */

package com.mintreplica.lite.ui.screens.investments

// Compose UI - version: 1.5.0
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.lifecycle.viewmodel.compose.viewModel

// Chart Components
import com.mintreplica.lite.ui.components.LineChart
import com.mintreplica.lite.ui.components.PieChart
import com.mintreplica.lite.ui.components.AreaChart

// Utils
import com.mintreplica.lite.utils.CurrencyFormatter
import com.mintreplica.lite.ui.navigation.Screen
import java.math.BigDecimal

/**
 * Investment detail screen showing comprehensive investment information
 * Requirements addressed:
 * - Investment Portfolio Tracking (1.2): Detailed investment performance metrics
 * - Investment Dashboard UI (8.1.5): Performance charts and allocation visualization
 *
 * @param investmentId Unique identifier for the investment
 * @param navController Navigation controller for screen navigation
 */
@Composable
fun InvestmentDetailScreen(
    investmentId: String,
    navController: NavController,
    viewModel: InvestmentDetailViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(investmentId) {
        viewModel.loadInvestmentDetails(investmentId)
    }

    Scaffold(
        topBar = {
            SmallTopAppBar(
                title = { Text(uiState.investment?.name ?: "") },
                navigationIcon = {
                    IconButton(onClick = { navController.navigateUp() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        if (uiState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            InvestmentDetailContent(
                uiState = uiState,
                modifier = Modifier.padding(paddingValues)
            )
        }
    }
}

/**
 * Main content of the investment detail screen
 */
@Composable
private fun InvestmentDetailContent(
    uiState: InvestmentDetailUiState,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        InvestmentSummaryCard(
            investment = uiState.investment,
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        PerformanceChart(
            performanceData = uiState.performanceData,
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp)
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        AllocationBreakdown(
            allocationData = uiState.allocationData,
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp)
        )
    }
}

/**
 * Card displaying investment summary information
 */
@Composable
private fun InvestmentSummaryCard(
    investment: Investment?,
    modifier: Modifier = Modifier
) {
    if (investment == null) return
    
    ElevatedCard(
        modifier = modifier
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = investment.name,
                style = MaterialTheme.typography.headlineSmall
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Current Value",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = CurrencyFormatter.formatAmount(
                            investment.currentValue,
                            investment.currency
                        ),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Total Return",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = "${investment.totalReturnPercentage}%",
                        style = MaterialTheme.typography.titleLarge,
                        color = if (investment.totalReturnPercentage >= 0)
                            MaterialTheme.colorScheme.primary
                        else
                            MaterialTheme.colorScheme.error,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Cost Basis",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = CurrencyFormatter.formatAmount(
                            investment.costBasis,
                            investment.currency
                        ),
                        style = MaterialTheme.typography.titleMedium
                    )
                }
                
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Purchase Date",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = investment.purchaseDate,
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
        }
    }
}

/**
 * Performance chart section with time period selection
 */
@Composable
private fun PerformanceChart(
    performanceData: List<PerformanceData>,
    modifier: Modifier = Modifier
) {
    var selectedPeriod by remember { mutableStateOf(TimePeriod.ONE_MONTH) }
    
    Column(modifier = modifier) {
        Text(
            text = "Performance",
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        
        // Time period selector
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            TimePeriod.values().forEach { period ->
                FilterChip(
                    selected = selectedPeriod == period,
                    onClick = { selectedPeriod = period },
                    label = { Text(period.label) }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Performance metrics
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            performanceData.lastOrNull()?.let { latest ->
                Column {
                    Text(
                        text = "Period Return",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = "${latest.returnPercentage}%",
                        style = MaterialTheme.typography.titleMedium,
                        color = if (latest.returnPercentage >= 0)
                            MaterialTheme.colorScheme.primary
                        else
                            MaterialTheme.colorScheme.error
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Performance chart
        LineChart(
            dataPoints = performanceData.map { it.value.toFloat() },
            labels = performanceData.map { it.date },
            maxValue = performanceData.maxOf { it.value.toFloat() },
            lineColor = MaterialTheme.colorScheme.primary
        )
    }
}

/**
 * Asset allocation breakdown section
 */
@Composable
private fun AllocationBreakdown(
    allocationData: List<AllocationData>,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(
            text = "Asset Allocation",
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Pie chart
            PieChart(
                values = allocationData.map { it.percentage.toFloat() },
                labels = allocationData.map { it.category },
                colors = allocationData.mapIndexed { index, _ ->
                    MaterialTheme.colorScheme.run {
                        when (index % 5) {
                            0 -> primary
                            1 -> secondary
                            2 -> tertiary
                            3 -> surfaceVariant
                            else -> inversePrimary
                        }
                    }
                }
            )
            
            // Allocation details
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(start = 16.dp)
            ) {
                allocationData.forEach { allocation ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = allocation.category,
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Text(
                            text = "${allocation.percentage}%",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

/**
 * Time period options for performance chart
 */
private enum class TimePeriod(val label: String) {
    ONE_MONTH("1M"),
    THREE_MONTHS("3M"),
    SIX_MONTHS("6M"),
    ONE_YEAR("1Y"),
    ALL("All")
}

/**
 * Data class representing performance data point
 */
data class PerformanceData(
    val date: String,
    val value: BigDecimal,
    val returnPercentage: Double
)

/**
 * Data class representing allocation data
 */
data class AllocationData(
    val category: String,
    val percentage: Double
)

/**
 * UI state for investment detail screen
 */
data class InvestmentDetailUiState(
    val isLoading: Boolean = true,
    val investment: Investment? = null,
    val performanceData: List<PerformanceData> = emptyList(),
    val allocationData: List<AllocationData> = emptyList(),
    val error: String? = null
)