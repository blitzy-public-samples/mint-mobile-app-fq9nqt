//
// User.swift
// MintReplicaLite
//
// Core domain model representing a user with authentication and preferences
//

import Foundation // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Verify biometric authentication hardware availability on device
 2. Configure keychain access for secure user data storage
 3. Test currency formatting with various locale settings
 4. Validate email verification flow integration
*/

/// Core domain model representing a user with secure biometric settings support
/// Addresses requirements:
/// - Secure user authentication and account management (1.2 Scope/Core Features)
/// - Data export and reporting capabilities (1.2 Scope/Core Features)
@frozen
public class User {
    // MARK: - Properties
    
    /// Unique identifier for the user
    public let id: UUID
    
    /// User's email address for authentication and communication
    public let email: String
    
    /// User's first name
    public let firstName: String
    
    /// User's last name
    public let lastName: String
    
    /// Timestamp when the user account was created
    public let createdAt: Date
    
    /// Timestamp of user's last login
    public var lastLoginAt: Date
    
    /// Flag indicating if user's email has been verified
    public var isEmailVerified: Bool
    
    /// Flag indicating if biometric authentication is enabled
    public var hasBiometricEnabled: Bool
    
    /// User's preferred currency for financial data display
    public var preferredCurrency: String
    
    /// Dictionary storing user preferences
    public var preferences: [String: Any]
    
    /// Timeout duration for biometric authentication
    public var biometricTimeout: TimeInterval
    
    // MARK: - Initialization
    
    /// Initializes a new User instance with required fields and default preferences
    /// - Parameters:
    ///   - id: Unique identifier for the user
    ///   - email: User's email address
    ///   - firstName: User's first name
    ///   - lastName: User's last name
    public init(id: UUID, email: String, firstName: String, lastName: String) {
        self.id = id
        self.email = email
        self.firstName = firstName
        self.lastName = lastName
        
        // Set creation and login timestamps
        self.createdAt = Date()
        self.lastLoginAt = Date()
        
        // Initialize default values
        self.isEmailVerified = false
        self.hasBiometricEnabled = false
        self.preferredCurrency = "USD"
        self.preferences = [:]
        
        // Set biometric timeout from AppConstants
        self.biometricTimeout = AppConstants.Security.biometric_timeout
    }
    
    // MARK: - Public Methods
    
    /// Returns user's full name by combining first and last name
    /// - Returns: Concatenated first and last name with space
    public func fullName() -> String {
        return "\(firstName) \(lastName)".trimmingCharacters(in: .whitespaces)
    }
    
    /// Updates a user preference value with validation
    /// - Parameters:
    ///   - key: Preference key to update
    ///   - value: New value for the preference
    public func updatePreference(key: String, value: Any) {
        // Validate value type based on preference key
        switch key {
        case "currency_display":
            guard let amount = value as? Decimal else { return }
            // Format currency using CurrencyFormatter
            preferences[key] = CurrencyFormatter.shared.formatAmount(amount)
            
        case "notification_enabled", "dark_mode_enabled", "export_enabled":
            guard let boolValue = value as? Bool else { return }
            preferences[key] = boolValue
            
        case "refresh_interval", "cache_duration":
            guard let timeValue = value as? TimeInterval else { return }
            preferences[key] = timeValue
            
        default:
            // Store value as is for custom preferences
            preferences[key] = value
        }
        
        // Notify preference change observers (implement notification mechanism)
        NotificationCenter.default.post(
            name: NSNotification.Name("UserPreferencesDidChange"),
            object: self,
            userInfo: ["key": key, "value": value]
        )
    }
    
    /// Toggles biometric authentication setting with timeout configuration
    /// - Parameter enabled: New state for biometric authentication
    public func toggleBiometric(enabled: Bool) {
        self.hasBiometricEnabled = enabled
        
        // Update biometric timeout from AppConstants
        self.biometricTimeout = AppConstants.Security.biometric_timeout
        
        // Update security preferences
        updatePreference(key: "biometric_enabled", value: enabled)
        updatePreference(key: "biometric_timeout", value: biometricTimeout)
        
        // Notify security setting change
        NotificationCenter.default.post(
            name: NSNotification.Name("UserSecuritySettingsDidChange"),
            object: self,
            userInfo: ["biometricEnabled": enabled]
        )
    }
}

// MARK: - Equatable Conformance
extension User: Equatable {
    public static func == (lhs: User, rhs: User) -> Bool {
        return lhs.id == rhs.id
    }
}

// MARK: - Hashable Conformance
extension User: Hashable {
    public func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

// MARK: - CustomStringConvertible Conformance
extension User: CustomStringConvertible {
    public var description: String {
        return "User(id: \(id), email: \(email), name: \(fullName()))"
    }
}