//
// DashboardViewModel.swift
// MintReplicaLite
//
// ViewModel implementation for the main dashboard screen with real-time updates
//

import Foundation // iOS 14.0+
import Combine   // iOS 14.0+
import SwiftUI   // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Configure analytics tracking for dashboard interactions
 2. Set up proper error logging for dashboard operations
 3. Test offline data synchronization behavior
 4. Verify real-time update performance with large datasets
 5. Review memory management with multiple subscriptions
*/

/// ViewModel managing dashboard screen state and business logic
/// Requirements addressed:
/// - Mobile-first personal financial management (1.1 System Overview)
/// - Real-time data synchronization (1.2 Scope/Technical Implementation)
/// - Native iOS application using Swift and SwiftUI (5.2.1 Mobile Applications)
@MainActor
@available(iOS 14.0, *)
final class DashboardViewModel: ObservableObject {
    
    // MARK: - Published Properties
    
    /// List of user's financial accounts
    @Published private(set) var accounts: [Account] = []
    
    /// Recent financial transactions
    @Published private(set) var recentTransactions: [Transaction] = []
    
    /// Budget tracking overview
    @Published private(set) var budgetOverview: [Budget] = []
    
    /// Loading state indicator
    @Published private(set) var isLoading: Bool = false
    
    /// Error state for user feedback
    @Published private(set) var error: Error?
    
    // MARK: - Private Properties
    
    private let accountUseCases: AccountUseCases
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    /// Initializes dashboard view model with required dependencies
    /// - Parameter accountUseCases: Use cases for account operations
    init(accountUseCases: AccountUseCases) {
        self.accountUseCases = accountUseCases
        setupBindings()
    }
    
    // MARK: - Public Methods
    
    /// Loads all required data for the dashboard display
    /// Requirements addressed:
    /// - Mobile-first personal financial management (1.1 System Overview)
    @MainActor
    func loadDashboardData() {
        isLoading = true
        error = nil
        
        // Create a group of publishers for concurrent data loading
        Publishers.CombineLatest3(
            accountUseCases.fetchAccounts()
                .catch { [weak self] error -> AnyPublisher<[Account], Never> in
                    self?.error = error
                    return Just([]).eraseToAnyPublisher()
                }
                .eraseToAnyPublisher(),
            
            loadRecentTransactions()
                .catch { [weak self] error -> AnyPublisher<[Transaction], Never> in
                    self?.error = error
                    return Just([]).eraseToAnyPublisher()
                }
                .eraseToAnyPublisher(),
            
            loadBudgetOverview()
                .catch { [weak self] error -> AnyPublisher<[Budget], Never> in
                    self?.error = error
                    return Just([]).eraseToAnyPublisher()
                }
                .eraseToAnyPublisher()
        )
        .receive(on: DispatchQueue.main)
        .sink { [weak self] accounts, transactions, budgets in
            self?.accounts = accounts
            self?.recentTransactions = transactions
            self?.budgetOverview = budgets
            self?.isLoading = false
        }
        .store(in: &cancellables)
    }
    
    /// Triggers a refresh of all dashboard data
    /// Requirements addressed:
    /// - Real-time data synchronization (1.2 Scope/Technical Implementation)
    @MainActor
    func refreshData() {
        isLoading = true
        error = nil
        
        accountUseCases.syncAccounts()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.error = error
                    }
                    self?.isLoading = false
                },
                receiveValue: { [weak self] _ in
                    self?.loadDashboardData()
                }
            )
            .store(in: &cancellables)
    }
    
    /// Calculates total net worth across all accounts
    /// Requirements addressed:
    /// - Mobile-first personal financial management (1.1 System Overview)
    func calculateNetWorth() -> Decimal {
        return accounts.reduce(Decimal.zero) { total, account in
            total + account.balance
        }
    }
    
    // MARK: - Private Methods
    
    /// Sets up data bindings for real-time updates
    private func setupBindings() {
        // Subscribe to account updates
        accountUseCases.accountUpdatePublisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] updatedAccount in
                self?.handleAccountUpdate(updatedAccount)
            }
            .store(in: &cancellables)
    }
    
    /// Handles real-time account updates
    /// - Parameter updatedAccount: Updated account information
    private func handleAccountUpdate(_ updatedAccount: Account) {
        if let index = accounts.firstIndex(where: { $0.id == updatedAccount.id }) {
            accounts[index] = updatedAccount
        } else {
            accounts.append(updatedAccount)
        }
    }
    
    /// Loads recent transactions for the dashboard
    /// - Returns: Publisher emitting transaction list
    private func loadRecentTransactions() -> AnyPublisher<[Transaction], Error> {
        // Simulated transaction loading - replace with actual repository call
        return Future { promise in
            // TODO: Implement transaction repository integration
            promise(.success([]))
        }
        .eraseToAnyPublisher()
    }
    
    /// Loads budget overview for the dashboard
    /// - Returns: Publisher emitting budget list
    private func loadBudgetOverview() -> AnyPublisher<[Budget], Error> {
        // Simulated budget loading - replace with actual repository call
        return Future { promise in
            // TODO: Implement budget repository integration
            promise(.success([]))
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Cleanup
    
    deinit {
        cancellables.forEach { $0.cancel() }
        cancellables.removeAll()
    }
}