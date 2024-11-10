//
// AuthRepository.swift
// MintReplicaLite
//
// Implements authentication repository functionality with secure token management
// and biometric authentication support

// MARK: - Human Tasks
/*
1. Configure proper keychain access group in entitlements
2. Set up biometric authentication permissions in Info.plist
3. Verify SSL pinning configuration for API security
4. Configure proper token refresh intervals in environment settings
5. Test token persistence across app reinstalls
*/

import Foundation // iOS 14.0+
import Combine // iOS 14.0+
import LocalAuthentication // iOS 14.0+

/// Repository handling authentication operations with secure credential management
/// Addresses requirements:
/// - Secure user authentication and account management (1.2 Scope/Core Features)
/// - Authentication Methods (9.1.1 Authentication Methods)
/// - Session Management (9.1.3 Session Management)
@available(iOS 14.0, *)
final class AuthRepository {
    
    // MARK: - Constants
    private enum Constants {
        static let tokenKey = "auth.token"
        static let refreshTokenKey = "auth.refreshToken"
        static let biometricCredentialsKey = "auth.biometricCredentials"
        static let tokenExpirationKey = "auth.tokenExpiration"
        static let sessionDuration: TimeInterval = 15 * 60 // 15 minutes
    }
    
    // MARK: - Properties
    private let apiClient: APIClient
    private let keychainManager: KeychainManager
    private let queue: DispatchQueue
    private let context: LAContext
    
    // MARK: - Initialization
    
    init() {
        self.apiClient = .shared
        self.keychainManager = .shared
        self.queue = DispatchQueue(label: "com.mintreplicalite.auth",
                                 qos: .userInitiated,
                                 attributes: .concurrent)
        self.context = LAContext()
    }
    
    // MARK: - Public Methods
    
