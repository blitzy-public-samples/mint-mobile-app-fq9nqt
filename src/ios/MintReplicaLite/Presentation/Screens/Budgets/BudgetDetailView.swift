// SwiftUI framework - iOS 14.0+
import SwiftUI
// Combine framework - iOS 14.0+
import Combine

// MARK: - Human Tasks
/*
 1. Verify accessibility labels and VoiceOver support
 2. Test dynamic type scaling across all text elements
 3. Validate color contrast ratios for budget status indicators
 4. Review haptic feedback implementation for user interactions
 5. Test edit/delete confirmation dialogs across different iOS versions
*/

/// A SwiftUI view that displays detailed information about a specific budget
/// Requirements addressed:
/// - Budget creation and monitoring (1.2 Scope/Core Features)
/// - Native iOS application using Swift and SwiftUI (5.2.1 Mobile Applications)
/// - Data export and reporting capabilities (1.2 Scope/Core Features)
struct BudgetDetailView: View {
    // MARK: - Properties
    
    @ObservedObject var viewModel: BudgetsViewModel
    @State private var isEditing: Bool = false
    @State private var showingDeleteAlert: Bool = false
    let budget: Budget
    
    // MARK: - Constants
    
    private enum Constants {
        static let padding: CGFloat = 16
        static let spacing: CGFloat = 20
        static let cornerRadius: CGFloat = 12
        static let progressBarHeight: CGFloat = 16
        static let deleteAlertTitle = "Delete Budget"
        static let deleteAlertMessage = "Are you sure you want to delete this budget? This action cannot be undone."
        static let deleteConfirmation = "Delete"
        static let deleteCancel = "Cancel"
        static let editButton = "Edit"
        static let doneButton = "Done"
    }
    
    // MARK: - Body
    
    var body: some View {
        ScrollView {
            VStack(spacing: Constants.spacing) {
                budgetSummarySection()
                progressSection()
                transactionSection()
                
                // Edit/Delete Controls
                HStack(spacing: Constants.spacing) {
                    Button(action: {
                        isEditing.toggle()
                    }) {
                        Text(isEditing ? Constants.doneButton : Constants.editButton)
                            .foregroundColor(AppTheme.shared.primary)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(AppTheme.shared.surface)
                            .cornerRadius(Constants.cornerRadius)
                            .shadow(radius: 2)
                    }
                    
                    Button(action: {
                        showingDeleteAlert = true
                    }) {
                        Text(Constants.deleteConfirmation)
                            .foregroundColor(AppTheme.shared.error)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(AppTheme.shared.surface)
                            .cornerRadius(Constants.cornerRadius)
                            .shadow(radius: 2)
                    }
                }
                .padding(.top, Constants.spacing)
            }
            .padding(Constants.padding)
        }
        .navigationTitle(budget.name)
        .alert(isPresented: $showingDeleteAlert) {
            Alert(
                title: Text(Constants.deleteAlertTitle),
                message: Text(Constants.deleteAlertMessage),
                primaryButton: .destructive(Text(Constants.deleteConfirmation)) {
                    viewModel.deleteBudget(budgetId: budget.id)
                },
                secondaryButton: .cancel(Text(Constants.deleteCancel))
            )
        }
        .onChange(of: viewModel.errorMessage) { error in
            if let error = error {
                // Handle error display
                print("Error: \(error)")
            }
        }
    }
    
    // MARK: - Section Views
    
