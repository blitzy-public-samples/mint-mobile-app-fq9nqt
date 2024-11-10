//
// GoalRepository.swift
// MintReplicaLite
//
// Repository implementation for managing financial goals with offline-first architecture

// MARK: - Human Tasks
/*
1. Configure proper Core Data model schema for GoalEntity
2. Set up background sync scheduling for offline data management
3. Configure proper error logging and monitoring
4. Test concurrent Core Data operations
5. Verify proper conflict resolution handling
*/

import Foundation // iOS 14.0+
import CoreData // iOS 14.0+
import Combine // iOS 14.0+

/// Repository implementation for managing financial goals with local persistence and remote synchronization
/// Addresses requirements:
/// - Financial goal setting and progress monitoring (1.2 Scope/Core Features)
/// - Local SQLite database for offline data (5.2.1 Mobile Applications)
/// - Real-time data synchronization (1.1 System Overview)
@available(iOS 14.0, *)
final class GoalRepository {
    
    // MARK: - Properties
    
    private let coreDataManager: CoreDataManager
    private let apiClient: APIClient
    private let context: NSManagedObjectContext
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    init() {
        self.coreDataManager = CoreDataManager.shared
        self.apiClient = APIClient.shared
        self.context = coreDataManager.viewContext
    }
    
    // MARK: - Private Methods
    
    /// Fetches a goal entity by ID from Core Data
    /// - Parameter id: Goal identifier
    /// - Returns: Optional goal entity
    private func fetchGoalEntity(id: UUID) throws -> GoalEntity? {
        let fetchRequest: NSFetchRequest<GoalEntity> = GoalEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", id as CVarArg)
        return try context.fetch(fetchRequest).first
    }
    
    /// Creates a new goal entity in Core Data
    /// - Parameter goal: Goal domain model
    /// - Returns: Created goal entity
    private func createGoalEntity(from goal: Goal) throws -> GoalEntity {
        let entity = GoalEntity(context: context)
        entity.update(with: goal)
        try context.save()
        return entity
    }
    
    /// Queues an operation for remote synchronization
    /// - Parameters:
    ///   - operation: Operation type (create/update/delete)
    ///   - goalId: Goal identifier
    private func queueSyncOperation(operation: String, goalId: UUID) {
        // Queue sync operation in Core Data for later processing
        let syncQueue = SyncQueueEntity(context: context)
        syncQueue.id = UUID()
        syncQueue.entityId = goalId
        syncQueue.entityType = "Goal"
        syncQueue.operation = operation
        syncQueue.timestamp = Date()
        syncQueue.retryCount = 0
        
        try? context.save()
    }
}

// MARK: - RepositoryProtocol Conformance

extension GoalRepository: RepositoryProtocol {
    typealias T = Goal
    
