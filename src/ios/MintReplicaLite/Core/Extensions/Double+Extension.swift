//
// Double+Extension.swift
// MintReplicaLite
//
// Extension providing utility functions for financial calculations and formatting
//

import Foundation // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Ensure proper locale settings are configured in the device/simulator for accurate currency formatting
 2. Verify that the app's Info.plist includes necessary locale and currency formatting permissions
 3. Test with various regional settings to ensure proper currency symbol display
*/

extension Double {
    /// Rounds a double value to specified decimal places using banker's rounding
    /// Addresses requirement: Transaction tracking and categorization - Precise decimal handling
    /// - Parameter places: Number of decimal places to round to
    /// - Returns: Rounded value with specified decimal places
    func roundToDecimal(_ places: Int) -> Double {
        guard places >= 0 else { return self }
        
        let multiplier = pow(10.0, Double(places))
        return (self * multiplier).rounded(.toNearestOrEven) / multiplier
    }
    
    /// Converts double value to formatted currency string using device locale
    /// Addresses requirement: Transaction tracking and categorization - Consistent currency formatting
    /// - Returns: Locale-aware formatted currency string
    func toCurrency() -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.minimumFractionDigits = 2
        formatter.maximumFractionDigits = 2
        
        // Convert to NSDecimal for precise financial calculations
        let decimal = Decimal(self)
        return formatter.string(from: decimal as NSNumber) ?? "$0.00"
    }
    
    /// Converts double value to percentage string with specified precision
    /// Addresses requirement: Investment portfolio tracking - Performance metrics formatting
    /// - Parameter decimalPlaces: Number of decimal places for percentage precision
    /// - Returns: Formatted percentage string with % symbol
    func toPercentage(decimalPlaces: Int = 2) -> String {
        let roundedValue = (self * 100).roundToDecimal(decimalPlaces)
        
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = decimalPlaces
        formatter.maximumFractionDigits = decimalPlaces
        
        if let formattedNumber = formatter.string(from: NSNumber(value: roundedValue)) {
            return "\(formattedNumber)%"
        }
        return "0%"
    }
    
    /// Converts large numbers to compact format (K, M, B)
    /// Addresses requirement: Budget creation and monitoring - Readable large value display
    /// - Returns: Compact string representation with appropriate suffix
    func toCompactString() -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 1
        
        let absValue = abs(self)
        let sign = self < 0 ? "-" : ""
        
        switch absValue {
        case 0..<1000:
            return formatter.string(from: NSNumber(value: self)) ?? "0"
            
        case 1000..<1_000_000:
            let value = absValue / 1000
            return sign + (formatter.string(from: NSNumber(value: value)) ?? "0") + "K"
            
        case 1_000_000..<1_000_000_000:
            let value = absValue / 1_000_000
            return sign + (formatter.string(from: NSNumber(value: value)) ?? "0") + "M"
            
        default:
            let value = absValue / 1_000_000_000
            return sign + (formatter.string(from: NSNumber(value: value)) ?? "0") + "B"
        }
    }
}