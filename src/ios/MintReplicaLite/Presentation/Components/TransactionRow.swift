//
// TransactionRow.swift
// MintReplicaLite
//
// SwiftUI component for displaying transaction items with dynamic styling
//

import SwiftUI // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Verify accessibility labels are descriptive and helpful
 2. Test color contrast ratios meet WCAG guidelines
 3. Validate touch targets meet minimum size requirements
 4. Test VoiceOver navigation flow
*/

/// SwiftUI View representing a single transaction row with dynamic styling and selection support
/// Requirements addressed:
/// - Transaction tracking and categorization (1.2 Scope/Core Features)
/// - Native mobile applications (5.2.1 Mobile Applications)
/// - Mobile-first design (1.1 System Overview)
struct TransactionRow: View {
    
    // MARK: - Properties
    
    /// Transaction data to display
    private let transaction: Transaction
    
    /// Selection state for the row
    private let isSelected: Bool
    
    /// Haptic feedback generator for selection
    private let haptic = UIImpactFeedbackGenerator(style: .light)
    
    // MARK: - Initialization
    
    /// Initializes a new transaction row view
    /// - Parameters:
    ///   - transaction: Transaction data to display
    ///   - isSelected: Whether the row is selected
    init(transaction: Transaction, isSelected: Bool = false) {
        self.transaction = transaction
        self.isSelected = isSelected
    }
    
    // MARK: - Body
    
    var body: some View {
        HStack(spacing: 16) {
            // Category icon with semantic coloring
            categoryIcon()
                .frame(width: 40, height: 40)
                .background(Color(.systemGray6))
                .clipShape(Circle())
                .accessibility(label: Text("\(transaction.category) category"))
            
            // Transaction details
            VStack(alignment: .leading, spacing: 4) {
                // Description and merchant
                Text(transaction.description)
                    .font(.body)
                    .foregroundColor(.primary)
                    .lineLimit(1)
                
                if let merchantName = transaction.merchantName {
                    Text(merchantName)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
                
                // Date
                Text(transaction.formattedDate())
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Amount with dynamic coloring
            Text(transaction.formattedAmount())
                .font(.body.monospacedDigit())
                .foregroundColor(amountColor())
                .accessibility(label: Text("Amount \(transaction.formattedAmount())"))
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(isSelected ? Color(.systemGray6) : Color(.systemBackground))
        )
        .contentShape(Rectangle()) // Ensures entire row is tappable
    }
    
    // MARK: - Helper Views
    
    /// Generates appropriate SF Symbol for transaction category
    /// - Returns: Category-specific icon with consistent styling
    private func categoryIcon() -> some View {
        let iconName: String
        
        // Map categories to appropriate SF Symbols
        switch transaction.category.lowercased() {
        case let category where category.contains("food") || category.contains("dining"):
            iconName = "fork.knife"
        case let category where category.contains("transport") || category.contains("travel"):
            iconName = "car.fill"
        case let category where category.contains("shopping") || category.contains("retail"):
            iconName = "bag.fill"
        case let category where category.contains("health") || category.contains("medical"):
            iconName = "heart.fill"
        case let category where category.contains("entertainment") || category.contains("recreation"):
            iconName = "film.fill"
        case let category where category.contains("utilities") || category.contains("bills"):
            iconName = "bolt.fill"
        case let category where category.contains("income") || category.contains("salary"):
            iconName = "dollarsign.circle.fill"
        case let category where category.contains("transfer"):
            iconName = "arrow.left.arrow.right"
        default:
            iconName = "creditcard.fill"
        }
        
        return Image(systemName: iconName)
            .font(.system(size: 20))
            .foregroundColor(.primary)
    }
    
    /// Determines text color based on transaction type
    /// - Returns: Semantic color for amount display
    private func amountColor() -> Color {
        if transaction.isExpense() {
            return .red
        } else if transaction.type == .credit || transaction.type == .refund {
            return .green
        }
        return .primary
    }
}

// MARK: - Preview Provider

#if DEBUG
struct TransactionRow_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Example expense transaction
            TransactionRow(
                transaction: try! Transaction(
                    id: UUID(),
                    description: "Grocery Shopping",
                    amount: -85.50,
                    date: Date(),
                    category: "Food",
                    accountId: "123",
                    isPending: false,
                    merchantName: "Whole Foods",
                    type: .debit
                )
            )
            
            // Example income transaction
            TransactionRow(
                transaction: try! Transaction(
                    id: UUID(),
                    description: "Salary Deposit",
                    amount: 2500.00,
                    date: Date(),
                    category: "Income",
                    accountId: "123",
                    isPending: false,
                    type: .credit
                ),
                isSelected: true
            )
            .preferredColorScheme(.dark)
        }
        .previewLayout(.sizeThatFits)
        .padding()
    }
}
#endif