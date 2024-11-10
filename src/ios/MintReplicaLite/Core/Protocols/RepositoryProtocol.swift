//
// RepositoryProtocol.swift
// MintReplicaLite
//
// Defines the core repository protocol for standardized data access and persistence
// implementing the Repository pattern for clean architecture

// MARK: - Human Tasks
// - Configure proper error handling and logging mechanisms
// - Set up background sync scheduling for offline data management
// - Ensure proper network reachability monitoring is configured
// - Set up proper retry mechanisms for failed sync operations

import Foundation // iOS 14.0+
import Combine // iOS 14.0+

/// Standard error types for repository operations
/// Addresses requirement: Clean Architecture - Standardized error handling
public enum RepositoryError: LocalizedError {
    case notFound
    case invalidData
    case persistenceError
    case networkError
    
    public var errorDescription: String? {
        switch self {
        case .notFound:
            return "Requested item not found"
        case .invalidData:
            return "Invalid data format or structure"
        case .persistenceError:
            return "Failed to persist data locally"
        case .networkError:
            return "Network operation failed"
        }
    }
}

/// Protocol defining standardized repository operations with offline-first capabilities
/// Addresses requirements:
/// - Clean Architecture: Implementation of repository pattern
/// - Data Storage and Persistence: Local SQLite database support
/// - Real-time Data Synchronization: Support for data sync between local and remote
protocol RepositoryProtocol {
    /// Generic type representing the domain model
    associatedtype T: Codable
    
    /// Creates a new entity with local persistence
    /// - Parameter item: The item to create
    /// - Returns: Result containing created item or error
    /// - Throws: RepositoryError if creation fails
    func create(_ item: T) throws -> Result<T, RepositoryError>
    
    /// Retrieves an entity by ID from local storage with remote fallback
    /// - Parameter id: Unique identifier of the item
    /// - Returns: Result containing optional item or error
    /// - Throws: RepositoryError if retrieval fails
    func read(_ id: String) throws -> Result<T?, RepositoryError>
    
    /// Updates an existing entity in local storage and queues for sync
    /// - Parameter item: The item to update
    /// - Returns: Result containing updated item or error
    /// - Throws: RepositoryError if update fails
    func update(_ item: T) throws -> Result<T, RepositoryError>
    
    /// Deletes an entity by ID from local storage and marks for remote deletion
    /// - Parameter id: Unique identifier of the item to delete
    /// - Returns: Result indicating success or error
    /// - Throws: RepositoryError if deletion fails
    func delete(_ id: String) throws -> Result<Void, RepositoryError>
    
    /// Retrieves all entities matching optional criteria from local storage
    /// - Parameter criteria: Optional filtering criteria
    /// - Returns: Result containing array of items or error
    /// - Throws: RepositoryError if retrieval fails
    func list(_ criteria: [String: Any]?) throws -> Result<[T], RepositoryError>
    
    /// Synchronizes local data with remote server using queue-based approach
    /// - Returns: Result indicating sync success or error
    /// - Throws: RepositoryError if sync fails
    func sync() throws -> Result<Void, RepositoryError>
}

// MARK: - Default Implementation
extension RepositoryProtocol {
    /// Default empty criteria for list operation
    func list() throws -> Result<[T], RepositoryError> {
        return try list(nil)
    }
}