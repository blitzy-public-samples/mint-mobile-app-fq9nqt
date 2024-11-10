//
// BudgetsViewModel.swift
// MintReplicaLite
//
// ViewModel implementation for the Budgets screen
//

import Foundation  // iOS 14.0+
import Combine    // iOS 14.0+
import SwiftUI    // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Configure notification permissions in Info.plist
 2. Set up error tracking service integration
 3. Review budget period calculations with business stakeholders
 4. Test budget monitoring across different time zones
 5. Validate localization strings for all user-facing messages
*/

/// ViewModel for managing budgets screen state and user interactions
/// Requirements addressed:
/// - Budget creation and monitoring (1.2 Scope/Core Features)
/// - Native iOS application using Swift and SwiftUI (5.2.1 Mobile Applications)
/// - Real-time notifications and alerts (1.2 Scope/Core Features)
@MainActor
final class BudgetsViewModel: ViewModelProtocol {
    
    // MARK: - Published Properties
    
    @Published private(set) var budgets: [Budget] = []
    @Published private(set) var state: ViewModelState = .idle
    @Published private(set) var errorMessage: String?
    @Published var selectedPeriod: BudgetPeriod = .monthly
    @Published var isAddingBudget: Bool = false
    
    // MARK: - Private Properties
    
    private let budgetUseCases: BudgetUseCases
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    /// Initializes the budgets view model with required dependencies
    /// - Parameter budgetUseCases: Use cases for budget operations
    init(budgetUseCases: BudgetUseCases) {
        self.budgetUseCases = budgetUseCases
    }
    
    // MARK: - Public Methods
    
    /// Loads initial budget data and sets up reactive observers
    /// Requirements addressed:
    /// - Budget creation and monitoring (1.2 Scope/Core Features)
    func initialize() {
        state = .loading
        
        loadBudgets()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] _ in
                    self?.state = .success
                }
            )
            .store(in: &cancellables)
        
        // Set up period change observer
        $selectedPeriod
            .dropFirst()
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.loadBudgets()
            }
            .store(in: &cancellables)
    }
    
    /// Creates a new budget with reactive state updates
    /// Requirements addressed:
    /// - Budget creation and monitoring (1.2 Scope/Core Features)
    func addBudget(_ budget: Budget) {
        state = .loading
        
        budgetUseCases.createBudget(budget)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] _ in
                    self?.isAddingBudget = false
                    self?.loadBudgets()
                }
            )
            .store(in: &cancellables)
    }
    
    /// Updates an existing budget with reactive state updates
    /// Requirements addressed:
    /// - Budget creation and monitoring (1.2 Scope/Core Features)
    func updateBudget(_ budget: Budget) {
        state = .loading
        
        budgetUseCases.updateBudget(budget)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] _ in
                    self?.loadBudgets()
                }
            )
            .store(in: &cancellables)
    }
    
    /// Deletes an existing budget with reactive state updates
    /// Requirements addressed:
    /// - Budget creation and monitoring (1.2 Scope/Core Features)
    func deleteBudget(budgetId: String) {
        state = .loading
        
        budgetUseCases.deleteBudget(budgetId: budgetId)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] _ in
                    self?.loadBudgets()
                }
            )
            .store(in: &cancellables)
    }
    
    /// Handles and presents errors to the user with state updates
    /// Requirements addressed:
    /// - Real-time notifications and alerts (1.2 Scope/Core Features)
    func handleError(_ error: Error) {
        state = .error
        errorMessage = error.localizedDescription
        
        #if DEBUG
        print("BudgetsViewModel Error: \(error)")
        #endif
    }
    
    // MARK: - Private Methods
    
    /// Fetches budgets for the selected period with reactive updates
    /// Requirements addressed:
    /// - Budget creation and monitoring (1.2 Scope/Core Features)
    private func loadBudgets() -> AnyPublisher<Void, Error> {
        let criteria: [String: Any] = [
            "period": selectedPeriod
        ]
        
        return budgetUseCases.listBudgets(criteria: criteria)
            .receive(on: DispatchQueue.main)
            .handleEvents(
                receiveSubscription: { [weak self] _ in
                    self?.state = .loading
                },
                receiveOutput: { [weak self] budgets in
                    self?.budgets = budgets
                    self?.state = .success
                },
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                }
            )
            .map { _ in () }
            .eraseToAnyPublisher()
    }
    
    /// Monitors budget status for alerts and notifications
    /// Requirements addressed:
    /// - Real-time notifications and alerts (1.2 Scope/Core Features)
    private func monitorBudgetStatus(_ budget: Budget) {
        budgetUseCases.checkBudgetStatus(budget)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { _ in }
            )
            .store(in: &cancellables)
    }
}

// MARK: - Preview Support

#if DEBUG
extension BudgetsViewModel {
    /// Creates a preview instance of BudgetsViewModel with mock data
    static var preview: BudgetsViewModel {
        let mockBudgetUseCases = BudgetUseCases(repository: MockBudgetRepository())
        return BudgetsViewModel(budgetUseCases: mockBudgetUseCases)
    }
}
#endif