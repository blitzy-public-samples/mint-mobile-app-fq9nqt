/*
 * Human Tasks:
 * 1. Verify dark theme colors meet WCAG 2.1 AA contrast requirements
 * 2. Test theme switching behavior with system theme changes
 * 3. Validate color combinations for color-blind accessibility
 * 4. Test theme application across all custom components
 */

package com.mintreplica.lite.ui.theme

// androidx.compose.material:material:1.5.0
import androidx.compose.material.MaterialTheme
import androidx.compose.material.darkColors
import androidx.compose.material.lightColors

// androidx.compose.runtime:runtime:1.5.0
import androidx.compose.runtime.Composable

// androidx.compose.foundation:foundation:1.5.0
import androidx.compose.foundation.isSystemInDarkTheme

/**
 * Dark theme color palette implementation
 * Requirements addressed:
 * - Mobile UI Design (8.1): Dark theme support with optimized colors
 * - Accessibility Features (8.1.8): High contrast color combinations
 */
private val DarkColorPalette = darkColors(
    primary = Primary,
    primaryVariant = PrimaryDark,
    secondary = Accent,
    background = BackgroundDark,
    surface = SurfaceDark,
    error = Error,
    onPrimary = OnPrimary,
    onBackground = OnBackgroundDark,
    onSurface = OnSurfaceDark
)

/**
 * Light theme color palette implementation
 * Requirements addressed:
 * - Design System (8.1.1): Consistent color system
 * - Accessibility Features (8.1.8): WCAG compliant contrast ratios
 */
private val LightColorPalette = lightColors(
    primary = Primary,
    primaryVariant = PrimaryDark,
    secondary = Accent,
    background = Background,
    surface = Surface,
    error = Error,
    onPrimary = OnPrimary,
    onBackground = OnBackground,
    onSurface = OnSurface
)

/**
 * Main theme composable for the Mint Replica Lite application
 * 
 * Requirements addressed:
 * - Mobile UI Design (8.1): Comprehensive theming system
 * - Accessibility Features (8.1.8): Support for system dark theme
 * - Design System (8.1.1): Unified theme system for consistent UI
 *
 * @param darkTheme Boolean flag to force dark theme, defaults to system setting
 * @param content Composable content to be themed
 */
@Composable
fun MintReplicaLiteTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) {
        DarkColorPalette
    } else {
        LightColorPalette
    }

    MaterialTheme(
        colors = colors,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}