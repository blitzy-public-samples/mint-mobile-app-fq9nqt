// Foundation version: iOS 14.0+
import Foundation

// MARK: - Human Tasks
/*
1. Configure API Gateway credentials in environment configuration
2. Set up proper SSL certificate pinning for production
3. Configure request timeout values for different environments
4. Set up proper authentication token storage mechanism
*/

/// Enumeration of supported HTTP methods for API requests
@frozen public enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
    case patch = "PATCH"
}

/// Generic structure for constructing and executing type-safe API requests
/// Addresses requirements:
/// - RESTful Backend API: Implements type-safe request handling for RESTful backend API service
/// - API Gateway Integration: Handles request construction and execution for AWS API Gateway
/// - Security Architecture: Implements secure request handling with proper authentication
public struct APIRequest<T: Codable> {
    // MARK: - Properties
    private let endpoint: String
    private let method: HTTPMethod
    private let body: Codable?
    private var headers: [String: String]
    private let timeout: TimeInterval
    
    // Default timeout interval (30 seconds)
    private static let defaultTimeout: TimeInterval = 30.0
    
    // MARK: - Initialization
    /// Initializes a new API request with the given parameters
    /// - Parameters:
    ///   - endpoint: The API endpoint path
    ///   - method: HTTP method for the request
    ///   - body: Optional request body data
    ///   - headers: Custom headers for the request
    ///   - timeout: Request timeout interval
    public init(
        endpoint: String,
        method: HTTPMethod = .get,
        body: Codable? = nil,
        headers: [String: String] = [:],
        timeout: TimeInterval = APIRequest.defaultTimeout
    ) {
        self.endpoint = endpoint
        self.method = method
        self.body = body
        self.headers = headers
        self.timeout = min(max(timeout, 5.0), 120.0) // Limit timeout between 5s and 120s
    }
    
    // MARK: - Request Execution
    /// Executes the API request and returns a typed response
    /// - Returns: Result containing either decoded response or detailed error information
    @discardableResult
    public func execute() async -> Result<T, APIError> {
        // Build URLRequest with validation
        let requestResult = await buildURLRequest()
        
        guard case .success(let request) = requestResult else {
            if case .failure(let error) = requestResult {
                return .failure(error)
            }
            return .failure(.invalidURL("Failed to build request"))
        }
        
        do {
            // Execute request using URLSession
            let (data, response) = try await URLSession.shared.data(for: request)
            
            // Validate and decode response
            guard let httpResponse = response as? HTTPURLResponse else {
                return .failure(.invalidResponse(-1))
            }
            
            let result = APIResponse<T>.decode(data: data, response: httpResponse)
            switch result {
            case .success(let apiResponse):
                return .success(apiResponse.data)
            case .failure(let error):
                return .failure(error)
            }
        } catch {
            return .failure(APIError.handleNetworkError(error))
        }
    }
    
    // MARK: - Request Building
    /// Constructs URLRequest from API request parameters with comprehensive validation
    /// - Returns: Result containing either configured URLRequest or detailed error information
    private func buildURLRequest() async -> Result<URLRequest, APIError> {
        // Build complete URL using APIEndpoints
        let urlString = APIEndpoints().buildURL(endpoint: endpoint)
        guard let url = URL(string: urlString) else {
            return .failure(.invalidURL(urlString))
        }
        
        // Create and configure URLRequest
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.timeoutInterval = timeout
        
        // Add required headers
        var finalHeaders = [
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "MintReplicaLite-iOS/\(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")"
        ]
        
        // Merge custom headers
        headers.forEach { finalHeaders[$0.key] = $0.value }
        request.allHTTPHeaders = finalHeaders
        
        // Add body data if present
        if let body = body {
            do {
                let encoder = JSONEncoder()
                encoder.keyEncodingStrategy = .convertToSnakeCase
                encoder.dateEncodingStrategy = .iso8601
                request.httpBody = try encoder.encode(body)
            } catch {
                return .failure(.requestFailed(error))
            }
        }
        
        return .success(request)
    }
}

// MARK: - APIRequest Extensions
public extension APIRequest {
    /// Adds authentication headers to the request
    /// - Parameter token: Authentication token to include
    /// - Returns: Modified request with authentication headers
    func withAuthentication(token: String) -> APIRequest {
        var newHeaders = self.headers
        newHeaders["Authorization"] = "Bearer \(token)"
        newHeaders["X-API-Key"] = Bundle.main.object(forInfoDictionaryKey: "API_KEY") as? String ?? ""
        
        return APIRequest(
            endpoint: self.endpoint,
            method: self.method,
            body: self.body,
            headers: newHeaders,
            timeout: self.timeout
        )
    }
    
    /// Adds custom headers to the request
    /// - Parameter headers: Additional headers to include
    /// - Returns: Modified request with custom headers
    func withCustomHeaders(_ headers: [String: String]) -> APIRequest {
        var newHeaders = self.headers
        headers.forEach { newHeaders[$0.key] = $0.value }
        
        return APIRequest(
            endpoint: self.endpoint,
            method: self.method,
            body: self.body,
            headers: newHeaders,
            timeout: self.timeout
        )
    }
}

// MARK: - URLRequest Extension
private extension URLRequest {
    /// Setter for all HTTP headers to ensure proper header handling
    var allHTTPHeaders: [String: String] {
        get {
            return self.allHTTPHeaderFields ?? [:]
        }
        set {
            self.allHTTPHeaderFields = newValue
        }
    }
}