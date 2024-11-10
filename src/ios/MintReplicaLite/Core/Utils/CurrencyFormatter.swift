//
// CurrencyFormatter.swift
// MintReplicaLite
//
// Utility class providing standardized currency formatting functionality
//

import Foundation // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Verify device locale settings for accurate currency formatting
 2. Test with various regional settings to ensure proper symbol placement
 3. Validate decimal separator behavior across different locales
 4. Ensure thread safety when accessing shared formatter instance
*/

/// Singleton class providing thread-safe currency formatting functionality with locale awareness
/// Addresses requirements:
/// - Transaction tracking and categorization: Standardized currency formatting
/// - Budget creation and monitoring: Consistent currency display
/// - Investment portfolio tracking: Locale-aware formatting
final class CurrencyFormatter {
    
    // MARK: - Singleton
    
    /// Shared instance for app-wide currency formatting
    static let shared = CurrencyFormatter()
    
    // MARK: - Properties
    
    /// Thread-safe number formatter for currency operations
    private let formatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.minimumFractionDigits = 2
        formatter.maximumFractionDigits = 2
        formatter.isLenient = true
        formatter.generatesDecimalNumbers = true
        return formatter
    }()
    
    /// Current locale for formatting operations
    private var currentLocale: Locale {
        didSet {
            updateFormatterLocale()
        }
    }
    
    // MARK: - Initialization
    
    private init() {
        self.currentLocale = Locale.current
        updateFormatterLocale()
    }
    
    // MARK: - Public Methods
    
    /// Formats a decimal number as currency string according to current locale
    /// - Parameter amount: The decimal amount to format
    /// - Returns: Locale-aware formatted currency string with symbol
    func formatAmount(_ amount: Decimal) -> String {
        // Use thread-safe access to formatter
        objc_sync_enter(formatter)
        defer { objc_sync_exit(formatter) }
        
        // Convert to double for precise rounding using extension
        let roundedAmount = (amount as NSDecimalNumber).doubleValue.roundToDecimal(2)
        
        // Format the rounded amount
        if let formattedString = formatter.string(from: NSDecimalNumber(value: roundedAmount)) {
            return formattedString
        }
        
        // Fallback format for error cases
        return formatter.currencySymbol + "0.00"
    }
    
    /// Formats amount without currency symbol while maintaining locale-specific number formatting
    /// - Parameter amount: The decimal amount to format
    /// - Returns: Locale-aware formatted number string without currency symbol
    func formatAmountWithoutSymbol(_ amount: Decimal) -> String {
        objc_sync_enter(formatter)
        defer { objc_sync_exit(formatter) }
        
        // Temporarily disable currency symbol
        let originalSymbol = formatter.currencySymbol
        formatter.currencySymbol = ""
        
        // Convert and round the amount
        let roundedAmount = (amount as NSDecimalNumber).doubleValue.roundToDecimal(2)
        
        // Format without currency symbol
        let formattedString = formatter.string(from: NSDecimalNumber(value: roundedAmount)) ?? "0.00"
        
        // Restore original currency symbol
        formatter.currencySymbol = originalSymbol
        
        return formattedString
    }
    
    /// Updates formatter locale settings while maintaining formatting consistency
    /// - Parameter locale: New locale to use for formatting
    func updateLocale(_ locale: Locale) {
        objc_sync_enter(formatter)
        defer { objc_sync_exit(formatter) }
        
        currentLocale = locale
    }
    
    // MARK: - Private Methods
    
    /// Updates formatter configuration for new locale
    private func updateFormatterLocale() {
        formatter.locale = currentLocale
        
        // Configure locale-specific formatting
        formatter.groupingSeparator = currentLocale.groupingSeparator
        formatter.decimalSeparator = currentLocale.decimalSeparator
        
        // Update currency symbol based on locale
        if let currencyCode = currentLocale.currencyCode {
            formatter.currencyCode = currencyCode
        }
        
        // Configure symbol placement based on locale preferences
        formatter.currencySymbolPlacement = currentLocale.languageCode?.contains("en") == true 
            ? .prefix 
            : .suffix
    }
}