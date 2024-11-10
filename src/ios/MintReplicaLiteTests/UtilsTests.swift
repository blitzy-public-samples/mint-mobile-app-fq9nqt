// XCTest version: iOS 14.0+
import XCTest
// LocalAuthentication version: iOS 14.0+
import LocalAuthentication
// UserNotifications version: iOS 14.0+
import UserNotifications
@testable import MintReplicaLite

// MARK: - Human Tasks
/*
1. Configure test environment with proper keychain access
2. Set up mock biometric authentication for testing
3. Configure test notification center permissions
4. Set up test network conditions simulation
*/

@available(iOS 14.0, *)
final class UtilsTests: XCTestCase {
    // MARK: - Properties
    private var biometricUtils: BiometricUtils!
    private var currencyFormatter: CurrencyFormatter!
    private var keychainManager: KeychainManager!
    private var networkMonitor: NetworkMonitor!
    private var notificationManager: NotificationManager!
    
    // MARK: - Setup & Teardown
    
    override func setUp() {
        super.setUp()
        keychainManager = KeychainManager.shared
        biometricUtils = BiometricUtils(keychainManager: keychainManager)
        currencyFormatter = CurrencyFormatter.shared
        networkMonitor = NetworkMonitor.shared
        notificationManager = NotificationManager.shared
    }
    
    override func tearDown() {
        // Clean up test data
        _ = keychainManager.clear()
        networkMonitor.stopMonitoring()
        super.tearDown()
    }
    
    // MARK: - BiometricUtils Tests
    
    /// Tests biometric authentication availability and type detection
    /// Requirement: Authentication Methods (9.1.1)
    func testBiometricAvailability() {
        // Test biometric availability
        let isAvailable = biometricUtils.isBiometricAvailable()
        XCTAssertNotNil(isAvailable, "Biometric availability check should return a value")
        
        // Test biometric type detection
        let biometricType = biometricUtils.getBiometricType()
        XCTAssertTrue(biometricType == .faceID || biometricType == .touchID || biometricType == .none,
                     "Biometric type should be valid")
        
        // Test authentication with reason
        let authResult = biometricUtils.authenticateUser(reason: "Unit Test Authentication")
        switch authResult {
        case .success(let success):
            XCTAssertNotNil(success, "Authentication result should not be nil")
        case .failure(let error):
            XCTAssertTrue(error is BiometricError, "Error should be BiometricError type")
        }
    }
    
    // MARK: - CurrencyFormatter Tests
    
    /// Tests currency formatting functionality with various locales
    /// Requirement: Core Features (1.2)
    func testCurrencyFormatting() {
        // Test default locale formatting
        let amount = Decimal(string: "1234.56")!
        let formatted = currencyFormatter.formatAmount(amount)
        XCTAssertTrue(formatted.contains("1,234.56") || formatted.contains("1.234,56"),
                     "Amount should be properly formatted")
        
        // Test formatting without symbol
        let withoutSymbol = currencyFormatter.formatAmountWithoutSymbol(amount)
        XCTAssertFalse(withoutSymbol.contains("$") || withoutSymbol.contains("€"),
                      "Formatted amount should not contain currency symbol")
        
        // Test with different locale
        let germanLocale = Locale(identifier: "de_DE")
        currencyFormatter.updateLocale(germanLocale)
        let germanFormatted = currencyFormatter.formatAmount(amount)
        XCTAssertTrue(germanFormatted.contains("€"), "German format should use Euro symbol")
        
        // Reset to original locale
        currencyFormatter.updateLocale(Locale.current)
    }
    
    // MARK: - KeychainManager Tests
    
    /// Tests keychain save, retrieve, and delete operations
    /// Requirement: Data Security (9.2)
    func testKeychainOperations() {
        // Test saving data
        let testKey = "test_key"
        let testData = "test_data".data(using: .utf8)!
        
        let saveResult = keychainManager.save(data: testData, key: testKey)
        switch saveResult {
        case .success:
            XCTAssertTrue(true, "Data should be saved successfully")
        case .failure(let error):
            XCTFail("Failed to save data: \(error.localizedDescription)")
        }
        
        // Test retrieving data
        let retrieveResult = keychainManager.retrieve(key: testKey)
        switch retrieveResult {
        case .success(let data):
            XCTAssertEqual(data, testData, "Retrieved data should match saved data")
        case .failure(let error):
            XCTFail("Failed to retrieve data: \(error.localizedDescription)")
        }
        
        // Test deleting data
        let deleteResult = keychainManager.delete(key: testKey)
        switch deleteResult {
        case .success:
            XCTAssertTrue(true, "Data should be deleted successfully")
        case .failure(let error):
            XCTFail("Failed to delete data: \(error.localizedDescription)")
        }
        
        // Verify deletion
        let verifyResult = keychainManager.retrieve(key: testKey)
        switch verifyResult {
        case .success(let data):
            XCTAssertNil(data, "Data should be nil after deletion")
        case .failure:
            XCTFail("Verification should succeed with nil data")
        }
    }
    
    // MARK: - NetworkMonitor Tests
    
    /// Tests network monitoring functionality and status updates
    /// Requirement: Core Features (1.2)
    func testNetworkMonitoring() {
        // Start monitoring
        networkMonitor.startMonitoring()
        
        // Test initial connection status
        let initialStatus = networkMonitor.isConnected
        XCTAssertNotNil(initialStatus, "Initial connection status should be available")
        
        // Test status publisher
        let expectation = XCTestExpectation(description: "Network status update")
        var cancellable: AnyCancellable?
        
        cancellable = networkMonitor.statusPublisher
            .sink { status in
                XCTAssertTrue(status == .connected || status == .disconnected,
                             "Network status should be valid")
                expectation.fulfill()
            }
        
        wait(for: [expectation], timeout: 5.0)
        cancellable?.cancel()
        
        // Stop monitoring
        networkMonitor.stopMonitoring()
        XCTAssertFalse(networkMonitor.isConnected, "Connection should be false after stopping")
    }
    
    // MARK: - NotificationManager Tests
    
    /// Tests notification permission handling and scheduling
    /// Requirement: Core Features (1.2)
    func testNotificationScheduling() {
        // Test notification permission request
        let permissionExpectation = XCTestExpectation(description: "Permission request")
        
        notificationManager.requestAuthorization { granted, error in
            XCTAssertNotNil(granted, "Permission result should not be nil")
            XCTAssertNil(error, "Permission error should be nil")
            permissionExpectation.fulfill()
        }
        
        wait(for: [permissionExpectation], timeout: 5.0)
        
        // Test scheduling local notification
        let notificationDate = Date().addingTimeInterval(60)
        notificationManager.scheduleLocalNotification(
            title: "Test Notification",
            body: "Test notification body",
            date: notificationDate,
            userInfo: ["test_key": "test_value"]
        )
        
        // Test remote notification registration
        notificationManager.registerForRemoteNotifications()
        XCTAssertTrue(notificationManager.isRegisteredForRemoteNotifications,
                     "Should be registered for remote notifications")
        
        // Test notification permission status
        XCTAssertNotNil(notificationManager.hasNotificationPermission,
                       "Notification permission status should be available")
    }
}