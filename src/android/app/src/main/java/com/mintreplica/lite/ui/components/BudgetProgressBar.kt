/*
 * Human Tasks:
 * 1. Verify accessibility contrast ratios meet WCAG 2.1 AA standards
 * 2. Test with TalkBack screen reader for proper content descriptions
 * 3. Validate progress animations perform smoothly on target devices
 */

package com.mintreplica.lite.ui.components

import androidx.compose.animation.core.animateFloatAsState  // version: 1.5.0
import androidx.compose.foundation.layout.Column  // version: 1.5.0
import androidx.compose.foundation.layout.Row  // version: 1.5.0
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.LinearProgressIndicator  // version: 1.5.0
import androidx.compose.material.Text  // version: 1.5.0
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mintreplica.lite.ui.theme.Primary
import com.mintreplica.lite.ui.theme.Success
import com.mintreplica.lite.ui.theme.Warning
import com.mintreplica.lite.ui.theme.Error
import java.text.NumberFormat
import kotlin.math.roundToInt

/**
 * A reusable budget progress bar component that displays spending progress with color-coded status.
 * 
 * Requirements addressed:
 * - Budget Status Visualization (8.1.2): Visual progress indicator with color-coded status
 * - Budget Progress Display (8.1.4): Animated progress updates with spent amount visualization
 * - Accessibility Support (8.1.8): High contrast colors and screen reader support
 *
 * @param progress Current progress value between 0 and 1
 * @param label Category or budget label to display
 * @param spent Amount spent so far
 * @param total Total budget amount
 * @param showAmount Whether to display the spent/total amounts
 */
@Composable
fun BudgetProgressBar(
    progress: Float,
    label: String,
    spent: Double,
    total: Double,
    showAmount: Boolean = true
) {
    // Animate progress changes smoothly
    val animatedProgress by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        label = "Progress Animation"
    )
    
    // Determine color based on progress thresholds
    val progressColor = when {
        progress < 0.6f -> Success
        progress < 0.9f -> Warning
        else -> Error
    }
    
    // Format currency values
    val currencyFormatter = NumberFormat.getCurrencyInstance()
    val spentFormatted = currencyFormatter.format(spent)
    val totalFormatted = currencyFormatter.format(total)
    
    // Calculate percentage for display
    val percentage = (progress * 100).roundToInt()
    
    // Create accessibility description
    val contentDesc = "$label budget: $spentFormatted spent of $totalFormatted, ${percentage}% used"
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .semantics { contentDescription = contentDesc }
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = "$percentage%",
                fontSize = 14.sp,
                color = progressColor
            )
        }
        
        LinearProgressIndicator(
            progress = animatedProgress,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            color = progressColor,
            backgroundColor = progressColor.copy(alpha = 0.2f)
        )
        
        if (showAmount) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = spentFormatted,
                    fontSize = 14.sp,
                    color = Color.Gray
                )
                Text(
                    text = totalFormatted,
                    fontSize = 14.sp,
                    color = Color.Gray
                )
            }
        }
    }
}