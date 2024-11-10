// SwiftUI framework - iOS 14.0+
import SwiftUI
// Combine framework - iOS 14.0+
import Combine

// MARK: - Human Tasks
/*
 1. Verify VoiceOver labels provide clear context for transaction amounts and categories
 2. Test pull-to-refresh behavior with slow network conditions
 3. Validate search debounce timing for optimal performance
 4. Ensure proper color contrast ratios for transaction amounts
 5. Test chart accessibility with VoiceOver navigation
*/

/// Transaction filter options for the account detail view
enum TransactionFilter: String, CaseIterable {
    case all = "All"
    case income = "Income"
    case expenses = "Expenses"
    case pending = "Pending"
}

/// SwiftUI view displaying detailed account information and transaction history
/// Requirements addressed:
/// - Account Details View (8.1.3)
/// - Native iOS application using SwiftUI (5.2.1)
/// - Financial institution integration (1.2)
/// - Accessibility Features (8.1.8)
struct AccountDetailView: View {
    // MARK: - Properties
    
    private let account: Account
    @State private var searchText = ""
    @State private var isRefreshing = false
    @State private var selectedFilter: TransactionFilter = .all
    @Published private var filteredTransactions: [Transaction] = []
    @Published private var spendingData: [ChartDataPoint] = []
    
    private let searchDebounce = PassthroughSubject<String, Never>()
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    init(account: Account) {
        self.account = account
        setupSearchDebounce()
        setupAccessibility()
    }
    
    // MARK: - Body
    
    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 16) {
                accountHeader()
                    .padding(.horizontal)
                
                // Search bar
                SearchBar(text: $searchText)
                    .padding(.horizontal)
                
                // Filter picker
                Picker("Filter", selection: $selectedFilter) {
                    ForEach(TransactionFilter.allCases, id: \.self) { filter in
                        Text(filter.rawValue)
                            .tag(filter)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal)
                
                // Spending trends chart
                if !spendingData.isEmpty {
                    spendingTrendsChart()
                        .frame(height: 200)
                        .padding(.vertical)
                }
                
                // Transaction list
                transactionList()
            }
        }
        .navigationTitle(account.name)
        .navigationBarTitleDisplayMode(.large)
        .refreshable {
            await refreshData()
        }
    }
    
    // MARK: - View Components
    
    /// Creates the account header section with balance and metadata
    private func accountHeader() -> some View {
        VStack(alignment: .leading, spacing: 8) {
            // Institution name and account type
            HStack {
                Text(account.institutionName ?? "")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(account.type.toString())
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
            }
            
            // Balance
            Text(account.formattedBalance())
                .font(.system(.title, design: .rounded))
                .fontWeight(.semibold)
                .foregroundColor(.primary)
                .accessibilityLabel("Account balance \(account.formattedBalance())")
            
            // Last synced date
            Text("Last updated \(account.lastSynced.timeAgo())")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 8)
        .accessibilityElement(children: .combine)
    }
    
    /// Creates the filtered transaction list with search support
    private func transactionList() -> some View {
        LazyVStack(spacing: 8) {
            ForEach(filteredTransactions) { transaction in
                TransactionRow(transaction: transaction)
                    .padding(.horizontal)
            }
            
            if filteredTransactions.isEmpty {
                emptyStateView()
            }
        }
    }
    
    /// Creates spending trends visualization using ChartView
    private func spendingTrendsChart() -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Spending Trends")
                .font(.headline)
                .padding(.horizontal)
            
            ChartView(
                dataPoints: spendingData,
                chartType: .bar,
                showLabels: true,
                showGrid: true
            )
            .accessibilityLabel("Spending trends chart showing transaction patterns")
        }
    }
    
    /// Creates empty state view when no transactions match filters
    private func emptyStateView() -> some View {
        VStack(spacing: 16) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            
            Text("No transactions found")
                .font(.headline)
            
            Text("Try adjusting your search or filters")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 48)
    }
    
    // MARK: - Helper Methods
    
    /// Sets up search text debouncing to optimize performance
    private func setupSearchDebounce() {
        searchDebounce
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .sink { [weak self] searchText in
                self?.filterTransactions(searchText: searchText)
            }
            .store(in: &cancellables)
        
        $searchText
            .sink { [weak self] text in
                self?.searchDebounce.send(text)
            }
            .store(in: &cancellables)
    }
    
    /// Configures accessibility labels and traits
    private func setupAccessibility() {
        UISegmentedControl.appearance().selectedSegmentTintColor = .systemBlue
    }
    
    /// Filters transactions based on search text and selected filter
    private func filterTransactions(searchText: String) {
        // Apply search filter
        var filtered = filteredTransactions
        if !searchText.isEmpty {
            filtered = filtered.filter { transaction in
                transaction.description.localizedCaseInsensitiveContains(searchText) ||
                transaction.merchantName?.localizedCaseInsensitiveContains(searchText) == true
            }
        }
        
        // Apply category filter
        switch selectedFilter {
        case .income:
            filtered = filtered.filter { !$0.isExpense() }
        case .expenses:
            filtered = filtered.filter { $0.isExpense() }
        case .pending:
            filtered = filtered.filter { $0.isPending }
        case .all:
            break
        }
        
        filteredTransactions = filtered
    }
    
    /// Refreshes account data and transactions
    private func refreshData() async {
        isRefreshing = true
        
        // Simulate network delay for testing
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        
        // TODO: Implement actual data refresh from repository
        
        isRefreshing = false
    }
    
    /// Prepares spending trend data for visualization
    private func prepareSpendingData() {
        // Group transactions by date and calculate daily totals
        let calendar = Calendar.current
        let groupedTransactions = Dictionary(grouping: filteredTransactions) { transaction in
            calendar.startOfDay(for: transaction.date)
        }
        
        // Create chart data points
        spendingData = groupedTransactions.map { date, transactions in
            let total = transactions.reduce(0) { $0 + $1.amount }
            return ChartDataPoint(
                value: total,
                label: date.formatted(.dateTime.month().day()),
                date: date,
                accessibilityLabel: "Spending on \(date.formatted()): \(CurrencyFormatter.shared.formatAmount(total))"
            )
        }
        .sorted { $0.date ?? Date() < $1.date ?? Date() }
    }
}

// MARK: - Preview Provider

#if DEBUG
struct AccountDetailView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            AccountDetailView(
                account: Account(
                    id: "123",
                    institutionId: "inst_1",
                    name: "Checking Account",
                    institutionName: "Bank of America",
                    type: .checking,
                    balance: 2340.25,
                    currency: "USD",
                    lastSynced: Date(),
                    isActive: true
                )
            )
        }
    }
}
#endif