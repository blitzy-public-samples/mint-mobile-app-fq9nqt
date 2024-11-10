//
// TransactionRepository.swift
// MintReplicaLite
//
// Repository implementation for managing financial transactions with local persistence
// and remote synchronization, supporting offline-first operations

import Foundation // iOS 14.0+
import CoreData // iOS 14.0+
import Combine // iOS 14.0+

// MARK: - Human Tasks
/*
1. Configure proper error logging and monitoring
2. Set up background sync scheduling
3. Verify Core Data model schema matches TransactionEntity
4. Configure proper retry mechanisms for failed API calls
5. Set up proper conflict resolution strategies
*/

/// Repository implementation for managing financial transactions with comprehensive CRUD operations
/// and synchronization between local Core Data storage and remote API
/// Requirements addressed:
/// - Transaction tracking and categorization (1.2 Scope/Core Features)
/// - Real-time data synchronization (1.1 System Overview)
/// - Offline data (5.2.1 Mobile Applications)
@available(iOS 14.0, *)
final class TransactionRepository {
    
    // MARK: - Properties
    
    private let coreDataManager: CoreDataManager
    private let apiClient: APIClient
    private let context: NSManagedObjectContext
    
    // MARK: - Initialization
    
    init() {
        self.coreDataManager = CoreDataManager.shared
        self.apiClient = APIClient.shared
        self.context = coreDataManager.viewContext
    }
    
    // MARK: - CRUD Operations
    
