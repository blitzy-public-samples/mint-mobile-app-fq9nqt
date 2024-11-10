//
// BudgetUseCases.swift
// MintReplicaLite
//
// Use case implementations for budget-related business logic
//

import Foundation // iOS 14.0+
import Combine   // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Verify notification thresholds match business requirements
 2. Test budget monitoring across different time zones
 3. Configure notification categories for budget alerts
 4. Review budget status calculation logic with stakeholders
*/

// MARK: - BudgetStatus Enum
/// Enumeration of possible budget statuses for monitoring and alerts
/// Requirements addressed:
/// - Real-time notifications and alerts (1.2 Scope/Core Features)
@frozen
public enum BudgetStatus: String {
    case underBudget
    case approaching
    case overBudget
    
    /// Threshold percentage for approaching status
    private static let approachingThreshold: Double = 80.0
    
    /// Determines status based on spent percentage
    static func from(spentPercentage: Double) -> BudgetStatus {
        switch spentPercentage {
        case ..<approachingThreshold:
            return .underBudget
        case approachingThreshold..<100:
            return .approaching
        default:
            return .overBudget
        }
    }
}

// MARK: - BudgetUseCases Class
/// Implements business logic for budget management and monitoring
/// Requirements addressed:
/// - Budget creation and monitoring (1.2 Scope/Core Features)
/// - Native iOS application using Swift (5.2.1 Mobile Applications)
@available(iOS 14.0, *)
public final class BudgetUseCases {
    
    // MARK: - Properties
    
    private let repository: BudgetRepository
    private let notificationManager: NotificationManager
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    /// Initializes budget use cases with required dependencies
    /// - Parameter repository: Repository for budget data operations
    public init(repository: BudgetRepository) {
        self.repository = repository
        self.notificationManager = NotificationManager.shared
    }
    
    // MARK: - Public Methods
    