    /// Creates the budget summary section with spending details
    /// Requirements addressed:
    /// - Budget creation and monitoring (1.2 Scope/Core Features)
    private func budgetSummarySection() -> some View {
        VStack(alignment: .leading, spacing: Constants.spacing / 2) {
            Text("Budget Summary")
                .font(AppTheme.shared.headingFont)
                .foregroundColor(AppTheme.shared.textPrimary)
            
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Budget Limit:")
                        .foregroundColor(AppTheme.shared.textSecondary)
                    Spacer()
                    Text(budget.formattedLimit())
                        .foregroundColor(AppTheme.shared.textPrimary)
                        .bold()
                }
                
                HStack {
                    Text("Spent:")
                        .foregroundColor(AppTheme.shared.textSecondary)
                    Spacer()
                    Text(budget.formattedSpent())
                        .foregroundColor(budget.isOverBudget() ? AppTheme.shared.error : AppTheme.shared.textPrimary)
                        .bold()
                }
                
                Divider()
                
                HStack {
                    Text("Remaining:")
                        .foregroundColor(AppTheme.shared.textSecondary)
                    Spacer()
                    let remaining = budget.limit - budget.spent
                    Text(CurrencyFormatter.shared.formatAmount(remaining))
                        .foregroundColor(remaining < 0 ? AppTheme.shared.error : AppTheme.shared.success)
                        .bold()
                }
            }
        }
        .padding()
        .background(AppTheme.shared.surface)
        .cornerRadius(Constants.cornerRadius)
        .shadow(radius: 2)
    }
    
    /// Creates the spending progress visualization section
    /// Requirements addressed:
    /// - Data export and reporting capabilities (1.2 Scope/Core Features)
    private func progressSection() -> some View {
        VStack(alignment: .leading, spacing: Constants.spacing / 2) {
            Text("Spending Progress")
                .font(AppTheme.shared.headingFont)
                .foregroundColor(AppTheme.shared.textPrimary)
            
            VStack(spacing: Constants.spacing / 2) {
                BudgetProgressBar(
                    progress: Double(truncating: budget.spent as NSDecimalNumber),
                    total: Double(truncating: budget.limit as NSDecimalNumber),
                    height: Constants.progressBarHeight
                )
                
                HStack {
                    Text("\(String(format: "%.1f", budget.spentPercentage()))% Spent")
                        .font(AppTheme.shared.captionFont)
                        .foregroundColor(AppTheme.shared.textSecondary)
                    
                    Spacer()
                    
                    if budget.isOverBudget() {
                        Text("Over Budget")
                            .font(AppTheme.shared.captionFont)
                            .foregroundColor(AppTheme.shared.error)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(AppTheme.shared.error.opacity(0.1))
                            .cornerRadius(8)
                    }
                }
            }
        }
        .padding()
        .background(AppTheme.shared.surface)
        .cornerRadius(Constants.cornerRadius)
        .shadow(radius: 2)
    }
    
    /// Creates the transaction history section
    /// Requirements addressed:
    /// - Data export and reporting capabilities (1.2 Scope/Core Features)
    private func transactionSection() -> some View {
        VStack(alignment: .leading, spacing: Constants.spacing / 2) {
            Text("Recent Transactions")
                .font(AppTheme.shared.headingFont)
                .foregroundColor(AppTheme.shared.textPrimary)
            
            // Placeholder for transaction list
            // This would be populated with actual transaction data in a full implementation
            VStack(spacing: 8) {
                ForEach(0..<3) { _ in
                    HStack {
                        Circle()
                            .fill(AppTheme.shared.secondary.opacity(0.2))
                            .frame(width: 40, height: 40)
                        
                        VStack(alignment: .leading) {
                            Text("Transaction")
                                .foregroundColor(AppTheme.shared.textPrimary)
                            Text("Category")
                                .font(AppTheme.shared.captionFont)
                                .foregroundColor(AppTheme.shared.textSecondary)
                        }
                        
                        Spacer()
                        
                        Text("$0.00")
                            .foregroundColor(AppTheme.shared.textPrimary)
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .padding()
        .background(AppTheme.shared.surface)
        .cornerRadius(Constants.cornerRadius)
        .shadow(radius: 2)
    }
}

// MARK: - Preview Provider

#if DEBUG
struct BudgetDetailView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            BudgetDetailView(
                viewModel: BudgetsViewModel.preview,
                budget: Budget(
                    id: "preview",
                    name: "Sample Budget",
                    categoryId: "category1",
                    limit: 1000,
                    spent: 750,
                    startDate: Date(),
                    endDate: Calendar.current.date(byAdding: .month, value: 1, to: Date())!,
                    isRecurring: true
                )
            )
        }
    }
}
#endif