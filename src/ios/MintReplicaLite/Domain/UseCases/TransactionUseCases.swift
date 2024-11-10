//
// TransactionUseCases.swift
// MintReplicaLite
//
// Use case implementation for transaction-related business logic with comprehensive error handling
// and real-time synchronization support

import Foundation // iOS 14.0+
import Combine // iOS 14.0+

// MARK: - Human Tasks
/*
1. Configure proper error logging and monitoring
2. Set up analytics tracking for transaction patterns
3. Verify spending analysis thresholds
4. Test sync conflict resolution scenarios
5. Validate transaction categorization rules
*/

/// Implements business logic for transaction management and analysis with comprehensive error handling
/// Requirements addressed:
/// - Transaction tracking and categorization (1.2 Scope/Core Features)
/// - Data export and reporting capabilities (1.2 Scope/Core Features)
/// - Real-time data synchronization (1.2 Scope/Technical Implementation)
@available(iOS 14.0, *)
final class TransactionUseCases {
    
    // MARK: - Properties
    
    private let repository: TransactionRepository
    private let transactionsPublisher: CurrentValueSubject<[Transaction], Never>
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    /// Initializes use cases with repository dependency and sets up transaction observation
    /// - Parameter repository: Repository for transaction data management
    init(repository: TransactionRepository) {
        self.repository = repository
        self.transactionsPublisher = CurrentValueSubject<[Transaction], Never>([])
        
        // Set up transaction observation
        setupTransactionObservation()
    }
    
    // MARK: - Public Methods
    
