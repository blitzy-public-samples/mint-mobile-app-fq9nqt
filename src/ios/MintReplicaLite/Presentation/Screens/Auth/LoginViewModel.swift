// iOS 15.0+ Required
import Foundation  // Version: iOS 15.0+
import Combine    // Version: iOS 15.0+
import LocalAuthentication // Version: iOS 15.0+
import SwiftUI    // Version: iOS 15.0+

/* Human Tasks Required:
1. Configure Face ID/Touch ID usage description in Info.plist
2. Set up proper keychain access group in entitlements
3. Configure proper token refresh intervals in environment settings
4. Review error messages for localization requirements
5. Set up error tracking/logging service integration
*/

/// ViewModel responsible for managing authentication state and login operations
/// Implements secure authentication flows with support for both password and biometric authentication
///
/// Requirements addressed:
/// - Secure user authentication and account management (1.2 Scope/Core Features)
/// - Authentication Methods (9.1.1 Authentication Methods)
/// - Session Management (9.1.3 Session Management)
@MainActor
final class LoginViewModel: ViewModelProtocol {
    // MARK: - Published Properties
    @Published private(set) var state: ViewModelState = .idle
    @Published private(set) var errorMessage: String? = nil
    @Published var email: String = ""
    @Published var password: String = ""
    @Published private(set) var isBiometricAvailable: Bool = false
    @Published private(set) var biometricType: LABiometryType = .none
    
    // MARK: - Private Properties
    private let authRepository: AuthRepository
    private let biometricUtils: BiometricUtils
    private var cancellables: Set<AnyCancellable> = []
    
    // MARK: - Validation Constants
    private enum ValidationConstants {
        static let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        static let minimumPasswordLength = 8
    }
    
    // MARK: - Initialization
    init(authRepository: AuthRepository, biometricUtils: BiometricUtils) {
        self.authRepository = authRepository
        self.biometricUtils = biometricUtils
        initialize()
    }
    
    // MARK: - ViewModelProtocol Implementation
    func initialize() {
        setupBiometricState()
        setupErrorHandling()
    }
    
    func handleError(_ error: Error) {
        state = .error
        errorMessage = error.localizedDescription
        
        #if DEBUG
        print("LoginViewModel Error: \(error.localizedDescription)")
        #endif
    }
    
    // MARK: - Public Methods
    
    /// Attempts to log in user with email and password
    /// - Returns: Publisher indicating login success or failure
    @MainActor
    func login() -> AnyPublisher<Void, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(NSError(domain: "LoginViewModel", code: -1)))
                return
            }
            
            // Validate input
            switch self.validateInput() {
            case .failure(let error):
                promise(.failure(error))
                return
            case .success:
                break
            }
            
            // Update state to loading
            self.state = .loading
            
            // Attempt login
            self.authRepository.login(email: self.email, password: self.password)
                .receive(on: DispatchQueue.main)
                .sink { completion in
                    switch completion {
                    case .failure(let error):
                        self.state = .error
                        promise(.failure(error))
                    case .finished:
                        break
                    }
                } receiveValue: { _ in
                    self.state = .success
                    promise(.success(()))
                }
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
    
    /// Attempts to log in user using biometric authentication
    /// - Returns: Publisher indicating login success or failure
    @MainActor
    func loginWithBiometric() -> AnyPublisher<Void, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(NSError(domain: "LoginViewModel", code: -1)))
                return
            }
            
            // Verify biometric availability
            guard self.isBiometricAvailable else {
                promise(.failure(BiometricError.notAvailable))
                return
            }
            
            // Update state to loading
            self.state = .loading
            
            // Request biometric authentication
            switch self.biometricUtils.authenticateUser(reason: "Log in to your account") {
            case .success:
                // Attempt biometric login
                self.authRepository.loginWithBiometric()
                    .receive(on: DispatchQueue.main)
                    .sink { completion in
                        switch completion {
                        case .failure(let error):
                            self.state = .error
                            promise(.failure(error))
                        case .finished:
                            break
                        }
                    } receiveValue: { _ in
                        self.state = .success
                        promise(.success(()))
                    }
                    .store(in: &self.cancellables)
                
            case .failure(let error):
                self.state = .error
                promise(.failure(error))
            }
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Private Methods
    
    private func setupBiometricState() {
        // Check biometric availability
        isBiometricAvailable = biometricUtils.isBiometricAvailable()
        
        // Get biometric type if available
        if isBiometricAvailable {
            biometricType = biometricUtils.getBiometricType()
        }
    }
    
    private func setupErrorHandling() {
        // Monitor state changes for error handling
        $state
            .sink { [weak self] state in
                if state == .error {
                    self?.errorMessage = "Authentication failed. Please try again."
                } else {
                    self?.errorMessage = nil
                }
            }
            .store(in: &cancellables)
    }
    
    /// Validates user input credentials against security requirements
    /// - Returns: Validation result with potential error
    private func validateInput() -> Result<Void, ValidationError> {
        // Validate email format
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", ValidationConstants.emailRegex)
        guard emailPredicate.evaluate(with: email) else {
            return .failure(.invalidEmail)
        }
        
        // Validate password length
        guard password.count >= ValidationConstants.minimumPasswordLength else {
            return .failure(.passwordTooShort)
        }
        
        // Validate password complexity
        let hasUppercase = password.contains(where: { $0.isUppercase })
        let hasNumber = password.contains(where: { $0.isNumber })
        let hasSpecialChar = password.contains(where: { "!@#$%^&*()_+-=[]{}|;:,.<>?".contains($0) })
        
        guard hasUppercase && hasNumber && hasSpecialChar else {
            return .failure(.passwordComplexity)
        }
        
        return .success(())
    }
}

// MARK: - Supporting Types

/// Validation errors for login input
enum ValidationError: LocalizedError {
    case invalidEmail
    case passwordTooShort
    case passwordComplexity
    
    var errorDescription: String? {
        switch self {
        case .invalidEmail:
            return "Please enter a valid email address"
        case .passwordTooShort:
            return "Password must be at least 8 characters long"
        case .passwordComplexity:
            return "Password must contain at least one uppercase letter, one number, and one special character"
        }
    }
}