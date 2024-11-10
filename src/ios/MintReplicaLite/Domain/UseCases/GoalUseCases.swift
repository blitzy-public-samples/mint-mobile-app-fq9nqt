//
// GoalUseCases.swift
// MintReplicaLite
//
// Implements business logic for financial goal management and tracking
//

// MARK: - Human Tasks
/*
1. Configure proper error logging and monitoring
2. Set up analytics tracking for goal-related events
3. Test goal progress notification thresholds
4. Verify currency handling across different locales
5. Review goal deadline timezone handling
*/

import Foundation // iOS 15.0+
import Combine // iOS 15.0+

/// Represents detailed goal progress statistics
struct GoalProgress {
    let currentAmount: Decimal
    let targetAmount: Decimal
    let progressPercentage: Double
    let remainingAmount: Decimal
    let daysRemaining: Int
    let status: GoalStatus
}

/// Implements business logic for financial goal management with real-time updates
/// Addresses requirements:
/// - Financial goal setting and progress monitoring (1.2 Scope/Core Features)
/// - Data export and reporting capabilities (1.2 Scope/Core Features)
/// - Real-time data synchronization (1.1 System Overview)
@available(iOS 15.0, *)
final class GoalUseCases {
    
    // MARK: - Properties
    
    private let repository: GoalRepository
    private(set) var goalUpdates = PassthroughSubject<Goal, Never>()
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    /// Initializes use cases with a goal repository
    /// - Parameter repository: Repository for goal data management
    init(repository: GoalRepository) {
        self.repository = repository
    }
    
    // MARK: - Public Methods
    
    /// Creates a new financial goal with validation
    /// - Parameters:
    ///   - name: Display name of the goal
    ///   - description: Detailed description
    ///   - targetAmount: Target amount to achieve
    ///   - deadline: Target completion date
    ///   - category: Category of the financial goal
    /// - Returns: Publisher emitting created goal or error
    func createGoal(
        name: String,
        description: String,
        targetAmount: Decimal,
        deadline: Date,
        category: GoalCategory
    ) -> AnyPublisher<Goal, Error> {
        return Future { [weak self] promise in
            do {
                // Create goal instance with validation
                let goal = try Goal(
                    name: name,
                    description: description,
                    targetAmount: targetAmount,
                    currentAmount: 0,
                    deadline: deadline,
                    category: category
                )
                
                // Save through repository
                self?.repository.create(goal)
                    .sink(
                        receiveCompletion: { completion in
                            if case .failure(let error) = completion {
                                promise(.failure(error))
                            }
                        },
                        receiveValue: { createdGoal in
                            // Publish goal creation event
                            self?.goalUpdates.send(createdGoal)
                            promise(.success(createdGoal))
                        }
                    )
                    .store(in: &self!.cancellables)
                
            } catch {
                promise(.failure(error))
            }
        }
        .eraseToAnyPublisher()
    }
    
    /// Updates the progress of a goal with validation
    /// - Parameters:
    ///   - goalId: Goal identifier
    ///   - amount: New progress amount
    /// - Returns: Publisher emitting updated goal or error
    func updateGoalProgress(
        goalId: UUID,
        amount: Decimal
    ) -> AnyPublisher<Goal, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(RepositoryError.persistenceError))
                return
            }
            
            // Retrieve goal
            self.repository.read(goalId.uuidString)
                .flatMap { goal -> AnyPublisher<Goal, RepositoryError> in
                    guard var goal = goal else {
                        return Fail(error: RepositoryError.notFound).eraseToAnyPublisher()
                    }
                    
                    do {
                        // Update progress
                        try goal.updateProgress(amount)
                        return self.repository.update(goal)
                    } catch {
                        return Fail(error: RepositoryError.invalidData).eraseToAnyPublisher()
                    }
                }
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: { updatedGoal in
                        // Publish goal update event
                        self.goalUpdates.send(updatedGoal)
                        promise(.success(updatedGoal))
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
    
    /// Deletes an existing goal
    /// - Parameter goalId: Goal identifier
    /// - Returns: Publisher indicating success or error
    func deleteGoal(goalId: UUID) -> AnyPublisher<Void, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(RepositoryError.persistenceError))
                return
            }
            
            // Delete through repository
            self.repository.delete(goalId.uuidString)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: {
                        // Create deleted goal placeholder for event
                        let deletedGoal = try? Goal(
                            id: goalId,
                            name: "",
                            description: "",
                            targetAmount: 0,
                            currentAmount: 0,
                            deadline: Date(),
                            category: .savings
                        )
                        
                        if let goal = deletedGoal {
                            self.goalUpdates.send(goal)
                        }
                        
                        promise(.success(()))
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
    
    /// Retrieves goals filtered by category
    /// - Parameter category: Goal category filter
    /// - Returns: Publisher emitting filtered goals or error
    func getGoalsByCategory(category: GoalCategory) -> AnyPublisher<[Goal], Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(RepositoryError.persistenceError))
                return
            }
            
            // Build filter criteria
            let criteria = ["category": category.rawValue]
            
            // Fetch filtered goals
            self.repository.list(criteria)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: { goals in
                        // Sort by deadline
                        let sortedGoals = goals.sorted { $0.deadline < $1.deadline }
                        promise(.success(sortedGoals))
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
    
    /// Calculates detailed progress statistics for a goal
    /// - Parameter goalId: Goal identifier
    /// - Returns: Publisher emitting goal progress statistics
    func getGoalProgress(goalId: UUID) -> AnyPublisher<GoalProgress, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(RepositoryError.persistenceError))
                return
            }
            
            // Retrieve goal
            self.repository.read(goalId.uuidString)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: { goal in
                        guard let goal = goal else {
                            promise(.failure(RepositoryError.notFound))
                            return
                        }
                        
                        // Calculate statistics
                        let progress = GoalProgress(
                            currentAmount: goal.currentAmount,
                            targetAmount: goal.targetAmount,
                            progressPercentage: goal.progressPercentage(),
                            remainingAmount: goal.targetAmount - goal.currentAmount,
                            daysRemaining: goal.daysRemaining(),
                            status: goal.status
                        )
                        
                        promise(.success(progress))
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
    
    /// Synchronizes goals with remote server
    /// - Returns: Publisher indicating sync success or error
    func syncGoals() -> AnyPublisher<Void, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(RepositoryError.persistenceError))
                return
            }
            
            // Trigger repository sync
            self.repository.sync()
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: {
                        // Fetch updated goals after sync
                        self.repository.list()
                            .sink(
                                receiveCompletion: { completion in
                                    if case .failure(let error) = completion {
                                        promise(.failure(error))
                                    }
                                },
                                receiveValue: { goals in
                                    // Publish sync completion with updated goals
                                    goals.forEach { self.goalUpdates.send($0) }
                                    promise(.success(()))
                                }
                            )
                            .store(in: &self.cancellables)
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
}