/*
 * Human Tasks:
 * 1. Verify that the color values match the brand guidelines
 * 2. Run accessibility contrast tests using the provided color combinations
 * 3. Validate color-blind friendly combinations using a color blindness simulator
 */

package com.mintreplica.lite.ui.theme

import androidx.compose.ui.graphics.Color  // version: 1.5.0

/**
 * Primary brand colors for main UI elements and key actions
 * Requirement: Design System (8.1.1) - Standardized color values for consistent UI appearance
 */
val Primary = Color(0xFF1976D2)
val PrimaryDark = Color(0xFF1565C0)
val Accent = Color(0xFF03DAC5)

/**
 * Background colors for light and dark themes
 * Requirement: Mobile UI Design (8.1) - Support for both light and dark themes
 */
val Background = Color(0xFFFAFAFA)
val BackgroundDark = Color(0xFF121212)  // Optimized for OLED displays

/**
 * Surface colors for elevated components
 * Requirement: Mobile UI Design (8.1) - Material Design guidelines compliance
 */
val Surface = Color(0xFFFFFFFF)
val SurfaceDark = Color(0xFF1E1E1E)

/**
 * Semantic colors for states and feedback
 * Requirement: Design System (8.1.1) - Visual harmony and consistency
 */
val Error = Color(0xFFB00020)
val Success = Color(0xFF4CAF50)
val Warning = Color(0xFFFFC107)

/**
 * Content colors for optimal contrast
 * Requirement: Accessibility Features (8.1.8) - WCAG 2.1 AA compliant contrast ratios
 */
val OnPrimary = Color(0xFFFFFFFF)
val OnBackground = Color(0xFF000000)
val OnBackgroundDark = Color(0xFFFFFFFF)
val OnSurface = Color(0xFF000000)
val OnSurfaceDark = Color(0xFFFFFFFF)