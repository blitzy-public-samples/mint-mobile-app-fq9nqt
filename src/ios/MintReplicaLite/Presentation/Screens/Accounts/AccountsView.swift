//
// AccountsView.swift
// MintReplicaLite
//
// SwiftUI view implementation for the Accounts screen
//

// MARK: - Human Tasks
/*
1. Configure analytics tracking for account-related user interactions
2. Test VoiceOver navigation flow with accessibility team
3. Verify pull-to-refresh behavior across different iOS versions
4. Review loading states with UX team for visual consistency
5. Test offline mode behavior with network connectivity changes
*/

import SwiftUI     // iOS 15.0+

/// Main view for displaying list of financial accounts with real-time synchronization
/// Addresses requirements:
/// - Financial institution integration and account aggregation (1.2 Scope/Core Features)
/// - Native iOS application using Swift and SwiftUI (5.2.1 Mobile Applications)
/// - Real-time data synchronization (1.1 System Overview)
@MainActor
struct AccountsView: View {
    
    // MARK: - Properties
    
    @StateObject private var viewModel: AccountsViewModel
    @EnvironmentObject private var router: AppRouter
    
    @State private var isRefreshing = false
    @State private var showErrorAlert = false
    @State private var selectedAccountType: AccountType?
    
    // MARK: - Constants
    
    private enum Constants {
        static let spacing: CGFloat = 16
        static let listPadding: CGFloat = 20
        static let headerHeight: CGFloat = 44
        static let errorDisplayDuration: TimeInterval = 3
    }
    
    // MARK: - Initialization
    
    init(viewModel: AccountsViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }
    
    // MARK: - Body
    
    var body: some View {
        NavigationView {
            ZStack {
                // Main Content
                ScrollView {
                    RefreshControl(isRefreshing: $isRefreshing) {
                        await refreshAccounts()
                    }
                    
                    VStack(spacing: Constants.spacing) {
                        // Account Type Filter
                        accountTypeFilter
                            .padding(.horizontal, Constants.listPadding)
                        
                        // Accounts List
                        LazyVStack(spacing: Constants.spacing) {
                            ForEach(viewModel.accounts) { account in
                                AccountCard(account: account) {
                                    accountSelected(account)
                                }
                                .transition(.opacity)
                            }
                        }
                        .padding(.horizontal, Constants.listPadding)
                    }
                    .padding(.vertical, Constants.spacing)
                }
                .refreshable {
                    await refreshAccounts()
                }
                
                // Loading State
                if case .loading = viewModel.state {
                    ProgressView()
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.1))
                }
                
                // Empty State
                if viewModel.accounts.isEmpty && viewModel.state == .success {
                    emptyStateView
                }
            }
            .navigationTitle("Accounts")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    addAccountButton
                }
            }
        }
        .alert(isPresented: $showErrorAlert) {
            Alert(
                title: Text("Error"),
                message: Text(viewModel.errorMessage ?? "An unknown error occurred"),
                dismissButton: .default(Text("OK"))
            )
        }
        .onChange(of: viewModel.state) { newState in
            handleStateChange(newState)
        }
        .onChange(of: viewModel.errorMessage) { error in
            if error != nil {
                showErrorAlert = true
            }
        }
    }
    
    // MARK: - Subviews
    
    /// Filter control for account types
    private var accountTypeFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Constants.spacing) {
                ForEach([AccountType.checking, .savings, .credit, .investment, .loan]) { type in
                    filterButton(for: type)
                }
            }
        }
        .frame(height: Constants.headerHeight)
    }
    
    /// Filter button for specific account type
    private func filterButton(for type: AccountType) -> some View {
        Button(action: {
            withAnimation {
                if selectedAccountType == type {
                    selectedAccountType = nil
                    Task {
                        await viewModel.fetchAccounts()
                    }
                } else {
                    selectedAccountType = type
                    Task {
                        await viewModel.filterAccounts(by: type)
                    }
                }
            }
        }) {
            Text(type.toString())
                .font(.subheadline)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    selectedAccountType == type ?
                        Color.accentColor :
                        Color.secondary.opacity(0.1)
                )
                .foregroundColor(
                    selectedAccountType == type ?
                        .white :
                        .primary
                )
                .cornerRadius(20)
        }
        .accessibilityLabel("\(type.toString()) accounts")
        .accessibilityHint("Double tap to \(selectedAccountType == type ? "remove" : "apply") filter")
    }
    
    /// Empty state view when no accounts are present
    private var emptyStateView: some View {
        VStack(spacing: Constants.spacing) {
            Image(systemName: "creditcard")
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            
            Text("No Accounts Found")
                .font(.headline)
            
            Text("Add your first account to get started")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button(action: {
                // Handle add account action
            }) {
                Text("Add Account")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.accentColor)
                    .cornerRadius(10)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    /// Add account button in navigation bar
    private var addAccountButton: some View {
        Button(action: {
            // Handle add account action
        }) {
            Image(systemName: "plus")
                .accessibilityLabel("Add Account")
        }
    }
    
    // MARK: - Actions
    
    /// Handles account selection and navigation
    /// - Parameter account: Selected account
    private func accountSelected(_ account: Account) {
        router.navigateToScreen(.accountDetail(id: UUID(uuidString: account.id) ?? UUID()))
    }
    
    /// Refreshes account data
    private func refreshAccounts() async {
        isRefreshing = true
        await viewModel.syncAccounts()
        isRefreshing = false
    }
    
    /// Handles view model state changes
    /// - Parameter newState: Updated view model state
    private func handleStateChange(_ newState: ViewModelState) {
        switch newState {
        case .error:
            withAnimation {
                isRefreshing = false
            }
        case .success:
            withAnimation {
                isRefreshing = false
            }
        default:
            break
        }
    }
}

// MARK: - Preview Provider

#if DEBUG
struct AccountsView_Previews: PreviewProvider {
    static var previews: some View {
        let mockViewModel = AccountsViewModel(accountUseCases: MockAccountUseCases())
        
        Group {
            // Light mode preview
            AccountsView(viewModel: mockViewModel)
                .previewDisplayName("Light Mode")
            
            // Dark mode preview
            AccountsView(viewModel: mockViewModel)
                .preferredColorScheme(.dark)
                .previewDisplayName("Dark Mode")
            
            // Loading state preview
            AccountsView(viewModel: mockViewModel)
                .onAppear {
                    mockViewModel.state = .loading
                }
                .previewDisplayName("Loading State")
            
            // Empty state preview
            AccountsView(viewModel: mockViewModel)
                .onAppear {
                    mockViewModel.accounts = []
                    mockViewModel.state = .success
                }
                .previewDisplayName("Empty State")
        }
    }
}

// Mock account use cases for preview
private class MockAccountUseCases: AccountUseCases {
    // Implementation for preview purposes
}
#endif