//
// AccountRepository.swift
// MintReplicaLite
//
// Repository implementation for Account domain model handling data persistence and synchronization

// MARK: - Human Tasks
/*
1. Configure proper error logging and monitoring for sync operations
2. Set up background fetch capability for periodic account sync
3. Configure proper retry mechanisms for failed API requests
4. Verify Core Data model includes all required Account entity attributes
5. Set up proper conflict resolution strategy for sync operations
*/

import Foundation // iOS 14.0+
import CoreData   // iOS 14.0+
import Combine    // iOS 14.0+

/// Repository implementation for Account domain model with comprehensive error handling and offline support
/// Addresses requirements:
/// - Financial institution integration and account aggregation (1.2 Scope/Core Features)
/// - Local SQLite database for offline data (5.2.1 Mobile Applications)
/// - Real-time data synchronization (1.1 System Overview)
@available(iOS 14.0, *)
final class AccountRepository {
    
    // MARK: - Properties
    
    private let apiClient: APIClient
    private let coreDataManager: CoreDataManager
    private let context: NSManagedObjectContext
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    init(
        apiClient: APIClient = .shared,
        coreDataManager: CoreDataManager = .shared
    ) {
        self.apiClient = apiClient
        self.coreDataManager = coreDataManager
        self.context = coreDataManager.viewContext
    }
    
    // MARK: - Private Methods
    
    /// Converts Core Data entity to domain model
    /// - Parameter entity: Account entity from Core Data
    /// - Returns: Account domain model
    private func convertToDomainModel(_ entity: AccountEntity) -> Account {
        return Account(
            id: entity.id ?? "",
            institutionId: entity.institutionId ?? "",
            name: entity.name ?? "",
            institutionName: entity.institutionName,
            type: AccountType(rawValue: entity.type ?? "") ?? .other,
            balance: entity.balance as Decimal,
            currency: entity.currency ?? "USD",
            lastSynced: entity.lastSynced ?? Date(),
            isActive: entity.isActive
        )
    }
    
    /// Converts domain model to Core Data entity
    /// - Parameter account: Account domain model
    /// - Returns: Account entity for Core Data
    private func convertToEntity(_ account: Account) -> AccountEntity {
        let entity = AccountEntity(context: context)
        entity.id = account.id
        entity.institutionId = account.institutionId
        entity.name = account.name
        entity.institutionName = account.institutionName
        entity.type = account.type.rawValue
        entity.balance = NSDecimalNumber(decimal: account.balance)
        entity.currency = account.currency
        entity.lastSynced = account.lastSynced
        entity.isActive = account.isActive
        return entity
    }
    
    /// Saves Core Data context with error handling
    /// - Throws: RepositoryError if save fails
    private func saveContext() throws {
        do {
            try context.save()
        } catch {
            throw RepositoryError.persistenceError
        }
    }
}

// MARK: - RepositoryProtocol Conformance

extension AccountRepository: RepositoryProtocol {
    typealias T = Account
    
