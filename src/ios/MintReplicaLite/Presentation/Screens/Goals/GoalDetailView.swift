//
// GoalDetailView.swift
// MintReplicaLite
//
// A SwiftUI view that displays detailed information about a financial goal
//

// MARK: - Human Tasks
/*
1. Verify accessibility labels and VoiceOver support
2. Test goal progress updates with different currency formats
3. Validate form validation error messages
4. Review goal deletion confirmation UX
5. Test goal status transitions and deadline calculations
*/

import SwiftUI // iOS 15.0+

/// Detailed view for displaying and managing individual financial goals
/// Addresses requirements:
/// - Financial goal setting and progress monitoring (1.2 Scope/Core Features)
/// - Mobile Applications (5.2.1): Native iOS using Swift and SwiftUI
/// - User Interface Design (8.1.4): Goal detail view with progress tracking
@ViewBuilder
struct GoalDetailView: View {
    // MARK: - Properties
    
    let goal: Goal
    @ObservedObject var viewModel: GoalsViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var isEditingProgress: Bool = false
    @State private var newProgressAmount: String = ""
    @State private var showDeleteConfirmation: Bool = false
    @State private var errorMessage: String?
    
    // MARK: - Constants
    
    private enum Constants {
        static let padding: CGFloat = 16
        static let spacing: CGFloat = 20
        static let cornerRadius: CGFloat = 12
        static let progressBarHeight: CGFloat = 16
        static let deleteButtonHeight: CGFloat = 44
    }
    
    // MARK: - Body
    
    var body: some View {
        ScrollView {
            VStack(spacing: Constants.spacing) {
                // Goal Header
                goalHeader
                
                // Progress Section
                progressSection
                
                // Amount Details
                amountDetails
                
                // Deadline Information
                deadlineInfo
                
                // Progress Update Form
                if isEditingProgress {
                    progressUpdateForm
                }
                
                Spacer(minLength: Constants.spacing)
                
                // Delete Button
                deleteButton
            }
            .padding(Constants.padding)
        }
        .background(AppTheme.shared.background)
        .navigationTitle(goal.name)
        .navigationBarTitleDisplayMode(.large)
        .alert("Error", isPresented: .constant(errorMessage != nil)) {
            Button("OK") {
                errorMessage = nil
            }
        } message: {
            Text(errorMessage ?? "")
        }
    }
    
    // MARK: - View Components
    
    private var goalHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(goal.name)
                .font(AppTheme.shared.titleFont)
                .foregroundColor(AppTheme.shared.textPrimary)
            
