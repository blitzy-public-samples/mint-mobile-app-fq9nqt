//
// GoalEntity.swift
// MintReplicaLite
//
// Core Data entity for financial goal persistence
//

import CoreData // iOS 14.0+
import Foundation // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Verify Core Data model schema matches entity attributes
 2. Test data migration scenarios for schema updates
 3. Configure Core Data model versioning
 4. Review index configuration for performance optimization
 5. Test concurrent Core Data operations
*/

/// Core Data entity class representing a financial goal in local storage
/// Addresses requirements:
/// - Financial goal setting and progress monitoring
/// - Local SQLite database for offline data
@objc(GoalEntity)
@objcMembers
public class GoalEntity: NSManagedObject {
    
    // MARK: - Properties
    
    /// Unique identifier of the goal
    @NSManaged public var id: UUID
    
    /// Display name of the goal
    @NSManaged public var name: String
    
    /// Detailed description of the goal
    @NSManaged public var goalDescription: String
    
    /// Target amount to achieve
    @NSManaged public var targetAmount: NSDecimalNumber
    
    /// Current progress amount
    @NSManaged public var currentAmount: NSDecimalNumber
    
    /// Target completion date
    @NSManaged public var deadline: Date
    
    /// Creation timestamp
    @NSManaged public var createdAt: Date
    
    /// Completion timestamp (optional)
    @NSManaged public var completedAt: Date?
    
    /// Current goal status
    @NSManaged public var status: String
    
    /// Goal category
    @NSManaged public var category: String
    
    /// Last update timestamp
    @NSManaged public var updatedAt: Date
    
    // MARK: - Initialization
    
    /// Initializes a new goal entity with default values
    /// - Parameter context: NSManagedObjectContext for Core Data operations
    public override init(entity: NSEntityDescription, insertInto context: NSManagedObjectContext?) {
        super.init(entity: entity, insertInto: context)
        
        // Set default values
        self.id = UUID()
        self.createdAt = Date()
        self.updatedAt = Date()
        self.status = GoalStatus.notStarted.rawValue
        self.targetAmount = NSDecimalNumber.zero
        self.currentAmount = NSDecimalNumber.zero
    }
    
    // MARK: - Domain Model Conversion
    
    /// Converts Core Data entity to domain model
    /// - Returns: Goal domain model instance
    public func toDomain() -> Goal {
        // Convert stored amounts to Decimal
        let target = Decimal(string: targetAmount.stringValue) ?? .zero
        let current = Decimal(string: currentAmount.stringValue) ?? .zero
        
        // Create domain model instance with stored values
        do {
            let goal = try Goal(
                id: id,
                name: name,
                description: goalDescription,
                targetAmount: target,
                currentAmount: current,
                deadline: deadline,
                category: GoalCategory(rawValue: category) ?? .savings
            )
            return goal
        } catch {
            // Return default goal if validation fails
            // This should not happen with properly persisted data
            do {
                return try Goal(
                    id: id,
                    name: name,
                    description: goalDescription,
                    targetAmount: 1,
                    currentAmount: 0,
                    deadline: Date().addingTimeInterval(86400 * 30),
                    category: .savings
                )
            } catch {
                fatalError("Failed to create valid goal model: \(error)")
            }
        }
    }
    
    /// Updates entity with domain model data
    /// - Parameter goal: Goal domain model instance
    public func update(with goal: Goal) {
        // Update basic properties
        self.name = goal.name
        self.goalDescription = goal.description
        self.deadline = goal.deadline
        self.category = goal.category.rawValue
        self.status = goal.status.rawValue
        self.completedAt = goal.completedAt
        
        // Convert and update amounts
        self.targetAmount = NSDecimalNumber(decimal: goal.targetAmount)
        self.currentAmount = NSDecimalNumber(decimal: goal.currentAmount)
        
        // Update timestamp
        self.updatedAt = Date()
        
        // Mark object as updated in context
        if let context = self.managedObjectContext {
            context.refresh(self, mergeChanges: true)
        }
    }
}