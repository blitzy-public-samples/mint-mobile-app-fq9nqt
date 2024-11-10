//
// InvestmentsView.swift
// MintReplicaLite
//
// SwiftUI view implementation for the investments screen
//

import SwiftUI // iOS 15.0+

// MARK: - Human Tasks
/*
 1. Verify VoiceOver functionality with dynamic content updates
 2. Test color contrast ratios in both light and dark modes
 3. Validate dynamic type scaling behavior with large text sizes
 4. Test pull-to-refresh performance with large portfolios
 5. Verify offline data display and refresh behavior
*/

/// Main view for displaying investment portfolio information
/// Addresses requirements:
/// - Investment Portfolio Tracking (1.2 Scope/Core Features)
/// - Investment Dashboard (8.1.5 Investment Dashboard)
/// - Mobile UI Design (8.1.7 Mobile Responsive Considerations)
/// - Accessibility Support (8.1.8 Accessibility Features)
@available(iOS 15.0, *)
struct InvestmentsView: View {
    // MARK: - Properties
    
    @StateObject private var viewModel: InvestmentsViewModel
    @Environment(\.refresh) private var refreshAction
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    
    // MARK: - Initialization
    
    init(viewModel: InvestmentsViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }
    
    // MARK: - Body
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: AppTheme.shared.spacing) {
                    portfolioSummarySection()
                        .padding(.horizontal)
                    
                    performanceChartSection()
                        .frame(height: 200)
                        .padding(.horizontal)
                    
                    holdingsListSection()
                }
                .padding(.vertical)
            }
            .navigationTitle("Investments")
            .refreshable {
                await viewModel.refreshPortfolio()
            }
            .overlay {
                if viewModel.state == .loading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.1))
                }
            }
            .alert("Error", isPresented: .constant(viewModel.state == .error)) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "An error occurred")
            }
        }
        .navigationViewStyle(.stack)
    }
    
    // MARK: - Portfolio Summary Section
    
    /// Creates the portfolio summary view section with accessibility support
    @ViewBuilder
    private func portfolioSummarySection() -> some View {
        VStack(alignment: .leading, spacing: AppTheme.shared.spacing) {
            // Total Portfolio Value
            VStack(alignment: .leading, spacing: 4) {
                Text("Total Portfolio Value")
                    .font(AppTheme.shared.bodyFont)
                    .foregroundColor(AppTheme.shared.textSecondary)
                
                Text(CurrencyFormatter.shared.formatAmount(Decimal(viewModel.totalPortfolioValue)))
                    .font(AppTheme.shared.titleFont)
                    .foregroundColor(AppTheme.shared.textPrimary)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Total Portfolio Value")
            .accessibilityValue(CurrencyFormatter.shared.formatAmount(Decimal(viewModel.totalPortfolioValue)))
            
            // Return Metrics
            HStack(spacing: AppTheme.shared.spacing * 2) {
                // Total Return
                VStack(alignment: .leading, spacing: 4) {
                    Text("Total Return")
                        .font(AppTheme.shared.bodyFont)
                        .foregroundColor(AppTheme.shared.textSecondary)
                    
                    Text(CurrencyFormatter.shared.formatAmount(Decimal(viewModel.totalReturn)))
                        .font(AppTheme.shared.headingFont)
                        .foregroundColor(viewModel.totalReturn >= 0 ? AppTheme.shared.success : AppTheme.shared.error)
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Total Return")
                .accessibilityValue("\(viewModel.totalReturn >= 0 ? "Gain of" : "Loss of") \(CurrencyFormatter.shared.formatAmount(Decimal(abs(viewModel.totalReturn))))")
                
                // Return Percentage
                VStack(alignment: .leading, spacing: 4) {
                    Text("Return %")
                        .font(AppTheme.shared.bodyFont)
                        .foregroundColor(AppTheme.shared.textSecondary)
                    
                    Text(String(format: "%.1f%%", viewModel.returnPercentage))
                        .font(AppTheme.shared.headingFont)
                        .foregroundColor(viewModel.returnPercentage >= 0 ? AppTheme.shared.success : AppTheme.shared.error)
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Return Percentage")
                .accessibilityValue("\(viewModel.returnPercentage >= 0 ? "Up" : "Down") \(String(format: "%.1f", abs(viewModel.returnPercentage))) percent")
            }
        }
        .padding()
        .background(AppTheme.shared.surface)
        .cornerRadius(AppTheme.shared.cornerRadius)
        .shadow(radius: AppTheme.shared.shadowRadius)
    }
    
    // MARK: - Performance Chart Section
    
    /// Creates the accessible performance chart view section
    @ViewBuilder
    private func performanceChartSection() -> some View {
        VStack(alignment: .leading, spacing: AppTheme.shared.spacing) {
            Text("Performance")
                .font(AppTheme.shared.headingFont)
                .foregroundColor(AppTheme.shared.textPrimary)
                .accessibilityAddTraits(.isHeader)
            
            // Convert investment data to chart data points
            let chartPoints = viewModel.investments.enumerated().map { index, investment in
                ChartDataPoint(
                    value: Decimal(investment.currentValue()),
                    label: investment.symbol,
                    color: index % 2 == 0 ? AppTheme.shared.primary : AppTheme.shared.accent,
                    accessibilityLabel: "\(investment.name): \(investment.formattedCurrentValue())"
                )
            }
            
            ChartView(
                dataPoints: chartPoints,
                chartType: .bar,
                accentColor: AppTheme.shared.primary,
                showLabels: true,
                showGrid: true,
                isAnimated: true
            )
        }
        .padding()
        .background(AppTheme.shared.surface)
        .cornerRadius(AppTheme.shared.cornerRadius)
        .shadow(radius: AppTheme.shared.shadowRadius)
    }
    
    // MARK: - Holdings List Section
    
    /// Creates the accessible investment holdings list view
    @ViewBuilder
    private func holdingsListSection() -> some View {
        VStack(alignment: .leading, spacing: AppTheme.shared.spacing) {
            Text("Holdings")
                .font(AppTheme.shared.headingFont)
                .foregroundColor(AppTheme.shared.textPrimary)
                .padding(.horizontal)
                .accessibilityAddTraits(.isHeader)
            
            if viewModel.investments.isEmpty {
                Text("No investments found")
                    .font(AppTheme.shared.bodyFont)
                    .foregroundColor(AppTheme.shared.textSecondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
                    .accessibilityLabel("No investments in portfolio")
            } else {
                LazyVStack(spacing: AppTheme.shared.spacing) {
                    ForEach(viewModel.investments) { investment in
                        NavigationLink {
                            // Navigation to detail view would be implemented here
                            Text("Investment Detail View")
                        } label: {
                            investmentRow(investment)
                        }
                        .accessibilityHint("Double tap to view details")
                    }
                }
            }
        }
    }
    
    /// Creates an individual investment row with accessibility support
    @ViewBuilder
    private func investmentRow(_ investment: Investment) -> some View {
        HStack(spacing: AppTheme.shared.spacing) {
            // Symbol and Name
            VStack(alignment: .leading, spacing: 4) {
                Text(investment.symbol)
                    .font(AppTheme.shared.headingFont)
                    .foregroundColor(AppTheme.shared.textPrimary)
                
                Text(investment.name)
                    .font(AppTheme.shared.bodyFont)
                    .foregroundColor(AppTheme.shared.textSecondary)
                    .lineLimit(1)
            }
            
            Spacer()
            
            // Value and Return
            VStack(alignment: .trailing, spacing: 4) {
                Text(investment.formattedCurrentValue())
                    .font(AppTheme.shared.headingFont)
                    .foregroundColor(AppTheme.shared.textPrimary)
                
                Text(String(format: "%.1f%%", investment.returnPercentage()))
                    .font(AppTheme.shared.bodyFont)
                    .foregroundColor(investment.returnPercentage() >= 0 ? AppTheme.shared.success : AppTheme.shared.error)
            }
        }
        .padding()
        .background(AppTheme.shared.surface)
        .cornerRadius(AppTheme.shared.cornerRadius)
        .shadow(radius: AppTheme.shared.shadowRadius)
        .padding(.horizontal)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(investment.name)")
        .accessibilityValue("Current value \(investment.formattedCurrentValue()), Return \(String(format: "%.1f", investment.returnPercentage())) percent")
    }
}

// MARK: - Preview Provider

struct InvestmentsView_Previews: PreviewProvider {
    static var previews: some View {
        let mockViewModel = InvestmentsViewModel(investmentUseCases: MockInvestmentUseCases())
        
        Group {
            InvestmentsView(viewModel: mockViewModel)
                .preferredColorScheme(.light)
                .previewDisplayName("Light Mode")
            
            InvestmentsView(viewModel: mockViewModel)
                .preferredColorScheme(.dark)
                .previewDisplayName("Dark Mode")
            
            InvestmentsView(viewModel: mockViewModel)
                .environment(\.dynamicTypeSize, .accessibility5)
                .previewDisplayName("Large Dynamic Type")
        }
    }
}