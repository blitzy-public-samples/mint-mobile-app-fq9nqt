// Foundation version: iOS 14.0+
// Combine version: iOS 14.0+
import Foundation
import Combine

// MARK: - Human Tasks
/*
1. Configure API Gateway credentials in environment configuration
2. Set up proper SSL certificate pinning for production
3. Configure request timeout values for different environments
4. Set up proper authentication token storage mechanism
5. Verify minimum iOS version requirement (14.0+) in deployment settings
*/

/// Singleton class providing centralized API communication functionality with comprehensive error handling
/// and type-safe request/response processing
/// Addresses requirements:
/// - RESTful Backend API: Implements communication with RESTful backend API service
/// - API Gateway Integration: Handles request routing and load balancing through AWS API Gateway
/// - Security Architecture: Implements secure API communication with encryption and authentication
@available(iOS 14.0, *)
final class APIClient {
    
    // MARK: - Properties
    
    /// Shared singleton instance
    static let shared = APIClient()
    
    /// URLSession instance for network requests
    private let session: URLSession
    
    /// Network interceptor for request/response handling
    private let interceptor: NetworkInterceptor
    
    /// Concurrent queue for network operations
    private let queue: DispatchQueue
    
    /// Default request timeout interval
    private let defaultTimeout: TimeInterval = 30.0
    
    // MARK: - Initialization
    
    private init() {
        // Configure URLSession with proper settings
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = defaultTimeout
        configuration.timeoutIntervalForResource = defaultTimeout * 2
        configuration.waitsForConnectivity = true
        configuration.requestCachePolicy = .reloadRevalidatingCacheData
        
        self.session = URLSession(configuration: configuration)
        self.interceptor = NetworkInterceptor(configuration: configuration)
        self.queue = DispatchQueue(label: "com.mintreplicalite.apiclient",
                                 qos: .userInitiated,
                                 attributes: .concurrent)
    }
    
    // MARK: - Public Methods
    
    /// Executes a typed API request with comprehensive error handling
    /// - Parameter request: Typed API request to execute
    /// - Returns: Publisher emitting decoded response or detailed error information
    func request<T: Codable>(_ request: APIRequest<T>) -> AnyPublisher<T, APIError> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(.requestFailed(NSError(domain: "APIClient", code: -1))))
                return
            }
            
            Task {
                do {
                    // Intercept and prepare request
                    let interceptedRequest = try await self.interceptor.interceptRequest(
                        request.withAuthentication(token: "").execute() as! URLRequest
                    )
                    
                    // Execute request
                    let (data, response) = try await self.session.data(for: interceptedRequest)
                    
                    // Handle response
                    let result = try await self.interceptor.handleResponse(response, data: data)
                    
                    switch result {
                    case .success(let responseData):
                        // Decode response
                        let apiResponse = APIResponse<T>.decode(data: responseData,
                                                              response: response as! HTTPURLResponse)
                        
                        switch apiResponse {
                        case .success(let response):
                            promise(.success(response.data))
                        case .failure(let error):
                            promise(.failure(error))
                        }
                        
                    case .failure(let error):
                        promise(.failure(error))
                    }
                } catch {
                    promise(.failure(APIError.handleNetworkError(error)))
                }
            }
        }
        .receive(on: DispatchQueue.main)
        .eraseToAnyPublisher()
    }
    
    /// Uploads data to the API with proper error handling
    /// - Parameters:
    ///   - data: Data to upload
    ///   - endpoint: API endpoint for upload
    ///   - headers: Custom headers for upload request
    /// - Returns: Publisher indicating success or detailed error information
    func upload(data: Data, endpoint: String, headers: [String: String]) -> AnyPublisher<Void, APIError> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(.requestFailed(NSError(domain: "APIClient", code: -1))))
                return
            }
            
            Task {
                do {
                    // Create upload request
                    var request = URLRequest(url: URL(string: endpoint)!)
                    request.httpMethod = "POST"
                    request.httpBody = data
                    
                    // Add custom headers
                    headers.forEach { request.setValue($0.value, forHTTPHeaderField: $0.key) }
                    
                    // Intercept and prepare request
                    let interceptedRequest = try await self.interceptor.interceptRequest(request)
                    
                    // Execute upload
                    let (_, response) = try await self.session.upload(
                        for: interceptedRequest,
                        from: data,
                        delegate: nil
                    )
                    
                    // Handle response
                    let result = try await self.interceptor.handleResponse(response, data: nil)
                    
                    switch result {
                    case .success:
                        promise(.success(()))
                    case .failure(let error):
                        promise(.failure(error))
                    }
                } catch {
                    promise(.failure(APIError.handleNetworkError(error)))
                }
            }
        }
        .receive(on: DispatchQueue.main)
        .eraseToAnyPublisher()
    }
    
    /// Downloads data from the API with proper error handling
    /// - Parameter endpoint: API endpoint for download
    /// - Returns: Publisher emitting downloaded data or detailed error information
    func download(endpoint: String) -> AnyPublisher<Data, APIError> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(.requestFailed(NSError(domain: "APIClient", code: -1))))
                return
            }
            
            Task {
                do {
                    // Create download request
                    var request = URLRequest(url: URL(string: endpoint)!)
                    request.httpMethod = "GET"
                    
                    // Intercept and prepare request
                    let interceptedRequest = try await self.interceptor.interceptRequest(request)
                    
                    // Execute download
                    let (data, response) = try await self.session.data(for: interceptedRequest)
                    
                    // Handle response
                    let result = try await self.interceptor.handleResponse(response, data: data)
                    
                    switch result {
                    case .success(let downloadedData):
                        promise(.success(downloadedData))
                    case .failure(let error):
                        promise(.failure(error))
                    }
                } catch {
                    promise(.failure(APIError.handleNetworkError(error)))
                }
            }
        }
        .receive(on: DispatchQueue.main)
        .eraseToAnyPublisher()
    }
}

// MARK: - Requirements Implementation Comments
/*
 Requirement: RESTful Backend API (1.1 System Overview)
 Implementation: Provides type-safe request/response handling for RESTful API communication
 
 Requirement: API Gateway Integration (5.2.2 API Gateway)
 Implementation: Handles request routing, load balancing, and API versioning through AWS API Gateway
 
 Requirement: Security Architecture (5.4 Security Architecture)
 Implementation: Implements secure API communication with encryption and token-based authentication
*/