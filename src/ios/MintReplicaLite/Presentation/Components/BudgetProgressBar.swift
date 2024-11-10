// SwiftUI framework - iOS 14.0+
import SwiftUI

/// A reusable SwiftUI progress bar component for budget visualization
/// Implements requirements:
/// - Budget Progress Visualization (8.1.2)
/// - Accessibility Support (8.1.8)
/// - Mobile UI Components (8.1.1)
struct BudgetProgressBar: View {
    // MARK: - Properties
    private let progress: Double
    private let total: Double
    private let showPercentage: Bool
    private let height: CGFloat
    
    // MARK: - Computed Properties
    private var percentage: Double {
        guard total > 0 else { return 0 }
        return min((progress / total) * 100, 100)
    }
    
    // MARK: - Constants
    private enum Constants {
        static let warningThreshold: Double = 80.0
        static let cornerRadius: CGFloat = 8.0
        static let labelSpacing: CGFloat = 4.0
        static let minimumHeight: CGFloat = 8.0
        static let percentageFormat: String = "%.1f%%"
    }
    
    // MARK: - Initialization
    init(progress: Double, total: Double, showPercentage: Bool = true, height: CGFloat = 12) {
        self.progress = progress
        self.total = total
        self.showPercentage = showPercentage
        self.height = max(height, Constants.minimumHeight)
    }
    
    // MARK: - View Body
    var body: some View {
        GeometryReader { geometry in
            VStack(alignment: .leading, spacing: Constants.labelSpacing) {
                // Progress Bar
                ZStack(alignment: .leading) {
                    // Background
                    RoundedRectangle(cornerRadius: Constants.cornerRadius)
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: height)
                    
                    // Progress Fill
                    RoundedRectangle(cornerRadius: Constants.cornerRadius)
                        .fill(getProgressColor(percentage: percentage))
                        .frame(width: calculateProgressWidth(totalWidth: geometry.size.width),
                               height: height)
                        .animation(.easeInOut, value: percentage)
                }
                
                // Percentage Label
                if showPercentage {
                    Text(String(format: Constants.percentageFormat, percentage))
                        .font(AppTheme.shared.captionFont)
                        .foregroundColor(AppTheme.shared.textSecondary)
                        .accessibilityHidden(true)
                }
            }
        }
        .frame(height: showPercentage ? (height + Constants.labelSpacing + 20) : height)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(generateAccessibilityLabel())
        .accessibilityValue(String(format: Constants.percentageFormat, percentage))
    }
    
    // MARK: - Helper Functions
    
    /// Determines the color of the progress bar based on percentage and accessibility settings
    /// Implements requirement: Budget Progress Visualization (8.1.2)
    private func getProgressColor(percentage: Double) -> Color {
        let baseColor = percentage >= Constants.warningThreshold ?
            AppTheme.shared.error : AppTheme.shared.success
        
        // Apply high contrast adjustments if needed
        if AppTheme.shared.isHighContrastEnabled {
            return AppTheme.shared.adjustColorBrightness(baseColor, percentage: 0.1)
        }
        
        return baseColor
    }
    
    /// Calculates the width of the progress fill
    private func calculateProgressWidth(totalWidth: CGFloat) -> CGFloat {
        let progressPercentage = CGFloat(percentage / 100.0)
        return totalWidth * progressPercentage
    }
    
    /// Generates accessibility label for VoiceOver
    /// Implements requirement: Accessibility Support (8.1.8)
    private func generateAccessibilityLabel() -> String {
        let status = percentage >= Constants.warningThreshold ? "Over budget" : "Within budget"
        return "Budget progress bar: \(status). Current spending: \(progress) of \(total)"
    }
}

// MARK: - Preview Provider
#if DEBUG
struct BudgetProgressBar_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            BudgetProgressBar(progress: 750, total: 1000)
                .frame(height: 50)
            
            BudgetProgressBar(progress: 850, total: 1000)
                .frame(height: 50)
            
            BudgetProgressBar(progress: 1100, total: 1000, showPercentage: false)
                .frame(height: 50)
        }
        .padding()
        .previewLayout(.sizeThatFits)
    }
}
#endif