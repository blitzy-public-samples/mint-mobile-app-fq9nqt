//
// Date+Extension.swift
// MintReplicaLite
//
// Extension providing date utility functions for transaction display and processing
//

// Foundation - iOS 14.0+
import Foundation

// MARK: - Date Extension
extension Date {
    
    /// Converts a Date to a user-friendly display format using the user's locale settings
    /// Requirements addressed:
    /// - Transaction tracking and categorization (1.2 Scope/Core Features)
    /// - Native iOS date handling utilities (5.2.1 Mobile Applications)
    func toDisplayFormat() -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        formatter.locale = Locale.current
        return formatter.string(from: self)
    }
    
    /// Returns the first day of the month for the current date
    /// Requirements addressed:
    /// - Data Architecture (5.2.4 Data Architecture)
    func startOfMonth() -> Date {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month], from: self)
        return calendar.date(from: components) ?? self
    }
    
    /// Returns the last day of the month for the current date
    /// Requirements addressed:
    /// - Data Architecture (5.2.4 Data Architecture)
    func endOfMonth() -> Date {
        let calendar = Calendar.current
        var components = DateComponents()
        components.month = 1
        components.day = -1
        return calendar.date(byAdding: components, to: self.startOfMonth()) ?? self
    }
    
    /// Adds specified number of days to the date
    /// Requirements addressed:
    /// - Transaction tracking and categorization (1.2 Scope/Core Features)
    func addDays(_ days: Int) -> Date {
        let calendar = Calendar.current
        var components = DateComponents()
        components.day = days
        return calendar.date(byAdding: components, to: self) ?? self
    }
    
    /// Subtracts specified number of days from the date
    /// Requirements addressed:
    /// - Transaction tracking and categorization (1.2 Scope/Core Features)
    func subtractDays(_ days: Int) -> Date {
        return addDays(-days)
    }
    
    /// Checks if date is between two other dates (inclusive)
    /// Requirements addressed:
    /// - Transaction tracking and categorization (1.2 Scope/Core Features)
    /// - Data Architecture (5.2.4 Data Architecture)
    func isBetween(_ startDate: Date, _ endDate: Date) -> Bool {
        let startComparison = self.compare(startDate)
        let endComparison = self.compare(endDate)
        
        return (startComparison == .orderedSame || startComparison == .orderedDescending) &&
               (endComparison == .orderedSame || endComparison == .orderedAscending)
    }
    
    /// Calculates the number of days between two dates
    /// Requirements addressed:
    /// - Transaction tracking and categorization (1.2 Scope/Core Features)
    /// - Data Architecture (5.2.4 Data Architecture)
    func differenceInDays(from otherDate: Date) -> Int {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.day], from: otherDate, to: self)
        return components.day ?? 0
    }
}