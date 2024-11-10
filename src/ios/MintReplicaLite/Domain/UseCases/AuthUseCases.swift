//
// AuthUseCases.swift
// MintReplicaLite
//
// Implements authentication use cases with secure token management and biometric support

// MARK: - Human Tasks
/*
1. Verify proper keychain access group configuration in entitlements
2. Configure biometric authentication permissions in Info.plist
3. Set up proper SSL pinning for API security
4. Configure token refresh intervals in environment settings
5. Test biometric authentication flows across different device types
*/

import Foundation // iOS 14.0+
import Combine // iOS 14.0+

/// Implements authentication use cases with support for multiple authentication methods
/// and secure session management
/// Addresses requirements:
/// - Secure user authentication (1.2 Scope/Core Features)
/// - Authentication Methods (9.1.1 Authentication Methods)
/// - Session Management (9.1.3 Session Management)
@available(iOS 14.0, *)
final class AuthUseCases {
    
    // MARK: - Properties
    private let authRepository: AuthRepository
    private let biometricUtils: BiometricUtils
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    init(authRepository: AuthRepository, biometricUtils: BiometricUtils) {
        self.authRepository = authRepository
        self.biometricUtils = biometricUtils
    }
    
    // MARK: - Authentication Methods
    
    /// Authenticates user with email and password credentials
    /// - Parameters:
    ///   - email: User's email address
    ///   - password: User's password
    /// - Returns: Publisher emitting authenticated user or error
    func loginWithCredentials(email: String, password: String) -> AnyPublisher<User, Error> {
        // Validate input credentials
        guard isValidEmail(email) else {
            return Fail(error: ValidationError.invalidEmail).eraseToAnyPublisher()
        }
        
        guard isValidPassword(password) else {
            return Fail(error: ValidationError.invalidPassword).eraseToAnyPublisher()
        }
        
        // Attempt login through repository
        return authRepository.login(email: email, password: password)
            .handleEvents(receiveOutput: { [weak self] _ in
                // Setup biometric if enabled in preferences
                self?.setupBiometricIfEnabled(email: email, password: password)
            })
            .eraseToAnyPublisher()
    }
    
    /// Authenticates user using device biometric authentication (Face ID/Touch ID)
    /// - Returns: Publisher emitting authenticated user or error
    func loginWithBiometric() -> AnyPublisher<User, Error> {
        // Check biometric availability
        guard biometricUtils.isBiometricAvailable() else {
            return Fail(error: BiometricError.notAvailable).eraseToAnyPublisher()
        }
        
        // Attempt biometric authentication
        let result = biometricUtils.authenticateUser(reason: "Authenticate to access your account")
        
        switch result {
        case .success(true):
            // Perform login with stored credentials
            return authRepository.loginWithBiometric()
                .eraseToAnyPublisher()
            
        case .success(false):
            return Fail(error: BiometricError.canceled).eraseToAnyPublisher()
            
        case .failure(let error):
            return Fail(error: error).eraseToAnyPublisher()
        }
    }
    
    /// Registers a new user account with proper validation
    /// - Parameters:
    ///   - email: User's email address
    ///   - password: User's password
    ///   - firstName: User's first name
    ///   - lastName: User's last name
    /// - Returns: Publisher emitting created user or error
    func register(email: String, password: String, firstName: String, lastName: String) -> AnyPublisher<User, Error> {
        // Validate registration data
        guard isValidEmail(email) else {
            return Fail(error: ValidationError.invalidEmail).eraseToAnyPublisher()
        }
        
        guard isValidPassword(password) else {
            return Fail(error: ValidationError.invalidPassword).eraseToAnyPublisher()
        }
        
        guard isValidName(firstName) else {
            return Fail(error: ValidationError.invalidFirstName).eraseToAnyPublisher()
        }
        
        guard isValidName(lastName) else {
            return Fail(error: ValidationError.invalidLastName).eraseToAnyPublisher()
        }
        
        // Create user account through repository
        return authRepository.register(
            email: email,
            password: password,
            firstName: firstName,
            lastName: lastName
        )
        .eraseToAnyPublisher()
    }
    
    /// Logs out current user and clears authentication state securely
    /// - Returns: Publisher indicating logout success or error
    func logout() -> AnyPublisher<Void, Error> {
        return authRepository.logout()
            .handleEvents(receiveCompletion: { [weak self] completion in
                if case .finished = completion {
                    // Clear biometric state on successful logout
                    self?.biometricUtils.invalidateAuthentication()
                }
            })
            .eraseToAnyPublisher()
    }
    
    /// Refreshes the current authentication session with sliding expiration
    /// - Returns: Publisher indicating refresh success or error
    func refreshSession() -> AnyPublisher<Void, Error> {
        return authRepository.refreshToken()
            .eraseToAnyPublisher()
    }
    
    // MARK: - Private Methods
    
    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
    
    private func isValidPassword(_ password: String) -> Bool {
        // Password requirements:
        // - At least 8 characters
        // - Contains at least one uppercase letter
        // - Contains at least one lowercase letter
        // - Contains at least one number
        // - Contains at least one special character
        let passwordRegex = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[$@$!%*?&])[A-Za-z\\d$@$!%*?&]{8,}"
        let passwordPredicate = NSPredicate(format: "SELF MATCHES %@", passwordRegex)
        return passwordPredicate.evaluate(with: password)
    }
    
    private func isValidName(_ name: String) -> Bool {
        // Name requirements:
        // - At least 2 characters
        // - Contains only letters and spaces
        // - No consecutive spaces
        let nameRegex = "^[A-Za-z]+(\\s{0,1}[A-Za-z]+)*$"
        let namePredicate = NSPredicate(format: "SELF MATCHES %@", nameRegex)
        return namePredicate.evaluate(with: name) && name.count >= 2
    }
    
    private func setupBiometricIfEnabled(email: String, password: String) {
        // Check if biometric authentication is enabled in user preferences
        guard UserDefaults.standard.bool(forKey: "biometric_enabled") else {
            return
        }
        
        // Verify biometric availability
        guard biometricUtils.isBiometricAvailable() else {
            return
        }
        
        // Store credentials for biometric authentication
        do {
            try authRepository.storeBiometricCredentials(email: email, password: password)
        } catch {
            print("Failed to store biometric credentials: \(error)")
        }
    }
}

// MARK: - Supporting Types

enum ValidationError: LocalizedError {
    case invalidEmail
    case invalidPassword
    case invalidFirstName
    case invalidLastName
    
    var errorDescription: String? {
        switch self {
        case .invalidEmail:
            return "Please enter a valid email address"
        case .invalidPassword:
            return "Password must be at least 8 characters and contain uppercase, lowercase, number and special character"
        case .invalidFirstName:
            return "Please enter a valid first name"
        case .invalidLastName:
            return "Please enter a valid last name"
        }
    }
}