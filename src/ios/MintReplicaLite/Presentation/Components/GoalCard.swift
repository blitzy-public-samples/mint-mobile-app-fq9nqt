// SwiftUI framework - iOS 14.0+
import SwiftUI

// MARK: - Human Tasks
/*
 1. Verify accessibility labels are properly localized
 2. Test VoiceOver navigation flow through card elements
 3. Validate color contrast ratios meet WCAG guidelines
 4. Review haptic feedback implementation for tap gesture
*/

/// A SwiftUI view component that displays a financial goal card with progress tracking
/// Addresses requirements:
/// - Financial goal setting and progress monitoring (1.2 Scope/Core Features)
/// - Mobile Applications Design (5.2.1 Mobile Applications)
/// - User Interface Design (8.1.1 Design System Key)
@frozen
struct GoalCard: View {
    // MARK: - Properties
    
    private let goal: Goal
    private let onTap: (() -> Void)?
    
    // MARK: - Theme
    
    private let theme = AppTheme.shared
    
    // MARK: - Initialization
    
    /// Initializes a new goal card view
    /// - Parameters:
    ///   - goal: The goal model to display
    ///   - onTap: Optional callback for tap gesture
    init(goal: Goal, onTap: (() -> Void)? = nil) {
        self.goal = goal
        self.onTap = onTap
    }
    
    // MARK: - Body
    
    var body: some View {
        VStack(alignment: .leading, spacing: theme.spacing) {
            // Header
            VStack(alignment: .leading, spacing: theme.spacing / 2) {
                Text(goal.name)
                    .font(theme.headingFont)
                    .foregroundColor(theme.textPrimary)
                    .accessibility(label: Text("Goal name: \(goal.name)"))
                
                Text(goal.category.rawValue.capitalized)
                    .font(theme.captionFont)
                    .foregroundColor(theme.textSecondary)
                    .accessibility(label: Text("Goal category: \(goal.category.rawValue)"))
            }
            
            // Progress Bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // Background
                    RoundedRectangle(cornerRadius: theme.cornerRadius / 2)
                        .fill(theme.background)
                        .frame(height: 8)
                    
                    // Progress
                    RoundedRectangle(cornerRadius: theme.cornerRadius / 2)
                        .fill(progressColor)
                        .frame(width: min(CGFloat(goal.progressPercentage()) / 100.0 * geometry.size.width, geometry.size.width),
                               height: 8)
                }
            }
            .frame(height: 8)
            .accessibility(value: Text("\(Int(goal.progressPercentage()))% complete"))
            
            // Amount Details
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Current")
                        .font(theme.captionFont)
                        .foregroundColor(theme.textSecondary)
                    Text(goal.formattedCurrentAmount())
                        .font(theme.bodyFont)
                        .foregroundColor(theme.textPrimary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Target")
                        .font(theme.captionFont)
                        .foregroundColor(theme.textSecondary)
                    Text(goal.formattedTargetAmount())
                        .font(theme.bodyFont)
                        .foregroundColor(theme.textPrimary)
                }
            }
            .accessibility(label: Text("Progress: \(goal.formattedCurrentAmount()) of \(goal.formattedTargetAmount())"))
            
            // Deadline
            HStack {
                Image(systemName: "clock")
                    .foregroundColor(theme.textSecondary)
                Text(deadlineText)
                    .font(theme.captionFont)
                    .foregroundColor(theme.textSecondary)
            }
            .accessibility(label: Text("Deadline: \(deadlineText)"))
        }
        .padding(theme.spacing)
        .background(theme.surface)
        .cornerRadius(theme.cornerRadius)
        .shadow(radius: theme.shadowRadius)
        .onTapGesture {
            if let onTap = onTap {
                onTap()
            }
        }
        .accessibilityElement(children: .combine)
        .accessibility(addTraits: .isButton)
        .accessibility(hint: Text("Double tap to view goal details"))
    }
    
    // MARK: - Helper Properties
    
    /// Determines the color of the progress bar based on goal status
    private var progressColor: Color {
        switch goal.status {
        case .completed:
            return theme.success
        case .overdue:
            return theme.warning
        default:
            return theme.primary
        }
    }
    
    /// Formats the deadline text based on remaining days and status
    private var deadlineText: String {
        let days = goal.daysRemaining()
        
        switch goal.status {
        case .completed:
            return "Goal completed"
        case .overdue:
            return "Goal overdue"
        case .notStarted, .inProgress:
            if days == 0 {
                return "Due today"
            } else if days == 1 {
                return "1 day remaining"
            } else {
                return "\(days) days remaining"
            }
        }
    }
}

// MARK: - Preview Provider

#if DEBUG
struct GoalCard_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // In Progress Goal
            GoalCard(goal: try! Goal(
                id: UUID(),
                name: "Emergency Fund",
                description: "Build emergency savings",
                targetAmount: 10000,
                currentAmount: 5000,
                deadline: Date().addingTimeInterval(60*60*24*30),
                category: .savings
            ))
            .padding()
            .previewDisplayName("In Progress")
            
            // Completed Goal
            GoalCard(goal: try! Goal(
                id: UUID(),
                name: "New Laptop",
                description: "Save for new work laptop",
                targetAmount: 2000,
                currentAmount: 2000,
                deadline: Date().addingTimeInterval(60*60*24*30),
                category: .purchase
            ))
            .padding()
            .previewDisplayName("Completed")
            
            // Overdue Goal
            GoalCard(goal: try! Goal(
                id: UUID(),
                name: "Debt Payment",
                description: "Pay off credit card",
                targetAmount: 5000,
                currentAmount: 2500,
                deadline: Date().addingTimeInterval(-60*60*24*30),
                category: .debt
            ))
            .padding()
            .previewDisplayName("Overdue")
            
            // Dark Mode
            GoalCard(goal: try! Goal(
                id: UUID(),
                name: "Vacation Fund",
                description: "Save for summer vacation",
                targetAmount: 3000,
                currentAmount: 1500,
                deadline: Date().addingTimeInterval(60*60*24*60),
                category: .savings
            ))
            .padding()
            .preferredColorScheme(.dark)
            .previewDisplayName("Dark Mode")
        }
    }
}
#endif