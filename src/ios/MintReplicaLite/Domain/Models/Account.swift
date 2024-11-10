//
// Account.swift
// MintReplicaLite
//
// Domain model representing a financial account
//

import Foundation // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Verify SQLite database schema matches Account properties for persistence
 2. Ensure proper currency codes are supported for international accounts
 3. Test account type localization across supported languages
 4. Validate balance formatting with various locale settings
*/

/// Account type classification with string conversion support
/// Addresses requirement: Financial institution integration and account aggregation
@frozen
public enum AccountType: String, Codable {
    case checking
    case savings
    case credit
    case investment
    case loan
    case other
    
    /// Converts account type to localized display string
    /// - Returns: Human readable account type string
    public func toString() -> String {
        switch self {
        case .checking:
            return NSLocalizedString("Checking", comment: "Checking account type")
        case .savings:
            return NSLocalizedString("Savings", comment: "Savings account type")
        case .credit:
            return NSLocalizedString("Credit", comment: "Credit account type")
        case .investment:
            return NSLocalizedString("Investment", comment: "Investment account type")
        case .loan:
            return NSLocalizedString("Loan", comment: "Loan account type")
        case .other:
            return NSLocalizedString("Other", comment: "Other account type")
        }
    }
}

/// Domain model representing a financial account with comprehensive property access
/// Addresses requirements:
/// - Native iOS application using Swift and SwiftUI
/// - Local SQLite database for offline data
public struct Account: Identifiable, Codable, Equatable {
    // MARK: - Properties
    
    /// Unique identifier for the account
    public let id: String
    
    /// Identifier for the associated financial institution
    public let institutionId: String
    
    /// Display name of the account
    public let name: String
    
    /// Optional name of the financial institution
    public let institutionName: String?
    
    /// Classification of the account type
    public let type: AccountType
    
    /// Current balance of the account
    public let balance: Decimal
    
    /// Currency code for the account (e.g., "USD", "EUR")
    public let currency: String
    
    /// Timestamp of the last successful sync
    public let lastSynced: Date
    
    /// Flag indicating if the account is currently active
    public let isActive: Bool
    
    // MARK: - Initialization
    
    public init(
        id: String,
        institutionId: String,
        name: String,
        institutionName: String? = nil,
        type: AccountType,
        balance: Decimal,
        currency: String,
        lastSynced: Date,
        isActive: Bool = true
    ) {
        self.id = id
        self.institutionId = institutionId
        self.name = name
        self.institutionName = institutionName
        self.type = type
        self.balance = balance
        self.currency = currency
        self.lastSynced = lastSynced
        self.isActive = isActive
    }
    
    // MARK: - Public Methods
    
    /// Returns the account balance formatted as currency using CurrencyFormatter
    /// - Returns: Locale-aware formatted balance with currency symbol
    public func formattedBalance() -> String {
        return CurrencyFormatter.shared.formatAmount(balance)
    }
    
    // MARK: - Equatable
    
    public static func == (lhs: Account, rhs: Account) -> Bool {
        return lhs.id == rhs.id &&
               lhs.institutionId == rhs.institutionId &&
               lhs.name == rhs.name &&
               lhs.institutionName == rhs.institutionName &&
               lhs.type == rhs.type &&
               lhs.balance == rhs.balance &&
               lhs.currency == rhs.currency &&
               lhs.lastSynced == rhs.lastSynced &&
               lhs.isActive == rhs.isActive
    }
}