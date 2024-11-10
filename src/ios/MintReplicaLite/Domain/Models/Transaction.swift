//
// Transaction.swift
// MintReplicaLite
//
// Core domain model for financial transactions with comprehensive tracking and categorization
//

import Foundation // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Verify locale settings for accurate currency formatting
 2. Test with various transaction types to ensure proper sign handling
 3. Validate date formatting across different regional settings
 4. Ensure proper category validation rules are in place
*/

/// Enumeration of possible transaction types for categorization
/// Requirements addressed:
/// - Transaction tracking and categorization (1.2 Scope/Core Features)
public enum TransactionType: String, Codable {
    case debit
    case credit
    case transfer
    case refund
}

/// Model representing a financial transaction with comprehensive details
/// Requirements addressed:
/// - Transaction tracking and categorization (1.2 Scope/Core Features)
/// - Native mobile applications (5.2.1 Mobile Applications)
/// - Data Architecture (5.2.4 Data Architecture)
public class Transaction {
    
    // MARK: - Properties
    
    /// Unique identifier for the transaction
    public let id: UUID
    
    /// Description of the transaction
    public let description: String
    
    /// Transaction amount with precise decimal handling
    public let amount: Decimal
    
    /// Date when the transaction occurred
    public let date: Date
    
    /// Category for transaction classification
    public let category: String
    
    /// Associated account identifier
    public let accountId: String
    
    /// Flag indicating if transaction is pending
    public let isPending: Bool
    
    /// Optional merchant name
    public let merchantName: String?
    
    /// Optional transaction notes
    public let notes: String?
    
    /// Type of transaction (debit, credit, transfer, refund)
    public let type: TransactionType
    
    // MARK: - Initialization
    
    /// Initializes a new Transaction instance with validation
    /// - Parameters:
    ///   - id: Unique identifier for the transaction
    ///   - description: Description of the transaction
    ///   - amount: Transaction amount
    ///   - date: Transaction date
    ///   - category: Transaction category
    ///   - accountId: Associated account identifier
    ///   - isPending: Pending status flag
    ///   - merchantName: Optional merchant name
    ///   - notes: Optional transaction notes
    ///   - type: Type of transaction
    /// - Throws: ValidationError if input parameters are invalid
    public init(
        id: UUID,
        description: String,
        amount: Decimal,
        date: Date,
        category: String,
        accountId: String,
        isPending: Bool,
        merchantName: String? = nil,
        notes: String? = nil,
        type: TransactionType
    ) throws {
        // Validate amount is not zero
        let amountDouble = (amount as NSDecimalNumber).doubleValue
        guard amountDouble.roundToDecimal(2) != 0 else {
            throw ValidationError.invalidAmount("Transaction amount cannot be zero")
        }
        
        // Validate date is not in future
        guard date <= Date() else {
            throw ValidationError.invalidDate("Transaction date cannot be in the future")
        }
        
        // Validate category is not empty
        guard !category.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw ValidationError.invalidCategory("Transaction category cannot be empty")
        }
        
        self.id = id
        self.description = description
        self.amount = amount
        self.date = date
        self.category = category
        self.accountId = accountId
        self.isPending = isPending
        self.merchantName = merchantName
        self.notes = notes
        self.type = type
    }
    
    // MARK: - Public Methods
    
    /// Returns the transaction amount as a formatted currency string
    /// Requirements addressed:
    /// - Transaction tracking and categorization (1.2 Scope/Core Features)
    public func formattedAmount() -> String {
        let formattedAmount = CurrencyFormatter.shared.formatAmount(abs(amount))
        
        switch type {
        case .debit:
            return "-" + formattedAmount
        case .credit, .refund:
            return "+" + formattedAmount
        case .transfer:
            return formattedAmount
        }
    }
    
    /// Returns the transaction date in user-friendly localized format
    /// Requirements addressed:
    /// - Native mobile applications (5.2.1 Mobile Applications)
    public func formattedDate() -> String {
        return date.toDisplayFormat()
    }
    
    /// Determines if transaction is an expense based on type and amount
    /// Requirements addressed:
    /// - Transaction tracking and categorization (1.2 Scope/Core Features)
    public func isExpense() -> Bool {
        switch type {
        case .debit:
            return true
        case .credit, .refund:
            return false
        case .transfer:
            return amount < 0
        }
    }
}

// MARK: - Validation Error

/// Error types for transaction validation
private enum ValidationError: Error {
    case invalidAmount(String)
    case invalidDate(String)
    case invalidCategory(String)
}

// MARK: - Equatable

extension Transaction: Equatable {
    public static func == (lhs: Transaction, rhs: Transaction) -> Bool {
        return lhs.id == rhs.id
    }
}

// MARK: - Hashable

extension Transaction: Hashable {
    public func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

// MARK: - Codable

extension Transaction: Codable {
    private enum CodingKeys: String, CodingKey {
        case id, description, amount, date, category, accountId
        case isPending, merchantName, notes, type
    }
}