// iOS 15.0+ Required
import XCTest
@testable import MintReplicaLite

/* Human Tasks:
1. Configure test environment variables in scheme settings
2. Set up test keychain access group in entitlements
3. Configure test data reset scripts
4. Verify accessibility inspector is enabled
5. Set up test device with both Face ID and Touch ID capabilities
6. Configure test user accounts with proper permissions
*/

/// UI test suite for validating core application functionality and accessibility compliance
/// Requirements addressed:
/// - Mobile Applications Testing (Technical Implementation/5.2.1 Mobile Applications)
/// - User Interface Testing (8.1 User Interface Design)
/// - Authentication Testing (9.1.1 Authentication Methods)
final class MintReplicaLiteUITests: XCTestCase {
    
    // MARK: - Properties
    private var app: XCUIApplication!
    private var isKeyboardVisible: Bool = false
    
    // MARK: - Test Lifecycle
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        
        // Configure test environment
        app.launchArguments = ["UI_TESTING"]
        app.launchEnvironment = [
            "IS_UI_TESTING": "true",
            "USE_MOCK_SERVICES": "true",
            "RESET_APP_STATE": "true"
        ]
        
        // Reset app state
        UserDefaults.standard.removePersistentDomain(forName: Bundle.main.bundleIdentifier!)
        
        // Clear keychain data
        let secItemClasses = [
            kSecClassGenericPassword,
            kSecClassInternetPassword,
            kSecClassCertificate,
            kSecClassKey,
            kSecClassIdentity
        ]
        secItemClasses.forEach { itemClass in
            SecItemDelete([
                itemClass as String: kSecMatchLimitAll
            ] as CFDictionary)
        }
        
        // Launch app
        app.launch()
        