    /// Creates a new transaction with validation and triggers sync
    /// - Parameter transaction: Transaction to create
    /// - Returns: Publisher emitting created transaction or error
    func createTransaction(_ transaction: Transaction) -> AnyPublisher<Transaction, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(UseCaseError.invalidState))
                return
            }
            
            do {
                // Validate transaction data
                try self.validateTransaction(transaction)
                
                // Create via repository
                self.repository.create(transaction)
                    .sink(
                        receiveCompletion: { completion in
                            if case .failure(let error) = completion {
                                promise(.failure(error))
                            }
                        },
                        receiveValue: { createdTransaction in
                            // Update transactions publisher
                            var currentTransactions = self.transactionsPublisher.value
                            currentTransactions.append(createdTransaction)
                            self.transactionsPublisher.send(currentTransactions)
                            
                            // Trigger sync
                            self.syncTransactions()
                                .sink(
                                    receiveCompletion: { _ in },
                                    receiveValue: { _ in }
                                )
                                .store(in: &self.cancellables)
                            
                            promise(.success(createdTransaction))
                        }
                    )
                    .store(in: &self.cancellables)
                
            } catch {
                promise(.failure(error))
            }
        }.eraseToAnyPublisher()
    }
    
    /// Updates an existing transaction with validation
    /// - Parameter transaction: Transaction to update
    /// - Returns: Publisher emitting updated transaction or error
    func updateTransaction(_ transaction: Transaction) -> AnyPublisher<Transaction, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(UseCaseError.invalidState))
                return
            }
            
            do {
                // Validate transaction exists
                guard self.transactionsPublisher.value.contains(where: { $0.id == transaction.id }) else {
                    throw UseCaseError.transactionNotFound
                }
                
                // Validate update data
                try self.validateTransaction(transaction)
                
                // Update via repository
                self.repository.update(transaction)
                    .sink(
                        receiveCompletion: { completion in
                            if case .failure(let error) = completion {
                                promise(.failure(error))
                            }
                        },
                        receiveValue: { updatedTransaction in
                            // Update transactions publisher
                            var currentTransactions = self.transactionsPublisher.value
                            if let index = currentTransactions.firstIndex(where: { $0.id == transaction.id }) {
                                currentTransactions[index] = updatedTransaction
                                self.transactionsPublisher.send(currentTransactions)
                            }
                            
                            // Trigger sync
                            self.syncTransactions()
                                .sink(
                                    receiveCompletion: { _ in },
                                    receiveValue: { _ in }
                                )
                                .store(in: &self.cancellables)
                            
                            promise(.success(updatedTransaction))
                        }
                    )
                    .store(in: &self.cancellables)
                
            } catch {
                promise(.failure(error))
            }
        }.eraseToAnyPublisher()
    }
    
    /// Deletes a transaction by ID with validation
    /// - Parameter id: ID of transaction to delete
    /// - Returns: Publisher indicating success or error
    func deleteTransaction(_ id: String) -> AnyPublisher<Void, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(UseCaseError.invalidState))
                return
            }
            
            // Validate transaction exists
            guard self.transactionsPublisher.value.contains(where: { $0.id.uuidString == id }) else {
                promise(.failure(UseCaseError.transactionNotFound))
                return
            }
            
            // Delete via repository
            self.repository.delete(id)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: { _ in
                        // Update transactions publisher
                        var currentTransactions = self.transactionsPublisher.value
                        currentTransactions.removeAll { $0.id.uuidString == id }
                        self.transactionsPublisher.send(currentTransactions)
                        
                        // Trigger sync
                        self.syncTransactions()
                            .sink(
                                receiveCompletion: { _ in },
                                receiveValue: { _ in }
                            )
                            .store(in: &self.cancellables)
                        
                        promise(.success(()))
                    }
                )
                .store(in: &self.cancellables)
        }.eraseToAnyPublisher()
    }
    
    /// Provides observable transaction stream with real-time updates
    /// - Returns: Publisher emitting transaction updates
    func getTransactionsPublisher() -> AnyPublisher<[Transaction], Never> {
        return transactionsPublisher
            .receive(on: DispatchQueue.main)
            .map { transactions in
                // Sort by date descending
                return transactions.sorted { $0.date > $1.date }
            }
            .eraseToAnyPublisher()
    }
    
    /// Synchronizes transactions with backend handling conflicts
    /// - Returns: Publisher indicating sync completion or error
    func syncTransactions() -> AnyPublisher<Void, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(UseCaseError.invalidState))
                return
            }
            
            self.repository.sync()
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: { _ in
                        // Refresh transactions list after sync
                        self.repository.list()
                            .sink(
                                receiveCompletion: { completion in
                                    if case .failure(let error) = completion {
                                        promise(.failure(error))
                                    }
                                },
                                receiveValue: { transactions in
                                    self.transactionsPublisher.send(transactions)
                                    promise(.success(()))
                                }
                            )
                            .store(in: &self.cancellables)
                    }
                )
                .store(in: &self.cancellables)
        }.eraseToAnyPublisher()
    }
    
    /// Analyzes transaction patterns and spending with categorization
    /// - Parameter period: Time period for analysis
    /// - Returns: Publisher emitting analysis results
    func analyzeSpending(_ period: DateInterval) -> AnyPublisher<SpendingAnalysis, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(UseCaseError.invalidState))
                return
            }
            
            // Get transactions for period
            let criteria: [String: Any] = [
                "startDate": period.start,
                "endDate": period.end,
                "sortBy": "date",
                "sortOrder": "desc"
            ]
            
            self.repository.list(criteria)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: { transactions in
                        // Calculate spending by category
                        var categorySpending: [String: Decimal] = [:]
                        var totalExpenses: Decimal = 0
                        var totalIncome: Decimal = 0
                        
                        for transaction in transactions {
                            if transaction.isExpense() {
                                categorySpending[transaction.category, default: 0] += transaction.amount
                                totalExpenses += transaction.amount
                            } else {
                                totalIncome += transaction.amount
                            }
                        }
                        
                        // Generate analysis
                        let analysis = SpendingAnalysis(
                            period: period,
                            categorySpending: categorySpending,
                            totalExpenses: totalExpenses,
                            totalIncome: totalIncome,
                            transactionCount: transactions.count
                        )
                        
                        promise(.success(analysis))
                    }
                )
                .store(in: &self.cancellables)
        }.eraseToAnyPublisher()
    }
    
    // MARK: - Private Methods
    
    private func setupTransactionObservation() {
        // Initial load of transactions
        repository.list()
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { [weak self] transactions in
                    self?.transactionsPublisher.send(transactions)
                }
            )
            .store(in: &cancellables)
    }
    
    private func validateTransaction(_ transaction: Transaction) throws {
        // Validate amount is non-zero
        let amountDouble = (transaction.amount as NSDecimalNumber).doubleValue
        guard amountDouble.roundToDecimal(2) != 0 else {
            throw UseCaseError.invalidAmount
        }
        
        // Verify transaction date is not in future
        guard transaction.date <= Date() else {
            throw UseCaseError.invalidDate
        }
        
        // Validate category
        guard !transaction.category.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw UseCaseError.invalidCategory
        }
    }
}

// MARK: - Spending Analysis

/// Model representing spending analysis results
struct SpendingAnalysis {
    let period: DateInterval
    let categorySpending: [String: Decimal]
    let totalExpenses: Decimal
    let totalIncome: Decimal
    let transactionCount: Int
}

// MARK: - Use Case Errors

/// Error types for transaction use cases
private enum UseCaseError: LocalizedError {
    case invalidState
    case transactionNotFound
    case invalidAmount
    case invalidDate
    case invalidCategory
    
    var errorDescription: String? {
        switch self {
        case .invalidState:
            return "Invalid use case state"
        case .transactionNotFound:
            return "Transaction not found"
        case .invalidAmount:
            return "Transaction amount cannot be zero"
        case .invalidDate:
            return "Transaction date cannot be in the future"
        case .invalidCategory:
            return "Transaction category cannot be empty"
        }
    }
}