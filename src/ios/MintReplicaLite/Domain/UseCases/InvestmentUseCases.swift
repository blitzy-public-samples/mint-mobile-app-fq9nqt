//
// InvestmentUseCases.swift
// MintReplicaLite
//
// Use cases implementation for investment portfolio management
//

import Foundation // iOS 15.0+
import Combine // iOS 15.0+

// MARK: - Human Tasks
/*
 1. Configure proper error logging and monitoring
 2. Test performance with large investment portfolios
 3. Verify thread safety for concurrent operations
 4. Set up analytics tracking for investment operations
 5. Test offline functionality thoroughly
*/

/// Implementation of investment portfolio management business logic
/// Addresses requirements:
/// - Investment Portfolio Tracking: Basic investment portfolio tracking functionality
/// - Investment Manager: Track performance, holdings, calculate returns, update prices
/// - Offline Support: Local SQLite database for offline data
@available(iOS 15.0, *)
final class InvestmentUseCases {
    
    // MARK: - Properties
    
    private let repository: InvestmentRepository
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    /// Initializes use cases with repository dependency
    /// - Parameter repository: Repository for investment data operations
    init(repository: InvestmentRepository) {
        self.repository = repository
        
        // Subscribe to repository updates
        repository.investmentsSubject
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.handleInvestmentsUpdate()
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Portfolio Management
    
    /// Adds a new investment to the portfolio
    /// - Parameter investment: Investment to add
    /// - Returns: Created investment or error
    func addInvestment(_ investment: Investment) async throws -> Result<Investment, Error> {
        do {
            // Validate investment data
            guard isValidInvestment(investment) else {
                return .failure(InvestmentError.invalidData)
            }
            
            // Create through repository
            return try await repository.create(investment: investment)
                .mapError { $0 as Error }
        } catch {
            return .failure(error)
        }
    }
    
    /// Retrieves investment details by ID
    /// - Parameter id: Investment identifier
    /// - Returns: Investment if found or error
    func getInvestment(_ id: String) async throws -> Result<Investment?, Error> {
        do {
            return try await repository.read(id: id)
                .mapError { $0 as Error }
        } catch {
            return .failure(error)
        }
    }
    
    /// Updates existing investment details
    /// - Parameter investment: Updated investment data
    /// - Returns: Updated investment or error
    func updateInvestment(_ investment: Investment) async throws -> Result<Investment, Error> {
        do {
            // Validate updated data
            guard isValidInvestment(investment) else {
                return .failure(InvestmentError.invalidData)
            }
            
            // Update through repository
            return try await repository.update(investment: investment)
                .mapError { $0 as Error }
        } catch {
            return .failure(error)
        }
    }
    
    /// Removes an investment from portfolio
    /// - Parameter id: Investment identifier to remove
    /// - Returns: Success or error
    func removeInvestment(_ id: String) async throws -> Result<Void, Error> {
        do {
            return try await repository.delete(id: id)
                .mapError { $0 as Error }
        } catch {
            return .failure(error)
        }
    }
    
    /// Retrieves complete investment portfolio
    /// - Returns: List of investments or error
    func getPortfolio() async throws -> Result<[Investment], Error> {
        do {
            return try await repository.list()
                .mapError { $0 as Error }
        } catch {
            return .failure(error)
        }
    }
    
    /// Calculates total portfolio value
    /// - Returns: Total value or error
    func getPortfolioValue() async throws -> Result<Double, Error> {
        do {
            let result = try await repository.list()
            
            switch result {
            case .success(let investments):
                // Calculate total portfolio value
                let totalValue = investments.reduce(0.0) { sum, investment in
                    sum + investment.currentValue()
                }
                return .success(totalValue)
                
            case .failure(let error):
                return .failure(error)
            }
        } catch {
            return .failure(error)
        }
    }
    
    /// Calculates total portfolio return metrics
    /// - Returns: Return metrics tuple or error
    func getPortfolioReturn() async throws -> Result<(amount: Double, percentage: Double), Error> {
        do {
            let result = try await repository.list()
            
            switch result {
            case .success(let investments):
                // Calculate total return amount
                let totalReturn = investments.reduce(0.0) { sum, investment in
                    sum + investment.totalReturn()
                }
                
                // Calculate total cost basis
                let totalCost = investments.reduce(0.0) { sum, investment in
                    sum + (investment.quantity * investment.costBasis)
                }
                
                // Calculate return percentage
                let percentage = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0
                let roundedPercentage = (percentage * 100).rounded() / 100
                
                return .success((amount: totalReturn, percentage: roundedPercentage))
                
            case .failure(let error):
                return .failure(error)
            }
        } catch {
            return .failure(error)
        }
    }
    
    /// Updates current prices for all investments
    /// - Returns: Success or error
    func refreshPrices() async throws -> Result<Void, Error> {
        do {
            return try await repository.updatePrices()
                .mapError { $0 as Error }
        } catch {
            return .failure(error)
        }
    }
    
    // MARK: - Private Methods
    
    private func isValidInvestment(_ investment: Investment) -> Bool {
        // Validate required fields
        guard !investment.symbol.isEmpty,
              !investment.name.isEmpty,
              investment.quantity > 0,
              investment.costBasis > 0,
              investment.currentPrice > 0,
              !investment.accountId.isEmpty else {
            return false
        }
        
        // Validate investment type
        switch investment.type {
        case .stock, .bond, .etf, .mutualFund, .crypto, .other:
            return true
        }
    }
    
    private func handleInvestmentsUpdate() {
        // Handle any side effects of investment updates
        // For example: trigger UI updates, analytics, etc.
    }
}

// MARK: - Error Types

enum InvestmentError: LocalizedError {
    case invalidData
    case notFound
    case operationFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidData:
            return "Invalid investment data provided"
        case .notFound:
            return "Investment not found"
        case .operationFailed:
            return "Investment operation failed"
        }
    }
}