// iOS 15.0+ Required
import XCTest
@testable import MintReplicaLite

/* Human Tasks:
1. Configure performance baseline thresholds in scheme settings
2. Set up test devices with different screen sizes and configurations
3. Verify accessibility inspector settings for launch tests
4. Configure test data for offline mode validation
5. Set up secure keychain access for launch tests
*/

/// Launch test suite for validating application launch behavior, performance metrics, and initial UI state
/// Requirements addressed:
/// - Mobile Applications Testing (Technical Implementation/5.2.1 Mobile Applications)
/// - User Interface Testing (8.1 User Interface Design)
/// - Performance Testing (Technical Implementation/Core Features)
final class MintReplicaLiteUITestsLaunchTests: MintReplicaLiteUITests {
    
    // MARK: - Properties
    override var runsForEachTargetApplicationUIConfiguration: Bool {
        true // Test across different device configurations
    }
    
    // MARK: - Test Lifecycle
    override func setUpWithError() throws {
        // Configure base test environment
        try super.setUpWithError()
        
        // Configure performance metrics collection
        continueAfterFailure = false
        
        // Set up launch test specific environment
        let app = XCUIApplication()
        app.launchArguments += ["LAUNCH_TESTING"]
        app.launchEnvironment["MEASURE_LAUNCH"] = "true"
        app.launchEnvironment["OFFLINE_MODE"] = "true"
        
        // Reset application state for clean launch
        UserDefaults.standard.removePersistentDomain(forName: Bundle.main.bundleIdentifier!)
        
        // Clear keychain for secure launch testing
        let secItemClasses = [kSecClassGenericPassword, kSecClassInternetPassword]
        secItemClasses.forEach { itemClass in
            SecItemDelete([itemClass as String: kSecMatchLimitAll] as CFDictionary)
        }
    }
    
    // MARK: - Launch Tests
    @MainActor
    func testLaunch() throws {
        let app = XCUIApplication()
        app.launch()
        
        // Verify launch screen appearance
        let launchScreen = app.otherElements["LaunchScreen"]
        XCTAssertTrue(launchScreen.exists)
        XCTAssertTrue(launchScreen.isHittable)
        
        // Verify app logo
        let appLogo = launchScreen.images["AppLogo"]
        XCTAssertTrue(appLogo.exists)
        XCTAssertTrue(appLogo.isAccessibilityElement)
        
        // Verify launch progress indicator
        let loadingIndicator = launchScreen.activityIndicators.firstMatch
        XCTAssertTrue(loadingIndicator.exists)
        
        // Wait for initial navigation state
        let loginView = app.otherElements["LoginView"]
        let exists = NSPredicate(format: "exists == true")
        expectation(for: exists, evaluatedWith: loginView, handler: nil)
        waitForExpectations(timeout: 5, handler: nil)
        
        // Verify accessibility compliance
        XCTAssertTrue(loginView.isAccessibilityElement)
        XCTAssertNotNil(loginView.accessibilityLabel)
        XCTAssertNotNil(loginView.accessibilityHint)
        
        // Verify UI element hierarchy
        let emailField = loginView.textFields["Email"]
        let passwordField = loginView.secureTextFields["Password"]
        let loginButton = loginView.buttons["Log In"]
        
        XCTAssertTrue(emailField.exists)
        XCTAssertTrue(passwordField.exists)
        XCTAssertTrue(loginButton.exists)
        
        // Validate offline data availability
        let offlineDataLabel = app.staticTexts["OfflineDataStatus"]
        XCTAssertTrue(offlineDataLabel.exists)
        XCTAssertEqual(offlineDataLabel.label, "Offline data available")
        
        // Check secure keychain access
        let biometricButton = app.buttons["Sign in with Face ID"] 
            ?? app.buttons["Sign in with Touch ID"]
        XCTAssertTrue(biometricButton.exists)
        XCTAssertTrue(biometricButton.isEnabled)
    }
    
    @MainActor
    func testLaunchPerformance() throws {
        // Configure metrics collection
        let metrics = XCTOSSignpostMetric.applicationLaunch
        
        // Set baseline thresholds
        let maxLaunchDuration: TimeInterval = 2.0 // seconds
        let maxMemoryUsage: UInt64 = 100 * 1024 * 1024 // 100 MB
        
        // Measure cold launch
        measure(metrics: [metrics]) {
            XCUIApplication().launch()
        }
        
        let app = XCUIApplication()
        
        // Measure warm launch
        app.terminate()
        let start = Date()
        app.launch()
        let duration = Date().timeIntervalSince(start)
        
        // Validate launch duration
        XCTAssertLessThanOrEqual(duration, maxLaunchDuration, 
            "Launch duration exceeded threshold")
        
        // Measure memory usage
        let memoryUsage = app.execute(["MEMORY_USAGE"]).memory
        XCTAssertLessThanOrEqual(memoryUsage, maxMemoryUsage,
            "Memory usage exceeded threshold")
        
        // Measure CPU utilization
        let cpuUsage = app.execute(["CPU_USAGE"]).cpu
        XCTAssertLessThanOrEqual(cpuUsage, 80.0,
            "CPU usage exceeded threshold")
        
        // Verify performance meets requirements
        let performanceMetrics = [
            "cold_launch_duration": metrics.measurements.first?.duration ?? 0,
            "warm_launch_duration": duration,
            "memory_usage": Double(memoryUsage),
            "cpu_usage": cpuUsage
        ]
        
        // Record metrics for analysis
        XCTContext.runActivity(named: "Launch Performance Metrics") { _ in
            performanceMetrics.forEach { metric in
                XCTAttachment(string: "\(metric.key): \(metric.value)")
                    .lifetime = .keepAlways
            }
        }
    }
}