//
// AccountTests.swift
// MintReplicaLiteTests
//
// Unit test suite for Account-related functionality

// MARK: - Human Tasks
/*
1. Configure test environment variables for API endpoints
2. Set up test database with proper schema migrations
3. Configure mock server for API response simulation
4. Verify proper cleanup of test data between runs
*/

import XCTest    // iOS 14.0+
import CoreData  // iOS 14.0+
import Combine   // iOS 14.0+
@testable import MintReplicaLite

/// Comprehensive test suite for Account functionality
/// Addresses requirements:
/// - Financial institution integration and account aggregation (1.2 Scope/Core Features)
/// - Local SQLite database for offline data (5.2.1 Mobile Applications)
/// - Real-time data synchronization (1.1 System Overview)
final class AccountTests: XCTestCase {
    
    // MARK: - Properties
    
    private var sut: AccountRepository!
    private var testContext: NSManagedObjectContext!
    private var cancellables: Set<AnyCancellable>!
    
    // MARK: - Test Lifecycle
    
    override func setUp() {
        super.setUp()
        
        // Initialize test Core Data context
        let coreDataManager = CoreDataManager.shared
        testContext = coreDataManager.newBackgroundContext()
        
        // Initialize repository with test dependencies
        sut = AccountRepository(
            apiClient: .shared,
            coreDataManager: coreDataManager
        )
        
        cancellables = Set<AnyCancellable>()
    }
    
    override func tearDown() {
        // Clean up test data
        let fetchRequest: NSFetchRequest<NSFetchRequestResult> = AccountEntity.fetchRequest()
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)
        
        try? testContext.execute(deleteRequest)
        try? testContext.save()
        
        cancellables = nil
        sut = nil
        testContext = nil
        
