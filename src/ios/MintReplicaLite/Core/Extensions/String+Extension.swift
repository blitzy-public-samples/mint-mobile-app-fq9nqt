//
// String+Extension.swift
// MintReplicaLite
//
// String extension providing secure financial data handling and validation
//

import Foundation // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Verify email regex pattern matches current RFC standards
 2. Test password validation with security team's requirements
 3. Validate currency handling with different locale settings
 4. Review special character filtering rules with security team
*/

// MARK: - String Extension
extension String {
    // MARK: - Email Validation
    /// Validates if the string is a properly formatted email address using RFC 5322 compliant regex
    /// Addresses requirement: Data Security - Implements secure string handling with proper validation
    var isValidEmail: Bool {
        let emailRegex = """
            ^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21\\x23-\\x5b\\x5d-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21-\\x5a\\x53-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])+)\\])$
            """
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: self)
    }
    
    // MARK: - Password Validation
    /// Validates if the string meets password security requirements
    /// Addresses requirement: Data Security - Secure string handling with proper validation
    var isValidPassword: Bool {
        // Check minimum length
        guard self.count >= 8 else { return false }
        
        // Define character sets
        let uppercaseLetters = CharacterSet.uppercaseLetters
        let lowercaseLetters = CharacterSet.lowercaseLetters
        let numbers = CharacterSet.decimalDigits
        let specialCharacters = CharacterSet(charactersIn: "!@#$%^&*()_+-=[]{}|;:,.<>?")
        
        // Convert string to character set for comparison
        let stringCharSet = CharacterSet(charactersIn: self)
        
        // Verify all required character types are present
        let hasUppercase = !stringCharSet.intersection(uppercaseLetters).isEmpty
        let hasLowercase = !stringCharSet.intersection(lowercaseLetters).isEmpty
        let hasNumbers = !stringCharSet.intersection(numbers).isEmpty
        let hasSpecialChars = !stringCharSet.intersection(specialCharacters).isEmpty
        
        return hasUppercase && hasLowercase && hasNumbers && hasSpecialChars
    }
    
    // MARK: - Currency Handling
    /// Converts string to currency amount using CurrencyFormatter
    /// Addresses requirement: Transaction tracking and categorization - String manipulation for financial data
    var toCurrencyAmount: Decimal? {
        // Remove currency symbols and whitespace
        let cleanString = self.trimmingCharacters(in: .whitespacesAndNewlines)
            .components(separatedBy: CharacterSet.letters.union(CharacterSet(charactersIn: "$€£¥")))
            .joined()
        
        // Create number formatter for parsing
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.locale = Locale.current
        
        // Attempt to convert string to number
        if let number = formatter.number(from: cleanString) {
            let decimal = Decimal(string: number.stringValue)
            // Validate decimal places (max 2 for standard currency)
            if let amount = decimal, NSDecimalNumber(decimal: amount).doubleValue.truncatingRemainder(dividingBy: 0.01) == 0 {
                return amount
            }
        }
        
        return nil
    }
    
    // MARK: - String Truncation
    /// Truncates string to specified length with ellipsis
    /// Addresses requirement: Mobile Applications - Native iOS string handling for optimal UX
    func truncate(maxLength: Int) -> String {
        guard self.count > maxLength else { return self }
        
        let index = self.index(self.startIndex, offsetBy: maxLength - 3)
        return String(self[..<index]) + "..."
    }
    
    // MARK: - Special Character Handling
    /// Removes special characters from string for security and data sanitization
    /// Addresses requirement: Data Security - Secure string handling with sanitization
    var removingSpecialCharacters: String {
        // Define allowed character set (alphanumeric and basic punctuation)
        let allowedCharacters = CharacterSet.alphanumerics
            .union(CharacterSet.whitespaces)
            .union(CharacterSet(charactersIn: ".,!?-_@"))
        
        // Filter string components
        return self.components(separatedBy: allowedCharacters.inverted)
            .joined()
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
}