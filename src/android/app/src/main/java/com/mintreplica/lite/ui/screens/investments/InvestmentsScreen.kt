/*
 * Human Tasks:
 * 1. Verify pull-to-refresh gesture sensitivity on different devices
 * 2. Test chart interactions with accessibility services enabled
 * 3. Validate color contrast ratios for investment performance indicators
 * 4. Confirm proper currency formatting for different locales
 */

package com.mintreplica.lite.ui.screens.investments

// Compose UI dependencies - version: 1.5.0
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

// Chart components
import com.mintreplica.lite.ui.components.PieChart
import com.mintreplica.lite.ui.components.LineChart

/**
 * Main investments screen composable that displays portfolio overview and performance
 * Requirements addressed:
 * - Investment Portfolio Tracking (1.2): Real-time portfolio data visualization
 * - Investment Dashboard UI (8.1.5): Material Design 3 implementation with accessibility
 *
 * @param viewModel ViewModel managing investment data and business logic
 * @param onNavigateToDetail Callback for navigation to investment detail screen
 */
@Composable
fun InvestmentsScreen(
    viewModel: InvestmentsViewModel,
    onNavigateToDetail: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Pull-to-refresh implementation
    PullRefreshIndicator(
        refreshing = uiState.isLoading,
        state = rememberPullRefreshState(
            refreshing = uiState.isLoading,
            onRefresh = { viewModel.refreshInvestments() }
        ),
        modifier = Modifier.fillMaxWidth(),
        scale = true
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        PortfolioSummary(
            totalValue = uiState.totalPortfolioValue,
            returnPercentage = uiState.totalReturnPercentage
        )

        Spacer(modifier = Modifier.height(24.dp))

        AssetAllocation(allocation = uiState.assetAllocation)

        Spacer(modifier = Modifier.height(24.dp))

        HoldingsList(
            holdings = uiState.holdings,
            onHoldingClick = onNavigateToDetail
        )
    }
}

/**
 * Displays portfolio summary with total value and return metrics
 */
@Composable
private fun PortfolioSummary(
    totalValue: Double,
    returnPercentage: Double
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Total Portfolio Value",
                style = MaterialTheme.typography.titleMedium
            )
            
            Text(
                text = formatCurrency(totalValue),
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "YTD Return",
                    style = MaterialTheme.typography.bodyMedium
                )
                
                Text(
                    text = "${String.format("%.2f", returnPercentage)}%",
                    color = if (returnPercentage >= 0) 
                        MaterialTheme.colorScheme.primary 
                    else 
                        MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

/**
 * Displays asset allocation breakdown with interactive pie chart
 */
@Composable
private fun AssetAllocation(allocation: Map<String, Double>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Asset Allocation",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            PieChart(
                values = allocation.values.map { it.toFloat() },
                labels = allocation.keys.toList(),
                colors = MaterialTheme.colorScheme.run {
                    listOf(primary, secondary, tertiary, error, primaryContainer)
                }
            )

            // Allocation legend
            Column(modifier = Modifier.padding(top = 16.dp)) {
                allocation.forEach { (category, percentage) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = category,
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Text(
                            text = "${String.format("%.1f", percentage)}%",
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
 * Displays list of individual investment holdings
 */
@Composable
private fun HoldingsList(
    holdings: List<Investment>,
    onHoldingClick: (String) -> Unit
) {
    Column {
        Text(
            text = "Holdings",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        holdings.forEach { holding ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                onClick = { onHoldingClick(holding.id) }
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = holding.name,
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = holding.symbol,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = formatCurrency(holding.currentValue),
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${String.format("%.2f", holding.returnPercentage)}%",
                            color = if (holding.returnPercentage >= 0)
                                MaterialTheme.colorScheme.primary
                            else
                                MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }
        }
    }
}

/**
 * Helper function to format currency values
 */
private fun formatCurrency(value: Double): String {
    return String.format("$%,.2f", value)
}

/**
 * Data class representing an investment holding
 */
private data class Investment(
    val id: String,
    val name: String,
    val symbol: String,
    val currentValue: Double,
    val returnPercentage: Double
)