//
// DashboardView.swift
// MintReplicaLite
//
// Main dashboard view implementing comprehensive financial overview
//

import SwiftUI // iOS 14.0+

// MARK: - Human Tasks
/*
 1. Configure analytics tracking for dashboard interactions
 2. Test VoiceOver navigation flow through all sections
 3. Verify pull-to-refresh behavior with slow network conditions
 4. Test offline data display and error handling scenarios
 5. Validate dynamic type scaling with extra large text sizes
*/

/// Main dashboard view of the Mint Replica Lite iOS application
/// Requirements addressed:
/// - Mobile-first personal financial management (1.1 System Overview)
/// - Native iOS application using Swift and SwiftUI (5.2.1 Mobile Applications)
/// - Real-time data synchronization (1.2 Scope/Technical Implementation)
/// - Dashboard Design (8.1.2 Main Dashboard)
@available(iOS 14.0, *)
struct DashboardView: View {
    
    // MARK: - Properties
    
    @StateObject private var viewModel: DashboardViewModel
    @State private var selectedTab: Int = 0
    @State private var showingAccountDetail: Bool = false
    @State private var selectedAccount: Account?
    
    // MARK: - Constants
    
    private enum Layout {
        static let sectionSpacing: CGFloat = 24
        static let sectionPadding: CGFloat = 16
        static let cardHeight: CGFloat = 120
        static let headerSpacing: CGFloat = 12
        static let scrollIndicatorPadding: CGFloat = 8
    }
    
    // MARK: - Body
    
    var body: some View {
        NavigationView {
            ScrollView {
                // Pull-to-refresh support
                RefreshControl(coordinateSpace: .named("RefreshControl")) {
                    await viewModel.refreshData()
                }
                
                VStack(spacing: Layout.sectionSpacing) {
                    // Accounts Summary Section
                    accountsSummarySection()
                    
                    // Budget Overview Section
                    budgetOverviewSection()
                    
                    // Recent Transactions Section
                    recentTransactionsSection()
                }
                .padding(.horizontal, Layout.sectionPadding)
                .padding(.vertical, Layout.sectionSpacing)
            }
            .coordinateSpace(name: "RefreshControl")
            .navigationTitle("Dashboard")
            .overlay(
                // Loading indicator
                Group {
                    if viewModel.isLoading {
                        ProgressView()
                            .scaleEffect(1.5)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .background(Color.black.opacity(0.1))
                    }
                }
            )
            // Error alert
            .alert(item: Binding(
                get: { viewModel.error as? LocalizedError },
                set: { _ in }
            )) { error in
                Alert(
                    title: Text("Error"),
                    message: Text(error.localizedDescription),
                    dismissButton: .default(Text("OK"))
                )
            }
        }
        .onAppear {
            viewModel.loadDashboardData()
        }
    }
    
    // MARK: - Section Views
    
    /// Builds the accounts summary section with scrollable cards
    /// Requirements addressed:
    /// - Dashboard Design (8.1.2 Main Dashboard)
    private func accountsSummarySection() -> some View {
        VStack(alignment: .leading, spacing: Layout.headerSpacing) {
            // Section header
            HStack {
                Text("Accounts")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
                
                Text("Net Worth: \(formatCurrency(viewModel.calculateNetWorth()))")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            // Scrollable account cards
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(viewModel.accounts) { account in
                        AccountCard(account: account) {
                            selectedAccount = account
                            showingAccountDetail = true
                        }
                        .frame(width: 280, height: Layout.cardHeight)
                    }
                }
                .padding(.vertical, Layout.scrollIndicatorPadding)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Accounts Summary")
        .sheet(isPresented: $showingAccountDetail, content: {
            if let account = selectedAccount {
                AccountDetailView(account: account)
            }
        })
    }
    
    /// Builds the budget overview section with progress bars
    /// Requirements addressed:
    /// - Dashboard Design (8.1.2 Main Dashboard)
    private func budgetOverviewSection() -> some View {
        VStack(alignment: .leading, spacing: Layout.headerSpacing) {
            // Section header
            Text("Budget Overview")
                .font(.title2)
                .fontWeight(.bold)
            
            // Budget progress bars
            VStack(spacing: 16) {
                ForEach(viewModel.budgetOverview) { budget in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text(budget.category)
                                .font(.subheadline)
                            
                            Spacer()
                            
                            Text("\(formatCurrency(budget.spent)) / \(formatCurrency(budget.limit))")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        BudgetProgressBar(
                            progress: budget.spent,
                            total: budget.limit,
                            showPercentage: true,
                            height: 8
                        )
                    }
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Budget Overview")
    }
    
    /// Builds the recent transactions section with list
    /// Requirements addressed:
    /// - Dashboard Design (8.1.2 Main Dashboard)
    private func recentTransactionsSection() -> some View {
        VStack(alignment: .leading, spacing: Layout.headerSpacing) {
            // Section header
            HStack {
                Text("Recent Transactions")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
                
                NavigationLink(
                    destination: TransactionsView(),
                    label: {
                        Text("View All")
                            .font(.subheadline)
                            .foregroundColor(.accentColor)
                    }
                )
            }
            
            // Transaction list
            VStack(spacing: 8) {
                ForEach(viewModel.recentTransactions.prefix(5)) { transaction in
                    TransactionRow(
                        transaction: transaction,
                        isSelected: false
                    )
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Recent Transactions")
    }
    
    // MARK: - Helper Methods
    
    /// Formats currency values for display
    private func formatCurrency(_ amount: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: amount as NSDecimalNumber) ?? "$0.00"
    }
}

// MARK: - Preview Provider

#if DEBUG
struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Light mode preview
            DashboardView(viewModel: DashboardViewModel(accountUseCases: PreviewAccountUseCases()))
            
            // Dark mode preview
            DashboardView(viewModel: DashboardViewModel(accountUseCases: PreviewAccountUseCases()))
                .preferredColorScheme(.dark)
            
            // Large text preview
            DashboardView(viewModel: DashboardViewModel(accountUseCases: PreviewAccountUseCases()))
                .environment(\.sizeCategory, .accessibilityLarge)
        }
    }
}

/// Preview helper for account use cases
private class PreviewAccountUseCases: AccountUseCases {
    // Implement preview data
}
#endif