            HStack {
                Text(goal.category.rawValue.capitalized)
                    .font(AppTheme.shared.captionFont)
                    .foregroundColor(AppTheme.shared.textSecondary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(AppTheme.shared.secondary.opacity(0.1))
                    .cornerRadius(Constants.cornerRadius)
                
                Spacer()
                
                Text(goal.status.rawValue.capitalized)
                    .font(AppTheme.shared.captionFont)
                    .foregroundColor(statusColor)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(statusColor.opacity(0.1))
                    .cornerRadius(Constants.cornerRadius)
            }
        }
        .padding(Constants.padding)
        .background(AppTheme.shared.surface)
        .cornerRadius(Constants.cornerRadius)
        .shadow(radius: 2)
    }
    
    private var progressSection: some View {
        VStack(spacing: 12) {
            BudgetProgressBar(
                progress: Double(truncating: goal.currentAmount as NSNumber),
                total: Double(truncating: goal.targetAmount as NSNumber),
                height: Constants.progressBarHeight
            )
            
            HStack {
                Text("\(Int(goal.progressPercentage()))% Complete")
                    .font(AppTheme.shared.bodyFont)
                    .foregroundColor(AppTheme.shared.textPrimary)
                
                Spacer()
                
                Button(isEditingProgress ? "Cancel" : "Update Progress") {
                    withAnimation {
                        isEditingProgress.toggle()
                        if !isEditingProgress {
                            newProgressAmount = ""
                        }
                    }
                }
                .font(AppTheme.shared.bodyFont)
                .foregroundColor(AppTheme.shared.primary)
            }
        }
        .padding(Constants.padding)
        .background(AppTheme.shared.surface)
        .cornerRadius(Constants.cornerRadius)
        .shadow(radius: 2)
    }
    
    private var amountDetails: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Target Amount")
                    .font(AppTheme.shared.bodyFont)
                    .foregroundColor(AppTheme.shared.textSecondary)
                
                Spacer()
                
                Text(goal.formattedTargetAmount())
                    .font(AppTheme.shared.headingFont)
                    .foregroundColor(AppTheme.shared.textPrimary)
            }
            
            Divider()
            
            HStack {
                Text("Current Amount")
                    .font(AppTheme.shared.bodyFont)
                    .foregroundColor(AppTheme.shared.textSecondary)
                
                Spacer()
                
                Text(goal.formattedCurrentAmount())
                    .font(AppTheme.shared.headingFont)
                    .foregroundColor(AppTheme.shared.textPrimary)
            }
        }
        .padding(Constants.padding)
        .background(AppTheme.shared.surface)
        .cornerRadius(Constants.cornerRadius)
        .shadow(radius: 2)
    }
    
    private var deadlineInfo: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Days Remaining")
                    .font(AppTheme.shared.bodyFont)
                    .foregroundColor(AppTheme.shared.textSecondary)
                
                Text("\(goal.daysRemaining())")
                    .font(AppTheme.shared.headingFont)
                    .foregroundColor(AppTheme.shared.textPrimary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text("Deadline")
                    .font(AppTheme.shared.bodyFont)
                    .foregroundColor(AppTheme.shared.textSecondary)
                
                Text(goal.deadline, style: .date)
                    .font(AppTheme.shared.headingFont)
                    .foregroundColor(AppTheme.shared.textPrimary)
            }
        }
        .padding(Constants.padding)
        .background(AppTheme.shared.surface)
        .cornerRadius(Constants.cornerRadius)
        .shadow(radius: 2)
    }
    
    private var progressUpdateForm: some View {
        VStack(spacing: 16) {
            TextField("New Progress Amount", text: $newProgressAmount)
                .keyboardType(.decimalPad)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .font(AppTheme.shared.bodyFont)
            
            Button("Save Progress") {
                updateProgress()
            }
            .font(AppTheme.shared.bodyFont)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: Constants.deleteButtonHeight)
            .background(AppTheme.shared.primary)
            .cornerRadius(Constants.cornerRadius)
            .disabled(newProgressAmount.isEmpty)
        }
        .padding(Constants.padding)
        .background(AppTheme.shared.surface)
        .cornerRadius(Constants.cornerRadius)
        .shadow(radius: 2)
    }
    
    private var deleteButton: some View {
        Button(action: {
            showDeleteConfirmation = true
        }) {
            Text("Delete Goal")
                .font(AppTheme.shared.bodyFont)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: Constants.deleteButtonHeight)
                .background(AppTheme.shared.error)
                .cornerRadius(Constants.cornerRadius)
        }
        .confirmationDialog(
            "Delete Goal",
            isPresented: $showDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                deleteGoal()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Are you sure you want to delete this goal? This action cannot be undone.")
        }
    }
    
    // MARK: - Helper Methods
    
    private var statusColor: Color {
        switch goal.status {
        case .completed:
            return AppTheme.shared.success
        case .overdue:
            return AppTheme.shared.error
        case .inProgress:
            return AppTheme.shared.primary
        case .notStarted:
            return AppTheme.shared.textSecondary
        }
    }
    
    private func updateProgress() {
        guard let amount = Decimal(string: newProgressAmount) else {
            errorMessage = "Please enter a valid amount"
            return
        }
        
        Task {
            let result = await viewModel.updateGoalProgress(goalId: goal.id, amount: amount)
            switch result {
            case .success:
                withAnimation {
                    isEditingProgress = false
                    newProgressAmount = ""
                }
            case .failure(let error):
                errorMessage = error.localizedDescription
            }
        }
    }
    
    private func deleteGoal() {
        Task {
            let result = await viewModel.deleteGoal(goalId: goal.id)
            switch result {
            case .success:
                dismiss()
            case .failure(let error):
                errorMessage = error.localizedDescription
            }
        }
    }
}

// MARK: - Preview Provider

#if DEBUG
struct GoalDetailView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            GoalDetailView(
                goal: try! Goal(
                    id: UUID(),
                    name: "Emergency Fund",
                    description: "Build emergency savings",
                    targetAmount: 10000,
                    currentAmount: 5000,
                    deadline: Date().addingTimeInterval(60*60*24*90),
                    category: .savings
                ),
                viewModel: GoalsViewModel(goalUseCases: MockGoalUseCases())
            )
        }
    }
}
#endif