// Foundation version: iOS 14.0+
import Foundation
// Security version: iOS 14.0+
import Security

// MARK: - Human Tasks
/*
1. Verify keychain access group matches your app's entitlements configuration
2. Ensure proper keychain sharing entitlements are enabled in Xcode if using shared keychain
3. Test keychain persistence across app reinstalls
4. Verify keychain accessibility settings match security requirements
*/

/// Thread-safe singleton class managing secure storage and retrieval of sensitive data using iOS Keychain Services
/// with proper error handling
@available(iOS 14.0, *)
final class KeychainManager {
    
    // MARK: - Constants
    private let serviceName = "com.mintreplica.lite.keychain"
    private let accessGroup = "com.mintreplica.lite.shared"
    
    // MARK: - Properties
    /// Shared singleton instance
    static let shared = KeychainManager()
    
    /// Concurrent queue for thread-safe operations
    private let queue: DispatchQueue
    
    // MARK: - Error Types
    enum KeychainError: Error {
        case dataConversionError
        case duplicateItem
        case itemNotFound
        case unhandledError(status: OSStatus)
    }
    
    // MARK: - Initialization
    private init() {
        // Initialize concurrent dispatch queue for thread-safe operations
        self.queue = DispatchQueue(label: "com.mintreplica.lite.keychain.queue",
                                 attributes: .concurrent)
        
        // Configure default keychain accessibility
        setDefaultKeychainAccessibility()
    }
    
    // MARK: - Private Methods
    private func setDefaultKeychainAccessibility() {
        // Set default keychain accessibility to afterFirstUnlock for better security
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]
        
        if !accessGroup.isEmpty {
            query[kSecAttrAccessGroup as String] = accessGroup
        }
        
        SecItemAdd(query as CFDictionary, nil)
    }
    
    // MARK: - Public Methods
    
    /// Saves data securely to the keychain with proper access control
    /// - Parameters:
    ///   - data: Data to be stored in keychain
    ///   - key: Unique identifier for the stored data
    /// - Returns: Result indicating success or detailed error information
    func save(data: Data, key: String) -> Result<Void, Error> {
        return queue.sync {
            // Create keychain query dictionary with item class
            var query: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrAccount as String: key,
                kSecAttrService as String: serviceName,
                kSecValueData as String: data,
                kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
            ]
            
            // Add access group for shared keychain access
            if !accessGroup.isEmpty {
                query[kSecAttrAccessGroup as String] = accessGroup
            }
            
            // Attempt to save data to keychain synchronously
            let status = SecItemAdd(query as CFDictionary, nil)
            
            // Handle potential keychain errors
            switch status {
            case errSecSuccess:
                return .success(())
            case errSecDuplicateItem:
                // If item exists, update it
                let updateQuery: [String: Any] = [
                    kSecClass as String: kSecClassGenericPassword,
                    kSecAttrAccount as String: key,
                    kSecAttrService as String: serviceName
                ]
                
                let updateAttributes: [String: Any] = [
                    kSecValueData as String: data
                ]
                
                let updateStatus = SecItemUpdate(updateQuery as CFDictionary,
                                               updateAttributes as CFDictionary)
                
                if updateStatus == errSecSuccess {
                    return .success(())
                } else {
                    return .failure(KeychainError.unhandledError(status: updateStatus))
                }
            default:
                return .failure(KeychainError.unhandledError(status: status))
            }
        }
    }
    
    /// Retrieves data from the keychain with thread safety
    /// - Parameter key: Unique identifier for the stored data
    /// - Returns: Retrieved data or detailed error information
    func retrieve(key: String) -> Result<Data?, Error> {
        return queue.sync {
            // Create keychain query dictionary with search parameters
            var query: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrAccount as String: key,
                kSecAttrService as String: serviceName,
                kSecReturnData as String: true
            ]
            
            // Add access group for shared keychain access
            if !accessGroup.isEmpty {
                query[kSecAttrAccessGroup as String] = accessGroup
            }
            
            // Configure query for data retrieval
            var result: AnyObject?
            let status = SecItemCopyMatching(query as CFDictionary, &result)
            
            // Handle potential keychain errors
            switch status {
            case errSecSuccess:
                guard let data = result as? Data else {
                    return .failure(KeychainError.dataConversionError)
                }
                return .success(data)
            case errSecItemNotFound:
                return .success(nil)
            default:
                return .failure(KeychainError.unhandledError(status: status))
            }
        }
    }
    
    /// Deletes data from the keychain securely
    /// - Parameter key: Unique identifier for the stored data
    /// - Returns: Success or failure with detailed error information
    func delete(key: String) -> Result<Void, Error> {
        return queue.sync {
            // Create keychain query dictionary with item identifier
            var query: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrAccount as String: key,
                kSecAttrService as String: serviceName
            ]
            
            // Add access group for shared keychain access
            if !accessGroup.isEmpty {
                query[kSecAttrAccessGroup as String] = accessGroup
            }
            
            // Attempt to delete item from keychain synchronously
            let status = SecItemDelete(query as CFDictionary)
            
            // Handle potential keychain errors
            switch status {
            case errSecSuccess, errSecItemNotFound:
                return .success(())
            default:
                return .failure(KeychainError.unhandledError(status: status))
            }
        }
    }
    
    /// Removes all keychain items for the app securely
    /// - Returns: Success or failure with detailed error information
    func clear() -> Result<Void, Error> {
        return queue.sync {
            // Create keychain query dictionary with service name
            var query: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: serviceName
            ]
            
            // Add access group identifier
            if !accessGroup.isEmpty {
                query[kSecAttrAccessGroup as String] = accessGroup
            }
            
            // Attempt to delete all matching items synchronously
            let status = SecItemDelete(query as CFDictionary)
            
            // Handle potential keychain errors
            switch status {
            case errSecSuccess, errSecItemNotFound:
                return .success(())
            default:
                return .failure(KeychainError.unhandledError(status: status))
            }
        }
    }
}

// MARK: - Requirements Implementation Comments
/*
 Requirement: Secure keychain integration (5.2.1 Mobile Applications)
 Implementation: Integrated iOS keychain services with proper access control and thread safety
 
 Requirement: Data Security Layer (5.4 Security Architecture/Data Security Layer)
 Implementation: Implements secure storage using platform keychain with encryption and access controls
 
 Requirement: Authentication Methods (9.1.1 Authentication Methods)
 Implementation: Provides secure storage for authentication tokens and credentials with proper encryption
 
 Requirement: Session Management (9.1.3 Session Management)
 Implementation: Manages secure token storage in keychain with proper access controls and thread safety
*/