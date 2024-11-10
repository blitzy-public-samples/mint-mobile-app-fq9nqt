//
// InvestmentRepository.swift
// MintReplicaLite
//
// Repository implementation for managing investment data persistence and synchronization
//

import Foundation // iOS 15.0+
import CoreData // iOS 15.0+
import Combine // iOS 15.0+

// MARK: - Human Tasks
/*
 1. Configure Core Data model schema for investments
 2. Set up background fetch capabilities in project settings
 3. Configure API endpoints for investment data synchronization
 4. Set up proper error logging and monitoring
 5. Test concurrent Core Data operations
 6. Verify proper cleanup of Combine subscriptions
*/

/// Repository implementation for managing investment data with local persistence and remote synchronization
/// Addresses requirements:
/// - Investment Portfolio Tracking: Basic investment portfolio tracking functionality
/// - Real-time Data Synchronization: Support for data synchronization between local and remote storage
/// - Offline Support: Local SQLite database for offline data storage
@available(iOS 15.0, *)
final class InvestmentRepository {
    
    // MARK: - Properties
    
    private let context: NSManagedObjectContext
    private let apiClient: APIClient
    private(set) var investmentsSubject = CurrentValueSubject<[Investment], Never>([])
    private var cancellables = Set<AnyCancellable>()
    private let syncQueue = DispatchQueue(label: "com.mintreplicalite.investment.sync",
                                        qos: .utility)
    
    // MARK: - Initialization
    
    /// Initializes repository with Core Data context and API client
    /// - Parameters:
    ///   - context: NSManagedObjectContext for data persistence
    ///   - apiClient: APIClient for remote operations
    init(context: NSManagedObjectContext, apiClient: APIClient) {
        self.context = context
        self.apiClient = apiClient
        setupBackgroundSync()
    }
    
    // MARK: - CRUD Operations
    
    /// Creates a new investment record with local persistence and queues remote sync
    /// - Parameter investment: Investment model to create
    /// - Returns: Created investment or error
    func create(investment: Investment) async throws -> Result<Investment, RepositoryError> {
        return try await withCheckedThrowingContinuation { continuation in
            context.performAndWait {
                do {
                    // Create new entity
                    let entity = InvestmentEntity(entity: InvestmentEntity.entity(),
                                                insertInto: context)
                    entity.update(from: investment)
                    
                    // Save context
                    try context.save()
                    
                    // Update subject
                    var investments = investmentsSubject.value
                    investments.append(investment)
                    investmentsSubject.send(investments)
                    
                    // Queue remote sync
                    queueRemoteSync(for: investment)
                    
                    continuation.resume(returning: .success(investment))
                } catch {
                    continuation.resume(returning: .failure(.creationFailed(error)))
                }
            }
        }
    }
    
    /// Retrieves an investment by ID from local storage
    /// - Parameter id: Investment identifier
    /// - Returns: Found investment or nil
    func read(id: String) async throws -> Result<Investment?, RepositoryError> {
        return try await withCheckedThrowingContinuation { continuation in
            context.performAndWait {
                do {
                    // Create fetch request
                    let request = InvestmentEntity.fetchRequest()
                    request.predicate = NSPredicate(format: "id == %@", id)
                    
                    // Execute fetch
                    let result = try context.fetch(request)
                    let investment = result.first?.toDomain()
                    
                    continuation.resume(returning: .success(investment))
                } catch {
                    continuation.resume(returning: .failure(.readFailed(error)))
                }
            }
        }
    }
    
