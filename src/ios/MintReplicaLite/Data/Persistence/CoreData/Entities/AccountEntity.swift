//
// AccountEntity.swift
// MintReplicaLite
//
// Core Data entity model for financial account persistence
//

import CoreData // iOS 14.0+
import Foundation // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Verify Core Data model schema matches AccountEntity properties
 2. Configure Core Data model version and migration if schema changes
 3. Test relationship deletion rules with TransactionEntity
 4. Validate data consistency after sync operations
*/

/// Core Data entity representing a financial account with persistence capabilities
/// Addresses requirements:
/// - Local SQLite database for offline data (5.2.1 Mobile Applications)
/// - Financial institution integration (1.2 Scope/Core Features)
/// - Data Architecture (5.2.4 Data Architecture)
@objc(AccountEntity)
@objcMembers
public class AccountEntity: NSManagedObject {
    
    // MARK: - Properties
    
    /// Unique identifier for the account
    @NSManaged public var id: String
    
    /// Identifier for the associated financial institution
    @NSManaged public var institutionId: String
    
    /// Display name of the account
    @NSManaged public var name: String
    
    /// Optional name of the financial institution
    @NSManaged public var institutionName: String?
    
    /// String representation of AccountType enum
    @NSManaged public var type: String
    
    /// Current balance of the account
    @NSManaged public var balance: Decimal
    
    /// Currency code for the account (e.g., "USD", "EUR")
    @NSManaged public var currency: String
    
    /// Timestamp of the last successful sync
    @NSManaged public var lastSynced: Date
    
    /// Flag indicating if the account is currently active
    @NSManaged public var isActive: Bool
    
    /// Related transactions for this account
    @NSManaged public var transactions: NSSet?
    
    // MARK: - Initialization
    
    /// Initializes a new account entity in the specified managed object context
    /// - Parameter context: The managed object context for persistence
    public override init(entity: NSEntityDescription, insertInto context: NSManagedObjectContext?) {
        super.init(entity: entity, insertInto: context)
        
        // Set default values for required properties
        self.id = UUID().uuidString
        self.institutionId = ""
        self.name = ""
        self.type = AccountType.other.rawValue
        self.balance = 0
        self.currency = "USD"
        self.lastSynced = Date()
        self.isActive = true
    }
    
    // MARK: - Domain Model Conversion
    
    /// Converts Core Data entity to domain model
    /// - Returns: Account domain model instance
    public func toDomainModel() -> Account {
        return Account(
            id: id,
            institutionId: institutionId,
            name: name,
            institutionName: institutionName,
            type: AccountType(rawValue: type) ?? .other,
            balance: balance,
            currency: currency,
            lastSynced: lastSynced,
            isActive: isActive
        )
    }
    
    /// Updates entity with domain model data
    /// - Parameter account: Account domain model to update from
    public func update(from account: Account) {
        self.id = account.id
        self.institutionId = account.institutionId
        self.name = account.name
        self.institutionName = account.institutionName
        self.type = account.type.rawValue
        self.balance = account.balance
        self.currency = account.currency
        self.lastSynced = account.lastSynced
        self.isActive = account.isActive
        
        // Mark object as updated
        self.managedObjectContext?.refresh(self, mergeChanges: true)
    }
}

// MARK: - Generated accessors for transactions
extension AccountEntity {
    
    @objc(addTransactionsObject:)
    @NSManaged public func addToTransactions(_ value: NSManagedObject)
    
    @objc(removeTransactionsObject:)
    @NSManaged public func removeFromTransactions(_ value: NSManagedObject)
    
    @objc(addTransactions:)
    @NSManaged public func addToTransactions(_ values: NSSet)
    
    @objc(removeTransactions:)
    @NSManaged public func removeFromTransactions(_ values: NSSet)
}