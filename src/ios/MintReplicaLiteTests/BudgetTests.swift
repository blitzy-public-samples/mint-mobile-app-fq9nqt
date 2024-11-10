//
// BudgetTests.swift
// MintReplicaLiteTests
//
// Unit test suite for budget-related functionality
//

import XCTest    // iOS 14.0+
import Combine   // iOS 14.0+
@testable import MintReplicaLite

// MARK: - Human Tasks
/*
 1. Configure test environment with in-memory Core Data store
 2. Set up mock notification manager for testing alerts
 3. Verify test coverage meets minimum threshold
 4. Add performance tests for large budget datasets
*/

final class BudgetTests: XCTestCase {
    
    // MARK: - Properties
    
    private var repository: BudgetRepository!
    private var useCases: BudgetUseCases!
    private var cancellables: Set<AnyCancellable>!
    private let testTimeout: TimeInterval = 5.0
    
    // MARK: - Setup & Teardown
    
    override func setUp() {
        super.setUp()
        
        // Initialize test dependencies with in-memory store
        let coreDataManager = CoreDataManager(storeType: .inMemory)
        repository = BudgetRepository(coreDataManager: coreDataManager)
        useCases = BudgetUseCases(repository: repository)
        cancellables = Set<AnyCancellable>()
    }
    
    override func tearDown() {
        // Cancel any pending publishers
        cancellables.forEach { $0.cancel() }
        cancellables = nil
        
        // Clean up test data
        repository = nil
        useCases = nil
        
        super.tearDown()
    }
    
    // MARK: - Test Cases
    