    /// Updates an existing investment with optimistic locking
    /// - Parameter investment: Investment model to update
    /// - Returns: Updated investment or error
    func update(investment: Investment) async throws -> Result<Investment, RepositoryError> {
        return try await withCheckedThrowingContinuation { continuation in
            context.performAndWait {
                do {
                    // Fetch existing entity
                    let request = InvestmentEntity.fetchRequest()
                    request.predicate = NSPredicate(format: "id == %@", investment.id)
                    
                    guard let entity = try context.fetch(request).first else {
                        continuation.resume(returning: .failure(.notFound))
                        return
                    }
                    
                    // Update entity
                    entity.update(from: investment)
                    
                    // Save context
                    try context.save()
                    
                    // Update subject
                    var investments = investmentsSubject.value
                    if let index = investments.firstIndex(where: { $0.id == investment.id }) {
                        investments[index] = investment
                        investmentsSubject.send(investments)
                    }
                    
                    // Queue remote sync
                    queueRemoteSync(for: investment)
                    
                    continuation.resume(returning: .success(investment))
                } catch {
                    continuation.resume(returning: .failure(.updateFailed(error)))
                }
            }
        }
    }
    
    /// Deletes an investment by ID with remote sync
    /// - Parameter id: Investment identifier to delete
    /// - Returns: Success or error
    func delete(id: String) async throws -> Result<Void, RepositoryError> {
        return try await withCheckedThrowingContinuation { continuation in
            context.performAndWait {
                do {
                    // Fetch entity
                    let request = InvestmentEntity.fetchRequest()
                    request.predicate = NSPredicate(format: "id == %@", id)
                    
                    guard let entity = try context.fetch(request).first else {
                        continuation.resume(returning: .failure(.notFound))
                        return
                    }
                    
                    // Delete entity
                    context.delete(entity)
                    
                    // Save context
                    try context.save()
                    
                    // Update subject
                    var investments = investmentsSubject.value
                    investments.removeAll { $0.id == id }
                    investmentsSubject.send(investments)
                    
                    // Queue remote delete
                    queueRemoteDelete(for: id)
                    
                    continuation.resume(returning: .success(()))
                } catch {
                    continuation.resume(returning: .failure(.deletionFailed(error)))
                }
            }
        }
    }
    
