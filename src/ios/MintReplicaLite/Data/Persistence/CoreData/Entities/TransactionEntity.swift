//
// TransactionEntity.swift
// MintReplicaLite
//
// Core Data entity model for financial transactions with persistence capabilities
//

import CoreData // iOS 14.0+
import Foundation // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Verify Core Data model schema matches entity attributes
 2. Test data migration scenarios when schema changes
 3. Monitor CoreData performance with large transaction sets
 4. Ensure proper index configuration for frequent queries
*/

/// Core Data entity representing a financial transaction with persistence capabilities
/// Requirements addressed:
/// - Transaction tracking and categorization (1.2 Scope/Core Features)
/// - Local SQLite database for offline data (5.2.1 Mobile Applications)
/// - Data Architecture (5.2.4 Data Architecture)
@objc(TransactionEntity)
@objcMembers
public class TransactionEntity: NSManagedObject {
    
    // MARK: - Properties
    
    /// Unique identifier for the transaction
    @NSManaged public var id: UUID
    
    /// Associated account identifier
    @NSManaged public var accountId: String
    
    /// Transaction description
    @NSManaged public var transactionDescription: String
    
    /// Transaction amount with decimal precision
    @NSManaged public var amount: NSDecimalNumber
    
    /// Transaction date
    @NSManaged public var date: Date
    
    /// Transaction category
    @NSManaged public var category: String
    
    /// Flag indicating if transaction is pending
    @NSManaged public var isPending: Bool
    
    /// Merchant name
    @NSManaged public var merchantName: String
    
    /// Optional transaction notes
    @NSManaged public var notes: String?
    
    /// Type of transaction (debit, credit, transfer, refund)
    @NSManaged public var transactionType: String
    
    /// Entity creation timestamp
    @NSManaged public var createdAt: Date
    
    /// Last update timestamp
    @NSManaged public var updatedAt: Date
    
    // MARK: - Initialization
    
    /// Initializes a new transaction entity with managed object context
    /// Requirements addressed:
    /// - Local SQLite database for offline data (5.2.1 Mobile Applications)
    public override init(entity: NSEntityDescription, insertInto context: NSManagedObjectContext?) {
        super.init(entity: entity, insertInto: context)
        
        // Set default timestamps
        let currentDate = Date()
        self.createdAt = currentDate
        self.updatedAt = currentDate
        
        // Set default values
        self.merchantName = ""
        self.transactionDescription = ""
        self.category = ""
        self.accountId = ""
        self.transactionType = TransactionType.debit.rawValue
        self.amount = NSDecimalNumber.zero
    }
    
    // MARK: - Domain Model Conversion
    
    /// Converts Core Data entity to domain model
    /// Requirements addressed:
    /// - Transaction tracking and categorization (1.2 Scope/Core Features)
    /// - Data Architecture (5.2.4 Data Architecture)
    public func toDomainModel() -> Transaction {
        do {
            return try Transaction(
                id: id,
                description: transactionDescription,
                amount: amount.decimalValue,
                date: date,
                category: category,
                accountId: accountId,
                isPending: isPending,
                merchantName: merchantName.isEmpty ? nil : merchantName,
                notes: notes,
                type: TransactionType(rawValue: transactionType) ?? .debit
            )
        } catch {
            // If validation fails, return a safe default transaction
            // This should be logged for monitoring
            return try! Transaction(
                id: id,
                description: transactionDescription,
                amount: 0.0,
                date: date,
                category: "Uncategorized",
                accountId: accountId,
                isPending: true,
                type: .debit
            )
        }
    }
    
    /// Updates entity with domain model data
    /// Requirements addressed:
    /// - Transaction tracking and categorization (1.2 Scope/Core Features)
    /// - Data Architecture (5.2.4 Data Architecture)
    public func update(with transaction: Transaction) {
        self.id = transaction.id
        self.transactionDescription = transaction.description
        self.amount = NSDecimalNumber(decimal: transaction.amount)
        self.date = transaction.date
        self.category = transaction.category
        self.accountId = transaction.accountId
        self.isPending = transaction.isPending
        self.merchantName = transaction.merchantName ?? ""
        self.notes = transaction.notes
        self.transactionType = transaction.type.rawValue
        self.updatedAt = Date()
    }
}

// MARK: - Fetch Request

extension TransactionEntity {
    /// Creates a fetch request for transaction entities
    /// Requirements addressed:
    /// - Local SQLite database for offline data (5.2.1 Mobile Applications)
    @nonobjc public class func fetchRequest() -> NSFetchRequest<TransactionEntity> {
        return NSFetchRequest<TransactionEntity>(entityName: "TransactionEntity")
    }
}