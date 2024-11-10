package com.mintreplica.lite.ui.theme

// androidx.compose.material:material:1.5.0
import androidx.compose.material.Shapes
// androidx.compose.foundation:foundation:1.5.0
import androidx.compose.foundation.shape.RoundedCornerShape
// androidx.compose.ui:ui:1.5.0
import androidx.compose.ui.unit.dp

/**
 * Defines the shape system for the application's UI components following Material Design guidelines.
 * 
 * Requirements addressed:
 * - Mobile UI Design (8.1): Implements consistent shape system for mobile application interface components
 * - Design System (8.1.1): Provides unified shape definitions for consistent UI appearance
 */
val Shapes = Shapes(
    // Small components like buttons, text fields
    small = RoundedCornerShape(4.dp),
    
    // Medium components like cards, dialogs
    medium = RoundedCornerShape(8.dp),
    
    // Large components like bottom sheets, modal dialogs
    large = RoundedCornerShape(12.dp)
)