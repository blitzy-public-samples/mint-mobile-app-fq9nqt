//
// GoalTests.swift
// MintReplicaLiteTests
//
// Unit test suite for testing goal-related functionality
//

// MARK: - Human Tasks
/*
1. Configure test data persistence cleanup between test runs
2. Set up mock network responses for offline testing
3. Verify proper handling of timezone-specific test cases
4. Set up CI pipeline integration for automated testing
*/

import XCTest // iOS 14.0+
import Combine // iOS 14.0+
@testable import MintReplicaLite

@available(iOS 14.0, *)
final class GoalTests: XCTestCase {
    
    // MARK: - Properties
    
    private var repository: GoalRepository!
    private var useCases: GoalUseCases!
    private var cancellables: Set<AnyCancellable>!
    
    // MARK: - Setup & Teardown
    
    override func setUp() {
        super.setUp()
        repository = GoalRepository()
        useCases = GoalUseCases(repository: repository)
        cancellables = Set<AnyCancellable>()
    }
    
    override func tearDown() {
        cancellables = nil
        useCases = nil
        repository = nil
        super.tearDown()
    }
    
    // MARK: - Test Cases
    
    /// Tests successful goal creation with validation
    /// Addresses requirement: Financial goal setting and progress monitoring
    func testGoalCreation() async throws {
        // Arrange
        let expectation = expectation(description: "Goal creation")
        let testName = "Emergency Fund"
        let testDescription = "Build emergency savings"
        let testAmount: Decimal = 10000
        let testDeadline = Calendar.current.date(byAdding: .month, value: 6, to: Date())!
        
        // Act
        useCases.createGoal(
            name: testName,
            description: testDescription,
            targetAmount: testAmount,
            deadline: testDeadline,
            category: .emergency
        )
        .sink(
            receiveCompletion: { completion in
                if case .failure = completion {
                    XCTFail("Goal creation failed")
                }
            },
            receiveValue: { goal in
                // Assert
                XCTAssertEqual(goal.name, testName)
                XCTAssertEqual(goal.description, testDescription)
                XCTAssertEqual(goal.targetAmount, testAmount)
                XCTAssertEqual(goal.category, .emergency)
                XCTAssertEqual(goal.status, .notStarted)
                XCTAssertEqual(goal.currentAmount, 0)
                expectation.fulfill()
            }
        )
        .store(in: &cancellables)
        
        await waitForExpectations(timeout: 5)
    }
    
    /// Tests goal progress updates with real-time notifications
    /// Addresses requirement: Financial goal setting and progress monitoring
    func testGoalProgressUpdate() async throws {
        // Arrange
        let progressExpectation = expectation(description: "Progress update")
        let notificationExpectation = expectation(description: "Update notification")
        
        let goal = try Goal(
            name: "Test Goal",
            description: "Test Description",
            targetAmount: 1000,
            currentAmount: 0,
            deadline: Date().addingTimeInterval(86400 * 30),
            category: .savings
        )
        
        // Create test goal
        try await repository.create(goal).async()
        
        // Subscribe to updates
        useCases.goalUpdates
            .sink { updatedGoal in
                XCTAssertEqual(updatedGoal.id, goal.id)
                XCTAssertEqual(updatedGoal.currentAmount, Decimal(500))
                XCTAssertEqual(updatedGoal.status, .inProgress)
                notificationExpectation.fulfill()
            }
            .store(in: &cancellables)
        
        // Act
        useCases.updateGoalProgress(goalId: goal.id, amount: 500)
            .sink(
                receiveCompletion: { completion in
                    if case .failure = completion {
                        XCTFail("Progress update failed")
                    }
                },
                receiveValue: { updatedGoal in
                    // Assert
                    XCTAssertEqual(updatedGoal.currentAmount, Decimal(500))
                    XCTAssertEqual(updatedGoal.progressPercentage(), 50)
                    XCTAssertEqual(updatedGoal.status, .inProgress)
                    progressExpectation.fulfill()
                }
            )
            .store(in: &cancellables)
        
        await waitForExpectations(timeout: 5)
    }
    
