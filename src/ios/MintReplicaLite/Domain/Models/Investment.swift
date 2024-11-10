//
// Investment.swift
// MintReplicaLite
//
// Domain model representing an investment holding with performance calculations
//

import Foundation // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Verify SQLite database schema matches Investment model properties
 2. Test performance calculations with large datasets
 3. Validate currency formatting across different locales
 4. Ensure thread safety for concurrent investment updates
*/

/// Investment types supported by the application
@frozen
public enum InvestmentType: String {
    case stock
    case bond
    case etf
    case mutualFund
    case crypto
    case other
}

/// Domain model representing an investment holding with performance calculations
/// Addresses requirements:
/// - Investment Portfolio Tracking: Basic investment portfolio tracking functionality
/// - Data Model: Native data models for iOS platform
@frozen
public final class Investment: Identifiable, Equatable, Hashable {
    
    // MARK: - Properties
    
    public let id: String
    public let symbol: String
    public let name: String
    public var quantity: Double
    public var costBasis: Double
    public var currentPrice: Double
    public let accountId: String
    public let lastUpdated: Date
    public let type: InvestmentType
    
    // MARK: - Initialization
    
    /// Initializes a new investment instance with required properties
    /// - Parameters:
    ///   - id: Unique identifier for the investment
    ///   - symbol: Trading symbol or ticker
    ///   - name: Full name of the investment
    ///   - quantity: Number of shares or units held
    ///   - costBasis: Average cost per share/unit
    ///   - currentPrice: Current market price per share/unit
    ///   - accountId: Associated account identifier
    ///   - type: Type of investment
    public init(
        id: String,
        symbol: String,
        name: String,
        quantity: Double,
        costBasis: Double,
        currentPrice: Double,
        accountId: String,
        type: InvestmentType
    ) {
        self.id = id
        self.symbol = symbol
        self.name = name
        self.quantity = quantity
        self.costBasis = costBasis
        self.currentPrice = currentPrice
        self.accountId = accountId
        self.type = type
        self.lastUpdated = Date()
    }
    
    // MARK: - Performance Calculations
    
    /// Calculates the current market value of the investment
    /// - Returns: Current market value rounded to 2 decimal places
    public func currentValue() -> Double {
        let value = quantity * currentPrice
        return (value * 100).rounded() / 100
    }
    
    /// Calculates the total return on investment (profit/loss)
    /// - Returns: Total return amount rounded to 2 decimal places
    public func totalReturn() -> Double {
        let totalCost = quantity * costBasis
        let currentVal = currentValue()
        let returnAmount = currentVal - totalCost
        return (returnAmount * 100).rounded() / 100
    }
    
    /// Calculates the percentage return on investment
    /// - Returns: Return percentage rounded to 2 decimal places
    public func returnPercentage() -> Double {
        let totalCost = quantity * costBasis
        guard totalCost > 0 else { return 0.0 }
        
        let returnAmount = totalReturn()
        let percentage = (returnAmount / totalCost) * 100
        return (percentage * 100).rounded() / 100
    }
    
    /// Returns the formatted current value as locale-aware currency string
    /// - Returns: Formatted currency string with proper locale and symbol
    public func formattedCurrentValue() -> String {
        let value = currentValue()
        return CurrencyFormatter.shared.formatAmount(Decimal(value))
    }
    
    // MARK: - Hashable & Equatable
    
    public func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    public static func == (lhs: Investment, rhs: Investment) -> Bool {
        lhs.id == rhs.id
    }
}