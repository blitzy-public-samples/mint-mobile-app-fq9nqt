// External library versions:
// - androidx.compose.runtime: 1.5.0
// - androidx.compose.foundation.layout: 1.5.0
// - androidx.compose.material3: 1.1.0

package com.mintreplica.lite.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.mintreplica.lite.R
import com.mintreplica.lite.domain.model.Transaction
import com.mintreplica.lite.utils.CurrencyFormatter
import com.mintreplica.lite.utils.DateUtils

/**
 * Human Tasks:
 * 1. Ensure proper Material Design 3 theme configuration in the app's theme.
 * 2. Verify accessibility settings for text sizes and color contrast.
 * 3. Add proper content descriptions for icons to support screen readers.
 */

/**
 * A composable component that displays a transaction item in a Material Design 3 card format.
 * 
 * Requirements addressed:
 * - Transaction Tracking (1.2 Scope/Core Features): Displays transaction details in the mobile UI
 * - Mobile UI Components (8.1.2 Main Dashboard): Transaction list item component implementation
 *
 * @param transaction The transaction data to display
 * @param onClick Callback function to handle click events on the transaction item
 */
@Composable
fun TransactionItem(
    transaction: Transaction,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Transaction details column
            Column(
                modifier = Modifier.weight(1f)
            ) {
                // Description and pending status
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = transaction.description,
                        style = MaterialTheme.typography.bodyLarge,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (transaction.pending) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Icon(
                            painter = painterResource(id = R.drawable.ic_pending),
                            contentDescription = "Pending Transaction",
                            tint = MaterialTheme.colorScheme.tertiary,
                            modifier = Modifier.padding(4.dp)
                        )
                    }
                }
                
                // Date and category
                Row(
                    modifier = Modifier.padding(top = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = DateUtils.toDisplayFormat(transaction.date.toDate()),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = " • ",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = transaction.category,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            
            // Amount
            Text(
                text = CurrencyFormatter.formatAmountWithoutSymbol(transaction.amount),
                style = MaterialTheme.typography.bodyLarge,
                color = when {
                    transaction.isExpense() -> MaterialTheme.colorScheme.error
                    transaction.isIncome() -> MaterialTheme.colorScheme.primary
                    else -> MaterialTheme.colorScheme.onSurface
                },
                modifier = Modifier.padding(start = 16.dp)
            )
        }
    }
}

/**
 * Extension function to convert Instant to Date for DateUtils compatibility
 */
private fun java.time.Instant.toDate(): java.util.Date {
    return java.util.Date.from(this)
}