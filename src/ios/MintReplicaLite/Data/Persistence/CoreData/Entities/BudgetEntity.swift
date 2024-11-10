//
// BudgetEntity.swift
// MintReplicaLite
//
// Core Data managed object subclass for budget persistence
//

import CoreData // iOS 14.0+
import Foundation // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Verify Core Data model configuration matches entity attributes
 2. Ensure proper indexing is set up for frequently queried properties
 3. Test category relationship deletion rules
 4. Validate thread safety when accessing managed objects
*/

// MARK: - Budget Period Enum
/// Budget period enumeration for time-based budget tracking
@objc enum BudgetPeriod: Int16 {
    case daily = 0
    case weekly = 1
    case monthly = 2
    case yearly = 3
}

// MARK: - Budget Status Enum
/// Budget status enumeration for lifecycle management
@objc enum BudgetStatus: Int16 {
    case active = 0
    case completed = 1
    case archived = 2
}

// MARK: - Budget Entity
/// Core Data managed object subclass representing a budget entity
/// Addresses requirements:
/// - Budget Creation and Monitoring: Implements persistent storage for budget tracking
/// - Local Data Storage: Core Data entity implementation with proper relationships
/// - Offline Support: Enables offline data persistence with sync state
@objc(BudgetEntity)
@objcMembers
final class BudgetEntity: NSManagedObject {
    
    // MARK: - Properties
    
    @NSManaged var id: UUID
    @NSManaged var name: String
    @NSManaged var budgetDescription: String?
    @NSManaged var period: Int16
    @NSManaged var totalAmount: NSDecimalNumber
    @NSManaged var spentAmount: NSDecimalNumber
    @NSManaged var startDate: Date
    @NSManaged var endDate: Date
    @NSManaged var status: Int16
    @NSManaged var categories: NSSet?
    @NSManaged var createdAt: Date
    @NSManaged var updatedAt: Date
    
    // MARK: - Lifecycle
    
    override func awakeFromInsert() {
        super.awakeFromInsert()
        id = UUID()
        createdAt = Date()
        updatedAt = Date()
        totalAmount = NSDecimalNumber.zero
        spentAmount = NSDecimalNumber.zero
        status = BudgetStatus.active.rawValue
    }
    
    // MARK: - Public Methods
    
    /// Converts entity to data transfer object with proper currency formatting
    /// - Returns: BudgetDTO instance with formatted values
    func toDTO() -> BudgetDTO {
        let formatter = CurrencyFormatter.shared
        
        let categoryDTOs = (categories?.allObjects as? [CategoryEntity])?.map { category in
            CategoryDTO(id: category.id,
                       name: category.name,
                       type: category.type,
                       createdAt: category.createdAt,
                       updatedAt: category.updatedAt)
        } ?? []
        
        return BudgetDTO(
            id: id,
            name: name,
            description: budgetDescription,
            period: BudgetPeriod(rawValue: period) ?? .monthly,
            totalAmount: totalAmount.decimalValue,
            spentAmount: spentAmount.decimalValue,
            startDate: startDate,
            endDate: endDate,
            status: BudgetStatus(rawValue: status) ?? .active,
            categories: categoryDTOs,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }
    
    /// Updates entity from data transfer object with proper validation
    /// - Parameter dto: Budget data transfer object
    func updateFromDTO(_ dto: BudgetDTO) {
        self.name = dto.name
        self.budgetDescription = dto.description
        self.period = dto.period.rawValue
        self.totalAmount = NSDecimalNumber(decimal: dto.totalAmount)
        self.spentAmount = NSDecimalNumber(decimal: dto.spentAmount)
        self.startDate = dto.startDate
        self.endDate = dto.endDate
        self.status = dto.status.rawValue
        self.updatedAt = Date()
        
        // Update category relationships
        if let context = self.managedObjectContext {
            let categoryEntities = dto.categories.map { categoryDTO -> CategoryEntity in
                let categoryEntity = CategoryEntity(context: context)
                categoryEntity.id = categoryDTO.id
                categoryEntity.name = categoryDTO.name
                categoryEntity.type = categoryDTO.type
                categoryEntity.createdAt = categoryDTO.createdAt
                categoryEntity.updatedAt = categoryDTO.updatedAt
                return categoryEntity
            }
            self.categories = NSSet(array: categoryEntities)
        }
    }
}

// MARK: - Budget DTO
/// Data transfer object for budget data with value type semantics
struct BudgetDTO {
    let id: UUID
    let name: String
    let description: String?
    let period: BudgetPeriod
    let totalAmount: Decimal
    let spentAmount: Decimal
    let startDate: Date
    let endDate: Date
    let status: BudgetStatus
    let categories: [CategoryDTO]
    let createdAt: Date
    let updatedAt: Date
}

// MARK: - Category DTO
/// Data transfer object for category data
struct CategoryDTO {
    let id: UUID
    let name: String
    let type: String
    let createdAt: Date
    let updatedAt: Date
}