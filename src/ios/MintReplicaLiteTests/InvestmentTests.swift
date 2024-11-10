//
// InvestmentTests.swift
// MintReplicaLiteTests
//
// Unit test suite for investment-related functionality
//

import XCTest // iOS 15.0+
import CoreData // iOS 15.0+
@testable import MintReplicaLite

// MARK: - Human Tasks
/*
 1. Configure test environment with in-memory Core Data store
 2. Set up mock API responses for price updates
 3. Verify thread safety in concurrent test scenarios
 4. Add performance tests for large portfolios
 5. Test edge cases with invalid market data
*/

@available(iOS 15.0, *)
final class InvestmentTests: XCTestCase {
    
    // MARK: - Properties
    
    private var sut: InvestmentUseCases!
    private var mockRepository: InvestmentRepository!
    private var mockContext: NSManagedObjectContext!
    
    // Test data fixtures
    private let testInvestmentData: [String: Any] = [
        "id": "test-inv-1",
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "quantity": 10.0,
        "costBasis": 150.0,
        "currentPrice": 175.0,
        "accountId": "test-acc-1",
        "type": InvestmentType.stock
    ]
    
    // MARK: - Setup & Teardown
    
    override func setUp() async throws {
        try await super.setUp()
        
        // Set up in-memory Core Data context
        let container = NSPersistentContainer(name: "MintReplicaLite")
        let description = NSPersistentStoreDescription()
        description.type = NSInMemoryStoreType
        container.persistentStoreDescriptions = [description]
        
        await container.loadPersistentStores { _, error in
            XCTAssertNil(error, "Failed to load test store: \(String(describing: error))")
        }
        
        mockContext = container.viewContext
        mockContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        
        // Initialize mock repository and use cases
        let mockAPIClient = MockAPIClient()
        mockRepository = InvestmentRepository(context: mockContext, apiClient: mockAPIClient)
        sut = InvestmentUseCases(repository: mockRepository)
    }
    
    override func tearDown() async throws {
        // Reset test data
        let fetchRequest: NSFetchRequest<NSFetchRequestResult> = NSFetchRequest(entityName: "InvestmentEntity")
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)
        try mockContext.execute(deleteRequest)
        try mockContext.save()
        
        sut = nil
        mockRepository = nil
        mockContext = nil
        
