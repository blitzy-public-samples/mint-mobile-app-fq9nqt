/*
 * Human Tasks:
 * 1. Verify Material3 dependency is added in app/build.gradle:
 *    implementation "androidx.compose.material3:material3:1.1.0"
 * 2. Ensure proper accessibility testing with TalkBack service
 * 3. Validate color contrast ratios meet WCAG 2.1 AA standards
 */

package com.mintreplica.lite.ui.components

import androidx.compose.foundation.layout.Column  // version: 1.5.0
import androidx.compose.foundation.layout.Row  // version: 1.5.0
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card  // version: 1.1.0
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable  // version: 1.5.0
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier  // version: 1.5.0
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription  // version: 1.5.0
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mintreplica.lite.R
import com.mintreplica.lite.domain.model.Account
import com.mintreplica.lite.utils.CurrencyFormatter
import com.mintreplica.lite.ui.theme.Primary

/**
 * A reusable Jetpack Compose component that displays a financial account card.
 * 
 * Requirements addressed:
 * - Account Overview (8.1.2): Display account details in card format
 * - Mobile UI Components (8.1.1): Material Design card implementation
 * - Accessibility Features (8.1.8): Screen reader support and high contrast
 *
 * @param account The account data to display
 * @param onClick Callback function when the card is clicked
 * @param modifier Optional Modifier for customizing the card's layout
 */
@Composable
fun AccountCard(
    account: Account,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    // Create accessibility description for screen readers
    val accessibilityDescription = buildString {
        append("Account: ${account.name}, ")
        append("Balance: ${CurrencyFormatter.formatAmount(account.balance, account.currency)}, ")
        append(if (account.isActive) "Active" else "Inactive")
        if (account.needsSync()) append(", Needs sync")
    }

    Card(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .semantics { contentDescription = accessibilityDescription },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (account.isActive) MaterialTheme.colorScheme.surface 
                           else MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Account name and sync status
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = account.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = if (account.isActive) MaterialTheme.colorScheme.onSurface 
                           else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f)
                )
                
                if (account.needsSync()) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_sync_needed),
                        contentDescription = "Sync needed",
                        tint = Primary,
                        modifier = Modifier.padding(start = 8.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Account balance
            Text(
                text = CurrencyFormatter.formatAmount(account.balance, account.currency),
                style = MaterialTheme.typography.headlineSmall,
                color = if (account.isActive) MaterialTheme.colorScheme.onSurface 
                       else MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(4.dp))

            // Account type
            Text(
                text = account.accountType,
                style = MaterialTheme.typography.bodyMedium,
                color = if (account.isActive) MaterialTheme.colorScheme.onSurfaceVariant 
                       else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
            )
        }
    }
}