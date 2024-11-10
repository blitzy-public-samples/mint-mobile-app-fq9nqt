//
// AccountsViewModel.swift
// MintReplicaLite
//
// ViewModel implementation for the Accounts screen with offline-first capabilities
//

// MARK: - Human Tasks
/*
1. Configure analytics tracking for account-related events
2. Set up proper error logging service integration
3. Test sync behavior under various network conditions
4. Verify proper memory management with account subscriptions
5. Review error messages for localization compliance
*/

import Foundation  // iOS 15.0+
import Combine    // iOS 15.0+
import SwiftUI   // iOS 15.0+

/// ViewModel for managing accounts list and account-related operations with offline-first capabilities
/// Addresses requirements:
/// - Financial institution integration and account aggregation (1.2 Scope/Core Features)
/// - Native iOS application using Swift and SwiftUI (5.2.1 Mobile Applications)
/// - Real-time data synchronization (1.1 System Overview)
@MainActor
final class AccountsViewModel: ObservableObject, ViewModelProtocol {
    
    // MARK: - Published Properties
    
    @Published private(set) var accounts: [Account] = []
    @Published private(set) var state: ViewModelState = .idle
    @Published private(set) var errorMessage: String?
    
    // MARK: - Dependencies
    
    private let accountUseCases: AccountUseCases
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    /// Initializes the ViewModel with account use cases dependency
    /// - Parameter accountUseCases: Use cases for account operations
    init(accountUseCases: AccountUseCases) {
        self.accountUseCases = accountUseCases
        initialize()
    }
    
    // MARK: - ViewModelProtocol Implementation
    
    /// Initializes the ViewModel and sets up real-time account updates
    func initialize() {
        setupAccountUpdateSubscription()
        Task {
            await fetchAccounts()
        }
    }
    
    /// Handles errors with proper logging and user feedback
    /// - Parameter error: The error to be handled
    func handleError(_ error: Error) {
        state = .error
        errorMessage = error.localizedDescription
        
        #if DEBUG
        print("AccountsViewModel Error: \(error)")
        #endif
    }
    
    // MARK: - Public Methods
    
    /// Fetches accounts from the repository with optional type filtering
    /// - Parameter type: Optional account type filter
    @MainActor
    func fetchAccounts(type: AccountType? = nil) async {
        state = .loading
        
        accountUseCases.fetchAccounts(type: type)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    }
                },
                receiveValue: { [weak self] accounts in
                    guard let self = self else { return }
                    self.accounts = accounts
                    self.state = .success
                }
            )
            .store(in: &cancellables)
    }
    
    /// Triggers account synchronization with error handling
    @MainActor
    func syncAccounts() async {
        state = .loading
        
        accountUseCases.syncAccounts()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.handleError(error)
                    } else {
                        self?.state = .success
                    }
                },
                receiveValue: { _ in }
            )
            .store(in: &cancellables)
    }
    
    /// Filters accounts by specific type
    /// - Parameter type: Account type to filter by
    @MainActor
    func filterAccounts(by type: AccountType) async {
        await fetchAccounts(type: type)
    }
    
    /// Calculates total balance for all accounts or filtered by type
    /// - Parameter type: Optional account type filter
    /// - Returns: Total balance as Decimal
    func calculateTotalBalance(for type: AccountType? = nil) -> Decimal {
        let filteredAccounts = type == nil ? accounts : accounts.filter { $0.type == type }
        return filteredAccounts.reduce(Decimal.zero) { $0 + $1.balance }
    }
    
    // MARK: - Private Methods
    
    /// Sets up subscription to account updates for real-time synchronization
    private func setupAccountUpdateSubscription() {
        accountUseCases.accountUpdatePublisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] updatedAccount in
                guard let self = self else { return }
                
                if let index = self.accounts.firstIndex(where: { $0.id == updatedAccount.id }) {
                    // Update existing account
                    self.accounts[index] = updatedAccount
                } else if updatedAccount.isActive {
                    // Add new account if active
                    self.accounts.append(updatedAccount)
                }
                
                // Remove account if it's no longer active
                if !updatedAccount.isActive {
                    self.accounts.removeAll { $0.id == updatedAccount.id }
                }
            }
            .store(in: &cancellables)
    }
    
    deinit {
        cancellables.forEach { $0.cancel() }
        cancellables.removeAll()
    }
}

// MARK: - Publisher Extensions

extension Published.Publisher {
    /// Convenience property to access ViewModelState publisher
    var state: Published<ViewModelState>.Publisher where Value == ViewModelState {
        self
    }
    
    /// Convenience property to access errorMessage publisher
    var errorMessage: Published<String?>.Publisher where Value == String? {
        self
    }
}