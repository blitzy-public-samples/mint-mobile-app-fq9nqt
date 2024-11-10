// Foundation version: iOS 14.0+
import Foundation
// Combine version: iOS 14.0+
import Combine
// SwiftUI version: iOS 14.0+
import SwiftUI

/* Human Tasks:
1. Add Face ID/Touch ID usage description to Info.plist
2. Configure APNS certificates and keys in Apple Developer Portal
3. Add notification permission request description to Info.plist
4. Review error messages for localization requirements
5. Configure biometric authentication timeout in AppConstants.Security
*/

/// ViewModel responsible for managing application settings and user preferences
/// with thread-safe operations and proper error handling
///
/// Requirements addressed:
/// - Mobile Applications (5.2.1): Native iOS application using Swift and SwiftUI with secure keychain integration
/// - Authentication Methods (9.1.1): Biometric authentication configuration and management with FIDO2 compliance
/// - Real-time notification system (1.1): User notification preferences and settings management with APNS integration
@MainActor
final class SettingsViewModel: ViewModelProtocol {
    
    // MARK: - Published Properties
    
    @Published private(set) var state: ViewModelState = .idle
    @Published private(set) var errorMessage: String?
    @Published private(set) var isBiometricsEnabled: Bool = false
    @Published private(set) var isNotificationsEnabled: Bool = false
    
    // MARK: - Private Properties
    
    private let biometricUtils: BiometricUtils
    private let notificationManager: NotificationManager
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    init(biometricUtils: BiometricUtils) {
        self.biometricUtils = biometricUtils
        self.notificationManager = NotificationManager.shared
    }
    
    // MARK: - ViewModelProtocol Implementation
    
    func initialize() {
        state = .loading
        
        Task {
            do {
                // Check current biometric status
                isBiometricsEnabled = biometricUtils.isBiometricAvailable()
                
                // Check current notification permission status
                isNotificationsEnabled = notificationManager.hasNotificationPermission
                
                state = .success
            } catch {
                handleError(error)
            }
        }
    }
    
    func handleError(_ error: Error) {
        state = .error
        errorMessage = error.localizedDescription
        
        #if DEBUG
        print("Settings Error: \(error.localizedDescription)")
        #endif
    }
    
    // MARK: - Public Methods
    
    /// Toggles biometric authentication with proper error handling
    func toggleBiometrics() {
        state = .loading
        
        Task {
            do {
                if !isBiometricsEnabled {
                    // Attempt to enable biometrics
                    let authResult = biometricUtils.authenticateUser(
                        reason: "Enable biometric authentication for secure access"
                    )
                    
                    switch authResult {
                    case .success(let authenticated):
                        if authenticated {
                            isBiometricsEnabled = true
                            state = .success
                        } else {
                            throw BiometricError.notAvailable
                        }
                    case .failure(let error):
                        throw error
                    }
                } else {
                    // Disable biometrics
                    biometricUtils.invalidateAuthentication()
                    isBiometricsEnabled = false
                    state = .success
                }
            } catch {
                handleError(error)
                isBiometricsEnabled = false
            }
        }
    }
    
    /// Toggles notification permissions with proper error handling
    func toggleNotifications() {
        state = .loading
        
        Task {
            if !isNotificationsEnabled {
                // Request notification authorization
                notificationManager.requestAuthorization { [weak self] granted, error in
                    Task { @MainActor in
                        if let error = error {
                            self?.handleError(error)
                            self?.isNotificationsEnabled = false
                            return
                        }
                        
                        if granted {
                            // Register for remote notifications if authorized
                            self?.notificationManager.registerForRemoteNotifications()
                            self?.isNotificationsEnabled = true
                            self?.state = .success
                        } else {
                            self?.isNotificationsEnabled = false
                            self?.state = .error
                            self?.errorMessage = "Notification permission denied"
                        }
                    }
                }
            } else {
                // Direct user to system settings to disable notifications
                if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
                    DispatchQueue.main.async {
                        UIApplication.shared.open(settingsUrl)
                    }
                }
                state = .success
            }
        }
    }
}

// MARK: - Error Handling Extensions

extension SettingsViewModel {
    private func handleBiometricError(_ error: BiometricError) -> String {
        switch error {
        case .notAvailable:
            return "Biometric authentication is not available on this device"
        case .notEnrolled:
            return "Please set up biometric authentication in your device settings"
        case .lockout:
            return "Biometric authentication is locked due to too many failed attempts"
        case .canceled:
            return "Biometric authentication was canceled"
        case .invalidated:
            return "Biometric authentication session has expired"
        case .systemError(let error):
            return "System error: \(error.localizedDescription)"
        }
    }
}