    func create(_ account: Account) -> AnyPublisher<Account, RepositoryError> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(.persistenceError))
                return
            }
            
            // Create account in remote API
            let request = APIRequest<Account>(
                endpoint: "/accounts",
                method: .post,
                body: account
            )
            
            self.apiClient.request(request)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure = completion {
                            promise(.failure(.networkError))
                        }
                    },
                    receiveValue: { [weak self] remoteAccount in
                        guard let self = self else {
                            promise(.failure(.persistenceError))
                            return
                        }
                        
                        // Save to Core Data
                        let entity = self.convertToEntity(remoteAccount)
                        
                        do {
                            try self.saveContext()
                            promise(.success(remoteAccount))
                        } catch {
                            promise(.failure(.persistenceError))
                        }
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
    
    func read(_ id: String) -> AnyPublisher<Account?, RepositoryError> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(.persistenceError))
                return
            }
            
            let fetchRequest: NSFetchRequest<AccountEntity> = AccountEntity.fetchRequest()
            fetchRequest.predicate = NSPredicate(format: "id == %@", id)
            
            do {
                let results = try self.context.fetch(fetchRequest)
                if let entity = results.first {
                    promise(.success(self.convertToDomainModel(entity)))
                } else {
                    // Try fetching from API if not found locally
                    let request = APIRequest<Account>(
                        endpoint: "/accounts/\(id)",
                        method: .get
                    )
                    
                    self.apiClient.request(request)
                        .sink(
                            receiveCompletion: { completion in
                                if case .failure = completion {
                                    promise(.success(nil))
                                }
                            },
                            receiveValue: { [weak self] account in
                                guard let self = self else { return }
                                let entity = self.convertToEntity(account)
                                try? self.saveContext()
                                promise(.success(account))
                            }
                        )
                        .store(in: &self.cancellables)
                }
            } catch {
                promise(.failure(.persistenceError))
            }
        }
        .eraseToAnyPublisher()
    }
    
    func update(_ account: Account) -> AnyPublisher<Account, RepositoryError> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(.persistenceError))
                return
            }
            
            // Update in remote API
            let request = APIRequest<Account>(
                endpoint: "/accounts/\(account.id)",
                method: .put,
                body: account
            )
            
            self.apiClient.request(request)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure = completion {
                            promise(.failure(.networkError))
                        }
                    },
                    receiveValue: { [weak self] updatedAccount in
                        guard let self = self else {
                            promise(.failure(.persistenceError))
                            return
                        }
                        
                        // Update in Core Data
                        let fetchRequest: NSFetchRequest<AccountEntity> = AccountEntity.fetchRequest()
                        fetchRequest.predicate = NSPredicate(format: "id == %@", account.id)
                        
                        do {
                            let results = try self.context.fetch(fetchRequest)
                            if let entity = results.first {
                                entity.name = updatedAccount.name
                                entity.balance = NSDecimalNumber(decimal: updatedAccount.balance)
                                entity.lastSynced = updatedAccount.lastSynced
                                entity.isActive = updatedAccount.isActive
                                
                                try self.saveContext()
                                promise(.success(updatedAccount))
                            } else {
                                promise(.failure(.notFound))
                            }
                        } catch {
                            promise(.failure(.persistenceError))
                        }
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
    
    func delete(_ id: String) -> AnyPublisher<Void, RepositoryError> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(.persistenceError))
                return
            }
            
            // Delete from remote API
            let request = APIRequest<Void>(
                endpoint: "/accounts/\(id)",
                method: .delete
            )
            
            self.apiClient.request(request)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure = completion {
                            promise(.failure(.networkError))
                        }
                    },
                    receiveValue: { [weak self] _ in
                        guard let self = self else {
                            promise(.failure(.persistenceError))
                            return
                        }
                        
                        // Delete from Core Data
                        let fetchRequest: NSFetchRequest<AccountEntity> = AccountEntity.fetchRequest()
                        fetchRequest.predicate = NSPredicate(format: "id == %@", id)
                        
                        do {
                            let results = try self.context.fetch(fetchRequest)
                            if let entity = results.first {
                                self.context.delete(entity)
                                try self.saveContext()
                                promise(.success(()))
                            } else {
                                promise(.failure(.notFound))
                            }
                        } catch {
                            promise(.failure(.persistenceError))
                        }
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
    
    func list(_ criteria: [String : Any]? = nil) -> AnyPublisher<[Account], RepositoryError> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(.persistenceError))
                return
            }
            
            let fetchRequest: NSFetchRequest<AccountEntity> = AccountEntity.fetchRequest()
            
            // Apply filtering criteria if provided
            if let criteria = criteria {
                var predicates: [NSPredicate] = []
                
                if let institutionId = criteria["institutionId"] as? String {
                    predicates.append(NSPredicate(format: "institutionId == %@", institutionId))
                }
                
                if let type = criteria["type"] as? String {
                    predicates.append(NSPredicate(format: "type == %@", type))
                }
                
                if let isActive = criteria["isActive"] as? Bool {
                    predicates.append(NSPredicate(format: "isActive == %@", NSNumber(value: isActive)))
                }
                
                if !predicates.isEmpty {
                    fetchRequest.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: predicates)
                }
            }
            
            do {
                let results = try self.context.fetch(fetchRequest)
                let accounts = results.map(self.convertToDomainModel)
                promise(.success(accounts))
            } catch {
                promise(.failure(.persistenceError))
            }
        }
        .eraseToAnyPublisher()
    }
    
    func sync() -> AnyPublisher<Void, RepositoryError> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(.persistenceError))
                return
            }
            
            // Fetch latest accounts from API
            let request = APIRequest<[Account]>(
                endpoint: "/accounts/sync",
                method: .get
            )
            
            self.apiClient.request(request)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure = completion {
                            promise(.failure(.networkError))
                        }
                    },
                    receiveValue: { [weak self] remoteAccounts in
                        guard let self = self else {
                            promise(.failure(.persistenceError))
                            return
                        }
                        
                        self.coreDataManager.performBackgroundTask { context in
                            // Fetch all local accounts
                            let fetchRequest: NSFetchRequest<AccountEntity> = AccountEntity.fetchRequest()
                            
                            do {
                                let localAccounts = try context.fetch(fetchRequest)
                                let localAccountIds = Set(localAccounts.compactMap { $0.id })
                                let remoteAccountIds = Set(remoteAccounts.map { $0.id })
                                
                                // Handle deletions
                                let deletedIds = localAccountIds.subtracting(remoteAccountIds)
                                for id in deletedIds {
                                    let deleteRequest: NSFetchRequest<AccountEntity> = AccountEntity.fetchRequest()
                                    deleteRequest.predicate = NSPredicate(format: "id == %@", id)
                                    let accountToDelete = try context.fetch(deleteRequest).first
                                    if let account = accountToDelete {
                                        context.delete(account)
                                    }
                                }
                                
                                // Handle updates and insertions
                                for remoteAccount in remoteAccounts {
                                    let fetchRequest: NSFetchRequest<AccountEntity> = AccountEntity.fetchRequest()
                                    fetchRequest.predicate = NSPredicate(format: "id == %@", remoteAccount.id)
                                    
                                    let existingAccount = try context.fetch(fetchRequest).first
                                    
                                    if let existing = existingAccount {
                                        // Update existing account
                                        existing.name = remoteAccount.name
                                        existing.balance = NSDecimalNumber(decimal: remoteAccount.balance)
                                        existing.lastSynced = remoteAccount.lastSynced
                                        existing.isActive = remoteAccount.isActive
                                    } else {
                                        // Create new account
                                        let entity = AccountEntity(context: context)
                                        entity.id = remoteAccount.id
                                        entity.institutionId = remoteAccount.institutionId
                                        entity.name = remoteAccount.name
                                        entity.institutionName = remoteAccount.institutionName
                                        entity.type = remoteAccount.type.rawValue
                                        entity.balance = NSDecimalNumber(decimal: remoteAccount.balance)
                                        entity.currency = remoteAccount.currency
                                        entity.lastSynced = remoteAccount.lastSynced
                                        entity.isActive = remoteAccount.isActive
                                    }
                                }
                                
                                try context.save()
                                promise(.success(()))
                            } catch {
                                promise(.failure(.persistenceError))
                            }
                        }
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
}