    /// Authenticates user with email and password
    /// - Parameters:
    ///   - email: User's email address
    ///   - password: User's password
    /// - Returns: Publisher emitting authenticated user or error
    func login(email: String, password: String) -> AnyPublisher<User, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(RepositoryError.invalidData))
                return
            }
            
            // Create login request
            let request = APIRequest<AuthResponse>(
                endpoint: "/auth/login",
                method: .post,
                parameters: [
                    "email": email,
                    "password": password
                ]
            )
            
            // Execute login request
            self.apiClient.request(request)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: { [weak self] response in
                        guard let self = self else { return }
                        
                        // Store authentication tokens securely
                        try? self.storeTokens(
                            token: response.token,
                            refreshToken: response.refreshToken
                        )
                        
                        // Configure token expiration
                        self.setTokenExpiration(Date().addingTimeInterval(Constants.sessionDuration))
                        
                        // Create and return user instance
                        let user = User(
                            id: response.user.id,
                            email: response.user.email,
                            firstName: response.user.firstName,
                            lastName: response.user.lastName
                        )
                        promise(.success(user))
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
    
    /// Authenticates user using biometric authentication
    /// - Returns: Publisher emitting authenticated user or error
    func loginWithBiometric() -> AnyPublisher<User, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(RepositoryError.invalidData))
                return
            }
            
            // Verify biometric availability
            guard self.context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil) else {
                promise(.failure(AuthError.biometricNotAvailable))
                return
            }
            
            // Verify biometric timeout hasn't expired
            guard !self.isBiometricTimedOut() else {
                promise(.failure(AuthError.biometricTimeout))
                return
            }
            
            // Prompt for biometric authentication
            self.context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: "Authenticate to access your account"
            ) { [weak self] success, error in
                guard let self = self else { return }
                
                if success {
                    // Retrieve stored credentials
                    guard let credentials = try? self.retrieveBiometricCredentials() else {
                        promise(.failure(AuthError.credentialsNotFound))
                        return
                    }
                    
                    // Perform authentication with stored credentials
                    self.login(email: credentials.email, password: credentials.password)
                        .sink(
                            receiveCompletion: { completion in
                                if case .failure(let error) = completion {
                                    promise(.failure(error))
                                }
                            },
                            receiveValue: { user in
                                // Update biometric authentication timestamp
                                self.updateBiometricTimestamp()
                                promise(.success(user))
                            }
                        )
                        .store(in: &self.cancellables)
                } else {
                    promise(.failure(error ?? AuthError.biometricFailed))
                }
            }
        }
        .eraseToAnyPublisher()
    }
    
    /// Logs out current user and clears credentials
    /// - Returns: Publisher indicating logout completion or error
    func logout() -> AnyPublisher<Void, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(RepositoryError.invalidData))
                return
            }
            
            // Clear authentication tokens
            _ = try? self.keychainManager.delete(key: Constants.tokenKey)
            _ = try? self.keychainManager.delete(key: Constants.refreshTokenKey)
            _ = try? self.keychainManager.delete(key: Constants.tokenExpirationKey)
            
            // Clear biometric state
            _ = try? self.keychainManager.delete(key: Constants.biometricCredentialsKey)
            
            // Notify logout completion
            promise(.success(()))
        }
        .eraseToAnyPublisher()
    }
    
    /// Refreshes authentication token using refresh token
    /// - Returns: Publisher indicating token refresh completion or error
    func refreshToken() -> AnyPublisher<Void, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(RepositoryError.invalidData))
                return
            }
            
            // Retrieve refresh token
            guard let refreshToken = try? self.retrieveRefreshToken() else {
                promise(.failure(AuthError.refreshTokenNotFound))
                return
            }
            
            // Validate refresh token expiration
            guard !self.isRefreshTokenExpired() else {
                promise(.failure(AuthError.refreshTokenExpired))
                return
            }
            
            // Create token refresh request
            let request = APIRequest<TokenResponse>(
                endpoint: "/auth/refresh",
                method: .post,
                parameters: ["refreshToken": refreshToken]
            )
            
            // Execute refresh request
            self.apiClient.request(request)
                .sink(
                    receiveCompletion: { completion in
                        if case .failure(let error) = completion {
                            promise(.failure(error))
                        }
                    },
                    receiveValue: { [weak self] response in
                        guard let self = self else { return }
                        
                        // Store new tokens with updated expiration
                        try? self.storeTokens(
                            token: response.token,
                            refreshToken: response.refreshToken
                        )
                        self.setTokenExpiration(Date().addingTimeInterval(Constants.sessionDuration))
                        
                        promise(.success(()))
                    }
                )
                .store(in: &self.cancellables)
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Private Methods
    
    private var cancellables = Set<AnyCancellable>()
    
    private func storeTokens(token: String, refreshToken: String) throws {
        guard let tokenData = token.data(using: .utf8),
              let refreshTokenData = refreshToken.data(using: .utf8) else {
            throw AuthError.tokenEncodingFailed
        }
        
        _ = try keychainManager.save(data: tokenData, key: Constants.tokenKey)
        _ = try keychainManager.save(data: refreshTokenData, key: Constants.refreshTokenKey)
    }
    
    private func retrieveRefreshToken() throws -> String? {
        guard case .success(let data) = keychainManager.retrieve(key: Constants.refreshTokenKey),
              let refreshToken = String(data: data, encoding: .utf8) else {
            return nil
        }
        return refreshToken
    }
    
    private func setTokenExpiration(_ date: Date) {
        let data = try? JSONEncoder().encode(date)
        _ = try? keychainManager.save(data: data!, key: Constants.tokenExpirationKey)
    }
    
    private func isRefreshTokenExpired() -> Bool {
        guard case .success(let data) = keychainManager.retrieve(key: Constants.tokenExpirationKey),
              let expirationDate = try? JSONDecoder().decode(Date.self, from: data) else {
            return true
        }
        return Date() > expirationDate
    }
    
    private func storeBiometricCredentials(email: String, password: String) throws {
        let credentials = BiometricCredentials(email: email, password: password)
        let data = try JSONEncoder().encode(credentials)
        _ = try keychainManager.save(data: data, key: Constants.biometricCredentialsKey)
    }
    
    private func retrieveBiometricCredentials() throws -> BiometricCredentials? {
        guard case .success(let data) = keychainManager.retrieve(key: Constants.biometricCredentialsKey) else {
            return nil
        }
        return try JSONDecoder().decode(BiometricCredentials.self, from: data)
    }
    
    private func updateBiometricTimestamp() {
        let timestamp = Date()
        let data = try? JSONEncoder().encode(timestamp)
        _ = try? keychainManager.save(data: data!, key: "biometric.lastUsed")
    }
    
    private func isBiometricTimedOut() -> Bool {
        guard case .success(let data) = keychainManager.retrieve(key: "biometric.lastUsed"),
              let lastUsed = try? JSONDecoder().decode(Date.self, from: data) else {
            return false
        }
        let timeout = TimeInterval(AppConstants.Security.biometric_timeout)
        return Date().timeIntervalSince(lastUsed) > timeout
    }
}

// MARK: - Supporting Types

private struct AuthResponse: Codable {
    let token: String
    let refreshToken: String
    let user: UserResponse
}

private struct UserResponse: Codable {
    let id: UUID
    let email: String
    let firstName: String
    let lastName: String
}

private struct TokenResponse: Codable {
    let token: String
    let refreshToken: String
}

private struct BiometricCredentials: Codable {
    let email: String
    let password: String
}

enum AuthError: LocalizedError {
    case tokenEncodingFailed
    case refreshTokenNotFound
    case refreshTokenExpired
    case biometricNotAvailable
    case biometricTimeout
    case biometricFailed
    case credentialsNotFound
    
    var errorDescription: String? {
        switch self {
        case .tokenEncodingFailed:
            return "Failed to encode authentication tokens"
        case .refreshTokenNotFound:
            return "Refresh token not found"
        case .refreshTokenExpired:
            return "Refresh token has expired"
        case .biometricNotAvailable:
            return "Biometric authentication not available"
        case .biometricTimeout:
            return "Biometric authentication has timed out"
        case .biometricFailed:
            return "Biometric authentication failed"
        case .credentialsNotFound:
            return "Biometric credentials not found"
        }
    }
}