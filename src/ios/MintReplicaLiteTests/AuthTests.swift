//
// AuthTests.swift
// MintReplicaLiteTests
//
// Implements comprehensive unit tests for authentication functionality
// Addresses requirements:
// - Authentication Testing (9.1.1 Authentication Methods)
// - Session Management Testing (9.1.3 Session Management)

// MARK: - Human Tasks
/*
1. Configure test keychain access group in test target entitlements
2. Set up test biometric authentication permissions in test Info.plist
3. Configure mock server SSL certificates for testing
4. Verify test environment token refresh intervals
5. Set up test device biometric simulation settings
*/

import XCTest
import Combine
@testable import MintReplicaLite

@available(iOS 14.0, *)
final class AuthTests: XCTestCase {
    
    // MARK: - Properties
    
    private var sut: AuthUseCases!
    private var mockAuthRepository: MockAuthRepository!
    private var mockBiometricUtils: MockBiometricUtils!
    private var cancellables: Set<AnyCancellable>!
    
    // MARK: - Test Lifecycle
    
    override func setUp() {
        super.setUp()
        mockAuthRepository = MockAuthRepository()
        mockBiometricUtils = MockBiometricUtils()
        sut = AuthUseCases(authRepository: mockAuthRepository, biometricUtils: mockBiometricUtils)
        cancellables = Set<AnyCancellable>()
    }
    
    override func tearDown() {
        cancellables.removeAll()
        mockAuthRepository = nil
        mockBiometricUtils = nil
        sut = nil
        super.tearDown()
    }
    
    // MARK: - Login Tests
    
    func testLoginWithValidCredentials() {
        // Given
        let expectation = XCTestExpectation(description: "Login success")
        let email = "test@example.com"
        let password = "Test123!@#"
        let expectedUser = User(id: UUID(), email: email, firstName: "Test", lastName: "User")
        mockAuthRepository.loginResult = .success(expectedUser)
        
        // When
        sut.loginWithCredentials(email: email, password: password)
            .sink(
                receiveCompletion: { completion in
                    if case .failure = completion {
                        XCTFail("Login should succeed")
                    }
                },
                receiveValue: { user in
                    // Then
                    XCTAssertEqual(user.email, expectedUser.email)
                    XCTAssertEqual(user.firstName, expectedUser.firstName)
                    XCTAssertEqual(user.lastName, expectedUser.lastName)
                    expectation.fulfill()
                }
            )
            .store(in: &cancellables)
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testLoginWithInvalidEmail() {
        // Given
        let expectation = XCTestExpectation(description: "Login failure")
        let invalidEmail = "invalid-email"
        let password = "Test123!@#"
        
        // When
        sut.loginWithCredentials(email: invalidEmail, password: password)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error as ValidationError) = completion {
                        // Then
                        XCTAssertEqual(error, ValidationError.invalidEmail)
                        expectation.fulfill()
                    }
                },
                receiveValue: { _ in
                    XCTFail("Login should fail with invalid email")
                }
            )
            .store(in: &cancellables)
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testLoginWithInvalidPassword() {
        // Given
        let expectation = XCTestExpectation(description: "Login failure")
        let email = "test@example.com"
        let invalidPassword = "weak"
        
        // When
        sut.loginWithCredentials(email: email, password: invalidPassword)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error as ValidationError) = completion {
                        // Then
                        XCTAssertEqual(error, ValidationError.invalidPassword)
                        expectation.fulfill()
                    }
                },
                receiveValue: { _ in
                    XCTFail("Login should fail with invalid password")
                }
            )
            .store(in: &cancellables)
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    // MARK: - Biometric Authentication Tests
    
    func testBiometricLoginSuccess() {
        // Given
        let expectation = XCTestExpectation(description: "Biometric login success")
        let expectedUser = User(id: UUID(), email: "test@example.com", firstName: "Test", lastName: "User")
        mockBiometricUtils.isAvailable = true
        mockBiometricUtils.authenticationResult = .success(true)
        mockAuthRepository.biometricLoginResult = .success(expectedUser)
        
        // When
        sut.loginWithBiometric()
            .sink(
                receiveCompletion: { completion in
                    if case .failure = completion {
                        XCTFail("Biometric login should succeed")
                    }
                },
                receiveValue: { user in
                    // Then
                    XCTAssertEqual(user.email, expectedUser.email)
                    XCTAssertEqual(user.firstName, expectedUser.firstName)
                    XCTAssertEqual(user.lastName, expectedUser.lastName)
                    expectation.fulfill()
                }
            )
            .store(in: &cancellables)
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testBiometricLoginUnavailable() {
        // Given
        let expectation = XCTestExpectation(description: "Biometric login failure")
        mockBiometricUtils.isAvailable = false
        
        // When
        sut.loginWithBiometric()
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error as BiometricError) = completion {
                        // Then
                        XCTAssertEqual(error, BiometricError.notAvailable)
                        expectation.fulfill()
                    }
                },
                receiveValue: { _ in
                    XCTFail("Biometric login should fail when unavailable")
                }
            )
            .store(in: &cancellables)
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    // MARK: - Registration Tests
    
    func testRegistrationSuccess() {
        // Given
        let expectation = XCTestExpectation(description: "Registration success")
        let email = "test@example.com"
        let password = "Test123!@#"
        let firstName = "Test"
        let lastName = "User"
        let expectedUser = User(id: UUID(), email: email, firstName: firstName, lastName: lastName)
        mockAuthRepository.registerResult = .success(expectedUser)
        
        // When
        sut.register(email: email, password: password, firstName: firstName, lastName: lastName)
            .sink(
                receiveCompletion: { completion in
                    if case .failure = completion {
                        XCTFail("Registration should succeed")
                    }
                },
                receiveValue: { user in
                    // Then
                    XCTAssertEqual(user.email, expectedUser.email)
                    XCTAssertEqual(user.firstName, expectedUser.firstName)
                    XCTAssertEqual(user.lastName, expectedUser.lastName)
                    expectation.fulfill()
                }
            )
            .store(in: &cancellables)
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testRegistrationWithInvalidData() {
        // Given
        let expectation = XCTestExpectation(description: "Registration failure")
        let invalidEmail = "invalid-email"
        let weakPassword = "weak"
        let shortName = "A"
        
        // When
        sut.register(email: invalidEmail, password: weakPassword, firstName: shortName, lastName: "User")
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error as ValidationError) = completion {
                        // Then
                        XCTAssertEqual(error, ValidationError.invalidEmail)
                        expectation.fulfill()
                    }
                },
                receiveValue: { _ in
                    XCTFail("Registration should fail with invalid data")
                }
            )
            .store(in: &cancellables)
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    // MARK: - Logout Tests
    
    func testLogoutSuccess() {
        // Given
        let expectation = XCTestExpectation(description: "Logout success")
        mockAuthRepository.logoutResult = .success(())
        
        // When
        sut.logout()
            .sink(
                receiveCompletion: { completion in
                    if case .failure = completion {
                        XCTFail("Logout should succeed")
                    }
                },
                receiveValue: {
                    // Then
                    XCTAssertTrue(self.mockBiometricUtils.invalidateCalled)
                    expectation.fulfill()
                }
            )
            .store(in: &cancellables)
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    // MARK: - Token Refresh Tests
    
    func testTokenRefreshSuccess() {
        // Given
        let expectation = XCTestExpectation(description: "Token refresh success")
        mockAuthRepository.refreshTokenResult = .success(())
        
        // When
        sut.refreshSession()
            .sink(
                receiveCompletion: { completion in
                    if case .failure = completion {
                        XCTFail("Token refresh should succeed")
                    }
                },
                receiveValue: {
                    // Then
                    XCTAssertTrue(self.mockAuthRepository.refreshTokenCalled)
                    expectation.fulfill()
                }
            )
            .store(in: &cancellables)
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testTokenRefreshFailure() {
        // Given
        let expectation = XCTestExpectation(description: "Token refresh failure")
        mockAuthRepository.refreshTokenResult = .failure(AuthError.refreshTokenExpired)
        
        // When
        sut.refreshSession()
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error as AuthError) = completion {
                        // Then
                        XCTAssertEqual(error, AuthError.refreshTokenExpired)
                        expectation.fulfill()
                    }
                },
                receiveValue: {
                    XCTFail("Token refresh should fail with expired token")
                }
            )
            .store(in: &cancellables)
        
        wait(for: [expectation], timeout: 1.0)
    }
}