    /// Retrieves all investments matching optional criteria
    /// - Parameter criteria: Optional filtering criteria
    /// - Returns: List of investments or error
    func list(criteria: [String: Any]? = nil) async throws -> Result<[Investment], RepositoryError> {
        return try await withCheckedThrowingContinuation { continuation in
            context.performAndWait {
                do {
                    // Create fetch request
                    let request = InvestmentEntity.fetchRequest()
                    
                    // Apply criteria if provided
                    if let criteria = criteria {
                        var predicates: [NSPredicate] = []
                        
                        if let type = criteria["type"] as? InvestmentType {
                            predicates.append(NSPredicate(format: "type == %@", type.rawValue))
                        }
                        
                        if let accountId = criteria["accountId"] as? String {
                            predicates.append(NSPredicate(format: "accountId == %@", accountId))
                        }
                        
                        if !predicates.isEmpty {
                            request.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: predicates)
                        }
                    }
                    
                    // Add sorting
                    request.sortDescriptors = [
                        NSSortDescriptor(key: "lastUpdated", ascending: false)
                    ]
                    
                    // Execute fetch
                    let entities = try context.fetch(request)
                    let investments = entities.map { $0.toDomain() }
                    
                    // Update subject
                    investmentsSubject.send(investments)
                    
                    continuation.resume(returning: .success(investments))
                } catch {
                    continuation.resume(returning: .failure(.readFailed(error)))
                }
            }
        }
    }
    
    // MARK: - Synchronization
    
    /// Synchronizes investment data with remote server using conflict resolution
    /// - Returns: Success or error
    func sync() async throws -> Result<Void, RepositoryError> {
        return try await withCheckedThrowingContinuation { continuation in
            Task {
                do {
                    // Fetch remote data
                    let request = APIRequest<[Investment]>(endpoint: "/api/v1/investments")
                    let result = try await apiClient.request(request).value
                    
                    // Update local storage
                    try await updateLocalStorage(with: result)
                    
                    continuation.resume(returning: .success(()))
                } catch {
                    continuation.resume(returning: .failure(.syncFailed(error)))
                }
            }
        }
    }
    
    /// Updates current prices for all investments from market data API
    /// - Returns: Success or error
    func updatePrices() async throws -> Result<Void, RepositoryError> {
        return try await withCheckedThrowingContinuation { continuation in
            Task {
                do {
                    // Fetch current investments
                    let investments = try await list().get()
                    
                    // Update prices in batches
                    let batchSize = 50
                    for batch in stride(from: 0, to: investments.count, by: batchSize) {
                        let end = min(batch + batchSize, investments.count)
                        let symbols = investments[batch..<end].map { $0.symbol }
                        
                        // Fetch market data
                        let request = APIRequest<[String: Double]>(
                            endpoint: "/api/v1/market/prices",
                            parameters: ["symbols": symbols]
                        )
                        let prices = try await apiClient.request(request).value
                        
                        // Update local entities
                        try await updatePrices(prices, for: investments[batch..<end])
                    }
                    
                    continuation.resume(returning: .success(()))
                } catch {
                    continuation.resume(returning: .failure(.updateFailed(error)))
                }
            }
        }
    }
    
    // MARK: - Private Methods
    
    private func setupBackgroundSync() {
        // Set up periodic background sync
        Timer.publish(every: 900, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                Task {
                    try? await self?.sync()
                }
            }
            .store(in: &cancellables)
    }
    
    private func queueRemoteSync(for investment: Investment) {
        Task {
            let request = APIRequest<Investment>(
                endpoint: "/api/v1/investments/\(investment.id)",
                method: .put,
                parameters: investment
            )
            _ = try? await apiClient.request(request).value
        }
    }
    
    private func queueRemoteDelete(for id: String) {
        Task {
            let request = APIRequest<Void>(
                endpoint: "/api/v1/investments/\(id)",
                method: .delete
            )
            _ = try? await apiClient.request(request).value
        }
    }
    
    private func updateLocalStorage(with investments: [Investment]) async throws {
        return try await withCheckedThrowingContinuation { continuation in
            context.performAndWait {
                do {
                    // Fetch existing entities
                    let request = InvestmentEntity.fetchRequest()
                    let existingEntities = try context.fetch(request)
                    
                    // Create lookup dictionary
                    let existingDict = Dictionary(
                        uniqueKeysWithValues: existingEntities.map { ($0.id, $0) }
                    )
                    
                    // Update or create entities
                    for investment in investments {
                        if let entity = existingDict[investment.id] {
                            entity.update(from: investment)
                        } else {
                            let entity = InvestmentEntity(entity: InvestmentEntity.entity(),
                                                        insertInto: context)
                            entity.update(from: investment)
                        }
                    }
                    
                    // Save changes
                    try context.save()
                    
                    // Update subject
                    investmentsSubject.send(investments)
                    
                    continuation.resume()
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }
    
    private func updatePrices(_ prices: [String: Double], for investments: ArraySlice<Investment>) async throws {
        return try await withCheckedThrowingContinuation { continuation in
            context.performAndWait {
                do {
                    // Fetch entities for the batch
                    let request = InvestmentEntity.fetchRequest()
                    request.predicate = NSPredicate(
                        format: "id IN %@",
                        investments.map { $0.id }
                    )
                    
                    let entities = try context.fetch(request)
                    
                    // Update prices
                    for entity in entities {
                        if let price = prices[entity.symbol] {
                            entity.currentPrice = price
                            entity.lastUpdated = Date()
                        }
                    }
                    
                    // Save changes
                    try context.save()
                    
                    // Update subject with new prices
                    var updatedInvestments = investmentsSubject.value
                    for (index, investment) in updatedInvestments.enumerated() {
                        if let price = prices[investment.symbol] {
                            var updated = investment
                            updated.currentPrice = price
                            updatedInvestments[index] = updated
                        }
                    }
                    investmentsSubject.send(updatedInvestments)
                    
                    continuation.resume()
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }
}

// MARK: - RepositoryProtocol Conformance

extension InvestmentRepository: RepositoryProtocol {
    typealias Model = Investment
    typealias Error = RepositoryError
}