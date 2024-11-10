//
// BudgetRepository.swift
// MintReplicaLite
//
// Repository implementation for managing budget data persistence with Core Data
//

import CoreData      // iOS 14.0+
import Foundation    // iOS 14.0+
import Combine       // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Configure Core Data model schema for BudgetEntity
 2. Set up proper indexing for frequently queried fields
 3. Test concurrent access patterns with background tasks
 4. Verify error handling covers all edge cases
 5. Add monitoring for performance metrics
*/

// MARK: - Budget Repository Protocol
/// Protocol defining thread-safe budget repository operations with reactive support
/// Requirements addressed:
/// - Budget creation and monitoring (1.2 Scope/Core Features)
protocol BudgetRepositoryProtocol {
    func createBudget(_ budget: Budget) -> AnyPublisher<Budget, Error>
    func getBudget(id: String) -> AnyPublisher<Budget?, Error>
    func getAllBudgets() -> AnyPublisher<[Budget], Error>
    func updateBudget(_ budget: Budget) -> AnyPublisher<Budget, Error>
    func deleteBudget(id: String) -> AnyPublisher<Void, Error>
}

// MARK: - Budget Repository Implementation
/// Thread-safe implementation of BudgetRepositoryProtocol using Core Data
/// Requirements addressed:
/// - Local SQLite database for offline data (5.2.1 Mobile Applications)
/// - Real-time notifications and alerts (1.2 Scope/Core Features)
final class BudgetRepository: BudgetRepositoryProtocol {
    
    // MARK: - Properties
    
    private let coreDataManager: CoreDataManager
    private let context: NSManagedObjectContext
    
    // MARK: - Initialization
    
    init(coreDataManager: CoreDataManager = .shared) {
        self.coreDataManager = coreDataManager
        self.context = coreDataManager.viewContext
        
        // Configure merge policy for conflict resolution
        self.context.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
    }
    
    // MARK: - Public Methods
    
    /// Creates a new budget in Core Data with proper error handling
    /// - Parameter budget: Budget domain model to persist
    /// - Returns: Publisher emitting created budget or error
    func createBudget(_ budget: Budget) -> AnyPublisher<Budget, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(NSError(domain: "BudgetRepository", code: -1)))
                return
            }
            
            self.coreDataManager.performBackgroundTask { context in
                do {
                    let entity = BudgetEntity(context: context)
                    entity.id = UUID(uuidString: budget.id) ?? UUID()
                    entity.name = budget.name
                    entity.totalAmount = NSDecimalNumber(decimal: budget.limit)
                    entity.spentAmount = NSDecimalNumber(decimal: budget.spent)
                    entity.startDate = budget.startDate
                    entity.endDate = budget.endDate
                    entity.status = BudgetStatus.active.rawValue
                    entity.createdAt = Date()
                    entity.updatedAt = Date()
                    
                    try context.save()
                    
                    // Convert back to domain model
                    let savedBudget = budget
                    promise(.success(savedBudget))
                } catch {
                    promise(.failure(error))
                }
            }
        }.eraseToAnyPublisher()
    }
    
    /// Retrieves a budget by ID with proper error handling
    /// - Parameter id: Unique identifier of the budget
    /// - Returns: Publisher emitting optional budget or error
    func getBudget(id: String) -> AnyPublisher<Budget?, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(NSError(domain: "BudgetRepository", code: -1)))
                return
            }
            
            let fetchRequest: NSFetchRequest<BudgetEntity> = BudgetEntity.fetchRequest()
            fetchRequest.predicate = NSPredicate(format: "id == %@", id)
            
            do {
                let results = try self.context.fetch(fetchRequest)
                if let entity = results.first {
                    let budget = Budget(
                        id: entity.id.uuidString,
                        name: entity.name,
                        categoryId: "", // Map from relationships
                        limit: entity.totalAmount.decimalValue,
                        spent: entity.spentAmount.decimalValue,
                        startDate: entity.startDate,
                        endDate: entity.endDate,
                        isRecurring: entity.period == BudgetPeriod.monthly.rawValue
                    )
                    promise(.success(budget))
                } else {
                    promise(.success(nil))
                }
            } catch {
                promise(.failure(error))
            }
        }.eraseToAnyPublisher()
    }
    
    /// Retrieves all budgets with proper error handling
    /// - Returns: Publisher emitting array of budgets or error
    func getAllBudgets() -> AnyPublisher<[Budget], Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(NSError(domain: "BudgetRepository", code: -1)))
                return
            }
            
            let fetchRequest: NSFetchRequest<BudgetEntity> = BudgetEntity.fetchRequest()
            fetchRequest.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: false)]
            
            do {
                let results = try self.context.fetch(fetchRequest)
                let budgets = results.map { entity in
                    Budget(
                        id: entity.id.uuidString,
                        name: entity.name,
                        categoryId: "", // Map from relationships
                        limit: entity.totalAmount.decimalValue,
                        spent: entity.spentAmount.decimalValue,
                        startDate: entity.startDate,
                        endDate: entity.endDate,
                        isRecurring: entity.period == BudgetPeriod.monthly.rawValue
                    )
                }
                promise(.success(budgets))
            } catch {
                promise(.failure(error))
            }
        }.eraseToAnyPublisher()
    }
    
    /// Updates an existing budget with proper error handling
    /// - Parameter budget: Updated budget domain model
    /// - Returns: Publisher emitting updated budget or error
    func updateBudget(_ budget: Budget) -> AnyPublisher<Budget, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(NSError(domain: "BudgetRepository", code: -1)))
                return
            }
            
            self.coreDataManager.performBackgroundTask { context in
                let fetchRequest: NSFetchRequest<BudgetEntity> = BudgetEntity.fetchRequest()
                fetchRequest.predicate = NSPredicate(format: "id == %@", budget.id)
                
                do {
                    let results = try context.fetch(fetchRequest)
                    guard let entity = results.first else {
                        throw NSError(domain: "BudgetRepository", code: -1, userInfo: [
                            NSLocalizedDescriptionKey: "Budget not found"
                        ])
                    }
                    
                    // Update entity properties
                    entity.name = budget.name
                    entity.totalAmount = NSDecimalNumber(decimal: budget.limit)
                    entity.spentAmount = NSDecimalNumber(decimal: budget.spent)
                    entity.startDate = budget.startDate
                    entity.endDate = budget.endDate
                    entity.updatedAt = Date()
                    
                    try context.save()
                    promise(.success(budget))
                } catch {
                    promise(.failure(error))
                }
            }
        }.eraseToAnyPublisher()
    }
    
    /// Deletes a budget by ID with proper error handling
    /// - Parameter id: Unique identifier of the budget to delete
    /// - Returns: Publisher emitting completion or error
    func deleteBudget(id: String) -> AnyPublisher<Void, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(NSError(domain: "BudgetRepository", code: -1)))
                return
            }
            
            self.coreDataManager.performBackgroundTask { context in
                let fetchRequest: NSFetchRequest<BudgetEntity> = BudgetEntity.fetchRequest()
                fetchRequest.predicate = NSPredicate(format: "id == %@", id)
                
                do {
                    let results = try context.fetch(fetchRequest)
                    if let entity = results.first {
                        context.delete(entity)
                        try context.save()
                        promise(.success(()))
                    } else {
                        throw NSError(domain: "BudgetRepository", code: -1, userInfo: [
                            NSLocalizedDescriptionKey: "Budget not found"
                        ])
                    }
                } catch {
                    promise(.failure(error))
                }
            }
        }.eraseToAnyPublisher()
    }
}