// androidx.compose.material:material:1.5.0
// androidx.compose.ui:ui:1.5.0

package com.mintreplica.lite.ui.theme

import androidx.compose.material.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/**
 * Human Tasks:
 * 1. Verify that the minimum text size of 16sp for main content meets accessibility requirements for your target devices
 * 2. Test typography with different system font size settings to ensure proper scaling
 * 3. Validate font contrast ratios meet WCAG 2.1 AA standards
 */

/**
 * Application typography system implementing Material Design type scale
 * Requirements addressed:
 * - REQ-8.1: Mobile UI Design - Implements comprehensive typography system for mobile application interface
 * - REQ-8.1.8: Accessibility Features - Ensures minimum text size of 16sp for main content
 * - REQ-8.1.1: Design System Key - Provides unified typography system for consistent text appearance
 */
val Typography = Typography(
    // Large headings for screen titles and major sections
    h1 = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp
    ),
    
    // Medium headings for section headers
    h2 = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp
    ),
    
    // Small headings for subsections
    h3 = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 18.sp
    ),
    
    // Primary body text ensuring minimum 16sp for accessibility
    body1 = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp
    ),
    
    // Secondary body text for less emphasized content
    body2 = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp
    ),
    
    // Button text with medium weight for emphasis
    button = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp
    ),
    
    // Caption text for supplementary information
    caption = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp
    )
)