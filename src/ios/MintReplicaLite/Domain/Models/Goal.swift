//
// Goal.swift
// MintReplicaLite
//
// Core domain model for financial goal tracking
//

import Foundation // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Verify timezone handling for deadline calculations
 2. Test goal progress notifications integration
 3. Validate currency formatting across different locales
 4. Review goal status transition logic for edge cases
*/

/// Represents different categories of financial goals
/// Addresses requirement: Financial goal setting and progress monitoring
@frozen
public enum GoalCategory: String, Codable {
    case savings
    case investment
    case debt
    case purchase
    case emergency
}

/// Represents the current status of a financial goal
/// Addresses requirement: Financial goal setting and progress monitoring
@frozen
public enum GoalStatus: String, Codable {
    case notStarted
    case inProgress
    case completed
    case overdue
}

/// Core domain model representing a financial goal with tracking capabilities
/// Addresses requirements:
/// - Financial goal setting and progress monitoring
/// - Mobile Applications (Native iOS using Swift)
@frozen
public class Goal {
    
    // MARK: - Properties
    
    public let id: UUID
    public let name: String
    public let description: String
    public let targetAmount: Decimal
    public private(set) var currentAmount: Decimal
    public let deadline: Date
    public let createdAt: Date
    public private(set) var completedAt: Date?
    public private(set) var status: GoalStatus
    public let category: GoalCategory
    
    // MARK: - Initialization
    
    /// Initializes a new financial goal with validation
    /// - Parameters:
    ///   - id: Unique identifier for the goal
    ///   - name: Display name of the goal
    ///   - description: Detailed description of the goal
    ///   - targetAmount: Target amount to achieve
    ///   - currentAmount: Current progress amount
    ///   - deadline: Target completion date
    ///   - category: Category of the financial goal
    /// - Throws: ValidationError if parameters are invalid
    public init(id: UUID = UUID(),
                name: String,
                description: String,
                targetAmount: Decimal,
                currentAmount: Decimal,
                deadline: Date,
                category: GoalCategory) throws {
        
        // Validate target amount
        guard targetAmount > 0 else {
            throw ValidationError.invalidAmount("Target amount must be greater than zero")
        }
        
        // Validate deadline is in future
        guard deadline > Date() else {
            throw ValidationError.invalidDate("Deadline must be in the future")
        }
        
        // Validate current amount
        guard currentAmount >= 0 else {
            throw ValidationError.invalidAmount("Current amount cannot be negative")
        }
        
        self.id = id
        self.name = name
        self.description = description
        self.targetAmount = targetAmount
        self.currentAmount = currentAmount
        self.deadline = deadline
        self.category = category
        self.createdAt = Date()
        self.completedAt = nil
        
        // Initialize status based on current progress
        if currentAmount >= targetAmount {
            self.status = .completed
            self.completedAt = Date()
        } else if currentAmount > 0 {
            self.status = .inProgress
        } else {
            self.status = .notStarted
        }
    }
    
    // MARK: - Public Methods
    
    /// Updates the current progress amount and status
    /// - Parameter amount: New current amount
    /// - Throws: ValidationError if amount is invalid
    public func updateProgress(_ amount: Decimal) throws {
        // Validate amount
        guard amount >= 0 else {
            throw ValidationError.invalidAmount("Progress amount cannot be negative")
        }
        
        // Update current amount
        currentAmount = amount
        
        // Update status based on progress
        if currentAmount >= targetAmount {
            status = .completed
            completedAt = Date()
        } else if currentAmount > 0 {
            status = .inProgress
        } else {
            status = .notStarted
        }
        
        // Check if goal is overdue
        if Date() > deadline && status != .completed {
            status = .overdue
        }
    }
    
    /// Returns formatted target amount string using locale-aware formatting
    /// - Returns: Formatted currency string
    public func formattedTargetAmount() -> String {
        return CurrencyFormatter.shared.formatAmount(targetAmount)
    }
    
    /// Returns formatted current amount string using locale-aware formatting
    /// - Returns: Formatted currency string
    public func formattedCurrentAmount() -> String {
        return CurrencyFormatter.shared.formatAmount(currentAmount)
    }
    
    /// Calculates current progress percentage
    /// - Returns: Progress percentage between 0 and 100
    public func progressPercentage() -> Double {
        guard targetAmount > 0 else { return 0 }
        
        let progress = Double(truncating: (currentAmount / targetAmount) as NSNumber) * 100
        return min(max(round(progress * 100) / 100, 0), 100)
    }
    
    /// Calculates remaining days until deadline with timezone awareness
    /// - Returns: Number of days remaining (0 if deadline has passed)
    public func daysRemaining() -> Int {
        let calendar = Calendar.current
        let now = Date()
        
        guard deadline > now else { return 0 }
        
        let components = calendar.dateComponents([.day], from: now, to: deadline)
        return components.day ?? 0
    }
}

// MARK: - Validation Error

/// Error type for goal validation failures
private enum ValidationError: LocalizedError {
    case invalidAmount(String)
    case invalidDate(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidAmount(let message),
             .invalidDate(let message):
            return message
        }
    }
}

// MARK: - Equatable

extension Goal: Equatable {
    public static func == (lhs: Goal, rhs: Goal) -> Bool {
        return lhs.id == rhs.id
    }
}

// MARK: - Hashable

extension Goal: Hashable {
    public func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}