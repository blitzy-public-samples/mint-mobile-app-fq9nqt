// SwiftUI framework - iOS 14.0+
import SwiftUI

// MARK: - Human Tasks
/*
 1. Review accessibility labels and hints with UX team
 2. Test dynamic type scaling across all size categories
 3. Verify color contrast ratios meet WCAG guidelines
 4. Test VoiceOver navigation flow
 5. Validate haptic feedback patterns
*/

/// Main view for displaying and managing budgets with accessibility support
/// Requirements addressed:
/// - Budget creation and monitoring (1.2 Scope/Core Features)
/// - Native iOS application using Swift and SwiftUI (5.2.1 Mobile Applications)
/// - Mobile-first design (1.1 System Overview)
struct BudgetsView: View {
    // MARK: - Properties
    @StateObject private var viewModel: BudgetsViewModel
    @State private var showingAddBudget: Bool = false
    @State private var selectedBudget: Budget? = nil
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.dynamicTypeSize) var dynamicTypeSize
    
    // MARK: - Constants
    private enum Constants {
        static let listSpacing: CGFloat = 12
        static let progressBarHeight: CGFloat = 8
        static let headerPadding: CGFloat = 16
        static let cornerRadius: CGFloat = 12
        static let fabBottomPadding: CGFloat = 20
    }
    
    // MARK: - Initialization
    init(viewModel: BudgetsViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }
    
    // MARK: - Body
    var body: some View {
        NavigationView {
            ZStack {
                AppTheme.shared.background
                    .ignoresSafeArea()
                
                VStack(spacing: AppTheme.shared.spacing) {
                    periodSelector()
                        .padding(.horizontal, Constants.headerPadding)
                    
                    if viewModel.state == .loading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                            .scaleEffect(1.2)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else {
                        budgetList()
                    }
                }
                
                // Floating Action Button
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button(action: { showingAddBudget = true }) {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 24, weight: .semibold))
                                .foregroundColor(.white)
                                .padding(16)
                                .background(AppTheme.shared.primary)
                                .clipShape(Circle())
                                .shadow(radius: 4)
                        }
                        .accessibilityLabel("Add new budget")
                        .padding([.trailing, .bottom], Constants.fabBottomPadding)
                    }
                }
            }
            .navigationTitle("Budgets")
            .sheet(isPresented: $showingAddBudget) {
                // Add Budget Sheet View would be implemented separately
                Text("Add Budget View")
            }
            .sheet(item: $selectedBudget) { budget in
                // Budget Detail Sheet View would be implemented separately
                Text("Budget Detail View")
            }
            .alert(item: Binding(
                get: { viewModel.errorMessage.map { ErrorAlert(message: $0) } },
                set: { _ in viewModel.errorMessage = nil }
            )) { error in
                Alert(
                    title: Text("Error"),
                    message: Text(error.message),
                    dismissButton: .default(Text("OK"))
                )
            }
            .onAppear {
                viewModel.initialize()
            }
        }
    }
    
    // MARK: - Budget List
    @ViewBuilder
    private func budgetList() -> some View {
        ScrollView {
            LazyVStack(spacing: Constants.listSpacing) {
                ForEach(viewModel.budgets) { budget in
                    budgetCard(budget)
                        .onTapGesture {
                            selectedBudget = budget
                        }
                }
            }
            .padding()
        }
        .refreshable {
            await viewModel.initialize()
        }
    }
    
    // MARK: - Budget Card
    @ViewBuilder
    private func budgetCard(_ budget: Budget) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(budget.category)
                    .font(AppTheme.shared.headingFont)
                    .foregroundColor(AppTheme.shared.textPrimary)
                Spacer()
                Text(budget.amount.formatted(.currency(code: "USD")))
                    .font(AppTheme.shared.bodyFont)
                    .foregroundColor(AppTheme.shared.textSecondary)
            }
            
            BudgetProgressBar(
                progress: budget.spent,
                total: budget.amount,
                showPercentage: true,
                height: Constants.progressBarHeight
            )
            
            HStack {
                Text("Spent: \(budget.spent.formatted(.currency(code: "USD")))")
                    .font(AppTheme.shared.captionFont)
                    .foregroundColor(AppTheme.shared.textSecondary)
                Spacer()
                Text("Remaining: \((budget.amount - budget.spent).formatted(.currency(code: "USD")))")
                    .font(AppTheme.shared.captionFont)
                    .foregroundColor(AppTheme.shared.textSecondary)
            }
        }
        .padding()
        .background(AppTheme.shared.surface)
        .cornerRadius(Constants.cornerRadius)
        .shadow(radius: 2)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(budget.category) budget")
        .accessibilityValue("Spent \(budget.spent.formatted(.currency(code: "USD"))) of \(budget.amount.formatted(.currency(code: "USD")))")
        .accessibilityHint("Double tap to view details")
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            Button(role: .destructive) {
                viewModel.deleteBudget(budgetId: budget.id)
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }
    
    // MARK: - Period Selector
    @ViewBuilder
    private func periodSelector() -> some View {
        Picker("Budget Period", selection: $viewModel.selectedPeriod) {
            Text("Monthly").tag(BudgetPeriod.monthly)
            Text("Quarterly").tag(BudgetPeriod.quarterly)
            Text("Yearly").tag(BudgetPeriod.yearly)
        }
        .pickerStyle(.segmented)
        .padding(.vertical, 8)
        .accessibilityLabel("Select budget period")
        .onChange(of: viewModel.selectedPeriod) { _ in
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        }
    }
}

// MARK: - Error Alert Model
private struct ErrorAlert: Identifiable {
    let id = UUID()
    let message: String
}

// MARK: - Preview Provider
#if DEBUG
struct BudgetsView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            BudgetsView(viewModel: BudgetsViewModel.preview)
                .preferredColorScheme(.light)
            
            BudgetsView(viewModel: BudgetsViewModel.preview)
                .preferredColorScheme(.dark)
                .environment(\.dynamicTypeSize, .xxxLarge)
        }
    }
}
#endif