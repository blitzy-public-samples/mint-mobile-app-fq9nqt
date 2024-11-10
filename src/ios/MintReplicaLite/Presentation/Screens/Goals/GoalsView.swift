//
// GoalsView.swift
// MintReplicaLite
//
// Main view for displaying and managing financial goals
//

// MARK: - Human Tasks
/*
1. Configure analytics tracking for goal-related user actions
2. Set up proper error logging service integration
3. Review accessibility labels and hints for VoiceOver support
4. Test pull-to-refresh behavior with network latency
5. Verify goal creation form validation across different locales
*/

import SwiftUI // iOS 15.0+

/// Main view for displaying and managing financial goals
/// Addresses requirements:
/// - Financial goal setting and progress monitoring (1.2 Scope/Core Features)
/// - Mobile Applications (5.2.1 Mobile Applications)
/// - User Interface Design (8.1.4 Screen Layouts)
struct GoalsView: View {
    // MARK: - Properties
    
    @StateObject private var viewModel = GoalsViewModel(goalUseCases: GoalUseCases())
    @State private var showingCreateGoal = false
    @State private var selectedGoal: Goal? = nil
    @State private var isRefreshing = false
    
    // MARK: - Theme
    
    private let theme = AppTheme.shared
    
    // MARK: - Body
    
    var body: some View {
        NavigationView {
            ZStack {
                theme.background
                    .ignoresSafeArea()
                
                VStack(spacing: theme.spacing) {
                    // Category Filter
                    categoryFilterView()
                        .padding(.horizontal)
                    
                    // Goals List
                    goalsList()
                }
            }
            .navigationTitle("Financial Goals")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingCreateGoal = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(theme.primary)
                            .accessibilityLabel("Create new goal")
                    }
                }
            }
            .sheet(isPresented: $showingCreateGoal) {
                createGoalView()
            }
            .sheet(item: $selectedGoal) { goal in
                goalDetailView(goal: goal)
            }
            .overlay {
                if viewModel.state == .loading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.2))
                }
            }
            .alert("Error", isPresented: .constant(viewModel.state == .error)) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "An error occurred")
            }
        }
    }
    
    // MARK: - Category Filter View
    
    private func categoryFilterView() -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: theme.spacing) {
                ForEach([GoalCategory.savings, .investment, .debt, .purchase, .emergency]) { category in
                    Button {
                        viewModel.filterByCategory(category)
                    } label: {
                        Text(category.rawValue.capitalized)
                            .font(theme.bodyFont)
                            .foregroundColor(viewModel.selectedCategory == category ? .white : theme.textPrimary)
                            .padding(.horizontal, theme.spacing)
                            .padding(.vertical, theme.spacing / 2)
                            .background(
                                RoundedRectangle(cornerRadius: theme.cornerRadius)
                                    .fill(viewModel.selectedCategory == category ? theme.primary : theme.surface)
                            )
                    }
                    .accessibilityHint("Filter goals by \(category.rawValue) category")
                }
            }
            .padding(.vertical, theme.spacing / 2)
        }
    }
    
    // MARK: - Goals List View
    
    private func goalsList() -> some View {
        ScrollView {
            LazyVStack(spacing: theme.spacing) {
                if viewModel.goals.isEmpty {
                    emptyStateView()
                } else {
                    ForEach(viewModel.goals, id: \.id) { goal in
                        GoalCard(goal: goal) {
                            selectedGoal = goal
                        }
                        .padding(.horizontal)
                        .transition(.opacity)
                    }
                }
            }
            .padding(.vertical, theme.spacing)
        }
        .refreshable {
            isRefreshing = true
            await viewModel.initialize()
            isRefreshing = false
        }
    }
    
    // MARK: - Empty State View
    
    private func emptyStateView() -> some View {
        VStack(spacing: theme.spacing) {
            Image(systemName: "target")
                .font(.system(size: 60))
                .foregroundColor(theme.textSecondary)
            
            Text("No Goals Yet")
                .font(theme.headingFont)
                .foregroundColor(theme.textPrimary)
            
            Text("Tap the + button to create your first financial goal")
                .font(theme.bodyFont)
                .foregroundColor(theme.textSecondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity, minHeight: 300)
    }
    
    // MARK: - Create Goal View
    
    private func createGoalView() -> some View {
        NavigationView {
            CreateGoalForm(onSubmit: { name, description, amount, deadline, category in
                Task {
                    let result = await viewModel.createGoal(
                        name: name,
                        description: description,
                        targetAmount: amount,
                        deadline: deadline,
                        category: category
                    )
                    
                    if case .success = result {
                        showingCreateGoal = false
                    }
                }
            })
            .navigationTitle("Create Goal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        showingCreateGoal = false
                    }
                }
            }
        }
    }
    
    // MARK: - Goal Detail View
    
    private func goalDetailView(goal: Goal) -> some View {
        NavigationView {
            GoalDetailContent(
                goal: goal,
                onUpdateProgress: { amount in
                    Task {
                        let result = await viewModel.updateGoalProgress(
                            goalId: goal.id,
                            amount: amount
                        )
                        
                        if case .success = result {
                            selectedGoal = nil
                        }
                    }
                },
                onDelete: {
                    Task {
                        let result = await viewModel.deleteGoal(goalId: goal.id)
                        
                        if case .success = result {
                            selectedGoal = nil
                        }
                    }
                }
            )
            .navigationTitle("Goal Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        selectedGoal = nil
                    }
                }
            }
        }
    }
}

// MARK: - Preview Provider

#if DEBUG
struct GoalsView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Light Mode
            GoalsView()
                .previewDisplayName("Light Mode")
            
            // Dark Mode
            GoalsView()
                .preferredColorScheme(.dark)
                .previewDisplayName("Dark Mode")
            
            // High Contrast
            GoalsView()
                .environment(\.accessibilityEnabled, true)
                .previewDisplayName("High Contrast")
        }
    }
}
#endif