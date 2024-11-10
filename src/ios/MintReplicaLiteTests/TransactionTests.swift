//
// TransactionTests.swift
// MintReplicaLiteTests
//
// Unit test suite for transaction-related functionality in the Mint Replica Lite iOS app
//

import XCTest // iOS 14.0+
import Combine // iOS 14.0+
@testable import MintReplicaLite

// MARK: - Human Tasks
/*
1. Verify test database configuration is properly isolated
2. Ensure mock network responses are configured correctly
3. Validate test data matches expected schema
4. Configure proper test timeouts for async operations
5. Set up proper test cleanup between test runs
*/

/// Comprehensive test suite for transaction functionality including model validation,
/// persistence, synchronization, and analysis
/// Requirements addressed:
/// - Transaction tracking and categorization (1.2 Scope/Core Features)
/// - Data export and reporting capabilities (1.2 Scope/Core Features)
/// - Real-time data synchronization (1.2 Scope/Technical Implementation)
@available(iOS 14.0, *)
final class TransactionTests: XCTestCase {
    
    // MARK: - Properties
    
    private var repository: TransactionRepository!
    private var useCases: TransactionUseCases!
    private var cancellables: Set<AnyCancellable>!
    
    // MARK: - Setup & Teardown
    
    override func setUp() {
        super.setUp()
        
        // Initialize test dependencies
        repository = TransactionRepository()
        useCases = TransactionUseCases(repository: repository)
        cancellables = Set<AnyCancellable>()
        
        // Clear test database
        clearTestDatabase()
    }
    
    override func tearDown() {
        // Cancel all publishers
        cancellables.forEach { $0.cancel() }
        cancellables = nil
        
        // Clear test data
        clearTestDatabase()
        
        // Reset dependencies
        repository = nil
        useCases = nil
        
        super.tearDown()
    }
    
    // MARK: - Transaction Creation Tests
    