        // Enable accessibility testing
        app.activate()
    }
    
    override func tearDownWithError() throws {
        // Clean up test artifacts
        app.terminate()
        app = nil
        
        // Reset test environment
        UserDefaults.standard.removePersistentDomain(forName: Bundle.main.bundleIdentifier!)
        
        // Clear test data
        try super.tearDownWithError()
    }
    
    // MARK: - Test Cases
    @MainActor
    func testLoginFlow() throws {
        // Test email field
        let emailTextField = app.textFields["Email Address"]
        XCTAssertTrue(emailTextField.exists)
        XCTAssertTrue(emailTextField.isEnabled)
        emailTextField.tap()
        emailTextField.typeText("test@example.com")
        
        // Test password field
        let passwordSecureTextField = app.secureTextFields["Password"]
        XCTAssertTrue(passwordSecureTextField.exists)
        XCTAssertTrue(passwordSecureTextField.isEnabled)
        passwordSecureTextField.tap()
        passwordSecureTextField.typeText("Password123!")
        
        // Verify input validation
        let loginButton = app.buttons["Log In"]
        XCTAssertTrue(loginButton.exists)
        XCTAssertTrue(loginButton.isEnabled)
        
        // Test login action
        loginButton.tap()
        
        // Verify loading state
        let loadingIndicator = app.activityIndicators.firstMatch
        XCTAssertTrue(loadingIndicator.exists)
        
        // Verify successful login
        let dashboardTab = app.tabBars.buttons["Dashboard"]
        let exists = NSPredicate(format: "exists == true")
        expectation(for: exists, evaluatedWith: dashboardTab, handler: nil)
        waitForExpectations(timeout: 5, handler: nil)
        
        // Verify accessibility
        XCTAssertTrue(emailTextField.isAccessibilityElement)
        XCTAssertTrue(passwordSecureTextField.isAccessibilityElement)
        XCTAssertTrue(loginButton.isAccessibilityElement)
    }
    
    @MainActor
    func testBiometricLogin() throws {
        // Enable biometric authentication
        let biometricButton = app.buttons["Sign in with Face ID"]
            ?? app.buttons["Sign in with Touch ID"]
        
        guard biometricButton.exists else {
            XCTFail("Biometric authentication not available")
            return
        }
        
        // Verify biometric button
        XCTAssertTrue(biometricButton.isEnabled)
        
        // Test biometric authentication
        biometricButton.tap()
        
        // Handle biometric prompt
        let biometricPrompt = app.alerts.firstMatch
        XCTAssertTrue(biometricPrompt.exists)
        biometricPrompt.buttons["Allow"].tap()
        
        // Verify successful login
        let dashboardTab = app.tabBars.buttons["Dashboard"]
        let exists = NSPredicate(format: "exists == true")
        expectation(for: exists, evaluatedWith: dashboardTab, handler: nil)
        waitForExpectations(timeout: 5, handler: nil)
        
        // Test accessibility
        XCTAssertTrue(biometricButton.isAccessibilityElement)
        XCTAssertNotNil(biometricButton.accessibilityLabel)
        XCTAssertNotNil(biometricButton.accessibilityHint)
    }
    
    @MainActor
    func testAccountsNavigation() throws {
        // Login first
        try testLoginFlow()
        
        // Navigate to accounts tab
        let accountsTab = app.tabBars.buttons["Accounts"]
        XCTAssertTrue(accountsTab.exists)
        accountsTab.tap()
        
        // Verify accounts list
        let accountsList = app.collectionViews["AccountsList"]
        XCTAssertTrue(accountsList.exists)
        
        // Select account
        let firstAccount = accountsList.cells.firstMatch
        XCTAssertTrue(firstAccount.exists)
        firstAccount.tap()
        
        // Verify account details
        let accountDetailsTitle = app.navigationBars["Account Details"]
        XCTAssertTrue(accountDetailsTitle.exists)
        
        // Test back navigation
        let backButton = app.navigationBars.buttons.firstMatch
        XCTAssertTrue(backButton.exists)
        backButton.tap()
        
        // Verify back on accounts list
        XCTAssertTrue(accountsList.exists)
        
        // Test accessibility
        XCTAssertTrue(accountsTab.isAccessibilityElement)
        XCTAssertTrue(firstAccount.isAccessibilityElement)
        XCTAssertTrue(backButton.isAccessibilityElement)
    }
    
    @MainActor
    func testBudgetCreation() throws {
        // Login first
        try testLoginFlow()
        
        // Navigate to budgets tab
        let budgetsTab = app.tabBars.buttons["Budgets"]
        XCTAssertTrue(budgetsTab.exists)
        budgetsTab.tap()
        
        // Tap create budget button
        let createBudgetButton = app.buttons["Create Budget"]
        XCTAssertTrue(createBudgetButton.exists)
        createBudgetButton.tap()
        
        // Enter budget details
        let nameField = app.textFields["Budget Name"]
        XCTAssertTrue(nameField.exists)
        nameField.tap()
        nameField.typeText("Groceries Budget")
        
        let amountField = app.textFields["Amount"]
        XCTAssertTrue(amountField.exists)
        amountField.tap()
        amountField.typeText("500")
        
        // Select category
        let categoryPicker = app.pickers["Category"]
        XCTAssertTrue(categoryPicker.exists)
        categoryPicker.tap()
        app.pickerWheels.firstMatch.adjust(toPickerWheelValue: "Groceries")
        
        // Save budget
        let saveButton = app.buttons["Save Budget"]
        XCTAssertTrue(saveButton.exists)
        saveButton.tap()
        
        // Verify budget appears in list
        let budgetsList = app.collectionViews["BudgetsList"]
        let newBudget = budgetsList.cells["Groceries Budget"]
        XCTAssertTrue(newBudget.exists)
        
        // Test accessibility
        XCTAssertTrue(nameField.isAccessibilityElement)
        XCTAssertTrue(amountField.isAccessibilityElement)
        XCTAssertTrue(categoryPicker.isAccessibilityElement)
        XCTAssertTrue(saveButton.isAccessibilityElement)
    }
    
    @MainActor
    func testGoalTracking() throws {
        // Login first
        try testLoginFlow()
        
        // Navigate to goals tab
        let goalsTab = app.tabBars.buttons["Goals"]
        XCTAssertTrue(goalsTab.exists)
        goalsTab.tap()
        
        // Create new goal
        let createGoalButton = app.buttons["Create Goal"]
        XCTAssertTrue(createGoalButton.exists)
        createGoalButton.tap()
        
        // Enter goal details
        let nameField = app.textFields["Goal Name"]
        XCTAssertTrue(nameField.exists)
        nameField.tap()
        nameField.typeText("Emergency Fund")
        
        let targetField = app.textFields["Target Amount"]
        XCTAssertTrue(targetField.exists)
        targetField.tap()
        targetField.typeText("10000")
        
        let dateField = app.textFields["Target Date"]
        XCTAssertTrue(dateField.exists)
        dateField.tap()
        
        let datePicker = app.datePickers.firstMatch
        XCTAssertTrue(datePicker.exists)
        datePicker.tap()
        
        // Save goal
        let saveButton = app.buttons["Save Goal"]
        XCTAssertTrue(saveButton.exists)
        saveButton.tap()
        
        // Verify goal in list
        let goalsList = app.collectionViews["GoalsList"]
        let newGoal = goalsList.cells["Emergency Fund"]
        XCTAssertTrue(newGoal.exists)
        
        // Update progress
        newGoal.tap()
        let updateButton = app.buttons["Update Progress"]
        XCTAssertTrue(updateButton.exists)
        updateButton.tap()
        
        let progressField = app.textFields["Current Amount"]
        XCTAssertTrue(progressField.exists)
        progressField.tap()
        progressField.typeText("5000")
        
        let confirmButton = app.buttons["Confirm Update"]
        XCTAssertTrue(confirmButton.exists)
        confirmButton.tap()
        
        // Verify progress
        let progressBar = app.progressIndicators["Goal Progress"]
        XCTAssertTrue(progressBar.exists)
        
        // Test accessibility
        XCTAssertTrue(nameField.isAccessibilityElement)
        XCTAssertTrue(targetField.isAccessibilityElement)
        XCTAssertTrue(dateField.isAccessibilityElement)
        XCTAssertTrue(progressBar.isAccessibilityElement)
    }
}