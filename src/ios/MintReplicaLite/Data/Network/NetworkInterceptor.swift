// Foundation version: iOS 14.0+
import Foundation
import Combine

// MARK: - Human Tasks
/*
1. Verify minimum iOS version requirement (14.0+) in deployment settings
2. Configure token refresh endpoint in APIEndpoints configuration
3. Test token refresh behavior with expired tokens
4. Verify request timeout intervals match server capabilities
5. Test network interceptor behavior under different network conditions
*/

/// URLSession request interceptor that handles authentication, network connectivity, and request/response processing
/// with proper error handling and token refresh capabilities
@available(iOS 14.0, *)
final class NetworkInterceptor {
    // MARK: - Properties
    
    /// URLSession configuration for request handling
    private let configuration: URLSessionConfiguration
    
    /// Concurrent queue for thread-safe operations
    private let queue: DispatchQueue
    
    /// Token refresh state publisher
    private let isRefreshingToken: CurrentValueSubject<Bool, Never>
    
    /// Default request timeout interval
    private let defaultTimeout: TimeInterval = 30.0
    
    // MARK: - Constants
    private enum Constants {
        static let authorizationHeader = "Authorization"
        static let bearerPrefix = "Bearer "
        static let contentTypeHeader = "Content-Type"
        static let acceptHeader = "Accept"
        static let jsonContentType = "application/json"
        static let tokenKey = "accessToken"
        static let refreshTokenKey = "refreshToken"
    }
    
    // MARK: - Initialization
    
    /// Initializes the network interceptor with custom configuration
    /// - Parameter configuration: URLSession configuration for request handling
    init(configuration: URLSessionConfiguration = .default) {
        self.configuration = configuration
        self.queue = DispatchQueue(label: "com.mintreplicalite.networkinterceptor",
                                 qos: .userInitiated,
                                 attributes: .concurrent)
        self.isRefreshingToken = CurrentValueSubject<Bool, Never>(false)
        
        // Configure default timeouts
        self.configuration.timeoutIntervalForRequest = defaultTimeout
        self.configuration.timeoutIntervalForResource = defaultTimeout * 2
    }
    
    // MARK: - Public Methods
    
    /// Intercepts and modifies outgoing network requests with proper authentication
    /// - Parameter request: Original URLRequest to be modified
    /// - Returns: Modified request with authentication headers and common configurations
    func interceptRequest(_ request: URLRequest) async throws -> URLRequest {
        // Check network connectivity
        guard NetworkMonitor.shared.isConnected else {
            throw APIError.networkConnectivity
        }
        
        var modifiedRequest = request
        
        // Add common headers
        modifiedRequest.setValue(Constants.jsonContentType, forHTTPHeaderField: Constants.contentTypeHeader)
        modifiedRequest.setValue(Constants.jsonContentType, forHTTPHeaderField: Constants.acceptHeader)
        
        // Configure timeouts
        modifiedRequest.timeoutInterval = defaultTimeout
        
        // Retrieve and add authentication token if available
        if let tokenData = try await queue.sync(execute: {
            KeychainManager.shared.retrieve(key: Constants.tokenKey).get()
        }), let token = String(data: tokenData, encoding: .utf8) {
            modifiedRequest.setValue("\(Constants.bearerPrefix)\(token)",
                                  forHTTPHeaderField: Constants.authorizationHeader)
        }
        
        return modifiedRequest
    }
    
    /// Processes network responses with comprehensive error handling
    /// - Parameters:
    ///   - response: URLResponse from the network request
    ///   - data: Optional response data
    /// - Returns: Processed response data or detailed error
    func handleResponse(_ response: URLResponse, data: Data?) async throws -> Result<Data, APIError> {
        guard let httpResponse = response as? HTTPURLResponse else {
            return .failure(.invalidResponse(-1))
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            guard let responseData = data else {
                return .failure(.noData)
            }
            return .success(responseData)
            
        case 401:
            // Handle unauthorized error with token refresh
            if !isRefreshingToken.value {
                let refreshResult = try await refreshToken()
                switch refreshResult {
                case .success:
                    return .failure(.unauthorized) // Retry with new token
                case .failure(let error):
                    return .failure(error)
                }
            }
            return .failure(.unauthorized)
            
        case 400...499:
            return .failure(.invalidResponse(httpResponse.statusCode))
            
        case 500...599:
            return .failure(.serverError("Server error occurred"))
            
        default:
            return .failure(.invalidResponse(httpResponse.statusCode))
        }
    }
    
    // MARK: - Private Methods
    
    /// Attempts to refresh an expired authentication token
    /// - Returns: New token or detailed error information
    private func refreshToken() async throws -> Result<String, APIError> {
        isRefreshingToken.send(true)
        
        defer {
            isRefreshingToken.send(false)
        }
        
        // Retrieve refresh token from keychain
        guard let refreshTokenData = try await queue.sync(execute: {
            KeychainManager.shared.retrieve(key: Constants.refreshTokenKey).get()
        }), let refreshToken = String(data: refreshTokenData, encoding: .utf8) else {
            return .failure(.unauthorized)
        }
        
        // Create token refresh request
        var refreshRequest = URLRequest(url: URL(string: "auth/refresh")!) // URL should be configured in APIEndpoints
        refreshRequest.httpMethod = "POST"
        refreshRequest.setValue(Constants.jsonContentType, forHTTPHeaderField: Constants.contentTypeHeader)
        refreshRequest.setValue("\(Constants.bearerPrefix)\(refreshToken)",
                              forHTTPHeaderField: Constants.authorizationHeader)
        
        // Perform token refresh request
        do {
            let (data, response) = try await URLSession.shared.data(for: refreshRequest)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                return .failure(.invalidResponse(-1))
            }
            
            guard httpResponse.statusCode == 200, let responseData = try? JSONDecoder().decode(TokenResponse.self, from: data) else {
                return .failure(.unauthorized)
            }
            
            // Store new tokens in keychain
            try await queue.sync {
                _ = KeychainManager.shared.save(data: responseData.accessToken.data(using: .utf8)!,
                                              key: Constants.tokenKey)
                _ = KeychainManager.shared.save(data: responseData.refreshToken.data(using: .utf8)!,
                                              key: Constants.refreshTokenKey)
            }
            
            return .success(responseData.accessToken)
        } catch {
            return .failure(APIError.handleNetworkError(error))
        }
    }
}

// MARK: - Supporting Types

private struct TokenResponse: Codable {
    let accessToken: String
    let refreshToken: String
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
    }
}

// MARK: - Requirements Implementation Comments
/*
 Requirement: API Gateway Integration (5.2.2 API Gateway/Request routing and load balancing)
 Implementation: Handles request routing and authentication token management with proper error handling
 
 Requirement: Security Architecture (5.4 Security Architecture/Application Security Layer)
 Implementation: Implements secure token handling and request authentication with proper encryption
 
 Requirement: Mobile Applications (5.2.1 Mobile Applications/Native iOS application using Swift)
 Implementation: Provides native network request interception and modification for iOS platform
*/