    /// Creates a new budget and sets up monitoring
    /// Requirements addressed:
    /// - Budget creation and monitoring (1.2 Scope/Core Features)
    /// - Real-time notifications and alerts (1.2 Scope/Core Features)
    public func createBudget(_ budget: Budget) -> AnyPublisher<Budget, Error> {
        return repository.createBudget(budget)
            .flatMap { [weak self] createdBudget -> AnyPublisher<Budget, Error> in
                guard let self = self else {
                    return Fail(error: NSError(domain: "BudgetUseCases", code: -1)).eraseToAnyPublisher()
                }
                
                // Set up initial monitoring
                return self.setupBudgetMonitoring(createdBudget)
                    .map { _ in createdBudget }
                    .eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    /// Updates an existing budget and adjusts monitoring
    /// Requirements addressed:
    /// - Budget creation and monitoring (1.2 Scope/Core Features)
    /// - Real-time notifications and alerts (1.2 Scope/Core Features)
    public func updateBudget(_ budget: Budget) -> AnyPublisher<Budget, Error> {
        return repository.updateBudget(budget)
            .flatMap { [weak self] updatedBudget -> AnyPublisher<Budget, Error> in
                guard let self = self else {
                    return Fail(error: NSError(domain: "BudgetUseCases", code: -1)).eraseToAnyPublisher()
                }
                
                // Update monitoring based on changes
                return self.updateBudgetMonitoring(updatedBudget)
                    .map { _ in updatedBudget }
                    .eraseToAnyPublisher()
            }
            .eraseToAnyPublisher()
    }
    
    /// Deletes a budget and cleans up monitoring
    /// Requirements addressed:
    /// - Budget creation and monitoring (1.2 Scope/Core Features)
    public func deleteBudget(budgetId: String) -> AnyPublisher<Void, Error> {
        return repository.deleteBudget(id: budgetId)
            .map { [weak self] _ in
                // Clean up monitoring for deleted budget
                self?.cleanupBudgetMonitoring(budgetId: budgetId)
                return ()
            }
            .eraseToAnyPublisher()
    }
    
    /// Retrieves detailed budget information
    /// Requirements addressed:
    /// - Budget creation and monitoring (1.2 Scope/Core Features)
    public func getBudgetDetails(budgetId: String) -> AnyPublisher<Budget?, Error> {
        return repository.getBudget(id: budgetId)
            .eraseToAnyPublisher()
    }
    
    /// Retrieves list of budgets with optional filtering
    /// Requirements addressed:
    /// - Budget creation and monitoring (1.2 Scope/Core Features)
    public func listBudgets(criteria: [String: Any]? = nil) -> AnyPublisher<[Budget], Error> {
        return repository.getAllBudgets()
            .map { budgets in
                guard let criteria = criteria else { return budgets }
                
                // Apply filtering based on criteria
                return budgets.filter { budget in
                    return criteria.allSatisfy { key, value in
                        switch key {
                        case "isOverBudget":
                            return budget.isOverBudget() == (value as? Bool ?? false)
                        case "minSpentPercentage":
                            return budget.spentPercentage() >= (value as? Double ?? 0)
                        case "maxSpentPercentage":
                            return budget.spentPercentage() <= (value as? Double ?? 100)
                        default:
                            return true
                        }
                    }
                }
            }
            .eraseToAnyPublisher()
    }
    
    /// Checks budget status and triggers alerts if needed
    /// Requirements addressed:
    /// - Real-time notifications and alerts (1.2 Scope/Core Features)
    public func checkBudgetStatus(_ budget: Budget) -> AnyPublisher<BudgetStatus, Error> {
        return Future<BudgetStatus, Error> { [weak self] promise in
            guard let self = self else {
                promise(.failure(NSError(domain: "BudgetUseCases", code: -1)))
                return
            }
            
            let spentPercentage = budget.spentPercentage()
            let status = BudgetStatus.from(spentPercentage: spentPercentage)
            
            // Schedule notifications based on status
            if self.notificationManager.hasNotificationPermission {
                switch status {
                case .approaching:
                    self.scheduleApproachingBudgetNotification(budget)
                case .overBudget:
                    self.scheduleOverBudgetNotification(budget)
                case .underBudget:
                    break
                }
            }
            
            promise(.success(status))
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Private Methods
    
    private func setupBudgetMonitoring(_ budget: Budget) -> AnyPublisher<Void, Error> {
        return checkBudgetStatus(budget)
            .map { _ in () }
            .eraseToAnyPublisher()
    }
    
    private func updateBudgetMonitoring(_ budget: Budget) -> AnyPublisher<Void, Error> {
        return checkBudgetStatus(budget)
            .map { _ in () }
            .eraseToAnyPublisher()
    }
    
    private func cleanupBudgetMonitoring(budgetId: String) {
        // Cancel any pending notifications for this budget
        // Implementation depends on notification tracking mechanism
    }
    
    private func scheduleApproachingBudgetNotification(_ budget: Budget) {
        let title = NSLocalizedString("Budget Alert", comment: "Budget notification title")
        let body = String(format: NSLocalizedString("You've used %.1f%% of your %@ budget", comment: "Budget approaching notification"),
                         budget.spentPercentage(),
                         budget.name)
        
        notificationManager.scheduleLocalNotification(
            title: title,
            body: body,
            date: Date(),
            userInfo: ["budgetId": budget.id, "type": "approaching"]
        )
    }
    
    private func scheduleOverBudgetNotification(_ budget: Budget) {
        let title = NSLocalizedString("Budget Exceeded", comment: "Over budget notification title")
        let body = String(format: NSLocalizedString("You've exceeded your %@ budget", comment: "Over budget notification"),
                         budget.name)
        
        notificationManager.scheduleLocalNotification(
            title: title,
            body: body,
            date: Date(),
            userInfo: ["budgetId": budget.id, "type": "overBudget"]
        )
    }
}