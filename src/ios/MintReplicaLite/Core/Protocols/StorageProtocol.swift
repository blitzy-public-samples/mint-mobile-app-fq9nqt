//
// StorageProtocol.swift
// MintReplicaLite
//
// A generic protocol defining standardized data storage operations
// for different storage mechanisms like CoreData and Keychain
//

// MARK: - Human Tasks
// - Ensure proper keychain access groups are configured in entitlements file
// - Configure CoreData model and schema if using CoreData implementation
// - Set up proper encryption keys for secure storage implementation

import Foundation // iOS 14.0+

/// Protocol defining standardized storage operations with type-safe data handling
/// Addresses requirements:
/// - Local Data Storage: Provides interface for SQLite/CoreData storage
/// - Secure Storage: Supports Keychain integration for credentials
/// - Data Architecture: Defines primary storage layer contract
protocol StorageProtocol {
    /// Generic type that must conform to Codable for serialization
    associatedtype T: Codable
    
    /// Saves a Codable item to storage with error handling
    /// - Parameters:
    ///   - item: The item to save, must conform to Codable
    ///   - key: Unique identifier for the stored item
    /// - Returns: Result indicating success or detailed error information
    func save(_ item: T, key: String) -> Result<Void, Error>
    
    /// Retrieves a stored item with type-safe decoding
    /// - Parameter key: Unique identifier of the item to retrieve
    /// - Returns: Result containing optional decoded item or error details
    func retrieve(key: String) -> Result<T?, Error>
    
    /// Deletes a stored item
    /// - Parameter key: Unique identifier of the item to delete
    /// - Returns: Result indicating success or detailed error information
    func delete(key: String) -> Result<Void, Error>
    
    /// Removes all items from storage
    /// - Returns: Result indicating success or detailed error information
    func clear() -> Result<Void, Error>
}

/// Common storage errors
enum StorageError: LocalizedError {
    case invalidInput
    case encodingFailed
    case decodingFailed
    case itemNotFound
    case storageOperationFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidInput:
            return "Invalid input parameters provided"
        case .encodingFailed:
            return "Failed to encode item for storage"
        case .decodingFailed:
            return "Failed to decode stored item"
        case .itemNotFound:
            return "Requested item not found in storage"
        case .storageOperationFailed(let details):
            return "Storage operation failed: \(details)"
        }
    }
}