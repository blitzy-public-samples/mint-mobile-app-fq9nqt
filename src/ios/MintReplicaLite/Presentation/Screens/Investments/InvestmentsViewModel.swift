//
// InvestmentsViewModel.swift
// MintReplicaLite
//
// ViewModel implementation for the investments screen with offline-first capabilities
//

import Foundation // iOS 15.0+
import Combine   // iOS 15.0+
import SwiftUI   // iOS 15.0+

// MARK: - Human Tasks
/*
 1. Configure analytics tracking for investment operations
 2. Test offline functionality thoroughly
 3. Verify memory management with large investment portfolios
 4. Set up proper error logging service integration
 5. Test UI responsiveness during price refresh operations
*/

/// ViewModel managing investment portfolio data and user interactions
/// Addresses requirements:
/// - Investment Portfolio Tracking: Basic investment portfolio tracking functionality
/// - Investment Manager: Track performance, holdings, calculate returns, update prices
@MainActor
final class InvestmentsViewModel: ObservableObject, ViewModelProtocol {
    
    // MARK: - Published Properties
    
    @Published private(set) var investments: [Investment] = []
    @Published private(set) var totalPortfolioValue: Double = 0.0
    @Published private(set) var totalReturn: Double = 0.0
    @Published private(set) var returnPercentage: Double = 0.0
    @Published private(set) var state: ViewModelState = .idle
    @Published var errorMessage: String?
    
    // MARK: - Dependencies
    
    private let investmentUseCases: InvestmentUseCases
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    /// Initializes the investments view model with required dependencies
    /// - Parameter investmentUseCases: Use cases for investment operations
    init(investmentUseCases: InvestmentUseCases) {
        self.investmentUseCases = investmentUseCases
        initialize()
    }
    
    // MARK: - ViewModelProtocol Implementation
    
    /// Initializes the view model and loads initial data
    func initialize() {
        Task {
            await loadPortfolioData()
        }
    }
    
    /// Handles errors in a consistent manner
    /// - Parameter error: Error to be handled
    func handleError(_ error: Error) {
        Task { @MainActor in
            state = .error
            errorMessage = error.localizedDescription
            
            #if DEBUG
            print("InvestmentsViewModel Error: \(error)")
            #endif
        }
    }
    
    // MARK: - Public Methods
    
    /// Refreshes portfolio data and prices
    /// Addresses requirement: Investment Manager - Update prices with offline support
    func refreshPortfolio() async {
        do {
            state = .loading
            
            // Refresh investment prices
            let priceResult = try await investmentUseCases.refreshPrices()
            switch priceResult {
            case .success:
                // Reload portfolio data after price refresh
                await loadPortfolioData()
                
            case .failure(let error):
                handleError(error)
            }
            
        } catch {
            handleError(error)
        }
    }
    
    // MARK: - Private Methods
    
    /// Loads portfolio data and calculates metrics
    private func loadPortfolioData() async {
        do {
            state = .loading
            
            // Fetch portfolio data
            let portfolioResult = try await investmentUseCases.getPortfolio()
            
            switch portfolioResult {
            case .success(let fetchedInvestments):
                // Update investments
                investments = fetchedInvestments
                
                // Calculate portfolio metrics
                await calculatePortfolioMetrics()
                
                state = .success
                
            case .failure(let error):
                handleError(error)
            }
            
        } catch {
            handleError(error)
        }
    }
    
    /// Calculates and updates portfolio metrics
    private func calculatePortfolioMetrics() async {
        do {
            // Calculate total portfolio value
            let valueResult = try await investmentUseCases.getPortfolioValue()
            switch valueResult {
            case .success(let value):
                totalPortfolioValue = value
                
            case .failure(let error):
                handleError(error)
                return
            }
            
            // Calculate return metrics
            let returnResult = try await investmentUseCases.getPortfolioReturn()
            switch returnResult {
            case .success(let metrics):
                totalReturn = metrics.amount
                returnPercentage = metrics.percentage
                
            case .failure(let error):
                handleError(error)
                return
            }
            
        } catch {
            handleError(error)
        }
    }
    
    /// Filters investments by type
    /// - Parameter type: Investment type to filter by
    /// - Returns: Filtered array of investments
    private func filterInvestments(by type: InvestmentType) -> [Investment] {
        investments.filter { $0.type == type }
    }
    
    /// Sorts investments by specified criteria
    /// - Parameter sortBy: Sorting criteria (e.g., value, return, name)
    private func sortInvestments(by sortBy: InvestmentSortCriteria) {
        switch sortBy {
        case .value:
            investments.sort { $0.currentValue() > $1.currentValue() }
        case .return:
            investments.sort { $0.returnPercentage() > $1.returnPercentage() }
        case .name:
            investments.sort { $0.name < $1.name }
        }
    }
}

// MARK: - Supporting Types

/// Criteria for sorting investments
private enum InvestmentSortCriteria {
    case value
    case `return`
    case name
}