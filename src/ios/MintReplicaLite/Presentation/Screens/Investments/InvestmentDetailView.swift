//
// InvestmentDetailView.swift
// MintReplicaLite
//
// Detailed investment view with accessibility support and real-time updates
//

import SwiftUI // iOS 15.0+
import Combine // iOS 15.0+

// MARK: - Human Tasks
/*
 1. Verify VoiceOver functionality across all sections
 2. Test dynamic type scaling behavior
 3. Validate color contrast ratios for accessibility
 4. Test pull-to-refresh performance with large datasets
 5. Verify real-time price update animations
*/

/// SwiftUI view displaying detailed information about a specific investment with accessibility support
/// Addresses requirements:
/// - Investment Portfolio Tracking (1.2 Scope/Core Features)
/// - Investment Manager (6.1.1 Core Application Components)
/// - Investment Dashboard (8.1.5 Investment Dashboard)
@available(iOS 15.0, *)
struct InvestmentDetailView: View {
    // MARK: - Properties
    
    private let investment: Investment
    @ObservedObject private var viewModel: InvestmentsViewModel
    @Environment(\.dismiss) private var dismiss
    
    // MARK: - Time Period Selection
    
    private enum TimePeriod: String, CaseIterable {
        case day = "1D"
        case week = "1W"
        case month = "1M"
        case threeMonths = "3M"
        case year = "1Y"
        case all = "All"
    }
    
    @State private var selectedPeriod: TimePeriod = .month
    
    // MARK: - Initialization
    
    /// Initializes the investment detail view with required dependencies
    /// - Parameters:
    ///   - investment: Investment model to display
    ///   - viewModel: View model for investment operations
    init(investment: Investment, viewModel: InvestmentsViewModel) {
        self.investment = investment
        self.viewModel = viewModel
        
        // Configure accessibility properties
        _investment.accessibilityIdentifier = "investmentDetail"
    }
    
    // MARK: - Body
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Investment Header
                VStack(spacing: 8) {
                    Text(investment.name)
                        .font(.title2)
                        .fontWeight(.semibold)
                        .multilineTextAlignment(.center)
                        .accessibilityAddTraits(.isHeader)
                    
                    Text(investment.formattedCurrentValue())
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                        .accessibilityLabel("Current value: \(investment.formattedCurrentValue())")
                    
                    Text(investment.symbol)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .accessibilityLabel("Symbol: \(investment.symbol)")
                }
                .padding(.top)
                
                // Performance Metrics
                performanceMetricsSection()
                    .padding(.horizontal)
                
                // Performance Chart
                performanceChartSection()
                    .frame(height: 250)
                    .padding(.horizontal)
                