    /// Tests goal completion logic and status transitions
    /// Addresses requirement: Financial goal setting and progress monitoring
    func testGoalCompletion() async throws {
        // Arrange
        let completionExpectation = expectation(description: "Goal completion")
        let notificationExpectation = expectation(description: "Completion notification")
        
        let goal = try Goal(
            name: "Test Goal",
            description: "Test Description",
            targetAmount: 1000,
            currentAmount: 0,
            deadline: Date().addingTimeInterval(86400 * 30),
            category: .savings
        )
        
        try await repository.create(goal).async()
        
        // Subscribe to completion notification
        useCases.goalUpdates
            .sink { updatedGoal in
                XCTAssertEqual(updatedGoal.id, goal.id)
                XCTAssertEqual(updatedGoal.status, .completed)
                XCTAssertNotNil(updatedGoal.completedAt)
                notificationExpectation.fulfill()
            }
            .store(in: &cancellables)
        
        // Act
        useCases.updateGoalProgress(goalId: goal.id, amount: 1000)
            .sink(
                receiveCompletion: { completion in
                    if case .failure = completion {
                        XCTFail("Goal completion failed")
                    }
                },
                receiveValue: { completedGoal in
                    // Assert
                    XCTAssertEqual(completedGoal.status, .completed)
                    XCTAssertNotNil(completedGoal.completedAt)
                    XCTAssertEqual(completedGoal.progressPercentage(), 100)
                    completionExpectation.fulfill()
                }
            )
            .store(in: &cancellables)
        
        await waitForExpectations(timeout: 5)
    }
    
    /// Tests goal validation rules and error handling
    /// Addresses requirement: Mobile Applications (Native iOS using Swift)
    func testGoalValidation() throws {
        // Test invalid target amount
        XCTAssertThrowsError(try Goal(
            name: "Test Goal",
            description: "Test Description",
            targetAmount: -1000,
            currentAmount: 0,
            deadline: Date().addingTimeInterval(86400),
            category: .savings
        )) { error in
            XCTAssertTrue(error.localizedDescription.contains("Target amount must be greater than zero"))
        }
        
        // Test invalid deadline (past date)
        XCTAssertThrowsError(try Goal(
            name: "Test Goal",
            description: "Test Description",
            targetAmount: 1000,
            currentAmount: 0,
            deadline: Date().addingTimeInterval(-86400),
            category: .savings
        )) { error in
            XCTAssertTrue(error.localizedDescription.contains("Deadline must be in the future"))
        }
        
        // Test invalid progress update
        let goal = try Goal(
            name: "Test Goal",
            description: "Test Description",
            targetAmount: 1000,
            currentAmount: 0,
            deadline: Date().addingTimeInterval(86400),
            category: .savings
        )
        
        XCTAssertThrowsError(try goal.updateProgress(-500)) { error in
            XCTAssertTrue(error.localizedDescription.contains("Progress amount cannot be negative"))
        }
    }
    
    /// Tests offline goal management capabilities
    /// Addresses requirement: Mobile Applications (Native iOS using Swift)
    func testOfflineSupport() async throws {
        // Arrange
        let syncExpectation = expectation(description: "Sync completion")
        
        let goal = try Goal(
            name: "Offline Goal",
            description: "Created while offline",
            targetAmount: 2000,
            currentAmount: 0,
            deadline: Date().addingTimeInterval(86400 * 60),
            category: .savings
        )
        
        // Create goal while "offline"
        try await repository.create(goal).async()
        
        // Update progress while "offline"
        try await repository.update(Goal(
            id: goal.id,
            name: goal.name,
            description: goal.description,
            targetAmount: goal.targetAmount,
            currentAmount: 1000,
            deadline: goal.deadline,
            category: goal.category
        )).async()
        
        // Act - Trigger sync
        useCases.syncGoals()
            .sink(
                receiveCompletion: { completion in
                    if case .failure = completion {
                        XCTFail("Sync failed")
                    }
                },
                receiveValue: {
                    // Assert - Verify changes persisted
                    self.repository.read(goal.id.uuidString)
                        .sink(
                            receiveCompletion: { completion in
                                if case .failure = completion {
                                    XCTFail("Goal retrieval failed")
                                }
                            },
                            receiveValue: { syncedGoal in
                                XCTAssertNotNil(syncedGoal)
                                XCTAssertEqual(syncedGoal?.currentAmount, 1000)
                                XCTAssertEqual(syncedGoal?.status, .inProgress)
                                syncExpectation.fulfill()
                            }
                        )
                        .store(in: &self.cancellables)
                }
            )
            .store(in: &cancellables)
        
        await waitForExpectations(timeout: 5)
    }
}