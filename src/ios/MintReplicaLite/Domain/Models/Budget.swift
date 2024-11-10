//
// Budget.swift
// MintReplicaLite
//
// Domain model representing a budget category with spending limits and tracking
//

import Foundation // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Verify budget period calculations match business requirements
 2. Test budget threshold notifications across different time zones
 3. Validate currency formatting with various locales
 4. Review spending percentage calculation accuracy
*/

// MARK: - BudgetPeriod Enum
/// Supported budget tracking periods with localized display names
/// Requirements addressed:
/// - Budget creation and monitoring (1.2 Scope/Core Features)
public enum BudgetPeriod {
    case monthly
    case weekly
    case yearly
    case custom
    
    /// User-friendly localized name of the budget period
    var displayName: String {
        switch self {
        case .monthly:
            return NSLocalizedString("Monthly", comment: "Monthly budget period")
        case .weekly:
            return NSLocalizedString("Weekly", comment: "Weekly budget period")
        case .yearly:
            return NSLocalizedString("Yearly", comment: "Yearly budget period")
        case .custom:
            return NSLocalizedString("Custom", comment: "Custom budget period")
        }
    }
}

// MARK: - Budget Model
/// Immutable domain model representing a budget category with spending limits
/// Requirements addressed:
/// - Budget creation and monitoring (1.2 Scope/Core Features)
/// - Native iOS application using Swift (5.2.1 Mobile Applications)
/// - Real-time notifications and alerts (1.2 Scope/Core Features)
@frozen
public struct Budget {
    // MARK: - Properties
    public let id: String
    public let name: String
    public let categoryId: String
    public let limit: Decimal
    public let spent: Decimal
    public let startDate: Date
    public let endDate: Date
    public let isRecurring: Bool
    public let notes: String?
    
    // MARK: - Initialization
    /// Initializes a Budget instance with required properties and optional notes
    /// - Parameters:
    ///   - id: Unique identifier for the budget
    ///   - name: Display name of the budget category
    ///   - categoryId: Associated spending category identifier
    ///   - limit: Maximum spending amount for the budget period
    ///   - spent: Current amount spent in this budget
    ///   - startDate: Beginning of budget period
    ///   - endDate: End of budget period
    ///   - isRecurring: Whether budget resets automatically
    ///   - notes: Optional additional information
    public init(id: String,
                name: String,
                categoryId: String,
                limit: Decimal,
                spent: Decimal,
                startDate: Date,
                endDate: Date,
                isRecurring: Bool,
                notes: String? = nil) {
        // Validate required parameters
        precondition(!id.isEmpty, "Budget ID cannot be empty")
        precondition(!name.isEmpty, "Budget name cannot be empty")
        precondition(!categoryId.isEmpty, "Category ID cannot be empty")
        precondition(limit > 0, "Budget limit must be greater than zero")
        precondition(spent >= 0, "Spent amount cannot be negative")
        precondition(endDate > startDate, "End date must be after start date")
        
        self.id = id
        self.name = name
        self.categoryId = categoryId
        self.limit = limit
        self.spent = spent
        self.startDate = startDate
        self.endDate = endDate
        self.isRecurring = isRecurring
        self.notes = notes
    }
    
    // MARK: - Public Methods
    /// Returns the budget limit formatted as locale-aware currency string
    /// Requirements addressed:
    /// - Native iOS application using Swift (5.2.1 Mobile Applications)
    public func formattedLimit() -> String {
        return CurrencyFormatter.shared.formatAmount(limit)
    }
    
    /// Returns the amount spent formatted as locale-aware currency string
    /// Requirements addressed:
    /// - Native iOS application using Swift (5.2.1 Mobile Applications)
    public func formattedSpent() -> String {
        return CurrencyFormatter.shared.formatAmount(spent)
    }
    
    /// Calculates percentage of budget spent for progress tracking
    /// Requirements addressed:
    /// - Real-time notifications and alerts (1.2 Scope/Core Features)
    public func spentPercentage() -> Double {
        guard limit > 0 else { return 0 }
        let percentage = Double(truncating: (spent / limit) as NSDecimalNumber) * 100
        return min(max(percentage, 0), 100) // Clamp between 0-100
    }
    
    /// Checks if spending has exceeded budget limit for alerts
    /// Requirements addressed:
    /// - Real-time notifications and alerts (1.2 Scope/Core Features)
    public func isOverBudget() -> Bool {
        return spent > limit
    }
    
    /// Creates a copy of the budget with optional property updates
    /// - Parameter updates: Dictionary of property updates to apply
    /// - Returns: New Budget instance with applied updates
    public func copy(updates: [String: Any]) -> Budget {
        var properties: [String: Any] = [
            "id": id,
            "name": name,
            "categoryId": categoryId,
            "limit": limit,
            "spent": spent,
            "startDate": startDate,
            "endDate": endDate,
            "isRecurring": isRecurring
        ]
        if let notes = notes {
            properties["notes"] = notes
        }
        
        // Merge updates into properties
        updates.forEach { properties[$0] = $1 }
        
        // Create new instance with updated properties
        return Budget(
            id: properties["id"] as? String ?? id,
            name: properties["name"] as? String ?? name,
            categoryId: properties["categoryId"] as? String ?? categoryId,
            limit: properties["limit"] as? Decimal ?? limit,
            spent: properties["spent"] as? Decimal ?? spent,
            startDate: properties["startDate"] as? Date ?? startDate,
            endDate: properties["endDate"] as? Date ?? endDate,
            isRecurring: properties["isRecurring"] as? Bool ?? isRecurring,
            notes: properties["notes"] as? String ?? notes
        )
    }
}