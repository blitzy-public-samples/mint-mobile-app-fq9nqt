// Foundation version: iOS 14.0+
import Foundation

// MARK: - Human Tasks
/*
1. Verify keychain service identifier matches your app's bundle identifier
2. Configure biometric authentication timeout based on security requirements
3. Adjust cache size limits based on device performance testing
4. Update animation durations based on UX testing feedback
*/

// MARK: - Global Constants
/// Application name used throughout the app
let APP_NAME: String = "MintReplicaLite"

/// Minimum supported iOS version
let MIN_IOS_VERSION: Float = 14.0

/// Maximum number of days for offline data retention
let MAX_OFFLINE_DAYS: Int = 90

/// Maximum interval between data synchronization (in seconds)
let MAX_SYNC_INTERVAL: TimeInterval = 3600

/// Default animation duration for UI transitions
let DEFAULT_ANIMATION_DURATION: Double = 0.3

// MARK: - App Constants Structure
/// Main structure containing application-wide constants and configuration
@frozen struct AppConstants {
    // MARK: - Properties
    /// Current application version
    static var appVersion: String {
        return Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }
    
    /// Current build number
    static var buildNumber: String {
        return Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
    }
    
    /// Unique device identifier
    static var deviceId: String {
        if let identifier = UIDevice.current.identifierForVendor?.uuidString {
            return identifier
        }
        return UUID().uuidString
    }
    
    // MARK: - Functions
    /// Retrieves current app version from bundle
    /// - Returns: Current application version string
    static func getAppVersion() -> String {
        return appVersion
    }
}

// MARK: - Security Constants
/// Security-related configuration constants
struct Security {
    /// Keychain service identifier
    static let keychain_service: String = "com.mintreplicalite.keychain"
    
    /// Authentication token expiry interval (24 hours)
    static let token_expiry: TimeInterval = 86400
    
    /// Biometric authentication timeout (5 minutes)
    static let biometric_timeout: TimeInterval = 300
}

// MARK: - Cache Configuration
/// Cache-related configuration constants
struct Cache {
    /// Maximum cache size in bytes (50MB)
    static let max_size: Int = 52_428_800
    
    /// Cache expiry interval (7 days)
    static let expiry_interval: TimeInterval = 604_800
}

// MARK: - UI Configuration
/// UI-related configuration constants
struct UI {
    /// Minimum touch target size for accessibility
    static let min_touch_size: CGFloat = 44.0
    
    /// Standard animation duration for UI transitions
    static let animation_duration: Double = DEFAULT_ANIMATION_DURATION
}

// MARK: - Sync Configuration
/// Data synchronization configuration constants
struct Sync {
    /// Sync interval in seconds (matches MAX_SYNC_INTERVAL)
    static let interval: TimeInterval = MAX_SYNC_INTERVAL
    
    /// Maximum number of items per sync batch
    static let batch_size: Int = 100
}

// MARK: - API Configuration
/// API configuration using imported constants
extension AppConstants {
    struct API {
        static let baseURL = APIEndpoints.BASE_URL
        static let version = APIEndpoints.API_VERSION
        
        static func getFullEndpoint(_ path: String) -> String {
            return "\(baseURL)/\(version)\(path)"
        }
    }
}