//
// GoalsViewModel.swift
// MintReplicaLite
//
// ViewModel for managing financial goals UI state and user interactions
//

// MARK: - Human Tasks
/*
1. Configure analytics tracking for goal-related user actions
2. Set up proper error logging service integration
3. Review goal progress notification thresholds
4. Test currency formatting across different locales
5. Verify goal deadline timezone handling
*/

import Foundation  // iOS 15.0+
import Combine    // iOS 15.0+
import SwiftUI   // iOS 15.0+

/// ViewModel implementation for managing and displaying financial goals
/// Addresses requirements:
/// - Financial goal setting and progress monitoring (1.2 Scope/Core Features)
/// - Mobile Applications (5.2.1): Native iOS application using Swift and SwiftUI
@MainActor
final class GoalsViewModel: ViewModelProtocol {
    
    // MARK: - Published Properties
    
    @Published private(set) var goals: [Goal] = []
    @Published private(set) var state: ViewModelState = .idle
    @Published private(set) var errorMessage: String?
    @Published private(set) var selectedCategory: GoalCategory?
    
    // MARK: - Private Properties
    
    private let goalUseCases: GoalUseCases
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    /// Initializes the GoalsViewModel with required dependencies
    /// - Parameter goalUseCases: Use cases for goal management
    init(goalUseCases: GoalUseCases) {
        self.goalUseCases = goalUseCases
        
        // Set up subscription for real-time goal updates
        setupGoalUpdatesSubscription()
        
        // Initialize view model
        initialize()
    }
    
    // MARK: - ViewModelProtocol Implementation
    
    /// Initializes the ViewModel and loads initial goals data
    func initialize() {
        Task {
            await loadGoals()
        }
    }
    
    /// Handles errors in a consistent way
    /// - Parameter error: The error to handle
    func handleError(_ error: Error) {
        state = .error
        errorMessage = error.localizedDescription
        
        #if DEBUG
        print("GoalsViewModel Error: \(error.localizedDescription)")
        #endif
    }
    
    // MARK: - Public Methods
    
    /// Creates a new financial goal
    /// - Parameters:
    ///   - name: Display name of the goal
    ///   - description: Detailed description
    ///   - targetAmount: Target amount to achieve
    ///   - deadline: Target completion date
    ///   - category: Category of the financial goal
    /// - Returns: Result indicating success or failure
    func createGoal(
        name: String,
        description: String,
        targetAmount: Decimal,
        deadline: Date,
        category: GoalCategory
    ) async -> Result<Goal, Error> {
        state = .loading
        
        return await withCheckedContinuation { continuation in
            goalUseCases.createGoal(
                name: name,
                description: description,
                targetAmount: targetAmount,
                deadline: deadline,
                category: category
            )
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                        continuation.resume(returning: .failure(error))
                    }
                },
                receiveValue: { [weak self] goal in
                    self?.state = .success
                    Task { await self?.loadGoals() }
                    continuation.resume(returning: .success(goal))
                }
            )
            .store(in: &cancellables)
        }
    }
    
    /// Updates the progress of a specific goal
    /// - Parameters:
    ///   - goalId: Goal identifier
    ///   - amount: New progress amount
    /// - Returns: Result indicating success or failure
    func updateGoalProgress(
        goalId: UUID,
        amount: Decimal
    ) async -> Result<Goal, Error> {
        state = .loading
        
        return await withCheckedContinuation { continuation in
            goalUseCases.updateGoalProgress(goalId: goalId, amount: amount)
                .sink(
                    receiveCompletion: { [weak self] completion in
                        if case .failure(let error) = completion {
                            self?.handleError(error)
                            continuation.resume(returning: .failure(error))
                        }
                    },
                    receiveValue: { [weak self] goal in
                        self?.state = .success
                        Task { await self?.loadGoals() }
                        continuation.resume(returning: .success(goal))
                    }
                )
                .store(in: &cancellables)
        }
    }
    
    /// Deletes a goal
    /// - Parameter goalId: Goal identifier
    /// - Returns: Result indicating success or failure
    func deleteGoal(goalId: UUID) async -> Result<Void, Error> {
        state = .loading
        
        return await withCheckedContinuation { continuation in
            goalUseCases.deleteGoal(goalId: goalId)
                .sink(
                    receiveCompletion: { [weak self] completion in
                        if case .failure(let error) = completion {
                            self?.handleError(error)
                            continuation.resume(returning: .failure(error))
                        }
                    },
                    receiveValue: { [weak self] _ in
                        self?.state = .success
                        Task { await self?.loadGoals() }
                        continuation.resume(returning: .success(()))
                    }
                )
                .store(in: &cancellables)
        }
    }
    
    /// Updates selected category and filters goals
    /// - Parameter category: Selected goal category
    func filterByCategory(_ category: GoalCategory) {
        selectedCategory = category
        Task {
            await loadGoals()
        }
    }
    
    // MARK: - Private Methods
    
    /// Loads goals filtered by selected category
    private func loadGoals() async {
        state = .loading
        
        goalUseCases.getGoalsByCategory(category: selectedCategory ?? .savings)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] goals in
                    self?.goals = goals
                    self?.state = .success
                }
            )
            .store(in: &cancellables)
    }
    
    /// Sets up subscription for real-time goal updates
    private func setupGoalUpdatesSubscription() {
        goalUseCases.goalUpdates
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                Task {
                    await self?.loadGoals()
                }
            }
            .store(in: &cancellables)
    }
}