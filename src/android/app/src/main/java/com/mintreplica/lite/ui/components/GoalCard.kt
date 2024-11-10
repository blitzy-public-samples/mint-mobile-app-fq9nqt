/*
 * Human Tasks:
 * 1. Verify accessibility contrast ratios meet WCAG 2.1 AA standards
 * 2. Test with TalkBack screen reader for proper content descriptions
 * 3. Validate touch target sizes meet minimum accessibility requirements
 */

package com.mintreplica.lite.ui.components

// androidx.compose.runtime:runtime:1.5.0
import androidx.compose.runtime.Composable

// androidx.compose.material:material:1.5.0
import androidx.compose.material.Card
import androidx.compose.material.Text
import androidx.compose.material.MaterialTheme

// androidx.compose.foundation:foundation:1.5.0
import androidx.compose.foundation.clickable

// androidx.compose.foundation.layout:layout:1.5.0
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width

import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

import com.mintreplica.lite.domain.model.Goal

/**
 * A reusable goal card component that displays financial goal information with progress tracking.
 * 
 * Requirements addressed:
 * - Goal Progress Display (8.1.2): Visual representation of goal progress
 * - Financial Goal Tracking (1.2): Goal progress monitoring interface
 * - Accessibility Support (8.1.8): Screen reader support and high contrast colors
 *
 * @param goal Goal object containing the goal data and progress information
 * @param onClick Callback function to handle card click events
 */
@Composable
fun GoalCard(
    goal: Goal,
    onClick: () -> Unit
) {
    // Calculate accessibility content description
    val contentDesc = "${goal.name} goal in ${goal.category} category. " +
        "Current progress: ${goal.getProgress().toInt()}%. " +
        "Current amount: ${goal.getFormattedCurrentAmount()} of ${goal.getFormattedTargetAmount()} target. " +
        "${goal.getRemainingDays()} days remaining."

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .clickable(onClick = onClick)
            .semantics { contentDescription = contentDesc },
        elevation = 4.dp,
        shape = MaterialTheme.shapes.medium,
        backgroundColor = MaterialTheme.colors.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Goal header with name and category
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = goal.name,
                        style = MaterialTheme.typography.h6,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = goal.category,
                        style = MaterialTheme.typography.body2,
                        color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Progress bar
            BudgetProgressBar(
                progress = goal.getProgress() / 100f,
                label = "Progress",
                spent = goal.currentAmount.toDouble(),
                total = goal.targetAmount.toDouble()
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Remaining amount and time
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = "Remaining",
                        style = MaterialTheme.typography.caption,
                        color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f)
                    )
                    Text(
                        text = goal.getRemainingAmount().toString(),
                        style = MaterialTheme.typography.subtitle1,
                        fontWeight = FontWeight.Medium
                    )
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = "Days Left",
                        style = MaterialTheme.typography.caption,
                        color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f)
                    )
                    Text(
                        text = "${goal.getRemainingDays()} days",
                        style = MaterialTheme.typography.subtitle1,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}