        try await super.tearDown()
    }
    
    // MARK: - Investment Creation Tests
    
    /// Tests creating a new investment with validation
    /// Addresses requirement: Investment Portfolio Tracking
    func testInvestmentCreation() async throws {
        // Create test investment
        let investment = Investment(
            id: testInvestmentData["id"] as! String,
            symbol: testInvestmentData["symbol"] as! String,
            name: testInvestmentData["name"] as! String,
            quantity: testInvestmentData["quantity"] as! Double,
            costBasis: testInvestmentData["costBasis"] as! Double,
            currentPrice: testInvestmentData["currentPrice"] as! Double,
            accountId: testInvestmentData["accountId"] as! String,
            type: testInvestmentData["type"] as! InvestmentType
        )
        
        // Add investment
        let result = try await sut.addInvestment(investment)
        
        // Verify success
        switch result {
        case .success(let created):
            XCTAssertEqual(created.id, investment.id)
            XCTAssertEqual(created.symbol, "AAPL")
            XCTAssertEqual(created.quantity, 10.0)
            XCTAssertEqual(created.costBasis, 150.0)
            XCTAssertEqual(created.currentPrice, 175.0)
            XCTAssertEqual(created.type, .stock)
            
            // Verify repository state
            let storedResult = try await mockRepository.read(id: created.id)
            XCTAssertNotNil(try storedResult.get())
            
            // Verify subject update
            XCTAssertEqual(mockRepository.investmentsSubject.value.count, 1)
            XCTAssertEqual(mockRepository.investmentsSubject.value.first?.id, created.id)
            
        case .failure(let error):
            XCTFail("Investment creation failed: \(error)")
        }
    }
    
    // MARK: - Investment Retrieval Tests
    
    /// Tests retrieving an existing investment
    /// Addresses requirement: Investment Portfolio Tracking
    func testInvestmentRetrieval() async throws {
        // Create test investment first
        let investment = Investment(
            id: testInvestmentData["id"] as! String,
            symbol: testInvestmentData["symbol"] as! String,
            name: testInvestmentData["name"] as! String,
            quantity: testInvestmentData["quantity"] as! Double,
            costBasis: testInvestmentData["costBasis"] as! Double,
            currentPrice: testInvestmentData["currentPrice"] as! Double,
            accountId: testInvestmentData["accountId"] as! String,
            type: testInvestmentData["type"] as! InvestmentType
        )
        
        _ = try await sut.addInvestment(investment)
        
        // Retrieve investment
        let result = try await sut.getInvestment(investment.id)
        
        switch result {
        case .success(let retrieved):
            XCTAssertNotNil(retrieved)
            XCTAssertEqual(retrieved?.id, investment.id)
            XCTAssertEqual(retrieved?.symbol, investment.symbol)
            XCTAssertEqual(retrieved?.quantity, investment.quantity)
            
        case .failure(let error):
            XCTFail("Investment retrieval failed: \(error)")
        }
        
        // Test non-existent investment
        let nonExistentResult = try await sut.getInvestment("non-existent")
        if case .success(let investment) = nonExistentResult {
            XCTAssertNil(investment, "Non-existent investment should return nil")
        }
    }
    
    // MARK: - Portfolio Calculation Tests
    
    /// Tests portfolio value and return calculations
    /// Addresses requirement: Investment Portfolio Tracking
    func testPortfolioCalculations() async throws {
        // Create multiple test investments
        let investment1 = Investment(
            id: "test-inv-1",
            symbol: "AAPL",
            name: "Apple Inc.",
            quantity: 10.0,
            costBasis: 150.0,
            currentPrice: 175.0,
            accountId: "test-acc-1",
            type: .stock
        )
        
        let investment2 = Investment(
            id: "test-inv-2",
            symbol: "GOOGL",
            name: "Alphabet Inc.",
            quantity: 5.0,
            costBasis: 2800.0,
            currentPrice: 3000.0,
            accountId: "test-acc-1",
            type: .stock
        )
        
        // Add investments
        _ = try await sut.addInvestment(investment1)
        _ = try await sut.addInvestment(investment2)
        
        // Test portfolio value calculation
        let valueResult = try await sut.getPortfolioValue()
        
        switch valueResult {
        case .success(let totalValue):
            // Expected: (10 * 175) + (5 * 3000) = 1750 + 15000 = 16750
            XCTAssertEqual(totalValue, 16750.0, accuracy: 0.01)
            
        case .failure(let error):
            XCTFail("Portfolio value calculation failed: \(error)")
        }
        
        // Test portfolio return calculations
        let returnResult = try await sut.getPortfolioReturn()
        
        switch returnResult {
        case .success(let returns):
            // Total cost: (10 * 150) + (5 * 2800) = 1500 + 14000 = 15500
            // Total value: 16750
            // Return amount: 16750 - 15500 = 1250
            // Return percentage: (1250 / 15500) * 100 = 8.06%
            XCTAssertEqual(returns.amount, 1250.0, accuracy: 0.01)
            XCTAssertEqual(returns.percentage, 8.06, accuracy: 0.01)
            
        case .failure(let error):
            XCTFail("Portfolio return calculation failed: \(error)")
        }
    }
    
    // MARK: - Investment Update Tests
    
    /// Tests updating investment data and recalculations
    /// Addresses requirement: Investment Portfolio Tracking
    func testInvestmentUpdates() async throws {
        // Create initial investment
        let investment = Investment(
            id: testInvestmentData["id"] as! String,
            symbol: testInvestmentData["symbol"] as! String,
            name: testInvestmentData["name"] as! String,
            quantity: testInvestmentData["quantity"] as! Double,
            costBasis: testInvestmentData["costBasis"] as! Double,
            currentPrice: testInvestmentData["currentPrice"] as! Double,
            accountId: testInvestmentData["accountId"] as! String,
            type: testInvestmentData["type"] as! InvestmentType
        )
        
        _ = try await sut.addInvestment(investment)
        
        // Update investment
        var updatedInvestment = investment
        updatedInvestment.quantity = 15.0
        updatedInvestment.currentPrice = 180.0
        
        let result = try await sut.updateInvestment(updatedInvestment)
        
        switch result {
        case .success(let updated):
            // Verify updated values
            XCTAssertEqual(updated.quantity, 15.0)
            XCTAssertEqual(updated.currentPrice, 180.0)
            
            // Verify calculations
            XCTAssertEqual(updated.currentValue(), 2700.0) // 15 * 180
            XCTAssertEqual(updated.totalReturn(), 450.0) // 2700 - (15 * 150)
            XCTAssertEqual(updated.returnPercentage(), 20.0, accuracy: 0.01)
            
            // Verify repository state
            let storedResult = try await mockRepository.read(id: updated.id)
            XCTAssertEqual(try storedResult.get()?.quantity, 15.0)
            
            // Verify subject update
            XCTAssertEqual(mockRepository.investmentsSubject.value.first?.quantity, 15.0)
            
        case .failure(let error):
            XCTFail("Investment update failed: \(error)")
        }
    }
}

// MARK: - Mock API Client

private class MockAPIClient: APIClient {
    func request<T>(_ request: APIRequest<T>) async throws -> APIResponse<T> {
        // Mock implementation for testing
        throw APIError.notImplemented
    }
}