                // Investment Details
                investmentDetailsSection()
                    .padding(.horizontal)
            }
            .padding(.bottom)
        }
        .refreshable {
            await viewModel.refreshPortfolio()
        }
        .overlay {
            if case .loading = viewModel.state {
                ProgressView()
                    .scaleEffect(1.5)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.black.opacity(0.1))
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
    
    // MARK: - Sections
    
    /// Creates the performance metrics view section with accessibility labels
    private func performanceMetricsSection() -> some View {
        VStack(spacing: 16) {
            HStack(spacing: 20) {
                // Total Return
                VStack(alignment: .leading, spacing: 4) {
                    Text("Total Return")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    let totalReturn = investment.totalReturn()
                    Text(CurrencyFormatter.shared.formatAmount(Decimal(totalReturn)))
                        .font(.headline)
                        .foregroundColor(totalReturn >= 0 ? .green : .red)
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Total return: \(CurrencyFormatter.shared.formatAmount(Decimal(investment.totalReturn())))")
                
                // Return Percentage
                VStack(alignment: .leading, spacing: 4) {
                    Text("Return %")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    let returnPercentage = investment.returnPercentage()
                    Text(String(format: "%.2f%%", returnPercentage))
                        .font(.headline)
                        .foregroundColor(returnPercentage >= 0 ? .green : .red)
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Return percentage: \(String(format: "%.2f percent", investment.returnPercentage()))")
            }
            
            Divider()
            
            // Last Updated
            HStack {
                Text("Last Updated")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(investment.lastUpdated, style: .relative)
                    .font(.subheadline)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Last updated \(investment.lastUpdated, style: .relative)")
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    /// Creates the performance chart view section with accessibility support
    private func performanceChartSection() -> some View {
        VStack(spacing: 16) {
            // Time Period Selector
            HStack {
                ForEach(TimePeriod.allCases, id: \.self) { period in
                    Button(action: {
                        withAnimation {
                            selectedPeriod = period
                        }
                    }) {
                        Text(period.rawValue)
                            .font(.subheadline)
                            .fontWeight(selectedPeriod == period ? .semibold : .regular)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(
                                selectedPeriod == period ?
                                Color.accentColor.opacity(0.2) :
                                Color.clear
                            )
                            .cornerRadius(8)
                    }
                    .accessibilityLabel("\(period.rawValue) time period")
                    .accessibilityAddTraits(selectedPeriod == period ? [.isSelected] : [])
                }
            }
            
            // Performance Chart
            ChartView(
                dataPoints: generateChartData(),
                chartType: .line,
                showGrid: true,
                isAnimated: true
            )
            .accessibilityLabel("Investment performance chart for \(selectedPeriod.rawValue) period")
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    /// Creates the investment details view section with accessibility support
    private func investmentDetailsSection() -> some View {
        VStack(spacing: 16) {
            // Investment Type
            HStack {
                Text("Type")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(investment.type.rawValue.capitalized)
                    .font(.subheadline)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Investment type: \(investment.type.rawValue.capitalized)")
            
            Divider()
            
            // Quantity
            HStack {
                Text("Shares")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(String(format: "%.4f", investment.quantity))
                    .font(.subheadline)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Shares owned: \(String(format: "%.4f", investment.quantity))")
            
            Divider()
            
            // Cost Basis
            HStack {
                Text("Cost Basis")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(CurrencyFormatter.shared.formatAmount(Decimal(investment.costBasis)))
                    .font(.subheadline)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Cost basis: \(CurrencyFormatter.shared.formatAmount(Decimal(investment.costBasis)))")
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    // MARK: - Helper Methods
    
    /// Generates chart data points based on selected time period
    private func generateChartData() -> [ChartDataPoint] {
        // Sample data points for demonstration
        // In production, this would fetch real historical data
        let baseValue = investment.currentValue()
        var dataPoints: [ChartDataPoint] = []
        
        switch selectedPeriod {
        case .day:
            // Hourly data points
            for hour in 0..<24 {
                let value = Decimal(baseValue * (0.95 + Double.random(in: 0...0.1)))
                let date = Calendar.current.date(byAdding: .hour, value: -hour, to: Date())!
                dataPoints.append(ChartDataPoint(
                    value: value,
                    label: String(format: "%02d:00", 24 - hour),
                    date: date
                ))
            }
        case .week:
            // Daily data points
            for day in 0..<7 {
                let value = Decimal(baseValue * (0.93 + Double.random(in: 0...0.14)))
                let date = Calendar.current.date(byAdding: .day, value: -day, to: Date())!
                dataPoints.append(ChartDataPoint(
                    value: value,
                    label: date.formatted(.dateTime.weekday(.abbreviated)),
                    date: date
                ))
            }
        default:
            // Monthly data points
            for month in 0..<12 {
                let value = Decimal(baseValue * (0.90 + Double.random(in: 0...0.20)))
                let date = Calendar.current.date(byAdding: .month, value: -month, to: Date())!
                dataPoints.append(ChartDataPoint(
                    value: value,
                    label: date.formatted(.dateTime.month(.abbreviated)),
                    date: date
                ))
            }
        }
        
        return dataPoints.reversed()
    }
}

// MARK: - Preview Provider

struct InvestmentDetailView_Previews: PreviewProvider {
    static var previews: some View {
        let sampleInvestment = Investment(
            id: "1",
            symbol: "AAPL",
            name: "Apple Inc.",
            quantity: 10.0,
            costBasis: 150.0,
            currentPrice: 175.0,
            accountId: "acc1",
            type: .stock
        )
        
        NavigationView {
            InvestmentDetailView(
                investment: sampleInvestment,
                viewModel: InvestmentsViewModel(investmentUseCases: InvestmentUseCases())
            )
        }
    }
}