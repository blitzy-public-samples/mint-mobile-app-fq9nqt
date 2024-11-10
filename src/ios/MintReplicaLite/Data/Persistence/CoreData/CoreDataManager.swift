//
// CoreDataManager.swift
// MintReplicaLite
//
// Thread-safe Core Data stack manager implementing StorageProtocol
// for local data persistence in the iOS app

// MARK: - Human Tasks
// - Create MintReplicaLite.xcdatamodeld file and configure entity models
// - Add Core Data model version configurations for future migrations
// - Configure proper data protection level in Info.plist for encryption
// - Set up automated iCloud backup exclusions for sensitive data
// - Add background mode capability if using background persistence

import CoreData      // iOS 14.0+
import Foundation    // iOS 14.0+

/// Manages Core Data stack and operations with thread safety and error handling
/// Addresses requirements:
/// - Local Data Storage (5.2.1): Implements SQLite persistence
/// - Data Architecture (5.2.4): Primary iOS storage implementation
/// - Offline Support (1.2): Encrypted data with backup systems
@objc final class CoreDataManager {
    
    // MARK: - Properties
    
    /// Shared singleton instance for centralized database access
    static let shared = CoreDataManager()
    
    /// Core Data persistent container managing the stack
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "MintReplicaLite")
        
        // Configure persistent store with encryption and protection
        let storeDescription = container.persistentStoreDescriptions.first
        storeDescription?.setOption(FileProtectionType.complete as NSObject,
                                  forKey: NSPersistentStoreFileProtectionKey)
        
        container.loadPersistentStores { (storeDescription, error) in
            if let error = error as NSError? {
                fatalError("Unresolved Core Data error \(error), \(error.userInfo)")
            }
        }
        
        // Configure automatic merging of changes
        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergePolicy.mergeByPropertyObjectTrump
        
        return container
    }()
    
    /// Main thread managed object context
    var viewContext: NSManagedObjectContext {
        return persistentContainer.viewContext
    }
    
    // MARK: - Initialization
    
    private init() {}
    
    // MARK: - Context Management
    
    /// Saves changes in the view context with error handling
    /// - Returns: Result indicating success or error details
    func saveContext() -> Result<Void, Error> {
        let context = persistentContainer.viewContext
        
        guard context.hasChanges else {
            return .success(())
        }
        
        do {
            try context.save()
            return .success(())
        } catch {
            return .failure(StorageError.storageOperationFailed(error.localizedDescription))
        }
    }
    
    /// Executes a task in a background context for performance optimization
    /// - Parameter task: Closure containing the background operations to perform
    func performBackgroundTask(_ task: @escaping (NSManagedObjectContext) -> Void) {
        persistentContainer.performBackgroundTask { context in
            context.mergePolicy = NSMergePolicy.mergeByPropertyObjectTrump
            
            task(context)
            
            if context.hasChanges {
                do {
                    try context.save()
                } catch {
                    print("Error saving background context: \(error)")
                }
            }
        }
    }
    
    /// Removes all data from Core Data store with error handling
    /// - Returns: Result indicating success or error details
    func clearStorage() -> Result<Void, Error> {
        let context = persistentContainer.newBackgroundContext()
        context.mergePolicy = NSMergePolicy.mergeByPropertyObjectTrump
        
        return Result {
            try context.performAndWait {
                // Fetch all entity names from the model
                let entities = persistentContainer.managedObjectModel.entities
                
                // Delete all objects for each entity
                try entities.forEach { entity in
                    guard let entityName = entity.name else { return }
                    
                    let fetchRequest = NSFetchRequest<NSFetchRequestResult>(entityName: entityName)
                    let batchDeleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)
                    batchDeleteRequest.resultType = .resultTypeObjectIDs
                    
                    let result = try context.execute(batchDeleteRequest) as? NSBatchDeleteResult
                    let objectIDArray = result?.result as? [NSManagedObjectID] ?? []
                    
                    // Merge changes to view context
                    NSManagedObjectContext.mergeChanges(
                        fromRemoteContextSave: [NSDeletedObjectsKey: objectIDArray],
                        into: [persistentContainer.viewContext]
                    )
                }
                
                try context.save()
            }
            return ()
        }
    }
}

// MARK: - StorageProtocol Conformance

extension CoreDataManager: StorageProtocol {
    /// Save a Codable item to Core Data
    /// - Parameters:
    ///   - item: The item to save
    ///   - key: Entity name and identifier for the item
    /// - Returns: Result indicating success or error
    func save<T>(_ item: T, key: String) -> Result<Void, Error> where T: Codable {
        let context = persistentContainer.viewContext
        
        return Result {
            // Convert item to JSON data
            let encoder = JSONEncoder()
            let jsonData = try encoder.encode(item)
            
            // Create or update entity
            let entityName = String(describing: type(of: item))
            let fetchRequest = NSFetchRequest<NSManagedObject>(entityName: entityName)
            fetchRequest.predicate = NSPredicate(format: "identifier == %@", key)
            
            let objects = try context.fetch(fetchRequest)
            let managedObject = objects.first ?? NSEntityDescription.insertNewObject(
                forEntityName: entityName,
                into: context
            )
            
            managedObject.setValue(key, forKey: "identifier")
            managedObject.setValue(jsonData, forKey: "data")
            
            try context.save()
        }
    }
    
    /// Retrieve a stored item from Core Data
    /// - Parameter key: Entity name and identifier of the item
    /// - Returns: Result containing the decoded item or error
    func retrieve<T>(key: String) -> Result<T?, Error> where T: Codable {
        let context = persistentContainer.viewContext
        
        return Result {
            let entityName = String(describing: T.self)
            let fetchRequest = NSFetchRequest<NSManagedObject>(entityName: entityName)
            fetchRequest.predicate = NSPredicate(format: "identifier == %@", key)
            
            let objects = try context.fetch(fetchRequest)
            guard let managedObject = objects.first,
                  let jsonData = managedObject.value(forKey: "data") as? Data else {
                return nil
            }
            
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: jsonData)
        }
    }
    
    /// Delete a stored item from Core Data
    /// - Parameter key: Entity name and identifier of the item to delete
    /// - Returns: Result indicating success or error
    func delete(key: String) -> Result<Void, Error> {
        let context = persistentContainer.viewContext
        
        return Result {
            let fetchRequest = NSFetchRequest<NSFetchRequestResult>(entityName: key)
            let batchDeleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)
            try context.execute(batchDeleteRequest)
            try context.save()
        }
    }
    
    /// Clear all data from Core Data store
    /// - Returns: Result indicating success or error
    func clear() -> Result<Void, Error> {
        return clearStorage()
    }
}