//
// AccountUseCases.swift
// MintReplicaLite
//
// Use case implementations for account-related business logic with offline-first capabilities

// MARK: - Human Tasks
/*
1. Configure proper error logging and monitoring for account operations
2. Set up analytics tracking for account-related events
3. Verify proper error handling and user feedback in UI layer
4. Test account sync behavior with various network conditions
5. Validate proper cleanup of resources when account is unlinked
*/

import Foundation // iOS 14.0+
import Combine   // iOS 14.0+

/// Implementation of account-related business logic and use cases with comprehensive error handling
/// Addresses requirements:
/// - Financial institution integration and account aggregation (1.2 Scope/Core Features)
/// - Real-time data synchronization (1.1 System Overview)
/// - Local SQLite database for offline data (5.2.1 Mobile Applications)
@available(iOS 14.0, *)
final class AccountUseCases {
    
    // MARK: - Properties
    
    private let repository: AccountRepository
    private(set) var accountUpdatePublisher = PassthroughSubject<Account, Never>()
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    /// Initializes use cases with account repository dependency
    /// - Parameter repository: Repository for account data operations
    init(repository: AccountRepository) {
        self.repository = repository
    }
    
    // MARK: - Public Methods
    
    /// Links a new financial account with validation
    /// - Parameter account: Account to be linked
    /// - Returns: Publisher emitting linked account or error
    func linkAccount(_ account: Account) -> AnyPublisher<Account, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(UseCaseError.instanceDeallocated))
                return
            }
            
            // Validate account data completeness
            guard !account.id.isEmpty,
                  !account.institutionId.isEmpty,
                  !account.name.isEmpty,
                  !account.currency.isEmpty else {
                promise(.failure(UseCaseError.invalidData))
                return
            }
            
            // Create account through repository
            self.repository.create(account)
                .flatMap { [weak self] createdAccount -> AnyPublisher<Account, RepositoryError> in
                    guard let self = self else {
                        return Fail(error: .persistenceError).eraseToAnyPublisher()
                    }
                    
                    // Trigger initial sync
                    return self.repository.sync()
                        .map { createdAccount }
                        .eraseToAnyPublisher()
                }
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: { [weak self] account in
                        // Publish update through accountUpdatePublisher
                        self?.accountUpdatePublisher.send(account)
                        promise(.success(account))
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
    
    /// Retrieves all accounts with optional type filtering
    /// - Parameter type: Optional account type filter
    /// - Returns: Publisher emitting filtered accounts list or error
    func fetchAccounts(type: AccountType? = nil) -> AnyPublisher<[Account], Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(UseCaseError.instanceDeallocated))
                return
            }
            
            // Build filter criteria if type provided
            var criteria: [String: Any]? = nil
            if let type = type {
                criteria = ["type": type.rawValue]
            }
            
            // Fetch accounts through repository
            self.repository.list(criteria)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: { accounts in
                        promise(.success(accounts))
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
    
    /// Retrieves detailed information for a specific account
    /// - Parameter accountId: Unique identifier of the account
    /// - Returns: Publisher emitting account details or error
    func getAccountDetails(accountId: String) -> AnyPublisher<Account, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(UseCaseError.instanceDeallocated))
                return
            }
            
            // Validate accountId format
            guard !accountId.isEmpty else {
                promise(.failure(UseCaseError.invalidData))
                return
            }
            
            // Fetch account through repository
            self.repository.read(accountId)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: { account in
                        if let account = account {
                            promise(.success(account))
                        } else {
                            promise(.failure(UseCaseError.notFound))
                        }
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
    
    /// Updates account information with validation
    /// - Parameter account: Updated account information
    /// - Returns: Publisher emitting updated account or error
    func updateAccount(_ account: Account) -> AnyPublisher<Account, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(UseCaseError.instanceDeallocated))
                return
            }
            
            // Validate update data completeness
            guard !account.id.isEmpty,
                  !account.name.isEmpty else {
                promise(.failure(UseCaseError.invalidData))
                return
            }
            
            // Update through repository
            self.repository.update(account)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: { [weak self] updatedAccount in
                        // Publish update through accountUpdatePublisher
                        self?.accountUpdatePublisher.send(updatedAccount)
                        promise(.success(updatedAccount))
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
    
    /// Unlinks an account with proper cleanup
    /// - Parameter accountId: Unique identifier of the account to unlink
    /// - Returns: Publisher emitting success or error
    func unlinkAccount(accountId: String) -> AnyPublisher<Void, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(UseCaseError.instanceDeallocated))
                return
            }
            
            // Verify account exists
            self.repository.read(accountId)
                .flatMap { account -> AnyPublisher<Void, RepositoryError> in
                    guard account != nil else {
                        return Fail(error: .notFound).eraseToAnyPublisher()
                    }
                    
                    // Delete through repository
                    return self.repository.delete(accountId)
                }
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: { [weak self] _ in
                        // Publish update through accountUpdatePublisher with a placeholder account
                        if let self = self {
                            let deletedAccount = Account(
                                id: accountId,
                                institutionId: "",
                                name: "",
                                type: .other,
                                balance: 0,
                                currency: "",
                                lastSynced: Date(),
                                isActive: false
                            )
                            self.accountUpdatePublisher.send(deletedAccount)
                        }
                        promise(.success(()))
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
    
    /// Synchronizes all accounts with remote data
    /// - Returns: Publisher emitting success or error
    func syncAccounts() -> AnyPublisher<Void, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(UseCaseError.instanceDeallocated))
                return
            }
            
            // Trigger repository sync operation
            self.repository.sync()
                .flatMap { [weak self] _ -> AnyPublisher<[Account], RepositoryError> in
                    guard let self = self else {
                        return Fail(error: .persistenceError).eraseToAnyPublisher()
                    }
                    // Fetch updated accounts after sync
                    return self.repository.list()
                }
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: { [weak self] accounts in
                        // Publish updates for all accounts
                        accounts.forEach { account in
                            self?.accountUpdatePublisher.send(account)
                        }
                        promise(.success(()))
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
}

// MARK: - Error Types

/// Custom error types for account use cases
enum UseCaseError: LocalizedError {
    case instanceDeallocated
    case invalidData
    case notFound
    
    var errorDescription: String? {
        switch self {
        case .instanceDeallocated:
            return "The use case instance was deallocated"
        case .invalidData:
            return "The provided data is invalid or incomplete"
        case .notFound:
            return "The requested account was not found"
        }
    }
}