// MARK: - Mock Objects

private class MockAuthRepository: AuthRepository {
    var loginResult: Result<User, Error>?
    var biometricLoginResult: Result<User, Error>?
    var registerResult: Result<User, Error>?
    var logoutResult: Result<Void, Error>?
    var refreshTokenResult: Result<Void, Error>?
    var refreshTokenCalled = false
    
    override func login(email: String, password: String) -> AnyPublisher<User, Error> {
        return loginResult?.publisher.eraseToAnyPublisher() ??
            Fail(error: RepositoryError.invalidData).eraseToAnyPublisher()
    }
    
    override func loginWithBiometric() -> AnyPublisher<User, Error> {
        return biometricLoginResult?.publisher.eraseToAnyPublisher() ??
            Fail(error: RepositoryError.invalidData).eraseToAnyPublisher()
    }
    
    override func register(email: String, password: String, firstName: String, lastName: String) -> AnyPublisher<User, Error> {
        return registerResult?.publisher.eraseToAnyPublisher() ??
            Fail(error: RepositoryError.invalidData).eraseToAnyPublisher()
    }
    
    override func logout() -> AnyPublisher<Void, Error> {
        return logoutResult?.publisher.eraseToAnyPublisher() ??
            Fail(error: RepositoryError.invalidData).eraseToAnyPublisher()
    }
    
    override func refreshToken() -> AnyPublisher<Void, Error> {
        refreshTokenCalled = true
        return refreshTokenResult?.publisher.eraseToAnyPublisher() ??
            Fail(error: RepositoryError.invalidData).eraseToAnyPublisher()
    }
}

private class MockBiometricUtils: BiometricUtils {
    var isAvailable = false
    var authenticationResult: Result<Bool, Error> = .success(false)
    var invalidateCalled = false
    
    override func isBiometricAvailable() -> Bool {
        return isAvailable
    }
    
    override func authenticateUser(reason: String) -> Result<Bool, Error> {
        return authenticationResult
    }
    
    override func invalidateAuthentication() {
        invalidateCalled = true
    }
}