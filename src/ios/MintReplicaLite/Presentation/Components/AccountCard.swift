//
// AccountCard.swift
// MintReplicaLite
//
// SwiftUI component for displaying financial account information
//

import SwiftUI // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Verify VoiceOver labels are properly localized
 2. Test dynamic type scaling with extra large text sizes
 3. Validate color contrast ratios meet WCAG guidelines
 4. Test tap gesture handling with VoiceOver enabled
*/

/// SwiftUI view component displaying account information in a card format
/// Addresses requirements:
/// - Account Overview Display (8.1.2)
/// - Mobile-first Design (1.1)
/// - Accessibility Features (8.1.8)
struct AccountCard: View {
    
    // MARK: - Properties
    
    /// Account data model to display
    private let account: Account
    
    /// Optional tap handler for card interaction
    private let onTap: (() -> Void)?
    
    /// Card style configuration
    private struct CardStyle {
        static let cornerRadius: CGFloat = 12
        static let padding: CGFloat = 16
        static let spacing: CGFloat = 8
        static let shadowRadius: CGFloat = 4
        static let minTextSize: CGFloat = 16
    }
    
    // MARK: - Initialization
    
    /// Initializes the account card view
    /// - Parameters:
    ///   - account: Account model containing display data
    ///   - onTap: Optional closure to handle card taps
    init(account: Account, onTap: (() -> Void)? = nil) {
        self.account = account
        self.onTap = onTap
    }
    
    // MARK: - Body
    
    var body: some View {
        VStack(alignment: .leading, spacing: CardStyle.spacing) {
            // Institution and Account Type Header
            HStack {
                Text(account.institutionName ?? "")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(account.type.toString())
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(8)
            }
            
            // Account Name
            Text(account.name)
                .font(.headline)
                .foregroundColor(.primary)
                .minimumScaleFactor(0.8)
                .lineLimit(1)
            
            Spacer(minLength: CardStyle.spacing)
            
            // Balance
            Text(account.formattedBalance())
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.primary)
        }
        .padding(CardStyle.padding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemBackground))
        .cornerRadius(CardStyle.cornerRadius)
        .shadow(
            color: Color.black.opacity(0.1),
            radius: CardStyle.shadowRadius,
            x: 0,
            y: 2
        )
        // Apply tap gesture if handler provided
        .onTapGesture {
            onTap?()
        }
        // Accessibility configuration
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityLabel)
        .accessibilityTraits(.button)
        .accessibilityHint("Double tap to view account details")
        // High contrast support
        .accessibilityEnhanceBackgroundContrast()
        // Minimum text size for readability
        .environment(\.sizeCategory, .large)
    }
    
    // MARK: - Private Methods
    
    /// Generates comprehensive accessibility label for VoiceOver
    private var accessibilityLabel: String {
        let institutionLabel = account.institutionName ?? "Unknown Institution"
        let typeLabel = account.type.toString()
        let nameLabel = account.name
        let balanceLabel = account.formattedBalance()
        
        return "\(institutionLabel) \(typeLabel) account. \(nameLabel). Balance: \(balanceLabel)"
    }
}

// MARK: - Preview Provider

#if DEBUG
struct AccountCard_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Light mode preview
            AccountCard(
                account: Account(
                    id: "preview-1",
                    institutionId: "inst-1",
                    name: "Main Checking",
                    institutionName: "Sample Bank",
                    type: .checking,
                    balance: 1234.56,
                    currency: "USD",
                    lastSynced: Date()
                )
            )
            .padding()
            .previewLayout(.sizeThatFits)
            
            // Dark mode preview
            AccountCard(
                account: Account(
                    id: "preview-2",
                    institutionId: "inst-2",
                    name: "Savings Account",
                    institutionName: "Sample Credit Union",
                    type: .savings,
                    balance: 5678.90,
                    currency: "USD",
                    lastSynced: Date()
                )
            )
            .padding()
            .preferredColorScheme(.dark)
            .previewLayout(.sizeThatFits)
            
            // Extra large text preview
            AccountCard(
                account: Account(
                    id: "preview-3",
                    institutionId: "inst-3",
                    name: "Credit Card",
                    institutionName: "Sample Bank",
                    type: .credit,
                    balance: -432.10,
                    currency: "USD",
                    lastSynced: Date()
                )
            )
            .padding()
            .environment(\.sizeCategory, .accessibilityExtraExtraExtraLarge)
            .previewLayout(.sizeThatFits)
        }
    }
}
#endif