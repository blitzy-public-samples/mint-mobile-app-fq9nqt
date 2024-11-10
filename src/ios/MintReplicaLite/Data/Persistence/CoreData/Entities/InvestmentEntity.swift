//
// InvestmentEntity.swift
// MintReplicaLite
//
// Core Data entity class for investment data persistence
//

import CoreData
import Foundation

// MARK: - Human Tasks
/*
 1. Verify Core Data model schema matches InvestmentEntity properties
 2. Configure Core Data model versioning for future schema updates
 3. Test data migration scenarios with sample investment data
 4. Set up proper indexes for performance optimization
 5. Validate thread safety for concurrent Core Data operations
*/

/// Core Data entity class representing an investment holding in the local database
/// Addresses requirements:
/// - Investment Portfolio Tracking: Basic investment portfolio tracking functionality with local data persistence
/// - Offline Support: Local SQLite database for offline data storage
@objc(InvestmentEntity)
public class InvestmentEntity: NSManagedObject {
    
    // MARK: - Properties
    
    @NSManaged public var id: String
    @NSManaged public var symbol: String
    @NSManaged public var name: String
    @NSManaged public var quantity: Double
    @NSManaged public var costBasis: Double
    @NSManaged public var currentPrice: Double
    @NSManaged public var accountId: String
    @NSManaged public var lastUpdated: Date
    @NSManaged public var type: String
    
    // MARK: - Initialization
    
    /// Initializes a new investment entity with managed object context
    /// - Parameter context: NSManagedObjectContext for Core Data operations
    override public init(entity: NSEntityDescription, insertInto context: NSManagedObjectContext?) {
        super.init(entity: entity, insertInto: context)
        lastUpdated = Date()
    }
    
    // MARK: - Domain Model Conversion
    
    /// Converts Core Data entity to domain model
    /// - Returns: Investment domain model instance
    public func toDomain() -> Investment {
        Investment(
            id: id,
            symbol: symbol,
            name: name,
            quantity: quantity,
            costBasis: costBasis,
            currentPrice: currentPrice,
            accountId: accountId,
            type: InvestmentType(rawValue: type) ?? .other
        )
    }
    
    /// Updates entity with domain model data
    /// - Parameter investment: Investment domain model instance to update from
    public func update(from investment: Investment) {
        self.id = investment.id
        self.symbol = investment.symbol
        self.name = investment.name
        self.quantity = investment.quantity
        self.costBasis = investment.costBasis
        self.currentPrice = investment.currentPrice
        self.accountId = investment.accountId
        self.type = investment.type.rawValue
        self.lastUpdated = Date()
    }
}

// MARK: - Fetch Request Extension

extension InvestmentEntity {
    
    /// Creates a fetch request for InvestmentEntity
    /// - Returns: NSFetchRequest configured for InvestmentEntity
    @nonobjc public class func fetchRequest() -> NSFetchRequest<InvestmentEntity> {
        return NSFetchRequest<InvestmentEntity>(entityName: "InvestmentEntity")
    }
    
    /// Creates a fetch request for investments by account ID
    /// - Parameter accountId: Account identifier to filter investments
    /// - Returns: NSFetchRequest configured with account ID predicate
    @nonobjc public class func fetchRequestForAccount(_ accountId: String) -> NSFetchRequest<InvestmentEntity> {
        let request = fetchRequest()
        request.predicate = NSPredicate(format: "accountId == %@", accountId)
        request.sortDescriptors = [NSSortDescriptor(key: "lastUpdated", ascending: false)]
        return request
    }
    
    /// Creates a fetch request for investments by type
    /// - Parameter type: Investment type to filter
    /// - Returns: NSFetchRequest configured with type predicate
    @nonobjc public class func fetchRequestForType(_ type: InvestmentType) -> NSFetchRequest<InvestmentEntity> {
        let request = fetchRequest()
        request.predicate = NSPredicate(format: "type == %@", type.rawValue)
        request.sortDescriptors = [NSSortDescriptor(key: "lastUpdated", ascending: false)]
        return request
    }
}