//
// Color+Extension.swift
// MintReplicaLite
//
// MARK: - Human Tasks
// 1. Verify that the minimum iOS deployment target is set to iOS 14.0 or higher
// 2. Ensure AppTheme.swift is included in the project and properly configured
// 3. Run accessibility tests to verify contrast ratios meet WCAG guidelines

// SwiftUI framework - iOS 14.0+
import SwiftUI

// MARK: - Global Constants
private let minimumBrightness: Double = 0.0
private let maximumBrightness: Double = 1.0
private let minimumOpacity: Double = 0.0
private let maximumOpacity: Double = 1.0

// MARK: - Color Extension
/// Extension providing enhanced color manipulation and accessibility features
/// Implements requirements from Mobile Applications Design (5.2.1) and Accessibility Support (8.1.8)
extension Color {
    
    /// Adjusts the brightness of a color by a given percentage
    /// - Parameter percentage: The percentage to adjust brightness (-1.0 to 1.0)
    /// - Returns: A new color with adjusted brightness
    /// Implements requirement: Design System Key (8.1.1)
    func adjustBrightness(_ percentage: Double) -> Color {
        // Validate brightness range
        let validatedPercentage = max(minimumBrightness, min(maximumBrightness, percentage))
        
        // Use AppTheme's color adjustment utility for consistent brightness adjustment
        return AppTheme.shared.adjustColorBrightness(self, percentage: validatedPercentage)
    }
    
    /// Adjusts the opacity of a color by a given percentage
    /// - Parameter percentage: The percentage of opacity (0.0 to 1.0)
    /// - Returns: A new color with adjusted opacity
    /// Implements requirement: Design System Key (8.1.1)
    func adjustOpacity(_ percentage: Double) -> Color {
        // Validate opacity range
        let validatedOpacity = max(minimumOpacity, min(maximumOpacity, percentage))
        
        // Apply opacity adjustment
        return self.opacity(validatedOpacity)
    }
    
    /// Calculates the contrast ratio with another color for accessibility checks
    /// - Parameter otherColor: The color to compare against
    /// - Returns: The WCAG contrast ratio between the two colors
    /// Implements requirement: Accessibility Support (8.1.8)
    func contrastRatio(with otherColor: Color) -> Double {
        // Use AppTheme's contrast calculation utility for WCAG compliance
        return AppTheme.shared.calculateContrastRatio(self, otherColor)
    }
}