    /// Creates a new transaction both locally and remotely with offline support
    /// - Parameter transaction: Transaction to create
    /// - Returns: Publisher emitting created transaction or error
    func create(_ transaction: Transaction) -> AnyPublisher<Transaction, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(RepositoryError.invalidData))
                return
            }
            
            do {
                // Create Core Data entity
                let entity = TransactionEntity(entity: NSEntityDescription.entity(
                    forEntityName: "TransactionEntity",
                    in: self.context)!,
                    insertInto: self.context)
                
                // Update entity with transaction data
                entity.update(with: transaction)
                
                // Save to local database
                try self.context.save()
                
                // Create API request
                let request = APIRequest<Transaction>(
                    endpoint: "/transactions",
                    method: .post,
                    body: transaction
                )
                
                // Attempt remote creation
                self.apiClient.request(request)
                    .sink(
                        receiveCompletion: { completion in
                            if case .failure(let error) = completion {
                                // Queue for later sync if API call fails
                                self.queueForSync(transaction: entity, operation: .create)
                                // Still return success since we have local data
                                promise(.success(transaction))
                            }
                        },
                        receiveValue: { _ in
                            promise(.success(transaction))
                        }
                    )
                    .store(in: &self.cancellables)
                
            } catch {
                promise(.failure(error))
            }
        }.eraseToAnyPublisher()
    }
    
    /// Retrieves a transaction by ID from local storage with remote fallback
    /// - Parameter id: Transaction ID to retrieve
    /// - Returns: Publisher emitting optional transaction or error
    func read(_ id: String) -> AnyPublisher<Transaction?, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(RepositoryError.invalidData))
                return
            }
            
            do {
                // Attempt local fetch first
                let fetchRequest = TransactionEntity.fetchRequest()
                fetchRequest.predicate = NSPredicate(format: "id == %@", id)
                
                let results = try self.context.fetch(fetchRequest)
                
                if let entity = results.first {
                    promise(.success(entity.toDomainModel()))
                    return
                }
                
                // If not found locally, try remote
                let request = APIRequest<Transaction>(
                    endpoint: "/transactions/\(id)",
                    method: .get
                )
                
                self.apiClient.request(request)
                    .sink(
                        receiveCompletion: { completion in
                            if case .failure = completion {
                                promise(.success(nil))
                            }
                        },
                        receiveValue: { transaction in
                            // Save to local database
                            let entity = TransactionEntity(entity: NSEntityDescription.entity(
                                forEntityName: "TransactionEntity",
                                in: self.context)!,
                                insertInto: self.context)
                            entity.update(with: transaction)
                            try? self.context.save()
                            
                            promise(.success(transaction))
                        }
                    )
                    .store(in: &self.cancellables)
                
            } catch {
                promise(.failure(error))
            }
        }.eraseToAnyPublisher()
    }
    
    /// Updates an existing transaction locally and queues for remote sync
    /// - Parameter transaction: Transaction to update
    /// - Returns: Publisher emitting updated transaction or error
    func update(_ transaction: Transaction) -> AnyPublisher<Transaction, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(RepositoryError.invalidData))
                return
            }
            
            do {
                // Find existing entity
                let fetchRequest = TransactionEntity.fetchRequest()
                fetchRequest.predicate = NSPredicate(format: "id == %@", transaction.id.uuidString)
                
                let results = try self.context.fetch(fetchRequest)
                
                guard let entity = results.first else {
                    promise(.failure(RepositoryError.notFound))
                    return
                }
                
                // Update entity
                entity.update(with: transaction)
                
                // Save changes locally
                try self.context.save()
                
                // Queue update for API sync
                self.queueForSync(transaction: entity, operation: .update)
                
                promise(.success(transaction))
                
            } catch {
                promise(.failure(error))
            }
        }.eraseToAnyPublisher()
    }
    
    /// Deletes a transaction locally and marks for remote deletion
    /// - Parameter id: ID of transaction to delete
    /// - Returns: Publisher indicating success or error
    func delete(_ id: String) -> AnyPublisher<Void, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(RepositoryError.invalidData))
                return
            }
            
            do {
                // Find entity to delete
                let fetchRequest = TransactionEntity.fetchRequest()
                fetchRequest.predicate = NSPredicate(format: "id == %@", id)
                
                let results = try self.context.fetch(fetchRequest)
                
                guard let entity = results.first else {
                    promise(.failure(RepositoryError.notFound))
                    return
                }
                
                // Queue for remote deletion
                self.queueForSync(transaction: entity, operation: .delete)
                
                // Delete locally
                self.context.delete(entity)
                try self.context.save()
                
                promise(.success(()))
                
            } catch {
                promise(.failure(error))
            }
        }.eraseToAnyPublisher()
    }
    
    /// Retrieves all transactions matching optional criteria with pagination
    /// - Parameter criteria: Optional filtering criteria
    /// - Returns: Publisher emitting array of transactions or error
    func list(_ criteria: [String: Any]? = nil) -> AnyPublisher<[Transaction], Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(RepositoryError.invalidData))
                return
            }
            
            do {
                // Create fetch request with criteria
                let fetchRequest = TransactionEntity.fetchRequest()
                
                if let criteria = criteria {
                    var predicates: [NSPredicate] = []
                    
                    // Apply filters
                    if let startDate = criteria["startDate"] as? Date {
                        predicates.append(NSPredicate(format: "date >= %@", startDate as NSDate))
                    }
                    if let endDate = criteria["endDate"] as? Date {
                        predicates.append(NSPredicate(format: "date <= %@", endDate as NSDate))
                    }
                    if let category = criteria["category"] as? String {
                        predicates.append(NSPredicate(format: "category == %@", category))
                    }
                    if let accountId = criteria["accountId"] as? String {
                        predicates.append(NSPredicate(format: "accountId == %@", accountId))
                    }
                    
                    // Combine predicates
                    if !predicates.isEmpty {
                        fetchRequest.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: predicates)
                    }
                    
                    // Apply sorting
                    if let sortBy = criteria["sortBy"] as? String {
                        let ascending = (criteria["sortOrder"] as? String) == "asc"
                        fetchRequest.sortDescriptors = [NSSortDescriptor(key: sortBy, ascending: ascending)]
                    }
                    
                    // Apply pagination
                    if let limit = criteria["limit"] as? Int {
                        fetchRequest.fetchLimit = limit
                    }
                    if let offset = criteria["offset"] as? Int {
                        fetchRequest.fetchOffset = offset
                    }
                }
                
                // Execute fetch
                let results = try self.context.fetch(fetchRequest)
                
                // Convert to domain models
                let transactions = results.map { $0.toDomainModel() }
                
                promise(.success(transactions))
                
            } catch {
                promise(.failure(error))
            }
        }.eraseToAnyPublisher()
    }
    
    /// Synchronizes local transactions with remote server using queue
    /// - Returns: Publisher indicating sync completion or error
    func sync() -> AnyPublisher<Void, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(RepositoryError.invalidData))
                return
            }
            
            do {
                // Process pending operations
                try self.processPendingOperations()
                
                // Fetch remote changes
                let request = APIRequest<[Transaction]>(
                    endpoint: "/transactions/sync",
                    method: .get
                )
                
                self.apiClient.request(request)
                    .sink(
                        receiveCompletion: { completion in
                            if case .failure(let error) = completion {
                                promise(.failure(error))
                            }
                        },
                        receiveValue: { transactions in
                            do {
                                // Merge remote changes
                                try self.mergeRemoteChanges(transactions)
                                promise(.success(()))
                            } catch {
                                promise(.failure(error))
                            }
                        }
                    )
                    .store(in: &self.cancellables)
                
            } catch {
                promise(.failure(error))
            }
        }.eraseToAnyPublisher()
    }
    
    // MARK: - Private Methods
    
    private var cancellables = Set<AnyCancellable>()
    
    private enum SyncOperation: String {
        case create
        case update
        case delete
    }
    
    private func queueForSync(transaction: TransactionEntity, operation: SyncOperation) {
        // Store sync operation in queue
        let syncQueue = UserDefaults.standard.dictionary(forKey: "TransactionSyncQueue") ?? [:]
        var updatedQueue = syncQueue
        updatedQueue[transaction.id.uuidString] = operation.rawValue
        UserDefaults.standard.set(updatedQueue, forKey: "TransactionSyncQueue")
    }
    
    private func processPendingOperations() throws {
        guard let syncQueue = UserDefaults.standard.dictionary(forKey: "TransactionSyncQueue") else {
            return
        }
        
        for (id, operationRaw) in syncQueue {
            guard let operation = SyncOperation(rawValue: operationRaw as! String) else { continue }
            
            let fetchRequest = TransactionEntity.fetchRequest()
            fetchRequest.predicate = NSPredicate(format: "id == %@", id)
            
            let results = try context.fetch(fetchRequest)
            guard let entity = results.first else { continue }
            
            let transaction = entity.toDomainModel()
            
            switch operation {
            case .create:
                try syncCreate(transaction)
            case .update:
                try syncUpdate(transaction)
            case .delete:
                try syncDelete(transaction.id.uuidString)
            }
        }
        
        // Clear sync queue after processing
        UserDefaults.standard.removeObject(forKey: "TransactionSyncQueue")
    }
    
    private func syncCreate(_ transaction: Transaction) throws {
        let request = APIRequest<Transaction>(
            endpoint: "/transactions",
            method: .post,
            body: transaction
        )
        
        try awaitPublisher(apiClient.request(request))
    }
    
    private func syncUpdate(_ transaction: Transaction) throws {
        let request = APIRequest<Transaction>(
            endpoint: "/transactions/\(transaction.id.uuidString)",
            method: .put,
            body: transaction
        )
        
        try awaitPublisher(apiClient.request(request))
    }
    
    private func syncDelete(_ id: String) throws {
        let request = APIRequest<Void>(
            endpoint: "/transactions/\(id)",
            method: .delete
        )
        
        try awaitPublisher(apiClient.request(request))
    }
    
    private func mergeRemoteChanges(_ transactions: [Transaction]) throws {
        for transaction in transactions {
            let fetchRequest = TransactionEntity.fetchRequest()
            fetchRequest.predicate = NSPredicate(format: "id == %@", transaction.id.uuidString)
            
            let results = try context.fetch(fetchRequest)
            
            if let existing = results.first {
                // Update existing
                existing.update(with: transaction)
            } else {
                // Create new
                let entity = TransactionEntity(entity: NSEntityDescription.entity(
                    forEntityName: "TransactionEntity",
                    in: context)!,
                    insertInto: context)
                entity.update(with: transaction)
            }
        }
        
        try context.save()
    }
    
    private func awaitPublisher<T>(_ publisher: AnyPublisher<T, Error>) throws -> T {
        var result: Result<T, Error>?
        let semaphore = DispatchSemaphore(value: 0)
        
        publisher
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        result = .failure(error)
                    }
                    semaphore.signal()
                },
                receiveValue: { value in
                    result = .success(value)
                }
            )
            .store(in: &cancellables)
        
        semaphore.wait()
        
        switch result {
        case .success(let value):
            return value
        case .failure(let error):
            throw error
        case .none:
            throw RepositoryError.invalidData
        }
    }
}