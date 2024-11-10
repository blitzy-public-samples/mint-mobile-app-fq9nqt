/*
 * Human Tasks:
 * 1. Verify chart animations perform smoothly on target devices
 * 2. Test touch interaction responsiveness on different screen sizes
 * 3. Validate chart accessibility with TalkBack screen reader
 * 4. Confirm color contrast ratios meet WCAG 2.1 AA standards
 */

package com.mintreplica.lite.ui.components

// Compose UI dependencies - version: 1.5.0
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.foundation.layout.*
import androidx.compose.material.MaterialTheme
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.Brush

// Theme imports
import com.mintreplica.lite.ui.theme.Primary
import com.mintreplica.lite.ui.theme.Success
import com.mintreplica.lite.ui.theme.Warning
import com.mintreplica.lite.ui.theme.Error

/**
 * Line chart component for financial trend visualization
 * Requirement: Data Visualization (8.1.2) - Transaction trends with interactive elements
 *
 * @param dataPoints List of data points to plot
 * @param labels List of x-axis labels
 * @param maxValue Maximum value for y-axis scaling
 * @param lineColor Color of the trend line
 */
@Composable
fun LineChart(
    dataPoints: List<Float>,
    labels: List<String>,
    maxValue: Float,
    lineColor: Color = Primary
) {
    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp)
            .padding(16.dp)
    ) {
        val width = size.width
        val height = size.height
        val xStep = width / (dataPoints.size - 1)
        val yStep = height / maxValue

        // Draw grid lines
        drawGridLines(width, height)

        // Draw trend line
        val path = Path().apply {
            dataPoints.forEachIndexed { index, value ->
                val x = index * xStep
                val y = height - (value * yStep)
                if (index == 0) moveTo(x, y) else lineTo(x, y)
            }
        }

        drawPath(
            path = path,
            color = lineColor,
            style = Stroke(
                width = 3f,
                cap = StrokeCap.Round,
                pathEffect = PathEffect.cornerPathEffect(10f)
            )
        )

        // Draw data points
        dataPoints.forEachIndexed { index, value ->
            val x = index * xStep
            val y = height - (value * yStep)
            drawCircle(
                color = lineColor,
                radius = 6f,
                center = Offset(x, y)
            )
        }
    }
}

/**
 * Bar chart component for financial category comparison
 * Requirement: Budget Visualization (8.1.2) - Budget progress visualization
 *
 * @param values List of bar values
 * @param categories List of category labels
 * @param maxValue Maximum value for scaling
 * @param barColor Color of the bars
 */
@Composable
fun BarChart(
    values: List<Float>,
    categories: List<String>,
    maxValue: Float,
    barColor: Color = Primary
) {
    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp)
            .padding(16.dp)
    ) {
        val width = size.width
        val height = size.height
        val barWidth = (width / values.size) * 0.8f
        val spacing = (width / values.size) * 0.2f

        // Draw bars
        values.forEachIndexed { index, value ->
            val barHeight = (value / maxValue) * height
            val x = index * (barWidth + spacing)
            val y = height - barHeight

            drawRect(
                color = barColor,
                topLeft = Offset(x + spacing/2, y),
                size = Size(barWidth, barHeight)
            )
        }
    }
}

/**
 * Pie chart component for financial distribution visualization
 * Requirement: Investment Performance Charts (8.1.5) - Asset allocation visualization
 *
 * @param values List of segment values
 * @param labels List of segment labels
 * @param colors List of segment colors
 */
@Composable
fun PieChart(
    values: List<Float>,
    labels: List<String>,
    colors: List<Color>
) {
    val total = values.sum()
    var startAngle = 0f

    Canvas(
        modifier = Modifier
            .size(200.dp)
            .padding(16.dp)
    ) {
        val radius = size.minDimension / 2
        val center = Offset(size.width / 2, size.height / 2)

        values.forEachIndexed { index, value ->
            val sweepAngle = (value / total) * 360f
            drawArc(
                color = colors.getOrElse(index) { Primary },
                startAngle = startAngle,
                sweepAngle = sweepAngle,
                useCenter = true,
                topLeft = Offset(center.x - radius, center.y - radius),
                size = Size(radius * 2, radius * 2)
            )
            startAngle += sweepAngle
        }
    }
}

/**
 * Area chart component for cumulative financial data visualization
 * Requirement: Investment Performance Charts (8.1.5) - Performance tracking
 *
 * @param dataPoints List of data points
 * @param labels List of x-axis labels
 * @param maxValue Maximum value for scaling
 * @param areaColor Base color for gradient fill
 */
@Composable
fun AreaChart(
    dataPoints: List<Float>,
    labels: List<String>,
    maxValue: Float,
    areaColor: Color = Primary
) {
    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp)
            .padding(16.dp)
    ) {
        val width = size.width
        val height = size.height
        val xStep = width / (dataPoints.size - 1)
        val yStep = height / maxValue

        // Create area path
        val areaPath = Path().apply {
            moveTo(0f, height)
            dataPoints.forEachIndexed { index, value ->
                val x = index * xStep
                val y = height - (value * yStep)
                lineTo(x, y)
            }
            lineTo(width, height)
            close()
        }

        // Draw filled area with gradient
        drawPath(
            path = areaPath,
            brush = Brush.verticalGradient(
                colors = listOf(
                    areaColor.copy(alpha = 0.5f),
                    areaColor.copy(alpha = 0.1f)
                )
            )
        )

        // Draw top line
        val linePath = Path().apply {
            dataPoints.forEachIndexed { index, value ->
                val x = index * xStep
                val y = height - (value * yStep)
                if (index == 0) moveTo(x, y) else lineTo(x, y)
            }
        }

        drawPath(
            path = linePath,
            color = areaColor,
            style = Stroke(
                width = 2f,
                cap = StrokeCap.Round
            )
        )
    }
}

/**
 * Helper function to draw chart grid lines
 */
private fun DrawScope.drawGridLines(width: Float, height: Float) {
    val horizontalLines = 5
    val verticalLines = 6

    repeat(horizontalLines) { i ->
        val y = (height / horizontalLines) * i
        drawLine(
            color = Color.LightGray.copy(alpha = 0.5f),
            start = Offset(0f, y),
            end = Offset(width, y),
            strokeWidth = 1f,
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f))
        )
    }

    repeat(verticalLines) { i ->
        val x = (width / verticalLines) * i
        drawLine(
            color = Color.LightGray.copy(alpha = 0.5f),
            start = Offset(x, 0f),
            end = Offset(x, height),
            strokeWidth = 1f,
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f))
        )
    }
}