    func testTransactionCreation() throws {
        // Given
        let expectation = XCTestExpectation(description: "Transaction created")
        let testAmount = Decimal(100.50)
        let testDate = Date()
        
        let transaction = try Transaction(
            id: UUID(),
            description: "Test Transaction",
            amount: testAmount,
            date: testDate,
            category: "Food",
            accountId: "test-account",
            isPending: false,
            merchantName: "Test Merchant",
            notes: "Test notes",
            type: .debit
        )
        
        var createdTransaction: Transaction?
        var error: Error?
        
        // When
        useCases.createTransaction(transaction)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let err) = completion {
                        error = err
                    }
                    expectation.fulfill()
                },
                receiveValue: { transaction in
                    createdTransaction = transaction
                }
            )
            .store(in: &cancellables)
        
        // Then
        wait(for: [expectation], timeout: 5.0)
        
        XCTAssertNil(error, "Transaction creation should not fail")
        XCTAssertNotNil(createdTransaction, "Created transaction should not be nil")
        XCTAssertEqual(createdTransaction?.id, transaction.id, "Transaction ID should match")
        XCTAssertEqual(createdTransaction?.amount, testAmount, "Transaction amount should match")
        XCTAssertEqual(createdTransaction?.formattedAmount(), "-$100.50", "Formatted amount should be correct")
        XCTAssertEqual(createdTransaction?.category, "Food", "Transaction category should match")
        XCTAssertTrue(createdTransaction?.isExpense() ?? false, "Transaction should be marked as expense")
    }
    
    func testTransactionCreationValidation() {
        // Given
        let expectation = XCTestExpectation(description: "Transaction validation")
        
        // When - Try to create transaction with zero amount
        do {
            let invalidTransaction = try Transaction(
                id: UUID(),
                description: "Invalid Transaction",
                amount: Decimal(0),
                date: Date(),
                category: "Food",
                accountId: "test-account",
                isPending: false,
                type: .debit
            )
            
            var error: Error?
            
            useCases.createTransaction(invalidTransaction)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let err) = completion {
                            error = err
                        }
                        expectation.fulfill()
                    },
                    receiveValue: { _ in }
                )
                .store(in: &cancellables)
            
            // Then
            wait(for: [expectation], timeout: 5.0)
            XCTAssertNotNil(error, "Should fail with validation error")
            
        } catch {
            // Expected validation error
            XCTAssertNotNil(error, "Should throw validation error")
        }
    }
    
    // MARK: - Transaction Update Tests
    
    func testTransactionUpdate() throws {
        // Given
        let createExpectation = XCTestExpectation(description: "Transaction created")
        let updateExpectation = XCTestExpectation(description: "Transaction updated")
        
        let initialTransaction = try Transaction(
            id: UUID(),
            description: "Initial Transaction",
            amount: Decimal(50),
            date: Date(),
            category: "Food",
            accountId: "test-account",
            isPending: false,
            type: .debit
        )
        
        // Create initial transaction
        useCases.createTransaction(initialTransaction)
            .sink(
                receiveCompletion: { _ in
                    createExpectation.fulfill()
                },
                receiveValue: { _ in }
            )
            .store(in: &cancellables)
        
        wait(for: [createExpectation], timeout: 5.0)
        
        // When - Update transaction
        let updatedTransaction = try Transaction(
            id: initialTransaction.id,
            description: "Updated Transaction",
            amount: Decimal(75),
            date: initialTransaction.date,
            category: "Groceries",
            accountId: initialTransaction.accountId,
            isPending: false,
            type: .debit
        )
        
        var resultTransaction: Transaction?
        var updateError: Error?
        
        useCases.updateTransaction(updatedTransaction)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        updateError = error
                    }
                    updateExpectation.fulfill()
                },
                receiveValue: { transaction in
                    resultTransaction = transaction
                }
            )
            .store(in: &cancellables)
        
        // Then
        wait(for: [updateExpectation], timeout: 5.0)
        
        XCTAssertNil(updateError, "Transaction update should not fail")
        XCTAssertNotNil(resultTransaction, "Updated transaction should not be nil")
        XCTAssertEqual(resultTransaction?.description, "Updated Transaction")
        XCTAssertEqual(resultTransaction?.amount, Decimal(75))
        XCTAssertEqual(resultTransaction?.category, "Groceries")
    }
    
    // MARK: - Transaction Deletion Tests
    
    func testTransactionDeletion() throws {
        // Given
        let createExpectation = XCTestExpectation(description: "Transaction created")
        let deleteExpectation = XCTestExpectation(description: "Transaction deleted")
        let listExpectation = XCTestExpectation(description: "Transactions listed")
        
        let transaction = try Transaction(
            id: UUID(),
            description: "Test Transaction",
            amount: Decimal(100),
            date: Date(),
            category: "Food",
            accountId: "test-account",
            isPending: false,
            type: .debit
        )
        
        // Create transaction first
        useCases.createTransaction(transaction)
            .sink(
                receiveCompletion: { _ in
                    createExpectation.fulfill()
                },
                receiveValue: { _ in }
            )
            .store(in: &cancellables)
        
        wait(for: [createExpectation], timeout: 5.0)
        
        // When - Delete transaction
        var deleteError: Error?
        
        useCases.deleteTransaction(transaction.id.uuidString)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        deleteError = error
                    }
                    deleteExpectation.fulfill()
                },
                receiveValue: { _ in }
            )
            .store(in: &cancellables)
        
        wait(for: [deleteExpectation], timeout: 5.0)
        
        // Then - Verify deletion
        var remainingTransactions: [Transaction] = []
        
        repository.list()
            .sink(
                receiveCompletion: { _ in
                    listExpectation.fulfill()
                },
                receiveValue: { transactions in
                    remainingTransactions = transactions
                }
            )
            .store(in: &cancellables)
        
        wait(for: [listExpectation], timeout: 5.0)
        
        XCTAssertNil(deleteError, "Transaction deletion should not fail")
        XCTAssertTrue(remainingTransactions.isEmpty, "No transactions should remain")
    }
    
    // MARK: - Transaction Sync Tests
    
    func testTransactionSync() throws {
        // Given
        let syncExpectation = XCTestExpectation(description: "Transactions synced")
        
        // Create test transactions
        let transactions = try createTestTransactions()
        var syncError: Error?
        
        // When - Trigger sync
        useCases.syncTransactions()
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        syncError = error
                    }
                    syncExpectation.fulfill()
                },
                receiveValue: { _ in }
            )
            .store(in: &cancellables)
        
        // Then
        wait(for: [syncExpectation], timeout: 10.0)
        
        XCTAssertNil(syncError, "Sync should not fail")
        
        // Verify publisher updates
        let publisherExpectation = XCTestExpectation(description: "Publisher updated")
        var syncedTransactions: [Transaction] = []
        
        useCases.getTransactionsPublisher()
            .sink { transactions in
                syncedTransactions = transactions
                publisherExpectation.fulfill()
            }
            .store(in: &cancellables)
        
        wait(for: [publisherExpectation], timeout: 5.0)
        
        XCTAssertEqual(syncedTransactions.count, transactions.count, "All transactions should be synced")
    }
    
    // MARK: - Spending Analysis Tests
    
    func testSpendingAnalysis() throws {
        // Given
        let setupExpectation = XCTestExpectation(description: "Test data setup")
        let analysisExpectation = XCTestExpectation(description: "Spending analyzed")
        
        // Create test transactions with known amounts
        let startDate = Calendar.current.date(byAdding: .day, value: -30, to: Date())!
        let transactions = try createTestTransactionsWithKnownAmounts(startDate: startDate)
        
        // Wait for test data setup
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            setupExpectation.fulfill()
        }
        wait(for: [setupExpectation], timeout: 5.0)
        
        // When - Analyze spending
        let period = DateInterval(start: startDate, end: Date())
        var analysis: SpendingAnalysis?
        var analysisError: Error?
        
        useCases.analyzeSpending(period)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        analysisError = error
                    }
                    analysisExpectation.fulfill()
                },
                receiveValue: { result in
                    analysis = result
                }
            )
            .store(in: &cancellables)
        
        // Then
        wait(for: [analysisExpectation], timeout: 5.0)
        
        XCTAssertNil(analysisError, "Analysis should not fail")
        XCTAssertNotNil(analysis, "Analysis should not be nil")
        
        // Verify analysis results
        XCTAssertEqual(analysis?.transactionCount, transactions.count, "Transaction count should match")
        XCTAssertEqual(analysis?.totalExpenses, Decimal(250), "Total expenses should match")
        XCTAssertEqual(analysis?.totalIncome, Decimal(500), "Total income should match")
        XCTAssertEqual(analysis?.categorySpending["Food"], Decimal(100), "Food category spending should match")
        XCTAssertEqual(analysis?.categorySpending["Shopping"], Decimal(150), "Shopping category spending should match")
    }
    
    // MARK: - Helper Methods
    
    private func clearTestDatabase() {
        // Implementation would clear the test database
        // This would be specific to your CoreData setup
    }
    
    private func createTestTransactions() throws -> [Transaction] {
        let createExpectation = XCTestExpectation(description: "Test transactions created")
        var transactions: [Transaction] = []
        
        // Create multiple test transactions
        let transaction1 = try Transaction(
            id: UUID(),
            description: "Test Transaction 1",
            amount: Decimal(100),
            date: Date(),
            category: "Food",
            accountId: "test-account",
            isPending: false,
            type: .debit
        )
        
        let transaction2 = try Transaction(
            id: UUID(),
            description: "Test Transaction 2",
            amount: Decimal(200),
            date: Date(),
            category: "Shopping",
            accountId: "test-account",
            isPending: false,
            type: .credit
        )
        
        transactions = [transaction1, transaction2]
        
        // Create transactions in repository
        for transaction in transactions {
            useCases.createTransaction(transaction)
                .sink(
                    receiveCompletion: { _ in },
                    receiveValue: { _ in }
                )
                .store(in: &cancellables)
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            createExpectation.fulfill()
        }
        
        wait(for: [createExpectation], timeout: 5.0)
        return transactions
    }
    
    private func createTestTransactionsWithKnownAmounts(startDate: Date) throws -> [Transaction] {
        let createExpectation = XCTestExpectation(description: "Test transactions created")
        var transactions: [Transaction] = []
        
        // Create transactions with known amounts for testing analysis
        let transaction1 = try Transaction(
            id: UUID(),
            description: "Food Expense",
            amount: Decimal(100),
            date: startDate,
            category: "Food",
            accountId: "test-account",
            isPending: false,
            type: .debit
        )
        
        let transaction2 = try Transaction(
            id: UUID(),
            description: "Shopping Expense",
            amount: Decimal(150),
            date: startDate.addingTimeInterval(86400),
            category: "Shopping",
            accountId: "test-account",
            isPending: false,
            type: .debit
        )
        
        let transaction3 = try Transaction(
            id: UUID(),
            description: "Salary Income",
            amount: Decimal(500),
            date: startDate.addingTimeInterval(172800),
            category: "Income",
            accountId: "test-account",
            isPending: false,
            type: .credit
        )
        
        transactions = [transaction1, transaction2, transaction3]
        
        // Create transactions in repository
        for transaction in transactions {
            useCases.createTransaction(transaction)
                .sink(
                    receiveCompletion: { _ in },
                    receiveValue: { _ in }
                )
                .store(in: &cancellables)
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            createExpectation.fulfill()
        }
        
        wait(for: [createExpectation], timeout: 5.0)
        return transactions
    }
}