        super.tearDown()
    }
    
    // MARK: - Test Cases
    
    func testAccountCreation() {
        // Given
        let expectation = XCTestExpectation(description: "Create account")
        let testAccount = Account(
            id: UUID().uuidString,
            institutionId: "test_bank_123",
            name: "Test Checking",
            institutionName: "Test Bank",
            type: .checking,
            balance: 1000.50,
            currency: "USD",
            lastSynced: Date(),
            isActive: true
        )
        
        var createdAccount: Account?
        var error: RepositoryError?
        
        // When
        sut.create(testAccount)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let err) = completion {
                        error = err
                    }
                    expectation.fulfill()
                },
                receiveValue: { account in
                    createdAccount = account
                }
            )
            .store(in: &cancellables)
        
        // Then
        wait(for: [expectation], timeout: 5.0)
        
        XCTAssertNil(error, "Account creation should not fail")
        XCTAssertNotNil(createdAccount, "Created account should not be nil")
        XCTAssertEqual(createdAccount?.id, testAccount.id)
        XCTAssertEqual(createdAccount?.name, testAccount.name)
        XCTAssertEqual(createdAccount?.type, testAccount.type)
        XCTAssertEqual(createdAccount?.balance, testAccount.balance)
        XCTAssertEqual(createdAccount?.currency, testAccount.currency)
    }
    
    func testAccountRetrieval() {
        // Given
        let expectation = XCTestExpectation(description: "Retrieve account")
        let testAccount = Account(
            id: UUID().uuidString,
            institutionId: "test_bank_123",
            name: "Test Savings",
            type: .savings,
            balance: 5000.00,
            currency: "USD",
            lastSynced: Date(),
            isActive: true
        )
        
        var retrievedAccount: Account?
        var error: RepositoryError?
        
        // Create test account first
        sut.create(testAccount)
            .flatMap { _ in
                // When
                self.sut.read(testAccount.id)
            }
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let err) = completion {
                        error = err
                    }
                    expectation.fulfill()
                },
                receiveValue: { account in
                    retrievedAccount = account
                }
            )
            .store(in: &cancellables)
        
        // Then
        wait(for: [expectation], timeout: 5.0)
        
        XCTAssertNil(error, "Account retrieval should not fail")
        XCTAssertNotNil(retrievedAccount, "Retrieved account should not be nil")
        XCTAssertEqual(retrievedAccount?.id, testAccount.id)
        XCTAssertEqual(retrievedAccount?.name, testAccount.name)
        XCTAssertEqual(retrievedAccount?.balance, testAccount.balance)
    }
    
    func testAccountUpdate() {
        // Given
        let expectation = XCTestExpectation(description: "Update account")
        let testAccount = Account(
            id: UUID().uuidString,
            institutionId: "test_bank_123",
            name: "Original Name",
            type: .checking,
            balance: 1000.00,
            currency: "USD",
            lastSynced: Date(),
            isActive: true
        )
        
        let updatedBalance: Decimal = 2000.00
        var updatedAccount: Account?
        var error: RepositoryError?
        
        // Create test account first
        sut.create(testAccount)
            .flatMap { _ in
                // When
                let modifiedAccount = Account(
                    id: testAccount.id,
                    institutionId: testAccount.institutionId,
                    name: testAccount.name,
                    type: testAccount.type,
                    balance: updatedBalance,
                    currency: testAccount.currency,
                    lastSynced: Date(),
                    isActive: testAccount.isActive
                )
                return self.sut.update(modifiedAccount)
            }
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let err) = completion {
                        error = err
                    }
                    expectation.fulfill()
                },
                receiveValue: { account in
                    updatedAccount = account
                }
            )
            .store(in: &cancellables)
        
        // Then
        wait(for: [expectation], timeout: 5.0)
        
        XCTAssertNil(error, "Account update should not fail")
        XCTAssertNotNil(updatedAccount, "Updated account should not be nil")
        XCTAssertEqual(updatedAccount?.id, testAccount.id)
        XCTAssertEqual(updatedAccount?.balance, updatedBalance)
    }
    
    func testAccountDeletion() {
        // Given
        let expectation = XCTestExpectation(description: "Delete account")
        let testAccount = Account(
            id: UUID().uuidString,
            institutionId: "test_bank_123",
            name: "Account to Delete",
            type: .checking,
            balance: 1000.00,
            currency: "USD",
            lastSynced: Date(),
            isActive: true
        )
        
        var deletionError: RepositoryError?
        var retrievedAccount: Account?
        
        // Create test account first
        sut.create(testAccount)
            .flatMap { _ in
                // When
                self.sut.delete(testAccount.id)
            }
            .flatMap { _ in
                // Try to retrieve deleted account
                self.sut.read(testAccount.id)
            }
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let err) = completion {
                        deletionError = err
                    }
                    expectation.fulfill()
                },
                receiveValue: { account in
                    retrievedAccount = account
                }
            )
            .store(in: &cancellables)
        
        // Then
        wait(for: [expectation], timeout: 5.0)
        
        XCTAssertNil(deletionError, "Account deletion should not fail")
        XCTAssertNil(retrievedAccount, "Deleted account should not be retrievable")
    }
    
    func testAccountSync() {
        // Given
        let expectation = XCTestExpectation(description: "Sync accounts")
        let testAccount1 = Account(
            id: UUID().uuidString,
            institutionId: "test_bank_123",
            name: "Local Account 1",
            type: .checking,
            balance: 1000.00,
            currency: "USD",
            lastSynced: Date(),
            isActive: true
        )
        
        let testAccount2 = Account(
            id: UUID().uuidString,
            institutionId: "test_bank_123",
            name: "Local Account 2",
            type: .savings,
            balance: 2000.00,
            currency: "USD",
            lastSynced: Date(),
            isActive: true
        )
        
        var syncError: RepositoryError?
        var syncedAccounts: [Account] = []
        
        // Create test accounts first
        Publishers.Zip(
            sut.create(testAccount1),
            sut.create(testAccount2)
        )
        .flatMap { _, _ in
            // When
            self.sut.sync()
        }
        .flatMap { _ in
            // Retrieve all accounts after sync
            self.sut.list()
        }
        .sink(
            receiveCompletion: { completion in
                if case .failure(let err) = completion {
                    syncError = err
                }
                expectation.fulfill()
            },
            receiveValue: { accounts in
                syncedAccounts = accounts
            }
        )
        .store(in: &cancellables)
        
        // Then
        wait(for: [expectation], timeout: 5.0)
        
        XCTAssertNil(syncError, "Account sync should not fail")
        XCTAssertFalse(syncedAccounts.isEmpty, "Synced accounts should not be empty")
        XCTAssertEqual(syncedAccounts.count, 2, "Should have two accounts after sync")
        
        // Verify account properties after sync
        let syncedAccount1 = syncedAccounts.first { $0.id == testAccount1.id }
        let syncedAccount2 = syncedAccounts.first { $0.id == testAccount2.id }
        
        XCTAssertNotNil(syncedAccount1, "First account should exist after sync")
        XCTAssertNotNil(syncedAccount2, "Second account should exist after sync")
        XCTAssertEqual(syncedAccount1?.balance, testAccount1.balance)
        XCTAssertEqual(syncedAccount2?.balance, testAccount2.balance)
    }
    
    func testFormattedBalance() {
        // Given
        let account = Account(
            id: UUID().uuidString,
            institutionId: "test_bank_123",
            name: "Test Account",
            type: .checking,
            balance: 1234.56,
            currency: "USD",
            lastSynced: Date(),
            isActive: true
        )
        
        // When
        let formattedBalance = account.formattedBalance()
        
        // Then
        XCTAssertTrue(formattedBalance.contains("1,234.56"), "Balance should be properly formatted")
        XCTAssertTrue(formattedBalance.contains("$"), "Balance should include currency symbol")
    }
}