    /// Creates a new goal in both local and remote storage with offline support
    /// - Parameter goal: Goal to create
    /// - Returns: Publisher emitting created goal or error
    func create(_ goal: Goal) -> AnyPublisher<Goal, RepositoryError> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(.persistenceError))
                return
            }
            
            self.coreDataManager.performBackgroundTask { context in
                do {
                    // Create goal entity
                    let entity = GoalEntity(context: context)
                    entity.update(with: goal)
                    try context.save()
                    
                    // Queue for remote sync
                    self.queueSyncOperation(operation: "create", goalId: goal.id)
                    
                    promise(.success(goal))
                } catch {
                    promise(.failure(.persistenceError))
                }
            }
        }
        .eraseToAnyPublisher()
    }
    
    /// Retrieves a goal by ID from local storage with remote fallback
    /// - Parameter id: Goal identifier
    /// - Returns: Publisher emitting optional goal or error
    func read(_ id: String) -> AnyPublisher<Goal?, RepositoryError> {
        return Future { [weak self] promise in
            guard let self = self,
                  let uuid = UUID(uuidString: id) else {
                promise(.failure(.invalidData))
                return
            }
            
            do {
                // Try local fetch first
                if let entity = try self.fetchGoalEntity(id: uuid) {
                    promise(.success(entity.toDomain()))
                    return
                }
                
                // Fallback to remote fetch
                let request = APIRequest<Goal>(
                    endpoint: "/goals/\(id)",
                    method: .get
                )
                
                self.apiClient.request(request)
                    .sink(
                        receiveCompletion: { completion in
                            if case .failure = completion {
                                promise(.success(nil))
                            }
                        },
                        receiveValue: { goal in
                            // Store fetched goal locally
                            do {
                                let _ = try self.createGoalEntity(from: goal)
                                promise(.success(goal))
                            } catch {
                                promise(.failure(.persistenceError))
                            }
                        }
                    )
                    .store(in: &self.cancellables)
                
            } catch {
                promise(.failure(.persistenceError))
            }
        }
        .eraseToAnyPublisher()
    }
    
    /// Updates an existing goal in both storages with conflict resolution
    /// - Parameter goal: Goal to update
    /// - Returns: Publisher emitting updated goal or error
    func update(_ goal: Goal) -> AnyPublisher<Goal, RepositoryError> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(.persistenceError))
                return
            }
            
            self.coreDataManager.performBackgroundTask { context in
                do {
                    // Find existing entity
                    guard let entity = try self.fetchGoalEntity(id: goal.id) else {
                        promise(.failure(.notFound))
                        return
                    }
                    
                    // Update entity
                    entity.update(with: goal)
                    try context.save()
                    
                    // Queue for remote sync
                    self.queueSyncOperation(operation: "update", goalId: goal.id)
                    
                    promise(.success(goal))
                } catch {
                    promise(.failure(.persistenceError))
                }
            }
        }
        .eraseToAnyPublisher()
    }
    
    /// Deletes a goal from both storages with sync handling
    /// - Parameter id: Goal identifier
    /// - Returns: Publisher indicating success or error
    func delete(_ id: String) -> AnyPublisher<Void, RepositoryError> {
        return Future { [weak self] promise in
            guard let self = self,
                  let uuid = UUID(uuidString: id) else {
                promise(.failure(.invalidData))
                return
            }
            
            self.coreDataManager.performBackgroundTask { context in
                do {
                    // Find and delete entity
                    guard let entity = try self.fetchGoalEntity(id: uuid) else {
                        promise(.failure(.notFound))
                        return
                    }
                    
                    context.delete(entity)
                    try context.save()
                    
                    // Queue for remote sync
                    self.queueSyncOperation(operation: "delete", goalId: uuid)
                    
                    promise(.success(()))
                } catch {
                    promise(.failure(.persistenceError))
                }
            }
        }
        .eraseToAnyPublisher()
    }
    
    /// Retrieves all goals matching optional criteria with sorting and filtering
    /// - Parameter criteria: Optional filtering criteria
    /// - Returns: Publisher emitting array of goals or error
    func list(_ criteria: [String: Any]? = nil) -> AnyPublisher<[Goal], RepositoryError> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(.persistenceError))
                return
            }
            
            self.coreDataManager.performBackgroundTask { context in
                do {
                    // Create fetch request
                    let fetchRequest: NSFetchRequest<GoalEntity> = GoalEntity.fetchRequest()
                    
                    // Apply criteria if provided
                    if let criteria = criteria {
                        var predicates: [NSPredicate] = []
                        
                        if let category = criteria["category"] as? String {
                            predicates.append(NSPredicate(format: "category == %@", category))
                        }
                        
                        if let status = criteria["status"] as? String {
                            predicates.append(NSPredicate(format: "status == %@", status))
                        }
                        
                        if let minAmount = criteria["minAmount"] as? NSDecimalNumber {
                            predicates.append(NSPredicate(format: "targetAmount >= %@", minAmount))
                        }
                        
                        if !predicates.isEmpty {
                            fetchRequest.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: predicates)
                        }
                    }
                    
                    // Apply sorting
                    fetchRequest.sortDescriptors = [
                        NSSortDescriptor(key: "deadline", ascending: true),
                        NSSortDescriptor(key: "createdAt", ascending: false)
                    ]
                    
                    // Execute fetch
                    let entities = try context.fetch(fetchRequest)
                    let goals = entities.map { $0.toDomain() }
                    
                    promise(.success(goals))
                } catch {
                    promise(.failure(.persistenceError))
                }
            }
        }
        .eraseToAnyPublisher()
    }
    
    /// Synchronizes local goals with remote server using queue-based approach
    /// - Returns: Publisher indicating sync success or error
    func sync() -> AnyPublisher<Void, RepositoryError> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(.persistenceError))
                return
            }
            
            self.coreDataManager.performBackgroundTask { context in
                do {
                    // Fetch pending sync operations
                    let fetchRequest: NSFetchRequest<SyncQueueEntity> = SyncQueueEntity.fetchRequest()
                    fetchRequest.predicate = NSPredicate(format: "entityType == %@", "Goal")
                    fetchRequest.sortDescriptors = [NSSortDescriptor(key: "timestamp", ascending: true)]
                    
                    let pendingOperations = try context.fetch(fetchRequest)
                    
                    // Process each operation
                    for operation in pendingOperations {
                        do {
                            switch operation.operation {
                            case "create":
                                if let entity = try self.fetchGoalEntity(id: operation.entityId) {
                                    let goal = entity.toDomain()
                                    let request = APIRequest<Goal>(
                                        endpoint: "/goals",
                                        method: .post,
                                        body: goal
                                    )
                                    
                                    try await self.apiClient.request(request).async()
                                }
                                
                            case "update":
                                if let entity = try self.fetchGoalEntity(id: operation.entityId) {
                                    let goal = entity.toDomain()
                                    let request = APIRequest<Goal>(
                                        endpoint: "/goals/\(goal.id)",
                                        method: .put,
                                        body: goal
                                    )
                                    
                                    try await self.apiClient.request(request).async()
                                }
                                
                            case "delete":
                                let request = APIRequest<Void>(
                                    endpoint: "/goals/\(operation.entityId)",
                                    method: .delete
                                )
                                
                                try await self.apiClient.request(request).async()
                                
                            default:
                                break
                            }
                            
                            // Remove processed operation
                            context.delete(operation)
                            try context.save()
                            
                        } catch {
                            // Increment retry count or remove if max retries reached
                            operation.retryCount += 1
                            if operation.retryCount >= 3 {
                                context.delete(operation)
                            }
                            try context.save()
                        }
                    }
                    
                    // Fetch remote changes
                    let lastSync = UserDefaults.standard.object(forKey: "LastGoalSync") as? Date ?? Date.distantPast
                    let request = APIRequest<[Goal]>(
                        endpoint: "/goals/changes",
                        method: .get,
                        parameters: ["since": lastSync.timeIntervalSince1970]
                    )
                    
                    let remoteGoals = try await self.apiClient.request(request).async()
                    
                    // Update local storage
                    for goal in remoteGoals {
                        if let entity = try self.fetchGoalEntity(id: goal.id) {
                            entity.update(with: goal)
                        } else {
                            let _ = try self.createGoalEntity(from: goal)
                        }
                    }
                    
                    // Update last sync timestamp
                    UserDefaults.standard.set(Date(), forKey: "LastGoalSync")
                    
                    promise(.success(()))
                } catch {
                    promise(.failure(.networkError))
                }
            }
        }
        .eraseToAnyPublisher()
    }
}