    /// Tests successful budget creation with valid data
    /// Requirements addressed:
    /// - Budget creation and monitoring (1.2 Scope/Core Features)
    func testCreateBudget() throws {
        // Given
        let expectation = expectation(description: "Create budget")
        let testBudget = Budget(
            id: UUID().uuidString,
            name: "Test Budget",
            categoryId: "groceries",
            limit: Decimal(100),
            spent: Decimal(0),
            startDate: Date(),
            endDate: Calendar.current.date(byAddingMonth: 1, to: Date())!,
            isRecurring: true
        )
        
        var createdBudget: Budget?
        var error: Error?
        
        // When
        useCases.createBudget(testBudget)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let err) = completion {
                        error = err
                    }
                    expectation.fulfill()
                },
                receiveValue: { budget in
                    createdBudget = budget
                }
            )
            .store(in: &cancellables)
        
        // Then
        wait(for: [expectation], timeout: testTimeout)
        XCTAssertNil(error, "Budget creation should not fail")
        XCTAssertNotNil(createdBudget, "Created budget should not be nil")
        XCTAssertEqual(createdBudget?.id, testBudget.id)
        XCTAssertEqual(createdBudget?.name, testBudget.name)
        XCTAssertEqual(createdBudget?.limit, testBudget.limit)
        XCTAssertEqual(createdBudget?.spent, Decimal(0))
        XCTAssertEqual(createdBudget?.isRecurring, true)
    }
    
    /// Tests budget property updates
    /// Requirements addressed:
    /// - Budget creation and monitoring (1.2 Scope/Core Features)
    func testUpdateBudget() throws {
        // Given
        let createExpectation = expectation(description: "Create budget")
        let updateExpectation = expectation(description: "Update budget")
        
        let initialBudget = Budget(
            id: UUID().uuidString,
            name: "Initial Budget",
            categoryId: "dining",
            limit: Decimal(200),
            spent: Decimal(0),
            startDate: Date(),
            endDate: Calendar.current.date(byAddingMonth: 1, to: Date())!,
            isRecurring: false
        )
        
        var updatedBudget: Budget?
        var error: Error?
        
        // Create initial budget
        useCases.createBudget(initialBudget)
            .flatMap { budget -> AnyPublisher<Budget, Error> in
                // When - Update budget with new values
                let modifiedBudget = budget.copy(updates: [
                    "name": "Updated Budget",
                    "limit": Decimal(300),
                    "spent": Decimal(50)
                ])
                return self.useCases.updateBudget(modifiedBudget)
            }
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let err) = completion {
                        error = err
                    }
                    updateExpectation.fulfill()
                },
                receiveValue: { budget in
                    updatedBudget = budget
                }
            )
            .store(in: &cancellables)
        
        // Then
        wait(for: [updateExpectation], timeout: testTimeout)
        XCTAssertNil(error, "Budget update should not fail")
        XCTAssertNotNil(updatedBudget, "Updated budget should not be nil")
        XCTAssertEqual(updatedBudget?.name, "Updated Budget")
        XCTAssertEqual(updatedBudget?.limit, Decimal(300))
        XCTAssertEqual(updatedBudget?.spent, Decimal(50))
        XCTAssertEqual(updatedBudget?.id, initialBudget.id)
        XCTAssertEqual(updatedBudget?.categoryId, initialBudget.categoryId)
    }
    
    /// Tests budget deletion and cleanup
    /// Requirements addressed:
    /// - Budget creation and monitoring (1.2 Scope/Core Features)
    func testDeleteBudget() throws {
        // Given
        let createExpectation = expectation(description: "Create budget")
        let deleteExpectation = expectation(description: "Delete budget")
        let verifyExpectation = expectation(description: "Verify deletion")
        
        let testBudget = Budget(
            id: UUID().uuidString,
            name: "Budget to Delete",
            categoryId: "entertainment",
            limit: Decimal(150),
            spent: Decimal(0),
            startDate: Date(),
            endDate: Calendar.current.date(byAddingMonth: 1, to: Date())!,
            isRecurring: false
        )
        
        var error: Error?
        
        // Create and then delete budget
        useCases.createBudget(testBudget)
            .flatMap { _ in
                // When - Delete the budget
                return self.useCases.deleteBudget(budgetId: testBudget.id)
            }
            .flatMap { _ in
                // Then - Verify budget was deleted
                return self.useCases.getBudgetDetails(budgetId: testBudget.id)
            }
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let err) = completion {
                        error = err
                    }
                    verifyExpectation.fulfill()
                },
                receiveValue: { budget in
                    XCTAssertNil(budget, "Deleted budget should not exist")
                }
            )
            .store(in: &cancellables)
        
        wait(for: [verifyExpectation], timeout: testTimeout)
        XCTAssertNil(error, "Budget deletion should not fail")
    }
    
    /// Tests budget overspend detection and alerts
    /// Requirements addressed:
    /// - Real-time notifications and alerts (1.2 Scope/Core Features)
    func testBudgetOverspendAlert() throws {
        // Given
        let expectation = expectation(description: "Check budget status")
        let testBudget = Budget(
            id: UUID().uuidString,
            name: "Alert Test Budget",
            categoryId: "shopping",
            limit: Decimal(100),
            spent: Decimal(120), // Overspent
            startDate: Date(),
            endDate: Calendar.current.date(byAddingMonth: 1, to: Date())!,
            isRecurring: true
        )
        
        var resultStatus: BudgetStatus?
        var error: Error?
        
        // When
        useCases.createBudget(testBudget)
            .flatMap { budget in
                return self.useCases.checkBudgetStatus(budget)
            }
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let err) = completion {
                        error = err
                    }
                    expectation.fulfill()
                },
                receiveValue: { status in
                    resultStatus = status
                }
            )
            .store(in: &cancellables)
        
        // Then
        wait(for: [expectation], timeout: testTimeout)
        XCTAssertNil(error, "Budget status check should not fail")
        XCTAssertEqual(resultStatus, .overBudget)
        XCTAssertTrue(testBudget.isOverBudget())
        XCTAssertEqual(testBudget.spentPercentage(), 120.0)
    }
    
    /// Tests budget approaching threshold alerts
    /// Requirements addressed:
    /// - Real-time notifications and alerts (1.2 Scope/Core Features)
    func testBudgetApproachingAlert() throws {
        // Given
        let expectation = expectation(description: "Check approaching status")
        let testBudget = Budget(
            id: UUID().uuidString,
            name: "Approaching Budget",
            categoryId: "utilities",
            limit: Decimal(100),
            spent: Decimal(85), // 85% spent
            startDate: Date(),
            endDate: Calendar.current.date(byAddingMonth: 1, to: Date())!,
            isRecurring: true
        )
        
        var resultStatus: BudgetStatus?
        var error: Error?
        
        // When
        useCases.createBudget(testBudget)
            .flatMap { budget in
                return self.useCases.checkBudgetStatus(budget)
            }
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let err) = completion {
                        error = err
                    }
                    expectation.fulfill()
                },
                receiveValue: { status in
                    resultStatus = status
                }
            )
            .store(in: &cancellables)
        
        // Then
        wait(for: [expectation], timeout: testTimeout)
        XCTAssertNil(error, "Budget status check should not fail")
        XCTAssertEqual(resultStatus, .approaching)
        XCTAssertFalse(testBudget.isOverBudget())
        XCTAssertEqual(testBudget.spentPercentage(), 85.0)
    }
    
    /// Tests listing budgets with filters
    /// Requirements addressed:
    /// - Budget creation and monitoring (1.2 Scope/Core Features)
    func testListBudgetsWithFilters() throws {
        // Given
        let expectation = expectation(description: "List filtered budgets")
        let budgets = [
            Budget(
                id: UUID().uuidString,
                name: "Over Budget",
                categoryId: "dining",
                limit: Decimal(100),
                spent: Decimal(150),
                startDate: Date(),
                endDate: Calendar.current.date(byAddingMonth: 1, to: Date())!,
                isRecurring: true
            ),
            Budget(
                id: UUID().uuidString,
                name: "Under Budget",
                categoryId: "groceries",
                limit: Decimal(200),
                spent: Decimal(50),
                startDate: Date(),
                endDate: Calendar.current.date(byAddingMonth: 1, to: Date())!,
                isRecurring: true
            )
        ]
        
        var filteredBudgets: [Budget] = []
        var error: Error?
        
        // Create test budgets and apply filter
        Publishers.Sequence(sequence: budgets.map { useCases.createBudget($0) })
            .flatMap { $0 }
            .collect()
            .flatMap { _ in
                // When - List budgets with over budget filter
                return self.useCases.listBudgets(criteria: ["isOverBudget": true])
            }
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let err) = completion {
                        error = err
                    }
                    expectation.fulfill()
                },
                receiveValue: { budgets in
                    filteredBudgets = budgets
                }
            )
            .store(in: &cancellables)
        
        // Then
        wait(for: [expectation], timeout: testTimeout)
        XCTAssertNil(error, "Budget listing should not fail")
        XCTAssertEqual(filteredBudgets.count, 1)
        XCTAssertEqual(filteredBudgets.first?.name, "Over Budget")
        XCTAssertTrue(filteredBudgets.first?.isOverBudget() ?? false)
    }
}